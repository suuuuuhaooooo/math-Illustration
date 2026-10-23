/* 列印練習卷的「自訂大題」：每個大題可設定題型、題目類別、題數、每題配分、選答題數、難易度比例，
   可以上移／下移調整順序，也可以從題庫指定題目（挑題）。只負責畫面與整理設定；出題在伺服器（/api/print?plan=…）。
   寫入資料庫的次數不變：整份卷只寫一筆列印紀錄；挑題只讀、不寫。 */
(function () {
  "use strict";
  var TY = [["any", "不限（混合）"], ["choice", "選擇題"], ["tf", "是非題"], ["num", "填充題（數字）"], ["text", "填充題（文字）"], ["multi", "勾選題（可複選）"], ["match", "連連看"], ["group", "題組"]];
  var KD = [["", "不限"], ["計算題", "計算題"], ["應用題", "應用題"], ["情境題", "情境題"], ["圖表題", "圖表題"], ["概念題", "概念題"]];
  var TYN = {}; TY.forEach(function (x) { TYN[x[0]] = x[1]; });
  var PRESETS = [
    ["段考型（共 100 分）", [{ ty: "tf", n: 5, pts: 2 }, { ty: "choice", n: 10, pts: 3 }, { ty: "num", n: 8, pts: 4 }, { ty: "any", kd: "應用題", n: 4, pts: 7 }]],
    ["小考型（共 50 分）", [{ ty: "tf", n: 5, pts: 2 }, { ty: "choice", n: 10, pts: 2 }, { ty: "num", n: 5, pts: 4 }]],
    ["低年級型（共 100 分）", [{ ty: "tf", n: 5, pts: 4 }, { ty: "choice", n: 10, pts: 4 }, { ty: "num", n: 10, pts: 4 }]],
    ["難易度分層（易中難 3:5:2）", [{ ty: "any", n: 10, pts: 10, lv: [3, 5, 2] }]]
  ];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function h(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstChild; }
  function opt(list, cur, off) { return list.map(function (x) { var d = off && off.indexOf(x[0]) >= 0; return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(cur) ? " selected" : "") + (d ? " disabled" : "") + ">" + esc(x[1]) + (d ? "（線上題庫沒有）" : "") + "</option>"; }).join(""); }
  var ONLY_PAPER = ["multi", "match"]; /* 只有紙本題庫才有的題型 */
  var TYW = { tf: 2, choice: 3, num: 4, text: 4, multi: 4, match: 5, group: 6, any: 5 }, KDW = { "應用題": 1.8, "情境題": 1.5, "圖表題": 1.3 }; /* 智慧配分：越花時間的題型、題目類別，每題分數越高 */
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }

  /* env：{ role, api(method,url), tx(html), title(unitId), units() → 目前勾選的單元 }，onchange：設定改了就通知 */
  function editor(env, onchange) {
    function say(m) { if (env.say) env.say(m); else window.alert(m); }
    var cap = env.admin ? 200 : env.role === "student" ? 30 : 50, maxSec = env.admin ? 20 : env.role === "student" ? 4 : 8;
    var secs = [], uw = {}, mode = "auto", el = h('<div class="pplan"></div>'), isOn = function () { return !!(env.online && env.online()); };
    var fullV = 100;
    function blank(o) { return Object.assign({ ty: "choice", kd: "", n: 5, pts: 2, take: 0, lv: ["", "", ""], title: "", ids: [], idq: {} }, o || {}); }
    function count(s) { return Math.max(+s.n || 0, s.ids.length); }
    function answered(s) { var c = count(s); return s.take > 0 && s.take < c ? s.take : c; }
    function total() { var n = 0, p = 0; secs.forEach(function (s) { n += count(s); p += (+s.pts || 0) * answered(s); }); return { n: n, p: p }; }

    function sumLine() {
      var t = total(), s = el.querySelector(".psum"); if (!s) return;
      s.innerHTML = "共 <b>" + t.n + "</b> 題・總分 <b>" + (Math.round(t.p * 10) / 10) + "</b> 分" + (t.n > cap ? '<span class="pwarn">　題數超過上限 ' + cap + ' 題</span>' : "");
    }
    function changed() { sumLine(); if (onchange) onchange(); }

    function card(s, i) {
      var c = h('<div class="pcs"><div class="pcs-h"><b>大題 ' + (i + 1) + '</b><input class="pcs-t" maxlength="20" placeholder="名稱（可留白，自動用題型）"><span class="pcs-b"><button type="button" class="pen" data-a="up">上移</button><button type="button" class="pen" data-a="dn">下移</button><button type="button" class="pen" data-a="rm">刪除</button></span></div>' +
        '<div class="pcs-g"><label>題型<select data-k="ty">' + opt(TY, s.ty, isOn() ? ONLY_PAPER : null) + '</select></label><label>題目類別<select data-k="kd">' + opt(KD, s.kd) + '</select></label>' +
        '<label>題數<input data-k="n" type="number" min="0" max="40" step="1" value="' + esc(mode === "manual" ? s.ids.length : s.n) + '"' + (mode === "manual" ? ' disabled title="手動出題的題數＝你挑的題數"' : "") + '></label><label>每題配分<input data-k="pts" type="number" min="0" max="100" step="0.5" value="' + esc(s.pts) + '"></label>' +
        '<label>選答題數<input data-k="take" type="number" min="0" max="40" step="1" value="' + esc(s.take) + '" title="0＝全部作答；例如共 8 題、填 6＝任選 6 題作答"></label></div>' +
        '<div class="pcs-lv"><span>難易度比例</span><label>易<input data-lv="0" type="number" min="0" max="20" step="1" value="' + esc(s.lv[0]) + '"></label><label>中<input data-lv="1" type="number" min="0" max="20" step="1" value="' + esc(s.lv[1]) + '"></label><label>難<input data-lv="2" type="number" min="0" max="20" step="1" value="' + esc(s.lv[2]) + '"></label><small>全部留空＝不限</small></div>' +
        '<div class="pcs-p"><button type="button" class="pen" data-a="pick">挑題…</button><span class="pcs-n"></span></div></div>');
      c.querySelector(".pcs-t").value = s.title;
      function note() {
        var n = c.querySelector(".pcs-n"); n.innerHTML = "";
        if (s.ids.length) { n.appendChild(h('<span class="meta">已指定 ' + s.ids.length + " 題：</span>")); s.ids.forEach(function (id) { var b = h('<button type="button" class="chip" title="移除這題"></button>'); b.textContent = id + " ×"; b.onclick = function () { s.ids = s.ids.filter(function (x) { return x !== id; }); note(); changed(); }; n.appendChild(b); }); }
        else n.appendChild(h('<span class="meta">沒有指定題目，會依上面的條件自動挑。</span>'));
        var g = s.ty === "group"; c.querySelector('[data-k="kd"]').disabled = g; Array.prototype.forEach.call(c.querySelectorAll("[data-lv]"), function (x) { x.disabled = g; });
      }
      note();
      c.addEventListener("input", function (e) { var t = e.target; if (t.classList.contains("pcs-t")) s.title = t.value; else if (t.dataset.lv !== undefined) s.lv[+t.dataset.lv] = t.value; else if (t.dataset.k && t.tagName === "INPUT") { s[t.dataset.k] = t.value; changed(); } else return; if (t.classList.contains("pcs-t") || t.dataset.lv !== undefined) changed(); });
      c.addEventListener("change", function (e) { var t = e.target; if (t.tagName === "SELECT" && t.dataset.k) { s[t.dataset.k] = t.value; note(); changed(); } });
      c.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-a]"); if (!b) return; var a = b.dataset.a;
        if (a === "rm") secs.splice(i, 1); else if (a === "up" && i > 0) { var t = secs[i]; secs[i] = secs[i - 1]; secs[i - 1] = t; } else if (a === "dn" && i < secs.length - 1) { var t2 = secs[i]; secs[i] = secs[i + 1]; secs[i + 1] = t2; }
        else if (a === "pick") { openPick(s, function () { note(); changed(); }); return; } else return;
        draw(); changed();
      });
      return c;
    }

    function weights() {
      var box = el.querySelector(".pw"); if (!box) return; var us = env.units();
      box.innerHTML = "";
      if (us.length < 2) { box.appendChild(h('<p class="meta">想調整各單元的比例，先在上面「自選單元」勾選兩個以上的單元。</p>')); return; }
      var g = h('<div class="pw-g"></div>');
      us.forEach(function (u) { var l = h("<label><span></span><input type=\"number\" min=\"1\" max=\"10\" step=\"1\"></label>"); l.firstChild.textContent = env.title(u); var i = l.querySelector("input"); i.value = uw[u] || 1; i.oninput = function () { uw[u] = Math.max(1, Math.min(10, Math.floor(+i.value) || 1)); changed(); }; g.appendChild(l); });
      box.appendChild(g);
    }

    function draw() {
      el.innerHTML = '<div class="ppl-top">' + (mode === "manual" ? '<span class="meta">手動出題：每個大題按「挑題…」自己指定題目；題數就是你挑的題數。</span>' : '<label>套用範本<select class="ppre"><option value="">選一個範本…</option>' + PRESETS.map(function (p, i) { return '<option value="' + i + '">' + esc(p[0]) + "</option>"; }).join("") + '</select></label>') + '<button type="button" class="pen" data-a="add">新增大題</button></div><div class="pcs-list"></div>' +
        '<div class="ppl-sum"><span class="psum"></span><span class="pauto"><label>滿分<input class="pfull" type="number" min="1" max="500" step="1" value="' + fullV + '"></label><button type="button" class="pen go" data-a="smart" title="依題型與題目類別的難度自動分配，總分剛好等於滿分">智慧配分</button><button type="button" class="pen" data-a="auto">平均配分</button></span></div>' +
        '<details class="ppw"><summary>各單元的比例（可選）</summary><div class="pw"></div></details><p class="meta">題目不夠時，系統會用其他條件相近的題補，並告訴你哪一個大題缺幾題。每份卷只會記錄一筆列印紀錄。</p>';
      var list = el.querySelector(".pcs-list"); secs.forEach(function (s, i) { list.appendChild(card(s, i)); });
      if (!secs.length) list.appendChild(h('<p class="meta">還沒有大題，按「新增大題」，或先套用一個範本。</p>'));
      weights(); sumLine();
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]"); if (!b || e.target.closest(".pcs")) return;
      if (b.dataset.a === "add") { if (secs.length >= maxSec) return say("最多 " + maxSec + " 個大題"); secs.push(blank()); draw(); changed(); }
      if (b.dataset.a === "smart") {
        var full0 = Math.max(1, num(el.querySelector(".pfull").value, 100)); fullV = full0;
        var W = secs.map(function (s) { return (TYW[s.ty] || 4) * (KDW[s.kd] || 1); }), den = secs.reduce(function (a, s, i) { return a + W[i] * answered(s); }, 0);
        if (!den) return say("請先設定各大題的題數，再按智慧配分。");
        var unit = full0 / den, T = Math.round(full0 * 2), ideal = W.map(function (w) { return w * unit; });
        /* 每個大題的每題分數取 0.5 的倍數，在「總分剛好等於滿分」的條件下，找出離理想比例最近的一組（小型動態規劃） */
        var cand = secs.map(function (sc, i) { var n = answered(sc), base = Math.floor(ideal[i] * 2) / 2, out = []; if (!n) return [{ p: sc.pts, c: 0, w: 0 }]; for (var k = -8; k <= 8; k++) { var p = base + k * 0.5; if (p < 0.5) continue; out.push({ p: p, c: Math.pow((p - ideal[i]) / ideal[i], 2), w: Math.round(p * 2 * n) }); } return out; });
        var st = [{ 0: { c: 0, ch: [] } }];
        cand.forEach(function (cs, i) { var nx = {}; Object.keys(st[i]).forEach(function (r) { cs.forEach(function (x) { var t = +r + x.w; if (t > T) return; var c = st[i][r].c + x.c; if (!nx[t] || c < nx[t].c) nx[t] = { c: c, ch: st[i][r].ch.concat(x.p) }; }); }); st.push(nx); });
        var hit = st[secs.length][T];
        if (hit) hit.ch.forEach(function (p, i) { secs[i].pts = p; });
        else { secs.forEach(function (sc, i) { sc.pts = Math.max(0.5, Math.floor(ideal[i] * 2) / 2); }); }
        draw(); changed(); var tt = total(); if (Math.abs(tt.p - full0) > 0.01) say("已依題型配分，總分是 " + (Math.round(tt.p * 10) / 10) + " 分（題數組合無法剛好湊到 " + full0 + " 分，可以微調個別大題的配分）。");
        return;
      }
      if (b.dataset.a === "auto") {
        var full = Math.max(1, num(el.querySelector(".pfull").value, 100)); fullV = full; var cnt = secs.reduce(function (a, s) { return a + answered(s); }, 0); if (!cnt) return;
        var each = Math.floor(full / cnt * 2) / 2; secs.forEach(function (s) { s.pts = each; });
        var left = full - each * cnt; for (var k = secs.length - 1, guard = 0; k >= 0 && left > 0 && guard < 400; guard++) { var step = 0.5 * answered(secs[k]); if (step > 0 && step <= left + 1e-9) { secs[k].pts += 0.5; left -= step; } else k--; }
        draw(); changed();
      }
    });
    el.addEventListener("change", function (e) {
      if (e.target.classList.contains("ppre") && e.target.value !== "") { var p = PRESETS[+e.target.value][1]; secs = p.map(function (x) { return blank({ ty: x.ty, kd: x.kd || "", n: x.n, pts: x.pts, lv: x.lv ? x.lv.map(String) : ["", "", ""] }); }); draw(); changed(); }
    });

    /* ---- 挑題視窗：依單元／題型／類別／難度／關鍵字列出題目，勾選後加入這個大題 ---- */
    function openPick(s, done) {
      var us = env.units();
      if (!us.length) { say("請先在上面「自選單元」勾選要挑題的單元（最多 30 個）。"); return; }
      var st = { ty: s.ty === "any" || s.ty === "group" ? "" : s.ty, kd: s.kd, lv: "", kw: "", page: 0, total: 0 }, ov = h('<div class="pkov" role="dialog" aria-modal="true"><div class="pkbox"><h3>挑題</h3><div class="pk-f"></div><div class="pk-l">載入中…</div><div class="pk-p"></div><div class="pk-b"></div></div></div>');
      var f = ov.querySelector(".pk-f"), l = ov.querySelector(".pk-l"), pg = ov.querySelector(".pk-p"), bt = ov.querySelector(".pk-b");
      f.innerHTML = '<label>題型<select data-f="ty">' + opt([["", "全部"]].concat(TY.filter(function (x) { return x[0] !== "any" && x[0] !== "group"; })).map(function (x) { return [x[0], x[1].replace(/（.*）/, "")]; }), st.ty) + '</select></label><label>類別<select data-f="kd">' + opt(KD, st.kd) + '</select></label><label>難度<select data-f="lv">' + opt([["", "全部"], ["1", "易"], ["2", "中"], ["3", "難"]], st.lv) + '</select></label><label>關鍵字或題目ID<input data-f="kw" maxlength="30"></label><button type="button" class="pen" data-a="go">搜尋</button>';
      var picked = s.ids.slice(), pq = Object.assign({}, s.idq), room = Math.max(0, cap - (total().n - s.ids.length));
      function foot() { bt.innerHTML = '<span class="meta">已選 <b>' + picked.length + '</b> 題（這份卷最多再放 ' + room + ' 題；題組會整組一起放入）</span><button type="button" class="pen go" data-a="ok">加入這個大題</button><button type="button" class="pen" data-a="cancel">取消</button>'; }
      function load() {
        l.textContent = "載入中…"; pg.innerHTML = "";
        var q = "units=" + encodeURIComponent(us.slice(0, 30).join(",")) + "&page=" + st.page + (st.ty ? "&ty=" + st.ty : "") + (st.kd ? "&kd=" + encodeURIComponent(st.kd) : "") + (st.lv ? "&lv=" + st.lv : "") + (st.kw ? "&kw=" + encodeURIComponent(st.kw) : "");
        env.api("GET", "/api/print/pool?" + q).then(function (r) {
          st.total = r.total; l.innerHTML = "";
          if (!r.rows.length) { l.textContent = "沒有符合的題目。"; }
          r.rows.forEach(function (x) {
            var row = h('<label class="pk-r"><input type="checkbox"><span class="pk-m"></span><span class="pk-q"></span></label>'), cb = row.querySelector("input");
            cb.checked = picked.indexOf(x.id) >= 0; row.querySelector(".pk-m").textContent = "ID " + x.id + "｜" + (env.title(x.unit).split(" ").slice(-1)[0] || x.unit) + "｜" + ({ 1: "易", 2: "中", 3: "難" })[x.lv] + "｜" + x.kd + (x.inf ? "（推測）" : "") + "｜" + ({ num: "填數字", choice: "選擇", text: "填文字", tf: "是非", multi: "勾選", match: "連連看" })[x.ty] + (x.g ? "｜題組" : "") + (x.img ? "｜有圖" : "");
            row.querySelector(".pk-q").innerHTML = env.tx(esc(x.q));
            cb.onchange = function () { if (cb.checked) { if (picked.length >= room) { cb.checked = false; say("這份卷的題數已經到上限了。"); return; } picked.push(x.id); pq[x.id] = x.q; } else picked = picked.filter(function (i) { return i !== x.id; }); foot(); };
            l.appendChild(row);
          });
          var pages = Math.max(1, Math.ceil(r.total / 30)); pg.innerHTML = '<span class="meta">共 ' + r.total + " 題・第 " + (st.page + 1) + " / " + pages + ' 頁</span><button type="button" class="pen" data-a="prev"' + (st.page <= 0 ? " disabled" : "") + '>上一頁</button><button type="button" class="pen" data-a="next"' + (st.page + 1 >= pages ? " disabled" : "") + ">下一頁</button>";
        }, function (e) { l.textContent = e && e.code === "pool_limit" ? "查太頻繁了，請等幾分鐘再挑題。" : "載入失敗，請稍後再試。"; });
      }
      ov.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-a]"); if (e.target === ov) { ov.remove(); return; } if (!b) return; var a = b.dataset.a;
        if (a === "cancel") ov.remove();
        else if (a === "ok") { s.ids = picked; s.idq = pq; ov.remove(); done(); }
        else if (a === "go") { st.page = 0; load(); } else if (a === "prev") { st.page = Math.max(0, st.page - 1); load(); } else if (a === "next") { st.page++; load(); }
      });
      f.addEventListener("change", function (e) { var k = e.target.dataset.f; if (k && k !== "kw") { st[k] = e.target.value; st.page = 0; load(); } });
      f.addEventListener("input", function (e) { if (e.target.dataset.f === "kw") st.kw = e.target.value.trim(); });
      f.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.dataset.f === "kw") { e.preventDefault(); st.page = 0; load(); } });
      foot(); document.body.appendChild(ov); load();
    }

    secs = PRESETS[0][1].map(function (x) { return blank({ ty: x.ty, kd: x.kd || "", n: x.n, pts: x.pts }); });
    draw();
    el.refreshWeights = weights;
    return {
      el: el, refreshWeights: weights,
      /* 出題方式：auto＝電腦出題（範本＋條件自動挑）、manual＝手動出題（每個大題自己挑題）；換方式會重設大題 */
      setMode: function (m) { if (m === mode) return; mode = m; secs = m === "manual" ? [blank({ ty: "any", n: 0, pts: 2 })] : PRESETS[0][1].map(function (x) { return blank({ ty: x.ty, kd: x.kd || "", n: x.n, pts: x.pts }); }); draw(); changed(); },
      /* 範圍改成線上速測時，紙本才有的題型（勾選題、連連看）自動改成選擇題；回傳改了幾個大題 */
      syncScope: function () { var n = 0; if (isOn()) secs.forEach(function (s) { if (ONLY_PAPER.indexOf(s.ty) >= 0) { s.ty = "choice"; n++; } }); draw(); changed(); return n; },
      total: total,
      /* 整理成要送給伺服器的計畫；有錯回傳 {err} */
      get: function () {
        var out = [], t = total();
        if (!secs.length) return { err: "請至少設定一個大題。" };
        if (mode === "manual") { for (var mi = 0; mi < secs.length; mi++) if (!secs[mi].ids.length) return { err: "第 " + (mi + 1) + " 大題還沒有挑題。手動出題要在每個大題按「挑題…」指定題目，不要的大題請刪除。" }; }
        if (isOn()) { for (var oi2 = 0; oi2 < secs.length; oi2++) if (ONLY_PAPER.indexOf(secs[oi2].ty) >= 0) return { err: "第 " + (oi2 + 1) + " 大題是「" + TYN[secs[oi2].ty] + "」，線上速測的題庫沒有這種題型。請改題型，或回上一步改成紙本出卷。" }; }
        if (t.n > cap) return { err: "題數超過上限（最多 " + cap + " 題）。" };
        secs.forEach(function (s) {
          var lv = s.lv.map(function (v) { return Math.max(0, Math.floor(num(v, 0))); });
          out.push({ ty: s.ty, kd: s.ty === "group" ? "" : s.kd, n: Math.max(0, Math.floor(num(s.n, 0))), pts: num(s.pts, 0), take: Math.max(0, Math.floor(num(s.take, 0))), lv: s.ty !== "group" && lv.some(function (v) { return v > 0; }) ? lv : null, title: s.title, ids: s.ids });
        });
        if (!out.some(function (s) { return s.n > 0 || s.ids.length; })) return { err: "每個大題的題數都是 0。" };
        var w = {}; env.units().forEach(function (u) { if (uw[u] && uw[u] > 1) w[u] = uw[u]; });
        return { plan: { secs: out, uw: w } };
      }
    };
  }
  window.NB = window.NB || {}; NB.plan = { editor: editor };
})();
