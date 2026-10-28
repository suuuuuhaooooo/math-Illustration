/* 題數、答數與配分（審題預覽、試卷、PPT 共用）。
   「題」＝卷面上的一個題號；「答」＝要作答的空格數。
   - 題組（同一個 gid 的小題）合併顯示時算 1 題、小題數就是答數；不合併時每個小題各算 1 題 1 答
   - 連連看每一組配對算 1 答；其他題型 1 題 1 答
   配分方式 per：q＝每題 X 分、a＝每答 X 分（仿康軒「每答 6.2 分」）。配分到小數一位。 */
(function () {
  "use strict";
  var TYW = { tf: 2, choice: 3, num: 4, text: 4, multi: 4, match: 5, group: 6, any: 5 }, KDW = { "應用題": 1.8, "情境題": 1.5, "圖表題": 1.3 };
  function r1(x) { return Math.round(x * 10) / 10; }
  function ansN(q) { return q && q.ty === "match" && q.L ? Math.max(1, q.L.length) : 1; }
  /* 依題目順序切成「題號」：merge＝題組併成一題；回傳 [{qs:[…], s, gid, i0}]，i0＝第一題在 qs 裡的位置 */
  function blocks(qs, merge) {
    var out = [];
    qs.forEach(function (q, i) { var l = out[out.length - 1]; if (merge && q.gid && l && l.gid === q.gid && l.s === q.s) l.qs.push(q); else out.push({ qs: [q], s: q.s, gid: merge ? q.gid : undefined, i0: i }); });
    return out;
  }
  function blockAns(b) { return b.qs.reduce(function (a, q) { return a + ansN(q); }, 0); }
  /* 每個大題的統計：nq 題數、na 答數、units 計分單位數（每題＝題數，有選答就取選答數；每答＝答數）、sub 小計 */
  function stats(qs, secs, merge) {
    if (!secs) return [];
    var bs = blocks(qs, merge);
    return secs.map(function (sec, si) {
      var mine = bs.filter(function (b) { return b.s === si; }), nq = mine.length, na = mine.reduce(function (a, b) { return a + blockAns(b); }, 0);
      var per = sec.per === "a" ? "a" : "q", take = per === "q" && sec.take && sec.take < nq ? sec.take : 0, units = per === "a" ? na : take || nq, pts = +sec.pts || 0;
      return { i: si, ty: sec.ty, kd: sec.kd, nq: nq, na: na, per: per, take: take, units: units, pts: pts, sub: r1(pts * units) };
    });
  }
  function total(st) { return r1(st.reduce(function (a, x) { return a + x.sub; }, 0)); }
  function weight(x) { var w = x.per === "a" && (x.ty === "group" || x.ty === "match") ? 4 : TYW[x.ty] || 4; return w * (KDW[x.kd] || 1); }
  /* 平均配分：每個計分單位一樣多分（取到小數一位），剩下的 0.1 分從後面的大題補，盡量湊到滿分 */
  function even(st, full) {
    var U = st.reduce(function (a, x) { return a + x.units; }, 0); if (!U) return null;
    var each = Math.floor(full / U * 10) / 10, pts = st.map(function () { return each; }), left = Math.round((full - each * U) * 10);
    for (var pass = 0; pass < 5 && left > 0; pass++) for (var k = st.length - 1; k >= 0 && left > 0; k--) { var u = st[k].units; if (u > 0 && u <= left) { pts[k] = r1(pts[k] + 0.1); left -= u; } }
    return pts;
  }
  /* 智慧配分：越花時間的題型、題目類別，每題（每答）分數越高；在「總分剛好等於滿分」的條件下找最接近理想比例的一組（小型動態規劃，單位 0.1 分） */
  function smart(st, full) {
    var W = st.map(weight), den = st.reduce(function (a, x, i) { return a + W[i] * x.units; }, 0); if (!den) return null;
    var T = Math.round(full * 10), ideal = W.map(function (w) { return w * full / den; });
    var cand = st.map(function (x, i) {
      if (!x.units) return [{ p: x.pts, c: 0, w: 0 }];
      var base = Math.round(ideal[i] * 10), out = [];
      for (var k = -15; k <= 15; k++) { var p10 = base + k; if (p10 < 1) continue; out.push({ p: p10 / 10, c: Math.pow((p10 / 10 - ideal[i]) / ideal[i], 2), w: p10 * x.units }); }
      return out;
    });
    var cur = { 0: { c: 0, ch: [] } };
    cand.forEach(function (cs) { var nx = {}; Object.keys(cur).forEach(function (r) { cs.forEach(function (x) { var t = +r + x.w; if (t > T) return; var c = cur[r].c + x.c; if (!nx[t] || c < nx[t].c) nx[t] = { c: c, ch: cur[r].ch.concat(x.p) }; }); }); cur = nx; });
    if (cur[T]) return cur[T].ch;
    var best = null; Object.keys(cur).forEach(function (t) { if (best === null || T - t < T - best) best = +t; }); /* 湊不到剛好：取不超過滿分、最接近的一組 */
    return best === null ? ideal.map(function (p) { return Math.max(0.1, Math.floor(p * 10) / 10); }) : cur[best].ch;
  }
  /* 大題標題的說明文字，例如「共 10 題 16 答，每答 6.2 分，共 99.2 分」 */
  function secNote(x) {
    var d = [];
    if (x.take) d.push("共 " + x.nq + " 題，任選 " + x.take + " 題作答"); else d.push("共 " + x.nq + " 題" + (x.na !== x.nq ? " " + x.na + " 答" : ""));
    if (x.pts > 0) { d.push((x.per === "a" ? "每答 " : "每題 ") + x.pts + " 分"); d.push("共 " + x.sub + " 分"); }
    return d.join("，");
  }
  window.NB = window.NB || {}; NB.score = { ansN: ansN, blocks: blocks, blockAns: blockAns, stats: stats, total: total, even: even, smart: smart, secNote: secNote, r1: r1 };
})();
