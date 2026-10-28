/* QR code 產生器（不靠外部套件）：位元組模式、錯誤更正等級 M、版本 1～10（網址約 200 字以內）。
   演算法依 ISO/IEC 18004（參考 Nayuki 的 QR Code generator，MIT）。
   用法：NB.qr.svg("https://…", { px: 4 }) → SVG 字串；NB.qr.matrix(文字) → 二維陣列（true＝黑） */
(function () {
  "use strict";
  var ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26], BLK = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  function rawModules(v) { var r = (16 * v + 128) * v + 64; if (v >= 2) { var na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; } return r; }
  function dataCw(v) { return Math.floor(rawModules(v) / 8) - ECC[v] * BLK[v]; }
  function gmul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; }
  function rsDiv(deg) { var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1); var root = 1; for (i = 0; i < deg; i++) { for (var j = 0; j < r.length; j++) { r[j] = gmul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gmul(root, 2); } return r; }
  function rsRem(data, div) { var r = div.map(function () { return 0; }); data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); div.forEach(function (c, i) { r[i] ^= gmul(c, f); }); }); return r; }
  function alignPos(v) { if (v === 1) return []; var n = Math.floor(v / 7) + 2, size = v * 4 + 17, step = Math.floor((v * 8 + n * 3 + 5) / (n * 4 - 4)) * 2, r = [6]; for (var p = size - 7; r.length < n; p -= step) r.splice(1, 0, p); return r; }
  function matrix(text) {
    var bytes = Array.from(new TextEncoder().encode(String(text))), v;
    for (v = 1; v <= 10; v++) if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= dataCw(v) * 8) break;
    if (v > 10) throw new Error("QR 內容太長");
    var bits = [], put = function (val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCw(v) * 8; put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; data.push(b); }
    /* 分塊加上錯誤更正碼，再交錯排列 */
    var nb = BLK[v], el = ECC[v], raw = Math.floor(rawModules(v) / 8), nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDiv(el), blocks = [], off = 0;
    for (i = 0; i < nb; i++) { var d = data.slice(off, off + shortLen - el + (i < nShort ? 0 : 1)); off += d.length; var e = rsRem(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(e)); }
    var cw = []; for (i = 0; i < blocks[0].length; i++) for (var j = 0; j < nb; j++) if (i !== shortLen - el || j >= nShort) cw.push(blocks[j][i]);
    /* 功能圖形 */
    var size = v * 4 + 17, M = [], F = [];
    for (i = 0; i < size; i++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    function set(x, y, on) { M[y][x] = on; F[y][x] = true; }
    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (p) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var xx = p[0] + dx, yy = p[1] + dy, dist = Math.max(Math.abs(dx), Math.abs(dy)); if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, dist !== 2 && dist !== 4); } });
    var ap = alignPos(v), na = ap.length;
    for (i = 0; i < na; i++) for (j = 0; j < na; j++) { if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue; for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) set(ap[i] + dx2, ap[j] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1); }
    function fmt(mask) {
      var dat = (0 << 3) | mask, rem = dat; for (var t = 0; t < 10; t++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537); var fb = ((dat << 10) | rem) ^ 0x5412, bit = function (n) { return ((fb >>> n) & 1) !== 0; }; /* 等級 M 的格式碼是 00 */
      for (t = 0; t <= 5; t++) set(8, t, bit(t)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (t = 9; t < 15; t++) set(14 - t, 8, bit(t));
      for (t = 0; t < 8; t++) set(size - 1 - t, 8, bit(t)); for (t = 8; t < 15; t++) set(8, size - 15 + t, bit(t)); set(8, size - 8, true);
    }
    fmt(0);
    if (v >= 7) { var rem = v; for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25); var vb = (v << 12) | rem; for (i = 0; i < 18; i++) { var on = ((vb >>> i) & 1) !== 0, a = size - 11 + i % 3, bb = Math.floor(i / 3); set(a, bb, on); set(bb, a, on); } }
    /* 資料：由右下角開始兩欄一組蛇行 */
    var n = 0;
    for (var right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) { var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert; if (!F[y][x] && n < cw.length * 8) { M[y][x] = ((cw[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; } } }
    /* 挑扣分最少的遮罩 */
    var MK = [function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; }, function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; }, function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; }, function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }];
    function apply(m) { for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!F[y][x] && MK[m](x, y)) M[y][x] = !M[y][x]; }
    function penalty() {
      var p = 0, dark = 0, y, x;
      for (y = 0; y < size; y++) { var run = 1; for (x = 1; x < size; x++) { if (M[y][x] === M[y][x - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (x = 0; x < size; x++) { var r2 = 1; for (y = 1; y < size; y++) { if (M[y][x] === M[y - 1][x]) { r2++; if (r2 === 5) p += 3; else if (r2 > 5) p++; } else r2 = 1; } }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
      var pat = [true, false, true, true, true, false, true];
      for (y = 0; y < size; y++) for (x = 0; x + 6 < size; x++) { var okR = true, okC = true; for (var k = 0; k < 7; k++) { if (M[y][x + k] !== pat[k]) okR = false; if (M[x + k][y] !== pat[k]) okC = false; } if (okR) p += 40; if (okC) p += 40; }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (M[y][x]) dark++;
      return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) { apply(m); fmt(m); var pp = penalty(); if (pp < bestP) { bestP = pp; best = m; } apply(m); }
    apply(best); fmt(best);
    return M;
  }
  /* 黑白方格的 SVG（外圍留 4 格白邊，掃描比較穩） */
  function svg(text, o) {
    o = o || {}; var M = matrix(text), n = M.length, q = 4, d = "";
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (M[y][x]) d += "M" + (x + q) + " " + (y + q) + "h1v1h-1z";
    var w = (n + q * 2) * (o.px || 3);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + q * 2) + " " + (n + q * 2) + '" width="' + w + '" height="' + w + '" shape-rendering="crispEdges"' + (o.label ? ' role="img" aria-label="' + String(o.label).replace(/"/g, "") + '"' : ' aria-hidden="true"') + '><rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }
  var root = typeof window !== "undefined" ? window : globalThis;
  root.NB = root.NB || {}; root.NB.qr = { matrix: matrix, svg: svg };
})();
