/* 表格統一升級：表格自己在框內上下左右捲動、表頭凍結、可搜尋、可用下拉篩選、點表頭排序。
   只要是 <table class="tb"> 都會自動套用（題庫後台自己有一套，已排除）。純前端，不碰資料。 */
(function () {
  "use strict";
  function txt(c) { var k = c.cloneNode(true); k.querySelectorAll("rt,rp").forEach(function (x) { x.remove(); }); return (k.textContent || "").replace(/\s+/g, " ").trim(); }
  function num(s) { var m = /-?\d+(\.\d+)?/.exec(s.replace(/,/g, "")); return m ? parseFloat(m[0]) : null; }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h) e.innerHTML = h; return e; }
  function enhance(tb) {
    if (tb.__fx || tb.closest(".bkwrap,.tbscroll,[data-nofx]")) return; tb.__fx = 1;
    var all = Array.prototype.slice.call(tb.rows); if (all.length < 2) return;
    var head = all[0], body = all.slice(1), cols = head.cells.length;
    var wrap = el("div", "tbx"), sc = el("div", "tbscroll");
    tb.parentNode.insertBefore(wrap, tb); sc.appendChild(tb);
    var bar = null, q = null, sels = [], cnt = null;
    function apply() {
      var s = q ? q.value.trim().toLowerCase() : "", n = 0;
      body.forEach(function (r) {
        var ok = true;
        if (s && txt(r).toLowerCase().indexOf(s) < 0) ok = false;
        sels.forEach(function (o) { if (ok && o.s.value && txt(r.cells[o.c] || r) !== o.s.value) ok = false; });
        r.style.display = ok ? "" : "none"; if (ok) n++;
      });
      if (cnt) cnt.textContent = n === body.length ? "共 " + n + " 列" : "符合 " + n + " / " + body.length + " 列";
    }
    if (body.length >= 8) {
      bar = el("div", "tbbar nozy"); q = el("input"); q.type = "search"; q.placeholder = "搜尋這張表…"; q.setAttribute("aria-label", "搜尋"); q.oninput = apply; bar.appendChild(q);
      for (var c = 0; c < cols; c++) {
        var name = txt(head.cells[c]); if (!name) continue;
        var vals = {}, cntv = 0, long = false;
        body.forEach(function (r) { var v = r.cells[c] ? txt(r.cells[c]) : ""; if (!v) return; if (v.length > 12) long = true; if (!vals[v]) { vals[v] = 1; cntv++; } });
        if (long || cntv < 2 || cntv > 10 || cntv >= body.length * .7) continue;
        var se = el("select"); se.setAttribute("aria-label", name); se.appendChild(new Option("全部" + name, ""));
        Object.keys(vals).sort(function (a, b) { var x = num(a), y = num(b); return x !== null && y !== null ? x - y : a.localeCompare(b, "zh-Hant"); }).forEach(function (v) { se.appendChild(new Option(v, v)); });
        se.onchange = apply; bar.appendChild(se); sels.push({ c: c, s: se });
      }
      cnt = el("span", "tbcnt"); bar.appendChild(cnt); wrap.appendChild(bar);
    }
    wrap.appendChild(sc);
    var dir = {}; /* 點表頭排序：再點一次反向 */
    Array.prototype.forEach.call(head.cells, function (th, c) {
      if (!txt(th)) return; th.classList.add("tbsort"); th.setAttribute("title", "點一下排序");
      th.addEventListener("click", function (e) {
        if (e.target.closest("a,button,input,select")) return;
        var d = dir[c] = dir[c] === 1 ? -1 : 1;
        Array.prototype.forEach.call(head.cells, function (x) { x.removeAttribute("data-sort"); }); th.setAttribute("data-sort", d === 1 ? "asc" : "desc");
        var par = body[0].parentNode, key = body.map(function (r, i) { var t = r.cells[c] ? txt(r.cells[c]) : ""; return { r: r, i: i, t: t, n: num(t) }; });
        var numeric = key.every(function (k) { return k.n !== null || k.t === "" || k.t === "—"; });
        key.sort(function (a, b) {
          var x = numeric ? (a.n === null ? -Infinity : a.n) : a.t, y = numeric ? (b.n === null ? -Infinity : b.n) : b.t;
          var v = numeric ? (x === y ? 0 : x < y ? -1 : 1) : String(x).localeCompare(String(y), "zh-Hant");
          return v ? v * d : a.i - b.i;
        });
        key.forEach(function (k) { par.appendChild(k.r); });
      });
    });
    apply();
  }
  function scan(root) { if (!root || root.nodeType !== 1) return; if (root.matches && root.matches("table.tb")) enhance(root); root.querySelectorAll && root.querySelectorAll("table.tb").forEach(enhance); }
  function go() { scan(document.body); new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(scan); }); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
})();
