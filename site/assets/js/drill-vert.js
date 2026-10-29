/* 無限出題：直式引擎（加、減、乘、長除法；整數與小數）
   題目只要帶 calc:{ op:"+", a:"12.5", b:"3.75" }，排版與答案卷的完整算式都由這裡產生。
   選項（列印設定）：
     mode  filled 直式已列好／self 自己列（只給空白方格）
     grid  cell 虛線方格／col 只有直的對位虛線／none 無
     pv    位值標示（萬千百十個．十分百分…）
     carry 進位、退位小格
   答案卷：進位、退位（劃掉原數字並寫上新數字）、部分積、長除法每一步都會填好（紅字）。 */
(function () {
  "use strict";
  var D = window.DR, V = (D.V = {});
  var PL = ["個", "十", "百", "千", "萬", "十萬", "百萬", "千萬", "億"], PD = ["十分", "百分", "千分", "萬分"];
  function plab(p) { return p >= 0 ? PL[p] || "" : PD[-p - 1] || ""; }
  function parse(s) { s = String(s); var m = /^(\d*)(?:\.(\d+))?$/.exec(s); if (!m) throw new Error("bad number " + s); var i = (m[1] || "0").replace(/^0+(?=\d)/, ""), d = m[2] || ""; return { i: i, d: d, all: i + d, dp: d.length }; }
  function big(s) { return BigInt(s.replace(/^0+(?=\d)/, "") || "0"); }
  function cmpStr(a, b) { /* 比較兩個非負小數字串 */ var A = parse(a), B = parse(b), L = Math.max(A.dp, B.dp), x = big(A.all + "0".repeat(L - A.dp)), y = big(B.all + "0".repeat(L - B.dp)); return x > y ? 1 : x < y ? -1 : 0; }
  V.cmp = cmpStr;

  /* ---------- 版面資料：cells / lines / pts ---------- */
  function L() { return { cells: [], lines: [], pts: [], strikes: [], rows: {}, cols: 0, carryRows: {}, labels: null, brk: null, note: "" }; }
  function put(l, r, c, t, k) { l.cells.push({ r: r, c: c, t: String(t), k: k }); if (c + 1 > l.cols) l.cols = c + 1; }
  function putStr(l, r, endCol, s, k, kz) { /* 字串靠右，最後一位在 endCol */ for (var i = 0; i < s.length; i++) put(l, r, endCol - (s.length - 1 - i), s[i], kz && kz(i) ? kz(i) : k); }

  /* 加減 */
  function addsub(a, b, op) {
    var A = parse(a), B = parse(b), Dd = Math.max(A.dp, B.dp), sc = Math.pow(10, Dd);
    var x = big(A.all + "0".repeat(Dd - A.dp)), y = big(B.all + "0".repeat(Dd - B.dp)), r = op === "+" ? x + y : x - y;
    if (r < 0n) throw new Error("negative");
    var rs = r.toString().padStart(Dd + 1, "0"), I = Math.max(A.i.length, B.i.length, rs.length - Dd), l = L();
    var unit = I; /* 個位所在欄（第 0 欄放運算符號） */
    function col(p) { return unit - p; }
    l.unit = unit; l.dec = Dd;
    /* 被加數／被減數：減法時補 0 方便退位（灰色） */
    var aDigits = A.all + (op === "−" ? "0".repeat(Dd - A.dp) : ""), aDp = op === "−" ? Dd : A.dp;
    var row = 1;
    for (var i = 0; i < aDigits.length; i++) { var p = A.i.length - 1 - i; put(l, row, col(p), aDigits[i], i >= A.all.length ? "gz" : "g"); }
    if (aDp) l.pts.push({ r: row, c: col(0), k: "g" });
    for (i = 0; i < B.all.length; i++) { p = B.i.length - 1 - i; put(l, row + 1, col(p), B.all[i], "g"); }
    if (B.dp) l.pts.push({ r: row + 1, c: col(0), k: "g" });
    put(l, row + 1, 0, op, "op");
    l.lines.push({ r: row + 1, c1: 0, c2: col(-Dd) });
    var rI = rs.length - Dd; for (i = 0; i < rs.length; i++) { p = rI - 1 - i; put(l, row + 2, col(p), rs[i], "a"); }
    if (Dd) l.pts.push({ r: row + 2, c: col(0), k: "a" });
    /* 進位／退位 */
    var xa = (A.all + "0".repeat(Dd - A.dp)).split("").map(Number), ya = (B.all + "0".repeat(Dd - B.dp)).split("").map(Number);
    var na = xa.length, nb = ya.length, n = Math.max(na, nb) + 1, cr = 0;
    function dg(arr, k) { /* 從最右邊數第 k 位 */ var j = arr.length - 1 - k; return j >= 0 ? arr[j] : 0; }
    l.carryRows[0] = 1;
    if (op === "+") { for (var k = 0; k < n; k++) { var s = dg(xa, k) + dg(ya, k) + cr; cr = s >= 10 ? 1 : 0; if (cr) put(l, 0, col(k + 1 - Dd), "1", "c"); } }
    else {
      var cur = xa.slice(), bor = {};
      for (k = 0; k < na; k++) {
        var jj = na - 1 - k, need = dg(ya, k);
        if (cur[jj] < need) { var m = jj - 1; while (m >= 0 && cur[m] === 0) { cur[m] = 9; bor[m] = 9; m--; } cur[m] -= 1; bor[m] = cur[m]; cur[jj] += 10; }
      }
      Object.keys(bor).forEach(function (t) { var kk = na - 1 - t, cc = col(kk - Dd); l.strikes.push({ r: 1, c: cc }); put(l, 0, cc, String(bor[t]), "c"); });
    }
    l.placeAt = function (c) { return unit - c; };
    l.value = (Number(r) / sc);
    return l;
  }

  /* 乘法：台灣教材的直式乘法「靠右對齊」，小數點最後再點；末尾有 0 的整數可用 tz 模式（0 寫在外面） */
  function mul(a, b, tz) {
    var A = parse(a), B = parse(b), za = 0, zb = 0, Ac = A.dp ? A.i + A.d : A.all.replace(/^0+(?=\d)/, ""), Bc = B.dp ? B.i + B.d : B.all.replace(/^0+(?=\d)/, "");
    if (tz && !A.dp && !B.dp) { za = (/0+$/.exec(Ac) || [""])[0].length; zb = (/0+$/.exec(Bc) || [""])[0].length; if (za === Ac.length) za = 0; if (zb === Bc.length) zb = 0; Ac = Ac.slice(0, Ac.length - za); Bc = Bc.slice(0, Bc.length - zb); }
    var core = (big(Ac) * big(Bc)).toString(), bcN = Bc.replace(/^0+(?=\d)/, ""), dps = A.dp + B.dp, rs = core;
    if (dps && rs.length < dps + 1) rs = rs.padStart(dps + 1, "0");
    var parts = [], bd = bcN.split("").reverse();
    if (bcN.length > 1) bd.forEach(function (d, j) { if (d !== "0") parts.push({ j: j, s: (big(Ac) * BigInt(+d)).toString() }); });
    var W = Math.max(rs.length, Ac.length, Bc.length + 0, parts.reduce(function (m, p) { return Math.max(m, p.s.length + p.j); }, 0)) + 1, R = W, l = L();
    l.carryRows[0] = bcN.length === 1 ? 1 : 0;
    var row = 1;
    putStr(l, row, R, Ac, "g"); if (za) putStr(l, row, R + za, "0".repeat(za), "g");
    putStr(l, row + 1, R, Bc, "g"); if (zb) putStr(l, row + 1, R + zb, "0".repeat(zb), "g");
    put(l, row + 1, 0, "×", "op");
    if (A.dp) l.pts.push({ r: row, c: R - A.dp, k: "g" }); if (B.dp) l.pts.push({ r: row + 1, c: R - B.dp, k: "g" });
    var last = R + Math.max(za, zb, za + zb);
    l.lines.push({ r: row + 1, c1: 0, c2: last });
    var rr = row + 2;
    if (parts.length > 1) {
      parts.forEach(function (p) { putStr(l, rr, R - p.j, p.s, "a"); rr++; });
      l.lines.push({ r: rr - 1, c1: 0, c2: last });
    }
    putStr(l, rr, R, rs, "a"); if (za + zb) putStr(l, rr, R + za + zb, "0".repeat(za + zb), "a");
    if (dps) l.pts.push({ r: rr, c: R - dps, k: "a" });
    if (bcN.length === 1) { /* 進位 */ var d = +bcN, cr = 0, ad = Ac.replace(/^0+(?=\d)/, "").split("").reverse(); for (var k = 0; k < ad.length; k++) { var s = +ad[k] * d + cr; cr = Math.floor(s / 10); if (cr && k < ad.length - 1) put(l, 0, R - k - 1, String(cr), "c"); } }
    var unit = R + za + zb - dps; l.placeAt = function (c) { return unit - c; };
    l.value = Number(core + "0".repeat(za + zb)) / Math.pow(10, dps);
    return l;
  }

  /* 長除法。rem:true 停在整數並寫餘數；否則商除到整除（最多 maxDp 位小數） */
  function div(a, b, o) {
    o = o || {}; var A = parse(a), B = parse(b), k = B.dp, note = "";
    /* 除數是小數：被除數、除數同時乘以 10^k */
    var Bi = (B.all.replace(/^0+(?=\d)/, "")), Ad = A.d + "", Ai = A.i;
    if (k) { var mv = Ad.slice(0, k).padEnd(k, "0"); Ai = (Ai + mv).replace(/^0+(?=\d)/, "") || "0"; Ad = Ad.slice(k); note = "除數是小數：除數和被除數同時乘以 " + Math.pow(10, k) + "，變成 " + Ai + (Ad ? "." + Ad : "") + "÷" + Bi; }
    var digs = (Ai + Ad).split("").map(Number), p = Ai.length, added = 0, maxDp = o.maxDp == null ? 4 : o.maxDp, Bn = BigInt(Bi);
    var r = 0n, q = [], steps = [], started = false;
    for (var i = 0; ; i++) {
      if (i >= digs.length) { if (o.rem || r === 0n || i - p >= maxDp) break; digs.push(0); added++; }
      if (o.rem && i >= p) break;
      r = r * 10n + BigInt(digs[i]); var qd = r / Bn; q[i] = Number(qd);
      if (qd > 0n) { steps.push({ e: i, prod: (qd * Bn).toString(), work: r.toString() }); r -= qd * Bn; started = true; }
    }
    var n = Math.max(i, p), lb = Bi.length, l = L(); l.carryRows = {};
    function col(j) { return lb + j; }
    /* 商 */
    var firstQ = q.findIndex(function (v, j) { return v > 0 || j === p - 1; }); if (firstQ < 0) firstQ = p - 1;
    for (var j = Math.max(0, Math.min(firstQ, p - 1)); j < n; j++) put(l, 0, col(j), String(q[j] || 0), "a");
    var decQ = n > p; if (decQ) l.pts.push({ r: 0, c: col(p - 1), k: "a" });
    /* 除數與被除數 */
    putStr(l, 1, lb - 1, Bi, "g");
    for (j = 0; j < digs.length; j++) put(l, 1, col(j), String(digs[j]), j >= digs.length - added ? "gz" : "g");
    if (Ad.length || added) l.pts.push({ r: 1, c: col(p - 1), k: "g" });
    l.brk = { r: 1, c1: col(0), c2: col(Math.max(digs.length, n) - 1) };
    /* 每一步：乘積、橫線、餘數＋拉下來的位 */
    var row = 2;
    steps.forEach(function (s, si) {
      putStr(l, row, col(s.e), s.prod, "a");
      l.lines.push({ r: row, c1: col(s.e - s.prod.length + 1), c2: col(s.e) });
      var nxt = steps[si + 1], endE = nxt ? nxt.e : n - 1, shown = nxt ? nxt.work : r.toString();
      putStr(l, row + 1, col(endE), shown, "a");
      row += 2;
    });
    if (!steps.length) { putStr(l, 2, col(n - 1), r.toString(), "a"); }
    l.cols = Math.max(l.cols, col(Math.max(digs.length, n)));
    var unit = col(p - 1); l.placeAt = function (c) { return c >= lb ? unit - c : null; };
    l.quot = q.slice(0, n).join("").replace(/^0+(?=\d)/, ""); l.qp = p; l.rem = r.toString(); l.note = note;
    l.value = Number((q.slice(0, p).join("") || "0") + (n > p ? "." + q.slice(p, n).join("") : ""));
    return l;
  }

  V.layout = function (c) { if (c.op === "+" || c.op === "−") return addsub(c.a, c.b, c.op); if (c.op === "×") return mul(c.a, c.b, c.tz); return div(c.a, c.b, c); };

  /* ---------- 畫成 SVG ---------- */
  var RED = "#c0392b", GREY = "#9aa1ab";
  V.svg = function (c, md, O) {
    O = O || {}; var l = V.layout(c), u = O.u || 26, ch = Math.round(u * 0.62), self = O.mode === "self" && md === "q";
    /* 小數乘法是「先靠右對齊算成整數，最後再點小數點」，欄位不等於位值
       （2.4×3 的 3 會排在十分位那一欄），所以這種題不掛位值表頭，免得標錯 */
    var decMul = c.op === "×" && (/\./.test(String(c.a)) || /\./.test(String(c.b)));
    var pv = O.pv !== false && md !== "o-none" && !decMul;
    var rows = [], maxR = 0; l.cells.forEach(function (x) { if (x.r > maxR) maxR = x.r; }); l.lines.forEach(function (x) { if (x.r > maxR) maxR = x.r; });
    var extra = O.extra || 0; maxR += extra;
    var hasCarry = !!l.carryRows[0] && O.carry !== false && c.op !== "÷", ys = [], y = pv ? 16 : 4;
    for (var r = 0; r <= maxR; r++) { ys[r] = y; y += r === 0 && c.op !== "÷" ? (hasCarry ? ch : 0) : u; }
    var H = y + 6, padL = 6, W = padL + l.cols * u + 6;
    function X(col) { return padL + col * u; }
    var s = "", i;
    /* 方格／對位線：題目卷用淡灰虛線 */
    var g0 = c.op === "÷" ? 0 : 1, gc0 = c.op === "÷" ? 0 : 1;
    if (O.grid !== "none") {
      var top = ys[g0], bot = ys[maxR] + u;
      for (i = gc0; i <= l.cols; i++) s += '<line x1="' + X(i) + '" y1="' + top + '" x2="' + X(i) + '" y2="' + bot + '" stroke="#b9b2a3" stroke-width=".7" stroke-dasharray="2 2.5"/>';
      if (O.grid !== "col") for (r = g0; r <= maxR + 1; r++) { var yy = r <= maxR ? ys[r] : bot; s += '<line x1="' + X(gc0) + '" y1="' + yy + '" x2="' + X(l.cols) + '" y2="' + yy + '" stroke="#b9b2a3" stroke-width=".7" stroke-dasharray="2 2.5"/>'; }
    }
    /* 位值標示 */
    if (pv && l.placeAt) { var done = {}; for (i = 0; i < l.cols; i++) { var p = l.placeAt(i); if (p == null || done[i]) continue; var t = plab(p); if (!t || (c.op !== "÷" && i === 0)) continue; s += '<text x="' + (X(i) + u / 2) + '" y="' + (pv ? 11 : 0) + '" text-anchor="middle" font-size="' + (t.length > 1 ? 7.5 : 9) + '" fill="#7a7f88" stroke="none">' + t + "</text>"; } }
    /* 進位小格（題目卷） */
    if (hasCarry && md !== "a" && !self) for (i = 1; i < l.cols; i++) s += '<rect x="' + (X(i) + u * 0.3) + '" y="' + (ys[0] + 2) + '" width="' + u * 0.4 + '" height="' + (ch - 5) + '" rx="1.5" fill="none" stroke="#c9c2b2" stroke-width=".7" stroke-dasharray="1.5 1.5"/>';
    /* 數字 */
    l.cells.forEach(function (x) {
      var show = x.k === "op" ? !self : x.k === "g" || x.k === "gz" ? !self : md === "a";
      if (x.k === "c" && (!hasCarry || md !== "a")) show = false;
      if (!show) return;
      var small = x.k === "c", fs = small ? u * 0.46 : u * 0.66, cy = small ? ys[x.r] + ch * 0.62 : ys[x.r] + u * 0.56;
      var fill = x.k === "a" || x.k === "c" ? RED : x.k === "gz" ? GREY : "currentColor";
      s += '<text x="' + (X(x.c) + u / 2) + '" y="' + cy + '" text-anchor="middle" dominant-baseline="middle" font-size="' + fs + '" fill="' + fill + '" stroke="none" font-family="Iansui,LXGW WenKai TC,serif">' + x.t + "</text>";
    });
    if (md === "a" && hasCarry) l.strikes.forEach(function (k) { s += '<line x1="' + (X(k.c) + u * 0.25) + '" y1="' + (ys[k.r] + u * 0.8) + '" x2="' + (X(k.c) + u * 0.75) + '" y2="' + (ys[k.r] + u * 0.25) + '" stroke="' + RED + '" stroke-width="1.2"/>'; });
    /* 小數點 */
    l.pts.forEach(function (p) { if (self || (p.k === "a" && md !== "a")) return; s += '<circle cx="' + (X(p.c) + u) + '" cy="' + (ys[p.r] + u * 0.86) + '" r="1.9" fill="' + (p.k === "a" ? RED : "currentColor") + '" stroke="none"/>'; });
    /* 橫線 */
    l.lines.forEach(function (ln) { var given = c.op !== "÷" && ln.r === 2; if (given ? self : md !== "a") return; s += '<line x1="' + X(ln.c1) + '" y1="' + (ys[ln.r] + u) + '" x2="' + X(ln.c2 + 1) + '" y2="' + (ys[ln.r] + u) + '" stroke="' + (given ? "currentColor" : RED) + '" stroke-width="1.5"/>'; });
    /* 除法框 */
    if (l.brk && !self) { var b = l.brk, by = ys[b.r]; s += '<path d="M' + (X(b.c1) - 1) + " " + (by + u + 1) + "Q" + (X(b.c1) + 5) + " " + (by + u / 2) + " " + (X(b.c1) - 1) + " " + by + "H" + X(b.c2 + 1) + '" fill="none" stroke="currentColor" stroke-width="1.6"/>'; }
    var svg = '<svg class="dfig dcalc" viewBox="0 0 ' + W + " " + H + '" width="' + Math.round(W * (O.k || 0.82)) + '" height="' + Math.round(H * (O.k || 0.82)) + '" aria-hidden="true">' + s + "</svg>";
    if (l.note && (md === "a" || md === "o")) svg += '<div class="dcap">' + l.note + "</div>";
    return svg;
  };
})();
