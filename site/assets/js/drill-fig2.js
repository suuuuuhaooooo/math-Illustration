/* 無限出題：進階圖庫（立體圖形、解題輔助圖）
   立體圖形用斜投影：看得到的邊畫實線、被擋住的邊畫虛線，尺寸用帶端點的標示線。
   解題輔助圖（線段圖、相遇圖……）放在題目的 aid 欄位，列印設定可以選「題目卷也附／只在答案卷／不附」。 */
(function () {
  "use strict";
  var D = window.DR, F = D.fig, T = F.T, TN = F.tint, fmt = D.fmt;
  var CX = 0.46, CY = 0.34;                       /* 斜投影：深度往右上 */
  function pj(p) { return [p[0] + p[2] * CX, -(p[1] + p[2] * CY)]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  var VIEW = [-CX, -CY, 1];
  function fit(items, pad) { /* items: 螢幕座標陣列 → 位移 */ var xs = [], ys = []; items.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); var x0 = Math.min.apply(0, xs), y0 = Math.min.apply(0, ys); return { dx: pad - x0, dy: pad - y0, w: Math.max.apply(0, xs) - x0 + pad * 2, h: Math.max.apply(0, ys) - y0 + pad * 2 }; }
  function pth(pts, f) { return pts.map(function (p, i) { return (i ? "L" : "M") + (p[0] + f.dx).toFixed(1) + " " + (p[1] + f.dy).toFixed(1); }).join("") + "Z"; }
  function ln(a, b, f, o) { o = o || {}; return '<line x1="' + (a[0] + f.dx).toFixed(1) + '" y1="' + (a[1] + f.dy).toFixed(1) + '" x2="' + (b[0] + f.dx).toFixed(1) + '" y2="' + (b[1] + f.dy).toFixed(1) + '"' + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + (o.w ? ' stroke-width="' + o.w + '"' : "") + (o.c ? ' stroke="' + o.c + '"' : "") + "/>"; }
  /* 尺寸標示線：在 a→b 外側 off 像素，畫端點小槓與文字 */
  function dim(a, b, t, f, side, o) {
    o = o || {}; var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, off = (o.off || 12) * (side || 1);
    var A = [a[0] + nx * off, a[1] + ny * off], B = [b[0] + nx * off, b[1] + ny * off], s = ln(A, B, f, { w: 0.9 });
    s += ln([A[0] - nx * 4, A[1] - ny * 4], [A[0] + nx * 4, A[1] + ny * 4], f, { w: 0.9 }) + ln([B[0] - nx * 4, B[1] - ny * 4], [B[0] + nx * 4, B[1] + ny * 4], f, { w: 0.9 });
    var mx = (A[0] + B[0]) / 2 + nx * 10 * (side || 1), my = (A[1] + B[1]) / 2 + ny * 10 * (side || 1);
    return s + '<text x="' + (mx + f.dx).toFixed(1) + '" y="' + (my + f.dy).toFixed(1) + '" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="currentColor" stroke="none" paint-order="stroke">' + t + "</text>";
  }
  F.dim = dim;
  /* 凸多面體：verts 3D、faces（外側看逆時針）、fills */
  function poly3d(verts, faces, o) {
    o = o || {}; var P = verts.map(function (v) { return pj(v.map(function (x) { return x * (o.k || 1); })); }), f = o.f || fit(P.concat(o.more || []), o.pad || 34);
    var cen = [0, 0, 0]; verts.forEach(function (v) { cen[0] += v[0] / verts.length; cen[1] += v[1] / verts.length; cen[2] += v[2] / verts.length; });
    function nrm(fc) { var n = cross(sub(verts[fc[1]], verts[fc[0]]), sub(verts[fc[2]], verts[fc[0]])), fcn = [0, 0, 0]; fc.forEach(function (k) { fcn[0] += verts[k][0] / fc.length; fcn[1] += verts[k][1] / fc.length; fcn[2] += verts[k][2] / fc.length; }); var out = sub(fcn, cen); if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = [-n[0], -n[1], -n[2]]; return n; }
    var NS = faces.map(nrm), vis = NS.map(function (n) { return n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2] < 0; });
    var edges = {}, s = "";
    faces.forEach(function (fc, i) { for (var j = 0; j < fc.length; j++) { var a = fc[j], b = fc[(j + 1) % fc.length], k = a < b ? a + "-" + b : b + "-" + a; edges[k] = edges[k] || { a: a, b: b, v: false }; if (vis[i]) edges[k].v = true; } });
    faces.forEach(function (fc, i) { if (!vis[i]) return; var n = NS[i], nl = Math.hypot(n[0], n[1], n[2]) || 1, sh = n[1] / nl > 0.5 ? 0.42 : n[0] / nl > 0.5 ? 0.3 : 0.18; s += '<path d="' + pth(fc.map(function (k) { return P[k]; }), f) + '" fill="' + (o.fill || TN.b) + '" fill-opacity="' + (o.fo != null ? o.fo : sh) + '" stroke="none"/>'; });
    Object.keys(edges).forEach(function (k) { var e = edges[k]; if (!e.v && o.hidden === false) return; s += ln(P[e.a], P[e.b], f, e.v ? { w: 1.8 } : { d: "4 3.5", w: 1 }); });
    return { s: s, P: P, f: f };
  }
  F.poly3d = poly3d;
  function box3(l, w, h, x0, y0, z0) { x0 = x0 || 0; y0 = y0 || 0; z0 = z0 || 0; var v = [[0, 0, 0], [l, 0, 0], [l, h, 0], [0, h, 0], [0, 0, w], [l, 0, w], [l, h, w], [0, h, w]].map(function (p) { return [p[0] + x0, p[1] + y0, p[2] + z0]; }); return { v: v, f: [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]] }; }
  function scaleTo(dims, target) { var m = Math.max.apply(0, dims); return target / m; }
  /* 長方體（含尺寸標示），labs = [長, 寬, 高] */
  F.box = function (l, w, h, labs, o) {
    o = o || {}; var k = scaleTo([l, w * 0.6, h], o.size || 130), L = l * k, W = Math.max(w * k, 26), H = h * k, b = box3(L, W, H), r = poly3d(b.v, b.f, { fill: o.fill, pad: 40 }), P = r.P, f = r.f, s = r.s;
    if (labs) { if (labs[0]) s += dim(P[0], P[1], labs[0], f, 1); if (labs[1]) s += dim(P[1], P[5], labs[1], f, 1); if (labs[2]) s += dim(P[5], P[6], labs[2], f, 1); }
    return F.svg(f.w + 10, f.h, s, { k: o.k || 0.85 });
  };
  /* 正方體 */
  F.cube = function (lab, o) { return F.box(1, 1, 1, [lab, "", ""], o); };
  /* 角柱、角錐（底面正 n 邊形） */
  function ngon(n, r, y) { var a = [], i; for (i = 0; i < n; i++) { var t = -Math.PI / 2 + Math.PI / n + (i * 2 * Math.PI) / n; a.push([r * Math.cos(t), y, (r * Math.sin(t) + r) * (n === 3 ? 1.9 : 1.3)]); } return a; }
  F.prism = function (n, o) {
    o = o || {}; var r = 50, h = o.h || 90, bot = ngon(n, r, 0), top = ngon(n, r, h), v = bot.concat(top), f = [], i;
    f.push(bot.map(function (x, i) { return i; }).reverse()); f.push(top.map(function (x, i) { return i + n; }));
    for (i = 0; i < n; i++) { var j = (i + 1) % n; f.push([i, j, j + n, i + n]); }
    var R = poly3d(v, f, { fill: o.fill || TN.g, pad: 22 }), s = R.s;
    if (o.labs) { if (o.labs.h) s += dim(R.P[0], R.P[n], o.labs.h, R.f, -1); }
    return F.svg(R.f.w, R.f.h, s, { k: o.k || 0.8 });
  };
  F.pyramid = function (n, o) {
    o = o || {}; var r = 55, h = 100, bot = ngon(n, r, 0), v = bot.concat([[0, h, 0]]), f = [], i;
    f.push(bot.map(function (x, i) { return i; }).reverse()); for (i = 0; i < n; i++) { var j = (i + 1) % n; f.push([i, j, n]); }
    var R = poly3d(v, f, { fill: o.fill || TN.y, pad: 20 });
    return F.svg(R.f.w, R.f.h, R.s, { k: o.k || 0.8 });
  };
  /* 直角三角柱：底面直角三角形 a、b（斜邊 c），高 H */
  F.triPrism = function (a, b, H, labs) {
    var k = 120 / Math.max(a, b, H), A = Math.max(a * k, 96), B = Math.max(b * k * 0.8, 80), Hh = Math.min(Math.max(H * k, 60), 110), v = [[0, 0, 0], [A, 0, 0], [0, 0, B], [0, Hh, 0], [A, Hh, 0], [0, Hh, B]];
    var f = [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [0, 2, 5, 3]], R = poly3d(v, f, { fill: TN.p, pad: 40 }), s = R.s;
    if (labs) { s += dim(R.P[0], R.P[1], labs[0], R.f, 1) + dim(R.P[1], R.P[2], labs[2] || "", R.f, 1) + dim(R.P[1], R.P[4], labs[3] || "", R.f, 1); if (labs[1]) s += dim(R.P[0], R.P[2], labs[1], R.f, -1); }
    return F.svg(R.f.w, R.f.h, s, { k: 0.85 });
  };
  /* 圓柱、圓錐、球（橢圓的後半邊用虛線） */
  function ell(cx, cy, rx, ry, half, o) { o = o || {}; if (half === "front") return '<path d="M' + (cx - rx) + " " + cy + "A" + rx + " " + ry + " 0 0 0 " + (cx + rx) + " " + cy + '"' + (o.w ? ' stroke-width="' + o.w + '"' : "") + "/>"; if (half === "back") return '<path d="M' + (cx - rx) + " " + cy + "A" + rx + " " + ry + " 0 0 1 " + (cx + rx) + " " + cy + '" stroke-dasharray="4 3.5" stroke-width="1"/>'; return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' + (o.fill ? ' fill="' + o.fill + '" fill-opacity="' + (o.fo || 0.35) + '"' : "") + (o.w ? ' stroke-width="' + o.w + '"' : "") + "/>"; }
  F.cylinder = function (rLab, hLab, o) {
    o = o || {}; var rx = 56, ry = 17, H = o.H || 110, cx = 80, top = 26, bot = top + H, s = "";
    if (o.water) { var wy = bot - H * o.water; s += '<path d="M' + (cx - rx) + " " + wy + "V" + bot + "A" + rx + " " + ry + " 0 0 0 " + (cx + rx) + " " + bot + "V" + wy + "A" + rx + " " + ry + " 0 0 1 " + (cx - rx) + " " + wy + 'Z" fill="' + TN.b + '" fill-opacity=".35" stroke="none"/>' + ell(cx, wy, rx, ry, null, { fill: TN.b, fo: 0.45, w: 1 }); }
    s += '<path d="M' + (cx - rx) + " " + top + "V" + bot + "M" + (cx + rx) + " " + top + "V" + bot + '" stroke-width="1.8"/>' + ell(cx, top, rx, ry, null, { fill: o.water ? null : TN.g, fo: 0.3, w: 1.8 }) + ell(cx, bot, rx, ry, "front", { w: 1.8 }) + ell(cx, bot, rx, ry, "back");
    s += '<circle cx="' + cx + '" cy="' + top + '" r="2" fill="currentColor" stroke="none"/>';
    if (rLab) s += F.L(cx, top, cx + rx, top, { d: "4 3" }) + T(cx + rx / 2, top - 9, rLab, { z: 12 });
    if (hLab) { s += F.L(cx + rx + 12, top, cx + rx + 12, bot, { w: 0.9 }) + F.L(cx + rx + 8, top, cx + rx + 16, top, { w: 0.9 }) + F.L(cx + rx + 8, bot, cx + rx + 16, bot, { w: 0.9 }) + T(cx + rx + 20, (top + bot) / 2, hLab, { z: 12, a: "start" }); }
    return F.svg(cx + rx + 80, bot + ry + 10, s, { k: o.k || 0.8 });
  };
  F.cone = function (rLab, hLab) { var cx = 80, rx = 56, ry = 16, top = 16, bot = 140, s = '<path d="M' + (cx - rx) + " " + bot + "L" + cx + " " + top + "L" + (cx + rx) + " " + bot + '" fill="' + TN.y + '" fill-opacity=".25" stroke-width="1.8"/>' + ell(cx, bot, rx, ry, "front", { w: 1.8 }) + ell(cx, bot, rx, ry, "back") + F.L(cx, top, cx, bot, { d: "4 3" }) + F.L(cx, bot, cx + rx, bot, { d: "4 3" }); if (rLab) s += T(cx + rx / 2, bot - 8, rLab, { z: 11 }); if (hLab) s += T(cx + 6, (top + bot) / 2, hLab, { z: 11, a: "start" }); return F.svg(170, bot + ry + 8, s, { k: 0.8 }); };
  F.sphere = function (lab, o) { o = o || {}; var s = '<circle cx="80" cy="80" r="64" fill="' + TN.r + '" fill-opacity=".18" stroke-width="1.8"/>' + ell(80, 80, 64, 18, "front", { w: 1.2 }) + ell(80, 80, 64, 18, "back") + '<circle cx="80" cy="80" r="2.2" fill="currentColor" stroke="none"/>' + F.L(80, 80, 144, 80, { d: "4 3" }) + (lab ? T(112, 70, lab, { z: 12 }) : ""); if (o.inCube) s = '<rect x="16" y="16" width="128" height="128" fill="none" stroke-dasharray="4 3"/>' + s; return F.svg(160, 162, s, { k: o.k || 0.75 }); };
  /* 水箱（玻璃）：l×w×h，水深 water（0~1）、石頭 stone、壁厚 thick */
  F.tank = function (l, w, h, o) {
    o = o || {}; var k = scaleTo([l, w * 0.6, h], o.size || 120), L = l * k, W = Math.max(w * k, 30), H = h * k, b = box3(L, W, H), P = b.v.map(pj), f = o.f || fit(P, 42), s = "";
    if (o.water) { var wh = H * o.water, wb = box3(L, W, wh), wr = poly3d(wb.v, wb.f, { f: f, fill: TN.b, fo: 0.32, hidden: false }); s += wr.s.replace(/stroke-width="1.8"/g, 'stroke-width=".8" stroke="' + "#4a7fb5" + '"'); }
    if (o.stone) { var sc = pj([L * 0.45, H * 0.12, W * 0.45]), rx = Math.min(L, H) * 0.18; s += '<path d="M' + (sc[0] + f.dx - rx) + " " + (sc[1] + f.dy) + "q" + rx * 0.2 + " " + -rx * 0.9 + " " + rx + " " + -rx * 0.8 + "q" + rx * 0.9 + " " + -rx * 0.1 + " " + rx * 1.1 + " " + rx * 0.6 + "q" + rx * 0.2 + " " + rx * 0.5 + " " + -rx * 0.5 + " " + rx * 0.6 + "q" + -rx * 1.1 + " " + rx * 0.3 + " " + -rx * 1.6 + " " + -rx * 0.4 + 'z" fill="#8f8a80" fill-opacity=".85" stroke-width="1.2"/>'; }
    var R = poly3d(b.v, b.f, { f: f, fill: "#cfe3f2", fo: 0.12 }); s += R.s;
    if (o.thick) { var t = Math.max(5, o.thick * k), it = [[t, H, t], [L - t, H, t], [L - t, H, W - t], [t, H, W - t]].map(pj); s += '<path d="' + pth(it, f) + '" fill="none" stroke-width="1"/>'; }
    var labs = o.labs || [];
    if (labs[0]) s += dim(P[0], P[1], labs[0], f, 1); if (labs[1]) s += dim(P[1], P[5], labs[1], f, 1); if (labs[2]) s += dim(P[5], P[6], labs[2], f, 1);
    if (o.water && o.wlab) { var a0 = pj([0, 0, 0]), a1 = pj([0, H * o.water, 0]); s += dim(a0, a1, o.wlab, f, -1, { off: 10 }); }
    if (o.title) s += T(f.w / 2, f.h - 4, o.title, { z: 12 });
    return F.svg(f.w + 8, f.h + (o.title ? 6 : 0), s, { k: o.k || 0.8 });
  };
  /* 排水法：放入石頭前後 */
  F.drain = function (l, w, h, w1, w2, labs) {
    return '<span class="dshapes">' + F.tank(l, w, h, { water: w1, labs: labs, title: "放入前", k: 0.62 }) + '<svg class="dfig" viewBox="0 0 40 30" width="34" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15H34M27 8l7 7-7 7"/></svg>' + F.tank(l, w, h, { water: w2, stone: 1, title: "放入後", k: 0.62 }) + "</span>";
  };
  /* 積木堆：hm[x][z] 高度 */
  F.stack = function (hm, o) {
    o = o || {}; var u = o.u || 28, all = [], cubes = [], nx = hm.length, nz = hm[0].length;
    for (var z = nz - 1; z >= 0; z--) for (var x = 0; x < nx; x++) for (var y = 0; y < hm[x][z]; y++) cubes.push([x, y, z]);
    cubes.forEach(function (c) { box3(u, u, u, c[0] * u, c[1] * u, c[2] * u).v.forEach(function (p) { all.push(pj(p)); }); });
    var f = fit(all.length ? all : [[0, 0]], 8), s = "";
    cubes.forEach(function (c) { var b = box3(u, u, u, c[0] * u, c[1] * u, c[2] * u), P = b.v.map(pj); [[0, 1, 2, 3, 0.55], [3, 2, 6, 7, 0.85], [1, 5, 6, 2, 0.38]].forEach(function (q) { s += '<path d="' + pth([P[q[0]], P[q[1]], P[q[2]], P[q[3]]], f) + '" fill="' + (o.c || TN.y) + '" fill-opacity="' + q[4] + '" stroke-width="1"/>'; }); });
    return F.svg(f.w, f.h, s, { k: o.k || 0.9 });
  };
  /* 兩個長方體組成的 L 形（左高右低），標出尺寸 */
  F.lsolid = function (l1, h1, l2, h2, w, labs) {
    var k = 160 / Math.max(l1 + l2, h1 * 1.2), W = Math.max(28, w * k * 0.7), A = box3(l1 * k, W, h1 * k), B = box3(l2 * k, W, h2 * k, l1 * k, 0, 0);
    var all = A.v.concat(B.v).map(pj), f = fit(all, 40), ra = poly3d(A.v, A.f, { f: f, fill: TN.g, hidden: false }), rb = poly3d(B.v, B.f, { f: f, fill: TN.b, hidden: false }), s = ra.s + rb.s, PA = ra.P, PB = rb.P;
    labs = labs || []; if (labs[0]) s += dim(PA[0], PA[1], labs[0], f, 1); if (labs[1]) s += dim(PB[0], PB[1], labs[1], f, 1); if (labs[2]) s += dim(PA[0], PA[3], labs[2], f, -1); if (labs[3]) s += dim(PB[5], PB[6], labs[3], f, 1); if (labs[4]) s += dim(PB[1], PB[5], labs[4], f, 1);
    return F.svg(f.w + 10, f.h, s, { k: 0.85 });
  };
  /* 挖穿圓柱孔的長方體 */
  F.holeBox = function (l, w, h, r, labs) {
    var k = 130 / Math.max(l, w * 0.6, h), L = l * k, W = Math.max(30, w * k), H = h * k, b = box3(L, W, H), R = poly3d(b.v, b.f, { fill: TN.y, pad: 40 }), f = R.f, s = R.s, P = R.P;
    var c = pj([L / 2, H, W / 2]), rx = r * k, ry = rx * 0.45; s += '<ellipse cx="' + (c[0] + f.dx) + '" cy="' + (c[1] + f.dy) + '" rx="' + rx + '" ry="' + ry + '" fill="#1a1f29" fill-opacity=".55" stroke-width="1.4"/>';
    var cb = pj([L / 2, 0, W / 2]); s += '<path d="M' + (c[0] + f.dx - rx) + " " + (c[1] + f.dy) + "V" + (cb[1] + f.dy) + "M" + (c[0] + f.dx + rx) + " " + (c[1] + f.dy) + "V" + (cb[1] + f.dy) + '" stroke-dasharray="3 3" stroke-width=".9"/>';
    labs = labs || []; if (labs[0]) s += dim(P[0], P[1], labs[0], f, 1); if (labs[1]) s += dim(P[1], P[5], labs[1], f, 1); if (labs[2]) s += dim(P[5], P[6], labs[2], f, 1);
    return F.svg(f.w + 8, f.h, s, { k: 0.85 });
  };
  /* 展開圖 */
  F.net = function (kind) {
    var u = 34, s = "", sq = function (x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (c || TN.g) + '" fill-opacity=".3" stroke-width="1.4"/>'; };
    if (kind === "cube") { [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]].forEach(function (p) { s += sq(6 + p[0] * u, 6 + p[1] * u, u, u); }); return F.svg(4 * u + 12, 3 * u + 12, s, { k: 0.85 }); }
    if (kind === "cylinder") { s = '<circle cx="' + (6 + 80) + '" cy="26" r="20" fill="' + TN.b + '" fill-opacity=".3" stroke-width="1.4"/>' + sq(6, 46, 160, 56, TN.b) + '<circle cx="86" cy="122" r="20" fill="' + TN.b + '" fill-opacity=".3" stroke-width="1.4"/>'; return F.svg(172, 148, s, { k: 0.85 }); }
    if (kind === "tri") { s = sq(6, 40, 40, 70, TN.p) + sq(46, 40, 40, 70, TN.p) + sq(86, 40, 40, 70, TN.p) + F.P([[46, 40], [86, 40], [66, 6]], { f: TN.p, fo: 0.3, w: 1.4 }) + F.P([[46, 110], [86, 110], [66, 144]], { f: TN.p, fo: 0.3, w: 1.4 }); return F.svg(132, 150, s, { k: 0.85 }); }
    if (kind === "cone") { s = '<path d="M80 10L20 100A80 80 0 0 0 140 100Z" fill="' + TN.y + '" fill-opacity=".3" stroke-width="1.4"/><circle cx="80" cy="130" r="22" fill="' + TN.y + '" fill-opacity=".3" stroke-width="1.4"/>'; return F.svg(160, 158, s, { k: 0.8 }); }
    return "";
  };

  /* ========== 解題輔助圖 ========== */
  /* 線段圖：rows = [{lab:"哥哥", parts:[{v:3,t:"?"},{v:2,t:"多 4",c:"r"}], tot:"共 20"}]，scale 依最大總長 */
  F.segs = function (rows, o) {
    o = o || {}; var mx = 0; rows.forEach(function (r) { var t = 0; r.parts.forEach(function (p) { t += p.v; }); r.tv = t; if (t > mx) mx = t; });
    var W = o.w || 300, x0 = 58, u = (W - x0 - 20) / mx, y = 36, s = "", rowY = [];
    rows.forEach(function (r) {
      var x = x0; s += T(x0 - 8, y + 8, r.lab, { z: 12, a: "end" });
      r.parts.forEach(function (p) { var w = p.v * u, c = p.c ? TN[p.c] : TN.b; s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="16" fill="' + c + '" fill-opacity="' + (p.dash ? 0.12 : 0.45) + '"' + (p.dash ? ' stroke-dasharray="3 3"' : "") + ' stroke-width="1.2"/>'; if (p.t) s += brace(x, x + w, y - 3, p.t, -1); x += w; });
      if (r.tot) s += brace(x0, x, y + 19, r.tot, 1);
      rowY.push(y); y += r.tot ? 52 : 40;
    });
    if (o.total) { var xr = x0 + mx * u + 8, y1 = rowY[0], y2 = rowY[rowY.length - 1] + 16; s += '<path d="M' + xr + " " + y1 + "q6 0 6 6V" + ((y1 + y2) / 2 - 4) + "l5 4-5 4V" + (y2 - 6) + "q0 6-6 6" + '" stroke-width="1.1"/>' + T(xr + 14, (y1 + y2) / 2, o.total, { z: 12, a: "start" }); W += 60; }
    return F.svg(W, y - 6, s, { k: o.k || 0.85 });
  };
  function brace(x1, x2, y, t, dir) { var m = (x1 + x2) / 2, d = 6 * dir; return '<path d="M' + (x1 + 1) + " " + y + "q0 " + d + " 6 " + d + "H" + (m - 4) + "l4 " + d + "l4 " + -d + "H" + (x2 - 7) + "q6 0 6 " + -d + '" stroke-width="1"/>' + T(m, y + d * 3.3, t, { z: 11 }); }
  F.brace = brace;
  /* 相遇、相離、追趕：kind = meet / apart / chase */
  F.track = function (kind, la, lb, tot) {
    var s = F.L(20, 50, 300, 50, { w: 2 }), A = kind === "chase" ? 20 : kind === "apart" ? 150 : 20, B = kind === "chase" ? 130 : kind === "apart" ? 170 : 300;
    s += '<circle cx="' + A + '" cy="50" r="5" fill="' + TN.r + '"/><circle cx="' + B + '" cy="50" r="5" fill="' + TN.b + '"/>';
    function arrow(x, dir, lab, y) { var x2 = x + dir * 60; return '<path d="M' + x + " " + y + "H" + x2 + "M" + (x2 - dir * 7) + " " + (y - 5) + "L" + x2 + " " + y + "L" + (x2 - dir * 7) + " " + (y + 5) + '" stroke-width="1.6"/>' + T((x + x2) / 2, y - 11, lab, { z: 11 }); }
    if (kind === "meet") s += arrow(A, 1, la, 30) + arrow(B, -1, lb, 30) + brace(20, 300, 60, tot, 1);
    if (kind === "apart") s += arrow(A, -1, la, 30) + arrow(B, 1, lb, 30) + (tot ? brace(20, 300, 60, tot, 1) : "");
    if (kind === "chase") s += arrow(A, 1, la, 30) + arrow(B, 1, lb, 30) + brace(A, B, 60, tot, 1);
    return F.svg(320, 92, s, { k: 0.9 });
  };
  F.river = function (up) { var s = ""; for (var i = 0; i < 3; i++) s += '<path d="M' + (20 + i * 100) + " " + (78 + (i % 2) * 6) + "q20 -8 40 0t40 0" + '" stroke="' + TN.b + '" stroke-width="1.6"/>'; s += '<path d="M120 60H200L190 74H130Z" fill="' + TN.y + '" fill-opacity=".6" stroke-width="1.4"/>' + F.L(160, 60, 160, 32, { w: 1.4 }) + '<path d="M160 34L180 54H160Z" fill="' + TN.r + '" fill-opacity=".5"/>'; s += '<path d="M' + (up ? "230 46H290M283 40l7 6-7 6" : "90 46H30M37 40l-7 6 7 6") + '" stroke-width="1.6"/>' + T(up ? 260 : 60, 34, "船", { z: 11 }) + '<path d="M240 100H300M293 94l7 6-7 6" stroke="' + TN.b + '" stroke-width="1.6"/>' + T(270, 114, "水流", { z: 11 }); return F.svg(320, 122, s, { k: 0.85 }); };
  /* 三角形（依角度畫），labs：三個角的文字，可用 "?" */
  F.triAng = function (A, B, labs) {
    var a = (A * Math.PI) / 180, b = (B * Math.PI) / 180, base = 220, h = base / (1 / Math.tan(a) + 1 / Math.tan(b)), cx = h / Math.tan(a), P = [[0, 0], [base, 0], [cx, -h]];
    var f = fit(P, 30), s = F.P(P.map(function (p) { return [p[0] + f.dx, p[1] + f.dy]; }), { f: TN.g, fo: 0.2, w: 1.8 });
    var C = 180 - A - B, ang = [A, B, C];
    [[0, 0, a], [1, Math.PI - b, Math.PI], [2, Math.PI + a, 2 * Math.PI - b]].forEach(function (q, i) { var p = P[q[0]], r = 22, s1 = q[1], e1 = q[2]; if (i === 0) { s1 = -a; e1 = 0; } if (i === 1) { s1 = Math.PI; e1 = Math.PI + b; } if (i === 2) { s1 = Math.atan2(P[0][1] - p[1], P[0][0] - p[0]); e1 = Math.atan2(P[1][1] - p[1], P[1][0] - p[0]); } var x1 = p[0] + f.dx + r * Math.cos(s1), y1 = p[1] + f.dy + r * Math.sin(s1), x2 = p[0] + f.dx + r * Math.cos(e1), y2 = p[1] + f.dy + r * Math.sin(e1); s += '<path d="M' + x1 + " " + y1 + "A" + r + " " + r + " 0 0 " + (i === 2 ? 0 : 1) + " " + x2 + " " + y2 + '" stroke="#bf5b43" stroke-width="1.3"/>'; var mid = (s1 + e1) / 2; if (i === 2) mid = (s1 + e1) / 2; var lx = p[0] + f.dx + (r + 16) * Math.cos(mid), ly = p[1] + f.dy + (r + 16) * Math.sin(mid); if (i === 0) { lx = p[0] + f.dx + 40; ly = p[1] + f.dy - 10; } if (i === 1) { lx = p[0] + f.dx - 40; ly = p[1] + f.dy - 10; } if (i === 2) { lx = p[0] + f.dx; ly = p[1] + f.dy + 36; } s += T(lx, ly, labs[i], { z: 12, w: labs[i] === "?" ? 700 : null }); });
    return F.svg(f.w, f.h, s, { k: 0.85 });
  };
  /* 正 n 邊形，從一個頂點畫出所有對角線 */
  F.polyDiag = function (n) { var P = [], i, s = ""; for (i = 0; i < n; i++) { var t = -Math.PI / 2 + (i * 2 * Math.PI) / n; P.push([70 + 58 * Math.cos(t), 70 + 58 * Math.sin(t)]); } s += F.P(P, { f: TN.y, fo: 0.25, w: 1.8 }); for (i = 2; i < n - 1; i++) s += F.L(P[0][0], P[0][1], P[i][0], P[i][1], { d: "4 3", c: "#bf5b43" }); return F.svg(140, 140, s, { k: 0.75 }); };
  /* 平角／直角／周角被分成兩個角 */
  F.angSplit = function (tot, a, labs) {
    var s = "", cx = 110, cy = 92, R = 80, b = (a * Math.PI) / 180;
    if (tot === 180) s += F.L(cx - R, cy, cx + R, cy, { w: 2 }); else if (tot === 90) s += F.L(cx, cy, cx + R, cy, { w: 2 }) + F.L(cx, cy, cx, cy - R, { w: 2 }) + '<path d="M' + (cx + 10) + " " + cy + "v-10h-10" + '"/>'; else s += F.L(cx, cy, cx + R, cy, { w: 2 }) + '<circle cx="' + cx + '" cy="' + cy + '" r="26" stroke-dasharray="3 3"/>';
    s += F.L(cx, cy, cx + R * Math.cos(b), cy - R * Math.sin(b), { w: 2 });
    s += '<path d="M' + (cx + 22) + " " + cy + "A22 22 0 0 0 " + (cx + 22 * Math.cos(b)) + " " + (cy - 22 * Math.sin(b)) + '" stroke="#bf5b43"/>' + T(cx + 40 * Math.cos(b / 2), cy - 40 * Math.sin(b / 2), labs[0], { z: 12 });
    var mid = (b + (tot * Math.PI) / 180) / 2; s += T(cx + 40 * Math.cos(mid), cy - 40 * Math.sin(mid), labs[1], { z: 12, w: 700 });
    return F.svg(220, tot === 360 ? 130 : 104, s, { k: 0.8 });
  };
  /* 三根小棒 */
  F.sticks = function (a, b, c) { var m = Math.max(a, b, c), u = 220 / m, s = ""; [a, b, c].forEach(function (v, i) { s += '<rect x="40" y="' + (8 + i * 22) + '" width="' + v * u + '" height="10" rx="4" fill="' + [TN.r, TN.b, TN.g][i] + '" fill-opacity=".7" stroke-width="1"/>' + T(32, 13 + i * 22, v, { z: 11, a: "end" }); }); return F.svg(270, 76, s, { k: 0.85 }); };
  /* 百格圖（百分率、二位小數） */
  F.hgrid = function (n, o) { o = o || {}; var u = 11, s = ""; for (var i = 0; i < 100; i++) { var x = 4 + (i % 10) * u, y = 4 + Math.floor(i / 10) * u; s += '<rect x="' + x + '" y="' + y + '" width="' + u + '" height="' + u + '" fill="' + (i < n ? o.c || TN.r : "none") + '" fill-opacity=".7" stroke-width=".5"/>'; } return F.svg(10 * u + 8, 10 * u + 8, s, { k: o.k || 0.9 }); };
  /* 袋子裡的球 */
  F.bag = function (cols) { var s = '<path d="M30 30Q20 120 70 124Q120 120 110 30Z" fill="' + TN.y + '" fill-opacity=".18" stroke-width="1.6"/><path d="M34 30Q70 18 106 30" stroke-width="1.6"/>', k = 0; cols.forEach(function (c) { for (var i = 0; i < c.n; i++) { s += '<circle cx="' + (46 + (k % 4) * 16) + '" cy="' + (104 - Math.floor(k / 4) * 16) + '" r="7" fill="' + c.c + '" stroke-width="1"/>'; k++; } }); return F.svg(140, 130, s, { k: 0.75 }); };
  /* 握手：n 個點兩兩連線 */
  F.handshake = function (n) { var P = [], i, j, s = ""; for (i = 0; i < n; i++) { var t = -Math.PI / 2 + (i * 2 * Math.PI) / n; P.push([70 + 54 * Math.cos(t), 68 + 54 * Math.sin(t)]); } for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) s += F.L(P[i][0], P[i][1], P[j][0], P[j][1], { w: 0.8, c: "#7a8494" }); P.forEach(function (p, k) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" fill="' + TN.r + '" stroke-width="1.2"/>' + T(p[0], p[1] + 1, String.fromCharCode(65 + k), { z: 9 }); }); return F.svg(140, 138, s, { k: 0.75 }); };
  /* 樹狀圖：a 件上衣 × b 件褲子 */
  F.tree = function (a, b) { var s = "", i, j, H = Math.max(a * b * 16, 60); for (i = 0; i < a; i++) { var y = ((i + 0.5) * H) / a + 6; s += '<rect x="8" y="' + (y - 9) + '" width="40" height="18" rx="4" fill="' + TN.r + '" fill-opacity=".35"/>' + T(28, y, "上衣" + (i + 1), { z: 9 }); for (j = 0; j < b; j++) { var y2 = ((i * b + j + 0.5) * H) / (a * b) + 6; s += F.L(48, y, 100, y2, { w: 0.9 }) + '<rect x="100" y="' + (y2 - 7) + '" width="40" height="14" rx="4" fill="' + TN.b + '" fill-opacity=".35"/>' + T(120, y2, "褲子" + (j + 1), { z: 8 }); } } return F.svg(148, H + 12, s, { k: 0.85 }); };
  /* 罐頭堆成三角形 */
  F.cans = function (n) { var s = "", r = Math.min(12, 120 / n); for (var row = 0; row < n; row++) for (var i = 0; i <= row; i++) { var x = 10 + (n - row - 1) * r + i * 2 * r + r, y = 10 + row * r * 1.8 + r; s += '<circle cx="' + x + '" cy="' + y + '" r="' + (r - 1) + '" fill="' + TN.y + '" fill-opacity=".6" stroke-width="1"/>'; } return F.svg(2 * n * r + 20, n * r * 1.8 + 20, s, { k: 0.85 }); };
  /* 桌子排成一排，每張旁邊坐人 */
  F.tables = function (n) { var u = 30, s = ""; for (var i = 0; i < n; i++) { s += '<rect x="' + (20 + i * u) + '" y="26" width="' + u + '" height="' + u + '" fill="' + TN.y + '" fill-opacity=".35" stroke-width="1.4"/>' + '<circle cx="' + (35 + i * u) + '" cy="14" r="6" fill="' + TN.r + '"/><circle cx="' + (35 + i * u) + '" cy="68" r="6" fill="' + TN.r + '"/>'; } s += '<circle cx="8" cy="41" r="6" fill="' + TN.b + '"/><circle cx="' + (32 + n * u) + '" cy="41" r="6" fill="' + TN.b + '"/>'; return F.svg(n * u + 42, 80, s, { k: 0.8 }); };
  /* 小棒排正方形：前三個圖形 */
  F.matches = function (per, add, k) {
    var s = "", x = 6, u = 20;
    for (var g = 1; g <= (k || 3); g++) { var n = g; for (var i = 0; i < n; i++) { var X = x + i * u; s += '<path d="M' + X + " 10H" + (X + u) + "M" + X + " " + (10 + u) + "H" + (X + u) + "M" + (X + u) + " 10V" + (10 + u) + '" stroke="#b5762f" stroke-width="3"/>'; } s += '<path d="M' + x + " 10V" + (10 + u) + '" stroke="#b5762f" stroke-width="3"/>' + T(x + (n * u) / 2, 46, "第 " + g + " 個", { z: 10 }); x += n * u + 24; }
    return F.svg(x, 54, s, { k: 0.85 });
  };
  /* 圍棋排列：第 k 個圖形是 a 顆加上 k 排、每排 b 顆 */
  F.stones = function (a, b, k) { var s = "", x = 8; for (var g = 1; g <= (k || 3); g++) { var cols = g, i, j; for (i = 0; i < a; i++) s += '<circle cx="' + x + '" cy="' + (12 + i * 12) + '" r="5" fill="' + TN.r + '"/>'; for (j = 0; j < cols; j++) for (i = 0; i < b; i++) s += '<circle cx="' + (x + 12 + j * 12) + '" cy="' + (12 + i * 12) + '" r="5" fill="#1a1f29"/>'; s += T(x + (cols * 12) / 2 + 6, 12 + Math.max(a, b) * 12 + 6, "第 " + g + " 個", { z: 10 }); x += cols * 12 + 34; } return F.svg(x, Math.max(a, b) * 12 + 30, s, { k: 0.85 }); };
  /* 地圖比例尺 */
  F.mapScale = function (cm, scale) { var u = 22, s = '<rect x="4" y="4" width="' + (cm * u + 60) + '" height="64" rx="8" fill="' + TN.g + '" fill-opacity=".12" stroke-dasharray="4 3"/>'; s += '<circle cx="30" cy="30" r="5" fill="' + TN.r + '"/>' + T(30, 16, "甲地", { z: 10 }) + '<circle cx="' + (30 + cm * u) + '" cy="30" r="5" fill="' + TN.b + '"/>' + T(30 + cm * u, 16, "乙地", { z: 10 }) + F.L(30, 30, 30 + cm * u, 30, { d: "4 3" }) + T(30 + (cm * u) / 2, 44, cm + " 公分", { z: 10 }); s += '<path d="M14 58H' + (14 + u) + '" stroke-width="3"/>' + T(20 + u, 58, "比例尺 1：" + fmt(scale), { z: 9, a: "start" }); return F.svg(cm * u + 70, 74, s, { k: 0.85 }); };
  /* 放大圖：原圖 a×b，放大 k 倍 */
  F.enlarge = function (a, b, k) { var u = 10, W = a * k + a + 6, H = b * k + 2, s = ""; for (var i = 0; i <= W; i++) s += F.L(4 + i * u, 4, 4 + i * u, 4 + H * u, { w: 0.4 }); for (var j = 0; j <= H; j++) s += F.L(4, 4 + j * u, 4 + W * u, 4 + j * u, { w: 0.4 }); s += '<rect x="' + (4 + u) + '" y="' + (4 + u) + '" width="' + a * u + '" height="' + b * u + '" fill="' + TN.b + '" fill-opacity=".5" stroke-width="1.6"/>' + '<rect x="' + (4 + (a + 3) * u) + '" y="' + (4 + u) + '" width="' + a * k * u + '" height="' + b * k * u + '" fill="' + TN.r + '" fill-opacity=".3" stroke-width="1.6" stroke-dasharray="5 3"/>'; return F.svg(W * u + 8, H * u + 8, s, { k: 0.85 }); };
  /* 時間軸：從 t1 到 t2（分鐘數），可跨日 */
  function hm(m) { m = ((m % 1440) + 1440) % 1440; return Math.floor(m / 60) + ":" + ("0" + (m % 60)).slice(-2); }
  F.timeline = function (t1, t2, lab) { var s = F.L(16, 40, 300, 40, { w: 1.6 }) + '<path d="M296 35l6 5-6 5"/>'; s += '<circle cx="40" cy="40" r="4" fill="' + TN.r + '"/><circle cx="270" cy="40" r="4" fill="' + TN.b + '"/>' + T(40, 58, hm(t1), { z: 12 }) + T(270, 58, hm(t2), { z: 12 }) + F.brace(40, 270, 30, lab || "經過多久？", -1); if (t2 >= 1440 || t2 < t1) s += F.L(200, 32, 200, 48, { d: "2 2" }) + T(200, 58, "0:00", { z: 10, c: "#888" }); return F.svg(310, 66, s, { k: 0.9 }); };
  /* 分合圖（一年級） */
  F.bond = function (t, a, b) { var s = '<circle cx="60" cy="20" r="16" fill="' + TN.y + '" fill-opacity=".5" stroke-width="1.4"/>' + T(60, 21, t, { z: 14, w: 700 }) + F.L(50, 34, 32, 58) + F.L(70, 34, 88, 58) + '<circle cx="28" cy="72" r="16" fill="' + TN.b + '" fill-opacity=".35" stroke-width="1.4"/>' + T(28, 73, a, { z: 14, w: 700 }) + '<circle cx="92" cy="72" r="16" fill="' + TN.b + '" fill-opacity=".35" stroke-width="1.4"/>' + T(92, 73, b, { z: 14, w: 700 }); return F.svg(120, 92, s, { k: 0.8 }); };
  /* 積木（百格板、十條、一個）表示一個數 */
  F.blocks = function (h, t, o) { var s = "", x = 4, i, u = 7; for (i = 0; i < h; i++) { s += '<rect x="' + x + '" y="4" width="' + 10 * u + '" height="' + 10 * u + '" fill="' + TN.b + '" fill-opacity=".35" stroke-width="1"/>'; for (var g = 1; g < 10; g++) s += F.L(x + g * u, 4, x + g * u, 4 + 10 * u, { w: 0.4 }) + F.L(x, 4 + g * u, x + 10 * u, 4 + g * u, { w: 0.4 }); x += 10 * u + 8; } for (i = 0; i < t; i++) { s += '<rect x="' + x + '" y="4" width="' + u + '" height="' + 10 * u + '" fill="' + TN.g + '" fill-opacity=".5" stroke-width="1"/>'; for (g = 1; g < 10; g++) s += F.L(x, 4 + g * u, x + u, 4 + g * u, { w: 0.4 }); x += u + 4; } x += 4; for (i = 0; i < o; i++) { s += '<rect x="' + (x + (i % 3) * (u + 3)) + '" y="' + (4 + 10 * u - u - Math.floor(i / 3) * (u + 3)) + '" width="' + u + '" height="' + u + '" fill="' + TN.y + '" fill-opacity=".8" stroke-width="1"/>'; } x += 3 * (u + 3); return F.svg(x + 4, 10 * u + 8, s, { k: 0.85 }); };
  /* 位值表 */
  F.pvTable = function (digs, heads) { return F.table(heads, [digs], { rowHead: false }); };
  /* 分組圖：k 組、每組 a 個 */
  F.groups = function (a, k, o) { o = o || {}; var s = "", x = 4, per = Math.min(a, 5), rows = Math.ceil(a / per); for (var g = 0; g < k; g++) { var w = per * 14 + 8; s += '<rect x="' + x + '" y="2" width="' + w + '" height="' + (rows * 14 + 8) + '" rx="8" stroke-dasharray="3 3" stroke-width="1"/>'; for (var i = 0; i < a; i++) s += '<circle cx="' + (x + 11 + (i % per) * 14) + '" cy="' + (11 + Math.floor(i / per) * 14) + '" r="5" fill="' + (o.c || TN.r) + '"/>'; x += w + 6; } return F.svg(x, rows * 14 + 12, s, { k: 0.85 }); };
  /* 天平（以積木當單位） */
  F.balance = function (lab, n) { var s = '<path d="M90 100V30M40 100H140" stroke-width="2"/><path d="M20 40H160" stroke-width="2"/><path d="M30 40L20 60H60L50 40M130 40L120 60H160L150 40" stroke-width="1.2"/>' + T(40, 74, lab, { z: 11 }); for (var i = 0; i < n; i++) s += '<rect x="' + (122 + (i % 4) * 9) + '" y="' + (50 - Math.floor(i / 4) * 9) + '" width="8" height="8" fill="' + TN.y + '" stroke-width=".8"/>'; return F.svg(180, 108, s, { k: 0.8 }); };
  /* 分數面積模型：a/b × c/d */
  F.areaModel = function (a, b, c, d) { var W = 160, H = 120, s = ""; for (var i = 0; i < b; i++) for (var j = 0; j < d; j++) { var on1 = i < a, on2 = j < c; s += '<rect x="' + (6 + (i * W) / b) + '" y="' + (6 + (j * H) / d) + '" width="' + W / b + '" height="' + H / d + '" fill="' + (on1 && on2 ? TN.r : on1 ? TN.y : on2 ? TN.b : "none") + '" fill-opacity="' + (on1 && on2 ? 0.75 : 0.3) + '" stroke-width=".8"/>'; } s += '<rect x="6" y="6" width="' + W + '" height="' + H + '" stroke-width="1.8"/>'; return F.svg(W + 12, H + 12, s, { k: 0.75 }); };
  /* 平均：長條＋平均線 */
  F.avgBars = function (vals, avg) { var mx = Math.max.apply(0, vals.concat([avg])), H = 110, bw = 26, s = "", n = vals.length; vals.forEach(function (v, i) { var h = (v / mx) * H; s += '<rect x="' + (20 + i * (bw + 12)) + '" y="' + (10 + H - h) + '" width="' + bw + '" height="' + h + '" fill="' + TN.b + '" fill-opacity=".55" stroke-width="1"/>' + T(20 + i * (bw + 12) + bw / 2, 10 + H - h - 7, v, { z: 10 }); }); var y = 10 + H - (avg / mx) * H; s += F.L(12, y, 28 + n * (bw + 12), y, { d: "5 3", c: "#bf5b43", w: 1.6 }) + T(32 + n * (bw + 12), y, "平均？", { z: 10, a: "start", c: "#bf5b43" }); return F.svg(n * (bw + 12) + 90, H + 18, s, { k: 0.85 }); };
  /* 方格紙上的對稱軸與點 */
  F.symGrid = function (ax, px, py) { var u = 18, W = 2 * ax + 2, H = 7, s = ""; for (var i = 0; i <= W; i++) s += F.L(4 + i * u, 4, 4 + i * u, 4 + H * u, { w: i === ax ? 2.2 : 0.5, c: i === ax ? "#bf5b43" : null, d: i === ax ? "6 3" : null }); for (var j = 0; j <= H; j++) s += F.L(4, 4 + j * u, 4 + W * u, 4 + j * u, { w: 0.5 }); s += '<circle cx="' + (4 + px * u) + '" cy="' + (4 + py * u) + '" r="4.5" fill="#1a1f29"/>' + T(4 + px * u - 8, 4 + py * u - 9, "A", { z: 11 }); for (i = 0; i <= W; i += 1) s += T(4 + i * u, H * u + 16, i, { z: 8, c: "#777" }); return F.svg(W * u + 8, H * u + 22, s, { k: 0.85 }); };
  /* 正方形與四分之一圓、正方形內切圓 */
  F.sqQuarter = function (lab) { var s = '<rect x="10" y="10" width="140" height="140" fill="' + TN.y + '" fill-opacity=".35" stroke-width="1.8"/><path d="M10 150V10A140 140 0 0 1 150 150Z" fill="#fff" fill-opacity=".9" stroke-width="1.4"/>' + T(80, 166, lab, { z: 12 }); return F.svg(160, 174, s, { k: 0.7 }); };
  F.sqCircle = function (lab) { var s = '<rect x="10" y="10" width="140" height="140" fill="' + TN.r + '" fill-opacity=".3" stroke-width="1.8"/><circle cx="80" cy="80" r="70" fill="#fff" fill-opacity=".9" stroke-width="1.4"/>' + T(80, 166, lab, { z: 12 }); return F.svg(160, 174, s, { k: 0.7 }); };
  /* 數線上的取概數 */
  F.roundLine = function (n, unit) { var lo = Math.floor(n / unit) * unit, hi = lo + unit; return F.nline(lo, hi, unit / 10, n, { label: 5, qlab: [fmt(n)] }); };
  /* 十格框（湊十） */
  F.tenFrame = function (a, b) { var s = "", u = 22; for (var i = 0; i < 10; i++) { var x = 4 + (i % 5) * u, y = 4 + Math.floor(i / 5) * u; s += '<rect x="' + x + '" y="' + y + '" width="' + u + '" height="' + u + '" stroke-width="1"/>'; if (i < a) s += '<circle cx="' + (x + u / 2) + '" cy="' + (y + u / 2) + '" r="7" fill="' + TN.r + '"/>'; else if (i < a + b) s += '<circle cx="' + (x + u / 2) + '" cy="' + (y + u / 2) + '" r="7" fill="' + TN.b + '"/>'; } return F.svg(5 * u + 8, 2 * u + 8, s, { k: 0.85 }); };
  /* 短除法（求最大公因數、最小公倍數） */
  F.shortDiv = function (a, b, md) {
    var rows = [], x = a, y = b, p; while (true) { p = 0; for (var d = 2; d <= Math.min(x, y); d++) if (x % d === 0 && y % d === 0 && D.isPrime(d)) { p = d; break; } if (!p) break; rows.push([p, x, y]); x /= p; y /= p; }
    var u = 30, s = "", show = md === "a", n = rows.length;
    for (var i = 0; i <= n; i++) { var Y = 10 + i * u; if (i < n) { s += T(14, Y + 16, show ? rows[i][0] : "", { z: 14, c: "#c0392b" }) + '<path d="M26 ' + (Y + 2) + "V" + (Y + u) + "H" + (26 + 3 * u) + '" stroke-width="1.3"/>'; } s += T(26 + u * 0.9, Y + 16, i === 0 ? a : show ? (i < n ? rows[i][1] : x) : "", { z: 14, c: i ? "#c0392b" : null }) + T(26 + u * 2.2, Y + 16, i === 0 ? b : show ? (i < n ? rows[i][2] : y) : "", { z: 14, c: i ? "#c0392b" : null }); }
    if (!n && !show) s += '<path d="M26 12V' + (10 + u) + "H" + (26 + 3 * u) + '" stroke-width="1.3"/>';
    return F.svg(26 + 3 * u + 10, 10 + (Math.max(n, 1) + 1) * u, s, { k: 0.8 });
  };
  /* 依三邊長畫三角形（等比例），邊上標字 */
  F.triSides = function (a, b, c, labs) { /* a 底邊，b 左邊，c 右邊 */ var x = (a * a + b * b - c * c) / (2 * a), y = Math.sqrt(Math.max(0, b * b - x * x)), k = 200 / Math.max(a, y * 1.3, 1); return F.poly([[0, 0], [a * k, 0], [x * k, -y * k]], labs || [a + "", c + "", b + ""], { f: TN.g }); };
  /* 正 n 邊形 */
  F.ngon = function (n) { var P = []; for (var i = 0; i < n; i++) { var t = -Math.PI / 2 + (i * 2 * Math.PI) / n; P.push([60 + 50 * Math.cos(t), 60 + 50 * Math.sin(t)]); } return F.svg(120, 120, F.P(P, { f: TN.p, fo: 0.3, w: 2 }), { k: 0.6 }); };
})();
