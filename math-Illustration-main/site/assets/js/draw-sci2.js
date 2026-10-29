/* 製圖：國中理化圖庫（第二批）。
   第一批（draw-sci.js）放的是最常用的電路、器材、光學、力學、波、粒子；
   這一批補課綱裡其他會用到的：電解與電化學、電磁感應、浮力壓力摩擦、打點計時器、
   面鏡與色散、縱波、熱的傳播、加熱曲線、蒸餾與排水法、碳鏈、質量守恆。
   畫法與第一批相同：吐完整 <svg>、線條 currentColor。 */
(function () {
  "use strict";
  var NB = window.NB, S2 = (NB.drawSci2 = { FIGS: {} }), F = S2.FIGS;
  var TN = { r: "#e58a73", b: "#78a9e0", g: "#7fc3a0", y: "#ecc566", p: "#b7a5e6", k: "#9aa1ab" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function svg(w, h, body, k) {
    return '<svg class="dfig" viewBox="0 0 ' + w + " " + h + '" width="' + Math.round(w * (k || 1)) + '" height="' + Math.round(h * (k || 1)) +
      '" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="inherit">' + body + "</svg>";
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || "middle") + '" dominant-baseline="' + (o.b || "middle") +
      '" font-size="' + (o.z || 12) + '" fill="' + (o.c || "currentColor") + '" stroke="none"' + (o.w ? ' font-weight="' + o.w + '"' : "") + ">" + esc(s) + "</text>";
  }
  function L(x1, y1, x2, y2, o) {
    o = o || {};
    return '<path d="M' + x1 + " " + y1 + "L" + x2 + " " + y2 + '"' + (o.w ? ' stroke-width="' + o.w + '"' : "") + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + (o.c ? ' stroke="' + o.c + '"' : "") + "/>";
  }
  function R(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (o.rx ? ' rx="' + o.rx + '"' : "") +
      (o.f ? ' fill="' + o.f + '" fill-opacity="' + (o.fo == null ? 0.45 : o.fo) + '"' : "") + (o.c ? ' stroke="' + o.c + '"' : "") + (o.w ? ' stroke-width="' + o.w + '"' : "") + "/>";
  }
  function arw(x1, y1, x2, y2, o) {
    o = o || {}; var c = o.c || "currentColor", w = o.w || 1.8, Ln = o.hl || Math.max(9, w * 4.2), W = Ln * 0.5;
    var a = Math.atan2(y2 - y1, x2 - x1), bx = x2 - Ln * Math.cos(a), by = y2 - Ln * Math.sin(a);
    return '<path d="M' + x1 + " " + y1 + "L" + bx + " " + by + '" stroke="' + c + '" stroke-width="' + w + '"' + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + "/>" +
      '<path d="M' + x2 + " " + y2 + "L" + (bx + W * Math.sin(a)) + " " + (by - W * Math.cos(a)) + "L" + (bx - W * Math.sin(a)) + " " + (by + W * Math.cos(a)) + 'Z" fill="' + c + '" stroke="none"/>';
  }
  function beakerPath(x, y, w, h, v, col) {   /* 小燒杯（給裝置圖用） */
    var s = "", f = Math.max(0, Math.min(1, v));
    if (f > 0) s += R(x, y + h * (1 - f), w, h * f, { f: col || TN.b, fo: 0.45, c: "none" });
    s += '<path d="M' + x + " " + y + "V" + (y + h) + "h" + w + "V" + y + '" stroke-width="1.6"/>';
    return s;
  }

  /* ---------- 電與磁 ---------- */
  F.sci2Electroscope = function (charged, lab) {
    var W = 150, H = 190, s = "", cx = 75;
    s += '<ellipse cx="' + cx + '" cy="30" rx="20" ry="9" fill="' + TN.k + '" fill-opacity=".4" stroke-width="1.6"/>';
    s += L(cx, 39, cx, 86, { w: 2 });
    s += '<path d="M40 86h70v84H40z" stroke-width="1.8"/>';
    var d = +charged ? 17 : 3;
    s += '<path d="M' + cx + " 92L" + (cx - d) + " 140" + '" stroke-width="2" stroke="' + TN.y + '"/>';
    s += '<path d="M' + cx + " 92L" + (cx + d) + " 140" + '" stroke-width="2" stroke="' + TN.y + '"/>';
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sci2Electrolysis = function (lab1, lab2, lab) {
    var W = 230, H = 190, s = "", x = 34, y = 56, w = 162, hh = 104;
    s += beakerPath(x, y, w, hh, 0.82, TN.b);
    [[x + 48, lab1 || "H₂"], [x + 114, lab2 || "O₂"]].forEach(function (p, i) {
      s += R(p[0] - 13, y + 8, 26, 56, { f: "#fff", fo: 0.55, w: 1.4 });
      s += L(p[0], y - 22, p[0], y + 30, { w: 2 });
      for (var k = 0; k < (i ? 3 : 5); k++) s += '<circle cx="' + (p[0] - 6 + (k % 3) * 6) + '" cy="' + (y + 50 - k * 9) + '" r="3.2" fill="' + TN.g + '" stroke="none"/>';
      s += T(p[0], y - 30, p[1], { z: 12 });
    });
    s += L(x + 48, y - 22, x + 48, 24, { w: 1.6 }) + L(x + 114, y - 22, x + 114, 24, { w: 1.6 }) + L(x + 48, 24, x + 114, 24, { w: 1.6 });
    s += L(x + 70, 24, x + 70, 14, { w: 1.6 }) + '<path d="M' + (x + 70) + ' 14h-10M' + (x + 92) + ' 14h10" stroke-width="1.6"/>';
    s += '<path d="M' + (x + 76) + ' 6V22" stroke-width="2.4"/><path d="M' + (x + 86) + ' 10V18" stroke-width="1.4"/>';
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Cell = function (lab) {
    var W = 200, H = 170, s = "", x = 26, y = 52, w = 148, hh = 96;
    s += beakerPath(x, y, w, hh, 0.78, TN.g);
    s += R(x + 34, y - 18, 16, 86, { f: TN.k, fo: 0.5, w: 1.6 }) + T(x + 42, y - 26, "鋅", { z: 12 });
    s += R(x + 100, y - 18, 16, 86, { f: TN.r, fo: 0.5, w: 1.6 }) + T(x + 108, y - 26, "銅", { z: 12 });
    s += L(x + 42, y - 18, x + 42, 20, { w: 1.6 }) + L(x + 108, y - 18, x + 108, 20, { w: 1.6 }) + L(x + 42, 20, x + 68, 20, { w: 1.6 }) + L(x + 82, 20, x + 108, 20, { w: 1.6 });
    s += '<circle cx="' + (x + 75) + '" cy="20" r="13"/>' + T(x + 75, 20, "A", { z: 12, w: 700 });
    s += T(x + 12, y + hh - 12, "電解液", { a: "start", z: 11 });
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Heater = function (lab) {
    var W = 210, H = 150, s = "";
    s += R(30, 40, 150, 60, { w: 1.8 });
    var d = "M42 70";
    for (var i = 0; i < 7; i++) d += "l10 " + (i % 2 ? 18 : -18);
    s += '<path d="' + d + '" stroke="' + TN.r + '" stroke-width="2.4"/>';
    s += L(30, 70, 10, 70, { w: 1.6 }) + L(180, 70, 200, 70, { w: 1.6 });
    [60, 92, 124].forEach(function (x) { s += arw(x, 36, x, 14, { c: TN.r, w: 1.4, hl: 7 }); });
    s += T(W / 2, 128, lab || "電流的熱效應", { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2WireForce = function (dir, lab) {
    var W = 230, H = 180, s = "", cx = 115, cy = 92;
    s += R(26, 40, 26, 104, { f: TN.r, fo: .55, w: 1.6 }) + T(39, 92, "N", { z: 14, w: 700 });
    s += R(178, 40, 26, 104, { f: TN.b, fo: .55, w: 1.6 }) + T(191, 92, "S", { z: 14, w: 700 });
    for (var i = 0; i < 4; i++) { var y = 56 + i * 24; s += arw(56, y, 174, y, { c: TN.k, w: 1.2, hl: 7 }); }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="#fff" stroke-width="1.8"/>';
    s += (+dir >= 0 ? '<circle cx="' + cx + '" cy="' + cy + '" r="3.4" fill="currentColor" stroke="none"/>'
      : L(cx - 7, cy - 7, cx + 7, cy + 7, { w: 1.8 }) + L(cx + 7, cy - 7, cx - 7, cy + 7, { w: 1.8 }));
    s += arw(cx, cy - 13, cx, cy - 52, { c: TN.g, w: 2.2 }) + T(cx + 14, cy - 44, "受力", { a: "start", z: 11, c: TN.g });
    s += T(cx, cy + 28, +dir >= 0 ? "電流出來" : "電流進去", { z: 11 });
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Induction = function (into, lab) {
    var W = 260, H = 160, s = "", x0 = 118, y = 52, w = 104, hh = 46;
    for (var i = 0; i < 5; i++) s += '<ellipse cx="' + (x0 + (w * (i + .5)) / 5).toFixed(1) + '" cy="' + (y + hh / 2) + '" rx="8" ry="' + hh / 2 + '" stroke-width="1.6"/>';
    s += L(x0, y + hh / 2, x0 - 16, y + hh / 2, { w: 1.4 }) + L(x0 + w, y + hh / 2, x0 + w + 16, y + hh / 2, { w: 1.4 });
    s += L(x0 - 16, y + hh / 2, x0 - 16, 130, { w: 1.4 }) + L(x0 + w + 16, y + hh / 2, x0 + w + 16, 130, { w: 1.4 }) + L(x0 - 16, 130, x0 + 40, 130, { w: 1.4 }) + L(x0 + 56, 130, x0 + w + 16, 130, { w: 1.4 });
    s += '<circle cx="' + (x0 + 48) + '" cy="130" r="13"/>' + T(x0 + 48, 130, "G", { z: 12, w: 700 });
    s += R(18, y + 8, 62, 30, { f: TN.r, fo: .5, w: 1.6 }) + T(34, y + 23, "N", { z: 12, w: 700 }) + T(64, y + 23, "S", { z: 12, w: 700 });
    s += arw(86, y + 23, +into ? 114 : 60, y + 23, { c: TN.g, w: 2 });
    s += T(72, y - 6, +into ? "靠近" : "遠離", { z: 11, c: TN.g });
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Motor = function (lab) {
    var W = 240, H = 170, s = "";
    s += R(20, 40, 26, 94, { f: TN.r, fo: .55, w: 1.6 }) + T(33, 87, "N", { z: 13, w: 700 });
    s += R(194, 40, 26, 94, { f: TN.b, fo: .55, w: 1.6 }) + T(207, 87, "S", { z: 13, w: 700 });
    s += R(76, 56, 88, 60, { w: 2 });
    s += L(76, 86, 50, 86, { w: 1.6 }) + L(164, 86, 190, 86, { w: 1.6 });
    s += '<circle cx="62" cy="86" r="9" stroke-width="1.6"/><circle cx="178" cy="86" r="9" stroke-width="1.6"/>';
    s += arw(96, 52, 144, 52, { c: TN.g, w: 1.8, hl: 8 }) + arw(144, 120, 96, 120, { c: TN.g, w: 1.8, hl: 8 });
    s += T(120, 140, lab || "電動機（馬達）", { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 力與運動 ---------- */
  F.sci2Buoy = function (sunk, lab) {
    var W = 210, H = 180, s = "", x = 26, y = 40, w = 158, hh = 118;
    var f = Math.max(0.1, Math.min(0.95, (+sunk) / 100));
    s += R(x, y + 24, w, hh - 24, { f: TN.b, fo: .35, c: "none" });
    s += '<path d="M' + x + " " + y + "V" + (y + hh) + "h" + w + "V" + y + '" stroke-width="1.8"/>';
    s += L(x, y + 24, x + w, y + 24, { c: TN.b, w: 1.6 });
    var bw = 56, bh = 44, bx = x + w / 2 - bw / 2, by = y + 24 - bh * (1 - f);
    s += R(bx, by, bw, bh, { f: TN.y, fo: .6, w: 1.8 });
    s += arw(bx + bw / 2, by + bh + 4, bx + bw / 2, by + bh + 42, { c: TN.r, w: 2 }) + T(bx + bw / 2 + 12, by + bh + 36, "重力", { a: "start", z: 11, c: TN.r });
    s += arw(bx + bw / 2, by - 4, bx + bw / 2, by - 36, { c: TN.g, w: 2 }) + T(bx + bw / 2 + 12, by - 30, "浮力", { a: "start", z: 11, c: TN.g });
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Pressure = function (area, lab) {
    var W = 230, H = 160, s = "", y = 112;
    s += '<path d="M14 ' + y + "h202" + '" stroke-width="2.2"/>';
    for (var i = 0; i < 11; i++) s += L(20 + i * 18, y, 14 + i * 18, y + 9, { w: 1 });
    var w = Math.max(16, Math.min(120, +area));
    s += R(W / 2 - w / 2, y - 52, w, 52, { f: TN.y, fo: .55, w: 1.8 });
    var n = Math.max(2, Math.round(w / 18));
    for (i = 0; i < n; i++) { var x = W / 2 - w / 2 + (w * (i + .5)) / n; s += arw(x, y - 4, x, y + 16, { c: TN.r, w: 1.6, hl: 7 }); }
    s += T(W / 2, y - 64, "受力面積 " + w + " 單位", { z: 11 });
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Friction = function (lab) {
    var W = 240, H = 140, s = "", y = 94;
    s += '<path d="M14 ' + y + "h212" + '" stroke-width="2.2"/>';
    for (var i = 0; i < 12; i++) s += L(20 + i * 18, y, 14 + i * 18, y + 9, { w: 1 });
    s += R(80, y - 42, 70, 42, { f: TN.b, fo: .5, w: 1.8 });
    s += arw(150, y - 21, 212, y - 21, { c: TN.g, w: 2.2 }) + T(206, y - 33, "施力", { z: 11, c: TN.g });
    s += arw(80, y - 10, 24, y - 10, { c: TN.r, w: 2.2 }) + T(34, y - 22, "摩擦力", { z: 11, c: TN.r });
    if (lab) s += T(W / 2, 126, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Utube = function (h1, h2, lab) {
    var W = 210, H = 170, s = "", xl = 56, xr = 154, yB = 140, w = 22;
    var t1 = yB - Math.max(10, Math.min(110, +h1)), t2 = yB - Math.max(10, Math.min(110, +h2));
    s += '<path d="M' + (xl - w / 2) + " 28V" + yB + "H" + (xr + w / 2) + "V28" + '" stroke-width="1.8"/>';
    s += '<path d="M' + (xl + w / 2) + " 28V" + (yB - w) + "H" + (xr - w / 2) + "V28" + '" stroke-width="1.8"/>';
    s += R(xl - w / 2, t1, w, yB - t1, { f: TN.b, fo: .45, c: "none" });
    s += R(xr - w / 2, t2, w, yB - t2, { f: TN.b, fo: .45, c: "none" });
    s += R(xl + w / 2, yB - w, xr - xl - w, w, { f: TN.b, fo: .45, c: "none" });
    s += L(xl - w / 2, t1, xl + w / 2, t1, { c: TN.b, w: 1.6 }) + L(xr - w / 2, t2, xr + w / 2, t2, { c: TN.b, w: 1.6 });
    s += L(xl - w / 2 - 14, t1, xr + w / 2 + 14, t1, { d: "4 3", w: 1 });
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Wheel = function (rBig, rSmall, lab) {
    var W = 200, H = 190, s = "", cx = 100, cy = 86;
    var Rb = Math.max(24, Math.min(70, +rBig)), Rs = Math.max(10, Math.min(Rb - 6, +rSmall));
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Rb + '" fill="' + TN.y + '" fill-opacity=".28" stroke-width="1.8"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Rs + '" fill="' + TN.k + '" fill-opacity=".35" stroke-width="1.8"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="currentColor"/>';
    s += L(cx - Rb, cy, cx - Rb, cy + 56, { w: 1.6 }) + arw(cx - Rb, cy + 40, cx - Rb, cy + 72, { c: TN.g, w: 2 }) + T(cx - Rb - 8, cy + 64, "施力", { a: "end", z: 11, c: TN.g });
    s += L(cx + Rs, cy, cx + Rs, cy + 56, { w: 1.6 }) + arw(cx + Rs, cy + 40, cx + Rs, cy + 72, { c: TN.r, w: 2 }) + T(cx + Rs + 8, cy + 64, "抗力", { a: "start", z: 11, c: TN.r });
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Ticker = function (gaps, lab) {
    var W = 320, H = 110, s = "", y = 50, x = 18;
    var g = (gaps && gaps.length ? gaps : [10, 16, 24, 34, 46]).map(Number);
    s += R(10, 30, 300, 40, { w: 1.6 });
    g.forEach(function (d) { x += d; if (x < 304) s += '<circle cx="' + x + '" cy="' + y + '" r="3.2" fill="currentColor" stroke="none"/>'; });
    s += T(W / 2, 92, lab || "打點計時器紙帶（愈來愈快）", { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Circular = function (lab) {
    var W = 200, H = 190, s = "", cx = 100, cy = 92, R0 = 62;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" stroke-dasharray="4 4" stroke-width="1.2"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="3.4" fill="currentColor"/>';
    var px = cx + R0, py = cy;
    s += '<circle cx="' + px + '" cy="' + py + '" r="10" fill="' + TN.b + '" fill-opacity=".6" stroke-width="1.6"/>';
    s += L(cx, cy, px, py, { w: 1.6 });
    s += arw(px, py, px, py - 46, { c: TN.g, w: 2.2 }) + T(px + 10, py - 42, "速度", { a: "start", z: 11, c: TN.g });
    s += arw(px - 10, py, cx + 16, cy, { c: TN.r, w: 2.2 }) + T(cx + 26, cy - 12, "向心力", { a: "start", z: 11, c: TN.r });
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 光與波 ---------- */
  F.sci2Mirror = function (kind, lab) {
    var W = 280, H = 170, s = "", cx = 150, cy = 86, R0 = 110;
    var cave = kind !== "convex";
    var d = cave ? "M" + (cx + 40) + " " + (cy - 62) + "A" + R0 + " " + R0 + " 0 0 0 " + (cx + 40) + " " + (cy + 62)
      : "M" + (cx - 40) + " " + (cy - 62) + "A" + R0 + " " + R0 + " 0 0 1 " + (cx - 40) + " " + (cy + 62);
    s += '<path d="' + d + '" stroke-width="2.6"/>';
    s += L(20, cy, 266, cy, { d: "4 4", w: 1 });
    var fx = cave ? cx - 14 : cx + 14;
    s += '<circle cx="' + fx + '" cy="' + cy + '" r="3" fill="currentColor"/>' + T(fx, cy + 15, "F", { z: 11 });
    [-34, 0, 34].forEach(function (dy) {
      var sx = 30, sy = cy + dy, hx = cave ? cx + 40 - (Math.sqrt(Math.max(0, R0 * R0 - dy * dy)) - R0 + 0) : cx - 40;
      s += arw(sx, sy, cave ? cx + 22 : cx - 44, sy, { c: TN.y, w: 1.6, hl: 8 });
      if (cave) s += L(cx + 22, sy, fx, cy, { c: TN.y, w: 1.4 });
      else s += L(cx - 44, sy, 30, cy + dy * 2.1, { c: TN.y, w: 1.4, d: "4 3" });
    });
    s += T(W / 2, H - 8, lab || (cave ? "凹面鏡" : "凸面鏡"), { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Prism = function (lab) {
    var W = 280, H = 170, s = "", cx = 128, cy = 84;
    s += '<path d="M' + cx + " " + (cy - 46) + "L" + (cx + 44) + " " + (cy + 40) + "H" + (cx - 44) + 'z" fill="' + TN.b + '" fill-opacity=".18" stroke-width="1.8"/>';
    s += arw(20, cy + 6, cx - 24, cy + 2, { c: "#fff", w: 2.6 });
    s += arw(20, cy + 6, cx - 24, cy + 2, { c: "currentColor", w: 1.6 });
    var cols = ["#d0342c", "#ef8b2c", "#f3c12e", "#6fbf4a", "#2f89a8", "#3b4fa8", "#6b2f90"];
    cols.forEach(function (c, i) { s += L(cx + 20, cy + 10, 262, cy - 14 + i * 9, { c: c, w: 2 }); });
    s += T(W / 2, H - 8, lab || "三稜鏡色散", { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2LongWave = function (n, lab) {
    var W = 300, H = 120, s = "", y = 56, x0 = 18, Wd = 264;
    var k = Math.max(2, Math.min(6, +n));
    for (var i = 0; i < 90; i++) {
      var t = i / 90, x = x0 + Wd * t;
      var dens = 0.5 + 0.5 * Math.cos(2 * Math.PI * k * t);
      if (((i * 7919) % 100) / 100 < dens) s += L(x, y - 22, x, y + 22, { w: 1.4 });
    }
    s += arw(x0, y + 38, x0 + Wd / k, y + 38, { c: TN.r, w: 1.4, hl: 7 }) + arw(x0 + Wd / k, y + 38, x0, y + 38, { c: TN.r, w: 1.4, hl: 7 });
    s += T(x0 + Wd / k / 2, y + 50, "一個波長", { z: 11, c: TN.r });
    s += T(W / 2, 16, lab || "縱波（疏密）", { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Echo = function (lab) {
    var W = 280, H = 160, s = "";
    s += '<path d="M240 20v120" stroke-width="2.6"/>';
    for (var i = 0; i < 8; i++) s += L(240, 24 + i * 16, 249, 32 + i * 16, { w: 1 });
    s += '<circle cx="42" cy="80" r="14" fill="' + TN.y + '" fill-opacity=".5" stroke-width="1.6"/>';
    s += arw(60, 68, 224, 68, { c: TN.b, w: 2 }) + T(140, 56, "發出的聲音", { z: 11, c: TN.b });
    s += arw(224, 96, 60, 96, { c: TN.g, w: 2 }) + T(140, 110, "回聲", { z: 11, c: TN.g });
    s += T(W / 2, 146, lab || "聲波的反射", { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 熱與物質 ---------- */
  F.sci2HeatWays = function (lab) {
    var W = 300, H = 160, s = "";
    s += R(18, 48, 80, 56, { f: TN.k, fo: .3, w: 1.6 }) + T(58, 120, "傳導", { z: 12 });
    for (var i = 0; i < 3; i++) s += arw(26, 62 + i * 16, 90, 62 + i * 16, { c: TN.r, w: 1.4, hl: 7 });
    s += beakerPath(114, 48, 72, 56, 0.8, TN.b) + T(150, 120, "對流", { z: 12 });
    s += '<path d="M130 96q10 -30 20 -2q10 -28 20 -2" stroke="' + TN.r + '" stroke-width="1.6"/>';
    s += '<circle cx="246" cy="62" r="15" fill="' + TN.y + '" fill-opacity=".6" stroke-width="1.6"/>' + T(246, 120, "輻射", { z: 12 });
    for (i = 0; i < 6; i++) { var a = (i / 6) * 2 * Math.PI; s += L(246 + 20 * Math.cos(a), 62 + 20 * Math.sin(a), 246 + 28 * Math.cos(a), 62 + 28 * Math.sin(a), { c: TN.r, w: 1.4 }); }
    if (lab) s += T(W / 2, 148, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2HeatCurve = function (lab) {
    var W = 280, H = 180, s = "", x0 = 42, y0 = 142, Wd = 212, Hd = 112;
    s += arw(x0, y0, x0 + Wd + 10, y0, { w: 1.8 }) + arw(x0, y0, x0, y0 - Hd - 10, { w: 1.8 });
    s += T(x0 + Wd + 14, y0 + 6, "時間", { a: "start", z: 11 }) + T(x0 - 8, y0 - Hd - 14, "溫度", { a: "end", z: 11 });
    var pts = [[0, 10], [0.18, 40], [0.38, 40], [0.58, 78], [0.78, 78], [1, 100]];
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + (x0 + Wd * p[0]).toFixed(1) + " " + (y0 - (Hd * p[1]) / 100).toFixed(1); }).join("");
    s += '<path d="' + d + '" stroke="' + TN.r + '" stroke-width="2.4"/>';
    s += L(x0, y0 - (Hd * 40) / 100, x0 + Wd, y0 - (Hd * 40) / 100, { d: "3 3", w: 1 });
    s += L(x0, y0 - (Hd * 78) / 100, x0 + Wd, y0 - (Hd * 78) / 100, { d: "3 3", w: 1 });
    s += T(x0 + Wd * 0.28, y0 - (Hd * 40) / 100 - 9, "熔化", { z: 10 }) + T(x0 + Wd * 0.68, y0 - (Hd * 78) / 100 - 9, "沸騰", { z: 10 });
    if (lab) s += T(W / 2, 170, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Distill = function (lab) {
    var W = 280, H = 190, s = "";
    s += beakerPath(26, 86, 70, 62, 0.6, TN.b);
    s += '<path d="M61 86V56h18" stroke-width="1.6"/>';
    s += '<path d="M79 50h88l34 44" stroke-width="1.8"/><path d="M79 62h82l30 40" stroke-width="1.8"/>';
    s += R(100, 44, 66, 24, { f: TN.b, fo: .18, c: "none" });
    s += beakerPath(184, 108, 62, 54, 0.3, TN.g);
    s += '<path d="M50 160q-6 -12 0 -22q6 10 0 22z" fill="' + TN.y + '" fill-opacity=".6" stroke-width="1.2"/>';
    s += T(60, 176, "加熱", { z: 11 }) + T(216, 176, "冷凝收集", { z: 11 });
    if (lab) s += T(W / 2, 20, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Displace = function (v1, v2, lab) {
    var W = 230, H = 190, s = "";
    function cyl(x, v, cap) {
      var y = 34, w = 44, hh = 118, t = y + hh * (1 - Math.max(0, Math.min(1, v / 100)));
      var o = R(x, t, w, y + hh - t, { f: TN.b, fo: .45, c: "none" });
      o += '<path d="M' + x + " " + y + "V" + (y + hh) + "h" + w + "V" + y + '" stroke-width="1.8"/>';
      for (var i = 1; i < 6; i++) o += L(x, y + (hh * i) / 6, x + 10, y + (hh * i) / 6, { w: 1 });
      o += T(x + w / 2, y + hh + 16, cap, { z: 11 });
      return o;
    }
    s += cyl(26, +v1, "放入前 " + v1);
    s += cyl(156, +v2, "放入後 " + v2);
    var y2 = 34 + 118 * (1 - Math.max(0, Math.min(1, v2 / 100)));
    s += '<circle cx="178" cy="' + (y2 + 36) + '" r="13" fill="' + TN.k + '" fill-opacity=".6" stroke-width="1.6"/>';
    s += arw(80, 96, 146, 96, { c: TN.g, w: 1.8 });
    s += T(113, 84, "放入物體", { z: 11, c: TN.g });
    if (lab) s += T(W / 2, 18, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Conserve = function (lab) {
    var W = 280, H = 160, s = "";
    function flask(x, col) {
      var o = '<path d="M' + (x + 22) + ' 44v18l-20 34a16 16 0 0 0 14 24h26a16 16 0 0 0 14 -24l-20 -34V44z" stroke-width="1.8"/>';
      o += '<path d="M' + (x + 8) + ' 92a16 16 0 0 0 10 28h26a16 16 0 0 0 10 -28z" fill="' + col + '" fill-opacity=".5" stroke="none"/>';
      o += '<path d="M' + (x + 18) + ' 40h20" stroke-width="2.2"/>';
      return o;
    }
    s += flask(28, TN.b) + flask(176, TN.g);
    s += arw(122, 92, 162, 92, { c: TN.g, w: 2 }) + T(142, 78, "反應", { z: 11 });
    s += T(58, 146, "反應前 100 公克", { z: 11 }) + T(206, 146, "反應後 100 公克", { z: 11 });
    if (lab) s += T(W / 2, 18, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Chain = function (n, lab) {
    var W = 280, H = 120, s = "", k = Math.max(1, Math.min(6, +n)), x0 = 40, step = 36, y = 58;
    for (var i = 0; i < k; i++) {
      var x = x0 + i * step;
      if (i) s += L(x - step + 13, y, x - 13, y, { w: 2.4 });
      s += '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + TN.k + '" fill-opacity=".5" stroke-width="1.6"/>' + T(x, y, "C", { z: 12, w: 700 });
      [[-20, -1], [20, -1], [0, 1]].forEach(function (d, j) {
        if (j < 2 && ((i > 0 && d[0] < 0) || (i < k - 1 && d[0] > 0))) return;
        var hx = x + d[0] * 0.9, hy = y + d[1] * 26;
        s += L(x, y, hx, hy, { w: 1.6 }) + '<circle cx="' + hx + '" cy="' + hy + '" r="8" fill="' + TN.b + '" fill-opacity=".5" stroke-width="1.4"/>' + T(hx, hy, "H", { z: 10 });
      });
      s += L(x, y, x, y - 26, { w: 1.6 }) + '<circle cx="' + x + '" cy="' + (y - 26) + '" r="8" fill="' + TN.b + '" fill-opacity=".5" stroke-width="1.4"/>' + T(x, y - 26, "H", { z: 10 });
    }
    s += T(W / 2, 108, lab || (k + " 個碳的碳鏈"), { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sci2Periodic = function (z, lab) {
    var W = 230, H = 130, s = "", cell = 40, x0 = 35, y0 = 26;
    var els = [["H", 1], ["He", 2], ["Li", 3], ["Be", 4], ["B", 5], ["C", 6], ["N", 7], ["O", 8], ["F", 9], ["Ne", 10]];
    els.forEach(function (e, i) {
      var cx = x0 + (i % 5) * cell, cy = y0 + Math.floor(i / 5) * cell;
      var on = +z === e[1];
      s += R(cx, cy, cell - 3, cell - 3, { f: on ? TN.y : TN.k, fo: on ? .6 : .14, w: on ? 2 : 1.2 });
      s += T(cx + (cell - 3) / 2, cy + 13, String(e[1]), { z: 9, c: TN.k }) + T(cx + (cell - 3) / 2, cy + 27, e[0], { z: 13, w: 700 });
    });
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 登記 ---------- */
  function N(k, n, v, min, max, step) { return { t: "num", k: k, n: n, v: v, min: min == null ? 0 : min, max: max == null ? 999 : max, step: step || 1 }; }
  function TT(k, n, v) { return { t: "txt", k: k, n: n, v: v }; }
  function NS(k, n, v) { return { t: "nums", k: k, n: n, v: v }; }
  function SE(k, n, v, o) { return { t: "sel", k: k, n: n, v: v, o: o }; }

  S2.SPECS = [
    { f: "sci2Electroscope", g: "理化・電與磁", n: "驗電器", a: [N("charged", "帶電（箔片張開）", 1, 0, 1), TT("lab", "標示", "")] },
    { f: "sci2Electrolysis", g: "理化・電與磁", n: "電解水裝置", a: [TT("lab1", "左管氣體", "H₂"), TT("lab2", "右管氣體", "O₂"), TT("lab", "標示", "")] },
    { f: "sci2Cell", g: "理化・電與磁", n: "電池（鋅銅）", a: [TT("lab", "標示", "")] },
    { f: "sci2Heater", g: "理化・電與磁", n: "電流的熱效應", a: [TT("lab", "標示", "電流的熱效應")] },
    { f: "sci2WireForce", g: "理化・電與磁", n: "磁場中導線受力", a: [N("dir", "電流方向（1 出 0 入）", 1, 0, 1), TT("lab", "標示", "")] },
    { f: "sci2Induction", g: "理化・電與磁", n: "電磁感應", a: [N("into", "磁鐵靠近", 1, 0, 1), TT("lab", "標示", "")] },
    { f: "sci2Motor", g: "理化・電與磁", n: "馬達", a: [TT("lab", "標示", "電動機（馬達）")] },

    { f: "sci2Buoy", g: "理化・力與運動", n: "浮力", a: [N("sunk", "沉入比例（%）", 60, 10, 95), TT("lab", "標示", "")] },
    { f: "sci2Pressure", g: "理化・力與運動", n: "壓力與受力面積", a: [N("area", "底面寬", 60, 16, 120), TT("lab", "標示", "")] },
    { f: "sci2Friction", g: "理化・力與運動", n: "摩擦力", a: [TT("lab", "標示", "")] },
    { f: "sci2Utube", g: "理化・力與運動", n: "連通管", a: [N("h1", "左液面高", 70, 10, 110), N("h2", "右液面高", 70, 10, 110), TT("lab", "標示", "")] },
    { f: "sci2Wheel", g: "理化・力與運動", n: "輪軸", a: [N("rBig", "輪半徑", 56, 24, 70), N("rSmall", "軸半徑", 22, 10, 60), TT("lab", "標示", "")] },
    { f: "sci2Ticker", g: "理化・力與運動", n: "打點計時器紙帶", a: [NS("gaps", "每段間距", "10,16,24,34,46"), TT("lab", "標示", "")] },
    { f: "sci2Circular", g: "理化・力與運動", n: "圓周運動", a: [TT("lab", "標示", "")] },

    { f: "sci2Mirror", g: "理化・光與波", n: "面鏡", a: [SE("kind", "種類", "concave", [["concave", "凹面鏡"], ["convex", "凸面鏡"]]), TT("lab", "標示", "")] },
    { f: "sci2Prism", g: "理化・光與波", n: "三稜鏡色散", a: [TT("lab", "標示", "三稜鏡色散")] },
    { f: "sci2LongWave", g: "理化・光與波", n: "縱波（疏密）", a: [N("n", "幾個波", 3, 2, 6), TT("lab", "標示", "縱波（疏密）")] },
    { f: "sci2Echo", g: "理化・光與波", n: "回聲（聲波反射）", a: [TT("lab", "標示", "聲波的反射")] },

    { f: "sci2HeatWays", g: "理化・物質與反應", n: "熱的三種傳播", a: [TT("lab", "標示", "")] },
    { f: "sci2HeatCurve", g: "理化・物質與反應", n: "加熱曲線", a: [TT("lab", "標示", "")] },
    { f: "sci2Distill", g: "理化・物質與反應", n: "蒸餾裝置", a: [TT("lab", "標示", "")] },
    { f: "sci2Displace", g: "理化・物質與反應", n: "排水法測體積", a: [N("v1", "放入前", 50, 0, 100), N("v2", "放入後", 72, 0, 100), TT("lab", "標示", "")] },
    { f: "sci2Conserve", g: "理化・物質與反應", n: "質量守恆", a: [TT("lab", "標示", "")] },
    { f: "sci2Chain", g: "理化・物質與反應", n: "碳鏈結構式", a: [N("n", "幾個碳", 3, 1, 6), TT("lab", "標示", "")] },
    { f: "sci2Periodic", g: "理化・物質與反應", n: "週期表前十個元素", a: [N("z", "標示哪一個原子序", 6, 1, 10), TT("lab", "標示", "")] }
  ];

  function install() {
    if (!window.DR) window.DR = {};
    if (!DR.fig) DR.fig = {};
    Object.keys(F).forEach(function (k) { DR.fig[k] = F[k]; });
    if (NB.drawLib && NB.drawLib.SPECS) S2.SPECS.forEach(function (x) { NB.drawLib.SPECS.push(x); });
  }
  install();
})();
