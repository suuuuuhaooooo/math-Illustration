/* 製圖：國小數學圖庫（第二批）。
   這一批是照出版社 1 上～6 下各單元實際會用到的圖去補的——
   定位板、數字列、連連看、紙帶、串珠、月曆、畫記表、比長短、價格牌、路線圖……
   都是自己照課綱重畫的參數化圖形，不是描出版社的圖。
   畫法跟第一批一致：吐一支完整的 <svg>、線條用 currentColor，
   插進畫布、換顏色、匯出都跟其他圖一樣。 */
(function () {
  "use strict";
  var NB = window.NB, S = (NB.drawLib2 = { FIGS: {} });
  var F = S.FIGS;
  var TN = { r: "#e58a73", b: "#78a9e0", g: "#7fc3a0", y: "#ecc566", p: "#b7a5e6", k: "#9aa1ab", w: "#f2efe6" };

  function svg(w, h, body, k) {
    return '<svg class="dfig" viewBox="0 0 ' + w + " " + h + '" width="' + Math.round(w * (k || 1)) + '" height="' + Math.round(h * (k || 1)) +
      '" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="inherit">' + body + "</svg>";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + rd(x) + '" y="' + rd(y) + '" text-anchor="' + (o.a || "middle") + '" dominant-baseline="' + (o.b || "middle") +
      '" font-size="' + (o.z || 13) + '" fill="' + (o.c || "currentColor") + '" stroke="none"' + (o.w ? ' font-weight="' + o.w + '"' : "") + ">" + esc(s) + "</text>";
  }
  function L(x1, y1, x2, y2, o) {
    o = o || {};
    return '<path d="M' + rd(x1) + " " + rd(y1) + "L" + rd(x2) + " " + rd(y2) + '"' + (o.w ? ' stroke-width="' + o.w + '"' : "") + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + (o.c ? ' stroke="' + o.c + '"' : "") + "/>";
  }
  function R(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + rd(x) + '" y="' + rd(y) + '" width="' + rd(w) + '" height="' + rd(h) + '"' + (o.r ? ' rx="' + o.r + '"' : "") +
      ' fill="' + (o.f || "none") + '"' + (o.c ? ' stroke="' + o.c + '"' : "") + (o.w ? ' stroke-width="' + o.w + '"' : "") + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + "/>";
  }
  function C(cx, cy, r, o) {
    o = o || {};
    return '<circle cx="' + rd(cx) + '" cy="' + rd(cy) + '" r="' + rd(r) + '" fill="' + (o.f || "none") + '"' + (o.c ? ' stroke="' + o.c + '"' : "") + (o.w ? ' stroke-width="' + o.w + '"' : "") + "/>";
  }
  function rd(v) { return Math.round(v * 100) / 100; }
  function arw(x1, y1, x2, y2, o) {
    o = o || {}; var c = o.c || "currentColor", w = o.w || 1.6, Ln = Math.max(9, w * 4.2), W = Ln * .5;
    var a = Math.atan2(y2 - y1, x2 - x1), bx = x2 - Ln * Math.cos(a), by = y2 - Ln * Math.sin(a);
    return '<path d="M' + rd(x1) + " " + rd(y1) + "L" + rd(bx) + " " + rd(by) + '" stroke="' + c + '" stroke-width="' + w + '"' + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + "/>" +
      '<path d="M' + rd(x2) + " " + rd(y2) + "L" + rd(bx + W * Math.sin(a)) + " " + rd(by - W * Math.cos(a)) + "L" + rd(bx - W * Math.sin(a)) + " " + rd(by + W * Math.cos(a)) + 'Z" fill="' + c + '" stroke="none"/>';
  }
  function arr(v) { return Array.isArray(v) ? v : String(v == null ? "" : v).split(/[,\s]+/).filter(function (x) { return x !== ""; }); }
  function nums(v) { return arr(v).map(Number).filter(function (x) { return isFinite(x); }); }

  /* ---------- 1. 定位板（數位板）---------- */
  /* 千百十個分欄，每一欄可以填數字，也可以改成畫積木／圓點 */
  F.libPlace = function (cols, digits, mode, lab) {
    var CN = arr(cols); if (!CN.length) CN = ["百", "十", "個"];
    var ds = arr(digits), n = CN.length;
    var cw = 62, hh = 26, bodyH = mode === "num" ? 46 : 92;
    var W = n * cw + 24, H = hh + bodyH + (lab ? 26 : 10), x0 = 12, y0 = lab ? 22 : 6;
    var s = "";
    if (lab) s += T(W / 2, 12, lab, { z: 13 });
    for (var i = 0; i < n; i++) {
      var x = x0 + i * cw;
      s += R(x, y0, cw, hh, { f: TN.w, w: 1.6 });
      s += T(x + cw / 2, y0 + hh / 2 + 1, CN[i], { z: 14 });
      s += R(x, y0 + hh, cw, bodyH, { w: 1.6 });
      var v = +ds[i];
      if (!isFinite(v) || v < 0) v = 0;
      if (mode === "num") {
        if (ds[i] != null && ds[i] !== "") s += T(x + cw / 2, y0 + hh + bodyH / 2 + 1, ds[i], { z: 26, w: 700 });
      } else if (mode === "block") {
        /* 位值積木：個＝小方塊、十＝一條十個、百＝十乘十的片、千＝大方塊 */
        var kind = n - 1 - i, bx0 = x + 5, byB = y0 + hh + bodyH - 5, cap = Math.min(v, 9);
        for (var q = 0; q < cap; q++) {
          if (kind === 0) {              /* 個：6×6 的小方塊，三個一排 */
            var ux = bx0 + (q % 3) * 9, uy = byB - 8 - Math.floor(q / 3) * 9;
            s += R(ux, uy, 7, 7, { f: TN.y, w: .9 });
          } else if (kind === 1) {       /* 十：一條，裡面有十格 */
            var lx = bx0 + q * 6;
            if (lx + 5 > x + cw - 4) break;
            s += R(lx, byB - 54, 5, 54, { f: TN.g, w: .9 });
            for (var t2 = 1; t2 < 10; t2++) s += L(lx, byB - 54 + t2 * 5.4, lx + 5, byB - 54 + t2 * 5.4, { w: .4, c: TN.k });
          } else if (kind === 2) {       /* 百：一片十乘十 */
            var px = bx0 + (q % 2) * 27, py = byB - 24 - Math.floor(q / 2) * 27;
            if (py < y0 + hh + 3) break;
            s += R(px, py, 24, 24, { f: TN.b, w: .9 });
            for (var t3 = 1; t3 < 5; t3++) { s += L(px + t3 * 4.8, py, px + t3 * 4.8, py + 24, { w: .4, c: TN.k }) + L(px, py + t3 * 4.8, px + 24, py + t3 * 4.8, { w: .4, c: TN.k }); }
          } else {                       /* 千：一個大方塊 */
            var qx = bx0 + (q % 2) * 27, qy = byB - 30 - Math.floor(q / 2) * 33;
            if (qy < y0 + hh + 3) break;
            s += R(qx + 5, qy, 22, 22, { f: TN.p, w: .9 }) +
              '<path d="M' + rd(qx + 5) + " " + rd(qy) + "l-5 -6h22l5 6M" + rd(qx + 27) + " " + rd(qy) + "l5 -6v22l-5 6" +
              '" fill="none" stroke="currentColor" stroke-width="0.9"/>';
          }
        }
      } else {
        for (var q2 = 0; q2 < Math.min(v, 10); q2++) {
          s += C(x + 13 + (q2 % 3) * 18, y0 + hh + 16 + Math.floor(q2 / 3) * 20, 6.5, { f: TN.r, w: 1.2 });
        }
      }
    }
    return svg(W, H, s, .95);
  };

  /* ---------- 2. 數字列（有空格的數列）---------- */
  F.libSeq = function (vals, boxes, lab) {
    var V = arr(vals); if (!V.length) V = ["2", "4", "?", "8", "10"];
    var cw = 46, hh = 40, W = V.length * (cw + 8) + 16, H = hh + (lab ? 34 : 18), x0 = 8, y0 = lab ? 26 : 8;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    V.forEach(function (v, i) {
      var x = x0 + i * (cw + 8), blank = v === "?" || v === "□" || v === "_" || v === "";
      if (boxes !== 0) s += R(x, y0, cw, hh, { r: 5, w: 1.6, d: blank ? "5 4" : "" });
      if (!blank) s += T(x + cw / 2, y0 + hh / 2 + 1, v, { z: 20 });
    });
    return svg(W, H, s, .95);
  };

  /* ---------- 3. 連連看 ---------- */
  F.libMatch = function (left, right, links, lab) {
    var A = arr(left), B = arr(right);
    if (!A.length) A = ["3+4", "5+2", "6+1"];
    if (!B.length) B = ["7", "7", "7"];
    var rowH = 38, bw = 92, gap = 96;
    var rows = Math.max(A.length, B.length);
    var W = bw * 2 + gap + 24, H = rows * rowH + (lab ? 32 : 16), x0 = 12, y0 = lab ? 26 : 8;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    function cy(i) { return y0 + i * rowH + rowH / 2; }
    A.forEach(function (t, i) { s += R(x0, cy(i) - 15, bw, 30, { r: 6, w: 1.5, f: TN.w }) + T(x0 + bw / 2, cy(i) + 1, t, { z: 15 }); });
    B.forEach(function (t, i) { s += R(x0 + bw + gap, cy(i) - 15, bw, 30, { r: 6, w: 1.5, f: TN.w }) + T(x0 + bw + gap + bw / 2, cy(i) + 1, t, { z: 15 }); });
    /* 左右各一個小圓點，給學生連線用 */
    A.forEach(function (t, i) { s += C(x0 + bw + 10, cy(i), 3.2, { f: "currentColor" }); });
    B.forEach(function (t, i) { s += C(x0 + bw + gap - 10, cy(i), 3.2, { f: "currentColor" }); });
    /* links 寫「左編號-右編號」，例如 1-2,2-1,3-3；留空就只畫點不連線 */
    arr(links).forEach(function (p) {
      var m = /^(\d+)-(\d+)$/.exec(String(p).trim()); if (!m) return;
      var a = +m[1] - 1, b = +m[2] - 1;
      if (a < 0 || b < 0 || a >= A.length || b >= B.length) return;
      s += L(x0 + bw + 10, cy(a), x0 + bw + gap - 10, cy(b), { w: 1.4, c: TN.b });
    });
    return svg(W, H, s, .95);
  };

  /* ---------- 4. 紙帶／彩帶（分段）---------- */
  /* 分成 n 段，可以塗其中幾段，也可以在每段寫字；做分數、長度、比都用得到 */
  F.libStrip = function (n, fill, labs, total, lab) {
    var k = Math.max(1, Math.min(24, +n || 4)), f = Math.max(0, Math.min(k, +fill || 0));
    var LB = arr(labs);
    var W = 320, hh = 40, x0 = 14, y0 = lab ? 28 : 12, cw = (W - 28) / k;
    var H = y0 + hh + (total ? 32 : 12);
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    for (var i = 0; i < k; i++) {
      s += R(x0 + i * cw, y0, cw, hh, { f: i < f ? TN.g : "none", w: 1.5 });
      if (LB[i]) s += T(x0 + i * cw + cw / 2, y0 + hh / 2 + 1, LB[i], { z: 13 });
    }
    s += R(x0, y0, W - 28, hh, { w: 2 });
    if (total) {
      var ty = y0 + hh + 16;
      s += L(x0, ty - 5, x0, ty + 5, { w: 1.2 }) + L(x0 + W - 28, ty - 5, x0 + W - 28, ty + 5, { w: 1.2 });
      s += arw(x0, ty, x0 + W - 28, ty, { w: 1.3 }) + arw(x0 + W - 28, ty, x0, ty, { w: 1.3 });
      s += R(W / 2 - 30, ty - 9, 60, 18, { f: "var(--paper,#fff)", c: "none" }) + T(W / 2, ty + 1, String(total), { z: 13 });
    }
    return svg(W, H, s, .95);
  };

  /* ---------- 5. 串珠（幾顆一組）---------- */
  F.libBeads = function (n, group, lab) {
    var k = Math.max(1, Math.min(40, +n || 12)), g = Math.max(1, Math.min(10, +group || 5));
    var per = 18, pad = 10, gapx = 10;
    var groups = Math.ceil(k / g);
    var W = k * per + (groups - 1) * gapx + pad * 2, H = (lab ? 26 : 6) + 58, y = (lab ? 26 : 6) + 20;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    var x = pad, drawn = 0;
    s += L(pad - 6, y, W - pad + 6, y, { w: 1.2, c: TN.k });
    for (var gi = 0; gi < groups; gi++) {
      var cnt = Math.min(g, k - drawn);
      for (var i = 0; i < cnt; i++) {
        s += C(x + per / 2, y, per / 2 - 1.5, { f: gi % 2 ? TN.b : TN.r, w: 1.2 });
        x += per;
      }
      drawn += cnt;
      if (gi < groups - 1) x += gapx;
    }
    s += T(W / 2, y + 26, k + " 顆（" + g + " 顆一組）", { z: 12, c: TN.k });
    return svg(W, H, s, .95);
  };

  /* ---------- 6. 月曆 ---------- */
  F.libCalendar = function (days, start, marks, lab) {
    var n = Math.max(28, Math.min(31, +days || 30)), st = ((+start || 0) % 7 + 7) % 7;
    var MK = nums(marks);
    var cw = 40, ch = 30, W = cw * 7 + 16, x0 = 8;
    var rows = Math.ceil((n + st) / 7);
    var y0 = (lab ? 26 : 8) + ch;
    var H = y0 + rows * ch + 10;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    var WD = ["日", "一", "二", "三", "四", "五", "六"];
    for (var i = 0; i < 7; i++) {
      s += R(x0 + i * cw, y0 - ch, cw, ch, { f: TN.w, w: 1.4 });
      s += T(x0 + i * cw + cw / 2, y0 - ch / 2 + 1, WD[i], { z: 13, c: i === 0 ? TN.r : i === 6 ? TN.b : "currentColor" });
    }
    for (var d = 1; d <= n; d++) {
      var idx = st + d - 1, r = Math.floor(idx / 7), c = idx % 7;
      var x = x0 + c * cw, y = y0 + r * ch, on = MK.indexOf(d) >= 0;
      s += R(x, y, cw, ch, { w: 1.2, f: on ? TN.y : "none" });
      s += T(x + cw / 2, y + ch / 2 + 1, d, { z: 13, w: on ? 700 : 0 });
    }
    /* 補滿最後一列的空格 */
    for (var e = st + n; e < rows * 7; e++) {
      s += R(x0 + (e % 7) * cw, y0 + Math.floor(e / 7) * ch, cw, ch, { w: 1.2 });
    }
    for (var b = 0; b < st; b++) s += R(x0 + b * cw, y0, cw, ch, { w: 1.2 });
    return svg(W, H, s, .95);
  };

  /* ---------- 7. 分類畫記表（正字記號）---------- */
  F.libTally = function (items, counts, showNum, lab) {
    var IT = arr(items); if (!IT.length) IT = ["紅", "藍", "黃"];
    var CT = nums(counts);
    var rowH = 34, cw1 = 86, cw2 = 170, cw3 = showNum === 0 ? 0 : 56;
    var W = cw1 + cw2 + cw3 + 16, x0 = 8, y0 = (lab ? 26 : 8) + rowH;
    var H = y0 + IT.length * rowH + 10;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    s += R(x0, y0 - rowH, cw1, rowH, { f: TN.w, w: 1.5 }) + T(x0 + cw1 / 2, y0 - rowH / 2 + 1, "項目", { z: 13 });
    s += R(x0 + cw1, y0 - rowH, cw2, rowH, { f: TN.w, w: 1.5 }) + T(x0 + cw1 + cw2 / 2, y0 - rowH / 2 + 1, "畫記", { z: 13 });
    if (cw3) s += R(x0 + cw1 + cw2, y0 - rowH, cw3, rowH, { f: TN.w, w: 1.5 }) + T(x0 + cw1 + cw2 + cw3 / 2, y0 - rowH / 2 + 1, "數量", { z: 13 });
    IT.forEach(function (it, i) {
      var y = y0 + i * rowH, v = CT[i] == null ? 0 : CT[i];
      s += R(x0, y, cw1, rowH, { w: 1.2 }) + T(x0 + cw1 / 2, y + rowH / 2 + 1, it, { z: 13 });
      s += R(x0 + cw1, y, cw2, rowH, { w: 1.2 });
      /* 滿五劃寫一個「正」，不足五劃用直劃補；
         不足的那幾劃如果硬畫成半個「正」，很容易畫成別的字，所以用直劃最清楚 */
      var full = Math.floor(v / 5), rest = v % 5, bx = x0 + cw1 + 12;
      for (var q = 0; q < full; q++) s += T(bx + q * 22 + 9, y + rowH / 2 + 1, "正", { z: 17 });
      var sx = bx + full * 22 + 4, cy = y + rowH / 2;
      for (var w2 = 0; w2 < rest; w2++) s += L(sx + w2 * 7, cy - 9, sx + w2 * 7, cy + 9, { w: 1.8 });
      if (cw3) s += R(x0 + cw1 + cw2, y, cw3, rowH, { w: 1.2 }) + T(x0 + cw1 + cw2 + cw3 / 2, y + rowH / 2 + 1, v, { z: 15 });
    });
    return svg(W, H, s, .95);
  };

  /* ---------- 8. 比長短（幾條長度不同的條）---------- */
  F.libCompare = function (vals, labs, unit, grid, lab) {
    var V = nums(vals); if (!V.length) V = [3, 5, 2];
    var LB = arr(labs);
    var mx = Math.max.apply(null, V) || 1, u = Math.min(30, 240 / mx);
    var rowH = 34, W = 300, x0 = 46, y0 = (lab ? 26 : 10);
    var H = y0 + V.length * rowH + 14;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    if (grid) for (var g = 0; g <= mx; g++) s += L(x0 + g * u, y0, x0 + g * u, y0 + V.length * rowH, { w: .7, c: TN.k, d: "3 3" });
    V.forEach(function (v, i) {
      var y = y0 + i * rowH + 6, h = rowH - 16;
      s += R(x0, y, v * u, h, { f: [TN.r, TN.b, TN.g, TN.y, TN.p][i % 5], w: 1.4 });
      s += T(x0 - 8, y + h / 2 + 1, LB[i] || String.fromCharCode(65 + i), { z: 13, a: "end" });
      if (unit) s += T(x0 + v * u + 8, y + h / 2 + 1, v + unit, { z: 12, a: "start", c: TN.k });
    });
    return svg(W, H, s, .95);
  };

  /* ---------- 9. 價格牌 ---------- */
  F.libPrice = function (items, prices, lab) {
    var IT = arr(items); if (!IT.length) IT = ["鉛筆", "筆記本", "橡皮擦"];
    var PR = arr(prices);
    var bw = 96, bh = 62, gap = 12, x0 = 10, y0 = (lab ? 26 : 10);
    var W = IT.length * (bw + gap) - gap + 20, H = y0 + bh + 14;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    IT.forEach(function (it, i) {
      var x = x0 + i * (bw + gap);
      s += '<path d="M' + rd(x + 12) + " " + y0 + "H" + rd(x + bw) + "V" + rd(y0 + bh) + "H" + rd(x + 12) +
        "L" + rd(x) + " " + rd(y0 + bh / 2) + 'Z" fill="' + TN.w + '" stroke="currentColor" stroke-width="1.5"/>';
      s += C(x + 16, y0 + bh / 2, 3, { f: "currentColor" });
      s += T(x + (bw + 12) / 2 + 4, y0 + 20, it, { z: 13 });
      s += T(x + (bw + 12) / 2 + 4, y0 + 42, (PR[i] == null ? "" : PR[i]) + " 元", { z: 15, w: 700 });
    });
    return svg(W, H, s, .95);
  };

  /* ---------- 10. 路線圖（站點與距離）---------- */
  F.libRoute = function (stops, dists, unit, lab) {
    var ST = arr(stops); if (ST.length < 2) ST = ["學校", "公園", "家"];
    var DS = arr(dists);
    var W = 60 + (ST.length - 1) * 110, y = (lab ? 34 : 18) + 26, H = y + 52;
    var s = lab ? T(W / 2, 14, lab, { z: 13 }) : "";
    var x0 = 30, step = (W - 60) / (ST.length - 1);
    for (var i = 0; i < ST.length; i++) {
      var x = x0 + i * step;
      if (i < ST.length - 1) {
        s += L(x, y, x + step, y, { w: 2 });
        var d = DS[i];
        if (d != null && d !== "") {
          s += L(x + 6, y + 16, x + 6, y + 24, { w: 1 }) + L(x + step - 6, y + 16, x + step - 6, y + 24, { w: 1 });
          s += arw(x + 6, y + 20, x + step - 6, y + 20, { w: 1.3, c: TN.k }) + arw(x + step - 6, y + 20, x + 6, y + 20, { w: 1.3, c: TN.k });
          s += R(x + step / 2 - 28, y + 11, 56, 18, { f: "var(--paper,#fff)", c: "none" });
          s += T(x + step / 2, y + 21, d + (unit || ""), { z: 12 });
        }
      }
      s += C(x, y, 6, { f: TN.r, w: 1.5 });
      s += T(x, y - 18, ST[i], { z: 13 });
    }
    return svg(W, H, s, .95);
  };

  /* ---------- 11. 撲克牌 ---------- */
  F.libCards = function (faces, suits, back, lab) {
    var FA = arr(faces); if (!FA.length) FA = ["A", "5", "10"];
    var SU = arr(suits);
    var cw = 54, chh = 76, gap = 10, x0 = 10, y0 = (lab ? 26 : 10);
    var W = FA.length * (cw + gap) - gap + 20, H = y0 + chh + 12;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    var SY = { s: "♠", h: "♥", d: "♦", c: "♣", "黑桃": "♠", "紅心": "♥", "方塊": "♦", "梅花": "♣" };
    FA.forEach(function (fv, i) {
      var x = x0 + i * (cw + gap);
      s += R(x, y0, cw, chh, { r: 6, f: TN.w, w: 1.5 });
      if (back) {
        s += R(x + 6, y0 + 6, cw - 12, chh - 12, { r: 4, f: TN.b, w: 1 });
        return;
      }
      var su = SY[SU[i]] || SY[SU[0]] || "♠", red = su === "♥" || su === "♦";
      var col = red ? TN.r : "currentColor";
      s += T(x + 13, y0 + 15, fv, { z: 14, c: col, w: 700 });
      s += T(x + 13, y0 + 29, su, { z: 13, c: col });
      s += T(x + cw / 2, y0 + chh / 2 + 8, su, { z: 26, c: col });
    });
    return svg(W, H, s, .95);
  };

  /* ---------- 12. 平方公分格／點格紙上的圖形 ---------- */
  /* 出版社三、四年級用最兇的一張圖：在方格紙上塗色或拼一個圖形，數格子算面積。
     格線可以換成點格（平方公分點），也可以直接給頂點畫出一個多邊形。 */
  F.libGridArea = function (cols, rows2, cells, poly, dots, unit, half, lab) {
    var W0 = Math.max(1, Math.min(20, +cols || 8)), H0 = Math.max(1, Math.min(20, +rows2 || 6));
    var u = Math.min(34, Math.max(16, Math.floor(300 / Math.max(W0, H0))));
    var x0 = 14, y0 = (lab ? 26 : 10), W = W0 * u + 28, H = y0 + H0 * u + (unit ? 30 : 12);
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    /* 塗色格子：寫「欄,列」，左上角是 1,1 */
    var CS = String(cells == null ? "" : cells).trim().split(/\s+/).filter(Boolean);
    CS.forEach(function (p) {
      var m = /^(\d+),(\d+)$/.exec(p); if (!m) return;
      var c = +m[1] - 1, r = +m[2] - 1;
      if (c < 0 || r < 0 || c >= W0 || r >= H0) return;
      s += R(x0 + c * u, y0 + r * u, u, u, { f: TN.g, c: "none" });
    });
    /* 半格（算面積常用）：寫「欄,列,方向」，方向 1～4 代表要塗的那半個三角形 */
    String(half == null ? "" : half).trim().split(/\s+/).filter(Boolean).forEach(function (p) {
      var m = /^(\d+),(\d+),([1-4])$/.exec(p); if (!m) return;
      var c = +m[1] - 1, r = +m[2] - 1, k = +m[3];
      if (c < 0 || r < 0 || c >= W0 || r >= H0) return;
      var X = x0 + c * u, Y = y0 + r * u;
      var tri = [[[X, Y], [X + u, Y], [X, Y + u]], [[X + u, Y], [X + u, Y + u], [X, Y]],
        [[X + u, Y + u], [X, Y + u], [X + u, Y]], [[X, Y + u], [X, Y], [X + u, Y + u]]][k - 1];
      s += '<polygon points="' + tri.map(function (q) { return rd(q[0]) + "," + rd(q[1]); }).join(" ") + '" fill="' + TN.g + '" stroke="none"/>';
    });
    /* 格線或點格 */
    if (dots) {
      for (var r2 = 0; r2 <= H0; r2++) for (var c2 = 0; c2 <= W0; c2++) {
        s += C(x0 + c2 * u, y0 + r2 * u, 1.9, { f: TN.k, c: "none" });
      }
    } else {
      for (var i = 0; i <= W0; i++) s += L(x0 + i * u, y0, x0 + i * u, y0 + H0 * u, { w: i % 10 === 0 ? 1.2 : .8, c: TN.k });
      for (var j = 0; j <= H0; j++) s += L(x0, y0 + j * u, x0 + W0 * u, y0 + j * u, { w: j % 10 === 0 ? 1.2 : .8, c: TN.k });
    }
    /* 外框多邊形：寫「欄,列」的頂點，座標是格線交點，左上角是 0,0 */
    var PV = String(poly == null ? "" : poly).trim().split(/\s+/).filter(Boolean).map(function (p) {
      var m = /^(-?[\d.]+),(-?[\d.]+)$/.exec(p); return m ? [x0 + +m[1] * u, y0 + +m[2] * u] : null;
    }).filter(Boolean);
    if (PV.length >= 3) {
      s += '<polygon points="' + PV.map(function (q) { return rd(q[0]) + "," + rd(q[1]); }).join(" ") +
        '" fill="none" stroke="currentColor" stroke-width="2.2"/>';
    } else if (PV.length === 2) {
      s += L(PV[0][0], PV[0][1], PV[1][0], PV[1][1], { w: 2.2 });
    }
    if (unit) {
      /* 右下角擺一個「1 平方公分」的示意小格 */
      var bx = x0 + W0 * u - u, by = y0 + H0 * u + 6;
      s += R(bx, by, u * .62, u * .62, { f: TN.y, w: 1 });
      s += T(bx - 6, by + u * .31, unit, { z: 11, a: "end", c: TN.k });
    }
    return svg(W, H, s, .95);
  };

  /* ---------- 13. 數線填空 ---------- */
  F.libNumFill = function (a, b, step, blanks, ticksOnly, lab) {
    var A = +a, B = +b, st = +step || 1;
    if (!isFinite(A)) A = 0; if (!isFinite(B)) B = 10;
    if (B <= A) B = A + 1;
    var n = Math.min(40, Math.round((B - A) / st));
    var W = 340, x0 = 24, y = (lab ? 30 : 16) + 22, H = y + 40;
    var u = (W - 48) / n;
    var BL = nums(blanks);
    var s = lab ? T(W / 2, 14, lab, { z: 13 }) : "";
    s += arw(x0 - 12, y, W - 10, y, { w: 1.8 });
    for (var i = 0; i <= n; i++) {
      var v = A + i * st, x = x0 + i * u, big = Math.abs(v / st) % 5 < 1e-9;
      s += L(x, y - (big ? 8 : 5), x, y + (big ? 8 : 5), { w: big ? 1.6 : 1.1 });
      var blank = BL.indexOf(i + 1) >= 0;
      if (blank) {
        s += R(x - 15, y + 12, 30, 20, { r: 3, w: 1.4, d: "4 3" });
      } else if (!ticksOnly || big) {
        s += T(x, y + 22, Math.round(v * 1000) / 1000, { z: 12 });
      }
    }
    return svg(W, H, s, .95);
  };

  /* ---------- 14. 直式（可以留空格）---------- */
  /* 寫「12+9」「405-78」「23×4」「96÷4」都可以；用 ? 當作要學生填的那一位 */
  F.libVert = function (expr, blanks, showAns, lab) {
    var E = String(expr == null ? "" : expr).replace(/\s+/g, "") || "12+9";
    var m = /^(-?[\d?]+)([+\-×x*÷\/])([\d?]+)$/.exec(E);
    if (!m) return svg(160, 80, T(80, 40, "算式寫成 12+9 這樣", { z: 13, c: TN.k }), .95);
    var A = m[1], OP = { "x": "×", "*": "×", "/": "÷" }[m[2]] || m[2], B = m[3];
    var av = parseInt(A.replace(/\?/g, "0"), 10), bv = parseInt(B.replace(/\?/g, "0"), 10);
    var ans = OP === "+" ? av + bv : OP === "-" ? av - bv : OP === "×" ? av * bv : (bv ? Math.floor(av / bv) : 0);
    var R0 = showAns ? String(ans) : "";
    /* 除法在台灣課本是「長除法」：除數在左、被除數在括號裡、商寫在上面，
       跟加減乘的直式長得完全不一樣，所以分開畫 */
    if (OP === "÷") {
      var q0 = bv ? Math.floor(av / bv) : 0, rem = bv ? av - q0 * bv : 0;
      var QS = showAns ? String(q0) : "";
      var dw = 24, left = 20 + String(B).length * dw, top = (lab ? 26 : 12);
      var inner = String(A).length * dw;
      var Wd = left + inner + 26, Hd = top + (rem && showAns ? 112 : 74);
      var sd = lab ? T(Wd / 2, 13, lab, { z: 13 }) : "";
      var baseY = top + 34;
      /* 除數 */
      for (var i2 = 0; i2 < String(B).length; i2++) sd += T(left - (String(B).length - i2 - 0.5) * dw, baseY, String(B)[i2], { z: 22 });
      /* 括號：一條直線＋上面一條橫線 */
      sd += '<path d="M' + rd(left - 4) + " " + rd(baseY + 16) + "q10 -16 0 -32" + '" fill="none" stroke="currentColor" stroke-width="1.8"/>';
      sd += L(left + 2, baseY - 16, left + inner + 6, baseY - 16, { w: 1.8 });
      /* 被除數 */
      for (var i3 = 0; i3 < String(A).length; i3++) {
        var ch3 = String(A)[i3], x3 = left + (i3 + 0.5) * dw + 4;
        if (ch3 === "?") sd += R(x3 - 10, baseY - 13, 20, 26, { r: 3, w: 1.4, d: "4 3" });
        else sd += T(x3, baseY, ch3, { z: 22 });
      }
      /* 商 */
      if (showAns) {
        for (var i4 = 0; i4 < QS.length; i4++) sd += T(left + inner + 4 - (QS.length - i4 - 0.5) * dw, baseY - 32, QS[i4], { z: 22 });
      } else {
        var bq = Math.max(1, Math.min(6, +blanks || String(q0).length));
        for (var q4 = 0; q4 < bq; q4++) sd += R(left + inner + 4 - (q4 + 0.5) * dw - 10, baseY - 45, 20, 26, { r: 3, w: 1.4, d: "4 3" });
      }
      /* 有餘數就把「減一行、留餘數」也畫出來 */
      if (rem && showAns) {
        var sub = String(q0 * bv), yS = baseY + 30;
        for (var i5 = 0; i5 < sub.length; i5++) sd += T(left + inner + 4 - (sub.length - i5 - 0.5) * dw, yS, sub[i5], { z: 20 });
        sd += L(left + inner + 4 - sub.length * dw - 4, yS + 16, left + inner + 6, yS + 16, { w: 1.6 });
        var rs = String(rem);
        for (var i6 = 0; i6 < rs.length; i6++) sd += T(left + inner + 4 - (rs.length - i6 - 0.5) * dw, yS + 36, rs[i6], { z: 20 });
      }
      return svg(Wd, Hd, sd, .95);
    }
    var digits = Math.max(A.length, B.length, R0.length) + 1;
    var cw = 26, rowH = 30, x0 = 24, y0 = (lab ? 26 : 10);
    var W = x0 + digits * cw + 22, H = y0 + rowH * 3 + 16;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    var right = x0 + digits * cw;
    function row(txt, yy, isAns) {
      for (var i = 0; i < txt.length; i++) {
        var ch = txt[txt.length - 1 - i], x = right - (i + 0.5) * cw;
        if (ch === "?") s += R(x - 10, yy - 13, 20, 26, { r: 3, w: 1.4, d: "4 3" });
        else s += T(x, yy, ch, { z: 22 });
      }
    }
    row(A, y0 + rowH * 0.5);
    s += T(right - (B.length + 0.5) * cw - 6, y0 + rowH * 1.5, OP, { z: 22, a: "end" });
    row(B, y0 + rowH * 1.5);
    s += L(x0 - 4, y0 + rowH * 2 - 2, right + 4, y0 + rowH * 2 - 2, { w: 2 });
    if (showAns) row(R0, y0 + rowH * 2.5);
    else {
      var bn = Math.max(1, Math.min(digits, +blanks || String(ans).length));
      for (var q = 0; q < bn; q++) s += R(right - (q + 0.5) * cw - 10, y0 + rowH * 2.5 - 13, 20, 26, { r: 3, w: 1.4, d: "4 3" });
    }
    return svg(W, H, s, .95);
  };

  /* ---------- 15. 三角板 ---------- */
  F.libSetSquare = function (kind, degs, lab) {
    var k = kind === "3060" ? "3060" : "4545";
    var W = 238, H = (lab ? 26 : 8) + 176, y0 = (lab ? 26 : 8) + 14;
    var s = lab ? T(W / 2, 13, lab, { z: 13 }) : "";
    var P, A;
    if (k === "4545") {
      /* 直角在左下，兩個 45 度在另外兩個頂點 */
      P = [[26, y0 + 140], [186, y0 + 140], [26, y0 + 2]];
      A = [["90°", 0], ["45°", 1], ["45°", 2]];
    } else {
      P = [[26, y0 + 140], [196, y0 + 140], [26, y0 + 36]];
      A = [["90°", 0], ["30°", 1], ["60°", 2]];
    }
    s += '<polygon points="' + P.map(function (p) { return p[0] + "," + p[1]; }).join(" ") + '" fill="' + TN.w + '" stroke="currentColor" stroke-width="1.8"/>';
    /* 中間挖空，看起來才像真的三角板 */
    var cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
    var IN = P.map(function (p) { return [p[0] + (cx - p[0]) * .34, p[1] + (cy - p[1]) * .34]; });
    s += '<polygon points="' + IN.map(function (p) { return rd(p[0]) + "," + rd(p[1]); }).join(" ") + '" fill="var(--paper,#fff)" stroke="currentColor" stroke-width="1.4"/>';
    /* 直角符號 */
    s += '<path d="M' + (P[0][0] + 14) + " " + P[0][1] + "V" + (P[0][1] - 14) + "H" + P[0][0] + '" fill="none" stroke="currentColor" stroke-width="1.2"/>';
    if (degs) A.forEach(function (pr) {
      var p = P[pr[1]], vx = cx - p[0], vy = cy - p[1], Ln = Math.sqrt(vx * vx + vy * vy) || 1;
      s += T(p[0] + vx / Ln * 40, p[1] + vy / Ln * 40, pr[0], { z: 13 });
    });
    return svg(W, H, s, .95);
  };

  /* ---------- 登記到圖庫 ---------- */
  function N(k, n, v, min, max, step) { return { t: "num", k: k, n: n, v: v, min: min == null ? 0 : min, max: max == null ? 999 : max, step: step || 1 }; }
  function TT(k, n, v) { return { t: "txt", k: k, n: n, v: v }; }
  function TS(k, n, v) { return { t: "txts", k: k, n: n, v: v }; }
  function NS(k, n, v) { return { t: "nums", k: k, n: n, v: v }; }
  function BB(k, n, v) { return { t: "bool", k: k, n: n, v: v == null ? 1 : v }; }
  function SE(k, n, v, o) { return { t: "sel", k: k, n: n, v: v, o: o }; }
  function PT(k, n, v) { return { t: "txt", k: k, n: n, v: v }; }

  var G1 = "數與計算", G2 = "量與測量", G3 = "解題輔助", G4 = "統計圖表";
  S.SPECS = [
    { f: "libPlace", g: G1, n: "定位板（數位板）", a: [TS("cols", "每一欄的名稱", "百,十,個"), TS("digits", "每一欄填什麼", "2,4,6"),
      SE("mode", "欄位裡畫什麼", "num", [["num", "數字"], ["block", "積木"], ["dot", "圓點"]]), TT("lab", "標示", "")] },
    { f: "libSeq", g: G1, n: "數字列（含空格）", a: [TS("vals", "每一格（? 代表空格）", "2,4,?,8,10"), BB("boxes", "畫出格子", 1), TT("lab", "標示", "")] },
    { f: "libMatch", g: G3, n: "連連看", a: [TS("left", "左邊各項", "3+4,5+2,6+1"), TS("right", "右邊各項", "7,7,7"),
      TS("links", "要連起來的（左-右）", ""), TT("lab", "標示", "")] },
    { f: "libStrip", g: G1, n: "紙帶／彩帶（分段）", a: [N("n", "分成幾段", 4, 1, 24), N("fill", "塗滿前幾段", 1, 0, 24),
      TS("labs", "每段寫的字", ""), TT("total", "全長標示", ""), TT("lab", "標示", "")] },
    { f: "libBeads", g: G1, n: "串珠（幾顆一組）", a: [N("n", "幾顆", 12, 1, 40), N("group", "幾顆一組", 5, 1, 10), TT("lab", "標示", "")] },
    { f: "libCalendar", g: G2, n: "月曆", a: [N("days", "這個月幾天", 30, 28, 31), N("start", "1 號是星期幾（0=日）", 3, 0, 6),
      NS("marks", "要圈起來的日期", ""), TT("lab", "標示", "")] },
    { f: "libTally", g: G4, n: "分類畫記表（正字）", a: [TS("items", "項目", "紅,藍,黃"), NS("counts", "各項數量", "7,4,12"),
      BB("showNum", "加上數量欄", 1), TT("lab", "標示", "")] },
    { f: "libCompare", g: G2, n: "比長短（長度比較）", a: [NS("vals", "各條長度", "3,5,2"), TS("labs", "各條名稱", ""),
      TT("unit", "單位", " 公分"), BB("grid", "加上格線", 0), TT("lab", "標示", "")] },
    { f: "libPrice", g: G3, n: "價格牌", a: [TS("items", "品項", "鉛筆,筆記本,橡皮擦"), TS("prices", "價錢", "8,25,5"), TT("lab", "標示", "")] },
    { f: "libRoute", g: G3, n: "路線圖（站點與距離）", a: [TS("stops", "站點", "學校,公園,家"), TS("dists", "各段距離", "350,480"),
      TT("unit", "單位", " 公尺"), TT("lab", "標示", "")] },
    { f: "libCards", g: G3, n: "撲克牌", a: [TS("faces", "每張牌的數字", "A,5,10"), TS("suits", "花色（s/h/d/c）", "h,s,d"),
      BB("back", "只畫牌背", 0), TT("lab", "標示", "")] },
    { f: "libGridArea", g: "平面圖形", n: "平方公分格上的圖形", a: [N("cols", "幾欄", 8, 1, 20), N("rows2", "幾列", 6, 1, 20),
      PT("cells", "塗色格子 欄,列", "2,2 3,2 4,2 3,3 3,4"), PT("poly", "外框頂點 欄,列", ""),
      BB("dots", "改成點格紙", 0), TT("unit", "角落標示", "1 平方公分"), PT("half", "半格 欄,列,方向1-4", ""), TT("lab", "標示", "")] },
    { f: "libNumFill", g: G1, n: "數線填空", a: [N("a", "起", 0, -9999, 9999), N("b", "迄", 10, -9999, 9999),
      N("step", "刻度間隔", 1, .01, 1000, .01), NS("blanks", "第幾個刻度留空", "4"), BB("ticksOnly", "只標大刻度", 0), TT("lab", "標示", "")] },
    { f: "libVert", g: G1, n: "直式（可留空格）", a: [TT("expr", "算式（? 代表空格）", "128+95"), N("blanks", "答案留幾格", 3, 1, 8),
      BB("showAns", "直接寫出答案", 0), TT("lab", "標示", "")] },
    { f: "libSetSquare", g: G2, n: "三角板", a: [SE("kind", "哪一種", "4545", [["4545", "45°-45°-90°"], ["3060", "30°-60°-90°"]]),
      BB("degs", "標出角度", 1), TT("lab", "標示", "")] }
  ];

  function install() {
    if (!window.DR) window.DR = {};
    if (!DR.fig) DR.fig = {};
    Object.keys(F).forEach(function (k) { DR.fig[k] = F[k]; });
    if (NB.drawLib && NB.drawLib.SPECS) S.SPECS.forEach(function (x) { NB.drawLib.SPECS.push(x); });
  }
  install();
})();
