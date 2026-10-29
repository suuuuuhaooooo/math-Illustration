/* 無限出題：核心（純前端，不呼叫後端）
   - 可重現亂數：同一個卷號（seed）永遠出同一份卷
   - 題目格式：{ q:"題幹，[?] 是空格", b:[空格…], fig:"SVG/HTML", opts:[選項], sol:"算式", wide:true }
   - 空格種類：n 數字、f 分數、s 符號/文字選一個、c 選擇題
   產生器登記在 DR.def("6u-1.3", function(R, lv){ … })，lv：1 基礎、2 標準、3 挑戰 */
(function () {
  "use strict";
  var DR = (window.DR = { G: {}, ids: [] });

  /* ---------- 亂數 ---------- */
  function mul32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  DR.hash = function (s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  DR.rng = function (seed) {
    var f = mul32(seed >>> 0), R = {};
    R.f = f;
    R.int = function (a, b) { return a + Math.floor(f() * (b - a + 1)); };
    R.pick = function (a) { return a[Math.floor(f() * a.length)]; };
    R.chance = function (p) { return f() < p; };
    R.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    R.ex = function (a, b, ex) { var v, n = 0; do { v = R.int(a, b); } while (ex.indexOf(v) >= 0 && ++n < 60); return v; };
    R.lv = function (lv, a1, a2, a3) { return lv <= 1 ? a1 : lv === 2 ? a2 : a3; };
    R.name = function () { return R.pick(NAMES); };
    R.names = function (k) { return R.shuffle(NAMES).slice(0, k); };
    return R;
  };
  var NAMES = ["小安", "小宇", "小晴", "阿凱", "小芳", "志明", "小萱", "家豪", "佳穎", "小翔", "小恩", "阿哲", "小薇", "子軒", "品妍", "冠宇"];

  /* ---------- 數學小工具 ---------- */
  var gcd = (DR.gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; });
  DR.lcm = function (a, b) { return (a / gcd(a, b)) * b; };
  DR.rd = function (x, k) { var p = Math.pow(10, k == null ? 9 : k); return Math.round(x * p) / p; };
  DR.isPrime = function (n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  DR.factors = function (n) { var r = []; for (var i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
  DR.red = function (n, d) { var g = gcd(n, d) || 1; return [n / g, d / g]; };
  DR.fadd = function (a, b) { return DR.red(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); };
  DR.fsub = function (a, b) { return DR.red(a[0] * b[1] - b[0] * a[1], a[1] * b[1]); };
  DR.fmul = function (a, b) { return DR.red(a[0] * b[0], a[1] * b[1]); };
  DR.fdiv = function (a, b) { return DR.red(a[0] * b[1], a[1] * b[0]); };
  /* 數字顯示：五位數以上加千分位 */
  var fmt = (DR.fmt = function (x) {
    if (typeof x !== "number") return String(x);
    x = DR.rd(x, 9); var s = String(Math.abs(x)), neg = x < 0 ? "-" : "";
    if (/e/.test(s)) s = Math.abs(x).toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
    var p = s.split("."); if (p[0].length >= 5) p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return neg + p.join(".");
  });
  /* 分數 LaTeX：fx(7,3) → 2又1/3；fx(7,3,1) 保持假分數 */
  DR.fx = function (n, d, improper) {
    if (d === 1) return String(n);
    if (!improper && n > d) { var w = Math.floor(n / d), r = n % d; return r ? w + "\\frac{" + r + "}{" + d + "}" : String(w); }
    return "\\frac{" + n + "}{" + d + "}";
  };
  DR.$f = function (n, d, imp) { return "$" + DR.fx(n, d, imp) + "$"; };

  /* ---------- 空格 ---------- */
  DR.N = function (a, u, o) { var b = { k: "n", a: a, u: u || "" }; if (o) for (var k in o) b[k] = o[k]; return b; };
  /* 分數空格：預設必須是最簡分數；假分數答案預設要寫成帶分數（mixed:true），improper:true 則接受假分數 */
  DR.F = function (n, d, o) {
    o = o || {}; var r = DR.red(n, d), b = { k: "f", n: r[0], d: r[1], u: o.u || "", simp: o.simp !== false };
    if (o.simp === false) { b.n = n; b.d = d; }
    b.mixed = !o.improper && b.n > b.d; if (b.mixed) { b.w = Math.floor(b.n / b.d); b.r = b.n % b.d; }
    return b;
  };
  /* 自動：整數就用數字空格 */
  DR.FA = function (n, d, o) { var r = DR.red(n, d); if (r[1] === 1) return DR.N(r[0], (o && o.u) || ""); return DR.F(r[0], r[1], o); };
  DR.S = function (opts, a, u) { return { k: "s", o: opts, a: a, u: u || "" }; };
  DR.C = function (i) { return { k: "c", a: i }; };
  /* 選擇題：正確答案放第一個，函式會打亂並記下位置 */
  DR.mc = function (R, q, right, wrongs, extra) {
    var all = [right].concat(wrongs.filter(function (w, i, a) { return String(w) !== String(right) && a.indexOf(w) === i; })).slice(0, 4);
    var sh = R.shuffle(all.map(function (t, i) { return { t: t, ok: i === 0 }; })), idx = 0;
    sh.forEach(function (o, i) { if (o.ok) idx = i; });
    var Q = { q: q, b: [DR.C(idx)], opts: sh.map(function (o) { return String(o.t); }) };
    if (extra) for (var k in extra) Q[k] = extra[k];
    return Q;
  };
  DR.cmp = function (a, b) { return a > b ? ">" : a < b ? "<" : "="; };
  DR.CMP = [">", "<", "="];

  /* ---------- 登記 ---------- */
  DR.def = function (ids, fn, o) { (Array.isArray(ids) ? ids : [ids]).forEach(function (id) { if (!DR.G[id]) DR.ids.push(id); DR.G[id] = { f: fn, o: o || {} }; }); };
  DR.has = function (id) { return !!DR.G[id]; };
  DR.make = function (id, seed, lv) {
    var g = DR.G[id]; if (!g) return null;
    var R = DR.rng(DR.hash(id + "|" + seed + "|" + lv)), Q = g.f(R, lv || 2);
    if (!Q.b) Q.b = []; Q.id = id; Q.seed = seed; Q.lv = lv || 2;
    if (Q.q.indexOf("[?]") < 0 && Q.b.length && Q.b[0].k !== "c") Q.q += Q.b.map(function () { return "[?]"; }).join("　");
    return Q;
  };

  /* ---------- 批改 ---------- */
  var FW = "０１２３４５６７８９．，－／";
  function norm(s) { s = String(s == null ? "" : s).trim(); var o = ""; for (var i = 0; i < s.length; i++) { var k = FW.indexOf(s[i]); o += k < 0 ? s[i] : k < 10 ? String(k) : ".,-/"[k - 10]; } return o.replace(/[,\s]/g, ""); }
  DR.norm = norm;
  function num(s) { s = norm(s); if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN; return parseFloat(s); }
  DR.check = function (b, v) {
    if (b.k === "n") { if (typeof b.a === "string") return norm(v) === norm(b.a); var x = num(v); return !isNaN(x) && Math.abs(x - b.a) < 1e-9; }
    if (b.k === "s") return String(v) === String(b.a);
    if (b.k === "c") return +v === b.a;
    if (b.k === "f") {
      v = v || {}; var w = v.w === "" || v.w == null ? 0 : num(v.w), n = num(v.n), d = num(v.d);
      if (isNaN(w) || isNaN(n) || isNaN(d) || d <= 0 || n < 0 || n % 1 || d % 1 || w % 1) return false;
      var tn = w * d + n; if (tn * b.d !== b.n * d) return false;           /* 數值不同 */
      if (b.simp && gcd(n, d) !== 1) return false;                           /* 要最簡 */
      if (b.mixed && (n >= d || !w)) return false;                           /* 要寫成帶分數 */
      if (!b.mixed && w && b.n < b.d) return false;
      return true;
    }
    return false;
  };
  /* 答案的文字（簡答、線上公布答案用） */
  DR.ansTex = function (b, opts) {
    if (b.k === "n") return typeof b.a === "number" ? fmt(b.a) : b.a;
    if (b.k === "f") return "$" + (b.mixed ? b.w + "\\frac{" + b.r + "}{" + b.d + "}" : "\\frac{" + b.n + "}{" + b.d + "}") + "$";
    if (b.k === "s") return b.a;
    if (b.k === "c") return "(" + "ABCDEF"[b.a] + ")";
    return "";
  };

  /* ---------- 圖形（SVG 字串，線條用 currentColor，列印時是黑色） ---------- */
  var F = (DR.fig = {});
  function A(o) { var s = ""; for (var k in o) if (o[k] != null) s += " " + k + '="' + o[k] + '"'; return s; }
  F.svg = function (w, h, body, o) { o = o || {}; var sc = o.k || 1; return '<svg class="dfig' + (o.cls ? " " + o.cls : "") + '" viewBox="0 0 ' + w + " " + h + '" width="' + Math.round(w * sc) + '" height="' + Math.round(h * sc) + '" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="inherit">' + body + "</svg>"; };
  F.T = function (x, y, s, o) { o = o || {}; return "<text" + A({ x: x, y: y, "text-anchor": o.a || "middle", "dominant-baseline": o.b || "middle", "font-size": o.z || 14, fill: o.c || "currentColor", stroke: "none", "font-weight": o.w }) + ">" + s + "</text>"; };
  F.L = function (x1, y1, x2, y2, o) { o = o || {}; return "<line" + A({ x1: x1, y1: y1, x2: x2, y2: y2, "stroke-width": o.w, "stroke-dasharray": o.d, stroke: o.c }) + "/>"; };
  F.P = function (pts, o) { o = o || {}; return "<polygon" + A({ points: pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "), fill: o.f || "none", "fill-opacity": o.fo, "stroke-width": o.w, "stroke-dasharray": o.d }) + "/>"; };
  var TINT = { r: "#e58a73", b: "#78a9e0", g: "#7fc3a0", y: "#ecc566", p: "#b7a5e6" };
  F.tint = TINT;
  /* 點點（十格框排法） */
  F.dots = function (n, o) {
    o = o || {}; var per = o.per || 5, gs = o.group || 10, r = 9, gap = 22, groups = Math.ceil(n / gs) || 1, s = "", gx = 0;
    var gw = per * gap + 10, rows = Math.ceil(gs / per), gh = rows * gap + 10;
    for (var g = 0; g < groups; g++) {
      var inG = Math.min(gs, n - g * gs); s += '<rect x="' + (g * (gw + 12)) + '" y="2" width="' + gw + '" height="' + gh + '" rx="6" stroke-dasharray="3 4" opacity=".5"/>';
      for (var i = 0; i < inG; i++) { var cx = g * (gw + 12) + 16 + (i % per) * gap, cy = 18 + Math.floor(i / per) * gap; s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (o.c || TINT.r) + '" fill-opacity=".85"/>'; }
      gx = (g + 1) * (gw + 12);
    }
    if (!n) s = '<rect x="0" y="2" width="' + gw + '" height="' + gh + '" rx="6" stroke-dasharray="3 4" opacity=".5"/>';
    return F.svg(Math.max(gx - 10, gw + 4), gh + 6, s, { k: o.k || 0.8 });
  };
  /* 一排圖形，可標出第幾個 */
  F.row = function (n, hi, o) {
    o = o || {}; var s = "", w = 34;
    for (var i = 0; i < n; i++) { var x = 10 + i * w, on = i === hi; s += '<circle cx="' + (x + 12) + '" cy="20" r="12" fill="' + (on ? TINT.r : TINT.b) + '" fill-opacity="' + (on ? 1 : 0.35) + '"' + (on ? ' stroke-width="2.4"' : "") + "/>"; }
    if (o.lr) s += F.T(10, 48, "左", { a: "start", z: 12 }) + F.T(n * w, 48, "右", { a: "end", z: 12 });
    return F.svg(n * w + 14, o.lr ? 58 : 40, s, { k: 0.85 });
  };
  /* 時鐘 */
  F.clock = function (h, m, o) {
    o = o || {}; var s = '<circle cx="60" cy="60" r="54" stroke-width="2.4"/>', i, a;
    for (i = 0; i < 60; i++) { a = (i * 6 * Math.PI) / 180; var r1 = i % 5 ? 50 : 46; s += F.L(60 + 53 * Math.sin(a), 60 - 53 * Math.cos(a), 60 + r1 * Math.sin(a), 60 - r1 * Math.cos(a), { w: i % 5 ? 0.8 : 1.6 }); }
    for (i = 1; i <= 12; i++) { a = (i * 30 * Math.PI) / 180; s += F.T(60 + 38 * Math.sin(a), 61 - 38 * Math.cos(a), i, { z: 12 }); }
    var ha = (((h % 12) + m / 60) * 30 * Math.PI) / 180, ma = (m * 6 * Math.PI) / 180;
    s += F.L(60, 60, 60 + 26 * Math.sin(ha), 60 - 26 * Math.cos(ha), { w: 4.2 }) + F.L(60, 60, 60 + 42 * Math.sin(ma), 60 - 42 * Math.cos(ma), { w: 2.4, c: o.mc }) + '<circle cx="60" cy="60" r="3.5" fill="currentColor"/>';
    return F.svg(120, 120, s, { k: o.k || 0.95 });
  };
  F.digital = function (t) { return '<span class="dclock">' + t + "</span>"; };
  /* 直尺（公分，可含毫米），物件從 a 到 b */
  F.ruler = function (a, b, o) {
    o = o || {}; var len = Math.ceil(b) + 1, u = o.mm ? 30 : 26, W = len * u + 24, s = '<rect x="8" y="40" width="' + (len * u + 8) + '" height="34" rx="3" fill="' + TINT.y + '" fill-opacity=".25"/>';
    for (var i = 0; i <= len * (o.mm ? 10 : 1); i++) { var x = 12 + (i * u) / (o.mm ? 10 : 1), big = o.mm ? i % 10 === 0 : true, mid = o.mm && i % 5 === 0; s += F.L(x, 40, x, 40 + (big ? 14 : mid ? 10 : 6), { w: big ? 1.4 : 0.8 }); if (big) s += F.T(x, 64, o.mm ? i / 10 : i, { z: 11 }); }
    s += '<rect x="' + (12 + a * u) + '" y="14" width="' + ((b - a) * u) + '" height="16" rx="3" fill="' + TINT.r + '" fill-opacity=".8"/>';
    s += F.L(12 + a * u, 12, 12 + a * u, 40, { d: "2 3", w: 0.8 }) + F.L(12 + b * u, 12, 12 + b * u, 40, { d: "2 3", w: 0.8 });
    return F.svg(W, 80, s, { k: o.k || 0.8 });
  };
  /* 數線：從 a 到 b，每 step 一格，label 每幾格標一次，q 位置畫箭頭 */
  F.nline = function (a, b, step, q, o) {
    o = o || {}; var n = Math.round((b - a) / step), W = Math.min(520, 40 * n + 40), u = (W - 40) / n, s = F.L(14, 40, W - 10, 40, { w: 1.8 }) + '<path d="M' + (W - 16) + " 35l7 5-7 5" + '"/>';
    var lab = o.label || 1, show = o.show || function () { return true; };
    for (var i = 0; i <= n; i++) { var x = 20 + i * u, v = DR.rd(a + i * step); s += F.L(x, 33, x, 47, { w: i % lab ? 1 : 1.6 }); if (i % lab === 0 && show(v, i)) s += F.T(x, 62, o.fmt ? o.fmt(v) : fmt(v), { z: 12 }); }
    (Array.isArray(q) ? q : [q]).forEach(function (qq, k) { if (qq == null) return; var x = 20 + ((qq - a) / step) * u; s += '<path d="M' + x + " 28l-5 -9h10z" + '" fill="currentColor"/>' + F.T(x, 10, o.qlab ? o.qlab[k] : "?", { z: 13, w: 700 }); });
    return F.svg(W, 72, s, { k: o.k || 0.9 });
  };
  /* 分數圖：長條或圓，d 等分塗 n 格 */
  F.fbar = function (n, d, o) {
    o = o || {}; var W = 240, s = "", wholes = Math.max(1, Math.ceil(n / d)), y = 4;
    for (var w = 0; w < wholes; w++) { for (var i = 0; i < d; i++) { var on = w * d + i < n; s += '<rect x="' + (4 + (i * (W - 8)) / d) + '" y="' + y + '" width="' + (W - 8) / d + '" height="26" fill="' + (on ? o.c || TINT.b : "none") + '" fill-opacity=".75"/>'; } y += 34; }
    return F.svg(W, y, s, { k: o.k || 0.85 });
  };
  F.fpie = function (n, d, o) {
    o = o || {}; var s = "", r = 44, cx = 50, cy = 50;
    for (var i = 0; i < d; i++) { var a1 = (i / d) * 2 * Math.PI - Math.PI / 2, a2 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2; s += '<path d="M' + cx + " " + cy + "L" + (cx + r * Math.cos(a1)) + " " + (cy + r * Math.sin(a1)) + "A" + r + " " + r + " 0 0 1 " + (cx + r * Math.cos(a2)) + " " + (cy + r * Math.sin(a2)) + 'Z" fill="' + (i < n ? o.c || TINT.y : "none") + '" fill-opacity=".8"/>'; }
    if (d === 1) s = '<circle cx="50" cy="50" r="44" fill="' + (n ? TINT.y : "none") + '"/>';
    return F.svg(100, 100, s, { k: o.k || 0.85 });
  };
  /* 方格上的圖形：cells = [[x,y],…]，half = [[x,y,角],…] */
  F.gridShape = function (cells, o) {
    o = o || {}; var cw = o.u || 22, W = o.w || 10, H = o.h || 6, s = "";
    for (var i = 0; i <= W; i++) s += F.L(4 + i * cw, 4, 4 + i * cw, 4 + H * cw, { w: 0.5 });
    for (var j = 0; j <= H; j++) s += F.L(4, 4 + j * cw, 4 + W * cw, 4 + j * cw, { w: 0.5 });
    (o.sets || [{ cells: cells, c: TINT.g, lab: o.lab }]).forEach(function (st) {
      st.cells.forEach(function (c) { s += '<rect x="' + (4 + c[0] * cw) + '" y="' + (4 + c[1] * cw) + '" width="' + cw + '" height="' + cw + '" fill="' + st.c + '" fill-opacity=".7" stroke-width="1"/>'; });
      (st.half || []).forEach(function (c) { var x = 4 + c[0] * cw, y = 4 + c[1] * cw, P = [[x, y], [x + cw, y], [x + cw, y + cw], [x, y + cw]]; P.splice(c[2], 1); s += F.P(P, { f: st.c, fo: 0.7, w: 1 }); });
      if (st.lab) s += F.T(4 + st.lab[0] * cw + cw / 2, 4 + st.lab[1] * cw + cw / 2, st.lab[2], { z: 14, w: 700 });
    });
    return F.svg(W * cw + 8, H * cw + 8, s, { k: o.k || 0.85 });
  };
  /* 錢幣：list = [1,5,10,50,100,500,1000…] */
  F.money = function (list, o) {
    o = o || {}; var s = "", x = 6, y = 6, rowH = 0, maxW = o.maxW || 430, W = 0;
    list.forEach(function (v) {
      var bill = v >= 100 && v !== 50, w = bill ? 86 : v === 50 ? 46 : v === 10 ? 40 : v === 5 ? 36 : 32, h = bill ? 42 : w;
      if (v === 100 && !o.bill100) { bill = false; w = 44; h = 44; }
      if (x + w > maxW) { x = 6; y += rowH + 8; rowH = 0; }
      if (bill) s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + (v >= 1000 ? TINT.b : v >= 500 ? TINT.r : TINT.y) + '" fill-opacity=".35"/>' + '<rect x="' + (x + 4) + '" y="' + (y + 4) + '" width="' + (w - 8) + '" height="' + (h - 8) + '" rx="2" stroke-width=".8"/>' + F.T(x + w / 2, y + h / 2 + 1, v, { z: 15, w: 700 });
      else s += '<circle cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" r="' + w / 2 + '" fill="' + (v === 50 || v === 100 ? TINT.y : v === 1 ? "#c9c9c9" : "#d8b27a") + '" fill-opacity=".55"/><circle cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" r="' + (w / 2 - 4) + '" stroke-width=".8"/>' + F.T(x + w / 2, y + h / 2 + 1, v, { z: w > 40 ? 14 : 12, w: 700 });
      x += w + 8; rowH = Math.max(rowH, h); W = Math.max(W, x);
    });
    return F.svg(W, y + rowH + 6, s, { k: o.k || 0.8 });
  };
  /* 量角器與角 */
  F.protractor = function (deg, o) {
    o = o || {}; var cx = 130, cy = 136, r = 118, s = '<path d="M' + (cx - r) + " " + cy + "A" + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy + 'Z" fill="' + TINT.y + '" fill-opacity=".16"/>';
    for (var i = 0; i <= 180; i += 5) { var a = (i * Math.PI) / 180, l = i % 10 ? 6 : 12; s += F.L(cx + r * Math.cos(Math.PI - a), cy - r * Math.sin(Math.PI - a), cx + (r - l) * Math.cos(Math.PI - a), cy - (r - l) * Math.sin(Math.PI - a), { w: i % 10 ? 0.7 : 1.2 }); if (i % 30 === 0) s += F.T(cx + (r - 24) * Math.cos(Math.PI - a), cy - (r - 24) * Math.sin(Math.PI - a), i, { z: 11 }); }
    var b = (deg * Math.PI) / 180;
    s += F.L(cx, cy, cx + r + 6, cy, { w: 2.4, c: "#bf5b43" }) + F.L(cx, cy, cx + (r + 6) * Math.cos(b), cy - (r + 6) * Math.sin(b), { w: 2.4, c: "#bf5b43" }) + '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="currentColor"/>';
    s += '<path d="M' + (cx + 22) + " " + cy + "A22 22 0 0 0 " + (cx + 22 * Math.cos(b)) + " " + (cy - 22 * Math.sin(b)) + '" stroke="#bf5b43"/>';
    return F.svg(260, 146, s, { k: o.k || 0.9 });
  };
  F.angle = function (deg, o) {
    o = o || {}; var b = (deg * Math.PI) / 180, rot = o.rot || 0, cx = 70, cy = 90, L = 70, s = "";
    var p1 = [cx + L * Math.cos(rot), cy - L * Math.sin(rot)], p2 = [cx + L * Math.cos(rot + b), cy - L * Math.sin(rot + b)];
    s += F.L(cx, cy, p1[0], p1[1], { w: 2.2 }) + F.L(cx, cy, p2[0], p2[1], { w: 2.2 });
    if (Math.abs(deg - 90) < 0.1 && o.mark !== false) { var q = 12, ux = Math.cos(rot), uy = -Math.sin(rot), vx = Math.cos(rot + b), vy = -Math.sin(rot + b); s += '<path d="M' + (cx + q * ux) + " " + (cy + q * uy) + "L" + (cx + q * ux + q * vx) + " " + (cy + q * uy + q * vy) + "L" + (cx + q * vx) + " " + (cy + q * vy) + '"/>'; }
    else s += '<path d="M' + (cx + 18 * Math.cos(rot)) + " " + (cy - 18 * Math.sin(rot)) + "A18 18 0 " + (deg > 180 ? 1 : 0) + " 0 " + (cx + 18 * Math.cos(rot + b)) + " " + (cy - 18 * Math.sin(rot + b)) + '" stroke="#bf5b43"/>';
    if (o.lab) s += F.T(cx + 34 * Math.cos(rot + b / 2), cy - 34 * Math.sin(rot + b / 2), o.lab, { z: 13 });
    return F.svg(150, 110, s, { k: o.k || 0.85 });
  };
  /* 多邊形，邊上標字 labs[i] 對應 pts[i]→pts[i+1] */
  F.poly = function (pts, labs, o) {
    o = o || {}; var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }), mx = Math.min.apply(0, xs), my = Math.min.apply(0, ys), W = Math.max.apply(0, xs) - mx, H = Math.max.apply(0, ys) - my, pad = 30;
    var P = pts.map(function (p) { return [p[0] - mx + pad, p[1] - my + pad]; }), cx = 0, cy = 0;
    P.forEach(function (p) { cx += p[0] / P.length; cy += p[1] / P.length; });
    var s = F.P(P, { f: o.f || TINT.g, fo: o.fo == null ? 0.25 : o.fo, w: 2 });
    (labs || []).forEach(function (t, i) { if (t == null || t === "") return; var a = P[i], b = P[(i + 1) % P.length], mxp = (a[0] + b[0]) / 2, myp = (a[1] + b[1]) / 2, dx = mxp - cx, dy = myp - cy, l = Math.hypot(dx, dy) || 1; s += F.T(mxp + (dx / l) * 16, myp + (dy / l) * 14, t, { z: 13 }); });
    (o.extra || []).forEach(function (e) { s += e(P); });
    (o.vlab || []).forEach(function (t, i) { if (!t) return; var a = P[i], dx = a[0] - cx, dy = a[1] - cy, l = Math.hypot(dx, dy) || 1; s += F.T(a[0] + (dx / l) * 14, a[1] + (dy / l) * 12, t, { z: 13 }); });
    return F.svg(W + pad * 2, H + pad * 2, s, { k: o.k || 0.85 });
  };
  /* 三角形（給底與高的示意圖，含虛線高） */
  F.triH = function (bLab, hLab, o) {
    o = o || {}; var ax = o.apex == null ? 0.35 : o.apex, P = [[30, 120], [210, 120], [30 + 180 * ax, 24]];
    var s = F.P(P, { f: TINT.b, fo: 0.22, w: 2 }) + F.L(P[2][0], P[2][1], P[2][0], 120, { d: "4 4" }) + '<path d="M' + P[2][0] + " 110h10v10" + '"/>';
    s += F.T(120, 138, bLab, { z: 13 }) + F.T(P[2][0] + 8, 74, hLab, { z: 13, a: "start" });
    return F.svg(240, 148, s, { k: o.k || 0.85 });
  };
  F.para = function (bLab, hLab) { var s = F.P([[30, 120], [190, 120], [230, 30], [70, 30]], { f: TINT.y, fo: 0.25, w: 2 }) + F.L(100, 30, 100, 120, { d: "4 4" }) + '<path d="M100 110h10v10"/>' + F.T(110, 138, bLab, { z: 13 }) + F.T(106, 76, hLab, { z: 13, a: "start" }); return F.svg(250, 148, s, { k: 0.85 }); };
  F.trap = function (tLab, bLab, hLab) { var s = F.P([[20, 120], [230, 120], [170, 30], [70, 30]], { f: TINT.p, fo: 0.25, w: 2 }) + F.L(120, 30, 120, 120, { d: "4 4" }) + '<path d="M120 110h10v10"/>' + F.T(120, 18, tLab, { z: 13 }) + F.T(125, 138, bLab, { z: 13 }) + F.T(126, 76, hLab, { z: 13, a: "start" }); return F.svg(250, 148, s, { k: 0.85 }); };
  F.rect = function (wLab, hLab, o) { o = o || {}; var w = o.sq ? 110 : 170, h = o.sq ? 110 : 96; var s = '<rect x="26" y="20" width="' + w + '" height="' + h + '" fill="' + TINT.g + '" fill-opacity=".25" stroke-width="2"/>' + F.T(26 + w / 2, h + 38, wLab, { z: 13 }) + F.T(w + 34, 20 + h / 2, hLab || "", { z: 13, a: "start" }); return F.svg(w + 100, h + 50, s, { k: 0.85 }); };
  /* L 形複合圖形：大長方形 W×H 缺右上角 cw×ch */
  F.lshape = function (W, H, cw, ch, labs) {
    var k = 200 / Math.max(W, H), w = W * k, h = H * k, a = cw * k, b = ch * k, x0 = 34, y0 = 24;
    var P = [[x0, y0], [x0 + w - a, y0], [x0 + w - a, y0 + b], [x0 + w, y0 + b], [x0 + w, y0 + h], [x0, y0 + h]];
    var s = F.P(P, { f: TINT.y, fo: 0.25, w: 2 });
    s += F.T(x0 + (w - a) / 2, y0 - 10, labs[0], { z: 12 }) + F.T(x0 + w + 6, y0 + b + (h - b) / 2, labs[1], { z: 12, a: "start" }) + F.T(x0 + w / 2, y0 + h + 14, labs[2], { z: 12 }) + F.T(x0 - 6, y0 + h / 2, labs[3], { z: 12, a: "end" });
    return F.svg(w + 100, h + 50, s, { k: 0.85 });
  };
  F.circle = function (lab, o) { o = o || {}; var s = '<circle cx="80" cy="76" r="62" fill="' + TINT.b + '" fill-opacity=".2" stroke-width="2"/><circle cx="80" cy="76" r="2.5" fill="currentColor"/>'; if (o.d) s += F.L(18, 76, 142, 76, { d: "4 3" }) + F.T(80, 66, lab, { z: 13 }); else s += F.L(80, 76, 142, 76, { d: "4 3" }) + F.T(111, 66, lab, { z: 13 }); return F.svg(160, 152, s, { k: 0.8 }); };
  F.sector = function (deg, lab) {
    var r = 80, cx = 100, cy = 110, b = (deg * Math.PI) / 180, s = '<path d="M' + cx + " " + cy + "L" + (cx + r) + " " + cy + "A" + r + " " + r + " 0 " + (deg > 180 ? 1 : 0) + " 0 " + (cx + r * Math.cos(b)) + " " + (cy - r * Math.sin(b)) + 'Z" fill="' + TINT.r + '" fill-opacity=".25" stroke-width="2"/>';
    s += '<path d="M' + (cx + 18) + " " + cy + "A18 18 0 " + (deg > 180 ? 1 : 0) + " 0 " + (cx + 18 * Math.cos(b)) + " " + (cy - 18 * Math.sin(b)) + '"/>' + F.T(cx + 32 * Math.cos(b / 2), cy - 32 * Math.sin(b / 2), deg + "°", { z: 12 }) + F.T(cx + r / 2, cy + 14, lab, { z: 12 });
    return F.svg(200, 200, s, { k: 0.75 });
  };
  /* 長方體（斜二測） */
  F.cuboid = function (l, w, h, labs, o) {
    o = o || {}; var m = Math.max(l, w * 0.6, h), k = 130 / m, L = l * k, H = h * k, D = Math.max(18, w * k * 0.5), x0 = 20, y0 = 20 + D;
    var s = F.P([[x0, y0], [x0 + L, y0], [x0 + L, y0 + H], [x0, y0 + H]], { f: TINT.b, fo: 0.18, w: 2 }) + F.P([[x0, y0], [x0 + D, y0 - D], [x0 + L + D, y0 - D], [x0 + L, y0]], { f: TINT.b, fo: 0.32, w: 2 }) + F.P([[x0 + L, y0], [x0 + L + D, y0 - D], [x0 + L + D, y0 + H - D], [x0 + L, y0 + H]], { f: TINT.b, fo: 0.45, w: 2 });
    s += F.L(x0, y0 + H, x0 + D, y0 + H - D, { d: "3 4", w: 1 }) + F.L(x0 + D, y0 + H - D, x0 + L + D, y0 + H - D, { d: "3 4", w: 1 }) + F.L(x0 + D, y0 - D, x0 + D, y0 + H - D, { d: "3 4", w: 1 });
    if (labs) s += F.T(x0 + L / 2, y0 + H + 14, labs[0], { z: 12 }) + F.T(x0 + L + D / 2 + 8, y0 + H - D / 2 + 6, labs[1], { z: 12, a: "start" }) + F.T(x0 + L + D + 6, y0 - D + H / 2, labs[2], { z: 12, a: "start" });
    return F.svg(L + D + 90, H + D + 46, s, { k: o.k || 0.85 });
  };
  /* 小正方體堆成 a×b×c */
  F.cubes = function (a, b, c) {
    var u = 20, d = 10, s = "", W = a * u + b * d + 20, Ht = c * u + b * d + 20;
    for (var z = 0; z < c; z++) for (var y = b - 1; y >= 0; y--) for (var x = 0; x < a; x++) {
      var X = 10 + x * u + y * d, Y = Ht - 10 - (z + 1) * u - y * d;
      s += F.P([[X, Y], [X + u, Y], [X + u, Y + u], [X, Y + u]], { f: TINT.y, fo: 0.55, w: 1 }) + F.P([[X, Y], [X + d, Y - d], [X + u + d, Y - d], [X + u, Y]], { f: TINT.y, fo: 0.85, w: 1 }) + F.P([[X + u, Y], [X + u + d, Y - d], [X + u + d, Y + u - d], [X + u, Y + u]], { f: TINT.r, fo: 0.45, w: 1 });
    }
    return F.svg(W, Ht, s, { k: 0.9 });
  };
  F.cyl = function (rLab, hLab) { var s = '<ellipse cx="80" cy="30" rx="56" ry="16" fill="' + TINT.g + '" fill-opacity=".3" stroke-width="2"/><path d="M24 30V130M136 30V130" stroke-width="2"/><path d="M24 130A56 16 0 0 0 136 130" stroke-width="2"/><path d="M24 130A56 16 0 0 1 136 130" stroke-dasharray="4 4"/>' + F.L(80, 30, 136, 30, { d: "4 3" }) + F.T(108, 22, rLab, { z: 12 }) + F.T(142, 80, hLab, { z: 12, a: "start" }); return F.svg(200, 154, s, { k: 0.8 }); };
  /* 磅秤（指針式），max 公克 */
  F.scale = function (g, max) {
    var cx = 90, cy = 92, r = 74, s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 8) + '" stroke-width="2.4"/>', step = max / 100;
    for (var i = 0; i < 100; i++) { var a = (i / 100) * 2 * Math.PI, big = i % 10 === 0, mid = i % 5 === 0; s += F.L(cx + r * Math.sin(a), cy - r * Math.cos(a), cx + (r - (big ? 12 : mid ? 8 : 4)) * Math.sin(a), cy - (r - (big ? 12 : mid ? 8 : 4)) * Math.cos(a), { w: big ? 1.4 : 0.7 }); if (big) s += F.T(cx + (r - 24) * Math.sin(a), cy - (r - 24) * Math.cos(a), max >= 2000 ? (i * step) / 1000 : i * step, { z: max >= 2000 ? 12 : 9 }); }
    var b = (g / max) * 2 * Math.PI; s += F.L(cx, cy, cx + (r - 6) * Math.sin(b), cy - (r - 6) * Math.cos(b), { w: 2.4, c: "#bf5b43" }) + '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="currentColor"/>' + F.T(cx, cy + 34, max >= 2000 ? "公斤" : "公克", { z: 11 });
    return F.svg(180, 184, s, { k: 0.85 });
  };
  /* 量杯，ml 刻度 */
  F.cup = function (v, max, step) {
    var H = 160, top = 20, bot = top + H, s = '<path d="M30 ' + (top - 8) + "V" + bot + "H110V" + (top - 8) + '" stroke-width="2.2"/>', lvl = bot - (v / max) * H;
    s += '<rect x="31" y="' + lvl + '" width="78" height="' + (bot - lvl) + '" fill="' + TINT.b + '" fill-opacity=".45" stroke="none"/>';
    for (var x = 0; x <= max; x += step) { var y = bot - (x / max) * H, big = (x / step) % 2 === 0 || max / step <= 6; s += F.L(110, y, 110 - (big ? 16 : 9), y, { w: 1 }); if (big) s += F.T(116, y, x, { z: 10, a: "start" }); }
    s += F.T(70, bot + 14, "毫升", { z: 11 });
    return F.svg(160, bot + 24, s, { k: 0.85 });
  };
  /* 長條圖 */
  F.bars = function (labels, vals, o) {
    o = o || {}; var mx = o.max || Math.max.apply(0, vals), st = o.step || niceStep(mx), top = Math.ceil(mx / st) * st, H = 150, n = labels.length, bw = Math.min(44, 260 / n), gap = bw * 0.6, x0 = 44, W = x0 + n * (bw + gap) + 20, s = "";
    for (var v = 0; v <= top; v += st) { var y = 16 + H - (v / top) * H; s += F.L(x0, y, W - 8, y, { w: 0.5, d: v ? "2 3" : null }) + F.T(x0 - 6, y, fmt(v), { z: 10, a: "end" }); }
    s += F.L(x0, 16, x0, 16 + H, { w: 1.4 });
    labels.forEach(function (l, i) { var x = x0 + gap / 2 + i * (bw + gap), h = (vals[i] / top) * H; s += '<rect x="' + x + '" y="' + (16 + H - h) + '" width="' + bw + '" height="' + h + '" fill="' + [TINT.b, TINT.r, TINT.g, TINT.y, TINT.p][i % 5] + '" fill-opacity=".75" stroke-width="1"/>' + F.T(x + bw / 2, 16 + H + 14, l, { z: 11 }); });
    if (o.unit) s += F.T(x0 - 2, 6, "（" + o.unit + "）", { z: 10, a: "end" });
    return F.svg(W, H + 38, s, { k: o.k || 0.9 });
  };
  F.lines = function (labels, vals, o) {
    o = o || {}; var mx = Math.max.apply(0, vals), mn = o.min || 0, st = o.step || niceStep(mx - mn), top = Math.ceil(mx / st) * st, H = 150, n = labels.length, x0 = 46, dx = Math.min(56, 320 / n), W = x0 + n * dx + 16, s = "", pts = [];
    for (var v = mn; v <= top; v += st) { var y = 16 + H - ((v - mn) / (top - mn)) * H; s += F.L(x0, y, W - 8, y, { w: 0.5, d: "2 3" }) + F.T(x0 - 6, y, fmt(v), { z: 10, a: "end" }); }
    s += F.L(x0, 16, x0, 16 + H, { w: 1.4 }) + F.L(x0, 16 + H, W - 8, 16 + H, { w: 1.4 });
    labels.forEach(function (l, i) { var x = x0 + dx / 2 + i * dx, y = 16 + H - ((vals[i] - mn) / (top - mn)) * H; pts.push(x + "," + y); s += F.T(x, 16 + H + 14, l, { z: 10 }); });
    s += '<polyline points="' + pts.join(" ") + '" stroke="#bf5b43" stroke-width="2.2"/>';
    pts.forEach(function (p) { var q = p.split(","); s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.5" fill="#bf5b43" stroke="none"/>'; });
    if (o.unit) s += F.T(x0 - 2, 6, "（" + o.unit + "）", { z: 10, a: "end" });
    return F.svg(W, H + 38, s, { k: o.k || 0.9 });
  };
  function niceStep(m) { var c = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]; for (var i = 0; i < c.length; i++) if (m / c[i] <= 6) return c[i]; return Math.pow(10, Math.ceil(Math.log10(m / 6))); }
  F.pie = function (labels, pct) {
    var cx = 90, cy = 90, r = 78, s = "", a = -Math.PI / 2, cols = [TINT.b, TINT.r, TINT.g, TINT.y, TINT.p];
    pct.forEach(function (p, i) {
      var b = a + (p / 100) * 2 * Math.PI, mid = (a + b) / 2;
      s += '<path d="M' + cx + " " + cy + "L" + (cx + r * Math.cos(a)) + " " + (cy + r * Math.sin(a)) + "A" + r + " " + r + " 0 " + (p > 50 ? 1 : 0) + " 1 " + (cx + r * Math.cos(b)) + " " + (cy + r * Math.sin(b)) + 'Z" fill="' + cols[i % 5] + '" fill-opacity=".7" stroke-width="1.4"/>';
      s += F.T(cx + r * 0.6 * Math.cos(mid), cy + r * 0.6 * Math.sin(mid) - 7, labels[i], { z: 11 }) + (p >= 0 ? F.T(cx + r * 0.6 * Math.cos(mid), cy + r * 0.6 * Math.sin(mid) + 8, p + "%", { z: 11 }) : "");
      a = b;
    });
    return F.svg(180, 180, s, { k: 0.95 });
  };
  /* 平面圖形（認識形狀） */
  F.shape = function (k, o) {
    o = o || {}; var c = o.c || TINT.g, s = "";
    if (k === "圓形") s = '<circle cx="50" cy="50" r="38" fill="' + c + '" fill-opacity=".5" stroke-width="2"/>';
    else if (k === "三角形") s = F.P([[50, 12], [90, 86], [10, 86]], { f: c, fo: 0.5, w: 2 });
    else if (k === "正方形") s = '<rect x="16" y="16" width="68" height="68" fill="' + c + '" fill-opacity=".5" stroke-width="2"/>';
    else if (k === "長方形") s = '<rect x="4" y="28" width="92" height="46" fill="' + c + '" fill-opacity=".5" stroke-width="2"/>';
    else if (k === "五邊形" || k === "六邊形" || k === "八邊形") { var n = { "五邊形": 5, "六邊形": 6, "八邊形": 8 }[k], P = []; for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (i * 2 * Math.PI) / n; P.push([50 + 40 * Math.cos(a), 52 + 40 * Math.sin(a)]); } s = F.P(P, { f: c, fo: 0.5, w: 2 }); }
    else if (k === "星形") { var Q = []; for (var j = 0; j < 10; j++) { var b = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? 17 : 42; Q.push([50 + rr * Math.cos(b), 54 + rr * Math.sin(b)]); } s = F.P(Q, { f: c, fo: 0.5, w: 2 }); }
    else if (k === "菱形") s = F.P([[50, 8], [86, 50], [50, 92], [14, 50]], { f: c, fo: 0.5, w: 2 });
    else if (k === "梯形") s = F.P([[30, 24], [70, 24], [94, 80], [6, 80]], { f: c, fo: 0.5, w: 2 });
    else if (k === "平行四邊形") s = F.P([[28, 24], [96, 24], [72, 80], [4, 80]], { f: c, fo: 0.5, w: 2 });
    return F.svg(100, 100, s, { k: o.k || 0.6 });
  };
  F.shapes = function (list) { return '<span class="dshapes">' + list.map(function (k) { return F.shape(k.k || k, { k: 0.48, c: k.c }); }).join("") + "</span>"; };
  /* 長短比較的長條 */
  F.lenBars = function (lens, labs, o) {
    o = o || {}; var u = o.u || 26, s = "", W = 0, vert = o.vert;
    lens.forEach(function (l, i) {
      if (vert) { var x = 30 + i * 60, h = l * u; s += '<rect x="' + x + '" y="' + (10 + 10 * u - h) + '" width="26" height="' + h + '" rx="3" fill="' + [TINT.b, TINT.r, TINT.g, TINT.y][i % 4] + '" fill-opacity=".7"/>' + F.T(x + 13, 10 + 10 * u + 14, labs[i], { z: 13 }); W = x + 60; }
      else { var y = 8 + i * 36; s += F.T(14, y + 11, labs[i], { z: 13 }) + '<rect x="' + (30 + (o.off ? o.off[i] * u : 0)) + '" y="' + y + '" width="' + l * u + '" height="22" rx="3" fill="' + [TINT.b, TINT.r, TINT.g, TINT.y][i % 4] + '" fill-opacity=".7"/>'; W = Math.max(W, 40 + ((o.off ? o.off[i] : 0) + l) * u); }
    });
    if (o.grid) { var n = o.grid; for (var g = 0; g <= n; g++) s += F.L(30 + g * u, 2, 30 + g * u, lens.length * 36 + 4, { w: 0.5, d: "2 3" }); W = Math.max(W, 40 + n * u); }
    if (vert) { s += F.L(20, 10 + 10 * u, W - 20, 10 + 10 * u, { w: 1.6 }); return F.svg(W, 10 * u + 30, s, { k: 0.8 }); }
    return F.svg(W, lens.length * 36 + 8, s, { k: 0.8 });
  };
  /* 直式：加減乘 */
  F.vert = function (a, op, b) {
    var A2 = String(a), B = String(b), w = Math.max(A2.length, B.length + 1) + 1;
    function row(t, pre) { var cells = "", s = (pre || "") + ""; for (var i = 0; i < w; i++) { var ch = i === 0 && pre ? pre : t[t.length - (w - i)] || ""; cells += "<i>" + (ch === undefined ? "" : ch) + "</i>"; } return "<div>" + cells + "</div>"; }
    var pad = function (t) { return Array(w - t.length + 1).join(" ") + t; };
    return '<div class="dvert" style="--w:' + w + '">' + row(pad(A2)) + row(pad(B), op) + '<div class="dvl"></div>' + row(pad("")) + "</div>";
  };
  /* 直式除法（長除法框） */
  F.ldiv = function (a, b) { return '<div class="dldiv"><span class="dv-b">' + b + '</span><span class="dv-a">' + a + "</span></div>"; };
  /* 表格 */
  F.table = function (head, rows, o) {
    o = o || {}; var s = '<table class="dtab">' + (o.cap ? "<caption>" + o.cap + "</caption>" : "") + "<tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    rows.forEach(function (r) { s += "<tr>" + r.map(function (c, i) { return i === 0 && o.rowHead !== false ? "<th>" + c + "</th>" : "<td>" + c + "</td>"; }).join("") + "</tr>"; });
    return s + "</table>";
  };
  /* 月曆 */
  F.cal = function (y, m) {
    var first = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate(), s = '<table class="dtab dcal"><caption>' + y + " 年 " + m + " 月</caption><tr>" + "日一二三四五六".split("").map(function (d) { return "<th>" + d + "</th>"; }).join("") + "</tr><tr>", c = 0;
    for (var i = 0; i < first; i++) { s += "<td></td>"; c++; }
    for (var d = 1; d <= days; d++) { s += "<td>" + d + "</td>"; c++; if (c % 7 === 0 && d < days) s += "</tr><tr>"; }
    while (c % 7) { s += "<td></td>"; c++; }
    return s + "</tr></table>";
  };
  F.seqBoxes = function (items) { return '<span class="dseq">' + items.map(function (t) { return t === "?" ? '<b class="dseq-q">?</b>' : "<span>" + t + "</span>"; }).join("") + "</span>"; };
})();
