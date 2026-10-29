/* 製圖加值包：函數圖、立體圖、積木與三視圖、角度標記、尺寸標註，
   以及「把圖庫圖形拆成可編輯元件」用到的 raw 物件。

   每一種都登記在 DP.types 裡：
     { n:"中文名", a:[參數規格], init(o), svg(o), box(o) }
   參數規格跟 draw-lib 一樣（num / bool / sel / txt / area），
   draw.js 的屬性面板會照著自動長出欄位，所以之後要加新物件不用動 draw.js。 */
(function () {
  "use strict";
  var NB = window.NB = window.NB || {};
  var DP = NB.drawPlus = { types: {} };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rd(v, k) { var p = Math.pow(10, k == null ? 2 : k); return Math.round(v * p) / p; }
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }

  /* ================================================================
     一、算式解析（不用 eval，自己剖析成一棵樹再求值）
     支援 + - * / ^ 括號、負號、省略的乘號（2x、3(x+1)），
     以及 sin cos tan asin acos atan sqrt abs ln log exp floor round sign max min pow，
     常數 pi（π）與 e。
     ================================================================ */
  var FN1 = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, floor: Math.floor, ceil: Math.ceil,
    round: Math.round, sign: function (v) { return v > 0 ? 1 : v < 0 ? -1 : 0; },
    ln: Math.log, log: function (v) { return Math.log(v) / Math.LN10; },
    log2: function (v) { return Math.log(v) / Math.LN2; }
  };
  var FN2 = { max: Math.max, min: Math.min, pow: Math.pow, mod: function (a, b) { return a - b * Math.floor(a / b); } };
  var CONST = { pi: Math.PI, "π": Math.PI, e: Math.E, tau: Math.PI * 2 };

  function lex(src) {
    var s = String(src).replace(/\s+/g, ""), i = 0, out = [];
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) {
        var j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        out.push({ k: "n", v: parseFloat(s.slice(i, j)) }); i = j; continue;
      }
      if (/[A-Za-zπ_]/.test(c)) {
        var j2 = i; while (j2 < s.length && /[A-Za-z0-9π_]/.test(s[j2])) j2++;
        out.push({ k: "id", v: s.slice(i, j2).toLowerCase() === "π" ? "π" : s.slice(i, j2) }); i = j2; continue;
      }
      if ("+-*/^(),".indexOf(c) >= 0) { out.push({ k: c }); i++; continue; }
      throw new Error("看不懂的符號「" + c + "」");
    }
    return out;
  }
  /* 回傳 function(x)；解析失敗就丟 Error */
  function compile(src) {
    var ts = lex(src), p = 0;
    function peek() { return ts[p]; }
    function eat(k) { if (ts[p] && ts[p].k === k) { p++; return true; } return false; }
    function expr() {
      var a = term();
      for (;;) {
        if (eat("+")) { a = bin(a, term(), function (x, y) { return x + y; }); }
        else if (eat("-")) { a = bin(a, term(), function (x, y) { return x - y; }); }
        else return a;
      }
    }
    function bin(a, b, f) { return function (x) { return f(a(x), b(x)); }; }
    function term() {
      var a = unary();
      for (;;) {
        if (eat("*")) a = bin(a, unary(), function (x, y) { return x * y; });
        else if (eat("/")) a = bin(a, unary(), function (x, y) { return x / y; });
        else {
          /* 省略的乘號：2x、3(x+1)、2sin(x) */
          var t = peek();
          if (t && (t.k === "n" || t.k === "id" || t.k === "(")) a = bin(a, unary(), function (x, y) { return x * y; });
          else return a;
        }
      }
    }
    function unary() {
      if (eat("-")) { var a = unary(); return function (x) { return -a(x); }; }
      if (eat("+")) return unary();
      return power();
    }
    function power() {
      var a = atom();
      if (eat("^")) { var b = unary(); return function (x) { return Math.pow(a(x), b(x)); }; }
      return a;
    }
    function atom() {
      var t = peek();
      if (!t) throw new Error("算式沒寫完");
      if (t.k === "n") { p++; return function () { return t.v; }; }
      if (t.k === "(") { p++; var a = expr(); if (!eat(")")) throw new Error("少了一個右括號"); return a; }
      if (t.k === "id") {
        p++; var nm = t.v;
        if (eat("(")) {
          var args = [expr()];
          while (eat(",")) args.push(expr());
          if (!eat(")")) throw new Error("少了一個右括號");
          if (FN1[nm] && args.length === 1) { var f1 = FN1[nm], a0 = args[0]; return function (x) { return f1(a0(x)); }; }
          if (FN2[nm] && args.length === 2) { var f2 = FN2[nm], b0 = args[0], b1 = args[1]; return function (x) { return f2(b0(x), b1(x)); }; }
          throw new Error("不認得函數「" + nm + "」");
        }
        if (nm === "x") return function (x) { return x; };
        if (CONST[nm] != null) { var cv = CONST[nm]; return function () { return cv; }; }
        if (FN1[nm]) { var f3 = FN1[nm]; var inner = unary(); return function (x) { return f3(inner(x)); }; }
        throw new Error("不認得「" + nm + "」");
      }
      throw new Error("算式怪怪的");
    }
    var fn = expr();
    if (p < ts.length) throw new Error("算式後面多了東西");
    return fn;
  }
  DP.compile = compile;

  /* 一行算式 → { kind:"y"|"x", f, c, dash, from, to, lab, err } */
  var CW = { "紅": "#c0392b", "藍": "#2c6fa8", "綠": "#2e7d5b", "橘": "#d2812a", "紫": "#6f5fb0", "灰": "#8a919b", "黑": "#1c2635", "粉": "#d46a8a", "青": "#2a9d9d" };
  var CYC = ["#c0392b", "#2c6fa8", "#2e7d5b", "#d2812a", "#6f5fb0", "#2a9d9d"];
  function parseLine(raw, idx) {
    var o = { c: CYC[idx % CYC.length], dash: 0, from: null, to: null, lab: "", err: "" }, s = String(raw).trim();
    if (!s) return null;
    /* 定義域 [a,b] */
    s = s.replace(/\[([^\]]*)\]/, function (_, inner) {
      var pr = inner.split(","); o.from = num(pr[0], null); o.to = num(pr[1], null); return " ";
    });
    /* 標籤 "..." */
    s = s.replace(/"([^"]*)"/, function (_, t) { o.lab = t; return " "; });
    /* 顏色與虛線（寫在算式後面，用空白隔開） */
    var tail = s.split(/\s+/);
    s = tail.shift();
    tail.forEach(function (w) {
      if (!w) return;
      if (/^(虛線|dash|--)$/i.test(w)) o.dash = 1;
      else if (/^(粗|bold)$/i.test(w)) o.bold = 1;
      else if (CW[w]) o.c = CW[w];
      else if (/^#[0-9a-f]{3,8}$/i.test(w)) o.c = w;
    });
    /* y= / f(x)= 開頭可省略；x=數字 是鉛直線 */
    var m = s.match(/^x=(.+)$/i);
    if (m) {
      try { o.kind = "x"; o.at = compile(m[1])(0); } catch (e) { o.err = e.message; }
      return o;
    }
    s = s.replace(/^y=/i, "").replace(/^[a-z]\(x\)=/i, "");
    o.kind = "y";
    try { o.f = compile(s); o.f(1); } catch (e) { o.err = e.message; }
    return o;
  }
  /* "A(1,2); (3,4)" → [{lab,x,y}] */
  function parsePts(raw) {
    var out = [];
    String(raw || "").split(/[;\n]/).forEach(function (s) {
      s = s.trim(); if (!s) return;
      var m = s.match(/^([^(]*)\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/);
      if (m) out.push({ lab: m[1].trim(), x: parseFloat(m[2]), y: parseFloat(m[3]) });
    });
    return out;
  }
  /* "(0,0)-(3,4) 紅 虛線" → [{x1,y1,x2,y2,c,dash}] */
  function parseSegs(raw) {
    var out = [];
    String(raw || "").split(/[;\n]/).forEach(function (s, i) {
      s = s.trim(); if (!s) return;
      var st = { c: "#1c2635", dash: 0, arrow: 0 };
      s = s.replace(/\s+(\S+)/g, function (_, w) {
        if (/^(虛線|dash|--)$/i.test(w)) st.dash = 1;
        else if (/^(箭頭|arrow|->)$/i.test(w)) st.arrow = 1;
        else if (CW[w]) st.c = CW[w];
        else if (/^#[0-9a-f]{3,8}$/i.test(w)) st.c = w;
        return "";
      });
      var m = s.match(/^\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)\s*-\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/);
      if (m) { st.x1 = +m[1]; st.y1 = +m[2]; st.x2 = +m[3]; st.y2 = +m[4]; out.push(st); }
    });
    return out;
  }

  /* ---- 小小的 SVG 產生器 ---- */
  function ln(x1, y1, x2, y2, c, w, dash) {
    return '<line x1="' + rd(x1) + '" y1="' + rd(y1) + '" x2="' + rd(x2) + '" y2="' + rd(y2) + '" stroke="' + c + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' stroke-linecap="round"/>';
  }
  function tx(x, y, t, o) {
    o = o || {};
    return '<text x="' + rd(x) + '" y="' + rd(y) + '" font-size="' + (o.fs || 12) + '" font-family="' + (o.ff || "sans-serif") + '" text-anchor="' + (o.a || "middle") + '" fill="' + (o.c || "#1c2635") + '"' + (o.it ? ' font-style="italic"' : "") + (o.b ? ' font-weight="700"' : "") + ">" + esc(t) + "</text>";
  }
  function poly(pts, fill, stroke, w, dash) {
    return '<polygon points="' + pts.map(function (p) { return rd(p[0]) + "," + rd(p[1]); }).join(" ") + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' stroke-linejoin="round"/>';
  }
  /* 實心三角箭頭（跟 draw.js 一樣不用 <marker>，Word 與 Illustrator 才認得） */
  function head(x1, y1, x2, y2, w, col) {
    var a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(7, w * 3.6), W = Math.max(4.4, w * 2.2);
    var bx = x2 - Math.cos(a) * L, by = y2 - Math.sin(a) * L, nx = -Math.sin(a), ny = Math.cos(a);
    return '<path d="M' + rd(x2) + " " + rd(y2) + "L" + rd(bx + nx * W / 2) + " " + rd(by + ny * W / 2) + "L" + rd(bx - nx * W / 2) + " " + rd(by - ny * W / 2) + 'Z" fill="' + col + '"/>';
  }
  DP.head = head;

  /* 好看的刻度間距：1、2、5 的倍數 */
  function nice(span, target) {
    var raw = span / Math.max(1, target), p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }
  function fmt(v) {
    if (Math.abs(v) < 1e-9) return "0";
    var s = rd(v, 4).toString();
    return s;
  }

  /* ================================================================
     二、函數圖（Desmos 風格）
     ================================================================ */
  DP.types.fn = {
    n: "函數圖",
    w: 320, h: 260,
    a: [
      { k: "fx", n: "函數（一行一條）", t: "area", rows: 4 },
      { k: "xmin", n: "x 最小", t: "num", min: -1000, max: 1000, step: .5 },
      { k: "xmax", n: "x 最大", t: "num", min: -1000, max: 1000, step: .5 },
      { k: "ymin", n: "y 最小", t: "num", min: -1000, max: 1000, step: .5 },
      { k: "ymax", n: "y 最大", t: "num", min: -1000, max: 1000, step: .5 },
      { k: "fit", n: "y 範圍自動配合 x", t: "bool" },
      { k: "grid", n: "格線", t: "bool" },
      { k: "nums", n: "刻度數字", t: "bool" },
      { k: "arr", n: "軸末端箭頭", t: "bool" },
      { k: "ox", n: "標 O 原點", t: "bool" },
      { k: "xl", n: "x 軸名稱", t: "txt" },
      { k: "yl", n: "y 軸名稱", t: "txt" },
      { k: "pts", n: "標點 A(1,2);(3,4)", t: "area", rows: 2 },
      { k: "segs", n: "線段 (0,0)-(3,4)", t: "area", rows: 2 },
      { k: "lw", n: "曲線粗細", t: "num", min: .5, max: 8, step: .5 }
    ],
    init: function (o) {
      o.w = 320; o.h = 260;
      o.d = { fx: "y=x^2-3", xmin: -5, xmax: 5, ymin: -5, ymax: 5, fit: 1, grid: 1, nums: 1, arr: 1, ox: 1, xl: "x", yl: "y", pts: "", segs: "", lw: 2.2 };
      o.s.fs = 12;
    },
    svg: function (o) {
      var d = o.d, s = o.s, W = o.w, H = o.h, X0 = o.x, Y0 = o.y;
      var xmin = num(d.xmin, -5), xmax = num(d.xmax, 5);
      if (xmax - xmin < 1e-6) xmax = xmin + 1;
      var ymin = num(d.ymin, -5), ymax = num(d.ymax, 5);
      if (d.fit) { /* 讓一格 x 和一格 y 等寬，圖形才不會被壓扁 */
        var half = (xmax - xmin) * H / W / 2, mid = (ymin + ymax) / 2;
        ymin = mid - half; ymax = mid + half;
      }
      if (ymax - ymin < 1e-6) ymax = ymin + 1;
      var sx = function (v) { return X0 + (v - xmin) / (xmax - xmin) * W; };
      var sy = function (v) { return Y0 + H - (v - ymin) / (ymax - ymin) * H; };
      var col = s.sc || "#1c2635", fs = s.fs || 12, ff = s.ff || "sans-serif", out = "";
      var cid = "fnc" + String(o.id).replace(/[^a-z0-9]/gi, "");

      var gx = nice(xmax - xmin, Math.max(3, Math.round(W / 56)));
      var gy = nice(ymax - ymin, Math.max(3, Math.round(H / 48)));

      out += '<clipPath id="' + cid + '"><rect x="' + rd(X0) + '" y="' + rd(Y0) + '" width="' + rd(W) + '" height="' + rd(H) + '"/></clipPath>';
      if (s.fc && s.fc !== "none") out += '<rect x="' + rd(X0) + '" y="' + rd(Y0) + '" width="' + rd(W) + '" height="' + rd(H) + '" fill="' + s.fc + '" fill-opacity="' + (s.fo == null ? 1 : s.fo) + '"/>';

      /* 格線 */
      if (d.grid) {
        var g = "";
        for (var gv = Math.ceil(xmin / gx) * gx; gv <= xmax + 1e-9; gv += gx) g += ln(sx(gv), Y0, sx(gv), Y0 + H, col, .6, "");
        for (var gh = Math.ceil(ymin / gy) * gy; gh <= ymax + 1e-9; gh += gy) g += ln(X0, sy(gh), X0 + W, sy(gh), col, .6, "");
        out += '<g opacity=".22">' + g + "</g>";
      }
      /* 座標軸（軸不在範圍內就畫在邊上） */
      var ax = sy(0), ay = sx(0), onX = 0 >= ymin && 0 <= ymax, onY = 0 >= xmin && 0 <= xmax;
      ax = Math.max(Y0, Math.min(Y0 + H, ax)); ay = Math.max(X0, Math.min(X0 + W, ay));
      var aw = Math.max(1, (s.sw || 2) * .8);
      var xe = X0 + W, ye = Y0;
      out += ln(X0, ax, xe - (d.arr ? aw * 3.6 : 0), ax, col, aw, "");
      out += ln(ay, Y0 + H, ay, ye + (d.arr ? aw * 3.6 : 0), col, aw, "");
      if (d.arr) { out += head(X0, ax, xe, ax, aw, col); out += head(ay, Y0 + H, ay, ye, aw, col); }

      /* 刻度與數字 */
      var tk = "";
      for (var v = Math.ceil(xmin / gx) * gx; v <= xmax + 1e-9; v += gx) {
        if (Math.abs(v) < 1e-9) continue;
        var px = sx(v); tk += ln(px, ax - 3.5, px, ax + 3.5, col, aw * .8, "");
        /* 太靠邊的數字會被軸的箭頭或外框切到，乾脆不標 */
        if (d.nums && px > X0 + fs * .8 && px < X0 + W - fs * 1.1 && ax + fs + 4 < Y0 + H) tk += tx(px, ax + fs + 4, fmt(v), { fs: fs, ff: ff, c: col });
      }
      for (var v2 = Math.ceil(ymin / gy) * gy; v2 <= ymax + 1e-9; v2 += gy) {
        if (Math.abs(v2) < 1e-9) continue;
        var py = sy(v2); tk += ln(ay - 3.5, py, ay + 3.5, py, col, aw * .8, "");
        if (d.nums && py > Y0 + fs * .9 && py < Y0 + H - fs * .3 && ay - 6 > X0) tk += tx(ay - 6, py + fs * .36, fmt(v2), { fs: fs, ff: ff, c: col, a: "end" });
      }
      out += '<g clip-path="url(#' + cid + ')">' + tk + "</g>";
      if (d.ox && onX && onY) out += tx(ay - 6, ax + fs + 2, "O", { fs: fs, ff: ff, c: col, a: "end", it: 1 });
      if (d.xl) out += tx(xe - 2, ax - 7, d.xl, { fs: fs + 1, ff: ff, c: col, a: "end", it: 1 });
      if (d.yl) out += tx(ay + 7, ye + fs + 1, d.yl, { fs: fs + 1, ff: ff, c: col, a: "start", it: 1 });

      /* 曲線 */
      var body = "", errs = [];
      var lines = String(d.fx || "").split("\n");
      lines.forEach(function (raw, i) {
        var L = parseLine(raw, i); if (!L) return;
        if (L.err) { errs.push("第 " + (i + 1) + " 行：" + L.err); return; }
        var lw = num(d.lw, 2.2) * (L.bold ? 1.7 : 1), dash = L.dash ? rd(lw * 3) + " " + rd(lw * 2.4) : "";
        if (L.kind === "x") {
          if (L.at < xmin || L.at > xmax) return;
          body += ln(sx(L.at), Y0, sx(L.at), Y0 + H, L.c, lw, dash);
          if (L.lab) body += tx(sx(L.at) + 4, Y0 + fs + 2, L.lab, { fs: fs, ff: ff, c: L.c, a: "start" });
          return;
        }
        var a = Math.max(xmin, L.from == null ? xmin : L.from), b = Math.min(xmax, L.to == null ? xmax : L.to);
        if (b <= a) return;
        var N = Math.max(60, Math.round(W * 2)), segs = [], cur = [], prev = null, span = ymax - ymin;
        for (var k = 0; k <= N; k++) {
          var xv = a + (b - a) * k / N, yv;
          try { yv = L.f(xv); } catch (e) { yv = NaN; }
          if (!isFinite(yv)) { if (cur.length > 1) segs.push(cur); cur = []; prev = null; continue; }
          /* 遇到漸近線（跳太遠）就把線斷開，不要連出一條假的鉛直線 */
          if (prev != null && Math.abs(yv - prev) > span * 2.5) { if (cur.length > 1) segs.push(cur); cur = []; }
          var yc = Math.max(ymin - span, Math.min(ymax + span, yv));
          cur.push([sx(xv), sy(yc)]); prev = yv;
        }
        if (cur.length > 1) segs.push(cur);
        segs.forEach(function (ps) {
          body += '<polyline points="' + ps.map(function (p) { return rd(p[0]) + "," + rd(p[1]); }).join(" ") + '" fill="none" stroke="' + L.c + '" stroke-width="' + lw + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' stroke-linecap="round" stroke-linejoin="round"/>';
        });
        if (L.lab && segs.length) {
          var last = segs[segs.length - 1], p = last[last.length - 1];
          body += tx(p[0] - 4, p[1] - 6, L.lab, { fs: fs + 1, ff: ff, c: L.c, a: "end" });
        }
      });
      /* 線段 */
      parseSegs(d.segs).forEach(function (g2) {
        var lw2 = num(d.lw, 2.2);
        body += ln(sx(g2.x1), sy(g2.y1), sx(g2.x2), sy(g2.y2), g2.c, lw2, g2.dash ? rd(lw2 * 3) + " " + rd(lw2 * 2.4) : "");
        if (g2.arrow) body += head(sx(g2.x1), sy(g2.y1), sx(g2.x2), sy(g2.y2), lw2, g2.c);
      });
      /* 標點 */
      parsePts(d.pts).forEach(function (pt) {
        var px2 = sx(pt.x), py2 = sy(pt.y);
        body += '<circle cx="' + rd(px2) + '" cy="' + rd(py2) + '" r="' + rd(Math.max(2.4, num(d.lw, 2.2) * 1.3)) + '" fill="' + col + '"/>';
        if (pt.lab) body += tx(px2 + 5, py2 - 6, pt.lab, { fs: fs + 1, ff: ff, c: col, a: "start", it: 1 });
      });
      out += '<g clip-path="url(#' + cid + ')">' + body + "</g>";
      o.d.err = errs.join("；");
      return out;
    }
  };

  /* ================================================================
     三、立體圖（斜二測投影：正面照實畫，深度往右上退）
     ================================================================ */
  function mix(hex, to, amt) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "#ffffff"));
    if (!m) return hex;
    var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var t = to === "w" ? 255 : 0;
    r = Math.round(r + (t - r) * amt); g = Math.round(g + (t - g) * amt); b = Math.round(b + (t - b) * amt);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  DP.mix = mix;
  /* 橢圓的上半弧（背面）與下半弧（正面）：圓柱、圓錐的底面要分開畫 */
  function arcHalf(cx, cy, rx, ry, upper) {
    var y = upper ? -1 : 1;
    return "M" + rd(cx - rx) + " " + rd(cy) + "A" + rd(rx) + " " + rd(ry) + " 0 0 " + (upper ? 1 : 0) + " " + rd(cx + rx) + " " + rd(cy);
  }
  function pth(d, st, w, dash, fill) {
    return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + st + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' stroke-linecap="round" stroke-linejoin="round"/>';
  }

  var SOLIDS = [["cuboid", "長方體"], ["cube", "正方體"], ["cyl", "圓柱"], ["cone", "圓錐"], ["sphere", "球"],
    ["hemi", "半球"], ["prism3", "三角柱"], ["prism6", "六角柱"], ["pyr4", "四角錐"], ["pyr3", "三角錐"], ["frus", "圓錐台"]];

  DP.types.solid = {
    n: "立體圖",
    w: 220, h: 180,
    a: [
      { k: "k", n: "形狀", t: "sel", o: SOLIDS },
      { k: "dep", n: "深度比", t: "num", min: .05, max: .8, step: .02 },
      { k: "ang", n: "傾斜角", t: "num", min: 10, max: 75, step: 1 },
      { k: "hid", n: "看不到的邊", t: "sel", o: [["dash", "畫成虛線"], ["none", "不畫"], ["solid", "全部實線"]] },
      { k: "er", n: "圓面扁度", t: "num", min: .05, max: .45, step: .01 },
      { k: "shade", n: "各面不同深淺", t: "bool" },
      { k: "lw", n: "長（底邊）標示", t: "txt" },
      { k: "ld", n: "寬（深度）標示", t: "txt" },
      { k: "lh", n: "高標示", t: "txt" },
      { k: "vn", n: "頂點字母 A B C…", t: "bool" }
    ],
    init: function (o) {
      o.w = 220; o.h = 180;
      o.d = { k: "cuboid", dep: .32, ang: 40, hid: "dash", er: .16, shade: 1, lw: "", ld: "", lh: "", vn: 0 };
      o.s.fc = "#cfe0ef"; o.s.fo = 1; o.s.fs = 13;
    },
    svg: function (o) {
      var d = o.d, s = o.s, X = o.x, Y = o.y, W = o.w, H = o.h;
      var col = s.sc || "#1c2635", lw = s.sw || 2, fs = s.fs || 13, ff = s.ff || "sans-serif";
      var base = s.fc && s.fc !== "none" ? s.fc : "none";
      var fo = s.fo == null ? 1 : s.fo;
      var hid = d.hid || "dash", dash = hid === "dash" ? rd(lw * 2.6) + " " + rd(lw * 2.2) : "";
      var drawHid = hid !== "none";
      var a = num(d.ang, 40) * Math.PI / 180, kd = num(d.dep, .32);
      var out = "";
      function face(pts, tone) {
        var f = base === "none" ? "none" : d.shade ? mix(base, tone < 0 ? "k" : "w", Math.abs(tone)) : base;
        return poly(pts, f, col, lw, "");
      }
      function fo_() { return base === "none" ? "" : ' fill-opacity="' + fo + '"'; }
      function lab(x, y, t, anchor) { return t ? tx(x, y, t, { fs: fs, ff: ff, c: col, a: anchor || "middle" }) : ""; }

      var k = d.k || "cuboid", hidden = "";   /* 看不到的邊最後才畫，蓋在填色上面才看得見 */
      if (k === "cuboid" || k === "cube" || k === "prism3" || k === "prism6" || k === "pyr4" || k === "pyr3") {
        var dx = W * kd * Math.cos(a), dy = W * kd * Math.sin(a);
        var fw = W - dx, fh = H - dy, x0 = X, y0 = Y + dy;
        if (k === "cube") { var m0 = Math.min(fw, fh); fw = m0; fh = m0; }
        var F = [[x0, y0 + fh], [x0 + fw, y0 + fh], [x0 + fw, y0], [x0, y0]];      /* 左下 右下 右上 左上 */
        var Bk = F.map(function (p) { return [p[0] + dx, p[1] - dy]; });
        if (k === "cuboid" || k === "cube") {
          if (drawHid) {                                           /* 後面左下角看不到 */
            hidden += pth("M" + rd(Bk[0][0]) + " " + rd(Bk[0][1]) + "L" + rd(Bk[1][0]) + " " + rd(Bk[1][1]) + "M" + rd(Bk[0][0]) + " " + rd(Bk[0][1]) + "L" + rd(Bk[3][0]) + " " + rd(Bk[3][1]) + "M" + rd(F[0][0]) + " " + rd(F[0][1]) + "L" + rd(Bk[0][0]) + " " + rd(Bk[0][1]), col, lw * .85, dash);
          }
          out += '<g' + fo_() + ">";
          out += face([F[3], Bk[3], Bk[2], F[2]], .18);            /* 上面 */
          out += face([F[1], Bk[1], Bk[2], F[2]], -.12);           /* 右面 */
          out += face(F, 0);                                       /* 正面 */
          out += "</g>";
          out += lab((F[0][0] + F[1][0]) / 2, F[0][1] + fs + 4, d.lw);
          out += lab(F[1][0] + dx / 2 + 5, F[1][1] - dy / 2 + fs * .9, d.ld, "start");
          out += lab(F[1][0] + 6, (F[1][1] + F[2][1]) / 2 + fs * .35, d.lh, "start");
          if (d.vn) {
            var N = ["A", "B", "C", "D", "E", "F", "G", "H"];
            [[F[0], -1, 1], [F[1], 1, 1], [F[2], 1, -1], [F[3], -1, -1]].forEach(function (p, i) {
              out += tx(p[0][0] + p[1] * 7, p[0][1] + p[2] * (p[2] > 0 ? fs : -3), N[i], { fs: fs, ff: ff, c: col, it: 1 });
            });
            [[Bk[0], -1, 1], [Bk[1], 1, 1], [Bk[2], 1, -1], [Bk[3], -1, -1]].forEach(function (p, i) {
              out += tx(p[0][0] + p[1] * 7, p[0][1] + p[2] * (p[2] > 0 ? fs : -3), N[i + 4], { fs: fs, ff: ff, c: col, it: 1 });
            });
          }
        } else if (k === "prism3") {
          var T = [[x0, y0 + fh], [x0 + fw, y0 + fh], [x0 + fw / 2, y0]];
          var T2 = T.map(function (p) { return [p[0] + dx, p[1] - dy]; });
          if (drawHid) hidden += pth("M" + rd(T2[0][0]) + " " + rd(T2[0][1]) + "L" + rd(T2[1][0]) + " " + rd(T2[1][1]) + "L" + rd(T2[2][0]) + " " + rd(T2[2][1]) + "M" + rd(T[0][0]) + " " + rd(T[0][1]) + "L" + rd(T2[0][0]) + " " + rd(T2[0][1]), col, lw * .85, dash);
          out += "<g" + fo_() + ">";
          /* 左邊那片斜面在傾斜角大的時候才看得到，法向量朝上的分量夠大才畫 */
          var nlx = -(T[2][1] - T[0][1]), nly = (T[2][0] - T[0][0]), nl = Math.sqrt(nlx * nlx + nly * nly) || 1;
          if ((nlx / nl) * Math.cos(a) + (-nly / nl) * Math.sin(a) > .02) out += face([T[0], T2[0], T2[2], T[2]], .1);
          out += face([T[2], T2[2], T2[1], T[1]], .18);
          out += face(T, 0);
          out += "</g>";
          out += lab((T[0][0] + T[1][0]) / 2, T[0][1] + fs + 4, d.lw);
          out += lab(T[1][0] + dx / 2 + 5, T[1][1] - dy / 2 + fs * .9, d.ld, "start");
        } else if (k === "prism6") {
          var hx = fw / 2, hy = fh / 2, cx0 = x0 + hx, cy0 = y0 + hy, HP = [];
          for (var i6 = 0; i6 < 6; i6++) { var an = Math.PI / 6 + i6 * Math.PI / 3; HP.push([cx0 + hx * Math.cos(an), cy0 + hy * Math.sin(an)]); }
          var HB = HP.map(function (p) { return [p[0] + dx, p[1] - dy]; });
          if (drawHid) {
            var hd = "";
            [[0, 1], [1, 2], [2, 3]].forEach(function (e) { hd += "M" + rd(HB[e[0]][0]) + " " + rd(HB[e[0]][1]) + "L" + rd(HB[e[1]][0]) + " " + rd(HB[e[1]][1]); });
            hd += "M" + rd(HP[2][0]) + " " + rd(HP[2][1]) + "L" + rd(HB[2][0]) + " " + rd(HB[2][1]);
            hidden += pth(hd, col, lw * .85, dash);
          }
          out += "<g" + fo_() + ">";
          [[5, 0], [4, 5], [3, 4]].forEach(function (e, ii) {
            out += face([HP[e[0]], HB[e[0]], HB[e[1]], HP[e[1]]], ii === 0 ? .18 : -.1);
          });
          out += face(HP, 0);
          out += "</g>";
        } else if (k === "pyr4") {
          /* 底面是個平行四邊形（俯視的正方形），頂點在正上方 */
          var bh = H * .3, by = Y + H, bw = W - dx;
          var P0 = [X, by], P1 = [X + bw, by], P2 = [X + bw + dx, by - dy], P3 = [X + dx, by - dy];
          var apex = [(P0[0] + P2[0]) / 2, Y];
          if (drawHid) hidden += pth("M" + rd(P3[0]) + " " + rd(P3[1]) + "L" + rd(P0[0]) + " " + rd(P0[1]) + "M" + rd(P3[0]) + " " + rd(P3[1]) + "L" + rd(P2[0]) + " " + rd(P2[1]) + "M" + rd(P3[0]) + " " + rd(P3[1]) + "L" + rd(apex[0]) + " " + rd(apex[1]), col, lw * .85, dash);
          out += "<g" + fo_() + ">";
          out += face([P1, P2, apex], -.12);
          out += face([P0, P1, apex], 0);
          out += "</g>";
          out += lab((P0[0] + P1[0]) / 2, by + fs + 4, d.lw);
          out += lab(apex[0] + 6, (apex[1] + by) / 2, d.lh, "start");
        } else {   /* pyr3 三角錐 */
          var by3 = Y + H, bw3 = W - dx;
          /* 後面那個頂點放在底邊中間偏後，三個面才不會擠成一條線 */
          var Q0 = [X, by3], Q1 = [X + bw3, by3], Q2 = [X + bw3 * .2 + dx, by3 - dy];
          var ap3 = [(Q0[0] + Q1[0] + Q2[0]) / 3, Y];
          if (drawHid) hidden += pth("M" + rd(Q2[0]) + " " + rd(Q2[1]) + "L" + rd(Q0[0]) + " " + rd(Q0[1]), col, lw * .85, dash);
          out += "<g" + fo_() + ">";
          out += face([Q1, Q2, ap3], -.12);
          out += face([Q0, Q1, ap3], 0);
          out += "</g>";
          out += pth("M" + rd(Q1[0]) + " " + rd(Q1[1]) + "L" + rd(Q2[0]) + " " + rd(Q2[1]), col, lw, "");
          out += lab((Q0[0] + Q1[0]) / 2, by3 + fs + 4, d.lw);
        }
      } else {
        /* 圓柱、圓錐、球、半球、圓錐台 */
        var ry = Math.max(3, H * num(d.er, .16)), rx = W / 2, cx = X + W / 2;
        if (k === "cyl") {
          var ty = Y + ry, byy = Y + H - ry;
          out += "<g" + fo_() + ">";
          out += '<rect x="' + rd(X) + '" y="' + rd(ty) + '" width="' + rd(W) + '" height="' + rd(byy - ty) + '" fill="' + (base === "none" ? "none" : base) + '" stroke="none"/>';
          out += '<ellipse cx="' + rd(cx) + '" cy="' + rd(ty) + '" rx="' + rd(rx) + '" ry="' + rd(ry) + '" fill="' + (base === "none" ? "none" : mix(base, "w", .22)) + '" stroke="none"/>';
          out += "</g>";
          out += ln(X, ty, X, byy, col, lw, ""); out += ln(X + W, ty, X + W, byy, col, lw, "");
          out += '<ellipse cx="' + rd(cx) + '" cy="' + rd(ty) + '" rx="' + rd(rx) + '" ry="' + rd(ry) + '" fill="none" stroke="' + col + '" stroke-width="' + lw + '"/>';
          out += pth(arcHalf(cx, byy, rx, ry, false), col, lw, "");
          if (drawHid) out += pth(arcHalf(cx, byy, rx, ry, true), col, lw * .85, dash);
          out += lab(cx, byy + ry + fs + 4, d.lw);
          out += lab(X + W + 6, (ty + byy) / 2, d.lh, "start");
        } else if (k === "cone") {
          var byc = Y + H - ry, apx = cx, apy = Y;
          out += "<g" + fo_() + ">" + poly([[X, byc], [X + W, byc], [apx, apy]], base === "none" ? "none" : base, "none", 0, "") + "</g>";
          out += ln(X, byc, apx, apy, col, lw, ""); out += ln(X + W, byc, apx, apy, col, lw, "");
          out += pth(arcHalf(cx, byc, rx, ry, false), col, lw, "");
          if (drawHid) out += pth(arcHalf(cx, byc, rx, ry, true), col, lw * .85, dash);
          if (d.lh) { out += ln(apx, apy, apx, byc, col, lw * .7, rd(lw * 2) + " " + rd(lw * 2)); out += lab(apx + 6, (apy + byc) / 2, d.lh, "start"); }
          out += lab(cx, byc + ry + fs + 4, d.lw);
        } else if (k === "sphere") {
          var R = Math.min(W, H) / 2, scx = X + W / 2, scy = Y + H / 2;
          out += '<circle cx="' + rd(scx) + '" cy="' + rd(scy) + '" r="' + rd(R) + '" fill="' + (base === "none" ? "none" : base) + '"' + fo_() + ' stroke="' + col + '" stroke-width="' + lw + '"/>';
          out += pth(arcHalf(scx, scy, R, R * num(d.er, .16) * 2.2, false), col, lw * .9, "");
          if (drawHid) out += pth(arcHalf(scx, scy, R, R * num(d.er, .16) * 2.2, true), col, lw * .8, dash);
          if (d.lh) { out += ln(scx, scy, scx + R, scy, col, lw * .7, rd(lw * 2) + " " + rd(lw * 2)); out += lab(scx + R / 2, scy - 5, d.lh); }
        } else if (k === "hemi") {
          var Rh = Math.min(W / 2, H), hcx = X + W / 2, hcy = Y + H - ry;
          out += '<path d="M' + rd(hcx - Rh) + " " + rd(hcy) + "A" + rd(Rh) + " " + rd(Rh) + ' 0 0 1 ' + rd(hcx + Rh) + " " + rd(hcy) + 'Z" fill="' + (base === "none" ? "none" : base) + '"' + fo_() + ' stroke="' + col + '" stroke-width="' + lw + '"/>';
          out += pth(arcHalf(hcx, hcy, Rh, ry, false), col, lw, "");
          if (drawHid) out += pth(arcHalf(hcx, hcy, Rh, ry, true), col, lw * .85, dash);
        } else { /* frus 圓錐台 */
          var topR = rx * .5, tyf = Y + ry, byf = Y + H - ry;
          out += "<g" + fo_() + ">" + poly([[cx - topR, tyf], [cx + topR, tyf], [cx + rx, byf], [cx - rx, byf]], base === "none" ? "none" : base, "none", 0, "") + "</g>";
          out += ln(cx - topR, tyf, cx - rx, byf, col, lw, ""); out += ln(cx + topR, tyf, cx + rx, byf, col, lw, "");
          out += '<ellipse cx="' + rd(cx) + '" cy="' + rd(tyf) + '" rx="' + rd(topR) + '" ry="' + rd(ry * topR / rx) + '" fill="' + (base === "none" ? "none" : mix(base, "w", .22)) + '"' + fo_() + ' stroke="' + col + '" stroke-width="' + lw + '"/>';
          out += pth(arcHalf(cx, byf, rx, ry, false), col, lw, "");
          if (drawHid) out += pth(arcHalf(cx, byf, rx, ry, true), col, lw * .85, dash);
        }
      }
      return out + hidden;
    }
  };

  /* ================================================================
     四、積木（小方塊堆疊）與三視圖
     高度表一行一排，第一行是最後排、最後一行是最前排。
     ================================================================ */
  function grid(raw) {
    var rows = String(raw == null ? "" : raw).split("\n").map(function (r) {
      return r.trim().split(/[\s,]+/).filter(function (t) { return t !== ""; }).map(function (t) { var v = parseInt(t, 10); return isFinite(v) && v > 0 ? v : 0; });
    }).filter(function (r) { return r.length; });
    if (!rows.length) rows = [[1]];
    var C = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    rows.forEach(function (r) { while (r.length < C) r.push(0); });
    return rows;
  }
  function gmax(g) { var m = 0; g.forEach(function (r) { r.forEach(function (v) { if (v > m) m = v; }); }); return m; }
  function gcount(g) { var n = 0; g.forEach(function (r) { r.forEach(function (v) { n += v; }); }); return n; }

  DP.types.blocks = {
    n: "積木／三視圖",
    w: 260, h: 220,
    a: [
      { k: "g", n: "每格幾層（一行一排）", t: "area", rows: 4 },
      { k: "mode", n: "要畫什麼", t: "sel", o: [["iso", "立體圖"], ["iso3", "立體圖＋三視圖"], ["three", "三視圖（第三角法）"], ["row", "三視圖（並排）"], ["front", "只要前視圖"], ["top", "只要上視圖"], ["side", "只要右側視圖"]] },
      { k: "cs", n: "方塊大小", t: "num", min: 8, max: 80, step: 1 },
      { k: "shade", n: "三面不同深淺", t: "bool" },
      { k: "nums", n: "上視圖標層數", t: "bool" },
      { k: "labs", n: "每張圖加標題", t: "bool" },
      { k: "cnt", n: "顯示共幾個方塊", t: "bool" },
      { k: "flip", n: "第一行當最前排", t: "bool" }
    ],
    init: function (o) {
      o.w = 260; o.h = 220;
      o.d = { g: "1 1 0\n2 1 0\n3 2 1", mode: "iso", cs: 26, shade: 1, nums: 1, labs: 1, cnt: 0, flip: 0 };
      o.s.fc = "#cfe0ef"; o.s.fo = 1; o.s.fs = 13;
    },
    svg: function (o) {
      var d = o.d, s = o.s, col = s.sc || "#1c2635", lw = Math.max(.8, (s.sw || 2) * .8);
      var fs = s.fs || 13, ff = s.ff || "sans-serif";
      var base = s.fc && s.fc !== "none" ? s.fc : "#ffffff";
      var g = grid(d.g); if (d.flip) g = g.slice().reverse();
      var R = g.length, C = g[0].length, MH = gmax(g), cs = Math.max(6, num(d.cs, 26));
      var mode = d.mode || "iso";
      var shade = d.shade ? [mix(base, "w", .3), base, mix(base, "k", .16)] : [base, base, base];
      var parts = [];      /* {svg, w, h, title} 之後再排版 */

      function isoPart() {
        var hw = cs * .866, hh = cs * .5, ch = cs, body = "";
        var cells = [];
        for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) for (var L = 0; L < g[r][c]; L++) cells.push([r, c, L]);
        /* 畫家演算法：先畫遠的（r+c 小），同一層由下往上 */
        cells.sort(function (A, B) { return (A[0] + A[1]) - (B[0] + B[1]) || A[2] - B[2]; });
        var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        cells.forEach(function (q) {
          var r = q[0], c = q[1], L = q[2];
          var ox = (c - r) * hw, oy = (c + r) * hh - L * ch;
          var top = [[ox, oy - hh], [ox + hw, oy], [ox, oy + hh], [ox - hw, oy]];
          var lf = [[ox - hw, oy], [ox, oy + hh], [ox, oy + hh + ch], [ox - hw, oy + ch]];
          var rt = [[ox + hw, oy], [ox, oy + hh], [ox, oy + hh + ch], [ox + hw, oy + ch]];
          body += poly(lf, shade[1], col, lw, "") + poly(rt, shade[2], col, lw, "") + poly(top, shade[0], col, lw, "");
          [top, lf, rt].forEach(function (f) { f.forEach(function (p) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }); });
        });
        if (minX > maxX) { minX = 0; maxX = cs; minY = 0; maxY = cs; }
        return { svg: '<g transform="translate(' + rd(-minX) + " " + rd(-minY) + ')">' + body + "</g>", w: maxX - minX, h: maxY - minY, title: "立體圖" };
      }
      function flat(kind) {
        var cells = [], w, hgt, title, nums = null;
        if (kind === "front") {
          w = C; hgt = MH; title = "前視圖";
          for (var c = 0; c < C; c++) { var mx = 0; for (var r = 0; r < R; r++) if (g[r][c] > mx) mx = g[r][c]; for (var L = 0; L < mx; L++) cells.push([c, hgt - 1 - L]); }
        } else if (kind === "side") {
          /* 從右邊看：最前排在左邊 */
          w = R; hgt = MH; title = "右側視圖";
          for (var r2 = 0; r2 < R; r2++) { var mx2 = 0; for (var c2 = 0; c2 < C; c2++) if (g[r2][c2] > mx2) mx2 = g[r2][c2]; var col2 = R - 1 - r2; for (var L2 = 0; L2 < mx2; L2++) cells.push([col2, hgt - 1 - L2]); }
        } else {
          w = C; hgt = R; title = "上視圖"; nums = [];
          for (var r3 = 0; r3 < R; r3++) for (var c3 = 0; c3 < C; c3++) if (g[r3][c3] > 0) { cells.push([c3, r3]); nums.push([c3, r3, g[r3][c3]]); }
        }
        var body = "";
        cells.forEach(function (q) {
          body += '<rect x="' + rd(q[0] * cs) + '" y="' + rd(q[1] * cs) + '" width="' + rd(cs) + '" height="' + rd(cs) + '" fill="' + base + '" stroke="' + col + '" stroke-width="' + lw + '"/>';
        });
        if (nums && d.nums) nums.forEach(function (q) { body += tx(q[0] * cs + cs / 2, q[1] * cs + cs / 2 + fs * .36, q[2], { fs: Math.min(fs, cs * .55), ff: ff, c: col }); });
        return { svg: body, w: w * cs, h: hgt * cs, title: title };
      }

      if (mode === "iso") parts = [isoPart()];
      else if (mode === "front") parts = [flat("front")];
      else if (mode === "top") parts = [flat("top")];
      else if (mode === "side") parts = [flat("side")];
      else if (mode === "row") parts = [flat("front"), flat("top"), flat("side")];
      else if (mode === "iso3") parts = [isoPart(), flat("front"), flat("top"), flat("side")];
      else parts = [flat("top"), flat("front"), flat("side")];   /* three：第三角法 */

      /* 排版：算出自然大小，最後再等比例塞進方框 */
      var gap = cs * .9, th = d.labs ? fs + 6 : 0, inner = "", nw, nh;
      /* 標題有可能比圖還寬（例如「右側視圖」配一排小方塊），排版要用兩者的大的那個，
         不然最後等比例縮放時標題會被切掉 */
      var showLab = d.labs && (parts.length > 1 || mode === "iso" || mode === "three");
      parts.forEach(function (p) { p.cw = Math.max(p.w, showLab ? p.title.length * fs * 1.14 + 4 : 0); });
      if (mode === "three") {
        var top3 = parts[0], fr = parts[1], sd = parts[2];
        var colW = Math.max(top3.cw, fr.cw);
        var place = function (p, x, y) {
          return '<g transform="translate(' + rd(x + (p.cw - p.w) / 2) + " " + rd(y + th) + ')">' + p.svg + "</g>" +
            (showLab ? tx(x + p.cw / 2, y + fs, p.title, { fs: fs, ff: ff, c: col }) : "");
        };
        inner += place(top3, (colW - top3.cw) / 2, 0);
        inner += place(fr, (colW - fr.cw) / 2, top3.h + th + gap);
        inner += place(sd, colW + gap, top3.h + th + gap);
        nw = colW + gap + sd.cw;
        nh = top3.h + th + gap + th + Math.max(fr.h, sd.h);
      } else {
        var x = 0; nh = 0;
        parts.forEach(function (p) { if (p.h + th > nh) nh = p.h + th; });
        parts.forEach(function (p, i) {
          inner += '<g transform="translate(' + rd(x + (p.cw - p.w) / 2) + " " + rd(th + (nh - th - p.h) / 2) + ')">' + p.svg + "</g>";
          if (showLab && parts.length > 1) inner += tx(x + p.cw / 2, fs, p.title, { fs: fs, ff: ff, c: col });
          x += p.cw + (i < parts.length - 1 ? gap : 0);
        });
        nw = x;
      }
      if (d.cnt) { inner += tx(nw / 2, nh + fs + 4, "共 " + gcount(g) + " 個小方塊", { fs: fs, ff: ff, c: col }); nh += fs + 10; }
      nw = Math.max(1, nw) + 2; nh = Math.max(1, nh) + 2;
      o.d.w0 = rd(nw); o.d.h0 = rd(nh);
      /* 等比例置中，格子才不會被拉歪 */
      var k = Math.min(o.w / nw, o.h / nh);
      var ox2 = o.x + (o.w - nw * k) / 2, oy2 = o.y + (o.h - nh * k) / 2;
      return '<g transform="translate(' + rd(ox2) + " " + rd(oy2) + ") scale(" + rd(k, 4) + ')">' + inner + "</g>";
    }
  };

  /* ================================================================
     五、角度標記
     頂點在方框正中央，兩條邊往外伸；拖方框搬位置，拉把手改邊長。
     ================================================================ */
  DP.types.angle = {
    n: "角度標記",
    w: 130, h: 130,
    a: [
      { k: "a1", n: "第一邊角度", t: "num", min: -360, max: 360, step: 1 },
      { k: "a2", n: "第二邊角度", t: "num", min: -360, max: 360, step: 1 },
      { k: "rays", n: "畫出兩條邊", t: "bool" },
      { k: "rr", n: "弧的半徑（％）", t: "num", min: 10, max: 95, step: 1 },
      { k: "arcs", n: "弧的條數", t: "num", min: 1, max: 3, step: 1 },
      { k: "right", n: "直角用方框", t: "bool" },
      { k: "lab", n: "標示文字（空白＝自動度數）", t: "txt" },
      { k: "nolab", n: "不要文字", t: "bool" },
      { k: "fillA", n: "把角塗色", t: "bool" },
      { k: "ticks", n: "邊上加等長記號", t: "num", min: 0, max: 3, step: 1 }
    ],
    init: function (o) {
      o.w = 130; o.h = 130;
      o.d = { a1: 0, a2: 55, rays: 1, rr: 42, arcs: 1, right: 1, lab: "", nolab: 0, fillA: 0, ticks: 0 };
      o.s.fs = 14;
    },
    svg: function (o) {
      var d = o.d, s = o.s, col = s.sc || "#1c2635", lw = s.sw || 2, fs = s.fs || 14, ff = s.ff || "sans-serif";
      var cx = o.x + o.w / 2, cy = o.y + o.h / 2, L = Math.min(o.w, o.h) / 2;
      var a1 = num(d.a1, 0) * Math.PI / 180, a2 = num(d.a2, 55) * Math.PI / 180;
      /* 螢幕的 y 往下，所以角度取負的，看起來才跟數學課本一樣是逆時針 */
      var p1 = [cx + L * Math.cos(-a1), cy + L * Math.sin(-a1)], p2 = [cx + L * Math.cos(-a2), cy + L * Math.sin(-a2)];
      var out = "", deg = Math.abs(num(d.a2, 55) - num(d.a1, 0)) % 360;
      if (deg > 180) deg = 360 - deg;
      var r0 = L * Math.max(.1, num(d.rr, 42) / 100);
      var mid = (-a1 + -a2) / 2;

      if (d.fillA) {
        var big = Math.abs(num(d.a2, 55) - num(d.a1, 0)) % 360 > 180 ? 1 : 0;
        var sw2 = (-a2) > (-a1) ? 1 : 0;
        out += '<path d="M' + rd(cx) + " " + rd(cy) + "L" + rd(cx + r0 * Math.cos(-a1)) + " " + rd(cy + r0 * Math.sin(-a1)) +
          "A" + rd(r0) + " " + rd(r0) + " 0 " + big + " " + sw2 + " " + rd(cx + r0 * Math.cos(-a2)) + " " + rd(cy + r0 * Math.sin(-a2)) +
          'Z" fill="' + (s.fc && s.fc !== "none" ? s.fc : "#d9a93c") + '" fill-opacity="' + (s.fo == null ? .28 : s.fo) + '" stroke="none"/>';
      }
      if (d.rays) {
        out += ln(cx, cy, p1[0], p1[1], col, lw, "");
        out += ln(cx, cy, p2[0], p2[1], col, lw, "");
      }
      if (d.right && Math.abs(deg - 90) < .6) {
        var q = r0 * .62;
        var u1 = [Math.cos(-a1), Math.sin(-a1)], u2 = [Math.cos(-a2), Math.sin(-a2)];
        out += '<path d="M' + rd(cx + u1[0] * q) + " " + rd(cy + u1[1] * q) + "L" + rd(cx + (u1[0] + u2[0]) * q) + " " + rd(cy + (u1[1] + u2[1]) * q) +
          "L" + rd(cx + u2[0] * q) + " " + rd(cy + u2[1] * q) + '" fill="none" stroke="' + col + '" stroke-width="' + lw * .9 + '"/>';
        out += '<circle cx="' + rd(cx + (u1[0] + u2[0]) * q / 2) + '" cy="' + rd(cy + (u1[1] + u2[1]) * q / 2) + '" r="' + rd(lw * .7) + '" fill="' + col + '"/>';
      } else {
        var n = Math.max(1, Math.min(3, Math.round(num(d.arcs, 1))));
        for (var i = 0; i < n; i++) {
          var rr = r0 * (1 - i * .16), big2 = Math.abs(num(d.a2, 55) - num(d.a1, 0)) % 360 > 180 ? 1 : 0, sw3 = (-a2) > (-a1) ? 1 : 0;
          out += '<path d="M' + rd(cx + rr * Math.cos(-a1)) + " " + rd(cy + rr * Math.sin(-a1)) +
            "A" + rd(rr) + " " + rd(rr) + " 0 " + big2 + " " + sw3 + " " + rd(cx + rr * Math.cos(-a2)) + " " + rd(cy + rr * Math.sin(-a2)) +
            '" fill="none" stroke="' + col + '" stroke-width="' + lw * .9 + '"/>';
        }
      }
      /* 邊上的等長記號 */
      var tk = Math.max(0, Math.min(3, Math.round(num(d.ticks, 0))));
      if (tk) {
        [[p1, -a1], [p2, -a2]].forEach(function (pr) {
          var mx = (cx + pr[0][0]) / 2, my = (cy + pr[0][1]) / 2, nx = -Math.sin(pr[1]), ny = Math.cos(pr[1]), tl = lw * 3.2;
          for (var j = 0; j < tk; j++) {
            var off = (j - (tk - 1) / 2) * lw * 2.4;
            var bx = mx + Math.cos(pr[1]) * off, by = my + Math.sin(pr[1]) * off;
            out += ln(bx - nx * tl / 2, by - ny * tl / 2, bx + nx * tl / 2, by + ny * tl / 2, col, lw * .9, "");
          }
        });
      }
      if (!d.nolab) {
        var t = d.lab || (rd(deg, 1) + "°"), lr = r0 * 1.42;
        out += tx(cx + lr * Math.cos(mid), cy + lr * Math.sin(mid) + fs * .36, t, { fs: fs, ff: ff, c: col });
      }
      return out;
    }
  };

  /* ================================================================
     六、尺寸標註（延伸線＋雙箭頭＋長度文字）
     ================================================================ */
  DP.types.dim = {
    n: "尺寸標註",
    pts: 1,              /* 跟直線一樣用兩個端點，draw.js 會照 x,y → x2,y2 拉出來 */
    a: [
      { k: "off", n: "離開物件多遠", t: "num", min: -200, max: 200, step: 1 },
      { k: "ext", n: "延伸線長度", t: "num", min: 0, max: 60, step: 1 },
      { k: "lab", n: "文字（空白＝自動長度）", t: "txt" },
      { k: "unit", n: "單位", t: "txt" },
      { k: "scale", n: "幾 px 算 1 單位", t: "num", min: .1, max: 500, step: .1 },
      { k: "dec", n: "小數位數", t: "num", min: 0, max: 3, step: 1 },
      { k: "style", n: "端點樣式", t: "sel", o: [["arrow", "箭頭"], ["tick", "斜線"], ["dot", "圓點"]] },
      { k: "above", n: "文字放在線上方", t: "bool" }
    ],
    init: function (o) {
      o.x2 = o.x + 120; o.y2 = o.y;
      o.d = { off: 0, ext: 0, lab: "", unit: "", scale: 20, dec: 0, style: "arrow", above: 1 };
      o.s.fs = 14;
    },
    svg: function (o) {
      var d = o.d, s = o.s, col = s.sc || "#1c2635", lw = s.sw || 2, fs = s.fs || 14, ff = s.ff || "sans-serif";
      var x1 = o.x, y1 = o.y, x2 = o.x2, y2 = o.y2;
      var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len, off = num(d.off, 0);
      var ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
      var out = "", ext = num(d.ext, 0);
      if (ext > 0 && off !== 0) {
        var sgn = off > 0 ? 1 : -1;
        out += ln(x1 + nx * sgn * 2, y1 + ny * sgn * 2, ax + nx * sgn * ext, ay + ny * sgn * ext, col, lw * .7, "");
        out += ln(x2 + nx * sgn * 2, y2 + ny * sgn * 2, bx + nx * sgn * ext, by + ny * sgn * ext, col, lw * .7, "");
      }
      var st = d.style || "arrow", shrink = st === "arrow" ? lw * 3.4 : 0;
      out += ln(ax + dx / len * shrink, ay + dy / len * shrink, bx - dx / len * shrink, by - dy / len * shrink, col, lw, "");
      if (st === "arrow") { out += head(bx, by, ax, ay, lw, col); out += head(ax, ay, bx, by, lw, col); }
      else if (st === "tick") {
        [[ax, ay], [bx, by]].forEach(function (p) {
          var ux = (dx / len + nx) / Math.SQRT2, uy = (dy / len + ny) / Math.SQRT2, t2 = lw * 3.4;
          out += ln(p[0] - ux * t2, p[1] - uy * t2, p[0] + ux * t2, p[1] + uy * t2, col, lw, "");
        });
      } else {
        out += '<circle cx="' + rd(ax) + '" cy="' + rd(ay) + '" r="' + rd(lw * 1.3) + '" fill="' + col + '"/>';
        out += '<circle cx="' + rd(bx) + '" cy="' + rd(by) + '" r="' + rd(lw * 1.3) + '" fill="' + col + '"/>';
      }
      var t = d.lab;
      if (!t) {
        var sc = num(d.scale, 20) || 20, v = len / sc;
        t = v.toFixed(Math.max(0, Math.min(3, Math.round(num(d.dec, 0))))) + (d.unit || "");
      }
      if (t) {
        var mx = (ax + bx) / 2, my = (ay + by) / 2, side = d.above ? -1 : 1;
        var ang = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
        if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
        var tx2 = mx + nx * side * (fs * .55), ty2 = my + ny * side * (fs * .55);
        out += '<g transform="rotate(' + rd(ang) + " " + rd(tx2) + " " + rd(ty2) + ')">' + tx(tx2, ty2 + (side < 0 ? 0 : fs * .8), t, { fs: fs, ff: ff, c: col }) + "</g>";
      }
      return out;
    }
  };

  /* ================================================================
     七、raw：從圖庫拆出來的單一元件
     d = { tag, at:{屬性}, bx,by,bw,bh（原始外框） }
     搬動與縮放都用外層 transform，原本的路徑資料一點都不會被改到。
     ================================================================ */
  DP.types.raw = {
    n: "元件",
    a: [
      { k: "fillOn", n: "填色", t: "bool" },
      { k: "strokeOn", n: "描邊", t: "bool" }
    ],
    init: function (o) { o.d = { tag: "path", at: { d: "" }, bx: 0, by: 0, bw: 1, bh: 1 }; },
    svg: function (o) {
      var d = o.d, s = o.s, at = d.at || {};
      var bw = d.bw || 1, bh = d.bh || 1;
      var kx = o.w / bw, ky = o.h / bh, ms = d.ms || 1;
      /* 線粗與字級要除掉外層縮放，使用者在面板上設 2 就真的是 2 */
      var k = Math.max(.0001, Math.sqrt(Math.abs(kx * ky)) * ms);
      var body = "<" + d.tag;
      for (var a in at) {
        if (!at.hasOwnProperty(a) || at[a] == null) continue;
        if (a === "stroke" || a === "fill" || a === "stroke-width" || a === "stroke-dasharray" ||
          a === "font-size" || a === "font-family" || a === "fill-opacity" || a === "stroke-opacity" ||
          a === "opacity" || a === "style" || a === "class" || a === "transform") continue;
        body += " " + a + '="' + esc(at[a]) + '"';
      }
      var hasFill = d.fillOn !== 0 && d.fill0 && d.fill0 !== "none";
      var fill = hasFill ? (s.fc && s.fc !== "none" ? s.fc : d.fill0) : "none";
      if (d.tag === "text") {
        body += ' fill="' + (s.sc || "#1c2635") + '" font-size="' + rd((s.fs || 14) / k, 4) + '" font-family="' + (s.ff || "sans-serif") + '"' +
          (s.fi ? ' font-style="italic"' : "") + ' font-weight="' + (s.fw || at["font-weight"] || 400) + '"';
      } else {
        body += ' fill="' + fill + '"' + (hasFill && s.fo != null && s.fo < 1 ? ' fill-opacity="' + s.fo + '"' : "");
        if (d.strokeOn !== 0) {
          body += ' stroke="' + (s.sc || "#1c2635") + '" stroke-width="' + rd((s.sw || 2) / k, 4) + '"' +
            (s.sd ? ' stroke-dasharray="' + s.sd + '"' : d.dash0 ? ' stroke-dasharray="' + esc(d.dash0) + '"' : "") +
            ' stroke-linecap="round" stroke-linejoin="round"';
        } else body += ' stroke="none"';
      }
      body += d.tag === "text" ? ">" + esc(d.text || "") + "</" + d.tag + ">" : "/>";
      if (d.t0) body = '<g transform="' + esc(d.t0) + '">' + body + "</g>";
      return '<g transform="translate(' + rd(o.x) + " " + rd(o.y) + ") scale(" + rd(kx, 5) + " " + rd(ky, 5) + ") translate(" + rd(-d.bx) + " " + rd(-d.by) + ')">' + body + "</g>";
    }
  };

  /* ---- 把圖庫吐出來的整支 <svg> 拆成一塊一塊的 raw 物件 ----
     做法是先把它真的畫進一支看不見的 <svg>，再用瀏覽器自己算出來的
     getCTM() 與 getBBox() 把每個元素的位置攤平，所以不管圖庫裡包了幾層
     <g> 或 transform，拆出來的每一塊都還會在原來的位置上。 */
  var KEEP = { rect: ["x", "y", "width", "height", "rx", "ry"], circle: ["cx", "cy", "r"], ellipse: ["cx", "cy", "rx", "ry"], line: ["x1", "y1", "x2", "y2"], polyline: ["points"], polygon: ["points"], path: ["d"], text: ["x", "y", "text-anchor", "dy", "font-weight", "font-style"] };
  function mstr(m) { return "matrix(" + rd(m.a, 6) + "," + rd(m.b, 6) + "," + rd(m.c, 6) + "," + rd(m.d, 6) + "," + rd(m.e, 4) + "," + rd(m.f, 4) + ")"; }
  DP.explode = function (markup, place) {
    var host = document.createElement("div");
    host.setAttribute("style", "position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden");
    host.innerHTML = String(markup || "");
    var root = host.querySelector("svg");
    if (!root) return [];
    document.body.appendChild(host);
    var out = [];
    try {
      var w0 = place.w0 || 1, h0 = place.h0 || 1;
      root.setAttribute("width", w0); root.setAttribute("height", h0);
      root.removeAttribute("preserveAspectRatio");
      var kx = (place.w || w0) / w0, ky = (place.h || h0) / h0;
      var nodes = root.querySelectorAll("rect,circle,ellipse,line,polyline,polygon,path,text");
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i], tag = el.tagName.toLowerCase();
        if (el.closest("defs,clipPath,mask,marker,pattern")) continue;
        var cs = window.getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
        var m = null, bb = null;
        try { m = el.getCTM(); bb = el.getBBox(); } catch (e) { continue; }
        if (!m || !bb) continue;
        if (tag === "text" && !String(el.textContent).trim()) continue;
        var sw = parseFloat(cs.strokeWidth) || 0;
        var strokeOn = cs.stroke && cs.stroke !== "none" ? 1 : 0;
        var pad = (strokeOn ? sw : 0) / 2 + .01;
        /* 把四個角用矩陣轉過去，算出攤平後的外框 */
        var cor = [[bb.x - pad, bb.y - pad], [bb.x + bb.width + pad, bb.y - pad], [bb.x + bb.width + pad, bb.y + bb.height + pad], [bb.x - pad, bb.y + bb.height + pad]];
        var x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
        cor.forEach(function (p) {
          var px = m.a * p[0] + m.c * p[1] + m.e, py = m.b * p[0] + m.d * p[1] + m.f;
          if (px < x1) x1 = px; if (px > x2) x2 = px; if (py < y1) y1 = py; if (py > y2) y2 = py;
        });
        var bw = Math.max(.5, x2 - x1), bh = Math.max(.5, y2 - y1);
        var at = {}, keep = KEEP[tag] || [];
        keep.forEach(function (k) { var v = el.getAttribute(k); if (v != null) at[k] = v; });
        var ms = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
        var fill0 = cs.fill && cs.fill !== "none" ? cs.fill : "none";
        out.push({
          t: "raw", x: place.x + x1 * kx, y: place.y + y1 * ky, w: bw * kx, h: bh * ky, rot: 0,
          s: { sc: strokeOn ? rgb(cs.stroke, place.color) : (tag === "text" ? rgb(cs.fill, place.color) : place.color), sw: rd(sw * ms || 1.6, 2), /* 瀏覽器回來的是 "4px, 4px"，帶單位的話 Word 與 Illustrator 讀不懂，要洗乾淨 */
            sd: cs.strokeDasharray && cs.strokeDasharray !== "none" ? cs.strokeDasharray.replace(/px/g, "").replace(/,/g, " ").replace(/\s+/g, " ").trim() : "", fc: fill0 === "none" ? "none" : rgb(fill0, place.color), fo: parseFloat(cs.fillOpacity) || 1, fs: rd(parseFloat(cs.fontSize) * ms || 14, 1), fw: parseInt(cs.fontWeight, 10) || 400, fi: cs.fontStyle === "italic" ? 1 : 0, fa: el.getAttribute("text-anchor") || "middle", ff: place.ff || "sans-serif", a1: 0, a2: 0, r: 0 },
          d: { tag: tag, at: at, text: tag === "text" ? el.textContent : "", bx: x1, by: y1, bw: bw, bh: bh, ms: ms, t0: mstr(m), fill0: fill0 === "none" ? "none" : "f", dash0: "", fillOn: fill0 === "none" ? 0 : 1, strokeOn: strokeOn }
        });
      }
    } finally { host.remove(); }
    return out;
  };
  /* getComputedStyle 回來的是 rgb(...)，換成 #rrggbb 比較好存也好匯出 */
  function rgb(v, fb) {
    var m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(String(v || ""));
    if (!m) return /^#/.test(v) ? v : (fb || "#1c2635");
    var n = (Math.round(+m[1]) << 16) + (Math.round(+m[2]) << 8) + Math.round(+m[3]);
    return "#" + ("000000" + n.toString(16)).slice(-6);
  }

  DP.svg = function (o) { var T = DP.types[o.t]; return T ? T.svg(o) : ""; };
  DP.init = function (o) { var T = DP.types[o.t]; if (T) { T.init(o); if (T.w) { o.w = T.w; o.h = T.h; } } };
  DP.name = function (t) { return DP.types[t] ? DP.types[t].n : t; };
})();
