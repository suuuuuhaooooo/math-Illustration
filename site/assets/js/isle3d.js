/* 數光群島（3D，three.js／WebGL 版）
   22 條主題線各是一座六角浮島，依領域分色（數與量、空間與形狀、關係、資料與不確定性）。
   島上小房子＝各年級的章（年級越高越高，夜裡窗戶會亮，去過的章更亮）；島與島之間的光管＝先備關係，光點沿著流動。
   畫面交給顯示卡（WebGL）：真正的深度、陰影、霧氣；每座島的房子和樹合併成一個物件，手機平板也跑得動。
   島名、島民、對話泡泡、星星粒子畫在上面一層透明 canvas。
   用法：NB.isle3d.mount(容器, { onPick(t, cid), onLog(文字), onFail(原因) }) → 控制物件（見最後 return） */
import * as THREE from "../vendor/three/three.module.min.js";

const M = window.NB_MAP, TAU = Math.PI * 2, SQ3 = Math.sqrt(3);
const DOM = {
  N: { name: "數與量", top: "#7cc47e", rim: "#5ea865" }, S: { name: "空間與形狀", top: "#69c0cf", rim: "#4fa4b4" },
  R: { name: "關係", top: "#b59ae4", rim: "#977dc9" }, D: { name: "資料與不確定性", top: "#f2b664", rim: "#d99a48" }
};
const ORDER = { N: ["整數與位值", "加法與減法", "乘法", "除法", "四則與規律", "分數", "小數", "因數與倍數", "概數與估算", "比與比例", "速率", "時間", "錢幣", "長度", "重量與容量", "體積與容積"], S: ["平面圖形", "角與角度", "圓", "面積", "立體形體"], D: ["統計與資料"] };
const GRADE_HEX = [null, "#ffd678", "#ffa88c", "#8cc8ff", "#bea0ff", "#82dcaa", "#ff8cbe"];
const GRADE_COL = GRADE_HEX.map((h) => (h ? [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)] : null));
const GN = "一二三四五六";

/* ---------- 資料 ---------- */
function buildData() {
  const th = Object.keys(M.th), dom = {}, groups = { N: [], S: [], R: [], D: [] };
  th.forEach((t) => { const cnt = {}; M.th[t].forEach((c) => { const d = M.ch[c] && M.ch[c].d; if (d) cnt[d] = (cnt[d] || 0) + 1; }); let best = "N", n = -1; for (const d in cnt) if (cnt[d] > n) { n = cnt[d]; best = d; } dom[t] = best; groups[best].push(t); });
  for (const d in groups) { const o = ORDER[d] || []; groups[d].sort((a, b) => { const i = o.indexOf(a), j = o.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); }); }
  const edges = {};
  Object.keys(M.ch).forEach((c) => { const C = M.ch[c]; (C.p || []).forEach((p) => { const P = M.ch[p]; if (!P) return; P.t.forEach((a) => C.t.forEach((b) => { if (a === b) return; const k = a + "→" + b; (edges[k] = edges[k] || { a, b, n: 0 }).n++; })); }); });
  return { themes: th, dom, groups, edges: Object.values(edges) };
}
function chapterInfo(cid) {
  const m = /^(\d)([ud])-(\d+)$/.exec(cid); if (!m || !window.NB || !NB.cat) return null;
  const S = NB.cat.find((x) => x.id === m[1] + m[2]); if (!S) return null; const c = S.chs[+m[3] - 1]; if (!c) return null;
  return { id: cid, grade: +m[1], sem: S.sem, no: c.no, name: c.name, secs: c.secs };
}
function layout(D) {
  const cells = [];
  for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) { const s = -q - r; if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= 3) cells.push({ x: q + r / 2, z: r * SQ3 / 2 }); }
  cells.sort((a, b) => (a.x * a.x + a.z * a.z * 1.3) - (b.x * b.x + b.z * b.z * 1.3) || a.x - b.x);
  const n = D.themes.length, use = cells.slice(0, n).sort((a, b) => a.x - b.x || a.z - b.z), pos = {};
  const west = use.slice(0, D.groups.N.length), east = use.slice(D.groups.N.length);
  const spiral = (list, names) => { if (!list.length) return; let cx = 0, cz = 0; list.forEach((c) => { cx += c.x; cz += c.z; }); cx /= list.length; cz /= list.length; list.sort((a, b) => { const ra = Math.hypot(a.x - cx, a.z - cz), rb = Math.hypot(b.x - cx, b.z - cz); if (Math.abs(ra - rb) > .6) return ra - rb; return Math.atan2(a.z - cz, a.x - cx) - Math.atan2(b.z - cz, b.x - cx); }); names.forEach((t, i) => { if (list[i]) pos[t] = list[i]; }); };
  spiral(west, D.groups.N);
  east.sort((a, b) => a.z - b.z);
  const top = east.splice(0, D.groups.R.length), bottom = east.splice(east.length - D.groups.D.length, D.groups.D.length);
  D.groups.R.forEach((t, i) => { pos[t] = top[i]; }); D.groups.D.forEach((t, i) => { pos[t] = bottom[i]; });
  spiral(east, D.groups.S);
  let cx = 0, cz = 0; D.themes.forEach((t) => { cx += pos[t].x; cz += pos[t].z; }); cx /= n; cz /= n;
  D.themes.forEach((t) => { const p = pos[t]; p.wx = (p.x - cx) * 2.55; p.wz = (p.z - cz) * 2.55; });
  return pos;
}
const SLOTS = (() => { const s = [[0, 0]]; for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; s.push([Math.cos(a) * .4, Math.sin(a) * .4]); } for (let j = 0; j < 12; j++) { const b = j * TAU / 12 + Math.PI / 12; const rr = j % 2 ? .7 : .74; s.push([Math.cos(b) * rr, Math.sin(b) * rr]); } return s; })();
const rnd = (seed) => { const x = Math.sin(seed * 999.13) * 43758.5453; return x - Math.floor(x); };
const hashStr = (t) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 100003; return h; };

/* ---------- 天色（00:00～24:00 內插） ---------- */
const KEYS = [
  { h: 0, top: "#08102a", mid: "#16234a", bot: "#27396b", fog: "#22325c", hemi: "#6a7cc0", sun: "#9fb4ff", night: 1 },
  { h: 4.8, top: "#0b1430", mid: "#1d2d5c", bot: "#33497f", fog: "#2b3d6e", hemi: "#6e80c4", sun: "#9fb4ff", night: 1 },
  { h: 6, top: "#7d86c8", mid: "#f3b3a0", bot: "#fbd9b5", fog: "#f2c9b0", hemi: "#f0c6b8", sun: "#ffc59a", night: .25 },
  { h: 7.5, top: "#6fb9ee", mid: "#b8e0f8", bot: "#e6f4ff", fog: "#d4ecfb", hemi: "#d8eeff", sun: "#fff4e0", night: 0 },
  { h: 16, top: "#6fb9ee", mid: "#b8e0f8", bot: "#e6f4ff", fog: "#d4ecfb", hemi: "#d8eeff", sun: "#fff1d6", night: 0 },
  { h: 17.7, top: "#6a5ba8", mid: "#ec9478", bot: "#f8c98e", fog: "#efb393", hemi: "#f3c2a6", sun: "#ffb27a", night: .2 },
  { h: 19.3, top: "#101a3c", mid: "#26346a", bot: "#3c4f86", fog: "#2f4174", hemi: "#7486c8", sun: "#a9bcff", night: 1 },
  { h: 24, top: "#08102a", mid: "#16234a", bot: "#27396b", fog: "#22325c", hemi: "#6a7cc0", sun: "#9fb4ff", night: 1 }
];
function skyAt(h) {
  h = ((h % 24) + 24) % 24; let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const A = KEYS[i], B = KEYS[i + 1], u = (h - A.h) / (B.h - A.h || 1), mix = (k) => new THREE.Color(A[k]).lerp(new THREE.Color(B[k]), u);
  return { top: mix("top"), mid: mix("mid"), bot: mix("bot"), fog: mix("fog"), hemi: mix("hemi"), sun: mix("sun"), night: A.night + (B.night - A.night) * u, h };
}
const clockNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };

/* ---------- 幾何小工具：合併成一個網格（每個頂點帶顏色） ---------- */
const col3 = (hexOrArr) => { const c = new THREE.Color(); if (Array.isArray(hexOrArr)) c.setRGB(hexOrArr[0] / 255, hexOrArr[1] / 255, hexOrArr[2] / 255, THREE.SRGBColorSpace); else c.set(hexOrArr); return c; };
function painted(geo, color, m4) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m4) g.applyMatrix4(m4); g.deleteAttribute("uv"); g.computeVertexNormals();
  const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = color.r; a[i * 3 + 1] = color.g; a[i * 3 + 2] = color.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
}
function merge(list) {
  let n = 0; list.forEach((g) => { n += g.attributes.position.count; });
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
  list.forEach((g) => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; });
  const out = new THREE.BufferGeometry(); out.setAttribute("position", new THREE.BufferAttribute(P, 3)); out.setAttribute("normal", new THREE.BufferAttribute(N, 3)); out.setAttribute("color", new THREE.BufferAttribute(C, 3));
  out.computeBoundingSphere(); return out;
}
const mat4 = (x, y, z, ry, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1));

export function mount(box, opt) {
  opt = opt || {};
  const D = buildData(), P = layout(D), reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  const LITE = (box.clientWidth || innerWidth) < 900 || /iPhone|iPad|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
  const info = {}; D.themes.forEach((t) => { info[t] = M.th[t].map(chapterInfo).filter(Boolean).sort((a, b) => a.grade - b.grade || a.id.localeCompare(b.id)); });
  const trail = (window.NB && NB.trail && NB.trail.all()) || {};
  const visited = (c) => c.secs.some((o) => trail[o.id]), explored = (t) => info[t].some(visited);
  const state = { grade: 0, hour: null, links: true, labels: true, paused: false, sel: null, hover: null, match: null, bird: false, doms: null, folks: true };
  const offDom = (t) => !!(state.doms && !state.doms[D.dom[t]]);
  const log = (msg) => { if (opt.onLog) opt.onLog(msg); };

  /* ---------- three.js 基本設定；拿不到 WebGL 就交給外面退回清單 ---------- */
  const cv = document.createElement("canvas"); cv.className = "i3-cv"; cv.setAttribute("aria-hidden", "true"); box.insertBefore(cv, box.firstChild);
  const ov = document.createElement("canvas"); ov.className = "i3-ov"; ov.setAttribute("aria-hidden", "true"); box.insertBefore(ov, cv.nextSibling);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: LITE ? "low-power" : "high-performance" }); }
  catch (e) { cv.remove(); ov.remove(); return null; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const g = ov.getContext("2d"), scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .5, 400);
  let W = 0, H = 0, DPR = 1, alive = true;

  /* 天空球（漸層）＋星星＋霧 */
  const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: "varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vp; void main(){ float y = vp.y; vec3 c = y > .12 ? mix(mid, top, smoothstep(.12,.75,y)) : mix(bot, mid, smoothstep(-.35,.12,y)); gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}" }));
  scene.add(skyMesh);
  const starGeo = new THREE.BufferGeometry(), sp = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) { const a = rnd(i + 3) * TAU, y = .08 + rnd(i + 77) * .9, r = Math.sqrt(1 - y * y); sp[i * 3] = Math.cos(a) * r * 160; sp[i * 3 + 1] = y * 160; sp[i * 3 + 2] = Math.sin(a) * r * 160; }
  starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  scene.add(new THREE.Points(starGeo, starMat));
  scene.fog = new THREE.Fog(0xd4ecfb, 28, 75);

  /* 光：半球光（天空／地面）＋太陽（或月亮）＋陰影 */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b5a48, 1.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.castShadow = true;
  sun.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048); const sc = sun.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 80; sun.shadow.bias = -.0015; sun.shadow.normalBias = .02;
  scene.add(sun); scene.add(sun.target);

  /* 雲海：島嶼底下慢慢飄 */
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: .92 });
  const clouds = [];
  for (let i = 0; i < (LITE ? 9 : 14); i++) {
    const parts = []; const n = 4 + Math.floor(rnd(i + 5) * 3);
    for (let k = 0; k < n; k++) { const s = .9 + rnd(i * 9 + k) * 1.1; parts.push(painted(new THREE.IcosahedronGeometry(1, 1), new THREE.Color(1, 1, 1), mat4(k * 1.3 - n * .6, rnd(i + k) * .5, (rnd(i * 3 + k) - .5) * 1.2, 0, s * 1.3, s * .62, s))); }
    const m = new THREE.Mesh(merge(parts), cloudMat); const ca = rnd(i + 31) * TAU, cr = 13 + rnd(i + 51) * 22; m.position.set(Math.cos(ca) * cr, -6.5 - rnd(i + 41) * 3, Math.sin(ca) * cr); m.scale.setScalar(.7 + rnd(i + 71) * .5); m.userData.v = .2 + rnd(i + 61) * .4; scene.add(m); clouds.push(m);
  }

  /* ---------- 島嶼 ---------- */
  const R = 1.12, islands = {}, pickables = [];
  const sideMat = new THREE.MeshLambertMaterial({ color: 0x9b6b45 }), rockMat = new THREE.MeshLambertMaterial({ color: 0x7c6a5c, flatShading: true });
  const decoMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const winMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x101a2e, transparent: true, opacity: .55 });
  const hexTop = new THREE.CylinderGeometry(R, R, .26, 6, 1), rimGeo = new THREE.CylinderGeometry(R * 1.015, R * 1.015, .05, 6, 1);
  const edgeGeo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(R * 1.02, R * 1.02, .001, 6, 1));
  function rockGeo(seed) {
    const g0 = new THREE.ConeGeometry(R * .97, 1.6, 6, 3), pos = g0.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < .79 && y > -.79) { const k = 1 + (rnd(seed + i) - .5) * .28; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); pos.setY(i, y + (rnd(seed + i * 3) - .5) * .12); } }
    g0.rotateX(Math.PI); g0.computeVertexNormals(); return g0;
  }
  D.themes.forEach((t) => {
    const p = P[t], d = DOM[D.dom[t]], seed = hashStr(t), grp = new THREE.Group(); grp.position.set(p.wx, 0, p.wz);
    const topMat = new THREE.MeshLambertMaterial({ color: d.top });
    const body = new THREE.Mesh(hexTop, [sideMat, topMat, sideMat]); body.position.y = -.13; body.castShadow = body.receiveShadow = true; body.userData.t = t; grp.add(body);
    const rim = new THREE.Mesh(rimGeo, new THREE.MeshLambertMaterial({ color: d.rim })); rim.position.y = -.035; grp.add(rim);
    const rock = new THREE.Mesh(rockGeo(seed), rockMat); rock.position.y = -.26 - .8; rock.castShadow = true; rock.userData.t = t; grp.add(rock);
    const edge = new THREE.LineSegments(edgeGeo, edgeMat); edge.position.y = .002; grp.add(edge);
    /* 房子（章）、樹、窗戶：合併 */
    const order = SLOTS.map((s, i) => i).sort((a, b) => rnd(seed + a) - rnd(seed + b)), used = {}, parts = [], wins = [], houses = [];
    let vcount = 0, wcount = 0;
    info[t].forEach((c, i) => {
      const si = order[i % order.length]; used[si] = 1; const x = SLOTS[si][0] * R, z = SLOTS[si][1] * R, ry = rnd(seed + i * 7) * .8, h = .11 + c.grade * .05, w = .2, col = col3(GRADE_COL[c.grade]);
      const roofCol = col.clone().multiplyScalar(.62); roofCol.r = Math.min(1, roofCol.r * 1.25);
      const b = painted(new THREE.BoxGeometry(w, h, w), col, mat4(x, h / 2, z, ry)), r = painted(new THREE.ConeGeometry(w * .82, .14, 4), roofCol, mat4(x, h + .07, z, ry + Math.PI / 4));
      const hs = { c, start: vcount, n: b.attributes.position.count + r.attributes.position.count, col, roofCol, bodyN: b.attributes.position.count, wStart: wcount, wN: 0 };
      parts.push(b, r); vcount += hs.n;
      [0, Math.PI].forEach((side) => { /* 前後各一扇窗 */
        const wg = painted(new THREE.PlaneGeometry(.1, .08), new THREE.Color(1, .85, .5), new THREE.Matrix4().compose(new THREE.Vector3(x + Math.sin(ry + side) * (w / 2 + .003), h * .55, z + Math.cos(ry + side) * (w / 2 + .003)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry + side, 0)), new THREE.Vector3(1, 1, 1)));
        wins.push(wg); hs.wN += wg.attributes.position.count; wcount += wg.attributes.position.count;
      });
      houses.push(hs);
    });
    order.forEach((si) => {
      if (used[si] || rnd(seed * 3 + si) < .42) return; const x = (SLOTS[si][0] + (rnd(seed + si) - .5) * .08) * R, z = (SLOTS[si][1] + (rnd(seed + si * 5) - .5) * .08) * R, s = .75 + rnd(seed + si * 11) * .5;
      const leaf = new THREE.Color().setHSL(.32 + rnd(seed + si) * .05, .45, .32 + rnd(si + seed * 2) * .08, THREE.SRGBColorSpace);
      parts.push(painted(new THREE.CylinderGeometry(.02, .025, .07 * s, 5), col3("#7a5236"), mat4(x, .035 * s, z)));
      parts.push(painted(new THREE.ConeGeometry(.1 * s, .26 * s, 6), leaf, mat4(x, .07 * s + .13 * s, z, rnd(si) * TAU)));
      parts.push(painted(new THREE.ConeGeometry(.075 * s, .18 * s, 6), leaf.clone().offsetHSL(0, 0, .05), mat4(x, .07 * s + .27 * s, z, rnd(si + 1) * TAU)));
    });
    const deco = new THREE.Mesh(merge(parts.length ? parts : [painted(new THREE.BoxGeometry(.001, .001, .001), new THREE.Color(0, 0, 0))]), decoMat); deco.castShadow = deco.receiveShadow = true; deco.userData.t = t; deco.userData.houses = houses; grp.add(deco);
    const win = wins.length ? new THREE.Mesh(merge(wins), winMat) : null; if (win) { win.renderOrder = 2; grp.add(win); }
    let flag = null;
    if (explored(t)) { /* 探索過的島插旗 */
      flag = new THREE.Group(); const fx = Math.cos(-Math.PI / 6) * R * .8, fz = Math.sin(-Math.PI / 6) * R * .8;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .62, 6), new THREE.MeshLambertMaterial({ color: 0x5a3d2b })); pole.position.y = .31; pole.castShadow = true; flag.add(pole);
      const fg = new THREE.Shape(); fg.moveTo(0, 0); fg.lineTo(.3, -.08); fg.lineTo(0, -.18); fg.lineTo(0, 0);
      const cloth = new THREE.Mesh(new THREE.ShapeGeometry(fg), new THREE.MeshLambertMaterial({ color: new THREE.Color(d.top).offsetHSL(0, .1, -.08), side: THREE.DoubleSide })); cloth.position.y = .6; flag.add(cloth); flag.userData.cloth = cloth;
      flag.position.set(fx, 0, fz); grp.add(flag);
    }
    scene.add(grp); pickables.push(body, rock, deco);
    islands[t] = { grp, topMat, deco, win, houses, flag, seed, d };
  });
  const islandY = (t, now) => (reduce || state.paused) ? islands[t].baseY || 0 : (islands[t].baseY = Math.sin(now / 1400 + hashStr(t) * .37) * .06);

  /* 選取／滑過的光圈 */
  const ringGeo = new THREE.RingGeometry(R * 1.1, R * 1.24, 6, 1); ringGeo.rotateX(-Math.PI / 2); ringGeo.rotateY(Math.PI / 6 - Math.PI / 6);
  const selRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffd65a, transparent: true, opacity: .95, depthWrite: false, fog: false })); selRing.visible = false; selRing.renderOrder = 3; scene.add(selRing);
  const hovRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7, depthWrite: false, fog: false })); hovRing.visible = false; hovRing.renderOrder = 3; scene.add(hovRing);

  /* 先備線：光管＋流動的光點 */
  const arcs = D.edges.map((e) => {
    const A = P[e.a], B = P[e.b], dist = Math.hypot(A.wx - B.wx, A.wz - B.wz), hgt = .7 + dist * .22;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(A.wx, .32, A.wz), new THREE.Vector3((A.wx + B.wx) / 2, .32 + hgt * 2, (A.wz + B.wz) / 2), new THREE.Vector3(B.wx, .32, B.wz));
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, .022 + Math.min(.03, e.n * .004), 5), mat); tube.visible = false; tube.renderOrder = 1; scene.add(tube);
    const dots = []; for (let k = 0; k < (LITE ? 1 : 2); k++) { const dm = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); dm.visible = false; scene.add(dm); dots.push(dm); }
    return { e, curve, tube, mat, dots, off: rnd(hashStr(e.a + e.b)) };
  });

  /* ---------- 島民（畫在上層 canvas） ---------- */
  const NAMES = ["小藍", "小紅", "小綠", "小黃", "小紫"], COLS = ["#78a9e0", "#e58a73", "#7fc3a0", "#ffcf5a", "#b79ae6"];
  const LINES = ["路過的，進來逛逛吧！", "拖一下畫面，島會轉喔", "數學不可怕，我才可怕", "點島，可以看到章節", "一二三，再點我一下", "這裡風景不錯吧", "我在找迷路的小數點"];
  const DIZZY = ["頭好暈⋯⋯", "別再戳了啦～", "世界在旋轉！", "你很閒耶😆"];
  const folks = NAMES.map((nm, i) => ({ name: nm, t: D.themes[Math.floor(rnd(i * 13 + 5) * D.themes.length)], x: (rnd(i + 3) - .5) * .8, z: (rnd(i + 9) - .5) * .8, tx: 0, tz: 0, wait: rnd(i) * 2000, col: COLS[i], dir: 1, hop: null, react: 0, say: "", sayT: 0, pokes: 0, pokeT: 0, spin: 0 }));
  const newTarget = (f) => { const a = Math.random() * TAU, r = Math.random() * .62; f.tx = Math.cos(a) * r; f.tz = Math.sin(a) * r; };
  folks.forEach(newTarget);
  function stepFolks(now, dt) {
    folks.forEach((f) => {
      if (f.react > 0) f.react = Math.max(0, f.react - dt); if (f.sayT > 0) f.sayT -= dt; if (f.spin > 0) f.spin = Math.max(0, f.spin - dt);
      if (now - f.pokeT > 4000) f.pokes = 0;
      if (reduce || state.paused || f.react > 0) return;
      if (f.hop) { f.hop.u += dt / 1100; if (f.hop.u >= 1) { f.t = f.hop.to; f.x = f.hop.x1; f.z = f.hop.z1; f.hop = null; f.wait = 800 + Math.random() * 1500; newTarget(f); log(f.name + "跳到了「" + f.t + "」島"); } return; }
      if (f.wait > 0) { f.wait -= dt; return; }
      const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz), spd = dt * .00035;
      if (d < .02) {
        if (Math.random() < .22) { const nb = D.edges.filter((e) => e.a === f.t || e.b === f.t).map((e) => (e.a === f.t ? e.b : e.a)); if (nb.length) { f.hop = { u: 0, from: f.t, to: nb[Math.floor(Math.random() * nb.length)], x0: f.x, z0: f.z, x1: (Math.random() - .5) * .6, z1: (Math.random() - .5) * .6 }; return; } }
        f.wait = 900 + Math.random() * 2600; newTarget(f); return;
      }
      f.x += dx / d * Math.min(spd, d); f.z += dz / d * Math.min(spd, d); f.dir = dx >= 0 ? 1 : -1;
    });
  }
  function folkWorld(f, now) {
    if (f.hop) { const A = P[f.hop.from], B = P[f.hop.to], u = f.hop.u, e = u * u * (3 - 2 * u), ax = A.wx + f.hop.x0 * R, az = A.wz + f.hop.z0 * R, bx = B.wx + f.hop.x1 * R, bz = B.wz + f.hop.z1 * R;
      return new THREE.Vector3(ax + (bx - ax) * e, islandY(f.hop.from, now) * (1 - e) + islandY(f.hop.to, now) * e + Math.sin(e * Math.PI) * (1 + Math.hypot(ax - bx, az - bz) * .18), az + (bz - az) * e); }
    const p = P[f.t], walk = !reduce && !state.paused && f.wait <= 0 && f.react <= 0 ? Math.abs(Math.sin(now / 110)) * .03 : 0, jump = f.react > 0 ? Math.max(0, Math.sin((1 - f.react / 900) * Math.PI) * .45) : 0;
    return new THREE.Vector3(p.wx + f.x * R, islandY(f.t, now) + walk + jump, p.wz + f.z * R);
  }
  function drawFolk(f, s, sc, now) {
    f.sx = s.x; f.sy = s.y; f.sr = 60 * sc;
    g.save(); g.translate(s.x, s.y); g.scale(sc * f.dir, sc); if (f.spin > 0) g.rotate((1 - f.spin / 700) * TAU);
    g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(0, 4, 30, 6, 0, 0, TAU); g.fill();
    g.fillStyle = f.col; g.strokeStyle = "#101a2e"; g.lineWidth = 3.4; g.lineJoin = "round";
    g.beginPath(); g.moveTo(-34, 0); g.bezierCurveTo(-44, -30, -20, -60, 2, -56); g.bezierCurveTo(30, -60, 46, -28, 36, 0); g.bezierCurveTo(20, 7, -18, 9, -34, 0); g.closePath(); g.fill(); g.stroke();
    const dizzy = f.pokes >= 3 && f.react > 0, happy = f.react > 0 && !dizzy;
    [[-12, -34, 9], [15, -37, 7]].forEach((e) => {
      g.fillStyle = "#fff"; g.beginPath(); g.arc(e[0], e[1], e[2], 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#101a2e";
      if (dizzy) { g.beginPath(); for (let a = 0; a < 9; a += .3) g.lineTo(e[0] + Math.cos(a + now / 90) * a * .6, e[1] + Math.sin(a + now / 90) * a * .6); g.lineWidth = 1.6; g.stroke(); g.lineWidth = 3.4; }
      else if (happy) { g.beginPath(); g.arc(e[0], e[1] + 2, e[2] * .55, Math.PI, 0); g.lineWidth = 2.4; g.stroke(); g.lineWidth = 3.4; }
      else { g.beginPath(); g.arc(e[0] + 2 + Math.sin(now / 900 + f.x * 9) * 1.5, e[1], e[2] * .45, 0, TAU); g.fill(); }
    });
    g.beginPath(); if (happy) { g.moveTo(-8, -17); g.quadraticCurveTo(2, -6, 12, -18); g.lineTo(-8, -17); g.fillStyle = "#101a2e"; g.fill(); } else if (dizzy) { g.moveTo(-8, -14); g.quadraticCurveTo(-2, -19, 3, -14); g.quadraticCurveTo(8, -9, 13, -14); g.lineWidth = 2.6; g.stroke(); } else { g.moveTo(-10, -14); g.quadraticCurveTo(-2, -9, 7, -16); g.lineWidth = 2.6; g.stroke(); }
    g.lineWidth = 3; [[-24, 0], [-6, 5], [16, 4]].forEach((l, i) => { const k = f.wait <= 0 && !f.hop && !reduce && !state.paused ? Math.sin(now / 110 + i * 2) * 4 : 0; g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[0] + k, l[1] + 10); g.stroke(); });
    g.restore();
    if (f.sayT > 0) {
      const fs = Math.max(12, Math.min(16, f.sr * .32)); g.font = "700 " + fs + "px 'Noto Sans TC','Microsoft JhengHei',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      const tw = g.measureText(f.say).width + fs * 1.2, th = fs * 2, bx = s.x, by = s.y - f.sr * 1.15 - th / 2; g.globalAlpha = Math.min(1, f.sayT / 300);
      g.fillStyle = "#fff"; g.strokeStyle = "#101a2e"; g.lineWidth = 2; rr(bx - tw / 2, by - th / 2, tw, th, 10); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(bx - 6, by + th / 2 - 1); g.lineTo(bx, by + th / 2 + 8); g.lineTo(bx + 6, by + th / 2 - 1); g.fill(); g.stroke(); g.fillStyle = "#101a2e"; g.fillText(f.say, bx, by + 1); g.globalAlpha = 1;
    }
  }
  function poke(f) {
    const now = performance.now(); f.pokes = now - f.pokeT < 4000 ? f.pokes + 1 : 1; f.pokeT = now; f.react = 900; f.wait = 1200; f.hop = null;
    const t = f.t, n = info[t].length, gs = {}; info[t].forEach((c) => { gs[c.grade] = 1; });
    const own = ["我住在「" + t + "」島！", "這座島有 " + n + " 章喔", "這裡是" + Object.keys(gs).map((x) => GN[x - 1]).join("、") + "年級會來的地方", "點這座島，看看有哪些章"];
    if (f.pokes >= 3) { f.say = DIZZY[Math.min(DIZZY.length - 1, f.pokes - 3)]; f.spin = 700; } else f.say = Math.random() < .55 ? own[Math.floor(Math.random() * own.length)] : LINES[Math.floor(Math.random() * LINES.length)];
    f.sayT = 2600; burst(f.sx, f.sy - f.sr * .5, f.pokes >= 3 ? 30 : 14, f.pokes >= 3 ? ["#ffd65a", "#ff7a7a", "#b79ae6"] : ["#ffd65a", "#fff3b0", f.col]);
    log(f.pokes >= 3 ? f.name + "被戳到頭暈了" : f.name + "說：「" + f.say + "」");
  }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /* ---------- 粒子、飛鳥 ---------- */
  let parts = [];
  function burst(x, y, n, cols) { if (reduce) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1.5 + Math.random() * 3.5; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 700 + Math.random() * 500, col: cols[i % cols.length], s: 3 + Math.random() * 4 }); } }
  function sparks(dt) {
    parts = parts.filter((q) => (q.life -= dt) > 0);
    parts.forEach((q) => { q.x += q.vx * dt / 16; q.y += q.vy * dt / 16; q.vy += .12 * dt / 16; g.save(); g.globalAlpha = Math.min(1, q.life / 400); g.fillStyle = q.col; g.translate(q.x, q.y); g.rotate(q.life / 200); g.beginPath(); for (let k = 0; k < 5; k++) { const a1 = k * TAU / 5, a2 = a1 + TAU / 10; g.lineTo(Math.cos(a1) * q.s, Math.sin(a1) * q.s); g.lineTo(Math.cos(a2) * q.s * .45, Math.sin(a2) * q.s * .45); } g.closePath(); g.fill(); g.restore(); });
  }
  const birds = []; for (let i = 0; i < 5; i++) birds.push([rnd(i + 61), .08 + rnd(i + 71) * .2, .5 + rnd(i + 81) * .8, rnd(i + 91) * 6]);
  let birdT = 0;
  function drawBirds(now, night) {
    if (night > .5) return; g.save(); g.strokeStyle = "rgba(40,50,80,.55)"; g.lineWidth = 1.6; g.lineCap = "round";
    birds.forEach((b) => { const x = ((b[0] + birdT / 60000 * b[2]) % 1.15 - .08) * W, y = b[1] * H + Math.sin(birdT / 900 + b[3]) * 6, f = Math.sin(birdT / 140 + b[3]) * .5 + .5, s = 6 + b[2] * 4;
      g.beginPath(); g.moveTo(x - s, y - s * .3 * f); g.quadraticCurveTo(x - s * .4, y - s * .5 * f, x, y); g.quadraticCurveTo(x + s * .4, y - s * .5 * f, x + s, y - s * .3 * f); g.stroke(); });
    g.restore();
  }

  /* ---------- 相機（繞著中心轉） ---------- */
  const cam = { yaw: -.5, pitch: .62, dist: 17, tx: 0, tz: 0 };
  let goal = null, idle = 0, touched = false, kind = "", off = { x: 0, y: 0 };
  const MIND = LITE ? 9 : 8, MAXD = 34;
  function placeCamera() {
    const cp = Math.cos(cam.pitch), spn = Math.sin(cam.pitch);
    camera.position.set(cam.tx + cam.dist * cp * Math.sin(cam.yaw), cam.dist * spn, cam.tz + cam.dist * cp * Math.cos(cam.yaw));
    camera.lookAt(cam.tx, -.3, cam.tz);
    if (Math.abs(off.x) > .5 || Math.abs(off.y) > .5) camera.setViewOffset(W, H, off.x, off.y, W, H); else camera.clearViewOffset();
  }
  function startView() { const port = W < 640 && H > W; return { yaw: port ? -Math.PI / 2 - .25 : -.5, pitch: port ? .98 : .62, dist: port ? 19 : W < 640 ? 21 : 17.5, tx: 0, tz: 0 }; }
  function resize() {
    const r = box.getBoundingClientRect(); W = Math.max(280, r.width); H = Math.max(320, r.height); DPR = Math.min(LITE ? 1.5 : 2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); cv.style.width = W + "px"; cv.style.height = H + "px";
    ov.width = W * DPR; ov.height = H * DPR; ov.style.width = W + "px"; ov.style.height = H + "px";
    camera.aspect = W / H; camera.fov = W < 640 && H > W ? 46 : 34; camera.updateProjectionMatrix();
    /* 起始視角只設一次；之後只有版型真的變了（手機轉向）而且還沒動過畫面才重設 */
    const port = W < 640 && H > W, k = port ? "p" : W < 640 ? "s" : "w";
    if (k !== kind && !touched && !state.sel) Object.assign(cam, startView());
    kind = k; dirty = true;
  }
  let dirty = true;
  const ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(box); else window.addEventListener("resize", resize); resize();
  if (!reduce) { const g0 = startView(); cam.yaw += 1.3; cam.pitch = 1.3; cam.dist *= 2; goal = g0; }

  /* ---------- 每一幀 ---------- */
  let last = performance.now(), lastDraw = 0, raf = 0, lastHourLogged = null, skyNow = null;
  const tmpV = new THREE.Vector3();
  function applySky(now) {
    const h = state.hour === null ? clockNow() : state.hour, s = skyAt(h); skyNow = s;
    skyU.top.value.copy(s.top); skyU.mid.value.copy(s.mid); skyU.bot.value.copy(s.bot); scene.fog.color.copy(s.fog); renderer.setClearColor(s.fog);
    starMat.opacity = s.night * .9;
    const day = Math.sin((h - 6) / 12 * Math.PI), el = Math.max(.18, Math.abs(day)), az = (h - 6) / 12 * Math.PI;
    sun.position.set(Math.cos(az) * 14, el * 22, -8 + Math.sin(az) * 4); sun.target.position.set(0, 0, 0); sun.color.copy(s.sun);
    sun.intensity = day > 0 ? 1.2 + 1.6 * Math.sqrt(day) : .9; hemi.color.copy(s.hemi); hemi.groundColor.set(s.night > .5 ? 0x2a2440 : 0x6b5a48); hemi.intensity = 1.35 - s.night * .2;
    winMat.opacity = Math.min(1, s.night * 1.15);
    const ph = Math.floor(h), hk = s.night > .6 ? "night" : s.night > .1 ? (h < 12 ? "dawn" : "dusk") : "day";
    if (hk !== lastHourLogged) { if (lastHourLogged) log(hk === "night" ? "天黑了，島上的房子亮起燈" : hk === "dawn" ? "天快亮了，雲海變成粉紅色" : hk === "dusk" ? "黃昏了，島民準備回家" : "天亮了，又是學數學的好天氣"); lastHourLogged = hk; }
    return s;
  }
  function updateArcs(now) {
    const sel = state.sel;
    arcs.forEach((a) => {
      const show = state.links && (sel ? a.e.a === sel || a.e.b === sel : a.e.n >= 2), hot = sel && show;
      a.tube.visible = show; a.mat.color.set(hot ? (a.e.a === sel ? 0xffc23d : 0x5fdcff) : 0xffffff); a.mat.opacity = hot ? .9 : (skyNow && skyNow.night > .5 ? .35 : .5);
      a.dots.forEach((dm, k) => { dm.visible = show && !reduce; if (!dm.visible) return; const u = ((state.paused ? 0 : now / (2600 + a.e.n * 0)) + a.off + k / a.dots.length) % 1; a.curve.getPoint(u, dm.position); dm.material.color.set(hot ? (a.e.a === sel ? 0xffe28a : 0xaef0ff) : 0xffffff); dm.scale.setScalar(hot ? 1.2 : .8); });
    });
  }
  function updateIslands(now) {
    D.themes.forEach((t) => {
      const I = islands[t], y = islandY(t, now) + ((state.hover === t || state.sel === t) ? .1 : 0);
      I.grp.position.y += (y - I.grp.position.y) * .25;
      if (I.flag && !reduce && !state.paused) I.flag.userData.cloth.rotation.y = Math.sin(now / 300 + I.seed) * .35;
    });
    const s = state.sel && islands[state.sel], h = state.hover && state.hover !== state.sel && islands[state.hover];
    selRing.visible = !!s; if (s) { selRing.position.set(s.grp.position.x, s.grp.position.y + .015, s.grp.position.z); const k = reduce ? 1 : 1 + Math.sin(now / 260) * .04; selRing.scale.set(k, 1, k); }
    hovRing.visible = !!h; if (h) hovRing.position.set(h.grp.position.x, h.grp.position.y + .015, h.grp.position.z);
  }
  /* 年級篩選、搜尋：改島頂顏色與房子顏色（只在條件改變時算） */
  function recolor() {
    const gsel = state.grade;
    D.themes.forEach((t) => {
      const I = islands[t], dim = (gsel && !info[t].some((c) => c.grade === gsel)) || (state.match && !state.match[t]) || offDom(t);
      I.topMat.color.set(I.d.top); if (dim) I.topMat.color.lerp(new THREE.Color(0xd8dde4), .62);
      const ca = I.deco.geometry.attributes.color, wa = I.win && I.win.geometry.attributes.color;
      I.houses.forEach((hs) => {
        const hide = gsel && hs.c.grade !== gsel, hit = state.match && state.match[t] && state.match[t][hs.c.id], grey = new THREE.Color(0xdcdfe6);
        const body = hide || dim ? grey : hit ? hs.col.clone().lerp(new THREE.Color(1, 1, 1), .25) : hs.col, roof = hide || dim ? grey.clone().multiplyScalar(.85) : hs.roofCol;
        for (let i = 0; i < hs.n; i++) { const c = i < hs.bodyN ? body : roof; ca.setXYZ(hs.start + i, c.r, c.g, c.b); }
        if (wa) { const lit = visited(hs.c), w = hide || dim ? new THREE.Color(.25, .25, .3) : lit ? new THREE.Color(1, .82, .38) : new THREE.Color(.75, .62, .38); for (let i = 0; i < hs.wN; i++) wa.setXYZ(hs.wStart + i, w.r, w.g, w.b); }
      });
      ca.needsUpdate = true; if (wa) wa.needsUpdate = true;
    });
    dirty = true;
  }
  recolor();
  function labels(now) {
    if (!state.labels) return;
    g.textAlign = "center"; g.textBaseline = "middle";
    const L = D.themes.map((t) => { const I = islands[t]; tmpV.set(I.grp.position.x, I.grp.position.y + .95, I.grp.position.z).project(camera); const z = tmpV.z; return { t, x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * H, z, d: camera.position.distanceTo(I.grp.position) }; }).filter((o) => o.z < 1 && o.z > -1).sort((a, b) => b.d - a.d);
    L.forEach((o) => {
      const t = o.t, hot = state.sel === t || state.hover === t, dim = (state.grade && !info[t].some((c) => c.grade === state.grade)) || (state.match && !state.match[t]) || offDom(t);
      const fs = Math.max(W < 640 ? 9 : 10, Math.min(18, 210 / o.d * (W < 640 ? .75 : 1))) * (hot ? 1.18 : 1);
      g.font = (hot ? "700 " : "600 ") + fs + "px 'Noto Sans TC','Microsoft JhengHei',sans-serif";
      const tw = g.measureText(t).width + fs * 1.1, th = fs * 1.7;
      g.globalAlpha = dim ? .45 : 1; g.fillStyle = hot ? "#101a2e" : "rgba(255,255,255,.92)"; g.strokeStyle = "rgba(16,26,46,.85)"; g.lineWidth = 1.5;
      rr(o.x - tw / 2, o.y - th / 2, tw, th, th / 2); g.fill(); g.stroke(); g.fillStyle = hot ? "#fff" : "#101a2e"; g.fillText(t, o.x, o.y + 1); g.globalAlpha = 1;
      labelHits.push({ t, box: [o.x - tw / 2, o.y - th / 2, tw, th] });
    });
  }
  let labelHits = [];
  function frame(now) {
    if (!alive) return; raf = requestAnimationFrame(frame);
    const busy = drag || goal || parts.length || folks.some((f) => f.sayT > 0) || dirty;
    const minGap = state.paused && !busy ? 120 : LITE ? 32 : 0; /* 暫停時降到很低的更新率；手機每秒 30 張 */
    if (now - lastDraw < minGap) return;
    const dt = Math.min(64, now - last); last = now; lastDraw = now; dirty = false;
    if (!state.paused) birdT += dt;
    if (goal) { const k = 1 - Math.pow(.0025, dt / 1000); for (const p of ["yaw", "pitch", "dist", "tx", "tz"]) if (goal[p] !== undefined) cam[p] += (goal[p] - cam[p]) * k; if (Math.abs(goal.yaw - cam.yaw) < .002 && Math.abs(goal.dist - cam.dist) < .01 && Math.abs(goal.pitch - cam.pitch) < .002) goal = null; }
    else if (!reduce && !state.paused && !drag && now - idle > 9000 && !state.sel && !state.bird) cam.yaw += dt * .00004;
    const ox = state.inset ? state.inset[0] * W : state.sel ? (W >= 900 ? Math.min(200, W * .15) : 0) : 0, oy = state.inset ? state.inset[1] * H : state.sel && W < 900 ? H * .2 : 0, kk = 1 - Math.pow(.004, dt / 1000); off.x += (ox - off.x) * kk; off.y += (oy - off.y) * kk;
    const s = applySky(now); scene.fog.near = cam.dist * 1.2; scene.fog.far = cam.dist + 48; placeCamera();
    if (!state.paused) clouds.forEach((c) => { c.position.x += c.userData.v * dt * .0006; if (c.position.x > 40) c.position.x = -40; });
    updateIslands(now); updateArcs(now); stepFolks(now, state.paused ? 0 : dt);
    renderer.render(scene, camera);
    /* 上層：鳥、島民、島名、粒子 */
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H); drawBirds(now, s.night);
    if (state.folks) folks.map((f) => { const w = folkWorld(f, now); const p = w.clone().project(camera); return { f, p, d: camera.position.distanceTo(w) }; }).sort((a, b) => b.d - a.d).forEach((o) => {
      if (o.p.z > 1 || o.p.z < -1) { o.f.sr = 0; return; } drawFolk(o.f, { x: (o.p.x + 1) / 2 * W, y: (1 - o.p.y) / 2 * H }, Math.min(1.2, 5.2 / o.d) * (W < 640 ? 1.15 : 1), now); });
    labelHits = []; labels(now); sparks(dt);
  }
  raf = requestAnimationFrame(frame);

  /* GPU 被系統收回（平板記憶體不夠時會發生）：停下來交給外面處理，不讓整頁當掉重整 */
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); alive = false; cancelAnimationFrame(raf); if (opt.onFail) opt.onFail("lost"); }, false);

  /* ---------- 點選與操作 ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(x, y) {
    if (state.folks) for (const f of folks) if (f.sr && Math.hypot(x - f.sx, y - (f.sy - f.sr * .45)) < Math.max(18, f.sr * .75)) return { folk: f };
    if (state.labels) for (let i = labelHits.length - 1; i >= 0; i--) { const b = labelHits[i].box; if (x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]) return { t: labelHits[i].t }; }
    ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0]; if (!hit) return null;
    const t = hit.object.userData.t; let cid;
    if (hit.object.userData.houses && hit.faceIndex !== undefined) { const v = hit.faceIndex * 3; const hs = hit.object.userData.houses.find((h) => v >= h.start && v < h.start + h.n); if (hs) cid = hs.c.id; }
    return { t, c: cid };
  }
  let drag = null, moved = false, pinch = null, lastHover = 0;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  ov.style.pointerEvents = "none";
  cv.addEventListener("pointerdown", (e) => { touched = true; cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, id: e.pointerId }; moved = false; goal = null; idle = performance.now(); });
  cv.addEventListener("pointermove", (e) => {
    idle = performance.now();
    if (drag && drag.id === e.pointerId && !pinch) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; cam.yaw = drag.yaw - dx * .006; cam.pitch = Math.max(.3, Math.min(1.45, drag.pitch + dy * .004)); state.bird = false; dirty = true; return; }
    if (e.pointerType === "touch") return; const now = performance.now(); if (now - lastHover < 50) return; lastHover = now;
    const p = pos(e), h = pick(p[0], p[1]); const nh = h && !h.folk ? h.t : null; if (nh !== state.hover) { state.hover = nh; dirty = true; } cv.style.cursor = h ? "pointer" : "grab";
  });
  cv.addEventListener("pointerup", (e) => { if (drag && !moved && !pinch) { const p = pos(e), h = pick(p[0], p[1]); if (h && h.folk) poke(h.folk); else select(h ? h.t : null, h && h.c); } drag = null; });
  cv.addEventListener("pointerleave", () => { state.hover = null; });
  cv.addEventListener("wheel", (e) => { e.preventDefault(); touched = true; goal = null; cam.dist = Math.max(MIND, Math.min(MAXD, cam.dist * (1 + e.deltaY * .0012))); idle = performance.now(); dirty = true; }, { passive: false });
  cv.addEventListener("touchstart", (e) => { if (e.touches.length === 2) { const a = e.touches[0], b = e.touches[1]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), dist: cam.dist }; moved = true; touched = true; } }, { passive: true });
  cv.addEventListener("touchmove", (e) => { if (pinch && e.touches.length === 2) { const a = e.touches[0], b = e.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); cam.dist = Math.max(MIND, Math.min(MAXD, pinch.dist * pinch.d / d)); dirty = true; } }, { passive: true });
  cv.addEventListener("touchend", (e) => { if (e.touches.length < 2) pinch = null; }, { passive: true });

  function focus(t) {
    const p = P[t]; if (!p) return; let yaw = Math.hypot(p.wx, p.wz) < 1 ? cam.yaw : Math.atan2(p.wx, p.wz);
    while (yaw - cam.yaw > Math.PI) yaw -= TAU; while (yaw - cam.yaw < -Math.PI) yaw += TAU;
    goal = { yaw, pitch: .8, dist: Math.max(MIND + 2, W < 640 ? 17 : 15), tx: p.wx * .85, tz: p.wz * .85 }; state.bird = false;
  }
  function select(t, cid) {
    touched = true;
    if (t && t !== state.sel) { const I = islands[t]; tmpV.set(I.grp.position.x, I.grp.position.y + .3, I.grp.position.z).project(camera); burst((tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, 26, ["#ffd65a", "#fff3b0", "#ff9f6e", "#9fe3ff"]); log("你來到了「" + t + "」島"); }
    state.sel = t; dirty = true;
    if (t) focus(t); else goal = Object.assign(startView(), { yaw: cam.yaw });
    if (opt.onPick) opt.onPick(t, cid);
  }
  function search(q) {
    q = String(q || "").trim(); if (!q) { state.match = null; recolor(); return []; }
    const res = [], m = {};
    D.themes.forEach((t) => { const hitT = t.indexOf(q) >= 0; info[t].forEach((c) => { const hs = c.secs.filter((o) => o.title.indexOf(q) >= 0); if (hitT || c.name.indexOf(q) >= 0 || hs.length) { (m[t] = m[t] || {})[c.id] = 1; res.push({ t, c, secs: hs }); } }); if (hitT) m[t] = m[t] || {}; });
    state.match = m; recolor(); return res;
  }
  const hhmm = (h) => { const m = Math.round((((h % 24) + 24) % 24) * 60); return String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  setTimeout(() => log("歡迎登島！共有 " + D.themes.length + " 座主題島"), 400);
  return {
    data: D, info, GRADE_COL,
    domName: (t) => DOM[D.dom[t]].name, domKey: (t) => D.dom[t], domColor: (t) => DOM[D.dom[t]].top,
    focus: (t) => { state.sel = t; focus(t); }, select, search,
    setGrade: (gr) => { state.grade = gr; recolor(); },
    setHour: (h) => { state.hour = h === null || h === undefined ? null : Math.max(0, Math.min(24, +h)); dirty = true; }, hour: () => (state.hour === null ? clockNow() : state.hour), hourText: (h) => hhmm(h === undefined ? (state.hour === null ? clockNow() : state.hour) : h), auto: () => state.hour === null,
    setLinks: (on) => { state.links = !!on; dirty = true; }, links: () => state.links,
    setDomains: (list) => { state.doms = list && list.length ? list.reduce((o, k) => (o[k] = 1, o), {}) : null; recolor(); },
    setFolks: (on) => { state.folks = !!on; dirty = true; }, folksOn: () => state.folks,
    setInset: (xy) => { state.inset = xy || null; },
    setLabels: (on) => { state.labels = !!on; dirty = true; }, labelsOn: () => state.labels,
    setPaused: (on) => { state.paused = !!on; dirty = true; log(on ? "時間暫停了，島民都定住了" : "時間繼續流動"); }, paused: () => state.paused,
    birdsEye: (on) => { state.bird = !!on; touched = true; goal = on ? { yaw: cam.yaw, pitch: 1.42, dist: W < 640 ? 24 : 22, tx: 0, tz: 0 } : Object.assign(startView(), { yaw: cam.yaw }); if (on) state.sel = null; }, bird: () => state.bird,
    neighbors: (t) => ({ pre: D.edges.filter((e) => e.b === t).sort((a, b) => b.n - a.n), post: D.edges.filter((e) => e.a === t).sort((a, b) => b.n - a.n) }),
    progress: () => { let ti = 0, ci = 0, cn = 0; const seen = {}; D.themes.forEach((t) => { if (explored(t)) ti++; info[t].forEach((c) => { if (seen[c.id]) return; seen[c.id] = 1; cn++; if (visited(c)) ci++; }); }); return { islands: ti, total: D.themes.length, chapters: ci, chTotal: cn }; },
    explored, camera: () => ({ yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist }),
    folks: () => folks.map((f) => ({ name: f.name, t: f.t, x: f.sx, y: f.sy - (f.sr || 0) * .45, r: f.sr })),
    poke: (i) => { const f = folks[(i === undefined ? Math.floor(Math.random() * folks.length) : i) % folks.length]; poke(f); return f.say; },
    destroy: () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); renderer.dispose(); cv.remove(); ov.remove(); }
  };
}
window.NB = window.NB || {}; NB.isle3d = { mount, GRADE_COL };
window.dispatchEvent(new Event("isle3d-ready"));
