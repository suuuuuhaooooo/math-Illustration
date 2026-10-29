/* 製圖：國中理化圖庫。
   理化站目前沒有現成的圖形函式庫，所以這裡照課綱（八上到九下）需要的東西新畫一套：
   電路、實驗器材、光學光路、力學、波形、化學粒子、磁場。
   畫法跟數學題庫那套一致：吐一支完整的 <svg>、線條用 currentColor，
   這樣插進製圖畫布、換顏色、匯出都跟其他圖一樣。 */
(function () {
  "use strict";
  var NB = window.NB, S = (NB.drawSci = { FIGS: {} });
  var F = S.FIGS;
  var TN = { r: "#e58a73", b: "#78a9e0", g: "#7fc3a0", y: "#ecc566", p: "#b7a5e6", k: "#9aa1ab" };

  function svg(w, h, body, k) {
    return '<svg class="dfig" viewBox="0 0 ' + w + " " + h + '" width="' + Math.round(w * (k || 1)) + '" height="' + Math.round(h * (k || 1)) +
      '" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="inherit">' + body + "</svg>";
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || "middle") + '" dominant-baseline="' + (o.b || "middle") +
      '" font-size="' + (o.z || 13) + '" fill="' + (o.c || "currentColor") + '" stroke="none"' + (o.w ? ' font-weight="' + o.w + '"' : "") + ">" + esc(s) + "</text>";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function L(x1, y1, x2, y2, o) {
    o = o || {};
    return '<path d="M' + x1 + " " + y1 + "L" + x2 + " " + y2 + '"' + (o.w ? ' stroke-width="' + o.w + '"' : "") + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + (o.c ? ' stroke="' + o.c + '"' : "") + "/>";
  }
  /* 箭頭（畫成實心三角形，匯出到哪裡都在） */
  function arw(x1, y1, x2, y2, o) {
    o = o || {}; var c = o.c || "currentColor", w = o.w || 1.8, Ln = o.hl || Math.max(9, w * 4.2), W = Ln * 0.5;
    var a = Math.atan2(y2 - y1, x2 - x1), bx = x2 - Ln * Math.cos(a), by = y2 - Ln * Math.sin(a);
    return '<path d="M' + x1 + " " + y1 + "L" + bx + " " + by + '" stroke="' + c + '" stroke-width="' + w + '"' + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + "/>" +
      '<path d="M' + x2 + " " + y2 + "L" + (bx + W * Math.sin(a)) + " " + (by - W * Math.cos(a)) + "L" + (bx - W * Math.sin(a)) + " " + (by + W * Math.cos(a)) + 'Z" fill="' + c + '" stroke="none"/>';
  }

  /* ---------- 電路 ---------- */
  /* 元件畫在水平線上，x 是中心、每個寬 44 */
  var EL = {
    cell: function (x, y, lab) {   /* 電池 */
      return L(x - 22, y, x - 7, y) + L(x + 7, y, x + 22, y) +
        '<path d="M' + (x - 7) + " " + (y - 13) + "V" + (y + 13) + '" stroke-width="2.4"/>' +
        '<path d="M' + (x + 7) + " " + (y - 7) + "V" + (y + 7) + '" stroke-width="1.4"/>' + (lab ? T(x, y + 26, lab, { z: 12 }) : "");
    },
    battery: function (x, y, lab) {  /* 電池組 */
      var s = L(x - 22, y, x - 14, y) + L(x + 14, y, x + 22, y);
      [-14, -2, 10].forEach(function (d, i) {
        s += '<path d="M' + (x + d) + " " + (y - (i % 2 ? 7 : 13)) + "V" + (y + (i % 2 ? 7 : 13)) + '" stroke-width="' + (i % 2 ? 1.4 : 2.4) + '"/>';
      });
      s += '<path d="M' + (x + 14) + " " + (y - 7) + "V" + (y + 7) + '" stroke-width="1.4"/>';
      return s + (lab ? T(x, y + 26, lab, { z: 12 }) : "");
    },
    lamp: function (x, y, lab) {   /* 燈泡 */
      return L(x - 22, y, x - 13, y) + L(x + 13, y, x + 22, y) +
        '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + TN.y + '" fill-opacity=".35"/>' +
        L(x - 9, y - 9, x + 9, y + 9) + L(x + 9, y - 9, x - 9, y + 9) + (lab ? T(x, y + 28, lab, { z: 12 }) : "");
    },
    res: function (x, y, lab) {    /* 電阻 */
      return L(x - 22, y, x - 16, y) + L(x + 16, y, x + 22, y) +
        '<rect x="' + (x - 16) + '" y="' + (y - 8) + '" width="32" height="16" fill="var(--paper,#fff)" fill-opacity=".001"/>' +
        (lab ? T(x, y - 17, lab, { z: 12 }) : "");
    },
    sw: function (x, y, lab, open) { /* 開關 */
      return L(x - 22, y, x - 11, y) + L(x + 11, y, x + 22, y) +
        '<circle cx="' + (x - 11) + '" cy="' + y + '" r="2.6" fill="currentColor"/><circle cx="' + (x + 11) + '" cy="' + y + '" r="2.6" fill="currentColor"/>' +
        (open === 0 ? L(x - 11, y, x + 11, y) : L(x - 11, y, x + 9, y - 12)) + (lab ? T(x, y + 24, lab, { z: 12 }) : "");
    },
    amp: function (x, y, lab) {    /* 安培計 */
      return L(x - 22, y, x - 14, y) + L(x + 14, y, x + 22, y) +
        '<circle cx="' + x + '" cy="' + y + '" r="14"/>' + T(x, y, "A", { z: 14, w: 700 }) + (lab ? T(x, y + 28, lab, { z: 12 }) : "");
    },
    volt: function (x, y, lab) {   /* 伏特計 */
      return '<circle cx="' + x + '" cy="' + y + '" r="14"/>' + T(x, y, "V", { z: 14, w: 700 }) + (lab ? T(x, y + 28, lab, { z: 12 }) : "");
    }
  };
  var ELN = { cell: "電池", battery: "電池組", lamp: "燈泡", res: "電阻", sw: "開關", amp: "安培計", volt: "伏特計" };
  /* 串聯電路：把元件排在一個矩形迴路上 */
  F.sciSeries = function (items, labs, open) {
    var list = String(items || "cell,sw,lamp").split(/[,\s]+/).filter(Boolean);
    var lab = labs || [], n = list.length, W = Math.max(260, n * 92 + 60), H = 170;
    var x0 = 30, x1 = W - 30, yT = 40, yB = H - 36, s = "";
    s += L(x0, yT, x1, yT) + L(x0, yT, x0, yB) + L(x1, yT, x1, yB) + L(x0, yB, x1, yB);
    var step = (x1 - x0) / n;
    list.forEach(function (k, i) {
      var cx = x0 + step * (i + 0.5), f = EL[k];
      if (!f) return;
      s += '<rect x="' + (cx - 23) + '" y="' + (yT - 15) + '" width="46" height="30" fill="#fff" stroke="none"/>';
      /* 開關要把「打開／閉合」傳下去，不然畫出來永遠是打開的 */
      s += k === "sw" ? f(cx, yT, lab[i] || "", +open ? 1 : 0) : f(cx, yT, lab[i] || "");
    });
    return svg(W, H, s, 0.9);
  };
  /* 並聯：兩條支路 */
  F.sciParallel = function (a, b, src) {
    var W = 320, H = 200, s = "";
    var xl = 40, xr = W - 40, yT = 48, yM = 112, yB = H - 30;
    s += L(xl, yT, xr, yT) + L(xl, yT, xl, yB) + L(xr, yT, xr, yB) + L(xl, yB, xr, yB);
    s += L(xl + 70, yT, xl + 70, yM) + L(xr - 70, yT, xr - 70, yM) + L(xl + 70, yM, xr - 70, yM);
    var fa = EL[a] || EL.lamp, fb = EL[b] || EL.lamp, fs = EL[src] || EL.cell;
    s += '<rect x="' + (W / 2 - 23) + '" y="' + (yB - 15) + '" width="46" height="30" fill="#fff" stroke="none"/>' + fs(W / 2, yB, "");
    s += '<rect x="' + (W / 2 - 23) + '" y="' + (yT - 15) + '" width="46" height="30" fill="#fff" stroke="none"/>' + fa(W / 2, yT, "甲");
    s += '<rect x="' + (W / 2 - 23) + '" y="' + (yM - 15) + '" width="46" height="30" fill="#fff" stroke="none"/>' + fb(W / 2, yM, "乙");
    return svg(W, H, s, 0.9);
  };

  /* ---------- 實驗器材 ---------- */
  F.sciBeaker = function (v, max, lab) {
    var W = 120, H = 150, x = 24, y = 24, w = 72, hh = 104, s = "";
    var fill = Math.max(0, Math.min(1, (+v) / (+max || 1)));
    s += '<rect x="' + x + '" y="' + (y + hh * (1 - fill)) + '" width="' + w + '" height="' + hh * fill + '" fill="' + TN.b + '" fill-opacity=".45" stroke="none"/>';
    if (fill > 0) s += L(x, y + hh * (1 - fill), x + w, y + hh * (1 - fill), { c: TN.b, w: 1.6 });
    s += '<path d="M' + x + " " + y + "V" + (y + hh) + "h" + w + "V" + y + '" stroke-width="1.8"/>';
    s += '<path d="M' + (x - 5) + " " + (y + 2) + "l5 -3" + '"/>';
    for (var i = 1; i < 5; i++) { var yy = y + (hh * i) / 5; s += L(x, yy, x + 11, yy, { w: 1 }); }
    if (lab) s += T(W / 2, H - 10, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciCylinder = function (v, max, lab) {
    var W = 84, H = 180, x = 28, y = 18, w = 32, hh = 132, s = "";
    var fill = Math.max(0, Math.min(1, (+v) / (+max || 1))), top = y + hh * (1 - fill);
    s += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + hh * fill + '" fill="' + TN.b + '" fill-opacity=".45" stroke="none"/>';
    if (fill > 0) s += '<path d="M' + x + " " + (top + 2) + "q" + w / 2 + " -5 " + w + " 0" + '" stroke="' + TN.b + '" stroke-width="1.6"/>';
    s += '<path d="M' + x + " " + y + "V" + (y + hh) + "h" + w + "V" + y + '" stroke-width="1.8"/>';
    s += '<path d="M' + (x - 6) + " " + (y + hh) + "h" + (w + 12) + '" stroke-width="2.2"/>';
    for (var i = 1; i < 10; i++) { var yy = y + (hh * i) / 10; s += L(x, yy, x + (i % 5 === 0 ? 12 : 7), yy, { w: 1 }); }
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciTube = function (v, lab) {
    var W = 56, H = 150, x = 18, y = 14, w = 20, hh = 118, s = "";
    var fill = Math.max(0, Math.min(1, (+v) / 100));
    s += '<path d="M' + x + " " + (y + hh - w / 2) + "a" + w / 2 + " " + w / 2 + " 0 0 0 " + w + " 0V" + y + '" fill="' + TN.g + '" fill-opacity="0" stroke="none"/>';
    if (fill > 0) {
      var top = y + (hh - w / 2) * (1 - fill);
      s += '<path d="M' + x + " " + top + "V" + (y + hh - w / 2) + "a" + w / 2 + " " + w / 2 + " 0 0 0 " + w + " 0V" + top + 'z" fill="' + TN.g + '" fill-opacity=".45" stroke="none"/>';
    }
    s += '<path d="M' + x + " " + y + "V" + (y + hh - w / 2) + "a" + w / 2 + " " + w / 2 + " 0 0 0 " + w + " 0V" + y + '" stroke-width="1.8"/>';
    if (lab) s += T(W / 2, H - 8, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciBurner = function (lab) {
    var W = 110, H = 130, s = "";
    s += '<path d="M40 118h30M44 118V96h22v22" stroke-width="1.8"/>';
    s += '<ellipse cx="55" cy="96" rx="17" ry="6"/>';
    s += '<path d="M55 92q-13 -12 -5 -30q3 10 8 6q-3 -14 7 -22q-2 18 8 24q6 14 -8 22z" fill="' + TN.y + '" fill-opacity=".6" stroke-width="1.4"/>';
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciFilter = function (lab) {
    var W = 150, H = 180, s = "";
    s += '<path d="M40 24h70L83 86v10" stroke-width="1.8"/><path d="M40 24L67 86v10" stroke-width="1.8"/>';
    s += '<path d="M46 30h58L80 84z" fill="' + TN.k + '" fill-opacity=".25" stroke-width="1.2"/>';
    s += '<path d="M67 96h16" stroke-width="1.8"/><path d="M75 96v22" stroke-width="1.6"/>';
    s += '<path d="M50 128h50v34H50z" stroke-width="1.8"/><path d="M50 146h50" stroke="' + TN.b + '" stroke-width="1.6"/>';
    s += '<rect x="50" y="146" width="50" height="16" fill="' + TN.b + '" fill-opacity=".4" stroke="none"/>';
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciThermo = function (t, min, max) {
    var W = 70, H = 180, x = 32, y = 18, hh = 120, s = "";
    var f = Math.max(0, Math.min(1, ((+t) - min) / ((+max - +min) || 1)));
    s += '<rect x="' + (x - 5) + '" y="' + y + '" width="10" height="' + hh + '" rx="5" stroke-width="1.6"/>';
    s += '<rect x="' + (x - 3) + '" y="' + (y + hh * (1 - f)) + '" width="6" height="' + (hh * f + 6) + '" fill="' + TN.r + '" stroke="none"/>';
    s += '<circle cx="' + x + '" cy="' + (y + hh + 11) + '" r="11" fill="' + TN.r + '" stroke-width="1.6"/>';
    for (var i = 0; i <= 5; i++) {
      var yy = y + (hh * i) / 5;
      s += L(x + 6, yy, x + 13, yy, { w: 1 }) + T(x + 17, yy, String(Math.round(max - ((max - min) * i) / 5)), { a: "start", z: 11 });
    }
    return svg(W, H, s, 1);
  };
  F.sciBalance = function (lab1, lab2, tilt) {
    var W = 220, H = 140, s = "", d = (+tilt || 0) * 10;
    s += '<path d="M110 104V54" stroke-width="2.2"/><path d="M80 118h60l-12 -14H92z" stroke-width="1.8"/>';
    s += L(40, 54 + d, 180, 54 - d, { w: 2.2 });
    s += '<path d="M40 ' + (54 + d) + "l-10 18h20z" + '" stroke-width="1.4"/><path d="M180 ' + (54 - d) + "l-10 18h20z" + '" stroke-width="1.4"/>';
    s += '<path d="M24 ' + (76 + d) + "h32" + '" stroke-width="1.8"/><path d="M164 ' + (76 - d) + "h32" + '" stroke-width="1.8"/>';
    s += T(40, 94 + d, lab1 || "", { z: 12 }) + T(180, 94 - d, lab2 || "", { z: 12 });
    return svg(W, H, s, 1);
  };

  /* ---------- 光學 ---------- */
  F.sciReflect = function (ang, lab) {
    var W = 260, H = 160, s = "", cx = 130, cy = 118, R = 92, a = ((+ang) * Math.PI) / 180;
    s += '<path d="M24 ' + cy + "h212" + '" stroke-width="2.4"/>';
    for (var i = 0; i < 12; i++) s += L(28 + i * 18, cy, 22 + i * 18, cy + 8, { w: 1 });
    s += L(cx, cy, cx, cy - R - 10, { d: "5 4" }) + T(cx + 12, cy - R - 14, "法線", { a: "start", z: 11 });
    s += arw(cx - R * Math.sin(a), cy - R * Math.cos(a), cx, cy, { c: TN.r, w: 2 });
    s += arw(cx, cy, cx + R * Math.sin(a), cy - R * Math.cos(a), { c: TN.b, w: 2 });
    s += T(cx - 26, cy - 26, (+ang) + "°", { z: 12, c: TN.r }) + T(cx + 26, cy - 26, (+ang) + "°", { z: 12, c: TN.b });
    if (lab) s += T(W / 2, 16, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sciRefract = function (a1, a2, lab) {
    var W = 230, H = 200, s = "", cx = 115, cy = 100, R = 82;
    var r1 = ((+a1) * Math.PI) / 180, r2 = ((+a2) * Math.PI) / 180;
    s += '<rect x="14" y="' + cy + '" width="202" height="' + (H - cy - 10) + '" fill="' + TN.b + '" fill-opacity=".18" stroke="none"/>';
    s += '<path d="M14 ' + cy + "h202" + '" stroke-width="2"/>';
    s += L(cx, cy - R - 8, cx, cy + R + 8, { d: "5 4" });
    s += arw(cx - R * Math.sin(r1), cy - R * Math.cos(r1), cx, cy, { c: TN.r, w: 2 });
    s += arw(cx, cy, cx + R * Math.sin(r2), cy + R * Math.cos(r2), { c: TN.r, w: 2 });
    s += T(cx - 24, cy - 30, (+a1) + "°", { z: 12 }) + T(cx + 24, cy + 32, (+a2) + "°", { z: 12 });
    s += T(24, cy - 12, "空氣", { a: "start", z: 11 }) + T(24, cy + 16, lab || "水", { a: "start", z: 11 });
    return svg(W, H, s, 0.95);
  };
  F.sciLens = function (kind, uLab, vLab) {
    var W = 320, H = 180, s = "", cx = 160, cy = 90, R = 54;
    s += L(14, cy, W - 14, cy, { d: "4 4" });
    if (kind === "concave") s += '<path d="M' + (cx - 8) + " " + (cy - R) + "q14 " + R + " 0 " + 2 * R + "h16q-14 -" + R + " 0 -" + 2 * R + 'z" fill="' + TN.b + '" fill-opacity=".3" stroke-width="1.6"/>';
    else s += '<path d="M' + cx + " " + (cy - R) + "q22 " + R + " 0 " + 2 * R + "q-22 -" + R + " 0 -" + 2 * R + 'z" fill="' + TN.b + '" fill-opacity=".3" stroke-width="1.6"/>';
    [-1, 1].forEach(function (d) { s += '<circle cx="' + (cx + d * 62) + '" cy="' + cy + '" r="2.6" fill="currentColor"/>' + T(cx + d * 62, cy + 15, "F", { z: 11 }); });
    s += arw(60, cy, 60, cy - 42, { c: TN.r, w: 2 }) + T(52, cy - 48, uLab || "物", { z: 12, c: TN.r });
    if (kind === "concave") { s += L(60, cy - 42, cx, cy - 42, { c: TN.y, w: 1.4 }) + L(cx, cy - 42, W - 24, cy - 70, { c: TN.y, w: 1.4, d: "4 3" }); }
    else {
      s += L(60, cy - 42, cx, cy - 42, { c: TN.y, w: 1.4 }) + L(cx, cy - 42, 262, cy + 30, { c: TN.y, w: 1.4 });
      s += L(60, cy - 42, cx, cy - 42, { c: TN.y, w: 1.4 });
      s += arw(248, cy, 248, cy + 26, { c: TN.g, w: 2 }) + T(258, cy + 34, vLab || "像", { z: 12, c: TN.g, a: "start" });
    }
    return svg(W, H, s, 0.95);
  };
  F.sciMirrorImg = function (d, lab) {
    var W = 260, H = 160, s = "", mx = 130, cy = 80, dd = Math.max(10, Math.min(100, +d));
    s += '<path d="M' + mx + " 18V142" + '" stroke-width="2.6"/>';
    for (var i = 0; i < 8; i++) s += L(mx, 22 + i * 16, mx + 9, 30 + i * 16, { w: 1 });
    s += arw(mx - dd, cy + 26, mx - dd, cy - 26, { c: TN.r, w: 2 }) + T(mx - dd, cy + 40, "物", { z: 12 });
    s += arw(mx + dd, cy + 26, mx + dd, cy - 26, { c: TN.k, w: 2, d: "4 3" }) + T(mx + dd, cy + 40, "虛像", { z: 12, c: TN.k });
    s += L(mx - dd, cy + 32, mx + dd, cy + 32, { d: "3 3", w: 1 }) + T((mx * 2) / 2, cy + 48, lab || (dd + " 公分 ＝ " + dd + " 公分"), { z: 11 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 力與運動 ---------- */
  F.sciForce = function (labs, degs, mags) {
    var W = 240, H = 200, cx = 120, cy = 100, s = "";
    s += '<rect x="' + (cx - 26) + '" y="' + (cy - 20) + '" width="52" height="40" fill="' + TN.g + '" fill-opacity=".35" stroke-width="1.8"/>';
    var L2 = labs || ["F"], D = degs || [0], M = mags || [60];
    L2.forEach(function (lb, i) {
      var a = ((D[i] == null ? 0 : D[i]) * Math.PI) / 180, m = M[i] == null ? 60 : M[i];
      var ex = cx + m * Math.cos(a), ey = cy - m * Math.sin(a);
      s += arw(cx, cy, ex, ey, { c: TN.r, w: 2.2 }) + T(ex + 12 * Math.cos(a), ey - 12 * Math.sin(a), lb, { z: 12, c: TN.r });
    });
    return svg(W, H, s, 0.95);
  };
  F.sciIncline = function (deg, lab) {
    var W = 260, H = 170, s = "", x0 = 24, y0 = 142, d = Math.max(5, Math.min(60, +deg));
    var len = 200, ex = x0 + len, ey = y0 - len * Math.tan((d * Math.PI) / 180);
    s += '<path d="M' + x0 + " " + y0 + "H" + ex + "V" + ey + 'z" fill="' + TN.k + '" fill-opacity=".2" stroke-width="1.8"/>';
    var bx = x0 + len * 0.52, by = y0 - (len * 0.52) * Math.tan((d * Math.PI) / 180);
    var a = -(d * Math.PI) / 180;
    s += '<rect x="-14" y="-24" width="28" height="24" fill="' + TN.b + '" fill-opacity=".5" stroke-width="1.6" transform="translate(' + bx + " " + by + ") rotate(" + -d + ')"/>';
    s += arw(bx, by - 12, bx, by + 34, { c: TN.r, w: 2 }) + T(bx + 12, by + 40, "重力", { z: 11, c: TN.r, a: "start" });
    s += '<path d="M' + (x0 + 40) + " " + y0 + "A40 40 0 0 0 " + (x0 + 40 * Math.cos(a)) + " " + (y0 + 40 * Math.sin(a)) + '" stroke-width="1.2"/>';
    s += T(x0 + 54, y0 - 11, d + "°", { z: 12 });
    if (lab) s += T(W / 2, 18, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sciPulley = function (kind, lab) {
    var W = 200, H = 210, s = "";
    s += '<path d="M20 22h160" stroke-width="2.4"/>';
    for (var i = 0; i < 9; i++) s += L(24 + i * 18, 22, 18 + i * 18, 30, { w: 1 });
    if (kind === "movable") {
      s += L(70, 22, 70, 96, { w: 1.6 }) + L(130, 22, 130, 96, { w: 1.6 });
      s += '<circle cx="100" cy="96" r="22" fill="' + TN.y + '" fill-opacity=".35" stroke-width="1.8"/><circle cx="100" cy="96" r="3" fill="currentColor"/>';
      s += L(100, 118, 100, 140, { w: 1.6 });
      s += '<rect x="76" y="140" width="48" height="34" fill="' + TN.b + '" fill-opacity=".45" stroke-width="1.8"/>';
      s += arw(130, 90, 130, 44, { c: TN.r, w: 2 }) + T(142, 60, "施力", { z: 11, c: TN.r, a: "start" });
    } else {
      s += L(100, 22, 100, 52, { w: 1.6 });
      s += '<circle cx="100" cy="74" r="22" fill="' + TN.y + '" fill-opacity=".35" stroke-width="1.8"/><circle cx="100" cy="74" r="3" fill="currentColor"/>';
      s += L(78, 74, 78, 140, { w: 1.6 }) + L(122, 74, 122, 120, { w: 1.6 });
      s += '<rect x="54" y="140" width="48" height="34" fill="' + TN.b + '" fill-opacity=".45" stroke-width="1.8"/>';
      s += arw(122, 120, 122, 166, { c: TN.r, w: 2 }) + T(134, 150, "施力", { z: 11, c: TN.r, a: "start" });
    }
    if (lab) s += T(W / 2, 200, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  F.sciLever = function (fpos, lab1, lab2) {
    var W = 280, H = 150, s = "", y = 86, x0 = 26, x1 = 254;
    var fx = x0 + (x1 - x0) * Math.max(0.08, Math.min(0.92, (+fpos) / 100));
    s += '<path d="M' + x0 + " " + y + "H" + x1 + '" stroke-width="3"/>';
    s += '<path d="M' + fx + " " + (y + 4) + "l-16 26h32z" + '" fill="' + TN.k + '" fill-opacity=".4" stroke-width="1.6"/>';
    s += arw(x0 + 16, y - 10, x0 + 16, y - 56, { c: TN.r, w: 2.2 }) + T(x0 + 16, y - 64, lab1 || "施力", { z: 12, c: TN.r });
    s += arw(x1 - 16, y - 10, x1 - 16, y - 56, { c: TN.b, w: 2.2 }) + T(x1 - 16, y - 64, lab2 || "抗力", { z: 12, c: TN.b });
    s += L(x0 + 16, y + 34, fx, y + 34, { d: "3 3", w: 1 }) + L(fx, y + 44, x1 - 16, y + 44, { d: "3 3", w: 1 });
    return svg(W, H, s, 0.95);
  };
  F.sciSpring = function (n, lab) {
    var W = 110, H = 190, s = "", x = 55, y = 20, k = Math.max(3, Math.min(12, +n)), hh = 90;
    s += '<path d="M24 ' + y + "h62" + '" stroke-width="2.4"/>';
    var d = "M" + x + " " + y;
    for (var i = 0; i < k; i++) { var yy = y + (hh * (i + 1)) / k; d += "l" + (i % 2 ? -18 : 18) + " " + hh / k / 2 + "l" + (i % 2 ? 18 : -18) + " " + hh / k / 2; }
    s += '<path d="' + d + '" stroke-width="1.6"/>';
    s += L(x, y + hh, x, y + hh + 14, { w: 1.6 });
    s += '<rect x="' + (x - 22) + '" y="' + (y + hh + 14) + '" width="44" height="32" fill="' + TN.b + '" fill-opacity=".45" stroke-width="1.8"/>';
    if (lab) s += T(W / 2, H - 12, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciVT = function (vals, xl, yl) {
    var W = 260, H = 180, s = "", x0 = 40, y0 = 140, Wd = 196, Hd = 112;
    var v = (vals && vals.length ? vals : [0, 2, 4, 4, 4]).map(Number), mx = Math.max.apply(null, v.concat([1]));
    s += arw(x0, y0, x0 + Wd + 10, y0, { w: 1.8 }) + arw(x0, y0, x0, y0 - Hd - 10, { w: 1.8 });
    s += T(x0 + Wd + 16, y0 + 4, xl || "時間", { a: "start", z: 12 }) + T(x0 - 6, y0 - Hd - 16, yl || "速度", { a: "end", z: 12 });
    var d = "", st = Wd / (v.length - 1 || 1);
    v.forEach(function (y, i) { d += (i ? "L" : "M") + (x0 + st * i) + " " + (y0 - (y / mx) * Hd); });
    s += '<path d="' + d + '" stroke="' + TN.b + '" stroke-width="2.4"/>';
    v.forEach(function (y, i) { s += '<circle cx="' + (x0 + st * i) + '" cy="' + (y0 - (y / mx) * Hd) + '" r="3" fill="' + TN.b + '" stroke="none"/>'; });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 波 ---------- */
  F.sciWave = function (cyc, amp, lab) {
    var W = 300, H = 160, s = "", y = 82, x0 = 28, Wd = 244;
    var k = Math.max(0.5, +cyc), A = Math.max(6, Math.min(60, +amp)), d = "";
    for (var i = 0; i <= 200; i++) { var x = x0 + (Wd * i) / 200; d += (i ? "L" : "M") + x.toFixed(1) + " " + (y - A * Math.sin((2 * Math.PI * k * i) / 200)).toFixed(1); }
    s += L(x0, y, x0 + Wd, y, { d: "4 4", w: 1 });
    s += '<path d="' + d + '" stroke="' + TN.b + '" stroke-width="2.2"/>';
    var wl = Wd / k;
    s += arw(x0, y + A + 22, x0 + wl, y + A + 22, { c: TN.r, w: 1.4, hl: 7 }) + arw(x0 + wl, y + A + 22, x0, y + A + 22, { c: TN.r, w: 1.4, hl: 7 });
    s += T(x0 + wl / 2, y + A + 34, "波長", { z: 11, c: TN.r });
    s += arw(x0 + wl / 4, y, x0 + wl / 4, y - A, { c: TN.g, w: 1.4, hl: 7 }) + T(x0 + wl / 4 + 24, y - A / 2, "振幅", { z: 11, c: TN.g, a: "start" });
    if (lab) s += T(W / 2, 18, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 物質與反應 ---------- */
  F.sciAtom = function (p, nsh, lab) {
    var W = 190, H = 190, cx = 95, cy = 95, s = "";
    var k = Math.max(1, Math.min(4, +nsh));
    for (var i = 1; i <= k; i++) s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (22 + i * 18) + '" stroke-dasharray="3 3" stroke-width="1"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="18" fill="' + TN.r + '" fill-opacity=".55" stroke-width="1.6"/>' + T(cx, cy, String(p == null ? "+" : p), { z: 13, w: 700 });
    var per = [2, 8, 8, 8];
    for (i = 1; i <= k; i++) {
      var R = 22 + i * 18, n = per[i - 1];
      for (var j = 0; j < n; j++) { var a = (j / n) * 2 * Math.PI - Math.PI / 2; s += '<circle cx="' + (cx + R * Math.cos(a)).toFixed(1) + '" cy="' + (cy + R * Math.sin(a)).toFixed(1) + '" r="4" fill="' + TN.b + '" stroke="none"/>'; }
    }
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 0.9);
  };
  F.sciMolecule = function (c, lab) {
    var W = 200, H = 120, s = "", kind = String(c || "H2O");
    var sets = {
      H2O: [[100, 60, 20, TN.r, "O"], [56, 86, 13, TN.b, "H"], [144, 86, 13, TN.b, "H"]],
      CO2: [[100, 60, 19, TN.k, "C"], [46, 60, 16, TN.r, "O"], [154, 60, 16, TN.r, "O"]],
      O2: [[72, 60, 18, TN.r, "O"], [128, 60, 18, TN.r, "O"]],
      H2: [[76, 60, 14, TN.b, "H"], [124, 60, 14, TN.b, "H"]],
      CH4: [[100, 60, 19, TN.k, "C"], [100, 20, 12, TN.b, "H"], [100, 100, 12, TN.b, "H"], [56, 60, 12, TN.b, "H"], [144, 60, 12, TN.b, "H"]],
      NaCl: [[74, 60, 20, TN.p, "Na"], [130, 60, 17, TN.g, "Cl"]]
    };
    var a = sets[kind] || sets.H2O;
    for (var i = 1; i < a.length; i++) s += L(a[0][0], a[0][1], a[i][0], a[i][1], { w: 3 });
    a.forEach(function (x) { s += '<circle cx="' + x[0] + '" cy="' + x[1] + '" r="' + x[2] + '" fill="' + x[3] + '" fill-opacity=".65" stroke-width="1.6"/>' + T(x[0], x[1], x[4], { z: 12, w: 700 }); });
    if (lab) s += T(W / 2, H - 6, lab, { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciParticles = function (n, kind) {
    var W = 160, H = 130, s = "", k = Math.max(1, Math.min(40, +n));
    s += '<path d="M14 14h132v102H14z" stroke-width="1.8"/>';
    var mode = String(kind || "gas");
    for (var i = 0; i < k; i++) {
      var x, y;
      if (mode === "solid") { x = 32 + (i % 6) * 20; y = 34 + Math.floor(i / 6) * 20; }
      else if (mode === "liquid") { x = 28 + (i % 6) * 20 + (i % 2 ? 5 : 0); y = 60 + Math.floor(i / 6) * 18; }
      else { x = 24 + ((i * 53) % 118); y = 24 + ((i * 89) % 84); }
      if (y > 112) y = 112;
      s += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + TN.b + '" fill-opacity=".6" stroke-width="1.2"/>';
    }
    s += T(W / 2, H - 4, { solid: "固態", liquid: "液態", gas: "氣態" }[mode] || "", { z: 12 });
    return svg(W, H, s, 1);
  };
  F.sciPH = function (v) {
    var W = 300, H = 90, s = "", x0 = 18, Wd = 264, p = Math.max(0, Math.min(14, +v));
    var cols = ["#d0342c", "#e2572c", "#ef8b2c", "#f3c12e", "#d9d53a", "#a8c93c", "#6fbf4a", "#48b06a", "#35a08d", "#2f89a8", "#2f6cb0", "#3b4fa8", "#52379b", "#6b2f90", "#7d2b86"];
    for (var i = 0; i < 15; i++) s += '<rect x="' + (x0 + (Wd * i) / 15) + '" y="26" width="' + Wd / 15 + '" height="26" fill="' + cols[i] + '" stroke="none"/>';
    s += '<rect x="' + x0 + '" y="26" width="' + Wd + '" height="26" stroke-width="1.4"/>';
    for (i = 0; i <= 14; i += 2) s += T(x0 + (Wd * (i + 0.5)) / 15, 62, String(i), { z: 11 });
    var px = x0 + (Wd * (p + 0.5)) / 15;
    s += arw(px, 12, px, 24, { c: "currentColor", w: 2, hl: 8 }) + T(px, 6, "pH " + p, { z: 12, w: 700 });
    s += T(x0 + 16, 78, "酸性", { z: 11 }) + T(x0 + Wd / 2, 78, "中性", { z: 11 }) + T(x0 + Wd - 16, 78, "鹼性", { z: 11 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 磁 ---------- */
  F.sciMagnet = function (lab) {
    var W = 260, H = 170, s = "", x = 80, y = 70, w = 100, hh = 34;
    s += '<rect x="' + x + '" y="' + y + '" width="' + w / 2 + '" height="' + hh + '" fill="' + TN.r + '" fill-opacity=".6" stroke-width="1.6"/>' + T(x + w / 4, y + hh / 2, "N", { z: 15, w: 700 });
    s += '<rect x="' + (x + w / 2) + '" y="' + y + '" width="' + w / 2 + '" height="' + hh + '" fill="' + TN.b + '" fill-opacity=".6" stroke-width="1.6"/>' + T(x + (w * 3) / 4, y + hh / 2, "S", { z: 15, w: 700 });
    [26, 46, 66].forEach(function (r) {
      s += '<path d="M' + x + " " + (y + hh / 2) + "C" + (x - r) + " " + (y + hh / 2 - r) + " " + (x + w + r) + " " + (y + hh / 2 - r) + " " + (x + w) + " " + (y + hh / 2) +
        '" stroke="' + TN.k + '" stroke-width="1.2"/>';
      s += '<path d="M' + x + " " + (y + hh / 2) + "C" + (x - r) + " " + (y + hh / 2 + r) + " " + (x + w + r) + " " + (y + hh / 2 + r) + " " + (x + w) + " " + (y + hh / 2) +
        '" stroke="' + TN.k + '" stroke-width="1.2"/>';
    });
    if (lab) s += T(W / 2, H - 10, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };
  /* 螺線管：導線是一條真的螺旋線。
     一圈分成「繞到前面」和「繞到後面」兩段，先畫後面那一段，
     再把鐵芯（不透明）蓋上去，最後畫前面那一段 ——
     這樣導線才會一下子在芯的前面、一下子被芯擋住，看起來是真的纏上去的。
     線圈半徑比芯大一點，後面那半在上下兩端會露出來，繞的感覺就出來了。 */
  F.sciCoil = function (n, core, pole, cur, lab) {
    var W = 250, H = 150, s = "", k = Math.max(3, Math.min(14, +n || 5));
    var x0 = 52, xe = W - 52, w = xe - x0, cy = 70;
    var rc = 21, ry = rc * 1.22, rx = Math.min(13, w / k / 2.1);   /* 芯半徑、線圈半徑、一圈的橫向半徑 */
    var SEG = 26;
    function pt(t) {                      /* t 以「圈」為單位 */
      var a = t * 2 * Math.PI;
      return [x0 + rx + (w - 2 * rx) * t / k + rx * Math.sin(a), cy - ry * Math.cos(a), Math.sin(a + Math.PI / 2)];
    }
    /* 把螺旋線切成前段與後段 */
    var frontD = "", backD = "", open = null, side = null;
    for (var i = 0; i <= k * SEG; i++) {
      var t = i / SEG, p = pt(t), inFront = (Math.cos(t * 2 * Math.PI + Math.PI / 2) >= 0);
      /* 用橫向位移判斷前後：sin 為正的那半圈在前面 */
      inFront = Math.sin(t * 2 * Math.PI) >= 0;
      var d = (open === inFront ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
      if (inFront) frontD += d; else backD += d;
      open = inFront;
      if (side !== inFront && i > 0) {     /* 換邊時兩段都補上同一點，線才不會斷開 */
        if (inFront) backD += "L" + p[0].toFixed(1) + " " + p[1].toFixed(1);
        else frontD += "L" + p[0].toFixed(1) + " " + p[1].toFixed(1);
      }
      side = inFront;
    }
    var wire = 1.9;
    /* 引線 */
    s += L(18, cy, x0 + rx * 0.3, cy - ry * 0.9, { w: wire }) + L(xe - rx * 0.3, cy + ry * 0.9, W - 18, cy, { w: wire });
    if (backD) s += '<path d="' + backD + '" stroke-width="' + wire + '" fill="none"/>';
    if (core) {
      /* 鐵芯：不透明，才擋得住後面那半圈 */
      var cl = x0 - 6, cr = xe + 6, er = 7;
      s += '<path d="M' + cl + " " + (cy - rc) + "H" + cr + "A" + er + " " + rc + " 0 0 1 " + cr + " " + (cy + rc) +
        "H" + cl + "A" + er + " " + rc + " 0 0 1 " + cl + " " + (cy - rc) + 'Z" fill="var(--paper,#fff)" stroke="currentColor" stroke-width="1.4"/>';
      s += '<path d="M' + cr + " " + (cy - rc) + "A" + er + " " + rc + " 0 0 0 " + cr + " " + (cy + rc) + '" stroke-width="1.1" stroke-dasharray="3 3" fill="none"/>';
    }
    if (frontD) s += '<path d="' + frontD + '" stroke-width="' + wire + '" fill="none"/>';
    if (pole) s += T(x0 - 16, cy - rc - 12, "N", { z: 13, w: 700, c: TN.r }) + T(xe + 16, cy - rc - 12, "S", { z: 13, w: 700, c: TN.b });
    if (cur) s += arw(x0, cy + rc + 26, xe, cy + rc + 26, { c: TN.g, w: 1.6 }) + T((x0 + xe) / 2, cy + rc + 38, "電流", { z: 11, c: TN.g });
    if (lab) s += T(W / 2, 18, lab, { z: 12 });
    return svg(W, H, s, 0.95);
  };

  /* ---------- 登記到圖庫 ---------- */
  function N(k, n, v, min, max, step) { return { t: "num", k: k, n: n, v: v, min: min == null ? 0 : min, max: max == null ? 999 : max, step: step || 1 }; }
  function TT(k, n, v) { return { t: "txt", k: k, n: n, v: v }; }
  function BB(k, n, v) { return { t: "bool", k: k, n: n, v: v == null ? 1 : v }; }
  function NS(k, n, v) { return { t: "nums", k: k, n: n, v: v }; }
  function TS(k, n, v) { return { t: "txts", k: k, n: n, v: v }; }
  function SE(k, n, v, o) { return { t: "sel", k: k, n: n, v: v, o: o }; }
  var ELOPTS = Object.keys(ELN).map(function (k) { return [k, ELN[k]]; });

  S.SPECS = [
    { f: "sciSeries", g: "理化・電與磁", n: "串聯電路", a: [TS("items", "元件（逗號分隔）", "cell,sw,lamp"), TS("labs", "每個的標示", ""), N("open", "開關打開", 1, 0, 1)] },
    { f: "sciParallel", g: "理化・電與磁", n: "並聯電路", a: [SE("a", "上支路", "lamp", ELOPTS), SE("b", "下支路", "lamp", ELOPTS), SE("src", "電源", "cell", ELOPTS)] },
    { f: "sciMagnet", g: "理化・電與磁", n: "條形磁鐵與磁力線", a: [TT("lab", "標示", "")] },
    { f: "sciCoil", g: "理化・電與磁", n: "螺線管", a: [N("n", "匝數", 6, 3, 14), BB("core", "畫出鐵芯", 1), BB("pole", "標 N、S 極", 1), BB("cur", "畫電流箭頭", 1), TT("lab", "標示", "")] },

    { f: "sciForce", g: "理化・力與運動", n: "力的箭頭（自由體圖）", a: [TS("labs", "每個力的名稱", "F1,F2"), NS("degs", "方向（度）", "0,90"), NS("mags", "長度", "60,50")] },
    { f: "sciIncline", g: "理化・力與運動", n: "斜面", a: [N("deg", "傾角", 30, 5, 60), TT("lab", "標示", "")] },
    { f: "sciPulley", g: "理化・力與運動", n: "滑輪", a: [SE("kind", "種類", "fixed", [["fixed", "定滑輪"], ["movable", "動滑輪"]]), TT("lab", "標示", "")] },
    { f: "sciLever", g: "理化・力與運動", n: "槓桿", a: [N("fpos", "支點位置（%）", 50, 8, 92), TT("lab1", "左端", "施力"), TT("lab2", "右端", "抗力")] },
    { f: "sciSpring", g: "理化・力與運動", n: "彈簧測力計", a: [N("n", "圈數", 6, 3, 12), TT("lab", "標示", "")] },
    { f: "sciVT", g: "理化・力與運動", n: "速度－時間圖", a: [NS("vals", "各時刻的值", "0,2,4,4,4"), TT("xl", "橫軸", "時間"), TT("yl", "縱軸", "速度")] },

    { f: "sciReflect", g: "理化・光與波", n: "光的反射", a: [N("ang", "入射角", 40, 0, 85), TT("lab", "標示", "")] },
    { f: "sciRefract", g: "理化・光與波", n: "光的折射", a: [N("a1", "入射角", 45, 0, 85), N("a2", "折射角", 32, 0, 85), TT("lab", "下方介質", "水")] },
    { f: "sciLens", g: "理化・光與波", n: "透鏡成像", a: [SE("kind", "種類", "convex", [["convex", "凸透鏡"], ["concave", "凹透鏡"]]), TT("uLab", "物", "物"), TT("vLab", "像", "像")] },
    { f: "sciMirrorImg", g: "理化・光與波", n: "平面鏡成像", a: [N("d", "物距", 60, 10, 100), TT("lab", "標示", "")] },
    { f: "sciWave", g: "理化・光與波", n: "波形（波長振幅）", a: [N("cyc", "幾個波", 2, 1, 6, 0.5), N("amp", "振幅", 34, 6, 60), TT("lab", "標示", "")] },

    { f: "sciAtom", g: "理化・物質與反應", n: "原子模型（電子殼層）", a: [TT("p", "原子核標示", "+"), N("nsh", "電子層數", 2, 1, 4), TT("lab", "標示", "")] },
    { f: "sciMolecule", g: "理化・物質與反應", n: "分子模型", a: [SE("c", "分子", "H2O", [["H2O", "水 H₂O"], ["CO2", "二氧化碳 CO₂"], ["O2", "氧 O₂"], ["H2", "氫 H₂"], ["CH4", "甲烷 CH₄"], ["NaCl", "氯化鈉"]]), TT("lab", "標示", "")] },
    { f: "sciParticles", g: "理化・物質與反應", n: "粒子示意（三態）", a: [N("n", "幾個粒子", 18, 1, 40), SE("kind", "狀態", "gas", [["solid", "固態"], ["liquid", "液態"], ["gas", "氣態"]])] },
    { f: "sciPH", g: "理化・物質與反應", n: "pH 色階", a: [N("v", "pH 值", 3, 0, 14)] },

    { f: "sciBeaker", g: "理化・實驗器材", n: "燒杯", a: [N("v", "液量", 60, 0, 100), N("max", "滿量", 100, 1, 1000), TT("lab", "標示", "")] },
    { f: "sciCylinder", g: "理化・實驗器材", n: "量筒", a: [N("v", "液量", 40, 0, 100), N("max", "滿量", 100, 1, 1000), TT("lab", "標示", "")] },
    { f: "sciTube", g: "理化・實驗器材", n: "試管", a: [N("v", "液量（%）", 45, 0, 100), TT("lab", "標示", "")] },
    { f: "sciBurner", g: "理化・實驗器材", n: "酒精燈", a: [TT("lab", "標示", "")] },
    { f: "sciFilter", g: "理化・實驗器材", n: "過濾裝置", a: [TT("lab", "標示", "")] },
    { f: "sciThermo", g: "理化・實驗器材", n: "溫度計", a: [N("t", "溫度", 60, -50, 200), N("min", "最低刻度", 0, -100, 100), N("max", "最高刻度", 100, 0, 500)] },
    { f: "sciBalance", g: "理化・實驗器材", n: "天平（上皿）", a: [TT("lab1", "左盤", "樣品"), TT("lab2", "右盤", "砝碼"), N("tilt", "傾斜（-1 左 0 平 1 右）", 0, -1, 1)] }
  ];

  /* 掛進 DR.fig，圖庫才找得到；再把規格併進 drawLib */
  function install() {
    if (!window.DR) window.DR = {};
    if (!DR.fig) DR.fig = {};
    Object.keys(F).forEach(function (k) { DR.fig[k] = F[k]; });
    if (NB.drawLib && NB.drawLib.SPECS) S.SPECS.forEach(function (x) { NB.drawLib.SPECS.push(x); });
  }
  install();
})();
