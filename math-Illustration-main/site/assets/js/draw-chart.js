/* 製圖：統計圖表（補強）。
   題庫原本只有長條、折線、圓形、平均長條四種；這裡補上課本與會考常見的其餘圖表：
   直方圖、雙長條、堆疊長條、散布圖、莖葉圖、盒鬚圖、次數分配表、兩個量的關係圖。 */
(function () {
  "use strict";
  var NB = window.NB, C = (NB.drawChart = { FIGS: {} }), F = C.FIGS;
  var TN = { r: "#e58a73", b: "#78a9e0", g: "#7fc3a0", y: "#ecc566", p: "#b7a5e6", k: "#9aa1ab" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function svg(w, h, body, k) {
    return '<svg class="dfig" viewBox="0 0 ' + w + " " + h + '" width="' + Math.round(w * (k || 1)) + '" height="' + Math.round(h * (k || 1)) +
      '" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="inherit">' + body + "</svg>";
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || "middle") + '" dominant-baseline="' + (o.b || "middle") +
      '" font-size="' + (o.z || 11) + '" fill="' + (o.c || "currentColor") + '" stroke="none"' + (o.w ? ' font-weight="' + o.w + '"' : "") + ">" + esc(s) + "</text>";
  }
  function L(x1, y1, x2, y2, o) {
    o = o || {};
    return '<path d="M' + x1 + " " + y1 + "L" + x2 + " " + y2 + '"' + (o.w ? ' stroke-width="' + o.w + '"' : "") + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + (o.c ? ' stroke="' + o.c + '"' : "") + "/>";
  }
  function R(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' +
      (o.f ? ' fill="' + o.f + '" fill-opacity="' + (o.fo == null ? .55 : o.fo) + '"' : ' fill="none"') + (o.w ? ' stroke-width="' + o.w + '"' : "") + "/>";
  }
  /* 座標框：回傳 {s, px, py, W, H, sy} */
  function frame(w, h, mx, xl, yl, pad) {
    var x0 = pad || 44, y0 = h - 40, Wd = w - x0 - 16, Hd = y0 - 24;
    var s = L(x0, y0, x0 + Wd, y0, { w: 1.8 }) + L(x0, y0, x0, y0 - Hd, { w: 1.8 });
    var step = niceStep(mx);
    for (var v = 0; v <= mx + 1e-9; v += step) {
      var y = y0 - (Hd * v) / mx;
      s += L(x0 - 4, y, x0, y, { w: 1 }) + T(x0 - 8, y, String(Math.round(v * 100) / 100), { a: "end", z: 10 });
      if (v > 0) s += L(x0, y, x0 + Wd, y, { d: "3 3", w: .8, c: TN.k });
    }
    if (xl) s += T(x0 + Wd / 2, y0 + 30, xl, { z: 11 });
    if (yl) s += T(x0 - 30, y0 - Hd - 12, yl, { z: 11 });
    return { s: s, x0: x0, y0: y0, Wd: Wd, Hd: Hd };
  }
  function niceStep(m) { var c = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]; for (var i = 0; i < c.length; i++) if (m / c[i] <= 6) return c[i]; return Math.pow(10, Math.ceil(Math.log10(m / 6))); }
  function mxOf(a) { return Math.max.apply(null, a.concat([1])); }

  /* 直方圖（長條相連） */
  F.chHist = function (labels, vals, xl, yl) {
    var v = (vals && vals.length ? vals : [3, 7, 12, 9, 4]).map(Number);
    var lb = labels && labels.length ? labels : ["0-10", "10-20", "20-30", "30-40", "40-50"];
    var W = Math.max(260, v.length * 52 + 70), H = 190, mx = mxOf(v), f = frame(W, H, mx, xl, yl), s = f.s;
    var bw = f.Wd / v.length;
    v.forEach(function (y, i) {
      var hh = (f.Hd * y) / mx;
      s += R(f.x0 + bw * i, f.y0 - hh, bw, hh, { f: TN.b, fo: .55, w: 1.4 });
      s += T(f.x0 + bw * (i + .5), f.y0 + 14, lb[i] || "", { z: 10 });
    });
    return svg(W, H, s, .95);
  };
  /* 雙長條（兩組比較） */
  F.chBar2 = function (labels, a, b, n1, n2) {
    var A = (a && a.length ? a : [6, 9, 4]).map(Number), B = (b && b.length ? b : [4, 7, 8]).map(Number);
    var lb = labels && labels.length ? labels : ["甲", "乙", "丙"];
    var W = Math.max(260, lb.length * 76 + 70), H = 200, mx = mxOf(A.concat(B)), f = frame(W, H, mx, "", ""), s = f.s;
    var gw = f.Wd / lb.length, bw = gw * 0.33;
    lb.forEach(function (t, i) {
      var x = f.x0 + gw * i + gw / 2;
      [[A[i], TN.b, -1], [B[i], TN.r, 1]].forEach(function (p) {
        var hh = (f.Hd * (p[0] || 0)) / mx;
        s += R(x + (p[2] < 0 ? -bw : 2), f.y0 - hh, bw - 2, hh, { f: p[1], fo: .6, w: 1.4 });
      });
      s += T(x, f.y0 + 14, t, { z: 11 });
    });
    s += R(f.x0, 10, 12, 10, { f: TN.b, fo: .6, w: 1 }) + T(f.x0 + 18, 15, n1 || "第一組", { a: "start", z: 10 });
    s += R(f.x0 + 76, 10, 12, 10, { f: TN.r, fo: .6, w: 1 }) + T(f.x0 + 94, 15, n2 || "第二組", { a: "start", z: 10 });
    return svg(W, H, s, .95);
  };
  /* 堆疊長條 */
  F.chStack = function (labels, a, b, n1, n2) {
    var A = (a && a.length ? a : [4, 6, 3]).map(Number), B = (b && b.length ? b : [3, 2, 5]).map(Number);
    var lb = labels && labels.length ? labels : ["甲", "乙", "丙"];
    var tot = A.map(function (x, i) { return x + (B[i] || 0); });
    var W = Math.max(250, lb.length * 70 + 70), H = 200, mx = mxOf(tot), f = frame(W, H, mx, "", ""), s = f.s;
    var gw = f.Wd / lb.length, bw = gw * 0.5;
    lb.forEach(function (t, i) {
      var x = f.x0 + gw * i + (gw - bw) / 2, h1 = (f.Hd * (A[i] || 0)) / mx, h2 = (f.Hd * (B[i] || 0)) / mx;
      s += R(x, f.y0 - h1, bw, h1, { f: TN.b, fo: .6, w: 1.4 });
      s += R(x, f.y0 - h1 - h2, bw, h2, { f: TN.y, fo: .7, w: 1.4 });
      s += T(x + bw / 2, f.y0 + 14, t, { z: 11 });
    });
    s += R(f.x0, 10, 12, 10, { f: TN.b, fo: .6, w: 1 }) + T(f.x0 + 18, 15, n1 || "甲類", { a: "start", z: 10 });
    s += R(f.x0 + 70, 10, 12, 10, { f: TN.y, fo: .7, w: 1 }) + T(f.x0 + 88, 15, n2 || "乙類", { a: "start", z: 10 });
    return svg(W, H, s, .95);
  };
  /* 散布圖 */
  F.chScatter = function (xs, ys, xl, yl) {
    var X = (xs && xs.length ? xs : [1, 2, 3, 4, 5, 6]).map(Number), Y = (ys && ys.length ? ys : [2, 3, 5, 4, 7, 8]).map(Number);
    var W = 260, H = 200, mx = mxOf(Y), f = frame(W, H, mx, xl || "", yl || ""), s = f.s;
    var mxX = mxOf(X);
    X.forEach(function (x, i) {
      var px = f.x0 + (f.Wd * x) / (mxX * 1.1), py = f.y0 - (f.Hd * (Y[i] || 0)) / mx;
      s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="4" fill="' + TN.r + '" fill-opacity=".75" stroke="none"/>';
    });
    for (var i = 1; i <= 5; i++) s += T(f.x0 + (f.Wd * i) / 5.5, f.y0 + 14, String(Math.round((mxX * 1.1 * i) / 5.5)), { z: 10 });
    return svg(W, H, s, .95);
  };
  /* 莖葉圖 */
  F.chStem = function (data, lab) {
    var v = (data && data.length ? data : [12, 15, 18, 21, 23, 23, 31, 34, 37, 42]).map(Number).sort(function (a, b) { return a - b; });
    var by = {}, keys = [];
    v.forEach(function (n) { var st = Math.floor(n / 10), lf = n % 10; if (!by[st]) { by[st] = []; keys.push(st); } by[st].push(lf); });
    var W = 230, rowH = 22, H = keys.length * rowH + 60, s = "";
    s += T(70, 24, "莖", { z: 12, w: 700 }) + T(140, 24, "葉", { z: 12, w: 700 });
    s += L(96, 32, 96, H - 20, { w: 1.6 }) + L(36, 32, 200, 32, { w: 1.6 });
    keys.forEach(function (st, i) {
      var y = 46 + i * rowH;
      s += T(80, y, String(st), { a: "end", z: 12 });
      by[st].forEach(function (lf, j) { s += T(110 + j * 16, y, String(lf), { z: 12 }); });
    });
    if (lab) s += T(W / 2, H - 8, lab, { z: 11 });
    return svg(W, H, s, 1);
  };
  /* 盒鬚圖 */
  F.chBox = function (min, q1, med, q3, max, lab) {
    var W = 280, H = 140, s = "", x0 = 30, Wd = 220, y = 64, bh = 44;
    var a = [+min, +q1, +med, +q3, +max], lo = Math.min.apply(null, a), hi = Math.max.apply(null, a), sp = hi - lo || 1;
    function px(v) { return x0 + (Wd * (v - lo)) / sp; }
    s += L(px(a[0]), y, px(a[1]), y, { w: 1.6 }) + L(px(a[3]), y, px(a[4]), y, { w: 1.6 });
    s += L(px(a[0]), y - 14, px(a[0]), y + 14, { w: 1.8 }) + L(px(a[4]), y - 14, px(a[4]), y + 14, { w: 1.8 });
    s += R(px(a[1]), y - bh / 2, px(a[3]) - px(a[1]), bh, { f: TN.b, fo: .4, w: 1.8 });
    s += L(px(a[2]), y - bh / 2, px(a[2]), y + bh / 2, { w: 2.4, c: TN.r });
    ["最小值", "Q1", "中位數", "Q3", "最大值"].forEach(function (t, i) {
      s += T(px(a[i]), y + 38, String(a[i]), { z: 11 }) + T(px(a[i]), y + 52, t, { z: 10, c: TN.k });
    });
    if (lab) s += T(W / 2, 20, lab, { z: 12 });
    return svg(W, H, s, .95);
  };
  /* 次數分配表（畫成 SVG 表格，才能跟其他圖一起匯出） */
  F.chFreq = function (labels, vals, h1, h2) {
    var lb = labels && labels.length ? labels : ["0-10", "10-20", "20-30", "30-40"];
    var v = (vals && vals.length ? vals : [3, 7, 12, 5]).map(Number);
    var rowH = 28, W = 230, H = (lb.length + 1) * rowH + 12, s = "", x = 10, w = W - 20, cw = w / 2;
    s += R(x, 6, w, rowH, { f: TN.k, fo: .18, w: 1.6 });
    s += T(x + cw / 2, 6 + rowH / 2, h1 || "分組", { z: 12, w: 700 }) + T(x + cw * 1.5, 6 + rowH / 2, h2 || "次數", { z: 12, w: 700 });
    lb.forEach(function (t, i) {
      var y = 6 + rowH * (i + 1);
      s += R(x, y, w, rowH, { w: 1.2 });
      s += T(x + cw / 2, y + rowH / 2, t, { z: 12 }) + T(x + cw * 1.5, y + rowH / 2, String(v[i] == null ? "" : v[i]), { z: 12 });
    });
    s += L(x + cw, 6, x + cw, 6 + rowH * (lb.length + 1), { w: 1.2 });
    s += R(x, 6, w, rowH * (lb.length + 1), { w: 1.8 });
    return svg(W, H, s, 1);
  };

  /* ---------- 登記 ---------- */
  function TS(k, n, v) { return { t: "txts", k: k, n: n, v: v }; }
  function NS(k, n, v) { return { t: "nums", k: k, n: n, v: v }; }
  function TT(k, n, v) { return { t: "txt", k: k, n: n, v: v }; }
  function N(k, n, v, min, max) { return { t: "num", k: k, n: n, v: v, min: min, max: max, step: 1 }; }
  var G = "統計圖表";

  C.SPECS = [
    { f: "chHist", g: G, n: "直方圖", a: [TS("labels", "分組", "0-10,10-20,20-30,30-40,40-50"), NS("vals", "次數", "3,7,12,9,4"), TT("xl", "橫軸", ""), TT("yl", "縱軸", "")] },
    { f: "chBar2", g: G, n: "雙長條圖（兩組比較）", a: [TS("labels", "項目", "甲,乙,丙"), NS("a", "第一組", "6,9,4"), NS("b", "第二組", "4,7,8"), TT("n1", "第一組名稱", "第一組"), TT("n2", "第二組名稱", "第二組")] },
    { f: "chStack", g: G, n: "堆疊長條圖", a: [TS("labels", "項目", "甲,乙,丙"), NS("a", "下層", "4,6,3"), NS("b", "上層", "3,2,5"), TT("n1", "下層名稱", "甲類"), TT("n2", "上層名稱", "乙類")] },
    { f: "chScatter", g: G, n: "散布圖", a: [NS("xs", "橫軸資料", "1,2,3,4,5,6"), NS("ys", "縱軸資料", "2,3,5,4,7,8"), TT("xl", "橫軸", ""), TT("yl", "縱軸", "")] },
    { f: "chStem", g: G, n: "莖葉圖", a: [NS("data", "資料", "12,15,18,21,23,23,31,34,37,42"), TT("lab", "標示", "")] },
    { f: "chBox", g: G, n: "盒鬚圖", a: [N("min", "最小值", 2, -999, 999), N("q1", "Q1", 6, -999, 999), N("med", "中位數", 9, -999, 999), N("q3", "Q3", 13, -999, 999), N("max", "最大值", 18, -999, 999), TT("lab", "標示", "")] },
    { f: "chFreq", g: G, n: "次數分配表", a: [TS("labels", "分組", "0-10,10-20,20-30,30-40"), NS("vals", "次數", "3,7,12,5"), TT("h1", "左欄標題", "分組"), TT("h2", "右欄標題", "次數")] }
  ];

  function install() {
    if (!window.DR) window.DR = {};
    if (!DR.fig) DR.fig = {};
    Object.keys(F).forEach(function (k) { DR.fig[k] = F[k]; });
    if (NB.drawLib && NB.drawLib.SPECS) C.SPECS.forEach(function (x) { NB.drawLib.SPECS.push(x); });
  }
  install();
})();
