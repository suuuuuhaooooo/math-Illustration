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

  /* ---------- 可以收起來的設定區塊 ----------
     左邊那幾個設定區（選單元、卷面設定、直式小幫手）很佔位置，
     點一下標題就收起來，收合狀態記在這台裝置，下次進來還是一樣。 */
  var FK = "nb-drill-fold";
  function foldState() { return ld(FK, {}); }
  function foldable(sec, key) {
    var h2 = sec.querySelector("h2"); if (!h2 || sec.dataset.fold) return sec;
    sec.dataset.fold = key;
    sec.classList.add("dr-fo");
    var body = document.createElement("div");
    body.className = "dr-fo-b";
    while (h2.nextSibling) body.appendChild(h2.nextSibling);
    sec.appendChild(body);
    var cv = h('<span class="dr-fo-c" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>');
    h2.appendChild(cv);
    h2.setAttribute("role", "button");
    h2.setAttribute("tabindex", "0");
    var st = foldState(), open = st[key] !== 0;
    function paint() {
      sec.classList.toggle("off", !open);
      h2.setAttribute("aria-expanded", open ? "true" : "false");
      h2.setAttribute("title", open ? "點一下收起來" : "點一下展開");
    }
    function toggle() { open = !open; var m = foldState(); m[key] = open ? 1 : 0; sv(FK, m); paint(); }
    h2.addEventListener("click", function (e) {
      /* 標題裡如果以後放了按鈕，點按鈕不要跟著收合 */
      if (e.target.closest("button,input,select,a")) return;
      toggle();
    });
    h2.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    paint();
    return sec;
  }

  /* ---------- 狀態 ---------- */
  var DEF = { sel: [], lv: 2, grade: 0, title: "", count: "p1", cols: "auto", big: false, gap: "m", order: "unit", head: true, score: true, sol: true, view: "q", on: 10, otime: true, vmode: "filled", vgrid: "cell", vpv: true, vcarry: true, aidAt: "both", alloc: {}, sec: {}, vsize: "m", aidSm: false };
  var LEGACY = false;   /* 舊版（沒有 ver）分享連結：只出基本題，重現當時的卷 */
  /* 這一份卷上的修改：換題 rr、刪題 del、加題 plus、改題幹 txt、自訂題 add。換卷號或難度就清空 */
  var ED = { rr: {}, del: {}, plus: {}, txt: {}, add: [] }, edSig = "";
  var S = Object.assign({}, DEF, ld(SK, {})), mode = "print", seed = rseed();
  if (!S.grade) { var g0 = 3; try { g0 = parseInt(localStorage.getItem("currentGrade")) || 3; } catch (e) {} S.grade = g0; }
  function readHash() {
    var m = /^#(print|online|log)(?:\?(.*))?$/.exec(location.hash || ""); if (!m) return;
    mode = m[1]; if (!m[2]) return; var p = {}; m[2].split("&").forEach(function (kv) { var a = kv.split("="); p[a[0]] = decodeURIComponent(a[1] || ""); });
    if (p.u) S.sel = p.u.split(",").filter(D.has);
    if (p.lv) S.lv = Math.min(3, Math.max(1, +p.lv || 2));
    if (p.n) S.count = /^p[123]$|^alloc$/.test(p.n) ? p.n : Math.min(100, Math.max(1, +p.n || 20));
    if (p.al) { S.alloc = {}; p.al.split(",").forEach(function (x) { var q = x.split("*"); if (D.has(q[0])) S.alloc[q[0]] = Math.min(30, Math.max(0, +q[1] || 0)); }); }
    ED = { rr: {}, del: {}, plus: {}, txt: {}, add: [] };
    if (p.x) p.x.split(",").forEach(function (x) { var q = x.split("~"); if (q[0]) ED.rr[q[0]] = +q[1] || 1; });
    if (p.d) p.d.split(",").forEach(function (x) { if (x) ED.del[x] = 1; });
    if (p.pl) p.pl.split(",").forEach(function (x) { var q = x.split("*"); if (D.has(q[0])) ED.plus[q[0]] = +q[1] || 1; });
    if (p.c) S.cols = p.c === "auto" ? "auto" : +p.c;
    if (p.o) S.order = p.o === "mix" ? "mix" : "unit";
    if (p.s) seed = +p.s || seed;
    if (p.t) S.title = p.t;
    if (p.b) S.big = p.b === "1";
    if (p.v) { var v = p.v.split(""); S.vmode = v[0] === "s" ? "self" : "filled"; S.vgrid = { c: "cell", l: "col", n: "none" }[v[1]] || "cell"; S.vpv = v[2] !== "0"; S.vcarry = v[3] !== "0"; }
    if (p.ai) S.aidAt = { b: "both", a: "ans", n: "none" }[p.ai] || "both";
    if (p.vs) S.vsize = /^[lms]$/.test(p.vs) ? p.vs : "m";
    S.aidSm = p.as === "1";
    LEGACY = !p.ver;
    S.sec = {}; if (LEGACY) S.sel.forEach(function (id) { S.sec[id] = { ty: [0] }; });
    if (p.so) { p.so.split(",").forEach(function (x) { var mm = /^(.+)\.([A-Za-z0-9]*)$/.exec(x); if (!mm) return; var q = [mm[1], mm[2]]; if (!D.has(q[0])) return; var o = {}; (q[1] || "").split("").forEach(function (c) { if (c === "A") o.aid = 1; if (c === "a") o.aid = 0; if (c === "F") o.v = "filled"; if (c === "S") o.v = "self"; if (c === "N") o.v = "none"; }); var tm = /T(\d+)/.exec(q[1] || ""); if (tm) o.ty = tm[1].split("").map(Number); S.sec[q[0]] = o; }); }
    edSig = sigNow();
    if (S.sel.length) { var f = BY[S.sel[0]]; if (f) S.grade = NB.cat.filter(function (x) { return x.sem === f.sem; })[0].grade; }
  }
  readHash();
  /* 每個有多種題型的單元都寫出「用哪幾種題型」，以後新增題型也不會改變這份卷 */
  function secURL() { var a = S.sel.filter(function (id) { var o = S.sec[id]; return (o && (o.aid != null || o.v || (o.ty && o.ty.length))) || D.types(id).length > 1; }).map(function (id) { var o = S.sec[id] || {}, nt = D.types(id).length, ty = o.ty && o.ty.length ? o.ty : nt > 1 ? D.types(id).map(function (x, i) { return i; }) : null; return id + "." + (o.aid == null ? "" : o.aid ? "A" : "a") + (o.v ? { filled: "F", self: "S", none: "N" }[o.v] : "") + (ty ? "T" + ty.join("") : ""); }); return a.length ? "&so=" + a.join(",") : ""; }
  /* 這一題的輔助設定：單元自己的設定優先，沒有就用整份卷的設定 */
  function secAid(id, md) { var o = S.sec[id] || {}; if (o.aid === 0) return false; if (o.aid === 1) return true; return S.aidAt === "both" || (S.aidAt === "ans" && md === "a"); }
  function secV(id) { var o = S.sec[id] || {}; return o.v || S.vmode; }
  /* 看看這個單元有哪些輔助可以開關（抽幾題來看） */
  var CAP = {}; function caps(id) { if (CAP[id]) return CAP[id]; var c = { calc: false, aid: false, ty: D.types(id) }; for (var i = 0; i < 16; i++) { var Q = D.make(id, 9000 + i, S.lv); if (Q.calc) c.calc = true; if (Q.aid || Q.aidFn) c.aid = true; } return (CAP[id] = c); }
  function sigNow() { return seed + "|" + S.lv; }
  function save() { var c = Object.assign({}, S); sv(SK, c); }
  function shareURL() { var q = "ver=2&u=" + S.sel.join(",") + "&lv=" + S.lv + "&n=" + S.count + "&c=" + S.cols + "&o=" + S.order + "&s=" + seed + (S.big ? "&b=1" : "") + (S.title ? "&t=" + encodeURIComponent(S.title) : "") +
      "&v=" + (S.vmode === "self" ? "s" : "f") + { cell: "c", col: "l", none: "n" }[S.vgrid] + (S.vpv ? 1 : 0) + (S.vcarry ? 1 : 0) + "&ai=" + S.aidAt[0] + "&vs=" + S.vsize + (S.aidSm ? "&as=1" : "") + secURL() +
      (S.count === "alloc" ? "&al=" + S.sel.map(function (id) { return id + "*" + (S.alloc[id] == null ? 3 : S.alloc[id]); }).join(",") : "") +
      (Object.keys(ED.rr).length ? "&x=" + Object.keys(ED.rr).map(function (k) { return encodeURIComponent(k) + "~" + ED.rr[k]; }).join(",") : "") +
      (Object.keys(ED.del).length ? "&d=" + Object.keys(ED.del).map(encodeURIComponent).join(",") : "") +
      (Object.keys(ED.plus).length ? "&pl=" + Object.keys(ED.plus).map(function (k) { return k + "*" + ED.plus[k]; }).join(",") : ""); return location.href.split("#")[0] + "#" + mode + "?" + q; }
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
  function sig(Q) { return Q.id + "|" + Q.q + "|" + (Q.opts || []).join() + "|" + (Q.fig || "").length + "|" + JSON.stringify(Q.calc || "") + "|" + Q.b.map(function (b) { return b.a != null ? b.a : b.n + "/" + b.d; }).join(); }
  /* key：單元#第幾題，換題時從 rr[key] 起跳另一組亂數 */
  function genOne(id, s, key, used) { var Q, k = (ED.rr[key] || 0) * 10, k0 = k; do { Q = D.make(id, D.hash(s + ":" + key + ":" + k), S.lv, (S.sec[id] || {}).ty); k++; } while (used[sig(Q)] && k < k0 + 8); used[sig(Q)] = 1; Q.key = key; if (ED.txt[key]) { Q.q = ED.txt[key]; Q.edited = 1; } return Q; }
  function sortedSel() { return S.sel.slice().sort(function (a, b) { return NB.flat.indexOf(BY[a]) - NB.flat.indexOf(BY[b]); }); }
  /* 題數分配：平均分配、各單元自訂，再加上「加一題」 */
  function plan(n, s, rr) {
    var ids = sortedSel(), list = [], R = D.rng(D.hash("plan" + s));
    if (!ids.length) return [];
    if (n === "alloc") ids.forEach(function (id) { var c = S.alloc[id] == null ? 3 : S.alloc[id]; for (var i = 0; i < c; i++) list.push(id); });
    else for (var i = 0; i < n; i++) list.push(ids[i % ids.length]);
    ids.forEach(function (id) { for (var i = 0; i < (ED.plus[id] || 0); i++) list.push(id); });
    if (S.order === "mix") return R.shuffle(list);
    if (rr) return list;
    return list.sort(function (a, b) { return ids.indexOf(a) - ids.indexOf(b); });
  }
  function custom(c, i) { var b = c.a !== "" && c.a != null ? [D.N(/^-?\d+(\.\d+)?$/.test(c.a) ? +c.a : c.a)] : [], q = c.q; if (b.length && q.indexOf("[?]") < 0) q += " [?]"; return { id: "custom", key: "c#" + i, q: q, b: b, gap: c.gap || 0, wide: !!c.wide, custom: 1 }; }
  function makeSet(n, s, rr) { var used = {}, cnt = {}, out = []; plan(n, s, rr).forEach(function (id) { cnt[id] = (cnt[id] || 0) + 1; var key = id + "#" + cnt[id]; if (ED.del[key]) return; out.push(genOne(id, s, key, used)); }); ED.add.forEach(function (c, i) { out.push(custom(c, i)); }); return out; }
  function edits() { return Object.keys(ED.rr).length + Object.keys(ED.del).length + Object.keys(ED.txt).length + ED.add.length + Object.keys(ED.plus).reduce(function (t, k) { return t + ED.plus[k]; }, 0); }

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
    var qq = Q.q; if (Q.calc && (md === "o" || secV(Q.id) !== "none")) qq = qq.replace(/^用直式計算：/, "");
    var parts = qq.split("[?]"), k = 0, out = "", bi = Q.b.map(function (b, i) { return i; }).filter(function (i) { return Q.b[i].k !== "c"; });
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
  /* 圖：題目本身的圖（fig／figFn）＋直式（calc）＋解題小幫手（aid／aidFn，依設定顯示） */
  var VSZ = { l: [26, 0.82], m: [22, 0.8], s: [19, 0.78] };
  function vopt(md, id) { var v = id ? secV(id) : S.vmode, z = VSZ[S.vsize] || VSZ.m; return { mode: md === "o" ? "filled" : v === "none" ? "filled" : v, grid: S.vgrid, pv: S.vpv, carry: S.vcarry, u: md === "o" ? 26 : z[0], k: z[1] }; }
  function figHtml(Q, md) {
    var m = md === "a" ? "a" : "q", s = "", f = Q.figFn ? Q.figFn(m) : Q.fig;
    if (f) s += '<div class="dq-f">' + f + "</div>";
    if (Q.calc && (md === "o" || secV(Q.id) !== "none")) { try { s += '<div class="dq-f dq-calc">' + D.V.svg(Q.calc, m, vopt(md, Q.id)) + "</div>"; } catch (e) {} }
    if (md !== "o") { var a = aidHtml(Q, m); if (a && secAid(Q.id, md)) s += a; }
    return s;
  }
  function aidHtml(Q, m) { var a = Q.aidFn ? Q.aidFn(m) : Q.aid; return a ? '<div class="dq-aid"><span class="dq-aidh">解題小幫手</span>' + a + "</div>" : ""; }
  var GAP = { s: 3, m: 7, l: 14 };
  var TOOLS = '<span class="dq-tools" aria-label="這一題">' + '<button type="button" data-t="rr" title="換一題">換題</button><button type="button" data-t="ed" title="修改題目文字">改字</button><button type="button" data-t="del" title="刪掉這一題">刪除</button></span>';
  function maxW(html) { var m = 0, re = /<svg[^>]*?width="(\d+)"/g, x; while ((x = re.exec(html))) m = Math.max(m, +x[1]); return m; }
  function qItem(Q, n, md) {
    var figs = figHtml(Q, md), colW = cols() >= 3 ? 200 : cols() === 2 ? 300 : 9999;
    var wide = Q.wide || /dtab|dshapes/.test(figs) || (Q.opts && Q.opts.join("").length > 34) || Q.q.replace(/\$[^$]*\$/g, "xx").length > 70 || maxW(figs) > colW;
    var hasGrid = Q.calc && secV(Q.id) !== "none", g = (hasGrid ? Math.max(2, GAP[S.gap] - 5) : GAP[S.gap] + (Q.gap || 0) * 6) + (Q.sol && !hasGrid ? 4 : 0);
    var cMark = Q.opts ? '<span class="dq-c">' + (md === "a" ? "<b>" + "ABCD"[Q.b[0].a] + "</b>" : "　") + "</span>" : "";
    var sol = md === "a" && S.sol && Q.sol ? '<span class="dsol">' + tx("算式：" + Q.sol) + "</span>" : "";
    return '<div class="dq' + (wide ? " wide" : "") + (Q.edited ? " edited" : "") + '" style="--gap:' + g + 'mm" data-key="' + esc(Q.key || "") + '">' + (md === "q" ? TOOLS : "") + cMark + '<span class="dq-n">' + n + '.</span><span class="dq-t">' + body(Q, md) + "</span>" + figs + optsHtml(Q, md) + sol + "</div>";
  }


  /* ---------- A4 排版 ---------- */
  var WM = root + "assets/img/islander-bw.svg";
  function autoTitle() {
    if (S.title) return S.title;
    var sems = {}, chs = {}; S.sel.forEach(function (id) { var o = BY[id]; sems[o.sem] = 1; chs[o.sem + o.ch.name] = o.ch.name; });
    var sk = Object.keys(sems), ck = Object.keys(chs);
    var mid = ck.length === 1 ? chs[ck[0]] : ck.length <= 2 ? ck.map(function (k) { return chs[k]; }).join("・") : ""; return (sk.length === 1 ? sk[0] + " " : "") + (mid ? mid + " 練習卷" : "綜合練習卷");
  }
  var AUTOC = 2; function cols() { if (S.cols !== "auto") return +S.cols; return AUTOC; }
  /* 自動欄數：大部分是直式、格子不大時排 3 欄，其他 2 欄 */
  function autoCols(qs) { if (!qs.length) return 2; var c = qs.filter(function (Q) { return Q.calc && secV(Q.id) !== "none" && !(Q.aid && secAid(Q.id, "q")); }).length; return c / qs.length >= 0.8 && S.vsize !== "l" && !S.big ? 3 : 2; }
  function newPage(kind, first, title, pno) {
    var p = h('<div class="dpage p' + kind + (S.big ? " big" : "") + (S.aidSm ? " aidsm" : "") + '"><img class="dwm" src="' + WM + '" alt=""><div class="dbody"><div class="dgrid" style="--cols:' + cols() + '"></div></div><div class="dft"><span>© 蘇昊數理・數光島筆記本</span><span class="pno"></span><span>卷號 ' + seed + "</span></div></div>");
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
      if (S.order === "unit" && (S.sel.length > 1 || ED.add.length) && qs.length >= 2 * S.sel.length && Q.id !== last) { out.push({ sec: 1, html: '<div class="dsec">' + ZH[Math.min(9, out.filter(function (x) { return x.sec; }).length)] + "、" + esc(Q.custom ? "自訂題目" : BY[Q.id].title) + "</div>" }); last = Q.id; }
      out.push({ html: qItem(Q, ++n, md) });
    });
    return out;
  }
  function keyHtml(qs) {
    var s = '<div class="dkey" style="--kc:' + (S.big ? 3 : 4) + '">';
    qs.forEach(function (Q, i) { s += "<div><b>" + (i + 1) + ".</b><em>" + (Q.b.length ? tx(Q.b.map(function (b) { return esc(String(D.ansTex(b))); }).join("、")) : "（自訂題）") + "</em></div>"; });
    return s + "</div>";
  }
  function render(pv, info) {
    var title = autoTitle(), inner = pv.querySelector(".dpv-in");
    inner.innerHTML = "";
    if (!S.sel.length) return;
    var qs, n;
    if (typeof S.count === "string") {
      /* 填滿 N 頁：題數從少到多一一試排（照最後的順序與大題），留下放得下的最多題數；
         某一題特別高放不下時，再往後多試幾個題數，避免太早停下來。 */
      var N = +S.count.slice(1), tmp = h('<div style="position:absolute;visibility:hidden;left:-9999px;top:0"></div>');
      document.body.appendChild(tmp); AUTOC = autoCols(makeSet(40, seed));
      function pagesOf(list) { tmp.innerHTML = ""; return flow(tmp, buildItems(list, "q").map(function (x) { return x.html; }), "q", title, 0).pages.length; }
      var best = null, fails = 0;
      for (var nn = 1; nn <= 150 && fails < 6; nn++) { var cand = makeSet(nn, seed); if (pagesOf(cand) <= N) { best = cand; fails = 0; } else fails++; }
      qs = best || makeSet(1, seed);
      document.body.removeChild(tmp);
    } else { qs = makeSet(S.count === "alloc" ? "alloc" : +S.count, seed); AUTOC = autoCols(qs); }
    n = qs.length; CUR = { qs: qs, title: title };
    var fq = flow(inner, buildItems(qs, "q").map(function (x) { return x.html; }), "q", title, 0);
    var fa = flow(inner, buildItems(qs, "a").map(function (x) { return x.html; }), "a", title, 0);
    var fk = flow(inner, [keyHtml(qs)], "k", title, 0);
    inner.querySelectorAll(".dqn").forEach(function (e) { e.textContent = n; });
    info.textContent = (LEGACY ? "舊版連結（已用當時的題型重現）・" : "") + "共 " + n + " 題・題目卷 " + fq.pages.length + " 頁・答案卷 " + fa.pages.length + " 頁"; if (window.__edBar) window.__edBar();
    showView(pv); fit(pv);
  }
  function showView(pv) { var inner = pv.querySelector(".dpv-in"); inner.querySelectorAll(".dpage").forEach(function (p) { p.style.display = p.classList.contains("p" + S.view) ? "" : "none"; }); fit(pv); }
  function fit(pv) { var inner = pv.querySelector(".dpv-in"); if (!inner) return; var w = pv.clientWidth, pw = 210 * 96 / 25.4, s = Math.min(1, w / pw); inner.style.transform = "scale(" + s + ")"; var hh = 0; inner.querySelectorAll(".dpage").forEach(function (p) { if (p.style.display !== "none") hh += p.offsetHeight + 30; }); pv.style.height = Math.ceil(hh * s) + "px"; }

  /* ---------- 列印模式 ---------- */
  function printMode() {
    side.innerHTML = ""; main.innerHTML = "";
    side.appendChild(foldable(pickerBox(), "pick"));
    var st = h('<section class="sheet"><h2><span class="dr-step">2</span>卷面設定</h2></section>');
    st.appendChild(lvRow());
    st.appendChild(h('<label class="dr-lab" for="dr-title">標題（空白就自動命名）</label>'));
    var ti = h('<input id="dr-title" class="dr-in" maxlength="40" placeholder="例如：五上 第六章 練習卷">'); ti.value = S.title; ti.oninput = function () { S.title = ti.value.trim(); changedSoft(); }; st.appendChild(ti);
    var two = h('<div class="dr-two"><div><label class="dr-lab" for="dr-n">題數</label><select id="dr-n" class="dr-sel"><option value="p1">填滿 1 頁</option><option value="p2">填滿 2 頁</option><option value="p3">填滿 3 頁</option><option value="10">10 題</option><option value="20">20 題</option><option value="25">25 題</option><option value="30">30 題</option><option value="40">40 題</option><option value="50">50 題</option><option value="alloc">各單元自訂題數</option></select></div>' +
      '<div><label class="dr-lab" for="dr-c">欄數</label><select id="dr-c" class="dr-sel"><option value="auto">自動（直式多時 3 欄）</option><option value="1">1 欄</option><option value="2">2 欄</option><option value="3">3 欄</option></select></div>' +
      '<div><label class="dr-lab" for="dr-g">作答空間</label><select id="dr-g" class="dr-sel"><option value="s">緊湊</option><option value="m">適中</option><option value="l">寬鬆</option></select></div>' +
      '<div><label class="dr-lab" for="dr-o">題目順序</label><select id="dr-o" class="dr-sel"><option value="unit">依單元分大題</option><option value="mix">全部打散</option></select></div></div>');
    st.appendChild(two);
    function bindSel(id, key, num) { var e = two.querySelector(id); e.value = String(S[key]); e.onchange = function () { S[key] = num && /^\d+$/.test(e.value) ? +e.value : e.value; changed(); }; }
    bindSel("#dr-n", "count", 1); bindSel("#dr-c", "cols", 1); bindSel("#dr-g", "gap"); bindSel("#dr-o", "order");
    /* 各單元自訂題數 */
    var al = h('<div class="dr-alloc" hidden></div>'); st.appendChild(al);
    function drawAlloc() {
      al.hidden = S.count !== "alloc"; if (al.hidden) return; al.innerHTML = "";
      if (!S.sel.length) { al.appendChild(h('<p class="dr-note">先選單元。</p>')); return; }
      sortedSel().forEach(function (id) {
        var v = S.alloc[id] == null ? 3 : S.alloc[id], r = h('<div class="dr-al"><span>' + esc(secName(id)) + '</span><span class="dr-step2"><button type="button" aria-label="少一題">−</button><b>' + v + '</b><button type="button" aria-label="多一題">＋</button></span></div>');
        var bs = r.querySelectorAll("button"), out = r.querySelector("b");
        bs[0].onclick = function () { S.alloc[id] = Math.max(0, (S.alloc[id] == null ? 3 : S.alloc[id]) - 1); out.textContent = S.alloc[id]; changedSoft(); };
        bs[1].onclick = function () { S.alloc[id] = Math.min(30, (S.alloc[id] == null ? 3 : S.alloc[id]) + 1); out.textContent = S.alloc[id]; changedSoft(); };
        al.appendChild(r);
      });
    }
    two.querySelector("#dr-n").addEventListener("change", drawAlloc); drawAlloc(); allocHook = drawAlloc;
    [["big", "大字版（低年級建議）"], ["head", "卷頭有班級、座號、姓名"], ["score", "加上得分欄"], ["sol", "答案卷附算式（應用題）"]].forEach(function (p) { var c = h('<label class="dr-chk"><input type="checkbox">' + p[1] + "</label>"), i = c.firstChild; i.checked = !!S[p[0]]; i.onchange = function () { S[p[0]] = i.checked; changed(); }; st.appendChild(c); });
    st.appendChild(h('<label class="dr-lab" for="dr-seed">卷號（同一個卷號、同樣設定，會出一模一樣的卷）</label>'));
    var sd = h('<div class="dr-seed"><input id="dr-seed" class="dr-in" inputmode="numeric" maxlength="9"><button type="button" class="pen">換一批</button></div>'), si = sd.firstChild;
    si.value = seed; si.onchange = function () { var v = parseInt(si.value.replace(/\D/g, "")); if (v) { seed = v; changed(); } else si.value = seed; };
    sd.lastChild.onclick = function () { if (LEGACY) { LEGACY = false; Object.keys(S.sec).forEach(function (id) { if (S.sec[id].ty && S.sec[id].ty.length === 1 && S.sec[id].ty[0] === 0) delete S.sec[id].ty; }); secHook(); } seed = rseed(); si.value = seed; changed(); };
    st.appendChild(sd);
    var bt = h('<div class="dr-btns"><button type="button" class="pen go" data-p="q">列印題目卷</button><button type="button" class="pen" data-p="a">列印答案卷</button><button type="button" class="pen" data-p="qa">題目卷＋答案卷一起印</button><button type="button" class="pen" data-p="k">只印簡答</button><button type="button" class="pen" data-share>複製這份卷的分享連結</button></div>');
    bt.querySelectorAll("[data-p]").forEach(function (b) { b.onclick = function () { doPrint(b.dataset.p); }; });
    bt.querySelector("[data-share]").onclick = function () { copy(shareURL(), bt.querySelector("[data-share]")); };
    st.appendChild(bt);
    st.appendChild(h('<p class="dr-note">列印時請選 A4、縮放 100%（或「預設」），並關閉瀏覽器的頁首頁尾。手機也能印；版面以電腦的 Chrome、Edge 最準。</p>'));
    side.appendChild(foldable(st, "paper"));
    /* 3. 直式與解題小幫手 */
    var vs = h('<section class="sheet"><h2><span class="dr-step">3</span>直式與解題小幫手</h2>' +
      '<div class="dr-two"><div><label class="dr-lab" for="dr-vm">直式題目</label><select id="dr-vm" class="dr-sel"><option value="filled">直式已列好</option><option value="self">自己列直式（只給空白方格）</option></select></div>' +
      '<div><label class="dr-lab" for="dr-vg">對位格線</label><select id="dr-vg" class="dr-sel"><option value="cell">虛線方格</option><option value="col">只有直的對位線</option><option value="none">不要格線</option></select></div></div>' +
      '<label class="dr-lab" for="dr-vz">直式格子大小</label><select id="dr-vz" class="dr-sel"><option value="l">大（低年級）</option><option value="m">中</option><option value="s">小（一頁放比較多）</option></select><label class="dr-chk"><input type="checkbox" id="dr-vp">標出位值（萬千百十個．十分位…）</label><label class="dr-chk"><input type="checkbox" id="dr-vc">留進位、退位小格</label>' +
      '<label class="dr-lab" for="dr-ai">解題小幫手（線段圖、十格框、積木、時間軸……）</label><select id="dr-ai" class="dr-sel"><option value="both">題目卷和答案卷都附</option><option value="ans">只附在答案卷</option><option value="none">不附</option></select><label class="dr-chk"><input type="checkbox" id="dr-as">縮小小幫手圖（一頁放比較多）</label>' +
      '<p class="dr-note">答案卷的直式會寫出完整過程：進位、退位、部分積、長除法每一步。</p></section>');
    [["#dr-vm", "vmode"], ["#dr-vg", "vgrid"], ["#dr-ai", "aidAt"], ["#dr-vz", "vsize"]].forEach(function (p) { var e = vs.querySelector(p[0]); e.value = S[p[1]]; e.onchange = function () { S[p[1]] = e.value; changed(); }; });
    [["#dr-vp", "vpv"], ["#dr-vc", "vcarry"], ["#dr-as", "aidSm"]].forEach(function (p) { var e = vs.querySelector(p[0]); e.checked = !!S[p[1]]; e.onchange = function () { S[p[1]] = e.checked; changed(); }; });
    var sl = h('<div class="dr-secopt"></div>'); vs.appendChild(sl);
    function drawSec() {
      sl.innerHTML = ""; var ids = sortedSel().filter(function (id) { var c = caps(id); return c.calc || c.aid || c.ty.length > 1; });
      if (!ids.length) return;
      sl.appendChild(h('<label class="dr-lab">各單元分別設定（題型、小幫手、直式；沒動過的照上面的設定）</label>'));
      ids.forEach(function (id) {
        var c = caps(id), o = S.sec[id] || {}, r = h('<div class="dr-so"><span class="dr-so-n">' + esc(secName(id)) + '</span><span class="dr-so-c"></span></div>'), box = r.lastChild;
        function seg(label, vals, cur, set) { var g = h('<span class="dr-seg sm" role="group" aria-label="' + label + '"></span>'); vals.forEach(function (v) { var b = h('<button type="button">' + v[1] + "</button>"); if (cur === v[0]) b.classList.add("on"); b.onclick = function () { set(v[0]); S.sec[id] = Object.assign({}, S.sec[id] || {}); var x = S.sec[id]; if (label === "小幫手") { if (v[0] == null) delete x.aid; else x.aid = v[0]; } else { if (v[0] == null) delete x.v; else x.v = v[0]; } drawSec(); changed(); }; g.appendChild(b); }); return g; }
        if (c.ty.length > 1) {
          box.appendChild(h('<span class="dr-so-l">題型</span>'));
          var tg = h('<span class="dr-tys"></span>'), on = o.ty && o.ty.length ? o.ty : c.ty.map(function (x, i) { return i; });
          c.ty.forEach(function (t, i) { var b = h('<button type="button" class="dr-ty" aria-pressed="' + (on.indexOf(i) >= 0) + '">' + esc(t) + "</button>"); b.onclick = function () { var cur = on.slice(), k = cur.indexOf(i); if (k >= 0) { if (cur.length === 1) return; cur.splice(k, 1); } else cur.push(i); cur.sort(); S.sec[id] = Object.assign({}, S.sec[id] || {}); if (cur.length === c.ty.length) delete S.sec[id].ty; else S.sec[id].ty = cur; drawSec(); changed(); }; tg.appendChild(b); });
          box.appendChild(tg); box.appendChild(h('<span class="dr-br"></span>'));
        }
        if (c.aid) { box.appendChild(h('<span class="dr-so-l">小幫手</span>')); box.appendChild(seg("小幫手", [[null, "照設定"], [1, "開"], [0, "關"]], o.aid == null ? null : o.aid ? 1 : 0, function () {})); }
        if (c.calc) { box.appendChild(h('<span class="dr-so-l">直式</span>')); box.appendChild(seg("直式", [[null, "照設定"], ["filled", "已列好"], ["self", "自己列"], ["none", "只要橫式"]], o.v || null, function () {})); }
        sl.appendChild(r);
      });
    }
    drawSec(); secHook = drawSec;
    side.appendChild(foldable(vs, "vert"));

    var tb = h('<div class="dr-bar"><div class="dr-seg" role="group" aria-label="預覽"><button type="button" data-v="q">題目卷</button><button type="button" data-v="a">答案卷</button><button type="button" data-v="k">簡答</button></div><span class="dr-info"></span></div>');
    var eb = h('<div class="dr-edbar"><span class="dr-edtip">滑到題目上可以「換題、改字、刪除」</span><button type="button" class="pen" data-e="add">＋ 加一題</button><button type="button" class="pen" data-e="own">＋ 自己出一題</button><button type="button" class="pen" data-e="reset" hidden>還原所有修改</button></div>');
    var pv = h('<div class="dpv"><div class="dpv-in"></div></div>'), info = tb.querySelector(".dr-info"), empty = h('<div class="dr-empty" hidden><p>先在左邊（手機在上方）選單元，這裡就會出現練習卷。</p></div>');
    empty.insertBefore(h(NB.deco.hero().outerHTML), empty.firstChild);
    function mv() { tb.querySelectorAll("[data-v]").forEach(function (b) { b.classList.toggle("on", b.dataset.v === S.view); }); }
    tb.querySelectorAll("[data-v]").forEach(function (b) { b.onclick = function () { S.view = b.dataset.v; save(); mv(); showView(pv); }; }); mv();
    main.appendChild(tb); main.appendChild(eb); main.appendChild(empty); main.appendChild(pv);
    setupEdit(pv, eb, function () { changed(); });
    var tmr = 0;
    function redo() { if (sigNow() !== edSig) { if (edits()) ED = { rr: {}, del: {}, plus: {}, txt: {}, add: [] }; edSig = sigNow(); } save(); setHash(); allocHook(); secHook(); empty.hidden = !!S.sel.length; tb.style.display = pv.style.display = eb.style.display = S.sel.length ? "" : "none"; clearTimeout(tmr); tmr = setTimeout(function () { render(pv, info); settle(pv, info); }, 60); }
    changed = redo; changedSoft = function () { clearTimeout(tmr); tmr = setTimeout(redo, 400); };
    redo();
    window.addEventListener("resize", function () { if (mode === "print") fit(pv); });
  }
  var changedSoft = function () {}, allocHook = function () {}, secHook = function () {};
  /* ---------- 卷面上的修改：換題、改字、刪除、加一題、自己出一題 ---------- */
  function dialog(title, bodyHtml, onOk) {
    var d = h('<div class="dr-dlg" role="dialog" aria-modal="true"><div class="sheet"><h2>' + esc(title) + '</h2><div class="dr-dlg-b">' + bodyHtml + '</div><div class="dp-act"><button type="button" class="pen go" data-k="ok">確定</button><button type="button" class="pen" data-k="no">取消</button></div></div></div>');
    document.body.appendChild(d);
    function close() { d.remove(); }
    d.querySelector('[data-k="no"]').onclick = close; d.addEventListener("click", function (e) { if (e.target === d) close(); });
    d.querySelector('[data-k="ok"]').onclick = function () { if (onOk(d) !== false) close(); };
    var f = d.querySelector("textarea,input,select"); if (f) f.focus();
    return d;
  }
  function setupEdit(pv, eb, redraw) {
    window.__edBar = function () { var n = edits(), r = eb.querySelector('[data-e="reset"]'); r.hidden = !n; r.textContent = "還原所有修改（" + n + "）"; };
    pv.addEventListener("click", function (e) {
      var b = e.target.closest(".dq-tools button"); if (!b) return; var item = b.closest(".dq"), key = item.dataset.key, t = b.dataset.t, Q = CUR && CUR.qs.filter(function (x) { return x.key === key; })[0]; if (!Q) return;
      if (t === "rr") { if (Q.custom) return; ED.rr[key] = (ED.rr[key] || 0) + 1; delete ED.txt[key]; redraw(); }
      else if (t === "del") { if (Q.custom) { ED.add.splice(+key.split("#")[1], 1); } else ED.del[key] = 1; redraw(); }
      else if (t === "ed") {
        var n0 = (Q.q.match(/\[\?\]/g) || []).length;
        dialog("修改題目文字", '<p class="dr-note">直接改字就好。<b>[?]</b> 是作答的空格，請保留 ' + n0 + ' 個，答案才對得上。數字改了，答案不會跟著變，記得自己檢查。</p><textarea class="dr-in" rows="4"></textarea>', function (d) {
          var v = d.querySelector("textarea").value.trim(); if (!v) return false;
          if ((v.match(/\[\?\]/g) || []).length !== n0) { d.querySelector(".dr-note").innerHTML = '<b style="color:var(--p1)">空格數量要和原本一樣（' + n0 + " 個 [?]）。</b>"; return false; }
          v = v.replace(/[<>]/g, ""); if (Q.custom) ED.add[+key.split("#")[1]].q = v; else ED.txt[key] = v; redraw();
        }).querySelector("textarea").value = Q.q;
      }
    });
    eb.addEventListener("click", function (e) {
      var b = e.target.closest("[data-e]"); if (!b) return; var t = b.dataset.e;
      if (t === "reset") { ED = { rr: {}, del: {}, plus: {}, txt: {}, add: [] }; redraw(); return; }
      if (t === "add") {
        var opts = sortedSel().map(function (id) { return '<option value="' + id + '">' + esc(secName(id)) + "</option>"; }).join("");
        dialog("加一題", '<label class="dr-lab">從哪個單元加</label><select class="dr-sel">' + opts + "</select>", function (d) { var id = d.querySelector("select").value; ED.plus[id] = (ED.plus[id] || 0) + 1; redraw(); });
      }
      if (t === "own") {
        dialog("自己出一題", '<label class="dr-lab">題目（用 [?] 表示要填答的空格；不寫就放在最後）</label><textarea class="dr-in" rows="4" placeholder="例如：一盒蛋有 12 顆，3 盒共有 [?] 顆。"></textarea><label class="dr-lab">答案（可留白；會出現在答案卷）</label><input class="dr-in" maxlength="40"><label class="dr-lab">作答空間</label><select class="dr-sel"><option value="0">一般</option><option value="2">多一些</option><option value="4">很多（應用題、畫圖）</option></select><label class="dr-chk"><input type="checkbox">這題占整行</label>', function (d) {
          var q = d.querySelector("textarea").value.trim(); if (!q) return false;
          ED.add.push({ q: q.replace(/[<>]/g, ""), a: d.querySelector("input.dr-in").value.trim(), gap: +d.querySelector("select").value, wide: d.querySelector('input[type="checkbox"]').checked }); redraw();
        });
      }
    });
  }
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
    if (!ok && i < 0) REC.wrong.unshift({ k: k, id: Q.id, seed: Q.seed, lv: Q.lv, vi: Q.vi, t: Date.now() });
    if (ok && i >= 0 && P && P.redo) REC.wrong.splice(i, 1);
    REC.wrong = REC.wrong.slice(0, 200); sv(RK, REC);
  }
  var P = null; /* 一輪練習 */
  function onlineMode() {
    side.innerHTML = ""; main.innerHTML = "";
    side.appendChild(foldable(pickerBox(), "pick"));
    var st = h('<section class="sheet"><h2><span class="dr-step">2</span>練習設定</h2></section>');
    st.appendChild(lvRow());
    var two = h('<div class="dr-two"><div><label class="dr-lab" for="dp-n">題數</label><select id="dp-n" class="dr-sel"><option value="10">10 題</option><option value="20">20 題</option><option value="30">30 題</option><option value="0">無限（自己按結束）</option></select></div><div><label class="dr-lab">&nbsp;</label><label class="dr-chk"><input type="checkbox" id="dp-t">顯示計時</label></div></div>');
    var ns = two.querySelector("#dp-n"), tc = two.querySelector("#dp-t"); ns.value = String(S.on); tc.checked = S.otime; ns.onchange = function () { S.on = +ns.value; save(); }; tc.onchange = function () { S.otime = tc.checked; save(); };
    st.appendChild(two);
    var bt = h('<div class="dr-btns"><button type="button" class="pen go">開始練習</button></div>'); bt.firstChild.onclick = function () { start(false); };
    st.appendChild(bt);
    st.appendChild(h('<p class="dr-note">按 Enter 送出、再按一次下一題。分數可以填 2又1/3：整數格填 2、分子 1、分母 3；沒有整數就空著。答題紀錄只存在這台裝置。</p>'));
    side.appendChild(foldable(st, "online"));
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
    if (P.list) { var w = P.list[P.i]; return D.make(w.id, w.seed, w.lv, w.vi != null ? [w.vi] : null); }
    var R = D.rng(D.hash("on" + P.t0 + ":" + P.i)), ids = S.sel, Q, k = 0;
    do { var pid = R.pick(ids); Q = D.make(pid, rseed(), S.lv, (S.sec[pid] || {}).ty); k++; } while (P.used[sig(Q)] && k < 8);
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
    var card = h('<section class="sheet dp-card dp-pop"><p class="dp-src">' + esc(secName(Q.id)) + "・" + lvName() + '</p><div class="dp-q">' + '<div class="dq"><span class="dq-t">' + body(Q, "o") + "</span>" + figHtml(Q, "o") + optsHtml(Q, "o") + '</div></div><div class="dp-fb" aria-live="polite"></div><div class="dp-act"><button type="button" class="pen go dp-go">送出</button><button type="button" class="pen dp-skip">不會，看答案</button>' + ((Q.aid || Q.aidFn) && (S.sec[Q.id] || {}).aid !== 0 ? '<button type="button" class="pen dp-hint">提示</button>' : "") + '</div><div class="dp-hintbox" hidden></div></section>');
    main.appendChild(top); main.appendChild(card);
    card.querySelectorAll(".dsel,.dmc").forEach(function (g) { g.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b || P.answered) return; g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); }); });
    var go2 = card.querySelector(".dp-go"); go2.onclick = function () { P.answered ? (P.i++, next()) : submit(card, false); };
    card.querySelector(".dp-skip").onclick = function () { if (!P.answered) submit(card, true); };
    var hb = card.querySelector(".dp-hint"); if (hb) hb.onclick = function () { var box = card.querySelector(".dp-hintbox"); box.innerHTML = aidHtml(Q, "q"); box.hidden = false; hb.hidden = true; };
    
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
    P.answered = true; P.done++; var hbx = card.querySelector(".dp-hintbox"); if (hbx) hbx.hidden = true; var hbt = card.querySelector(".dp-hint"); if (hbt) hbt.hidden = true;
    Q.b.forEach(function (b, i) {
      var el = b.k === "n" ? card.querySelector('input[data-b="' + i + '"]') : b.k === "f" ? card.querySelector('.dinf[data-b="' + i + '"]') : null;
      if (el) { (b.k === "f" ? el.querySelectorAll("input") : [el]).forEach(function (x) { x.classList.add(res[i] ? "ok-b" : "bad-b"); x.readOnly = true; }); }
      if (b.k === "s" || b.k === "c") { var g = b.k === "c" ? card.querySelector(".dmc") : card.querySelector('.dsel[data-b="' + i + '"]'); g.querySelectorAll("button").forEach(function (x) { var right = b.k === "c" ? +x.dataset.v === b.a : x.dataset.v === String(b.a); if (right) x.classList.add("ok-b"); else if (x.getAttribute("aria-pressed") === "true") x.classList.add("bad-b"); x.disabled = true; }); }
    });
    if (all) { P.ok++; P.streak++; P.best = Math.max(P.best, P.streak); } else { P.streak = 0; P.wrong.push(Q); }
    rec(Q, all);
    var fb = card.querySelector(".dp-fb"), ans = Q.b.map(function (b) { return String(D.ansTex(b)); }).join("、");
    fb.className = "dp-fb show " + (all ? "ok" : "bad");
    fb.innerHTML = all ? "<h3>" + (P.streak >= 5 ? "連對 " + P.streak + " 題，島上又亮了一盞燈！" : "答對了！") + "</h3>" + (Q.sol ? "<p>" + tx("算式：" + Q.sol) + "</p>" : "") + worked(Q) : "<h3>" + (give ? "沒關係，看看答案" : "再想想看") + "</h3><p>正確答案：" + tx(esc(ans)) + "</p>" + (Q.sol ? "<p>" + tx("算式：" + Q.sol) + "</p>" : "") + firstFracHint(Q) + worked(Q);
    var g2 = card.querySelector(".dp-go"); g2.textContent = P.n && P.i + 1 >= P.n ? "看結果" : "下一題"; card.querySelector(".dp-skip").hidden = true; g2.focus();
    var st = main.querySelector(".dp-stat .ok"); if (st) st.textContent = P.ok;
  }
  /* 答完之後：完整直式、解題小幫手（答案版） */
  function worked(Q) { var s = ""; if (Q.calc) { try { s += '<div class="dq-f">' + D.V.svg(Q.calc, "a", vopt("o")) + "</div>"; } catch (e) {} } if (Q.figFn) s += '<div class="dq-f">' + Q.figFn("a") + "</div>"; var a = aidHtml(Q, "a"); if (a) s += a; return s ? '<div class="dp-worked">' + s + "</div>" : ""; }
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
    var W = P.wrong.map(function (Q) { return { id: Q.id, seed: Q.seed, lv: Q.lv, vi: Q.vi }; });
    s.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { var a = b.dataset.a; if (a === "again") { P.list ? start(true, P.list) : start(false); } else if (a === "redo") start(true, W); else { mode = "log"; go(); } }; });
    P = null;
  }

  /* ---------- 練習紀錄 ---------- */
  function logMode() {
    side.innerHTML = ""; main.innerHTML = ""; REC = ld(RK, { u: {}, wrong: [], ss: [] });
    var tot = 0, ok = 0; Object.keys(REC.u).forEach(function (k) { tot += REC.u[k].n; ok += REC.u[k].c; });
    var a = h('<section class="sheet"><h2>總覽</h2><p class="dp-big" style="font-size:2.2rem">' + tot + ' <small style="font-size:1rem;color:var(--soft)">題</small></p><p class="meta">答對率 ' + (tot ? Math.round((ok / tot) * 100) : 0) + "%・錯題本 " + REC.wrong.length + ' 題</p><div class="dr-btns"></div><p class="dr-note">紀錄只存在這台裝置的瀏覽器，不會上傳；換裝置或清除瀏覽資料就會不見。</p></section>');
    var bt = a.querySelector(".dr-btns");
    if (REC.wrong.length) { var r = h('<button type="button" class="pen go">錯題本重練（最多 20 題）</button>'); r.onclick = function () { mode = "online"; go(true); start(true, REC.wrong.slice(0, 20).map(function (w) { return { id: w.id, seed: w.seed, lv: w.lv, vi: w.vi }; })); }; bt.appendChild(r); }
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
