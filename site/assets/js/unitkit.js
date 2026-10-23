/* 單元互動元件庫：把常見的互動圖解（點數、數線、位值板、陣列、直式、分數、時鐘…）做成共用元件。
   單元檔只要寫：NB.unit(NB.kit.dots({ q:…, steps:[…], ch:{…}, S:[滑桿…], eq:function(v){…} }))
   所有元件都是純 SVG／HTML，沒有 emoji，顏色跟著主題變。 */
(function () {
  "use strict";
  var NB = window.NB, K = NB.kit = {}, s = NB.s, mk = NB.mk, t = NB.t;
  var C1 = "var(--p1)", C2 = "var(--p2)", C3 = "var(--p3)", C4 = "var(--p4)", INK = "var(--ink)", SOFT = "var(--soft)";
  K.C = { c1: C1, c2: C2, c3: C3, c4: C4 };
  function el(html) { return NB.h(html); }
  function stage(b, w, h) { var st = el('<div class="stage"></div>'); b.appendChild(st); var sv = NB.svg(st, w || 560, h || 220); K._last = sv; K._hint = el('<p class="meta" style="margin:4px 0 8px;text-align:center;font-size:.82rem">也可以直接在圖上按住、拖曳來改變</p>'); b.appendChild(K._hint); return sv; }
  function html(b) { K._last = null; K._hint = null; var st = el('<div class="stage" style="padding:12px"></div>'); b.appendChild(st); return st; }
  /* 滑桿：list 內每個 {k,label,min,max,step,val,unit,maxOf}，maxOf(v) 可依其他滑桿動態調整上限 */
  function sliders(b, list, draw, opt) {
    var o = {}, upd = false;
    function vals() { var r = {}; list.forEach(function (d) { r[d.k] = o[d.k].v; }); return r; }
    function fit() { var v = vals(); list.forEach(function (d) { if (d.minOf) { var mn = d.minOf(v); o[d.k].el.min = mn; if (+o[d.k].el.value < mn) { o[d.k].v = mn; } v = vals(); } if (d.maxOf) { var m = d.maxOf(v); o[d.k].el.max = m; if (+o[d.k].el.value > m) { o[d.k].v = m; } v = vals(); } }); }
    list.forEach(function (d) { if (d.min === d.max) { o[d.k] = { el: {}, v: d.val }; return; } o[d.k] = NB.slider(b, d.label, d.min, d.max, d.step || 1, d.val, d.unit || "", function () { fit(); draw(); }); });
    o.vals = vals; fit();
    var svg = K._last, hint = K._hint; K._last = null; K._hint = null;
    var prim = list.filter(function (d) { return d.min !== d.max; })[0];
    if (svg && prim && !(opt && opt.nodrag)) {
      svg.style.touchAction = "none"; svg.style.cursor = "pointer";
      var set = function (k, val) { var e = o[k].el, mn = +e.min, mx = +e.max, st = +e.step || 1; val = Math.round((val - mn) / st) * st + mn; val = Math.max(mn, Math.min(mx, val)); if (val !== o[k].v) { o[k].v = val; fit(); draw(); } };
      var down = false;
      var go = function (ev) { var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = (ev.clientX - r.left) / r.width * vb.width, y = (ev.clientY - r.top) / r.height * vb.height;
        if (opt && opt.drag) opt.drag(x, y, set, vals(), vb); else { var e0 = o[prim.k].el; set(prim.k, +e0.min + Math.max(0, Math.min(1, (x - 20) / (vb.width - 40))) * (+e0.max - +e0.min)); } };
      svg.addEventListener("pointerdown", function (e) { down = true; try { svg.setPointerCapture(e.pointerId); } catch (x) {} go(e); e.preventDefault(); });
      svg.addEventListener("pointermove", function (e) { if (down) go(e); });
      var up = function () { down = false; }; svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
    } else if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
    return o;
  }
  K.sliders = sliders; K.stage = stage; K.html = html;
  function unit(c, tool) { return { title: c.title, ref: c.ref, q: c.q, steps: c.steps, ch: c.ch, tool: tool }; }
  K.unit = unit;
  function zh4(n) {
    var D = "零一二三四五六七八九", U = ["", "十", "百", "千"], str = ("000" + n).slice(-4), out = "", zero = false, started = false;
    for (var i = 0; i < 4; i++) { var d = +str[i], u = U[3 - i];
      if (d === 0) { if (started) zero = true; continue; }
      if (zero) { out += "零"; zero = false; }
      out += (d === 1 && u === "十" && !started ? "" : D[d]) + u; started = true; }
    return out;
  }
  /* 整數讀法：2305 → 二千三百零五；10 → 十；100000000 以內 */
  function zh(n) {
    n = Math.floor(n); if (n === 0) return "零";
    var yi = Math.floor(n / 1e8), wan = Math.floor(n % 1e8 / 1e4), ge = n % 1e4, out = "";
    if (yi) out += zh4(yi) + "億";
    if (wan) out += (yi && wan < 1000 ? "零" : "") + zh4(wan) + "萬";
    if (ge) out += (((yi || wan) && ge < 1000) ? "零" : "") + zh4(ge);
    return out;
  }
  K.zh = zh;
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  K.fmt = fmt;
  function dec(n, d) { return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
  K.dec = dec;

  /* ---------- 點數：dots ----------
     mode: one（數 a 個）、two（a 個 + b 個）、take（a 個拿走 b 個）、cmp（兩排一一對應比多少）、part（總數 a 分成 b 和 a-b）
     cols：每排幾個；ten：true 時畫十格框 */
  K.dots = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 210), sl = sliders(b, c.S, draw), mode = c.mode || "one", cols = c.cols || 5, r = c.r || 13, ico = c.ico || "circle";
      function shape(x, y, col, ghost, cross) {
        var f = ghost ? "none" : col, o = { fill: f, stroke: ghost ? SOFT : INK };
        if (ico === "square") mk("rect", { x: x - r + 1, y: y - r + 1, width: 2 * r - 2, height: 2 * r - 2, rx: 3, fill: f, stroke: o.stroke }, v, 1.6);
        else if (ico === "tri") mk("polygon", { points: x + "," + (y - r) + " " + (x - r) + "," + (y + r - 2) + " " + (x + r) + "," + (y + r - 2), fill: f, stroke: o.stroke }, v, 1.6);
        else mk("circle", { cx: x, cy: y, r: r - 1, fill: f, stroke: o.stroke, "stroke-dasharray": ghost ? "3 3" : "" }, v, 1.6);
        if (cross) { mk("path", { d: "M" + (x - r + 2) + " " + (y - r + 2) + "L" + (x + r - 2) + " " + (y + r - 2) + "M" + (x + r - 2) + " " + (y - r + 2) + "L" + (x - r + 2) + " " + (y + r - 2), fill: "none", stroke: C1 }, v, 2.4); }
      }
      function draw() {
        var q = sl.vals(), a = q.a, bb = q.b || 0, dx = 2 * r + 6, dy = 2 * r + 8, i, x0, y0; v.innerHTML = "";
        if (mode === "cmp") {
          var m = Math.max(a, bb, 1), cc = Math.min(m, c.cols || 10), w = cc * dx; x0 = 280 - w / 2 + dx / 2; y0 = 50;
          t(v, 20, 56, c.na || "甲", { a: "start", z: 15, b: 1, c: C1 }); t(v, 20, 56 + 70, c.nb || "乙", { a: "start", z: 15, b: 1, c: C2 });
          for (i = 0; i < a; i++) shape(x0 + (i % cc) * dx + 20, y0 + Math.floor(i / cc) * (2 * dy + 24), C1, false);
          for (i = 0; i < bb; i++) shape(x0 + (i % cc) * dx + 20, y0 + 70 + Math.floor(i / cc) * (2 * dy + 24), C2, false);
          for (i = 0; i < Math.min(a, bb) && m <= cc; i++) mk("path", { d: "M" + (x0 + i * dx + 20) + " " + (y0 + r) + "V" + (y0 + 70 - r), fill: "none", stroke: SOFT, "stroke-dasharray": "2 3" }, v, 1);
          return eq.innerHTML = c.eq(q);
        }
        var n = mode === "two" ? a + bb : a, gap = mode === "two" || mode === "part" ? 10 : 0, rows = Math.ceil(n / cols), w2 = cols * dx + gap;
        if (c.ten) { /* 十格框：每 10 個一框（5 × 2） */
          var fr = Math.ceil(Math.max(n, 1) / 10), per = Math.min(fr, 4), fw = 5 * dx + 16;
          for (var f = 0; f < fr; f++) {
            var fx = 280 - (per * fw) / 2 + (f % per) * fw + 8, fy = 20 + Math.floor(f / per) * (2 * dy + 18);
            mk("rect", { x: fx, y: fy, width: 5 * dx, height: 2 * dy - 4, fill: "none", stroke: SOFT, rx: 4 }, v, 1.4);
            for (i = 0; i < 10; i++) { var k = f * 10 + i, cx = fx + dx / 2 + (i % 5) * dx, cy = fy + dy / 2 + Math.floor(i / 5) * dy; if (k < n) shape(cx, cy, mode === "two" && k >= a ? C2 : mode === "part" && k >= bb ? C2 : C1, false, mode === "take" && k >= a - bb); else shape(cx, cy, "none", true); }
          }
          return eq.innerHTML = c.eq(q);
        }
        x0 = 280 - w2 / 2 + dx / 2; y0 = 30 + (c.top || 0);
        for (i = 0; i < n; i++) {
          var col = i % cols, row = Math.floor(i / cols), x = x0 + col * dx + (mode === "two" && i >= a && Math.floor(a / cols) === row ? gap : 0), y = y0 + row * dy;
          var colr = C1, cross = false;
          if (mode === "two" && i >= a) colr = C2; if (mode === "part" && i >= bb) colr = C2; if (mode === "take" && i >= a - bb) cross = true;
          shape(x, y, colr, false, cross);
        }
        if (c.say) t(v, 280, 20, c.say(q), { z: 15, c: SOFT });
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };

  /* ---------- 數線：line ----------
     min,max：範圍；tick：每格代表多少（預設 1）；lab：每幾格標數字；S：滑桿 a（位置）、b（跳幾格）；op："+"、"-"、""（只標一點）
     div：顯示用的除數（小數數線 div:10 → 0.1 一格）；round：小數位數 */
  K.line = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 170), sl = sliders(b, c.S, draw, { drag: function (x, y, set) { set("a", mn + (x - 36) / 488 * (mx - mn)); } }), mn = c.min, mx = c.max, tk = c.tick || 1, dv = c.div || 1, lab = c.lab || 1, d = c.round || 0, X0 = 36, X1 = 524;
      function px(x) { return X0 + (x - mn) / (mx - mn) * (X1 - X0); }
      function label(x) { return d ? dec(x / dv, d) : String(x / dv); }
      function draw() {
        var q = sl.vals(), a = q.a, bb = q.b || 0, i, y = 100, end = c.op === "+" ? a + bb : c.op === "-" ? a - bb : a; v.innerHTML = "";
        mk("path", { d: "M" + (X0 - 14) + " " + y + "H" + (X1 + 14), fill: "none" }, v, 2);
        mk("path", { d: "M" + (X1 + 6) + " " + (y - 5) + "L" + (X1 + 14) + " " + y + "L" + (X1 + 6) + " " + (y + 5), fill: "none" }, v, 2);
        var n = Math.round((mx - mn) / tk);
        for (i = 0; i <= n; i++) { var x = mn + i * tk, big = i % lab === 0; mk("path", { d: "M" + px(x) + " " + (y - (big ? 8 : 5)) + "V" + (y + (big ? 8 : 5)), fill: "none" }, v, big ? 1.8 : 1.1); if (big) t(v, px(x), y + 26, label(x), { z: n > 20 && lab < 5 ? 11 : 13, c: SOFT }); }
        if (c.op && bb) {
          var xa = px(a), xe = px(end), up = c.op === "+" ? -1 : -1, mid = (xa + xe) / 2, hh = 44;
          mk("path", { d: "M" + xa + " " + (y - 10) + "Q" + mid + " " + (y - 10 - hh) + " " + xe + " " + (y - 10), fill: "none", stroke: c.op === "+" ? C2 : C1 }, v, 2.4);
          mk("polygon", { points: xe + "," + (y - 8) + " " + (xe - 5 * (end > a ? 1 : -1) - 1) + "," + (y - 20) + " " + (xe + 5 * (end > a ? -1 : 1) + 5 * (end > a ? 0 : 0)) + "," + (y - 20), fill: c.op === "+" ? C2 : C1 }, v, 1);
          t(v, mid, y - 14 - hh * .5 - 8, (c.op === "+" ? "＋" : "－") + label(bb), { z: 16, b: 1, c: c.op === "+" ? C2 : C1 });
        }
        mk("circle", { cx: px(a), cy: y, r: 7, fill: C4 }, v, 2); t(v, px(a), y - 22, label(a), { z: 15, b: 1 });
        if (c.op && bb) { mk("circle", { cx: px(end), cy: y, r: 7, fill: c.op === "+" ? C2 : C1 }, v, 2); }
        if (c.marks) c.marks(v, px, q, y);
        eq.innerHTML = c.eq(q, end);
      }
      draw();
    });
  };

  /* ---------- 位值板：place ----------
     max：最大數；dec：小數位數（0 為整數；n 的單位是 10^-dec）；names：位名；S：滑桿 n；chips：true 時用方塊表示個數 */
  var PN = ["個", "十", "百", "千", "萬", "十萬", "百萬", "千萬", "億"];
  K.place = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 250), sl = sliders(b, c.S, draw), dd = c.dec || 0, np = c.places || (String(c.max).length), money = c.money;
      function names(i) { return i >= dd ? PN[i - dd] : ["十分位", "百分位", "千分位", "萬分位"][dd - i - 1]; }
      function draw() {
        var n = sl.vals().n, i, str = String(n); while (str.length < np) str = "0" + str; v.innerHTML = "";
        var cw = Math.min(88, 520 / np), x0 = 280 - cw * np / 2;
        for (i = 0; i < np; i++) {
          var pi = np - 1 - i, dig = +str[i], x = x0 + i * cw + cw / 2, pv = Math.pow(10, pi - dd), hi = pi === dd && dd > 0;
          if (hi) mk("path", { d: "M" + (x0 + i * cw) + " 14V232", fill: "none", stroke: C1, "stroke-dasharray": "3 4" }, v, 1.4);
          mk("rect", { x: x - cw / 2 + 3, y: 12, width: cw - 6, height: 28, rx: 6, fill: pi >= dd ? C2 : C4, "fill-opacity": .25 }, v, 1.4);
          t(v, x, 31, names(pi), { z: cw < 50 ? 11 : 14, b: 1 });
          for (var k = 0; k < Math.min(dig, 9); k++) { var cx = x - (cw - 14) / 2 + (k % 3) * ((cw - 14) / 2) , cy = 66 + Math.floor(k / 3) * 22; mk("rect", { x: cx - cw * .17, y: cy - 8, width: cw * .34, height: 16, rx: 3, fill: C4, "fill-opacity": .55 + .05 * (pi % 3) }, v, 1.2); }
          t(v, x, 168, String(dig), { z: 30, b: 1, c: dig ? INK : SOFT });
          if (cw >= 56) t(v, x, 198, dig ? (dec(dig * pv, Math.max(0, dd - pi)).replace(/\.0+$/, "") ) : "", { z: 12, c: SOFT });
          if (dd > 0 && i === np - dd - 1 ) { t(v, x0 + (i + 1) * cw, 168, "．", { z: 30, b: 1, c: C1 }); }
        }
        t(v, 280, 232, c.say ? c.say(n) : "", { z: 14, c: SOFT });
        eq.innerHTML = c.eq(n);
      }
      draw();
    });
  };

  /* ---------- 比大小：cmpnum ---------- */
  K.cmpnum = function (c) {
    return unit(c, function (b, eq) {
      var st = html(b), sl = sliders(b, c.S, draw), dd = c.dec || 0;
      function pad(n, L) { var s2 = String(n); while (s2.length < L) s2 = "0" + s2; return s2; }
      function draw() {
        var q = sl.vals(), A = q.a, B = q.b, L = Math.max(String(A).length, String(B).length, dd + 1), sa = pad(A, L), sb = pad(B, L), first = -1, i;
        for (i = 0; i < L; i++) if (sa[i] !== sb[i]) { first = i; break; }
        var sym = A > B ? "＞" : A < B ? "＜" : "＝", h = '<table style="margin:auto;border-collapse:collapse;text-align:center;font-size:1.25rem"><tr><td></td>';
        for (i = 0; i < L; i++) { var pi = L - 1 - i; h += '<th style="padding:4px 10px;font-weight:700;color:var(--soft);font-size:.85rem;border-bottom:1.5px solid var(--ink)">' + (pi >= dd ? PN[pi - dd] : ["十分位", "百分位", "千分位"][dd - pi - 1]) + "</th>"; if (dd && pi === dd) { } }
        h += "</tr>";
        [[A, sa, "甲"], [B, sb, "乙"]].forEach(function (r) { h += "<tr><td style='padding:6px 10px;font-weight:700;color:var(--soft)'>" + r[2] + "</td>"; for (var j = 0; j < L; j++) { var hl = j === first; h += '<td style="padding:6px 10px;font-weight:700;' + (hl ? "background:color-mix(in srgb,var(--p4) 45%,transparent);border-radius:6px;" : (first >= 0 && j < first ? "color:var(--soft);" : "")) + '">' + r[1][j] + "</td>"; } h += "</tr>"; });
        h += '</table><p style="text-align:center;margin:10px 0 0;font-size:1.5rem;font-weight:700;color:var(--p1)">' + (dd ? dec(A / Math.pow(10, dd), dd) : A) + " " + sym + " " + (dd ? dec(B / Math.pow(10, dd), dd) : B) + "</p>";
        st.innerHTML = h; eq.innerHTML = c.eq(q, first >= 0 ? (L - 1 - first >= dd ? PN[L - 1 - first - dd] : ["十分位", "百分位", "千分位"][dd - (L - 1 - first) - 1]) : "", sym);
      }
      draw();
    });
  };

  /* ---------- 陣列：array ----------
     mode: mul（a 排、每排 b 個）、div（a 個平分，每 b 個一組，看餘數）、oddeven（a 個兩兩配對） */
  K.array = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 230), sl = sliders(b, c.S, draw), mode = c.mode || "mul";
      function dot(x, y, col, r0) { mk("circle", { cx: x, cy: y, r: r0 || 11, fill: col }, v, 1.5); }
      function draw() {
        var q = sl.vals(); if (c.pre) q = c.pre(q); var a = q.a, bb = q.b, i, j; v.innerHTML = "";
        if (mode === "mul") {
          var d = Math.min(30, 480 / Math.max(bb, 1), 190 / Math.max(a, 1)), r0 = Math.max(4, d / 2 - 3), x0 = 280 - bb * d / 2 + d / 2, y0 = 105 - a * d / 2 + d / 2;
          for (i = 0; i < a; i++) for (j = 0; j < bb; j++) dot(x0 + j * d, y0 + i * d, i % 2 ? C2 : C1, r0);
          if (c.brace !== false) { t(v, 280, 22, bb + " 個", { z: 14, c: SOFT }); t(v, 22, 110, a + " 排", { z: 14, c: SOFT, a: "start" }); }
        } else if (mode === "div") {
          var g = Math.floor(a / bb), rem = a % bb, per = Math.min(g + (rem ? 1 : 0), 6), cwid = Math.min(150, 520 / Math.max(per, 1)), idx = 0;
          for (i = 0; i < g + (rem ? 1 : 0); i++) { var gx = 280 - per * cwid / 2 + (i % per) * cwid + 6, gy = 14 + Math.floor(i / per) * 100, full = i < g, cnt = full ? bb : rem, w = Math.min(cwid - 12, bb * 20 + 10);
            mk("rect", { x: gx, y: gy, width: w, height: 80, rx: 10, fill: "none", stroke: full ? C2 : C1, "stroke-dasharray": full ? "" : "5 4" }, v, 1.8);
            for (j = 0; j < cnt; j++) dot(gx + 14 + (j % Math.max(1, Math.floor((w - 8) / 20))) * 20, gy + 18 + Math.floor(j / Math.max(1, Math.floor((w - 8) / 20))) * 22, full ? C2 : C1, 8); }
        } else {
          var half = Math.floor(a / 2), x1 = 280 - Math.ceil(a / 2) * 44 / 2 + 22;
          for (i = 0; i < half; i++) { var px = x1 + i * 44; mk("rect", { x: px - 20, y: 60, width: 40, height: 80, rx: 14, fill: "none", stroke: C2 }, v, 1.6); dot(px, 85, C2, 11); dot(px, 115, C2, 11); }
          if (a % 2) { var pl = x1 + half * 44; dot(pl, 100, C1, 11); t(v, pl, 165, "落單", { z: 13, c: C1, b: 1 }); }
        }
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };
})();
(function () {
  "use strict";
  var NB = window.NB, K = NB.kit, s = NB.s, mk = NB.mk, t = NB.t, sliders = K.sliders, stage = K.stage, html = K.html, unit = K.unit, dec = K.dec;
  var C1 = "var(--p1)", C2 = "var(--p2)", C3 = "var(--p3)", C4 = "var(--p4)", INK = "var(--ink)", SOFT = "var(--soft)";
  function digs(n, L) { var x = String(n); while (x.length < L) x = " " + x; return x.split(""); }
  var TD = 'style="width:1.5em;height:1.7em;text-align:center;font-size:1.35rem;font-weight:700;font-family:var(--serif,serif)"', SM = 'style="text-align:center;font-size:.8rem;color:var(--p1);font-weight:700;height:1.2em"';
  /* ---------- 直式計算：vcalc（op: + − × ÷） ---------- */
  K.vcalc = function (c) {
    return unit(c, function (b, eq) {
      var st = html(b), sl = sliders(b, c.S, draw), op = c.op;
      function grid(rows, L, ex) {
        var h = '<table style="margin:auto;border-collapse:collapse">';
        rows.forEach(function (r) { h += "<tr>" + (r.sign !== undefined ? '<td ' + TD + ">" + r.sign + "</td>" : '<td ' + TD + "></td>") + r.cells.map(function (x, i) { return "<td " + (r.small ? SM : TD) + (r.line && x !== "" ? ' class="vl"' : "") + ">" + (x === " " ? "" : x) + "</td>"; }).join("") + "</tr>"; });
        return h + "</table>";
      }
      function addSteps(A, B, L) { var a = digs(A, L).map(function (x) { return x === " " ? 0 : +x; }), bb = digs(B, L).map(function (x) { return x === " " ? 0 : +x; }), carry = [], res = [], cr = 0, i, notes = []; for (i = L - 1; i >= 0; i--) { var sm = a[i] + bb[i] + cr; res[i] = sm % 10; var ncr = sm >= 10 ? 1 : 0; if (i > 0) carry[i - 1] = ncr ? "1" : ""; if (ncr && (A > 0 || B > 0)) notes.push("個十百千萬億".charAt(L - 1 - i) === "個" ? "個位" : "第 " + (L - i) + " 位"); cr = ncr; } return { carry: carry, res: res, notes: notes }; }
      function draw() {
        var q = sl.vals(); if (c.pre) q = c.pre(q); var A = q.a, B = q.b, L, h = "", info = "";
        if (op === "+") { L = String(A + B).length; var r = addSteps(A, B, L); var cs = []; for (var i = 0; i < L; i++) cs.push(r.carry[i] || ""); var lastNo = L > String(Math.max(A, B)).length;
          h = grid([{ cells: cs, small: 1, sign: "" }, { cells: digs(A, L), sign: "" }, { cells: digs(B, L), sign: "＋" }, { cells: digs(A, L).map(function () { return "─"; }), sign: "" }, { cells: r.res.map(function (x, i) { return (i === 0 && lastNo === false && x === 0 && L > 1 && String(A + B).length < L) ? "" : x; }), sign: "" }], L);
          info = { carry: cs.filter(Boolean).length }; }
        else if (op === "-") { if (B > A) { var tmp = A; A = B; B = tmp; } L = String(A).length; var a = digs(A, L).map(function (x) { return x === " " ? 0 : +x; }), bb = digs(B, L).map(function (x) { return x === " " ? 0 : +x; }), top = [], borrow = 0, res = [], nb = 0, i2; for (i2 = 0; i2 < L; i2++) top.push("");
          for (i2 = L - 1; i2 >= 0; i2--) { var x = a[i2] - borrow, need = x < bb[i2]; if (need) { x += 10; top[i2] = "+10"; if (i2 > 0) top[i2 - 1] = (top[i2 - 1] || "") ; nb++; } res[i2] = x - bb[i2]; var nbor = need ? 1 : 0; if (i2 > 0 && nbor) { top[i2 - 1] = "－1"; } borrow = nbor; }
          /* 若左邊一位也要借，兩個標記會重疊：把「－1」與「＋10」合併顯示 */
          h = grid([{ cells: top, small: 1, sign: "" }, { cells: digs(A, L), sign: "" }, { cells: digs(B, L), sign: "－" }, { cells: digs(A, L).map(function () { return "─"; }), sign: "" }, { cells: res.map(function (x, i3) { return (i3 < L - String(A - B).length) ? "" : x; }), sign: "" }], L);
          info = { borrow: nb, a: A, b: B }; q = { a: A, b: B }; }
        else if (op === "×") { var pa = String(B).split("").reverse(), parts = [], LL = String(A * B).length; pa.forEach(function (d, i4) { parts.push({ v: A * +d * Math.pow(10, i4), d: +d, i: i4 }); });
          var rows = [{ cells: digs(A, LL), sign: "" }, { cells: digs(B, LL), sign: "×" }, { cells: digs(A, LL).map(function () { return "─"; }), sign: "" }];
          if (pa.length > 1) { parts.forEach(function (p2, i5) { rows.push({ cells: digs(p2.v, LL), sign: i5 === parts.length - 1 ? "＋" : "" }); }); rows.push({ cells: digs(A, LL).map(function () { return "─"; }), sign: "" }); }
          rows.push({ cells: digs(A * B, LL), sign: "" }); h = grid(rows, LL); info = { parts: parts }; }
        else { /* ÷ */ if (B < 1) B = 1; var Q = Math.floor(A / B), R = A % B, ds = String(A).split(""), rem = 0, lines = [], started = false, qs = "", cur = 0;
          for (var k = 0; k < ds.length; k++) { cur = cur * 10 + +ds[k]; var qd = Math.floor(cur / B); if (qd > 0 || started) { started = true; lines.push("取 <b>" + cur + "</b> ÷ " + B + "：商 <b>" + qd + "</b>，" + qd + "×" + B + "＝" + qd * B + "，餘 <b>" + (cur - qd * B) + "</b>"); qs += qd; } else if (k < ds.length - 1) { lines.push("<span style='color:var(--soft)'>" + cur + " 不夠除，往下看一位</span>"); } cur = cur - qd * B; }
          h = '<div style="text-align:center;font-size:1.4rem;font-weight:700;margin-bottom:8px">' + A + " ÷ " + B + " ＝ <span style='color:var(--p1)'>" + Q + (R ? " …… " + R : "") + '</span></div><ol style="margin:0 auto;max-width:30em;line-height:1.9;font-size:.98rem;padding-left:1.4em">' + lines.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>"; info = { q: Q, r: R }; q = { a: A, b: B }; }
        st.innerHTML = h; eq.innerHTML = c.eq(q, info);
      }
      draw();
    });
  };

  /* ---------- 錢幣：coins ---------- */
  K.coins = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 200), list = c.coins.map(function (x) { return { k: "c" + x, label: x + " 元", min: 0, max: c.max || 9, val: (c.init && c.init[x]) || 0 }; }), sl = sliders(b, list.concat(c.extra || []), draw, { nodrag: true });
      var look = { 1: [11, "#c9a86a"], 5: [13, "#d9b36a"], 10: [15, "#b8884a"], 50: [18, "#cfd2d6"], 100: [22, "#e7c06b"], 500: [26, "#b9c2cf"], 1000: [0, "#cfe3c9"] };
      function draw() {
        var q = sl.vals(), total = 0, x = 30, y = 40, rowH = 56, i; v.innerHTML = ""; var counts = {};
        c.coins.forEach(function (cv) { var n = q["c" + cv]; counts[cv] = n; total += n * cv; });
        c.coins.slice().reverse().forEach(function (cv) {
          var n = counts[cv], r = look[cv][0] || 20; if (!n) return;
          for (i = 0; i < n; i++) { if (x > 520) { x = 30; y += rowH; }
            if (cv >= 1000) { mk("rect", { x: x - 20, y: y - 14, width: 52, height: 28, rx: 3, fill: look[cv][1] }, v, 1.6); t(v, x + 6, y + 6, "1000", { z: 12, b: 1 }); x += 62; }
            else { mk("circle", { cx: x + r * .4, cy: y, r: r, fill: look[cv][1] }, v, 1.6); t(v, x + r * .4, y + 5, String(cv), { z: r > 14 ? 13 : 11, b: 1 }); x += r * 2 + 8; } }
          x += 14;
        });
        t(v, 530, 190, "共 " + total + " 元", { z: 20, b: 1, c: C1, a: "end" });
        eq.innerHTML = c.eq(total, counts, q);
      }
      draw();
    });
  };

  /* ---------- 分數：frac ----------
     mode: unit（n/d 一條或一個圓）、cmp（兩個分數比大小）、eq（等值分數）、add（同分母加減，可超過 1）、mixed（假分數與帶分數）、mul（分數×分數面積）、div（分數÷整數） */
  function fracTxt(v, x, y, n, d, z, col) { z = z || 18; t(v, x, y - 4, String(n), { z: z, b: 1, c: col }); mk("path", { d: "M" + (x - z * .55) + " " + (y + 1) + "H" + (x + z * .55), fill: "none", stroke: col || INK }, v, 1.6); t(v, x, y + z, String(d), { z: z, b: 1, c: col }); }
  K.fracTxt = fracTxt;
  function bar(v, x, y, w, h, n, d, col, off) { var i; for (i = 0; i < d; i++) mk("rect", { x: x + i * w / d, y: y, width: w / d, height: h, fill: i >= (off || 0) && i < (off || 0) + n ? col : "none", "fill-opacity": .6 }, v, 1.5); mk("rect", { x: x, y: y, width: w, height: h, fill: "none" }, v, 2.2); }
  function pie(v, cx, cy, r, n, d, col) { var i; for (i = 0; i < d; i++) { var a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / d, big = a1 - a0 > Math.PI ? 1 : 0; var p = d === 1 ? "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0" : "M" + cx + " " + cy + "L" + (cx + r * Math.cos(a0)) + " " + (cy + r * Math.sin(a0)) + "A" + r + " " + r + " 0 " + big + " 1 " + (cx + r * Math.cos(a1)) + " " + (cy + r * Math.sin(a1)) + "Z"; mk("path", { d: p, fill: i < n ? col : "none", "fill-opacity": .6 }, v, 1.5); } mk("circle", { cx: cx, cy: cy, r: r, fill: "none" }, v, 2.2); }
  K.frac = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 220), sl = sliders(b, c.S, draw), mode = c.mode || "unit";
      function draw() {
        var q = sl.vals(), i; v.innerHTML = "";
        if (mode === "unit") {
          var n = Math.min(q.n, q.d);
          if (c.shape === "pie") { pie(v, 190, 105, 80, n, q.d, C1); fracTxt(v, 400, 100, n, q.d, 34, C1); }
          else { bar(v, 30, 60, 380, 70, n, q.d, C1); fracTxt(v, 480, 100, n, q.d, 34, C1); t(v, 220, 40, "平分成 " + q.d + " 份，取 " + n + " 份", { z: 15, c: SOFT }); }
        } else if (mode === "cmp") {
          bar(v, 30, 36, 400, 56, q.n1, q.d1, C1); bar(v, 30, 124, 400, 56, q.n2, q.d2, C2);
          fracTxt(v, 490, 70, q.n1, q.d1, 24, C1); fracTxt(v, 490, 160, q.n2, q.d2, 24, C2);
          var x1 = q.n1 / q.d1, x2 = q.n2 / q.d2; if (Math.abs(x1 - x2) < 1e-9) mk("path", { d: "M" + (30 + 400 * x1) + " 30V190", fill: "none", stroke: C4 }, v, 2.4);
        } else if (mode === "eq") {
          var n2 = q.n * q.k, d2 = q.d * q.k; bar(v, 30, 36, 400, 56, q.n, q.d, C1); bar(v, 30, 124, 400, 56, n2, d2, C2);
          fracTxt(v, 490, 70, q.n, q.d, 24, C1); fracTxt(v, 490, 160, n2, d2, 24, C2); mk("path", { d: "M" + (30 + 400 * q.n / q.d) + " 30V190", fill: "none", stroke: C4, "stroke-dasharray": "4 4" }, v, 2);
        } else if (mode === "add") {
          var a = q.a, bb = q.b, sub = c.op === "-", tot = sub ? a - bb : a + bb, rows = Math.max(1, Math.ceil(Math.max(a, tot) / q.d)), bw = 360, rh = Math.min(46, 190 / rows);
          for (i = 0; i < rows; i++) { var s0 = i * q.d, inA = Math.max(0, Math.min(q.d, a - s0)), inB = sub ? 0 : Math.max(0, Math.min(q.d, a + bb - s0) - inA); bar(v, 30, 20 + i * (rh + 10), bw, rh, inA, q.d, C1, 0); if (inB > 0) bar(v, 30, 20 + i * (rh + 10), bw, rh, inB, q.d, C2, inA);
            if (sub) { var cut = Math.max(0, Math.min(q.d, a - s0) - Math.max(0, Math.min(q.d, a - bb - s0))); if (cut > 0) { var k0 = Math.max(0, Math.min(q.d, a - bb - s0)); for (var z2 = k0; z2 < k0 + cut; z2++) { mk("path", { d: "M" + (30 + z2 * bw / q.d + 4) + " " + (20 + i * (rh + 10) + 4) + "l" + (bw / q.d - 8) + " " + (rh - 8) + "m0 " + (-(rh - 8)) + "l" + (-(bw / q.d - 8)) + " " + (rh - 8), fill: "none", stroke: C1 }, v, 1.6); } } } }
          fracTxt(v, 470, 70, a, q.d, 22, C1); t(v, 506, 74, sub ? "－" : "＋", { z: 22, b: 1 }); fracTxt(v, 534, 70, bb, q.d, 22, C2);
        } else if (mode === "mixed") {
          var n3 = q.n, d3 = q.d, bars = Math.max(1, Math.ceil(n3 / d3)), bw2 = Math.min(150, 520 / bars - 8), x0 = 280 - (bars * (bw2 + 8)) / 2 + 4;
          for (i = 0; i < bars; i++) bar(v, x0 + i * (bw2 + 8), 40, bw2, 56, Math.max(0, Math.min(d3, n3 - i * d3)), d3, i < Math.floor(n3 / d3) ? C1 : C2);
          var w = Math.floor(n3 / d3), r = n3 % d3; t(v, 280, 140, w ? (r ? w + " 又 " + r + "/" + d3 : String(w)) : r + "/" + d3, { z: 26, b: 1, c: C1 }); t(v, 280, 175, n3 + "/" + d3 + "（分子" + (n3 >= d3 ? "≥" : "<") + "分母：" + (n3 >= d3 ? "假分數" : "真分數") + "）", { z: 15, c: SOFT });
        } else if (mode === "mul") {
          var X = 70, Y = 20, W = 240, H = 170, cx = W / q.d1, cy = H / q.d2;
          for (i = 0; i < q.d1; i++) for (var j = 0; j < q.d2; j++) { var in1 = i < q.n1, in2 = j < q.n2; mk("rect", { x: X + i * cx, y: Y + j * cy, width: cx, height: cy, fill: in1 && in2 ? C1 : in1 ? C2 : in2 ? C4 : "none", "fill-opacity": in1 && in2 ? .75 : .28 }, v, 1.2); }
          mk("rect", { x: X, y: Y, width: W, height: H, fill: "none" }, v, 2.2); t(v, X + W / 2, Y + H + 22, q.n1 + "/" + q.d1 + "（直的）", { z: 13, c: C2 }); t(v, X - 8, Y + H / 2, q.n2 + "/" + q.d2, { z: 13, c: C4, a: "end" });
          fracTxt(v, 400, 100, q.n1 * q.n2, q.d1 * q.d2, 30, C1); t(v, 400, 150, "重疊的部分", { z: 14, c: SOFT });
        } else if (mode === "div") {
          var d4 = q.d, n4 = q.n, k = q.k; bar(v, 30, 30, 400, 50, n4, d4, C1); t(v, 480, 62, n4 + "/" + d4, { z: 18, b: 1, c: C1 });
          bar(v, 30, 130, 400, 50, n4 * k, d4 * k, C2, 0); for (i = 0; i < n4 * k; i++) { if (i % n4 === 0 && i > 0) mk("path", { d: "M" + (30 + 400 * i / (d4 * k)) + " 124V186", fill: "none", stroke: C1 }, v, 3); }
          t(v, 480, 162, "每份 1/" + (d4 * k), { z: 14, c: C2 }); t(v, 280, 112, "把這 " + n4 + "/" + d4 + " 平分成 " + k + " 份，每份取 " + n4 + " 小格", { z: 14, c: SOFT });
        }
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };

  /* ---------- 時鐘：clock（mode: read；elapsed 顯示開始與結束）---------- */
  function clockFace(v, cx, cy, r, h, m, col) {
    var i; mk("circle", { cx: cx, cy: cy, r: r, fill: "var(--paper)" }, v, 2.6);
    for (i = 0; i < 60; i++) { var a = i * Math.PI / 30, big = i % 5 === 0, r1 = r - (big ? 10 : 5); mk("path", { d: "M" + (cx + r1 * Math.sin(a)) + " " + (cy - r1 * Math.cos(a)) + "L" + (cx + (r - 2) * Math.sin(a)) + " " + (cy - (r - 2) * Math.cos(a)), fill: "none" }, v, big ? 1.8 : .8); }
    for (i = 1; i <= 12; i++) { var a2 = i * Math.PI / 6; t(v, cx + (r - 24) * Math.sin(a2), cy - (r - 24) * Math.cos(a2) + 5, String(i), { z: r > 70 ? 16 : 12, b: 1 }); }
    var ha = (h % 12) * 30 + m * .5, ma = m * 6; mk("path", { d: "M" + cx + " " + cy + "L" + (cx + r * .5 * Math.sin(ha * Math.PI / 180)) + " " + (cy - r * .5 * Math.cos(ha * Math.PI / 180)), fill: "none", stroke: col || C1 }, v, 5);
    mk("path", { d: "M" + cx + " " + cy + "L" + (cx + r * .78 * Math.sin(ma * Math.PI / 180)) + " " + (cy - r * .78 * Math.cos(ma * Math.PI / 180)), fill: "none", stroke: col || C2 }, v, 3.2); mk("circle", { cx: cx, cy: cy, r: 4, fill: INK }, v, 1);
  }
  K.clockFace = clockFace;
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  K.p2 = p2;
  K.clock = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 240), mode = c.mode || "read", pm = null, sl = sliders(b, c.S, draw, mode === "read" ? { drag: function (x, y, set, q) { var ang = Math.atan2(x - 170, 120 - y) * 180 / Math.PI; if (ang < 0) ang += 360; var m = Math.round(ang / 6) % 60; if (!c.S.some(function (d) { return d.k === "m" && d.min !== d.max; })) { set("h", Math.round(ang / 30) % 12 || 12); } else { if (pm !== null && pm > 45 && m < 15) set("h", q.h % 12 + 1); else if (pm !== null && pm < 15 && m > 45) set("h", (q.h + 10) % 12 + 1); set("m", m); pm = m; } } } : { nodrag: false });
      function draw() {
        var q = sl.vals(); v.innerHTML = ""; q.m = q.m || 0; q.dh = q.dh || 0; q.dm = q.dm || 0; if (c.fix) for (var fk in c.fix) q[fk] = c.fix[fk];
        if (mode === "read") { clockFace(v, 170, 120, 100, q.h, q.m); t(v, 400, 105, q.h + ":" + p2(q.m), { z: 44, b: 1, c: C1 }); t(v, 400, 145, "短針指 " + q.h + "，長針指 " + (q.m / 5), { z: 14, c: SOFT }); }
        else { var tot = q.h * 60 + q.m + q.dh * 60 + q.dm, eh = Math.floor(tot / 60) % 24, em = tot % 60; clockFace(v, 120, 105, 80, q.h, q.m, C1); clockFace(v, 440, 105, 80, eh % 12 || 12, em, C2); t(v, 120, 214, "開始 " + q.h + ":" + p2(q.m), { z: 15, b: 1, c: C1 }); t(v, 440, 214, "結束 " + p2(eh) + ":" + p2(em) + (tot >= 1440 ? "（隔天）" : ""), { z: 15, b: 1, c: C2 }); t(v, 280, 95, "經過", { z: 14, c: SOFT }); t(v, 280, 120, (q.dh ? q.dh + " 小時 " : "") + (q.dm || !q.dh ? q.dm + " 分" : ""), { z: 17, b: 1 }); mk("path", { d: "M215 135H345", fill: "none", stroke: C4 }, v, 3); }
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };

  /* ---------- 單位換算：conv ----------
     S：v（大單位的數量）、可選 w（小單位的零頭）；ratio：1 大單位 = ratio 小單位；names:[大,小] */
  K.conv = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 160), sl = sliders(b, c.S, draw), R = c.ratio, N = c.names;
      function draw() {
        var q = sl.vals(), big = q.v, extra = q.w || 0, total = Math.round((big * R + extra) * 1000) / 1000, X0 = 30, W = 500, max = (c.S[0].max * R + (c.S[1] ? c.S[1].max : 0)), i; v.innerHTML = "";
        var wd = W * total / max; mk("rect", { x: X0, y: 50, width: W, height: 34, fill: "none", stroke: SOFT, rx: 4, "stroke-dasharray": "4 4" }, v, 1.2);
        mk("rect", { x: X0, y: 50, width: Math.max(1, wd), height: 34, fill: C2, "fill-opacity": .45, rx: 4 }, v, 2);
        var step = c.S[0].max > 12 ? Math.ceil(c.S[0].max / 10) : 1;
        for (i = 0; i <= c.S[0].max; i += step) { var px = X0 + W * i * R / max; mk("path", { d: "M" + px + " 44V92", fill: "none", stroke: i * R <= total ? INK : SOFT }, v, 1.6); t(v, px, 108, String(i), { z: 12, c: SOFT }); }
        if (extra) mk("rect", { x: X0 + W * big * R / max, y: 50, width: Math.max(1, W * extra / max), height: 34, fill: C1, "fill-opacity": .6 }, v, 1.5);
        t(v, X0, 128, "刻度＝" + N[0], { z: 13, c: SOFT, a: "start" }); t(v, 530, 150, c.big ? c.big(q, total) : "", { z: 16, b: 1, c: C1, a: "end" });
        eq.innerHTML = c.eq(q, total);
      }
      draw();
    });
  };

  /* ---------- 比較長短高矮、容量、面積：bars ----------
     S：a、b（可加 c）；orient："h" 橫條、"v" 直條；names；unit；kind："len" 一般長條，"cap" 水杯，"area" 方塊 */
  K.bars = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 230), keys = c.S.map(function (d) { return d.k; }), cols = [C1, C2, C3], max = c.S[0].max, n0 = keys.length,
        sl = sliders(b, c.S, draw, { drag: function (x, y, set) { var vert = c.orient === "v" || c.kind === "cap", i, val;
          if (vert) { var bw = c.kind === "cap" ? 80 : 70, gap = (560 - n0 * bw) / (n0 + 1); i = Math.floor((x - gap / 2) / (bw + gap)); val = (190 - y) / 150 * max; }
          else if (c.kind === "area") { i = Math.floor((y - 20) / (200 / n0)); val = (x - 30) / 500 * max * 2.2; }
          else { var bh = Math.min(46, 190 / n0 - 10); i = Math.floor((y - 12) / (bh + 22)); val = (x - 30) / 440 * max; }
          i = Math.max(0, Math.min(n0 - 1, i)); set(keys[i], Math.round(val)); } });
      function draw() {
        var q = sl.vals(), n = keys.length, i; v.innerHTML = "";
        if (c.kind === "cap") { var bw = 80, gap = (560 - n * bw) / (n + 1); keys.forEach(function (k, i2) { var x = gap + i2 * (bw + gap), h = 150 * q[k] / max; mk("path", { d: "M" + x + " 30L" + (x + 8) + " 190H" + (x + bw - 8) + "L" + (x + bw) + " 30", fill: "none" }, v, 2.4); mk("path", { d: "M" + (x + 8 * (1 - (h / 160)) * 0 + 4) + " " + (190 - h) + "H" + (x + bw - 4) + "V188H" + (x + 9) + "Z", fill: cols[i2], "fill-opacity": .5 }, v, 1); t(v, x + bw / 2, 212, (c.names ? c.names[i2] : "") + " " + q[k] + (c.unit || ""), { z: 14, b: 1, c: cols[i2] }); }); }
        else if (c.orient === "v") { var bw2 = 70, gap2 = (560 - n * bw2) / (n + 1); keys.forEach(function (k, i3) { var x = gap2 + i3 * (bw2 + gap2), h = 160 * q[k] / max; mk("rect", { x: x, y: 190 - h, width: bw2, height: h, fill: cols[i3], "fill-opacity": .55, rx: 4 }, v, 2); t(v, x + bw2 / 2, 212, (c.names ? c.names[i3] : "") + " " + q[k] + (c.unit || ""), { z: 14, b: 1, c: cols[i3] }); }); mk("path", { d: "M20 190H540", fill: "none" }, v, 2); }
        else if (c.kind === "area") { var u = Math.min(22, 480 / max / 2.4); keys.forEach(function (k, i4) { var y = 20 + i4 * (200 / n), per = Math.floor(500 / (u + 3)); for (var j = 0; j < q[k]; j++) mk("rect", { x: 30 + (j % per) * (u + 3), y: y + Math.floor(j / per) * (u + 3), width: u, height: u, fill: cols[i4], "fill-opacity": .6, rx: 2 }, v, 1.2); t(v, 540, y + 14, (c.names ? c.names[i4] : "") + " " + q[k] + (c.unit || ""), { z: 14, b: 1, c: cols[i4], a: "end" }); }); }
        else { var bh = Math.min(46, 190 / n - 10); keys.forEach(function (k, i5) { var y = 22 + i5 * (bh + 22), w = 440 * q[k] / max; mk("rect", { x: 30, y: y, width: w, height: bh, fill: cols[i5], "fill-opacity": .55, rx: 4 }, v, 2); t(v, 30, y - 4, (c.names ? c.names[i5] : "") + " " + q[k] + (c.unit || ""), { z: 13, b: 1, c: cols[i5], a: "start" }); if (c.ruler) for (var r2 = 0; r2 <= max; r2 += c.ruler) mk("path", { d: "M" + (30 + 440 * r2 / max) + " " + (y + bh) + "v6", fill: "none", stroke: SOFT }, v, 1); }); }
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };

  /* ---------- 天平：balance（比重量）---------- */
  K.balance = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 230), sl = sliders(b, c.S, draw);
      function draw() {
        var q = sl.vals(), d = Math.max(-1, Math.min(1, (q.a - q.b) / Math.max(q.a, q.b, 1))), ang = d * 14 * Math.PI / 180, cx = 280, cy = 70, L = 190; v.innerHTML = "";
        var lx = cx - L * Math.cos(ang), ly = cy + L * Math.sin(-ang) * -1 * -1, rx = cx + L * Math.cos(ang), ry = cy - L * Math.sin(-ang) * -1 * -1; ly = cy - L * Math.sin(ang) * -1 * -1; ry = cy + L * Math.sin(ang) * -1 * -1;
        /* a 重（d>0）→ 左邊下沉 */
        ly = cy + L * Math.sin(Math.abs(ang)) * (d > 0 ? 1 : d < 0 ? -1 : 0); ry = cy - (ly - cy);
        mk("path", { d: "M" + cx + " " + cy + "V190M" + (cx - 50) + " 192H" + (cx + 50), fill: "none" }, v, 3); mk("path", { d: "M" + lx + " " + ly + "L" + rx + " " + ry, fill: "none" }, v, 5); mk("circle", { cx: cx, cy: cy, r: 7, fill: C4 }, v, 2);
        [[lx, ly, q.a, C1, c.na || "甲"], [rx, ry, q.b, C2, c.nb || "乙"]].forEach(function (p) { mk("path", { d: "M" + p[0] + " " + p[1] + "l-34 56M" + p[0] + " " + p[1] + "l34 56", fill: "none", stroke: SOFT }, v, 1.4); mk("path", { d: "M" + (p[0] - 40) + " " + (p[1] + 56) + "h80", fill: "none" }, v, 3); var h = Math.min(60, 14 + p[2] * (c.hs || 3)); mk("rect", { x: p[0] - 22, y: p[1] + 56 - h, width: 44, height: h, fill: p[3], "fill-opacity": .55, rx: 4 }, v, 2); t(v, p[0], p[1] + 56 - h - 8, p[4] + " " + p[2] + (c.unit || ""), { z: 14, b: 1, c: p[3] }); });
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };
})();
(function () {
  "use strict";
  var NB = window.NB, K = NB.kit, mk = NB.mk, t = NB.t, sliders = K.sliders, stage = K.stage, html = K.html, unit = K.unit, dec = K.dec;
  var C1 = "var(--p1)", C2 = "var(--p2)", C3 = "var(--p3)", C4 = "var(--p4)", INK = "var(--ink)", SOFT = "var(--soft)", COLS = [C1, C2, C3, C4];
  /* ---------- 自由繪圖：free（custom draw(v,q,K)）---------- */
  K.free = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, c.w || 560, c.h || 220), sl = sliders(b, c.S || [], draw);
      function draw() { var q = sl.vals(); v.innerHTML = ""; c.draw(v, q, K); eq.innerHTML = c.eq(q); }
      draw();
    });
  };
  /* ---------- 圖形：shape ----------
     kind: rect（長方形，周長/面積）、tri（三角形分類）、angle（量角）、circle、poly（正多邊形）、para（平行四邊形/梯形/三角形面積）*/
  K.shape = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 230), kind = c.kind, sl = sliders(b, c.S, draw, kind === "angle" ? { drag: function (x, y, set) { var d = Math.atan2(190 - y, 280 - x) * 180 / Math.PI; if (d < 0) d = x > 280 ? 180 : 0; set("d", Math.round(d)); } } : {});
      function grid(x, y, w, h, u) { var i; for (i = 0; i <= w; i++) mk("path", { d: "M" + (x + i * u) + " " + y + "v" + h * u, fill: "none", stroke: SOFT, "stroke-opacity": .5 }, v, .8); for (i = 0; i <= h; i++) mk("path", { d: "M" + x + " " + (y + i * u) + "h" + w * u, fill: "none", stroke: SOFT, "stroke-opacity": .5 }, v, .8); }
      function draw() {
        var q = sl.vals(); v.innerHTML = "";
        if (kind === "rect") {
          var u = Math.min(300 / q.w, 160 / q.h, 30), x0 = 60, y0 = 30; mk("rect", { x: x0, y: y0, width: q.w * u, height: q.h * u, fill: c.show === "peri" ? "none" : C1, "fill-opacity": .25 }, v, 3); if (c.show !== "peri" || q.w * q.h <= 120) grid(x0, y0, q.w, q.h, u);
          mk("rect", { x: x0, y: y0, width: q.w * u, height: q.h * u, fill: "none", stroke: c.show === "peri" ? C1 : INK }, v, c.show === "peri" ? 5 : 3);
          t(v, x0 + q.w * u / 2, y0 + q.h * u + 22, q.w + (c.unit || ""), { z: 15, b: 1, c: C2 }); t(v, x0 - 10, y0 + q.h * u / 2 + 5, q.h + (c.unit || ""), { z: 15, b: 1, c: C2, a: "end" });
          t(v, 440, 100, c.show === "peri" ? "周長" : "面積", { z: 15, c: SOFT }); t(v, 440, 140, (c.show === "peri" ? 2 * (q.w + q.h) : q.w * q.h) + (c.show === "peri" ? (c.unit || "") : (c.unit2 || "")), { z: 28, b: 1, c: C1 });
        } else if (kind === "tri") {
          var a = q.a, bb = q.b, cc = q.c, ok = a + bb > cc && a + cc > bb && bb + cc > a;
          if (!ok) { t(v, 280, 110, "這三條邊圍不成三角形", { z: 20, b: 1, c: C1 }); t(v, 280, 140, "任意兩邊的和要大於第三邊", { z: 14, c: SOFT }); }
          else { var s = Math.min(240 / Math.max(a, bb, cc), 40), A = [60, 190], B = [60 + cc * s, 190], cx = (cc * cc + bb * bb - a * a) / (2 * cc), cy = Math.sqrt(Math.max(0, bb * bb - cx * cx)), Cc = [60 + cx * s, 190 - cy * s];
            mk("polygon", { points: A + " " + B + " " + Cc, fill: C1, "fill-opacity": .22 }, v, 3); t(v, (B[0] + Cc[0]) / 2 + 14, (B[1] + Cc[1]) / 2, String(a), { z: 14, b: 1, c: C2 }); t(v, (A[0] + Cc[0]) / 2 - 12, (A[1] + Cc[1]) / 2, String(bb), { z: 14, b: 1, c: C2 }); t(v, (A[0] + B[0]) / 2, 210, String(cc), { z: 14, b: 1, c: C2 });
            var ang = [Math.acos((bb * bb + cc * cc - a * a) / (2 * bb * cc)), Math.acos((a * a + cc * cc - bb * bb) / (2 * a * cc)), Math.acos((a * a + bb * bb - cc * cc) / (2 * a * bb))].map(function (r) { return Math.round(r * 180 / Math.PI); });
            var kinds = (a === bb && bb === cc) ? "正三角形（三邊一樣長）" : (a === bb || bb === cc || a === cc) ? "等腰三角形（兩邊一樣長）" : "不等邊三角形"; var maxA = Math.max.apply(null, ang), kind2 = maxA === 90 ? "直角三角形" : maxA > 90 ? "鈍角三角形" : "銳角三角形";
            t(v, 440, 90, kinds, { z: 15, b: 1, c: C1 }); t(v, 440, 120, kind2, { z: 15, b: 1, c: C2 }); t(v, 440, 150, "三個角約 " + ang.join("°、") + "°", { z: 13, c: SOFT }); q.kinds = kinds; q.kind2 = kind2; q.ang = ang; }
        } else if (kind === "angle") {
          var cx2 = 280, cy2 = 190, R = 150, d = q.d, i; mk("path", { d: "M" + (cx2 - R) + " " + cy2 + "A" + R + " " + R + " 0 0 1 " + (cx2 + R) + " " + cy2 + "Z", fill: "var(--paper)", stroke: SOFT }, v, 1.6);
          for (i = 0; i <= 180; i += 10) { var r1 = R - (i % 30 === 0 ? 16 : 8), a2 = i * Math.PI / 180; mk("path", { d: "M" + (cx2 - R * Math.cos(a2)) + " " + (cy2 - R * Math.sin(a2)) + "L" + (cx2 - r1 * Math.cos(a2)) + " " + (cy2 - r1 * Math.sin(a2)), fill: "none", stroke: SOFT }, v, 1); if (i % 30 === 0) t(v, cx2 - (R - 28) * Math.cos(a2), cy2 - (R - 28) * Math.sin(a2) + 4, String(i), { z: 11, c: SOFT }); }
          var ar = d * Math.PI / 180; mk("path", { d: "M" + cx2 + " " + cy2 + "L" + (cx2 - (R + 8) * Math.cos(ar)) + " " + (cy2 - (R + 8) * Math.sin(ar)), fill: "none", stroke: C1 }, v, 4); mk("path", { d: "M" + cx2 + " " + cy2 + "H" + (cx2 - R - 8), fill: "none", stroke: C2 }, v, 4);
          mk("path", { d: "M" + (cx2 - 44) + " " + cy2 + "A44 44 0 0 1 " + (cx2 - 44 * Math.cos(ar)) + " " + (cy2 - 44 * Math.sin(ar)), fill: "none", stroke: C4 }, v, 3); t(v, cx2 + 60, 120, d + "°", { z: 34, b: 1, c: C1 }); t(v, cx2 + 60, 150, d < 90 ? "銳角" : d === 90 ? "直角" : d < 180 ? "鈍角" : "平角", { z: 16, c: SOFT });
        } else if (kind === "circle") {
          var r = q.r, rr = 20 + r * 12; mk("circle", { cx: 150, cy: 115, r: rr, fill: C1, "fill-opacity": .2 }, v, 3); mk("path", { d: "M150 115h" + rr, fill: "none", stroke: C2 }, v, 4); mk("circle", { cx: 150, cy: 115, r: 4, fill: INK }, v, 1); t(v, 150 + rr / 2, 108, "半徑 " + r, { z: 13, b: 1, c: C2 });
          mk("path", { d: "M" + (150 - rr) + " " + (115 + rr + 10) + "h" + 2 * rr + "M" + (150 - rr) + " " + (115 + rr + 4) + "v12M" + (150 + rr) + " " + (115 + rr + 4) + "v12", fill: "none", stroke: C4 }, v, 2); t(v, 150, 115 + rr + 28, "直徑 " + 2 * r, { z: 13, b: 1, c: C4 });
          t(v, 420, 90, "圓周 ≈ " + dec(2 * 3.14 * r, 2), { z: 17, b: 1, c: C1 }); t(v, 420, 125, "面積 ≈ " + dec(3.14 * r * r, 2), { z: 17, b: 1, c: C2 }); t(v, 420, 155, "（圓周率取 3.14）", { z: 12, c: SOFT });
        } else if (kind === "para") {
          var base = q.b, h = q.h, s2 = 24, X = 60, Y = 40, off = c.off === undefined ? 3 : c.off, top = c.mode === "trap" ? q.t : base; var Hh = h * s2;
          if (c.mode === "tri") { mk("polygon", { points: X + "," + (Y + Hh) + " " + (X + base * s2) + "," + (Y + Hh) + " " + (X + off * s2) + "," + Y, fill: C1, "fill-opacity": .25 }, v, 3); }
          else mk("polygon", { points: X + "," + (Y + Hh) + " " + (X + base * s2) + "," + (Y + Hh) + " " + (X + off * s2 + top * s2) + "," + Y + " " + (X + off * s2) + "," + Y, fill: C1, "fill-opacity": .25 }, v, 3);
          mk("path", { d: "M" + (X + off * s2) + " " + Y + "V" + (Y + Hh), fill: "none", stroke: C2, "stroke-dasharray": "5 4" }, v, 2.4); t(v, X + off * s2 + 14, Y + Hh / 2, "高 " + h, { z: 14, b: 1, c: C2, a: "start" }); t(v, X + base * s2 / 2, Y + Hh + 22, "底 " + base, { z: 14, b: 1, c: C1 }); if (c.mode === "trap") t(v, X + off * s2 + top * s2 / 2, Y - 8, "上底 " + top, { z: 14, b: 1, c: C1 });
          var area = c.mode === "tri" ? base * h / 2 : c.mode === "trap" ? (base + top) * h / 2 : base * h; t(v, 440, 110, "面積", { z: 14, c: SOFT }); t(v, 440, 150, String(area), { z: 30, b: 1, c: C1 });
        } else if (kind === "poly") {
          var n = q.n, R2 = 85, pts = [], i2; for (i2 = 0; i2 < n; i2++) { var a3 = -Math.PI / 2 + i2 * 2 * Math.PI / n; pts.push((150 + R2 * Math.cos(a3)).toFixed(1) + "," + (115 + R2 * Math.sin(a3)).toFixed(1)); } mk("polygon", { points: pts.join(" "), fill: C1, "fill-opacity": .22 }, v, 3);
          if (c.diag) for (i2 = 2; i2 < n; i2++) mk("path", { d: "M" + pts[0] + "L" + pts[i2], fill: "none", stroke: C2, "stroke-dasharray": "4 3" }, v, 1.6);
          t(v, 400, 90, n + " 邊形", { z: 22, b: 1, c: C1 }); t(v, 400, 125, "內角和 " + (n - 2) * 180 + "°", { z: 16, c: C2 }); t(v, 400, 155, "對角線切出 " + (n - 2) + " 個三角形", { z: 13, c: SOFT });
        }
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };
  /* ---------- 統計圖表：chart ----------
     kind: bar（長條圖，S 一個滑桿一類）、pie（圓餅，以比例）、line（折線）、table */
  K.chart = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 230), keys = c.S.map(function (d) { return d.k; }), kind = c.kind || "bar", mx = c.max || c.S[0].max, sl = sliders(b, c.S, draw, kind === "pie" ? {} : { drag: function (x, y, set) { var n = keys.length, i = Math.floor((x - 60) / (480 / n)); i = Math.max(0, Math.min(n - 1, i)); set(keys[i], Math.round((190 - y) / 150 * mx)); } });
      function draw() {
        var q = sl.vals(), n = keys.length, i, tot = 0; v.innerHTML = ""; keys.forEach(function (k) { tot += q[k]; });
        if (kind === "bar") { var bw = Math.min(60, 420 / n - 14), g = (480 - n * bw) / (n + 1); var nd = [5, 4, 3, 6, 2].filter(function (z) { return mx % z === 0; })[0] || 4; for (i = 0; i <= nd; i++) { var yy = 190 - 150 * i / nd; mk("path", { d: "M60 " + yy + "H540", fill: "none", stroke: SOFT, "stroke-opacity": .5 }, v, .8); t(v, 52, yy + 4, String(Math.round(mx * i / nd * 10) / 10), { z: 11, c: SOFT, a: "end" }); }
          keys.forEach(function (k, j) { var x = 60 + g + j * (bw + g), h = 150 * q[k] / mx; mk("rect", { x: x, y: 190 - h, width: bw, height: h, fill: COLS[j % 4], "fill-opacity": .6, rx: 3 }, v, 2); t(v, x + bw / 2, 184 - h, String(q[k]), { z: 13, b: 1 }); t(v, x + bw / 2, 210, c.S[j].label, { z: 13, c: SOFT }); }); mk("path", { d: "M60 40V190H540", fill: "none" }, v, 2.4); }
        else if (kind === "line") { var step = 470 / Math.max(1, n - 1), pts = []; var nd2 = [5, 4, 3, 6, 2].filter(function (z) { return mx % z === 0; })[0] || 4; for (i = 0; i <= nd2; i++) { var y2 = 190 - 150 * i / nd2; mk("path", { d: "M60 " + y2 + "H540", fill: "none", stroke: SOFT, "stroke-opacity": .5 }, v, .8); t(v, 52, y2 + 4, String(Math.round(mx * i / nd2 * 10) / 10), { z: 11, c: SOFT, a: "end" }); } keys.forEach(function (k, j) { var x = 70 + j * step * 0.98, y = 190 - 150 * q[k] / mx; pts.push([x, y]); t(v, x, 210, c.S[j].label, { z: 12, c: SOFT }); }); mk("path", { d: "M" + pts.map(function (p) { return p[0] + " " + p[1]; }).join("L"), fill: "none", stroke: C1 }, v, 3); pts.forEach(function (p, j) { mk("circle", { cx: p[0], cy: p[1], r: 5, fill: C1 }, v, 1); t(v, p[0], p[1] - 10, String(q[keys[j]]), { z: 12, b: 1 }); }); mk("path", { d: "M60 40V190H540", fill: "none" }, v, 2.4); }
        else if (kind === "pie") { var a0 = -Math.PI / 2; keys.forEach(function (k, j) { if (!q[k]) return; var a1 = a0 + 2 * Math.PI * q[k] / tot, big = a1 - a0 > Math.PI ? 1 : 0, R = 90, cx = 150, cy = 115; mk("path", { d: q[k] === tot ? "M" + (cx - R) + " " + cy + "a" + R + " " + R + " 0 1 0 " + 2 * R + " 0a" + R + " " + R + " 0 1 0 " + (-2 * R) + " 0" : "M" + cx + " " + cy + "L" + (cx + R * Math.cos(a0)) + " " + (cy + R * Math.sin(a0)) + "A" + R + " " + R + " 0 " + big + " 1 " + (cx + R * Math.cos(a1)) + " " + (cy + R * Math.sin(a1)) + "Z", fill: COLS[j % 4], "fill-opacity": .6 }, v, 2); t(v, 380, 60 + j * 34, c.S[j].label + "　" + q[k] + "（" + Math.round(100 * q[k] / tot) + "%）", { z: 15, b: 1, c: COLS[j % 4], a: "start" }); a0 = a1; }); }
        eq.innerHTML = c.eq(q, tot);
      }
      draw();
    });
  };
  /* ---------- 數列／規律：seq ----------
     S：first（首項）、d（公差或公比）、n（第幾項）；mode: add（等差）、mul（等比）、grow（圖形成長：每項點數 first + d*(n-1)） */
  K.seq = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 190), sl = sliders(b, c.S, draw), mode = c.mode || "add";
      function draw() {
        var q = sl.vals(), N = Math.min(q.n + 1, 8), i, terms = []; v.innerHTML = ""; for (i = 0; i < N; i++) terms.push(mode === "mul" ? q.first * Math.pow(q.d, i) : q.first + q.d * i);
        var w = 520 / N; terms.forEach(function (x, j) { var cx = 40 + w * j + w / 2; mk("rect", { x: cx - w / 2 + 4, y: 50, width: w - 8, height: 54, rx: 8, fill: j === q.n - 1 ? C1 : "none", "fill-opacity": .3 }, v, 2); t(v, cx, 85, String(x), { z: 22, b: 1, c: j === q.n - 1 ? C1 : INK }); t(v, cx, 40, "第" + (j + 1) + "項", { z: 12, c: SOFT }); if (j < N - 1) t(v, cx + w / 2, 128, (mode === "mul" ? "×" + q.d : (q.d >= 0 ? "＋" + q.d : "－" + (-q.d))), { z: 13, b: 1, c: C2 }); });
        if (mode === "grow") { terms.forEach(function (x, j) { var cx = 40 + w * j + w / 2, m = Math.min(x, 24); for (var p = 0; p < m; p++) mk("circle", { cx: cx - 18 + (p % 6) * 7, cy: 140 + Math.floor(p / 6) * 7, r: 2.6, fill: C1 }, v, .8); }); }
        t(v, 280, 175, "第 " + q.n + " 項 ＝ " + (mode === "mul" ? q.first * Math.pow(q.d, q.n - 1) : q.first + q.d * (q.n - 1)), { z: 18, b: 1, c: C1 });
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };
  /* ---------- 日曆：cal（start：1 號是星期幾 0=日；days：本月天數）---------- */
  K.cal = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 270), sl = sliders(b, c.S, draw), W = ["日", "一", "二", "三", "四", "五", "六"];
      function draw() {
        var q = sl.vals(), i, x, y; v.innerHTML = ""; W.forEach(function (w, j) { t(v, 40 + j * 70 + 35, 24, w, { z: 15, b: 1, c: j === 0 || j === 6 ? C1 : SOFT }); });
        for (i = 1; i <= q.days; i++) { var idx = q.start + i - 1; x = 40 + (idx % 7) * 70; y = 36 + Math.floor(idx / 7) * 38; var hi = c.hi ? c.hi(i, q) : 0; mk("rect", { x: x + 3, y: y, width: 64, height: 34, rx: 6, fill: hi ? C1 : "none", "fill-opacity": hi ? .35 : 0, stroke: SOFT }, v, 1); t(v, x + 35, y + 23, String(i), { z: 15, b: hi ? 1 : 0 }); }
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };
  /* ---------- 線段圖：model ----------
     rows: [{name, get:function(q)->數值, color}]，畫等比例長條並可標括號；total/diff 以 brace 指示 */
  K.model = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 200), sl = sliders(b, c.S, draw);
      function draw() {
        var q = sl.vals(), rows = c.rows(q), mx = 0, y = 34, X = 90; v.innerHTML = ""; rows.forEach(function (r) { var s = 0; (r.segs || [r.v]).forEach(function (z) { s += z; }); if (s > mx) mx = s; });
        var sc = 400 / mx; rows.forEach(function (r, j) { t(v, X - 10, y + 24, r.name, { z: 14, b: 1, a: "end", c: COLS[j % 4] }); var x = X; (r.segs || [r.v]).forEach(function (z, k) { mk("rect", { x: x, y: y, width: Math.max(2, z * sc), height: 36, fill: r.cols ? r.cols[k] : COLS[j % 4], "fill-opacity": r.cols ? .55 : .35 + .15 * (k % 2), rx: 3 }, v, 2); t(v, x + z * sc / 2, y + 24, String(z), { z: 14, b: 1 }); x += z * sc; }); if (r.note) t(v, x + 8, y + 24, r.note, { z: 13, c: C1, a: "start" }); y += 56; });
        if (c.brace) { var br = c.brace(q); mk("path", { d: "M" + (X + 400 + 14) + " 34v" + (y - 54), fill: "none", stroke: C4 }, v, 2.4); t(v, X + 400 + 24, 34 + (y - 54) / 2 + 5, br, { z: 15, b: 1, c: C4, a: "start" }); }
        eq.innerHTML = c.eq(q);
      }
      draw();
    });
  };
  /* ---------- 概數（四捨五入等）：round ---------- */
  K.round = function (c) {
    return unit(c, function (b, eq) {
      var v = stage(b, 560, c.h || 170), sl = sliders(b, c.S, draw), P = c.place || 10;
      function draw() {
        var q = sl.vals(), n = q.n, lo = Math.floor(n / P) * P, hi = lo + P, mode = c.mode || "round", res = mode === "floor" ? lo : mode === "ceil" ? (n % P ? hi : lo) : (n - lo >= P / 2 ? hi : lo), i; v.innerHTML = "";
        mk("path", { d: "M50 100H510", fill: "none" }, v, 3); var px = function (z) { return 60 + 440 * (z - lo) / P; };
        for (i = 0; i <= 10; i++) mk("path", { d: "M" + (60 + 44 * i) + " 92v16", fill: "none", stroke: SOFT }, v, 1.2);
        t(v, px(lo), 130, String(lo), { z: 17, b: 1 }); t(v, px(hi), 130, String(hi), { z: 17, b: 1 }); mk("path", { d: "M" + px(lo + P / 2) + " 60v48", fill: "none", stroke: C2, "stroke-dasharray": "4 3" }, v, 2); t(v, px(lo + P / 2), 52, "中點 " + (lo + P / 2), { z: 12, c: C2 });
        mk("circle", { cx: px(n), cy: 100, r: 7, fill: C1 }, v, 2); t(v, px(n), 80, String(n), { z: 17, b: 1, c: C1 }); mk("path", { d: "M" + px(n) + " 100Q" + (px(n) + px(res)) / 2 + " 160 " + px(res) + " 100", fill: "none", stroke: C4 }, v, 2.4);
        eq.innerHTML = c.eq(q, res, lo, hi);
      }
      draw();
    });
  };
})();
