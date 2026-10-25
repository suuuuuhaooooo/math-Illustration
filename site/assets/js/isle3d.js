/* 數光群島（3D）：22 條主題線各是一座六角形浮島，依領域分色（數與量、空間與形狀、關係、資料與不確定性）。
   島上的小房子＝各年級的章（年級越高越高），島與島之間的光弧＝先備關係（先學那座，才接得上這座）。
   純 Canvas 自己做投影與排序，不用外部套件；可拖曳旋轉、滾輪／雙指縮放、點選。天空跟著時間從清晨到夜晚。
   用法：NB.isle3d.mount(容器, { onPick(themeName) }) → { focus(themeName), setGrade(g), setTime(mode), setLinks(on), search(q), destroy() } */
(function () {
  "use strict";
  var M = window.NB_MAP, SQ3 = Math.sqrt(3), TAU = Math.PI * 2;
  var DOM = { N: { name: "數與量", top: [118, 186, 120], side: [150, 112, 74] }, S: { name: "空間與形狀", top: [96, 182, 196], side: [120, 104, 86] }, R: { name: "關係", top: [178, 150, 222], side: [128, 100, 90] }, D: { name: "資料與不確定性", top: [240, 176, 96], side: [140, 104, 72] } };
  /* 數與量的島依「數 → 運算 → 分小數 → 比例」和「量」排成相鄰，空間與形狀依「平面 → 角 → 圓 → 面積 → 立體」 */
  var ORDER = { N: ["整數與位值", "加法與減法", "乘法", "除法", "四則與規律", "分數", "小數", "因數與倍數", "概數與估算", "比與比例", "速率", "時間", "錢幣", "長度", "重量與容量", "體積與容積"], S: ["平面圖形", "角與角度", "圓", "面積", "立體形體"], D: ["統計與資料"] };
  var GRADE_COL = [null, [255, 214, 120], [255, 168, 140], [140, 200, 255], [190, 160, 255], [130, 220, 170], [255, 140, 190]];
  var GN = "一二三四五六";

  /* ---------- 資料：主題 → 領域、章、先備邊 ---------- */
  function buildData() {
    var th = Object.keys(M.th), dom = {}, chs = {};
    th.forEach(function (t) { var cnt = {}; M.th[t].forEach(function (c) { var d = M.ch[c] && M.ch[c].d; if (d) cnt[d] = (cnt[d] || 0) + 1; }); var best = "N", n = -1; Object.keys(cnt).forEach(function (d) { if (cnt[d] > n) { n = cnt[d]; best = d; } }); dom[t] = best; });
    /* 四則與規律多半是「關係」領域；如果資料這樣標，就自己成一區 */
    var groups = { N: [], S: [], R: [], D: [] };
    th.forEach(function (t) { groups[dom[t]].push(t); });
    Object.keys(groups).forEach(function (d) { var o = ORDER[d] || []; groups[d].sort(function (a, b) { var i = o.indexOf(a), j = o.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); }); });
    th.forEach(function (t) { chs[t] = M.th[t].slice(); });
    var edges = {}, key = function (a, b) { return a + "→" + b; };
    Object.keys(M.ch).forEach(function (c) { var C = M.ch[c]; (C.p || []).forEach(function (p) { var P = M.ch[p]; if (!P) return; P.t.forEach(function (a) { C.t.forEach(function (b) { if (a !== b) { var k = key(a, b); edges[k] = edges[k] || { a: a, b: b, n: 0, pairs: [] }; edges[k].n++; edges[k].pairs.push([p, c]); } }); }); }); });
    return { themes: th, dom: dom, groups: groups, chs: chs, edges: Object.keys(edges).map(function (k) { return edges[k]; }) };
  }
  /* 章的名稱與小節：從目錄（catalog）找 */
  function chapterInfo(cid) {
    var m = /^(\d)([ud])-(\d+)$/.exec(cid); if (!m || !NB.cat) return null;
    var S = NB.cat.filter(function (x) { return x.id === m[1] + m[2]; })[0]; if (!S) return null;
    var c = S.chs[+m[3] - 1]; if (!c) return null;
    return { id: cid, grade: +m[1], sem: S.sem, no: c.no, name: c.name, secs: c.secs };
  }

  /* ---------- 版面：島的位置（尖頂六角格，西邊數與量、東邊空間與形狀） ---------- */
  function layout(D) {
    var cells = [];
    for (var q = -4; q <= 4; q++) for (var r = -4; r <= 4; r++) { var s = -q - r; if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= 3) cells.push({ q: q, r: r, x: q + r / 2, z: r * SQ3 / 2 }); }
    cells.sort(function (a, b) { return (a.x * a.x + a.z * a.z * 1.3) - (b.x * b.x + b.z * b.z * 1.3) || a.x - b.x; });
    var n = D.themes.length, use = cells.slice(0, n).sort(function (a, b) { return a.x - b.x || a.z - b.z; }), pos = {};
    var nN = D.groups.N.length, west = use.slice(0, nN), east = use.slice(nN);
    function spiral(list, names) { /* 繞著這一區的中心排，讓順序相鄰的主題也相鄰 */
      if (!list.length) return; var cx = 0, cz = 0; list.forEach(function (c) { cx += c.x; cz += c.z; }); cx /= list.length; cz /= list.length;
      list.sort(function (a, b) { var ra = Math.hypot(a.x - cx, a.z - cz), rb = Math.hypot(b.x - cx, b.z - cz); if (Math.abs(ra - rb) > .6) return ra - rb; return Math.atan2(a.z - cz, a.x - cx) - Math.atan2(b.z - cz, b.x - cx); });
      names.forEach(function (t, i) { if (list[i]) pos[t] = list[i]; });
    }
    spiral(west, D.groups.N);
    east.sort(function (a, b) { return a.z - b.z; });
    var R = D.groups.R, Dd = D.groups.D, S = D.groups.S, top = east.splice(0, R.length), bottom = east.splice(east.length - Dd.length, Dd.length);
    R.forEach(function (t, i) { pos[t] = top[i]; }); Dd.forEach(function (t, i) { pos[t] = bottom[i]; });
    spiral(east, S);
    var cx = 0, cz = 0; D.themes.forEach(function (t) { cx += pos[t].x; cz += pos[t].z; }); cx /= n; cz /= n;
    var SP = 2.55; D.themes.forEach(function (t) { var p = pos[t]; p.wx = (p.x - cx) * SP; p.wz = (p.z - cz) * SP; });
    return pos;
  }
  /* 島上的格位：中心 1、內圈 6、外圈 12（尖頂六角形內） */
  var SLOTS = (function () { var s = [[0, 0]]; for (var i = 0; i < 6; i++) { var a = i * TAU / 6 + Math.PI / 6; s.push([Math.cos(a) * .36, Math.sin(a) * .36]); } for (var j = 0; j < 12; j++) { var b = j * TAU / 12 + Math.PI / 12; var rr = j % 2 ? .66 : .7; s.push([Math.cos(b) * rr, Math.sin(b) * rr]); } return s; })();
  function rnd(seed) { var x = Math.sin(seed * 999.13) * 43758.5453; return x - Math.floor(x); }
  function hashStr(t) { var h = 7; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 100003; return h; }

  /* ---------- 天空與光線（依時間） ---------- */
  var SKIES = {
    dawn: { top: "#f6b98e", mid: "#f9d9b8", bot: "#c8d8f0", sun: [.55, .35, -.75], amb: .62, dif: .5, tint: [255, 226, 200], stars: 0, cloud: "rgba(255,238,225,.85)", label: "清晨" },
    day: { top: "#7cc4f2", mid: "#bfe3f8", bot: "#eaf6ff", sun: [.4, .82, -.45], amb: .58, dif: .55, tint: [255, 255, 255], stars: 0, cloud: "rgba(255,255,255,.9)", label: "白天" },
    dusk: { top: "#6d5aa8", mid: "#e98f7a", bot: "#f7c98f", sun: [-.6, .3, -.7], amb: .5, dif: .5, tint: [255, 200, 170], stars: .2, cloud: "rgba(255,214,200,.75)", label: "黃昏" },
    night: { top: "#0b1430", mid: "#1d2d5c", bot: "#33497f", sun: [-.3, .7, .5], amb: .5, dif: .36, tint: [170, 190, 255], stars: 1, cloud: "rgba(120,140,200,.35)", label: "夜晚" }
  };
  function autoTime() { var h = new Date().getHours(); return h >= 5 && h < 7 ? "dawn" : h >= 7 && h < 17 ? "day" : h >= 17 && h < 19 ? "dusk" : "night"; }

  function mount(box, opt) {
    opt = opt || {};
    var D = buildData(), P = layout(D), reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
    var cv = document.createElement("canvas"); cv.className = "i3-cv"; cv.setAttribute("aria-hidden", "true"); box.insertBefore(cv, box.firstChild);
    var g = cv.getContext("2d"), W = 0, H = 0, DPR = 1;
    var cam = { yaw: -0.5, pitch: 0.62, dist: 17, tx: 0, tz: 0 }, goal = null, idle = 0, t0 = performance.now(), touched = false; /* touched：使用者轉過／縮放過／點過 */
    var state = { grade: 0, time: "auto", links: true, sel: null, hover: null, hits: [], q: "", match: null };
    var info = {}; D.themes.forEach(function (t) { info[t] = D.chs[t].map(chapterInfo).filter(Boolean).sort(function (a, b) { return a.grade - b.grade || a.id.localeCompare(b.id); }); });
    /* 每座島的房子與樹，位置固定（用主題名稱當種子） */
    var deco = {}; D.themes.forEach(function (t) {
      var seed = hashStr(t), list = info[t], used = {}, out = [];
      var order = SLOTS.map(function (s, i) { return i; }).sort(function (a, b) { return rnd(seed + a) - rnd(seed + b); });
      list.forEach(function (c, i) { var si = order[i % order.length]; used[si] = 1; out.push({ kind: "house", c: c, x: SLOTS[si][0], z: SLOTS[si][1], rot: rnd(seed + i * 7) * .6 }); });
      order.forEach(function (si, k) { if (!used[si] && rnd(seed * 3 + si) > .45) out.push({ kind: "tree", x: SLOTS[si][0] + (rnd(seed + si) - .5) * .08, z: SLOTS[si][1] + (rnd(seed + si * 5) - .5) * .08, s: .7 + rnd(seed + si * 11) * .5 }); });
      deco[t] = out;
    });
    var trail = (NB.trail && NB.trail.all()) || {}, flags = [];
    function visited(c) { return c.secs.some(function (o) { return trail[o.id]; }); }
    function explored(t) { return info[t].some(visited); }

    /* ---------- 相機與投影 ---------- */
    var V = {}, off = { x: 0, y: 0 }; /* 打開面板時把畫面往旁邊挪，選到的島不會被面板蓋住 */
    function setupView() {
      var cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      V.ex = cam.tx + cam.dist * cp * sy; V.ey = cam.dist * sp; V.ez = cam.tz + cam.dist * cp * cy;
      var fx = cam.tx - V.ex, fy = -V.ey, fz = cam.tz - V.ez, fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
      var rx = -fz, rz = fx, rl = Math.hypot(rx, rz); rx /= rl; rz /= rl; /* 右＝前 × 上 */
      V.f = [fx, fy, fz]; V.r = [rx, 0, rz]; V.u = [-rz * fy, rz * fx - rx * fz, rx * fy]; /* 上＝右 × 前 */
      V.foc = W < 640 && H > W ? Math.min(W * 1.2, H * .8) : Math.min(W, H * 1.35) * 1.05; /* 手機直放：以高度為準放大 */
    }
    function proj(x, y, z) {
      var dx = x - V.ex, dy = y - V.ey, dz = z - V.ez;
      var vz = dx * V.f[0] + dy * V.f[1] + dz * V.f[2]; if (vz < .1) vz = .1;
      var vx = dx * V.r[0] + dy * V.r[1] + dz * V.r[2], vy = dx * V.u[0] + dy * V.u[1] + dz * V.u[2];
      return [W / 2 + off.x + vx * V.foc / vz, H * .47 + off.y - vy * V.foc / vz, vz];
    }
    var sky, L = [0, 1, 0];
    var FOG = [200, 220, 240];
    function hex2(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    function shade(col, nx, ny, nz, extra, z) {
      var d = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), k = sky.amb + sky.dif * d + (extra || 0), tt = sky.tint;
      var r = Math.min(255, col[0] * k * tt[0] / 255), gg = Math.min(255, col[1] * k * tt[1] / 255), b = Math.min(255, col[2] * k * tt[2] / 255);
      var f = z ? Math.max(0, Math.min(.5, (z - cam.dist * .85) / (cam.dist * 1.6))) : 0; /* 遠的東西淡進天空（空氣感） */
      return "rgb(" + (r + (FOG[0] - r) * f | 0) + "," + (gg + (FOG[1] - gg) * f | 0) + "," + (b + (FOG[2] - b) * f | 0) + ")";
    }
    /* ---------- 幾何：收集多邊形，最後依深度由遠到近畫 ---------- */
    var polys;
    function poly(pts3, col, n, tag, o) {
      var pp = pts3.map(function (p) { return proj(p[0], p[1], p[2]); });
      var a = 0; for (var i = 0; i < pp.length; i++) { var j = (i + 1) % pp.length; a += pp[i][0] * pp[j][1] - pp[j][0] * pp[i][1]; }
      if (o && o.cull !== false && a > 0) return; /* 背對鏡頭的面不畫 */
      var z = 0; pp.forEach(function (p) { z += p[2]; }); z /= pp.length;
      polys.push({ pp: pp, z: z + (o && o.bias || 0), fill: shade(col, n[0], n[1], n[2], o && o.glow, z), tag: tag, line: o && o.line });
    }
    function hexPts(cx, y, cz, R, rot) { var a = []; for (var i = 0; i < 6; i++) { var t = rot + i * TAU / 6; a.push([cx + Math.cos(t) * R, y, cz + Math.sin(t) * R]); } return a; }
    function prism(base, y0, y1, colTop, colSide, tag, o) {
      var top = base.map(function (p) { return [p[0], y1, p[2]]; }), bot = base.map(function (p) { return [p[0], y0, p[2]]; });
      poly(top.slice().reverse(), colTop, [0, 1, 0], tag, Object.assign({ cull: true }, o, o && o.outline ? { line: o.outline } : {}));
      for (var i = 0; i < base.length; i++) {
        var j = (i + 1) % base.length, nx = (base[i][2] - base[j][2]), nz = (base[j][0] - base[i][0]), nl = Math.hypot(nx, nz) || 1;
        poly([top[i], top[j], bot[j], bot[i]], colSide, [nx / nl, 0, nz / nl], tag, Object.assign({ cull: true }, o));
      }
    }
    function cone(base, y0, apex, col, tag, o) {
      for (var i = 0; i < base.length; i++) {
        var j = (i + 1) % base.length, a = base[i], b = base[j];
        var ux = b[0] - a[0], uy = 0, uz = b[2] - a[2], vx = apex[0] - a[0], vy = apex[1] - y0, vz = apex[2] - a[2];
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        poly([[a[0], y0, a[2]], [b[0], y0, b[2]], apex], col, [nx / nl, ny / nl, nz / nl], tag, Object.assign({ cull: false }, o));
      }
    }
    function islandY(t, now) { var p = P[t]; return reduce ? 0 : Math.sin(now / 1400 + hashStr(t) * .37) * .06; }

    function buildScene(now) {
      polys = []; flags = [];
      var gsel = state.grade;
      D.themes.forEach(function (t) {
        var p = P[t], d = DOM[D.dom[t]], y = islandY(t, now), lift = (state.hover === t || state.sel === t) ? .12 : 0;
        var dim = (gsel && !info[t].some(function (c) { return c.grade === gsel; })) || (state.match && !state.match[t]);
        var top = dim ? d.top.map(function (v) { return v * .35 + 150; }) : d.top, side = d.side, R = 1.12, yy = y + lift;
        var base = hexPts(p.wx, 0, p.wz, R, Math.PI / 6), tag = { t: t };
        prism(base, yy - .26, yy, top, [side[0] * 1.05, side[1] * 1.05, side[2] * 1.05], tag, { outline: "rgba(16,26,46,.5)" }); /* 卡通描邊 */
        if (explored(t)) flags.push({ t: t, x: p.wx + Math.cos(-Math.PI / 6) * R * .82, z: p.wz + Math.sin(-Math.PI / 6) * R * .82, y: yy, col: d.top });
        /* 浮島底下的岩石：倒錐 */
        var under = hexPts(p.wx, 0, p.wz, R * .96, Math.PI / 6), apex = [p.wx + .1, yy - 1.55, p.wz - .05];
        for (var i = 0; i < 6; i++) { var a = under[i], b = under[(i + 1) % 6], mx = (a[0] + b[0]) / 2 - p.wx, mz = (a[2] + b[2]) / 2 - p.wz, ml = Math.hypot(mx, mz) || 1; poly([[a[0], yy - .26, a[2]], [b[0], yy - .26, b[2]], apex], [side[0] * .78, side[1] * .74, side[2] * .74], [mx / ml * .8, -.55, mz / ml * .8], tag, { cull: false, bias: .4 }); }
        /* 草地邊緣一圈淺色 */
        deco[t].forEach(function (o, k) {
          var x = p.wx + o.x * R, z = p.wz + o.z * R;
          if (o.kind === "tree") {
            var tb = hexPts(x, 0, z, .07 * o.s, k), ty = yy;
            cone(tb, ty, [x, ty + .34 * o.s, z], dim ? [170, 190, 175] : [70, 150, 90], tag, {});
            return;
          }
          var c = o.c, hide = gsel && c.grade !== gsel, hcol = GRADE_COL[c.grade], lit = visited(c), hit = state.match && state.match[t] && state.match[t][c.id];
          var hh = hide ? .05 : .1 + c.grade * .05, w = .11, bb = [], rot = o.rot;
          for (var q = 0; q < 4; q++) { var an = rot + Math.PI / 4 + q * TAU / 4; bb.push([x + Math.cos(an) * w * SQ3 / 1.2, 0, z + Math.sin(an) * w * SQ3 / 1.2]); }
          var col = hide || dim ? [214, 214, 220] : hcol, night = sky === SKIES.night || sky === SKIES.dusk, glow = hide ? 0 : night ? (lit ? .75 : .28) : hit ? .35 : 0; /* 夜裡每間房子都亮燈，去過的章更亮 */
          var htag = { t: t, c: c.id };
          prism(bb, yy, yy + hh, col, col, htag, { glow: glow });
          cone(bb, yy + hh, [x, yy + hh + .12, z], hide || dim ? [160, 160, 160] : [col[0] * .72, col[1] * .55, col[2] * .55], htag, { glow: glow * .6 });
        });
      });
    }
    /* ---------- 先備線（光弧） ---------- */
    function arcs(now) {
      if (!state.links) return;
      var sel = state.sel, list = D.edges.filter(function (e) { return !sel || e.a === sel || e.b === sel; });
      if (!sel) list = list.filter(function (e) { return e.n >= 2; }); /* 全景只畫比較重要的連線，避免太亂 */
      list.forEach(function (e) {
        var A = P[e.a], B = P[e.b], ya = islandY(e.a, now) + .35, yb = islandY(e.b, now) + .35, dist = Math.hypot(A.wx - B.wx, A.wz - B.wz), hgt = .6 + dist * .22, pts = [];
        for (var i = 0; i <= 24; i++) { var u = i / 24, x = A.wx + (B.wx - A.wx) * u, z = A.wz + (B.wz - A.wz) * u, y = ya + (yb - ya) * u + Math.sin(u * Math.PI) * hgt; pts.push(proj(x, y, z)); }
        var hot = sel && (e.a === sel || e.b === sel), out = sel && e.a === sel;
        g.save(); g.lineCap = "round"; g.lineWidth = (hot ? 2.6 : 1.4) + Math.min(3, e.n * .35);
        g.strokeStyle = hot ? (out ? "rgba(255,196,64,.95)" : "rgba(96,220,255,.95)") : (sky.stars > .5 ? "rgba(180,210,255,.45)" : "rgba(255,255,255,.65)");
        g.setLineDash(hot ? [10, 7] : [4, 7]); g.lineDashOffset = reduce ? 0 : -(now / 40) % 34;
        g.beginPath(); pts.forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke();
        if (hot) { var m = pts[18], m2 = pts[19], ang = Math.atan2(m2[1] - m[1], m2[0] - m[0]); g.setLineDash([]); g.fillStyle = g.strokeStyle; g.translate(m2[0], m2[1]); g.rotate(ang); g.beginPath(); g.moveTo(7, 0); g.lineTo(-6, -5); g.lineTo(-6, 5); g.closePath(); g.fill(); }
        g.restore();
      });
    }
    /* ---------- 島民：在島上自由走動，偶爾跳到相鄰的島；點他會有反應 ---------- */
    var COLS = ["#78a9e0", "#e58a73", "#7fc3a0", "#ffcf5a", "#b79ae6"], MOODS = ["w", "o", "s", "s", "w"];
    var LINES = ["路過的，進來逛逛吧！", "拖一下畫面，島會轉喔", "數學不可怕，我才可怕", "點島，可以看到章節", "一二三，再點我一下", "這裡風景不錯吧", "我在找迷路的小數點"];
    var DIZZY = ["頭好暈⋯⋯", "別再戳了啦～", "世界在旋轉！", "你很閒耶😆"];
    var folks = []; for (var fi = 0; fi < 5; fi++) { var home = D.themes[Math.floor(rnd(fi * 13 + 5) * D.themes.length)]; folks.push({ t: home, x: (rnd(fi + 3) - .5) * .8, z: (rnd(fi + 9) - .5) * .8, tx: 0, tz: 0, wait: rnd(fi) * 2000, col: COLS[fi], mood: MOODS[fi], dir: 1, hop: null, react: 0, say: "", sayT: 0, pokes: 0, pokeT: 0, spin: 0, look: 0 }); }
    function newTarget(f) { var a = Math.random() * TAU, r = Math.random() * .62; f.tx = Math.cos(a) * r; f.tz = Math.sin(a) * r; }
    folks.forEach(newTarget);
    function stepFolks(now, dt) {
      folks.forEach(function (f) {
        if (f.react > 0) f.react = Math.max(0, f.react - dt); if (f.sayT > 0) f.sayT -= dt; if (f.spin > 0) f.spin = Math.max(0, f.spin - dt);
        if (now - f.pokeT > 4000) f.pokes = 0;
        if (reduce || f.react > 0) return;
        if (f.hop) { f.hop.u += dt / 1100; if (f.hop.u >= 1) { f.t = f.hop.to; f.x = f.hop.x1; f.z = f.hop.z1; f.hop = null; f.wait = 800 + Math.random() * 1500; newTarget(f); } return; }
        if (f.wait > 0) { f.wait -= dt; return; }
        var dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz), sp = dt * .00035;
        if (d < .02) {
          if (Math.random() < .22) { /* 跳到相鄰（有先備關係）的島 */
            var nb = D.edges.filter(function (e) { return e.a === f.t || e.b === f.t; }).map(function (e) { return e.a === f.t ? e.b : e.a; });
            if (nb.length) { var to = nb[Math.floor(Math.random() * nb.length)]; f.hop = { u: 0, from: f.t, to: to, x0: f.x, z0: f.z, x1: (Math.random() - .5) * .6, z1: (Math.random() - .5) * .6 }; return; }
          }
          f.wait = 900 + Math.random() * 2600; newTarget(f); return;
        }
        f.x += dx / d * Math.min(sp, d); f.z += dz / d * Math.min(sp, d); f.dir = dx >= 0 ? 1 : -1;
      });
    }
    function folkPos(f, now) {
      var R = 1.12;
      if (f.hop) { var A = P[f.hop.from], B = P[f.hop.to], u = f.hop.u, e = u * u * (3 - 2 * u), ax = A.wx + f.hop.x0 * R, az = A.wz + f.hop.z0 * R, bx = B.wx + f.hop.x1 * R, bz = B.wz + f.hop.z1 * R;
        return [ax + (bx - ax) * e, islandY(f.hop.from, now) * (1 - e) + islandY(f.hop.to, now) * e + Math.sin(e * Math.PI) * (1 + Math.hypot(ax - bx, az - bz) * .18), az + (bz - az) * e]; }
      var p = P[f.t], walk = !reduce && f.wait <= 0 && f.react <= 0 ? Math.abs(Math.sin(now / 110)) * .03 : 0, jump = f.react > 0 ? Math.sin((1 - f.react / 900) * Math.PI) * .45 : 0;
      return [p.wx + f.x * R, islandY(f.t, now) + walk + Math.max(0, jump), p.wz + f.z * R];
    }
    function drawFolk(f, s, now) {
      var sc = V.foc / s[2] * .3 / 40; f.sx = s[0]; f.sy = s[1]; f.sr = 60 * sc;
      g.save(); g.translate(s[0], s[1]); g.scale(sc * f.dir, sc); if (f.spin > 0) g.rotate((1 - f.spin / 700) * TAU);
      g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(0, 4, 30, 6, 0, 0, TAU); g.fill();
      g.fillStyle = f.col; g.strokeStyle = "#101a2e"; g.lineWidth = 3.4; g.lineJoin = "round";
      g.beginPath(); g.moveTo(-34, 0); g.bezierCurveTo(-44, -30, -20, -60, 2, -56); g.bezierCurveTo(30, -60, 46, -28, 36, 0); g.bezierCurveTo(20, 7, -18, 9, -34, 0); g.closePath(); g.fill(); g.stroke();
      var dizzy = f.pokes >= 3 && f.react > 0, happy = f.react > 0 && !dizzy;
      [[-12, -34, 9], [15, -37, 7]].forEach(function (e) {
        g.fillStyle = "#fff"; g.beginPath(); g.arc(e[0], e[1], e[2], 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#101a2e";
        if (dizzy) { g.beginPath(); for (var a = 0; a < 9; a += .3) g.lineTo(e[0] + Math.cos(a + now / 90) * a * .6, e[1] + Math.sin(a + now / 90) * a * .6); g.lineWidth = 1.6; g.stroke(); g.lineWidth = 3.4; }
        else if (happy) { g.beginPath(); g.arc(e[0], e[1] + 2, e[2] * .55, Math.PI, 0); g.lineWidth = 2.4; g.stroke(); g.lineWidth = 3.4; }
        else { g.beginPath(); g.arc(e[0] + 2 + Math.sin(now / 900 + f.mood.length) * 1.5, e[1], e[2] * .45, 0, TAU); g.fill(); }
      });
      g.beginPath(); if (happy) { g.moveTo(-8, -17); g.quadraticCurveTo(2, -6, 12, -18); g.lineTo(-8, -17); g.fillStyle = "#101a2e"; g.fill(); } else if (dizzy) { g.moveTo(-8, -14); g.quadraticCurveTo(-2, -19, 3, -14); g.quadraticCurveTo(8, -9, 13, -14); g.lineWidth = 2.6; g.stroke(); } else { g.moveTo(-10, -14); g.quadraticCurveTo(-2, -9, 7, -16); g.lineWidth = 2.6; g.stroke(); }
      g.lineWidth = 3; [[-24, 0], [-6, 5], [16, 4]].forEach(function (l, i) { var k = f.wait <= 0 && !f.hop && !reduce ? Math.sin(now / 110 + i * 2) * 4 : 0; g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[0] + k, l[1] + 10); g.stroke(); });
      g.restore();
      if (f.sayT > 0) { /* 對話泡泡 */
        var fs = Math.max(12, Math.min(16, f.sr * .32)); g.font = "700 " + fs + "px 'Noto Sans TC','Microsoft JhengHei',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
        var tw = g.measureText(f.say).width + fs * 1.2, th = fs * 2, bx = s[0], by = s[1] - f.sr * 1.15 - th / 2, a = Math.min(1, f.sayT / 300);
        g.globalAlpha = a; g.fillStyle = "#fff"; g.strokeStyle = "#101a2e"; g.lineWidth = 2; rr(bx - tw / 2, by - th / 2, tw, th, 10); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(bx - 6, by + th / 2 - 1); g.lineTo(bx, by + th / 2 + 8); g.lineTo(bx + 6, by + th / 2 - 1); g.fill(); g.stroke(); g.fillStyle = "#101a2e"; g.fillText(f.say, bx, by + 1); g.globalAlpha = 1;
      }
    }
    function poke(f) {
      var now = performance.now(); f.pokes = now - f.pokeT < 4000 ? f.pokes + 1 : 1; f.pokeT = now; f.react = 900; f.wait = 1200; f.hop = null;
      var t = f.t, n = info[t].length, gs = {}; info[t].forEach(function (c) { gs[c.grade] = 1; });
      var g2 = Object.keys(gs).map(function (x) { return GN[x - 1]; }).join("、");
      var own = ["我住在「" + t + "」島！", "這座島有 " + n + " 章喔", "這裡是" + g2 + "年級會來的地方", "點這座島，看看有哪些章"];
      if (f.pokes >= 3) { f.say = DIZZY[Math.min(DIZZY.length - 1, f.pokes - 3)]; f.spin = 700; }
      else f.say = Math.random() < .55 ? own[Math.floor(Math.random() * own.length)] : LINES[Math.floor(Math.random() * LINES.length)];
      f.sayT = 2600; burst(f.sx, f.sy - f.sr * .5, f.pokes >= 3 ? 30 : 14, f.pokes >= 3 ? ["#ffd65a", "#ff7a7a", "#b79ae6"] : ["#ffd65a", "#fff3b0", f.col]); if (opt.onPoke) opt.onPoke(t);
    }
    /* ---------- 遊戲感：選取光圈、閃光粒子、飛鳥 ---------- */
    function ring(now) {
      [state.hover, state.sel].forEach(function (t, i) {
        if (!t || (i === 0 && t === state.sel)) return; var p = P[t], yy = islandY(t, now) + .14, sel = i === 1, pulse = reduce ? 0 : Math.sin(now / 260) * .05;
        var pts = hexPts(p.wx, yy + .01, p.wz, 1.12 * (sel ? 1.1 + pulse : 1.06), Math.PI / 6).map(function (q) { return proj(q[0], q[1], q[2]); });
        g.save(); g.lineJoin = "round"; g.shadowColor = sel ? "rgba(255,214,90,.95)" : "rgba(255,255,255,.9)"; g.shadowBlur = sel ? 18 : 10;
        g.strokeStyle = sel ? "rgba(255,214,90,.95)" : "rgba(255,255,255,.85)"; g.lineWidth = sel ? 3.2 : 2.2; g.setLineDash(sel ? [] : [8, 6]);
        g.beginPath(); pts.forEach(function (q, k) { if (k) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); g.stroke(); g.restore();
      });
    }
    var parts = [];
    function burst(x, y, n, cols) { if (reduce) return; for (var i = 0; i < n; i++) { var a = Math.random() * TAU, v = 1.5 + Math.random() * 3.5; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 700 + Math.random() * 500, max: 1200, col: cols[i % cols.length], s: 3 + Math.random() * 4 }); } }
    function sparks(dt) {
      parts = parts.filter(function (q) { q.life -= dt; return q.life > 0; });
      parts.forEach(function (q) { q.x += q.vx * dt / 16; q.y += q.vy * dt / 16; q.vy += .12 * dt / 16; var a = Math.min(1, q.life / 400); g.save(); g.globalAlpha = a; g.fillStyle = q.col; g.translate(q.x, q.y); g.rotate(q.life / 200); g.beginPath(); for (var k = 0; k < 5; k++) { var r1 = q.s, r2 = q.s * .45, a1 = k * TAU / 5, a2 = a1 + TAU / 10; g.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1); g.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2); } g.closePath(); g.fill(); g.restore(); });
    }
    var birds = []; for (var bi = 0; bi < 5; bi++) birds.push([rnd(bi + 61), .08 + rnd(bi + 71) * .22, .5 + rnd(bi + 81) * .8, rnd(bi + 91) * 6]);
    function drawBirds(now) {
      if (sky.stars > .5) return; g.save(); g.strokeStyle = "rgba(40,50,80,.55)"; g.lineWidth = 1.6; g.lineCap = "round";
      birds.forEach(function (b) { var x = ((b[0] + (reduce ? 0 : now / 60000 * b[2])) % 1.15 - .08) * W, y = b[1] * H + Math.sin(now / 900 + b[3]) * 6, f = reduce ? .5 : Math.sin(now / 140 + b[3]) * .5 + .5, s = 6 + b[2] * 4;
        g.beginPath(); g.moveTo(x - s, y - s * .3 * f); g.quadraticCurveTo(x - s * .4, y - s * .5 * f, x, y); g.quadraticCurveTo(x + s * .4, y - s * .5 * f, x + s, y - s * .3 * f); g.stroke(); });
      g.restore();
    }
    /* ---------- 天空、雲、星星 ---------- */
    var stars = []; for (var si = 0; si < 90; si++) stars.push([rnd(si + 1), rnd(si + 101) * .7, .5 + rnd(si + 201) * 1.4]);
    var clouds = []; for (var ci = 0; ci < 7; ci++) clouds.push([rnd(ci + 11), .62 + rnd(ci + 21) * .32, .12 + rnd(ci + 31) * .12, .4 + rnd(ci + 41) * .6]);
    function drawSky(now) {
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, sky.top); gr.addColorStop(.55, sky.mid); gr.addColorStop(1, sky.bot); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (sky.stars) { g.fillStyle = "rgba(255,255,255," + (.75 * sky.stars) + ")"; stars.forEach(function (s, i) { var tw = reduce ? 1 : .6 + .4 * Math.sin(now / 700 + i); g.globalAlpha = tw * sky.stars; g.fillRect(s[0] * W, s[1] * H, s[2], s[2]); }); g.globalAlpha = 1; }
      g.fillStyle = sky.cloud; clouds.forEach(function (c) { var x = ((c[0] + (reduce ? 0 : now / 900000 * c[3])) % 1.2 - .1) * W, y = c[1] * H, r = c[2] * Math.min(W, 700); g.beginPath(); g.ellipse(x, y, r * 1.6, r * .45, 0, 0, TAU); g.ellipse(x + r * .7, y - r * .18, r * .9, r * .4, 0, 0, TAU); g.ellipse(x - r * .7, y - r * .1, r * .8, r * .32, 0, 0, TAU); g.fill(); });
    }
    /* ---------- 島名標籤 ---------- */
    function labels(now) {
      g.textAlign = "center"; g.textBaseline = "middle";
      D.themes.map(function (t) { var p = P[t]; return { t: t, s: proj(p.wx, islandY(t, now) + .95 + ((state.sel === t || state.hover === t) ? .15 : 0), p.wz) }; }).sort(function (a, b) { return b.s[2] - a.s[2]; }).forEach(function (o) {
        var t = o.t, hot = state.sel === t || state.hover === t, dim = (state.grade && !info[t].some(function (c) { return c.grade === state.grade; })) || (state.match && !state.match[t]);
        var fs = Math.max(W < 640 ? 9 : 10, Math.min(18, V.foc / o.s[2] * .2)) * (hot ? 1.18 : 1);
        g.font = (hot ? "700 " : "600 ") + fs + "px 'Noto Sans TC','Microsoft JhengHei',sans-serif";
        var tw = g.measureText(t).width + fs * 1.1, th = fs * 1.7, x = o.s[0], y = o.s[1];
        g.globalAlpha = dim ? .45 : 1; g.fillStyle = hot ? "#101a2e" : "rgba(255,255,255,.92)"; g.strokeStyle = "rgba(16,26,46,.85)"; g.lineWidth = 1.5;
        rr(x - tw / 2, y - th / 2, tw, th, th / 2); g.fill(); g.stroke();
        g.fillStyle = hot ? "#fff" : "#101a2e"; g.fillText(t, x, y + 1); g.globalAlpha = 1;
        state.hits.push({ t: t, box: [x - tw / 2, y - th / 2, tw, th] });
      });
    }
    function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

    /* ---------- 主迴圈 ---------- */
    var last = performance.now(), raf = 0, alive = true;
    function frame(now) {
      if (!alive) return; raf = requestAnimationFrame(frame);
      var dt = Math.min(64, now - last); last = now;
      if (goal) { var k = 1 - Math.pow(.0025, dt / 1000); ["yaw", "pitch", "dist", "tx", "tz"].forEach(function (p) { if (goal[p] !== undefined) cam[p] += (goal[p] - cam[p]) * k; }); if (Math.abs(goal.yaw - cam.yaw) < .002 && Math.abs(goal.dist - cam.dist) < .01) goal = null; }
      else if (!reduce && !drag && now - idle > 9000 && !state.sel) cam.yaw += dt * .00004;
      var ox = state.sel ? (W >= 900 ? -Math.min(200, W * .15) : 0) : 0, oy = state.sel && W < 900 ? -H * .2 : 0, kk = 1 - Math.pow(.004, dt / 1000); off.x += (ox - off.x) * kk; off.y += (oy - off.y) * kk;
      sky = SKIES[state.time === "auto" ? autoTime() : state.time]; var sn = sky.sun, sl = Math.hypot(sn[0], sn[1], sn[2]); L = [sn[0] / sl, sn[1] / sl, sn[2] / sl];
      setupView(); g.setTransform(DPR, 0, 0, DPR, 0, 0);
      FOG = hex2(sky.bot); drawSky(now); drawBirds(now); buildScene(now);
      stepFolks(now, dt);
      folks.forEach(function (f) { var w = folkPos(f, now), sp = proj(w[0], w[1], w[2]); polys.push({ folk: f, s: sp, z: sp[2] - .05 }); });
      flags.forEach(function (fl) { var b = proj(fl.x, fl.y, fl.z), tp = proj(fl.x, fl.y + .62, fl.z); polys.push({ flag: fl, b: b, tp: tp, z: b[2] - .02 }); });
      polys.sort(function (a, b) { return b.z - a.z; });
      state.hits = [];
      polys.forEach(function (o) {
        if (o.folk) { drawFolk(o.folk, o.s, now); return; }
        if (o.flag) { /* 探索過的島插一面旗子 */
          var w2 = Math.sin(now / 260 + o.b[0]) * 3, hgt = o.b[1] - o.tp[1], fw = hgt * .55;
          g.strokeStyle = "#5a3d2b"; g.lineWidth = 2; g.beginPath(); g.moveTo(o.b[0], o.b[1]); g.lineTo(o.tp[0], o.tp[1]); g.stroke();
          g.fillStyle = "rgb(" + o.flag.col.map(function (v) { return Math.min(255, v * .8 + 40 | 0); }).join(",") + ")"; g.strokeStyle = "#101a2e"; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(o.tp[0], o.tp[1]); g.quadraticCurveTo(o.tp[0] + fw * .5, o.tp[1] + w2 - 2, o.tp[0] + fw, o.tp[1] + hgt * .18 + w2); g.lineTo(o.tp[0], o.tp[1] + hgt * .36); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = "#fff"; g.font = "700 " + Math.max(8, hgt * .2) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("★", o.tp[0] + fw * .38, o.tp[1] + hgt * .17 + w2 * .5); return; }
        var pp = o.pp; g.beginPath(); g.moveTo(pp[0][0], pp[0][1]); for (var i = 1; i < pp.length; i++) g.lineTo(pp[i][0], pp[i][1]); g.closePath();
        g.fillStyle = o.fill; g.fill(); g.strokeStyle = o.line || o.fill; g.lineWidth = o.line ? 1.6 : .8; g.stroke(); /* 補縫；島的頂面有卡通描邊 */
        if (o.tag) state.hits.push({ t: o.tag.t, c: o.tag.c, pp: pp });
      });
      ring(now); arcs(now); sparks(dt); labels(now);
    }
    function resize() { var r = box.getBoundingClientRect(); W = Math.max(280, r.width); H = Math.max(320, r.height); DPR = Math.min(2, window.devicePixelRatio || 1); cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px"; 
      /* 起始視角只設一次；之後只有「版型真的變了」（例如手機轉向）而且使用者還沒動過畫面，才重設。
         手機網址列伸縮、捲軸出現等小變化只更新畫布大小，不動鏡頭（不然會像整頁重新整理） */
      var port = W < 640 && H > W, kind = port ? "p" : W < 640 ? "s" : "w";
      if (kind !== resize.kind && !touched && !state.sel) { cam.dist = port ? 15.5 : W < 640 ? 19 : 17; cam.pitch = port ? .98 : .62; cam.yaw = port ? -Math.PI / 2 - .25 : -.5; if (resize.kind && goal) goal = null; }
      resize.kind = kind; }
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(box); else window.addEventListener("resize", resize); resize();
    /* 開場：鏡頭從高空飛進來（像遊戲的開場） */
    if (!reduce) { var g0 = { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, tx: 0, tz: 0 }; cam.yaw += 1.3; cam.pitch = 1.3; cam.dist = cam.dist * 2.1; goal = g0; }
    raf = requestAnimationFrame(frame);

    /* ---------- 點選：先找標籤，再找最前面的多邊形 ---------- */
    function inPoly(x, y, pp) { var c = false; for (var i = 0, j = pp.length - 1; i < pp.length; j = i++) { if ((pp[i][1] > y) !== (pp[j][1] > y) && x < (pp[j][0] - pp[i][0]) * (y - pp[i][1]) / (pp[j][1] - pp[i][1]) + pp[i][0]) c = !c; } return c; }
    function pick(x, y) {
      for (var k = 0; k < folks.length; k++) { var f = folks[k]; if (f.sr && Math.hypot(x - f.sx, y - (f.sy - f.sr * .45)) < Math.max(18, f.sr * .75)) return { folk: f }; }
      for (var i = state.hits.length - 1; i >= 0; i--) { var h = state.hits[i]; if (h.box) { if (x >= h.box[0] && x <= h.box[0] + h.box[2] && y >= h.box[1] && y <= h.box[1] + h.box[3]) return h; } else if (inPoly(x, y, h.pp)) return h; }
      return null;
    }
    var drag = null, moved = false, pinch = null;
    function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener("pointerdown", function (e) { touched = true; cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, id: e.pointerId }; moved = false; goal = null; idle = performance.now(); });
    cv.addEventListener("pointermove", function (e) {
      idle = performance.now();
      if (drag && drag.id === e.pointerId && !pinch) { var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; cam.yaw = drag.yaw - dx * .006; cam.pitch = Math.max(.32, Math.min(1.25, drag.pitch + dy * .004)); return; }
      var p = pos(e), h = pick(p[0], p[1]); state.hover = h && !h.folk ? h.t : null; cv.style.cursor = h ? "pointer" : "grab";
    });
    cv.addEventListener("pointerup", function (e) { if (drag && !moved && !pinch) { var p = pos(e), h = pick(p[0], p[1]); if (h && h.folk) poke(h.folk); else select(h ? h.t : null, h && h.c); } drag = null; });
    cv.addEventListener("pointerleave", function () { state.hover = null; });
    cv.addEventListener("wheel", function (e) { e.preventDefault(); touched = true; goal = null; cam.dist = Math.max(8, Math.min(30, cam.dist * (1 + e.deltaY * .0012))); idle = performance.now(); }, { passive: false });
    cv.addEventListener("touchstart", function (e) { if (e.touches.length === 2) { var a = e.touches[0], b = e.touches[1]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), dist: cam.dist }; moved = true; } }, { passive: true });
    cv.addEventListener("touchmove", function (e) { if (pinch && e.touches.length === 2) { var a = e.touches[0], b = e.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); cam.dist = Math.max(8, Math.min(30, pinch.dist * pinch.d / d)); } }, { passive: true });
    cv.addEventListener("touchend", function (e) { if (e.touches.length < 2) pinch = null; }, { passive: true });

    function focus(t, keepDist) {
      var p = P[t]; if (!p) return; var yaw = Math.atan2(p.wx, p.wz) || cam.yaw; /* 從外往中心看，島在前面 */
      if (Math.hypot(p.wx, p.wz) < 1) yaw = cam.yaw;
      while (yaw - cam.yaw > Math.PI) yaw -= TAU; while (yaw - cam.yaw < -Math.PI) yaw += TAU;
      goal = { yaw: yaw, pitch: .7, dist: keepDist ? cam.dist : (W < 640 ? 13 : 11), tx: p.wx * .55, tz: p.wz * .55 };
    }
    function select(t, cid) { touched = true; if (t && t !== state.sel) { var p0 = P[t], sp0 = proj(p0.wx, islandY(t, performance.now()) + .3, p0.wz); burst(sp0[0], sp0[1], 26, ["#ffd65a", "#fff3b0", "#ff9f6e", "#9fe3ff"]); } state.sel = t; if (t) focus(t); else goal = { tx: 0, tz: 0, dist: W < 640 && H > W ? 15.5 : W < 640 ? 19 : 17, yaw: cam.yaw, pitch: W < 640 && H > W ? .98 : .62 }; if (opt.onPick) opt.onPick(t, cid); }
    function search(q) {
      q = String(q || "").trim(); state.q = q; if (!q) { state.match = null; return []; }
      var res = [], m = {};
      D.themes.forEach(function (t) {
        var hitT = t.indexOf(q) >= 0;
        info[t].forEach(function (c) { var hs = c.secs.filter(function (o) { return o.title.indexOf(q) >= 0; }); if (hitT || c.name.indexOf(q) >= 0 || hs.length) { (m[t] = m[t] || {})[c.id] = 1; res.push({ t: t, c: c, secs: hs }); } });
        if (hitT) m[t] = m[t] || {};
      });
      state.match = m; return res;
    }
    return {
      data: D, info: info, domName: function (t) { return DOM[D.dom[t]].name; }, domKey: function (t) { return D.dom[t]; },
      focus: function (t) { state.sel = t; focus(t); }, select: select, search: search,
      setGrade: function (gr) { state.grade = gr; }, setTime: function (m) { state.time = m; }, timeLabel: function () { return (state.time === "auto" ? "自動・" : "") + SKIES[state.time === "auto" ? autoTime() : state.time].label; },
      setLinks: function (on) { state.links = on; }, links: function () { return state.links; },
      camera: function () { return { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist }; },
      folks: function () { return folks.map(function (f) { return { t: f.t, x: f.sx, y: f.sy - (f.sr || 0) * .45, r: f.sr }; }); },
      poke: function (i) { var f = folks[(i === undefined ? Math.floor(Math.random() * folks.length) : i) % folks.length]; poke(f); return f.say; },
      progress: function () { var ti = 0, ci = 0, cn = 0; D.themes.forEach(function (t) { if (explored(t)) ti++; }); var seen = {}; D.themes.forEach(function (t) { info[t].forEach(function (c) { if (seen[c.id]) return; seen[c.id] = 1; cn++; if (visited(c)) ci++; }); }); return { islands: ti, total: D.themes.length, chapters: ci, chTotal: cn }; },
      neighbors: function (t) { return { pre: D.edges.filter(function (e) { return e.b === t; }).sort(function (a, b) { return b.n - a.n; }), post: D.edges.filter(function (e) { return e.a === t; }).sort(function (a, b) { return b.n - a.n; }) }; },
      destroy: function () { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); cv.remove(); }
    };
  }
  window.NB = window.NB || {}; NB.isle3d = { mount: mount, GRADE_COL: GRADE_COL };
})();
