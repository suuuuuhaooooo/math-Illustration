/* 無限出題頁：選單元 → 列印練習卷（A4 自動排版、題目卷／答案卷／簡答）或線上練習（當場批改）。
   全部在瀏覽器裡完成：不登入、不呼叫後端。設定與練習紀錄只存在這台裝置（localStorage）。 */
(function () {
  "use strict";
  var D = window.DR, app = document.getElementById("app"), root = NB.root;
  var SK = "nb-drill-set", RK = "nb-drill-rec", CN = "一二三四五六七八九十", ZH = "一二三四五六七八九十";
  var BY = {}; NB.flat.forEach(function (o) { BY[o.id] = o; });
  function h(s) { return NB.h(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function tx(s) { return NB.tx(String(s).replace(/\\frac\{/g, "\\dfrac{")); }
  function ld(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rseed() { return 100000 + Math.floor(Math.random() * 900000); }
  function secName(id) { var o = BY[id]; return o ? o.sem + " " + o.num + " " + o.title : id; }

  /* ---------- 狀態 ---------- */
  var DEF = { sel: [], lv: 2, grade: 0, title: "", count: "p1", cols: "auto", big: false, gap: "m", order: "unit", head: true, score: true, sol: true, view: "q", on: 10, otime: true };
  var S = Object.assign({}, DEF, ld(SK, {})), mode = "print", seed = rseed();
  if (!S.grade) { var g0 = 3; try { g0 = parseInt(localStorage.getItem("currentGrade")) || 3; } catch (e) {} S.grade = g0; }
  function readHash() {
    var m = /^#(print|online|log)(?:\?(.*))?$/.exec(location.hash || ""); if (!m) return;
    mode = m[1]; if (!m[2]) return; var p = {}; m[2].split("&").forEach(function (kv) { var a = kv.split("="); p[a[0]] = decodeURIComponent(a[1] || ""); });
    if (p.u) S.sel = p.u.split(",").filter(D.has);
    if (p.lv) S.lv = Math.min(3, Math.max(1, +p.lv || 2));
    if (p.n) S.count = /^p[123]$/.test(p.n) ? p.n : Math.min(100, Math.max(1, +p.n || 20));
    if (p.c) S.cols = p.c === "auto" ? "auto" : +p.c;
    if (p.o) S.order = p.o === "mix" ? "mix" : "unit";
    if (p.s) seed = +p.s || seed;
    if (p.t) S.title = p.t;
    if (p.b) S.big = p.b === "1";
    if (S.sel.length) { var f = BY[S.sel[0]]; if (f) S.grade = NB.cat.filter(function (x) { return x.sem === f.sem; })[0].grade; }
  }
  readHash();
  function save() { var c = Object.assign({}, S); sv(SK, c); }
  function shareURL() { var q = "u=" + S.sel.join(",") + "&lv=" + S.lv + "&n=" + S.count + "&c=" + S.cols + "&o=" + S.order + "&s=" + seed + (S.big ? "&b=1" : "") + (S.title ? "&t=" + encodeURIComponent(S.title) : ""); return location.href.split("#")[0] + "#" + mode + "?" + q; }
  var lastHash = ""; function setHash() { try { history.replaceState(null, "", mode === "print" && S.sel.length ? shareURL() : "#" + mode); lastHash = location.hash; } catch (e) {} }

  /* ---------- 版面骨架 ---------- */
  var ICO = { print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>', online: '<path d="M4 20l1-5L16 4l4 4L9 19z"/>', log: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>' };
  function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[k] + "</svg>"; }
  var bar = h('<nav class="bar"><a class="back" href="' + root + 'island.html">← 回到目錄</a></nav>');
  var right = h('<div class="bar-r"></div>');
  right.appendChild(NB.themeBar()); right.appendChild(NB.menu({ cur: "drill" })); bar.appendChild(right);
  app.appendChild(bar); app.appendChild(h('<div class="ruler"></div>'));
  var head = h('<header class="dr-head"><p class="eyebrow">數光島工具箱・無限出題</p><h1 class="title">每一張都是<mark>新的練習卷</mark></h1><p class="lead">依國小數學課綱 412 個小節隨機出題，自動排版成 A4 題目卷與答案卷；也可以直接在線上作答、馬上批改。不用登入，也不會用到伺服器。</p>' +
    '<div class="dr-modes" role="tablist"><button class="pen" data-m="print" role="tab">' + ic("print") + '列印練習卷</button><button class="pen" data-m="online" role="tab">' + ic("online") + '線上練習</button><button class="pen" data-m="log" role="tab">' + ic("log") + "練習紀錄</button></div></header>");
  app.appendChild(head);
  var lay = h('<div class="dr-layout"><aside class="dr-side"></aside><section class="dr-main" aria-live="polite"></section></div>');
  app.appendChild(lay);
  var side = lay.firstChild, main = lay.lastChild;
  head.querySelectorAll("[data-m]").forEach(function (b) { b.onclick = function () { if (mode === b.dataset.m) return; mode = b.dataset.m; go(); }; });

  /* ---------- 選單元 ---------- */
  function pickerBox() {
    var box = h('<section class="sheet"><h2><span class="dr-step">1</span>選單元</h2><div class="dr-row dr-grades" role="group" aria-label="年級"></div><div class="dr-semlist"></div><div class="dr-picked"><span></span><button type="button">全部清除</button></div></section>');
    var gr = box.querySelector(".dr-grades"), list = box.querySelector(".dr-semlist"), pk = box.querySelector(".dr-picked");
    [1, 2, 3, 4, 5, 6].forEach(function (g) { var b = h('<button type="button" class="pen">' + "一二三四五六"[g - 1] + "年級</button>"); b.onclick = function () { S.grade = g; save(); drawSems(); markG(); }; gr.appendChild(b); });
    function markG() { gr.querySelectorAll("button").forEach(function (b, i) { b.classList.toggle("on", i + 1 === S.grade); }); }
    function cnt(c) { return c.secs.filter(function (o) { return S.sel.indexOf(o.id) >= 0; }).length; }
    function drawSems() {
      list.innerHTML = "";
      NB.cat.filter(function (x) { return x.grade === S.grade; }).forEach(function (sem) {
        var d = h('<div class="dr-sem"><div class="dr-semh"><span class="tag">' + sem.sem + "</span></div></div>");
        sem.chs.forEach(function (c) {
          var ch = h('<div class="dr-chap"><button type="button" aria-expanded="false"><span class="no">第' + CN[c.no - 1] + '章</span><b>' + esc(c.name) + '</b><span class="ct"></span></button><div class="dr-secs" hidden></div></div>');
          var btn = ch.firstChild, secs = ch.lastChild, ct = btn.querySelector(".ct");
          function upd() { var n = cnt(c); ct.textContent = n ? "已選 " + n + "/" + c.secs.length : c.secs.length + " 節"; ct.classList.toggle("on", !!n); }
          var all = h('<button type="button" class="dr-sec" aria-pressed="false">整章</button>');
          all.onclick = function () { var on = cnt(c) < c.secs.length; c.secs.forEach(function (o) { toggle(o.id, on); }); refresh(); };
          secs.appendChild(all);
          c.secs.forEach(function (o) {
            var b = h('<button type="button" class="dr-sec" data-id="' + o.id + '" aria-pressed="false"><span class="n">' + o.num + "</span>" + esc(o.title) + "</button>");
            b.onclick = function () { toggle(o.id, S.sel.indexOf(o.id) < 0); refresh(); };
            secs.appendChild(b);
          });
          function refresh() { secs.querySelectorAll("[data-id]").forEach(function (b) { b.setAttribute("aria-pressed", S.sel.indexOf(b.dataset.id) >= 0 ? "true" : "false"); }); all.setAttribute("aria-pressed", cnt(c) === c.secs.length ? "true" : "false"); upd(); picked(); changed(); }
          ch._r = refresh;
          btn.onclick = function () { var v = secs.hidden; secs.hidden = !v; btn.setAttribute("aria-expanded", v ? "true" : "false"); };
          if (cnt(c)) { secs.hidden = false; btn.setAttribute("aria-expanded", "true"); }
          upd(); secs.querySelectorAll("[data-id]").forEach(function (b) { b.setAttribute("aria-pressed", S.sel.indexOf(b.dataset.id) >= 0 ? "true" : "false"); }); all.setAttribute("aria-pressed", cnt(c) === c.secs.length ? "true" : "false");
          d.appendChild(ch);
        });
        list.appendChild(d);
      });
    }
    function toggle(id, on) { var i = S.sel.indexOf(id); if (on && i < 0) S.sel.push(id); if (!on && i >= 0) S.sel.splice(i, 1); }
    function picked() { pk.firstChild.textContent = S.sel.length ? "已選 " + S.sel.length + " 個小節" : "還沒選單元：點章名展開，再點小節"; pk.lastChild.hidden = !S.sel.length; }
    pk.lastChild.onclick = function () { S.sel = []; drawSems(); picked(); changed(); };
    markG(); drawSems(); picked();
    return box;
  }
  function lvRow(label) {
    var r = h('<div><span class="dr-lab">' + (label || "難度") + '</span><div class="dr-seg" role="group"><button type="button" data-v="1">基礎</button><button type="button" data-v="2">標準</button><button type="button" data-v="3">挑戰</button></div></div>');
    function m() { r.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", +b.dataset.v === S.lv); }); }
    r.querySelectorAll("button").forEach(function (b) { b.onclick = function () { S.lv = +b.dataset.v; m(); changed(); }; }); m(); return r;
  }
  var changed = function () {};

  /* ---------- 出題 ---------- */
  function sig(Q) { return Q.id + "|" + Q.q + "|" + (Q.opts || []).join() + "|" + (Q.fig || "").length + "|" + Q.b.map(function (b) { return b.a != null ? b.a : b.n + "/" + b.d; }).join(); }
  function genOne(id, s, i, used) { var Q, k = 0; do { Q = D.make(id, D.hash(s + ":" + i + ":" + k), S.lv); k++; } while (used[sig(Q)] && k < 8); used[sig(Q)] = 1; return Q; }
  /* 平均分配題數：依單元順序，或打散 */
  function plan(n, s) {
    var ids = S.sel.slice().sort(function (a, b) { return NB.flat.indexOf(BY[a]) - NB.flat.indexOf(BY[b]); }), list = [], R = D.rng(D.hash("plan" + s));
    if (!ids.length) return [];
    for (var i = 0; i < n; i++) list.push(ids[i % ids.length]);
    if (S.order === "mix") return R.shuffle(list);
    return list.sort(function (a, b) { return ids.indexOf(a) - ids.indexOf(b); });
  }
  function makeSet(n, s) { var used = {}, cnt = {}; return plan(n, s).map(function (id) { cnt[id] = (cnt[id] || 0) + 1; return genOne(id, s, id + "#" + cnt[id], used); }); }

  /* ---------- 題目轉 HTML（q 列印題目、a 列印答案、o 線上） ---------- */
  function bw(b) { var t = b.k === "n" ? String(D.ansTex(b)) : b.k === "s" ? String(b.a) : ""; return Math.max(3, Math.min(9, t.replace(/\$/g, "").length * 0.7 + 1.6)).toFixed(1) + "em"; }
  function blank(b, i, md) {
    var u = b.u ? '<span class="u">' + esc(b.u) + "</span>" : "";
    if (md === "o") {
      if (b.k === "n") return '<input class="din" data-b="' + i + '" inputmode="decimal" autocomplete="off" aria-label="第 ' + (i + 1) + ' 格">' + (b.u ? esc(b.u) : "");
      if (b.k === "f") return '<span class="dinf" data-b="' + i + '"><input class="din w" data-p="w" inputmode="numeric" aria-label="整數部分（沒有就空白）"><span><input class="din sm" data-p="n" inputmode="numeric" aria-label="分子"><em></em><input class="din sm" data-p="d" inputmode="numeric" aria-label="分母"></span></span>' + (b.u ? esc(b.u) : "");
      if (b.k === "s") return '<span class="dsel" data-b="' + i + '">' + b.o.map(function (o) { return '<button type="button" data-v="' + esc(o) + '" aria-pressed="false">' + esc(o) + "</button>"; }).join("") + "</span>" + (b.u ? esc(b.u) : "");
      return "";
    }
    var A = md === "a";
    if (b.k === "f") return A ? '<span class="bfa">' + tx(D.ansTex(b)) + "</span>" + u : '<span class="bf">' + (b.mixed ? "<s></s>" : "") + '<span><s></s><em></em><s></s></span></span>' + u;
    if (b.k === "c") return "";
    var hint = b.k === "s" && D.CMP.indexOf(b.o[0]) < 0 && !A ? '<span class="sop">' + b.o.map(esc).join("／") + "</span>" : "";
    return '<span class="bk" style="--bw:' + bw(b) + '"><i>' + (A ? "<b>" + tx(esc(String(D.ansTex(b)))) + "</b>" : "　") + "</i>" + u + hint + "</span>";
  }
  function body(Q, md) {
    var parts = Q.q.split("[?]"), k = 0, out = "", bi = Q.b.map(function (b, i) { return i; }).filter(function (i) { return Q.b[i].k !== "c"; });
    parts.forEach(function (p, j) {
      out += tx(p);
      if (j < parts.length - 1) { var i = bi[k++], bb = Q.b[i], nx = parts[j + 1].replace(/^[\s　]+/, "");
        /* 題幹在空格後面已經寫了單位，就不要再重複 */
        if (bb.u && nx.indexOf(bb.u) === 0) bb = Object.assign({}, bb, { u: "" });
        out += blank(bb, i, md); }
    });
    return out;
  }
  function optsHtml(Q, md) {
    if (!Q.opts) return "";
    if (md === "o") return '<div class="dmc" data-b="0">' + Q.opts.map(function (o, i) { return '<button type="button" data-v="' + i + '" aria-pressed="false"><b>(' + "ABCD"[i] + ")</b>" + tx(o) + "</button>"; }).join("") + "</div>";
    return '<div class="dq-o">' + Q.opts.map(function (o, i) { return "<span>(" + "ABCD"[i] + ") " + tx(o) + "</span>"; }).join("") + "</div>";
  }
  function figHtml(Q) { return Q.fig ? '<div class="dq-f">' + Q.fig + "</div>" : ""; }
  var GAP = { s: 3, m: 7, l: 14 };
  function qItem(Q, n, md) {
    var wide = Q.wide || /dtab|dcal/.test(Q.fig || "") || (Q.opts && Q.opts.join("").length > 34) || Q.q.replace(/\$[^$]*\$/g, "xx").length > 70;
    var g = GAP[S.gap] + (Q.gap || 0) * 6 + (Q.sol ? 4 : 0);
    var cMark = Q.opts ? '<span class="dq-c">' + (md === "a" ? "<b>" + "ABCD"[Q.b[0].a] + "</b>" : "　") + "</span>" : "";
    var sol = md === "a" && S.sol && Q.sol ? '<span class="dsol">' + tx("算式：" + Q.sol) + "</span>" : "";
    return '<div class="dq' + (wide ? " wide" : "") + '" style="--gap:' + g + 'mm">' + cMark + '<span class="dq-n">' + n + '.</span><span class="dq-t">' + body(Q, md) + "</span>" + figHtml(Q) + optsHtml(Q, md) + sol + "</div>";
  }

  /* ---------- A4 排版 ---------- */
  var WM = root + "assets/img/islander-bw.svg";
  function autoTitle() {
    if (S.title) return S.title;
    var sems = {}, chs = {}; S.sel.forEach(function (id) { var o = BY[id]; sems[o.sem] = 1; chs[o.sem + o.ch.name] = o.ch.name; });
    var sk = Object.keys(sems), ck = Object.keys(chs);
    var mid = ck.length === 1 ? chs[ck[0]] : ck.length <= 2 ? ck.map(function (k) { return chs[k]; }).join("・") : ""; return (sk.length === 1 ? sk[0] + " " : "") + (mid ? mid + " 練習卷" : "綜合練習卷");
  }
  function cols() { if (S.cols !== "auto") return +S.cols; return 2; }
  function newPage(kind, first, title, pno) {
    var p = h('<div class="dpage p' + kind + (S.big ? " big" : "") + '"><img class="dwm" src="' + WM + '" alt=""><div class="dbody"><div class="dgrid" style="--cols:' + cols() + '"></div></div><div class="dft"><span>© 蘇昊數理・數光島筆記本</span><span class="pno"></span><span>卷號 ' + seed + "</span></div></div>");
    var kname = kind === "q" ? "" : kind === "a" ? "（答案卷）" : "（簡答）";
    var hd = first ? '<div class="dhd"><h2>' + esc(title) + kname + '</h2><p class="dsub">' + esc(lvName()) + "・共 " + "<span class=dqn></span> 題</p>" + (S.head && kind === "q" ? '<div class="dinfo"><span>班級 <u></u></span><span>座號 <u style="min-width:12mm"></u></span><span>姓名 <u style="min-width:30mm"></u></span>' + (S.score ? '<span>得分 <u style="min-width:16mm"></u></span>' : "") + "</div>" : "") + "</div>" : '<div class="dhd2"><span>' + esc(title) + kname + "</span><span>卷號 " + seed + "</span></div>";
    p.insertBefore(h(hd), p.querySelector(".dbody"));
    return p;
  }
  function lvName() { return ["", "基礎", "標準", "挑戰"][S.lv]; }
  function over(p) { var b = p.querySelector(".dbody"), g = b.firstChild; return g.offsetHeight > b.clientHeight + 0.5; }
  /* 把一串題目 HTML 排進頁面；回傳每頁的題目索引 */
  function flow(host, items, kind, title, maxPages) {
    var pages = [], p = newPage(kind, true, title), g; host.appendChild(p); pages.push(p); g = p.querySelector(".dgrid");
    var fit = 0;
    for (var i = 0; i < items.length; i++) {
      var el = h(items[i]); g.appendChild(el);
      if (over(p)) {
        g.removeChild(el);
        if (!g.children.length) { g.appendChild(el); fit = i + 1; continue; }   /* 單題就超過一頁：硬放 */
        if (maxPages && pages.length >= maxPages) break;
        p = newPage(kind, false, title); host.appendChild(p); pages.push(p); g = p.querySelector(".dgrid"); g.appendChild(el);
      }
      fit = i + 1;
    }
    pages.forEach(function (pg, k) { pg.querySelector(".pno").textContent = "第 " + (k + 1) + " 頁／共 " + pages.length + " 頁"; });
    return { pages: pages, fit: fit };
  }
  var CUR = null;   /* 目前這份卷：{qs, title} */
  function buildItems(qs, md) {
    var out = [], n = 0, last = null;
    qs.forEach(function (Q) {
      if (S.order === "unit" && S.sel.length > 1 && qs.length >= 2 * S.sel.length && Q.id !== last) { out.push({ sec: 1, html: '<div class="dsec">' + ZH[Math.min(9, out.filter(function (x) { return x.sec; }).length)] + "、" + esc(BY[Q.id].title) + "</div>" }); last = Q.id; }
      out.push({ html: qItem(Q, ++n, md) });
    });
    return out;
  }
  function keyHtml(qs) {
    var s = '<div class="dkey" style="--kc:' + (S.big ? 3 : 4) + '">';
    qs.forEach(function (Q, i) { s += "<div><b>" + (i + 1) + ".</b><em>" + tx(Q.b.map(function (b) { return esc(String(D.ansTex(b))); }).join("、")) + "</em></div>"; });
    return s + "</div>";
  }
  function render(pv, info) {
    var title = autoTitle(), inner = pv.querySelector(".dpv-in");
    inner.innerHTML = "";
    if (!S.sel.length) return;
    var qs, n;
    if (typeof S.count === "string") {
      /* 填滿 N 頁：先試排算出放得下幾題，再照分配重新出題 */
      var N = +S.count.slice(1), probe = makeSet(160, seed), tmp = h('<div style="position:absolute;visibility:hidden;left:-9999px;top:0"></div>');
      document.body.appendChild(tmp);
      var r = flow(tmp, buildItems(probe, "q").map(function (x) { return x.html; }), "q", title, N);
      var fitQ = buildItems(probe, "q").slice(0, r.fit).filter(function (x) { return !x.sec; }).length;
      qs = makeSet(Math.max(1, fitQ), seed);
      var lastN = 0;
      for (var t = 0; t < 60 && qs.length > 1; t++) { tmp.innerHTML = ""; var r2 = flow(tmp, buildItems(qs, "q").map(function (x) { return x.html; }), "q", title, 0); if (r2.pages.length <= N) { if (t === 0 && !lastN) { /* 還有空間就試著多放 */ var more = makeSet(qs.length + 1, seed); tmp.innerHTML = ""; if (flow(tmp, buildItems(more, "q").map(function (x) { return x.html; }), "q", title, 0).pages.length <= N && more.length < 150) { qs = more; t = -1; continue; } } break; } lastN = 1; qs = makeSet(qs.length - 1, seed); }
      document.body.removeChild(tmp);
    } else qs = makeSet(+S.count, seed);
    n = qs.length; CUR = { qs: qs, title: title };
    var fq = flow(inner, buildItems(qs, "q").map(function (x) { return x.html; }), "q", title, 0);
    var fa = flow(inner, buildItems(qs, "a").map(function (x) { return x.html; }), "a", title, 0);
    var fk = flow(inner, [keyHtml(qs)], "k", title, 0);
    inner.querySelectorAll(".dqn").forEach(function (e) { e.textContent = n; });
    info.textContent = "共 " + n + " 題・題目卷 " + fq.pages.length + " 頁・答案卷 " + fa.pages.length + " 頁";
    showView(pv); fit(pv);
  }
  function showView(pv) { var inner = pv.querySelector(".dpv-in"); inner.querySelectorAll(".dpage").forEach(function (p) { p.style.display = p.classList.contains("p" + S.view) ? "" : "none"; }); fit(pv); }
  function fit(pv) { var inner = pv.querySelector(".dpv-in"); if (!inner) return; var w = pv.clientWidth, pw = 210 * 96 / 25.4, s = Math.min(1, w / pw); inner.style.transform = "scale(" + s + ")"; var hh = 0; inner.querySelectorAll(".dpage").forEach(function (p) { if (p.style.display !== "none") hh += p.offsetHeight + 30; }); pv.style.height = Math.ceil(hh * s) + "px"; }

  /* ---------- 列印模式 ---------- */
  function printMode() {
    side.innerHTML = ""; main.innerHTML = "";
    side.appendChild(pickerBox());
    var st = h('<section class="sheet"><h2><span class="dr-step">2</span>卷面設定</h2></section>');
    st.appendChild(lvRow());
    st.appendChild(h('<label class="dr-lab" for="dr-title">標題（空白就自動命名）</label>'));
    var ti = h('<input id="dr-title" class="dr-in" maxlength="40" placeholder="例如：五上 第六章 練習卷">'); ti.value = S.title; ti.oninput = function () { S.title = ti.value.trim(); changedSoft(); }; st.appendChild(ti);
    var two = h('<div class="dr-two"><div><label class="dr-lab" for="dr-n">題數</label><select id="dr-n" class="dr-sel"><option value="p1">填滿 1 頁</option><option value="p2">填滿 2 頁</option><option value="p3">填滿 3 頁</option><option value="10">10 題</option><option value="20">20 題</option><option value="25">25 題</option><option value="30">30 題</option><option value="40">40 題</option><option value="50">50 題</option></select></div>' +
      '<div><label class="dr-lab" for="dr-c">欄數</label><select id="dr-c" class="dr-sel"><option value="auto">自動（2 欄）</option><option value="1">1 欄</option><option value="2">2 欄</option><option value="3">3 欄</option></select></div>' +
      '<div><label class="dr-lab" for="dr-g">作答空間</label><select id="dr-g" class="dr-sel"><option value="s">緊湊</option><option value="m">適中</option><option value="l">寬鬆</option></select></div>' +
      '<div><label class="dr-lab" for="dr-o">題目順序</label><select id="dr-o" class="dr-sel"><option value="unit">依單元分大題</option><option value="mix">全部打散</option></select></div></div>');
    st.appendChild(two);
    function bindSel(id, key, num) { var e = two.querySelector(id); e.value = String(S[key]); e.onchange = function () { S[key] = num && /^\d+$/.test(e.value) ? +e.value : e.value; changed(); }; }
    bindSel("#dr-n", "count", 1); bindSel("#dr-c", "cols", 1); bindSel("#dr-g", "gap"); bindSel("#dr-o", "order");
    [["big", "大字版（低年級建議）"], ["head", "卷頭有班級、座號、姓名"], ["score", "加上得分欄"], ["sol", "答案卷附算式（應用題）"]].forEach(function (p) { var c = h('<label class="dr-chk"><input type="checkbox">' + p[1] + "</label>"), i = c.firstChild; i.checked = !!S[p[0]]; i.onchange = function () { S[p[0]] = i.checked; changed(); }; st.appendChild(c); });
    st.appendChild(h('<label class="dr-lab" for="dr-seed">卷號（同一個卷號、同樣設定，會出一模一樣的卷）</label>'));
    var sd = h('<div class="dr-seed"><input id="dr-seed" class="dr-in" inputmode="numeric" maxlength="9"><button type="button" class="pen">換一批</button></div>'), si = sd.firstChild;
    si.value = seed; si.onchange = function () { var v = parseInt(si.value.replace(/\D/g, "")); if (v) { seed = v; changed(); } else si.value = seed; };
    sd.lastChild.onclick = function () { seed = rseed(); si.value = seed; changed(); };
    st.appendChild(sd);
    var bt = h('<div class="dr-btns"><button type="button" class="pen go" data-p="q">列印題目卷</button><button type="button" class="pen" data-p="a">列印答案卷</button><button type="button" class="pen" data-p="qa">題目卷＋答案卷一起印</button><button type="button" class="pen" data-p="k">只印簡答</button><button type="button" class="pen" data-share>複製這份卷的分享連結</button></div>');
    bt.querySelectorAll("[data-p]").forEach(function (b) { b.onclick = function () { doPrint(b.dataset.p); }; });
    bt.querySelector("[data-share]").onclick = function () { copy(shareURL(), bt.querySelector("[data-share]")); };
    st.appendChild(bt);
    st.appendChild(h('<p class="dr-note">列印時請選 A4、縮放 100%（或「預設」），並關閉瀏覽器的頁首頁尾。手機也能印；版面以電腦的 Chrome、Edge 最準。</p>'));
    side.appendChild(st);

    var tb = h('<div class="dr-bar"><div class="dr-seg" role="group" aria-label="預覽"><button type="button" data-v="q">題目卷</button><button type="button" data-v="a">答案卷</button><button type="button" data-v="k">簡答</button></div><span class="dr-info"></span></div>');
    var pv = h('<div class="dpv"><div class="dpv-in"></div></div>'), info = tb.querySelector(".dr-info"), empty = h('<div class="dr-empty" hidden><p>先在左邊（手機在上方）選單元，這裡就會出現練習卷。</p></div>');
    empty.insertBefore(h(NB.deco.hero().outerHTML), empty.firstChild);
    function mv() { tb.querySelectorAll("[data-v]").forEach(function (b) { b.classList.toggle("on", b.dataset.v === S.view); }); }
    tb.querySelectorAll("[data-v]").forEach(function (b) { b.onclick = function () { S.view = b.dataset.v; save(); mv(); showView(pv); }; }); mv();
    main.appendChild(tb); main.appendChild(empty); main.appendChild(pv);
    var tmr = 0;
    function redo() { save(); setHash(); empty.hidden = !!S.sel.length; tb.style.display = pv.style.display = S.sel.length ? "" : "none"; clearTimeout(tmr); tmr = setTimeout(function () { render(pv, info); settle(pv, info); }, 60); }
    changed = redo; changedSoft = function () { clearTimeout(tmr); tmr = setTimeout(redo, 400); };
    redo();
    window.addEventListener("resize", function () { if (mode === "print") fit(pv); });
  }
  var changedSoft = function () {};
  /* 字型、注音晚到時，高度會變：重排一次 */
  var stl = 0;
  function settle(pv, info) { clearTimeout(stl); var go2 = function () { if (mode !== "print" || !CUR) return; var bad = [].some.call(pv.querySelectorAll(".dpage"), function (p) { return p.style.display !== "none" && over(p); }); if (bad) render(pv, info); else fit(pv); }; if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { stl = setTimeout(go2, 300); }); stl = setTimeout(go2, 1500); }
  var zyState = ""; new MutationObserver(function () { var z = document.body.classList.contains("zymode") + "" + document.body.classList.contains("zyfont"); if (z === zyState) return; zyState = z; if (mode === "print") { var pv = main.querySelector(".dpv"), info = main.querySelector(".dr-info"); if (pv && CUR) setTimeout(function () { render(pv, info); }, 500); } }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  function doPrint(k) {
    if (!S.sel.length) return;
    document.body.classList.remove("pr-q", "pr-a", "pr-qa", "pr-k"); document.body.classList.add("pr-" + k);
    var pv = main.querySelector(".dpv"); pv.querySelectorAll(".dpage").forEach(function (p) { p.style.display = ""; });
    var old = document.title; document.title = autoTitle() + "_" + seed;
    setTimeout(function () { window.print(); document.title = old; setTimeout(function () { document.body.classList.remove("pr-" + k); showView(pv); }, 300); }, 50);
  }
  function copy(t, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = "已複製連結"; setTimeout(function () { btn.textContent = o; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { prompt("複製這個連結：", t); });
    else prompt("複製這個連結：", t);
  }

  /* ---------- 線上練習 ---------- */
  var REC = ld(RK, { u: {}, wrong: [], ss: [] });
  function rec(Q, ok) {
    var u = REC.u[Q.id] = REC.u[Q.id] || { n: 0, c: 0 }; u.n++; if (ok) u.c++;
    var k = Q.id + "|" + Q.seed + "|" + Q.lv, i = REC.wrong.findIndex(function (w) { return w.k === k; });
    if (!ok && i < 0) REC.wrong.unshift({ k: k, id: Q.id, seed: Q.seed, lv: Q.lv, t: Date.now() });
    if (ok && i >= 0 && P && P.redo) REC.wrong.splice(i, 1);
    REC.wrong = REC.wrong.slice(0, 200); sv(RK, REC);
  }
  var P = null; /* 一輪練習 */
  function onlineMode() {
    side.innerHTML = ""; main.innerHTML = "";
    side.appendChild(pickerBox());
    var st = h('<section class="sheet"><h2><span class="dr-step">2</span>練習設定</h2></section>');
    st.appendChild(lvRow());
    var two = h('<div class="dr-two"><div><label class="dr-lab" for="dp-n">題數</label><select id="dp-n" class="dr-sel"><option value="10">10 題</option><option value="20">20 題</option><option value="30">30 題</option><option value="0">無限（自己按結束）</option></select></div><div><label class="dr-lab">&nbsp;</label><label class="dr-chk"><input type="checkbox" id="dp-t">顯示計時</label></div></div>');
    var ns = two.querySelector("#dp-n"), tc = two.querySelector("#dp-t"); ns.value = String(S.on); tc.checked = S.otime; ns.onchange = function () { S.on = +ns.value; save(); }; tc.onchange = function () { S.otime = tc.checked; save(); };
    st.appendChild(two);
    var bt = h('<div class="dr-btns"><button type="button" class="pen go">開始練習</button></div>'); bt.firstChild.onclick = function () { start(false); };
    st.appendChild(bt);
    st.appendChild(h('<p class="dr-note">按 Enter 送出、再按一次下一題。分數可以填 2又1/3：整數格填 2、分子 1、分母 3；沒有整數就空著。答題紀錄只存在這台裝置。</p>'));
    side.appendChild(st);
    changed = function () { save(); };
    main.appendChild(h('<div class="sheet dr-empty"><p>選好單元與難度，按「開始練習」。答錯的題目會自動收進「練習紀錄」的錯題本，可以再練一次。</p></div>'));
    main.firstChild.insertBefore(h(NB.deco.hero().outerHTML), main.firstChild.firstChild);
  }
  function start(redo, list) {
    if (!redo && !S.sel.length) { alertBox("請先選至少一個小節。"); return; }
    P = { redo: redo, list: list || null, i: 0, n: list ? list.length : S.on, ok: 0, done: 0, t0: Date.now(), wrong: [], used: {}, streak: 0, best: 0 };
    if (window.innerWidth < 900) side.style.display = "none";
    next();
  }
  function alertBox(m) { var b = main.querySelector(".dr-alert"); if (!b) { b = h('<p class="dr-alert sheet" role="alert"></p>'); main.insertBefore(b, main.firstChild); } b.textContent = m; }
  function nextQ() {
    if (P.list) { var w = P.list[P.i]; return D.make(w.id, w.seed, w.lv); }
    var R = D.rng(D.hash("on" + P.t0 + ":" + P.i)), ids = S.sel, Q, k = 0;
    do { Q = D.make(R.pick(ids), rseed(), S.lv); k++; } while (P.used[sig(Q)] && k < 8);
    P.used[sig(Q)] = 1; return Q;
  }
  var tick = 0;
  document.addEventListener("keydown", function (e) { if (e.key !== "Enter" || !P || mode !== "online" || e.isComposing) return; var g = main.querySelector(".dp-go"); if (!g) return; var t = e.target; if (t && t.tagName === "BUTTON" && !t.closest(".dp-card")) return; e.preventDefault(); g.click(); });
  function next() {
    if (P.n && P.i >= P.n) return finish();
    var Q = nextQ(); P.Q = Q; P.answered = false;
    main.innerHTML = "";
    var top = h('<div class="dp-top"><div class="dp-stat"><span>第 <b>' + (P.i + 1) + "</b>" + (P.n ? " / " + P.n : "") + ' 題</span><span>答對 <b class="ok">' + P.ok + "</b></span><span>連對 <b>" + P.streak + '</b></span><span class="tm"></span></div><div class="dp-prog"><i style="width:' + (P.n ? (P.i / P.n) * 100 : 0) + '%"></i></div><button type="button" class="pen">結束</button></div>');
    top.querySelector("button").onclick = finish;
    var card = h('<section class="sheet dp-card dp-pop"><p class="dp-src">' + esc(secName(Q.id)) + "・" + lvName() + '</p><div class="dp-q">' + '<div class="dq"><span class="dq-t">' + body(Q, "o") + "</span>" + figHtml(Q) + optsHtml(Q, "o") + '</div></div><div class="dp-fb" aria-live="polite"></div><div class="dp-act"><button type="button" class="pen go dp-go">送出</button><button type="button" class="pen dp-skip">不會，看答案</button></div></section>');
    main.appendChild(top); main.appendChild(card);
    card.querySelectorAll(".dsel,.dmc").forEach(function (g) { g.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b || P.answered) return; g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); }); });
    var go2 = card.querySelector(".dp-go"); go2.onclick = function () { P.answered ? (P.i++, next()) : submit(card, false); };
    card.querySelector(".dp-skip").onclick = function () { if (!P.answered) submit(card, true); };
    
    var f = card.querySelector("input"); if (f && window.innerWidth > 640) f.focus();
    clearInterval(tick); var tm = top.querySelector(".tm");
    if (S.otime) { var up = function () { var s = Math.floor((Date.now() - P.t0) / 1000); tm.textContent = "用時 " + Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }; up(); tick = setInterval(up, 1000); }
    window.scrollTo({ top: Math.max(0, main.getBoundingClientRect().top + scrollY - 70), behavior: "smooth" });
  }
  function readVal(card, b, i) {
    if (b.k === "n") { var e = card.querySelector('input[data-b="' + i + '"]'); return e ? e.value : ""; }
    if (b.k === "f") { var w = card.querySelector('.dinf[data-b="' + i + '"]'); return { w: w.querySelector('[data-p="w"]').value, n: w.querySelector('[data-p="n"]').value, d: w.querySelector('[data-p="d"]').value }; }
    var sel = card.querySelector((b.k === "c" ? ".dmc" : '.dsel[data-b="' + i + '"]') + ' [aria-pressed="true"]'); return sel ? sel.dataset.v : null;
  }
  function submit(card, give) {
    var Q = P.Q, all = true, empty = true;
    var res = Q.b.map(function (b, i) { var v = readVal(card, b, i); if (v != null && v !== "" && !(typeof v === "object" && !v.n && !v.d)) empty = false; var ok = !give && D.check(b, v); if (!ok) all = false; return ok; });
    if (empty && !give) { var fb0 = card.querySelector(".dp-fb"); fb0.className = "dp-fb show"; fb0.innerHTML = "<p>還沒有作答喔。不會的話可以按「不會，看答案」。</p>"; return; }
    P.answered = true; P.done++;
    Q.b.forEach(function (b, i) {
      var el = b.k === "n" ? card.querySelector('input[data-b="' + i + '"]') : b.k === "f" ? card.querySelector('.dinf[data-b="' + i + '"]') : null;
      if (el) { (b.k === "f" ? el.querySelectorAll("input") : [el]).forEach(function (x) { x.classList.add(res[i] ? "ok-b" : "bad-b"); x.readOnly = true; }); }
      if (b.k === "s" || b.k === "c") { var g = b.k === "c" ? card.querySelector(".dmc") : card.querySelector('.dsel[data-b="' + i + '"]'); g.querySelectorAll("button").forEach(function (x) { var right = b.k === "c" ? +x.dataset.v === b.a : x.dataset.v === String(b.a); if (right) x.classList.add("ok-b"); else if (x.getAttribute("aria-pressed") === "true") x.classList.add("bad-b"); x.disabled = true; }); }
    });
    if (all) { P.ok++; P.streak++; P.best = Math.max(P.best, P.streak); } else { P.streak = 0; P.wrong.push(Q); }
    rec(Q, all);
    var fb = card.querySelector(".dp-fb"), ans = Q.b.map(function (b) { return String(D.ansTex(b)); }).join("、");
    fb.className = "dp-fb show " + (all ? "ok" : "bad");
    fb.innerHTML = all ? "<h3>" + (P.streak >= 5 ? "連對 " + P.streak + " 題，島上又亮了一盞燈！" : "答對了！") + "</h3>" + (Q.sol ? "<p>" + tx("算式：" + Q.sol) + "</p>" : "") : "<h3>" + (give ? "沒關係，看看答案" : "再想想看") + "</h3><p>正確答案：" + tx(esc(ans)) + "</p>" + (Q.sol ? "<p>" + tx("算式：" + Q.sol) + "</p>" : "") + firstFracHint(Q);
    var g2 = card.querySelector(".dp-go"); g2.textContent = P.n && P.i + 1 >= P.n ? "看結果" : "下一題"; card.querySelector(".dp-skip").hidden = true; g2.focus();
    var st = main.querySelector(".dp-stat .ok"); if (st) st.textContent = P.ok;
  }
  function firstFracHint(Q) { var f = Q.b.filter(function (b) { return b.k === "f"; })[0]; if (!f) return ""; return '<p class="dr-note">分數要約成最簡分數' + (f.mixed ? "，比 1 大的要寫成帶分數" : "") + "。</p>"; }
  function finish() {
    clearInterval(tick); if (!P) return;
    var sec = Math.floor((Date.now() - P.t0) / 1000), n = P.done;
    if (n) { REC.ss.unshift({ t: Date.now(), n: n, c: P.ok, s: sec, u: P.list ? ["錯題重練"] : S.sel.slice(0, 6) }); REC.ss = REC.ss.slice(0, 60); sv(RK, REC); }
    side.style.display = "";
    main.innerHTML = "";
    var pc = n ? Math.round((P.ok / n) * 100) : 0;
    var s = h('<section class="sheet dp-sum dp-pop"><p class="eyebrow">練習結果</p><p class="dp-big">' + P.ok + " / " + n + '</p><p class="meta">答對率 ' + pc + "%・最多連對 " + P.best + " 題・用時 " + Math.floor(sec / 60) + " 分 " + (sec % 60) + ' 秒</p><div class="dp-act" style="justify-content:center"><button type="button" class="pen go" data-a="again">再來一輪</button>' + (P.wrong.length ? '<button type="button" class="pen" data-a="redo">錯的 ' + P.wrong.length + " 題再練一次</button>" : "") + '<button type="button" class="pen" data-a="log">看練習紀錄</button></div></section>');
    if (P.wrong.length) { var ul = h('<ol class="dp-wl"></ol>'); P.wrong.forEach(function (Q) { ul.appendChild(h("<li><small>" + esc(secName(Q.id)) + "</small><div>" + body(Q, "a") + (Q.opts ? "　答案：" + "(" + "ABCD"[Q.b[0].a] + ") " + tx(Q.opts[Q.b[0].a]) : "") + "</div></li>")); }); s.appendChild(ul); }
    main.appendChild(s);
    var W = P.wrong.map(function (Q) { return { id: Q.id, seed: Q.seed, lv: Q.lv }; });
    s.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { var a = b.dataset.a; if (a === "again") { P.list ? start(true, P.list) : start(false); } else if (a === "redo") start(true, W); else { mode = "log"; go(); } }; });
    P = null;
  }

  /* ---------- 練習紀錄 ---------- */
  function logMode() {
    side.innerHTML = ""; main.innerHTML = ""; REC = ld(RK, { u: {}, wrong: [], ss: [] });
    var tot = 0, ok = 0; Object.keys(REC.u).forEach(function (k) { tot += REC.u[k].n; ok += REC.u[k].c; });
    var a = h('<section class="sheet"><h2>總覽</h2><p class="dp-big" style="font-size:2.2rem">' + tot + ' <small style="font-size:1rem;color:var(--soft)">題</small></p><p class="meta">答對率 ' + (tot ? Math.round((ok / tot) * 100) : 0) + "%・錯題本 " + REC.wrong.length + ' 題</p><div class="dr-btns"></div><p class="dr-note">紀錄只存在這台裝置的瀏覽器，不會上傳；換裝置或清除瀏覽資料就會不見。</p></section>');
    var bt = a.querySelector(".dr-btns");
    if (REC.wrong.length) { var r = h('<button type="button" class="pen go">錯題本重練（最多 20 題）</button>'); r.onclick = function () { mode = "online"; go(true); start(true, REC.wrong.slice(0, 20).map(function (w) { return { id: w.id, seed: w.seed, lv: w.lv }; })); }; bt.appendChild(r); }
    var c = h('<button type="button" class="pen">清除所有紀錄</button>'); c.onclick = function () { if (confirm("確定要清除這台裝置上的練習紀錄嗎？")) { REC = { u: {}, wrong: [], ss: [] }; sv(RK, REC); logMode(); } }; bt.appendChild(c);
    side.appendChild(a);
    var b = h('<section class="sheet"><h2>各小節答對率</h2></section>'), ids = Object.keys(REC.u).sort(function (x, y) { return NB.flat.indexOf(BY[x]) - NB.flat.indexOf(BY[y]); });
    if (!ids.length) b.appendChild(h('<p class="meta">還沒有紀錄。到「線上練習」做幾題吧！</p>'));
    ids.forEach(function (id) { var u = REC.u[id], p = Math.round((u.c / u.n) * 100); b.appendChild(h('<div class="dl-row"><span>' + esc(secName(id)) + '</span><span class="dl-bar"><i style="width:' + p + "%;background:" + (p >= 80 ? "var(--p3)" : p >= 50 ? "var(--p4)" : "var(--p1)") + '"></i></span><span>' + u.c + "/" + u.n + "</span></div>")); });
    main.appendChild(b);
    if (REC.ss.length) { var s = h('<section class="sheet"><h2>最近的練習</h2></section>'); REC.ss.slice(0, 15).forEach(function (x) { var d = new Date(x.t); s.appendChild(h('<div class="dl-row"><span>' + (d.getMonth() + 1) + "/" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + "・" + esc(x.u.map(function (i) { return BY[i] ? BY[i].title : i; }).join("、")) + '</span><span class="dl-bar"><i style="width:' + Math.round((x.c / x.n) * 100) + '%"></i></span><span>' + x.c + "/" + x.n + "</span></div>")); }); main.appendChild(s); }
  }

  /* ---------- 切換 ---------- */
  function go(silent) {
    head.querySelectorAll("[data-m]").forEach(function (b) { var on = b.dataset.m === mode; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    clearInterval(tick); P = null; side.style.display = ""; changed = function () {}; changedSoft = function () {};
    lay.style.gridTemplateColumns = "";
    if (mode === "print") printMode(); else if (mode === "online") onlineMode(); else logMode();
    if (!silent) setHash();
  }
  window.addEventListener("hashchange", function () { if (location.hash === lastHash) return; var m = /^#(print|online|log)/.exec(location.hash); if (m) { readHash(); go(true); lastHash = location.hash; } });
  go(true);
  if (NB.tour) NB.tour.setup("drill", [
    { title: "無限出題", text: "選單元、按列印，就有一張全新的練習卷。也可以切到「線上練習」直接作答。" },
    { sel: ".dr-side .sheet", title: "1. 選單元", text: "選年級，點章名展開，再點要練的小節；可以跨章、跨年級混著選。" },
    { sel: ".dr-seed", title: "卷號", text: "每一份卷都有卷號。同樣的設定加上同樣的卷號，就會出一模一樣的卷，方便全班一起訂正。" },
    { sel: ".dr-modes", title: "三種用法", text: "列印練習卷、線上練習、練習紀錄（錯題本）都在這裡切換。" }]);
})();
