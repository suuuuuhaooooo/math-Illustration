/* 製圖：國中理化圖庫（第三批）＝ 課本與考題裡的經典實驗裝置。
   前兩批是概念圖與單一器材，這一批畫的是「整套裝置」：
   光具座、酸鹼滴定、排水集氣、虎克定律、浮力秤重、電鍍、單擺、熱量混合、
   指示劑對照、針筒（氣體壓力）、焰色反應、密度測量。 */
(function () {
  "use strict";
  var NB = window.NB, S3 = (NB.drawSci3 = { FIGS: {} }), F = S3.FIGS;
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
  function beaker(x, y, w, h, v, col) {
    var s = "", f = Math.max(0, Math.min(1, v));
    if (f > 0) s += R(x, y + h * (1 - f), w, h * f, { f: col || TN.b, fo: .45, c: "none" });
    s += '<path d="M' + x + " " + y + "V" + (y + h) + "h" + w + "V" + y + '" stroke-width="1.6"/>';
    return s;
  }
  function stand(x, yTop, yBot, armTo) {   /* 鐵架台 */
    var s = '<path d="M' + (x - 26) + " " + yBot + "h52" + '" stroke-width="2.4"/>';
    s += L(x, yBot, x, yTop, { w: 2.2 });
    if (armTo != null) s += L(x, yTop, armTo, yTop, { w: 2 });
    return s;
  }

  /* 1. 光具座（凸透鏡成像實驗） */
  F.sci3Bench = function (u, v, lab) {
    var W = 340, H = 180, s = "", y = 96, x0 = 20, x1 = 320, cx = 170;
    s += '<path d="M' + x0 + " " + (y + 44) + "H" + x1 + '" stroke-width="2.4"/>';
    for (var i = 0; i <= 15; i++) s += L(x0 + i * 20, y + 44, x0 + i * 20, y + 50, { w: 1 });
    var ux = Math.max(x0 + 14, cx - Math.max(20, Math.min(140, +u)));
    var vx = Math.min(x1 - 14, cx + Math.max(20, Math.min(140, +v)));
    /* 蠟燭 */
    s += R(ux - 7, y + 6, 14, 38, { f: TN.y, fo: .5, w: 1.6 }) + '<path d="M' + ux + " " + (y + 6) + "q-6 -10 0 -16q6 6 0 16z" + '" fill="' + TN.r + '" fill-opacity=".7" stroke-width="1.2"/>';
    s += L(ux, y + 44, ux, y + 52, { w: 1.6 }) + T(ux, y + 64, "物", { z: 11 });
    /* 透鏡 */
    s += '<path d="M' + cx + " " + (y - 30) + "q18 30 0 60q-18 -30 0 -60z" + '" fill="' + TN.b + '" fill-opacity=".3" stroke-width="1.6"/>';
    s += L(cx, y + 30, cx, y + 52, { w: 1.6 }) + T(cx, y + 64, "凸透鏡", { z: 11 });
    /* 屏幕 */
    s += R(vx - 3, y - 26, 6, 70, { f: TN.k, fo: .4, w: 1.6 }) + T(vx, y + 64, "屏幕", { z: 11 });
    /* 光路 */
    s += L(ux, y - 10, cx, y - 10, { c: TN.y, w: 1.4 }) + L(cx, y - 10, vx, y + 22, { c: TN.y, w: 1.4 });
    s += L(ux, y - 10, cx, y + 6, { c: TN.y, w: 1.4 }) + L(cx, y + 6, vx, y + 22, { c: TN.y, w: 1.4 });
    s += arw(ux - 16, y + 44, ux - 16, y + 6, { c: TN.g, w: 1.2, hl: 7 });
    s += T((ux + cx) / 2, y - 40, "物距", { z: 11 }) + T((cx + vx) / 2, y - 40, "像距", { z: 11 });
    s += L(ux, y - 34, cx, y - 34, { d: "3 3", w: 1 }) + L(cx, y - 34, vx, y - 34, { d: "3 3", w: 1 });
    if (lab) s += T(W / 2, 16, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 2. 酸鹼中和滴定 */
  F.sci3Titration = function (col, lab) {
    var W = 200, H = 230, s = "", x = 118;
    s += stand(36, 24, 206, 0);
    s += L(36, 60, 108, 60, { w: 2 });
    s += '<path d="M' + (x - 9) + " 26v96l9 16l9 -16V26z" + '" stroke-width="1.8"/>';
    s += R(x - 9, 46, 18, 76, { f: TN.g, fo: .35, c: "none" });
    for (var i = 1; i < 6; i++) s += L(x - 9, 46 + i * 13, x - 3, 46 + i * 13, { w: 1 });
    s += '<circle cx="' + x + '" cy="146" r="3" fill="' + TN.g + '" stroke="none"/>';
    s += '<path d="M' + (x - 34) + " 206l22 -40h24l22 40z" + '" stroke-width="1.8"/>';
    s += '<path d="M' + (x - 30) + " 200l14 -26h32l14 26z" + '" fill="' + (col || TN.p) + '" fill-opacity=".5" stroke="none"/>';
    s += T(x, 222, "錐形瓶", { z: 11 });
    s += T(52, 44, "滴定管", { a: "start", z: 11 });
    if (lab) s += T(W / 2, 14, lab, { z: 12 });
    return svg(W, H, s, 0.9);
  };

  /* 3. 排水集氣法 */
  F.sci3GasWater = function (lab) {
    var W = 300, H = 190, s = "";
    s += beaker(150, 70, 128, 96, 0.9, TN.b);
    s += '<path d="M176 36v86a28 28 0 0 0 44 0V36z" stroke-width="1.8"/>';
    s += R(176, 70, 44, 52, { f: TN.b, fo: .45, c: "none" });
    for (var i = 0; i < 6; i++) s += '<circle cx="' + (186 + (i % 3) * 14) + '" cy="' + (56 + Math.floor(i / 3) * 12) + '" r="4" fill="' + TN.g + '" stroke="none"/>';
    s += T(198, 24, "收集的氣體", { z: 11 });
    s += '<path d="M34 86v60h52V86z" stroke-width="1.8"/>' + R(34, 110, 52, 36, { f: TN.y, fo: .4, c: "none" });
    s += '<path d="M60 86V62h78" stroke-width="1.8"/><path d="M138 62q26 0 26 34v40" stroke-width="1.8"/>';
    s += T(60, 162, "產生氣體", { z: 11 });
    if (lab) s += T(W / 2, 178, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 4. 虎克定律：彈簧掛砝碼 */
  F.sci3Hooke = function (n, lab) {
    var W = 180, H = 230, s = "", x = 96, k = Math.max(1, Math.min(5, +n));
    s += stand(36, 28, 210, x);
    var top = 28, coils = 6, hh = 54 + k * 16, d = "M" + x + " " + top;
    for (var i = 0; i < coils; i++) { d += "l" + (i % 2 ? -16 : 16) + " " + hh / coils / 2 + "l" + (i % 2 ? 16 : -16) + " " + hh / coils / 2; }
    s += '<path d="' + d + '" stroke-width="1.6"/>';
    s += L(x, top + hh, x, top + hh + 10, { w: 1.6 });
    for (i = 0; i < k; i++) s += R(x - 20, top + hh + 10 + i * 16, 40, 14, { f: TN.k, fo: .5, w: 1.4 });
    s += arw(x + 44, top, x + 44, top + hh, { c: TN.r, w: 1.4, hl: 7 }) + arw(x + 44, top + hh, x + 44, top, { c: TN.r, w: 1.4, hl: 7 });
    s += T(x + 56, top + hh / 2, "伸長量", { a: "start", z: 11, c: TN.r });
    s += T(x, top + hh + 10 + k * 16 + 16, k + " 個砝碼", { z: 11 });
    if (lab) s += T(W / 2, 16, lab, { z: 12 });
    return svg(W, H, s, 0.9);
  };

  /* 5. 浮力秤重（彈簧秤吊物入水） */
  F.sci3BuoyScale = function (inWater, lab) {
    var W = 230, H = 220, s = "", x = inWater ? 150 : 62;
    s += stand(30, 22, 200, 150);
    s += '<rect x="' + (x - 14) + '" y="36" width="28" height="56" rx="4" stroke-width="1.6"/>';
    s += L(x, 36, x, 22, { w: 1.4 }) + T(x, 102, "彈簧秤", { z: 11 });
    s += L(x, 92, x, 122, { w: 1.4 });
    if (inWater) s += beaker(106, 118, 88, 72, 0.82, TN.b);
    s += R(x - 18, 122, 36, 30, { f: TN.y, fo: .6, w: 1.6 });
    for (var i = 0; i < 4; i++) s += L(x - 11, 46 + i * 11, x + 11, 46 + i * 11, { w: 1 });
    s += T(W / 2, 208, inWater ? "物體浸入水中：讀數變小" : "在空氣中：讀數＝重量", { z: 11 });
    if (lab) s += T(W / 2, 14, lab, { z: 12 });
    return svg(W, H, s, 0.9);
  };

  /* 6. 電鍍 */
  F.sci3Plating = function (lab) {
    var W = 230, H = 180, s = "", x = 30, y = 54, w = 170, hh = 100;
    s += beaker(x, y, w, hh, 0.8, TN.g);
    s += R(x + 40, y - 16, 14, 84, { f: TN.r, fo: .55, w: 1.6 }) + T(x + 47, y - 24, "銅（陽極）", { z: 10 });
    s += R(x + 112, y - 16, 14, 84, { f: TN.k, fo: .5, w: 1.6 }) + T(x + 119, y - 24, "待鍍物", { z: 10 });
    s += L(x + 47, y - 16, x + 47, 20, { w: 1.6 }) + L(x + 119, y - 16, x + 119, 20, { w: 1.6 }) + L(x + 47, 20, x + 72, 20, { w: 1.6 }) + L(x + 94, 20, x + 119, 20, { w: 1.6 });
    s += '<path d="M' + (x + 78) + ' 12V28" stroke-width="2.4"/><path d="M' + (x + 88) + ' 16V24" stroke-width="1.4"/>';
    for (var i = 0; i < 4; i++) s += arw(x + 60 + i * 2, y + 24 + i * 14, x + 106, y + 24 + i * 14, { c: TN.b, w: 1.2, hl: 6 });
    s += T(W / 2, H - 8, lab || "電鍍", { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 7. 單擺 */
  F.sci3Pendulum = function (deg, lab) {
    var W = 220, H = 190, s = "", px = 110, py = 26, Ln = 110, a = ((Math.max(5, Math.min(60, +deg))) * Math.PI) / 180;
    s += '<path d="M60 ' + py + "h100" + '" stroke-width="2.4"/>';
    for (var i = 0; i < 6; i++) s += L(64 + i * 16, py, 58 + i * 16, py + 8, { w: 1 });
    s += L(px, py, px, py + Ln, { d: "4 4", w: 1 });
    var bx = px + Ln * Math.sin(a), by = py + Ln * Math.cos(a);
    s += L(px, py, bx, by, { w: 1.8 });
    s += '<circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="13" fill="' + TN.b + '" fill-opacity=".6" stroke-width="1.6"/>';
    s += '<path d="M' + px + " " + (py + 44) + "A44 44 0 0 1 " + (px + 44 * Math.sin(a)).toFixed(1) + " " + (py + 44 * Math.cos(a)).toFixed(1) + '" stroke-width="1.2"/>';
    s += T(px + 26, py + 40, Math.round(+deg) + "°", { z: 11 });
    s += '<circle cx="' + (px - Ln * Math.sin(a)).toFixed(1) + '" cy="' + (py + Ln * Math.cos(a)).toFixed(1) + '" r="13" stroke-dasharray="3 3" stroke-width="1.2"/>';
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 8. 熱量混合（熱平衡） */
  F.sci3Mix = function (t1, t2, lab) {
    var W = 280, H = 170, s = "";
    s += beaker(24, 48, 74, 80, .7, TN.b) + T(61, 142, (+t1) + " ℃", { z: 12 });
    s += beaker(182, 48, 74, 80, .7, TN.r) + T(219, 142, (+t2) + " ℃", { z: 12 });
    s += arw(104, 88, 136, 88, { c: TN.k, w: 1.6, hl: 7 }) + arw(176, 88, 144, 88, { c: TN.k, w: 1.6, hl: 7 });
    s += T(140, 70, "混合", { z: 11 });
    s += T(140, 110, "？℃", { z: 14, w: 700 });
    if (lab) s += T(W / 2, 18, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 9. 指示劑對照 */
  F.sci3Indicator = function (kind, lab) {
    var W = 300, H = 140, s = "";
    var sets = {
      litmus: [["酸性", "#d0342c"], ["中性", "#b8a98c"], ["鹼性", "#2f6cb0"]],
      pp: [["酸性", "#f2efe6"], ["中性", "#f2efe6"], ["鹼性", "#c2458f"]],
      uni: [["酸性", "#d0342c"], ["中性", "#6fbf4a"], ["鹼性", "#3b4fa8"]]
    };
    var a = sets[kind] || sets.litmus;
    a.forEach(function (x, i) {
      var cx = 56 + i * 94, y = 34;
      s += '<path d="M' + (cx - 13) + " " + y + "V" + (y + 56) + "a13 13 0 0 0 26 0V" + y + '" stroke-width="1.8"/>';
      s += '<path d="M' + (cx - 13) + " " + (y + 26) + "V" + (y + 56) + "a13 13 0 0 0 26 0V" + (y + 26) + 'z" fill="' + x[1] + '" fill-opacity=".85" stroke="none"/>';
      s += T(cx, y + 86, x[0], { z: 12 });
    });
    s += T(W / 2, 18, lab || ({ litmus: "石蕊", pp: "酚酞", uni: "廣用指示劑" }[kind] || "指示劑"), { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 10. 針筒（氣體壓力） */
  F.sci3Syringe = function (push, lab) {
    var W = 280, H = 120, s = "", x = 26, y = 40, w = 180, hh = 42;
    var p = Math.max(0.2, Math.min(0.9, (+push) / 100));
    s += R(x, y, w, hh, { w: 1.8 });
    s += R(x, y, w * p, hh, { f: TN.b, fo: .25, c: "none" });
    var px = x + w * p;
    s += R(px, y - 4, 8, hh + 8, { f: TN.k, fo: .6, w: 1.6 });
    s += L(px + 8, y + hh / 2, x + w + 40, y + hh / 2, { w: 2.4 });
    s += L(x + w + 40, y + 2, x + w + 40, y + hh - 2, { w: 2.4 });
    s += L(x, y + hh / 2, x - 16, y + hh / 2, { w: 1.8 });
    var n = Math.max(4, Math.round(16 * (1 - p) + 4));
    for (var i = 0; i < n; i++) s += '<circle cx="' + (x + 8 + ((i * 37) % Math.max(10, w * p - 16))) + '" cy="' + (y + 8 + ((i * 53) % (hh - 16))) + '" r="3" fill="' + TN.b + '" fill-opacity=".7" stroke="none"/>';
    s += T(W / 2, 100, lab || "壓縮後體積變小、壓力變大", { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 11. 焰色反應 */
  F.sci3Flame = function (col, lab) {
    var W = 160, H = 180, s = "", cx = 80;
    var c = { Na: "#e8b53c", K: "#8e6bb5", Cu: "#4fae7a", Li: "#d0342c", Ca: "#e07a3c" }[col] || "#e8b53c";
    s += '<path d="M60 160h40M66 160v-22h28v22" stroke-width="1.8"/>';
    s += '<ellipse cx="' + cx + '" cy="138" rx="18" ry="6"/>';
    s += '<path d="M' + cx + " 132q-18 -18 -8 -44q4 14 10 8q-4 -20 10 -32q-2 26 10 34q8 20 -10 34z" + '" fill="' + c + '" fill-opacity=".75" stroke-width="1.4"/>';
    s += L(cx + 26, 96, cx + 42, 80, { w: 1.6 }) + T(cx + 50, 72, "鉑絲", { a: "start", z: 11 });
    s += T(W / 2, 174, lab || (col + " 的焰色"), { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* 12. 密度測量（天平＋量筒） */
  F.sci3Density = function (m, v, lab) {
    var W = 290, H = 180, s = "";
    s += '<path d="M44 140V92" stroke-width="2.2"/><path d="M20 152h48l-10 -12H30z" stroke-width="1.6"/>';
    s += L(10, 92, 78, 92, { w: 2.2 }) + '<path d="M10 92l-8 14h16z" stroke-width="1.2"/><path d="M78 92l-8 14h16z" stroke-width="1.2"/>';
    s += R(14, 106, 24, 10, { f: TN.y, fo: .6, w: 1.2 }) + R(62, 106, 24, 10, { f: TN.k, fo: .4, w: 1.2 });
    s += T(44, 168, "質量 " + m + " 公克", { z: 11 });
    var x = 186, y = 36, w = 44, hh = 112, f = Math.max(0, Math.min(1, (+v) / 100));
    s += R(x, y + hh * (1 - f), w, hh * f, { f: TN.b, fo: .45, c: "none" });
    s += '<path d="M' + x + " " + y + "V" + (y + hh) + "h" + w + "V" + y + '" stroke-width="1.8"/>';
    for (var i = 1; i < 6; i++) s += L(x, y + (hh * i) / 6, x + 10, y + (hh * i) / 6, { w: 1 });
    s += '<circle cx="' + (x + w / 2) + '" cy="' + (y + hh - 18) + '" r="11" fill="' + TN.k + '" fill-opacity=".6" stroke-width="1.4"/>';
    s += T(x + w / 2, 168, "體積 " + v + " 毫升", { z: 11 });
    if (lab) s += T(W / 2, 16, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 登記 ---------- */
  function N(k, n, v, min, max, step) { return { t: "num", k: k, n: n, v: v, min: min == null ? 0 : min, max: max == null ? 999 : max, step: step || 1 }; }
  function TT(k, n, v) { return { t: "txt", k: k, n: n, v: v }; }
  function SE(k, n, v, o) { return { t: "sel", k: k, n: n, v: v, o: o }; }
  var G = "理化・經典實驗";

  S3.SPECS = [
    { f: "sci3Bench", g: G, n: "光具座（凸透鏡成像）", a: [N("u", "物距", 100, 20, 140), N("v", "像距", 90, 20, 140), TT("lab", "標示", "")] },
    { f: "sci3Titration", g: G, n: "酸鹼中和滴定", a: [SE("col", "瓶中顏色", "#b7a5e6", [["#b7a5e6", "粉紅"], ["#f2efe6", "無色"], ["#78a9e0", "藍"]]), TT("lab", "標示", "")] },
    { f: "sci3GasWater", g: G, n: "排水集氣法", a: [TT("lab", "標示", "")] },
    { f: "sci3Hooke", g: G, n: "虎克定律（彈簧掛砝碼）", a: [N("n", "掛幾個砝碼", 3, 1, 5), TT("lab", "標示", "")] },
    { f: "sci3BuoyScale", g: G, n: "浮力秤重", a: [N("inWater", "浸入水中", 1, 0, 1), TT("lab", "標示", "")] },
    { f: "sci3Plating", g: G, n: "電鍍裝置", a: [TT("lab", "標示", "電鍍")] },
    { f: "sci3Pendulum", g: G, n: "單擺", a: [N("deg", "擺角", 30, 5, 60), TT("lab", "標示", "")] },
    { f: "sci3Mix", g: G, n: "熱量混合（熱平衡）", a: [N("t1", "左杯溫度", 20, -20, 150), N("t2", "右杯溫度", 80, -20, 150), TT("lab", "標示", "")] },
    { f: "sci3Indicator", g: G, n: "指示劑對照", a: [SE("kind", "指示劑", "litmus", [["litmus", "石蕊"], ["pp", "酚酞"], ["uni", "廣用指示劑"]]), TT("lab", "標示", "")] },
    { f: "sci3Syringe", g: G, n: "針筒（氣體壓力）", a: [N("push", "推入程度（%）", 50, 20, 90), TT("lab", "標示", "")] },
    { f: "sci3Flame", g: G, n: "焰色反應", a: [SE("col", "元素", "Na", [["Na", "鈉"], ["K", "鉀"], ["Cu", "銅"], ["Li", "鋰"], ["Ca", "鈣"]]), TT("lab", "標示", "")] },
    { f: "sci3Density", g: G, n: "密度測量（天平＋量筒）", a: [N("m", "質量（公克）", 54, 0, 999), N("v", "體積（毫升）", 60, 0, 100), TT("lab", "標示", "")] }
  ];

  function install() {
    if (!window.DR) window.DR = {};
    if (!DR.fig) DR.fig = {};
    Object.keys(F).forEach(function (k) { DR.fig[k] = F[k]; });
    if (NB.drawLib && NB.drawLib.SPECS) S3.SPECS.forEach(function (x) { NB.drawLib.SPECS.push(x); });
  }
  install();
})();
