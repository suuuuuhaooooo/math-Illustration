/* 弱點分析：雷達圖與分類長條（學員專區的「學習進度」、老師後台的「班級分析」與個人檔案共用）。
   純 SVG，不靠外部套件；顏色全部用頁面的 CSS 變數，永晝／永夜都跟著換。
   資料都是已經在畫面上的東西（個人資料的各單元統計、班級分析的彙整），這支程式不呼叫 API。

   NB.sk.panel(容器, 選項)
     U    各單元 {單元代號: {n, c}}（學生自己、個人檔案用）
     CH   已經彙整好的各章 {章代號: [作答, 答對, 人數, 低於60%人數]}（全班用；有 CH 就不看 U）
     ref  拿來對照的各章（個人檔案疊一層「全班平均」）
     st / refSt  各主題 {N: [作答, 答對, 人數?]}；沒給就用 U 加上單元→主題對照表（M.cfg.us）自己算
     ax / refAx  分類統計 {d: {1: [n, c]}, k: {...}, g: {...}}
     who  "me" 學生自己／"class" 全班／"stu" 老師看某位同學
     link 單元代號 → 練習網址（沒給就不顯示「去練習」） */
(function () {
  "use strict";
  var NB = window.NB = window.NB || {};
  var MIN_CH = 3;      /* 一章至少作答幾題才畫上雷達圖（太少的話答對率沒有意義） */
  var MIN_WEAK = 5;    /* 列入「先補這幾章」至少要幾題 */
  var WEAK = 70;       /* 答對率低於這個數字算待加強 */
  var LINE = 60;       /* 雷達圖上特別標出來的那一圈 */
  var STRAND = { N: "數與量", S: "空間與形狀", R: "關係", D: "資料與不確定性" };
  var LVL = { 1: "基礎", 2: "應用", 3: "挑戰" };
  var CN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pc(c, n) { return n ? Math.round(c / n * 100) : null; }
  function h(s) { var d = document.createElement("div"); d.innerHTML = s.trim(); return d.firstChild; }

  /* 樣式只在第一次用到時加進頁面，不必改共用的 CSS 檔 */
  var styled = false;
  function style() {
    if (styled) return; styled = true;
    var css = ".skp{margin:.4em 0 1em}" +
      ".skp .sk-sems{display:flex;flex-wrap:wrap;gap:6px;margin:.3em 0 .6em}" +
      ".skp .sk-main{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:18px;align-items:start}" +
      ".skp .sk-radar{width:100%;max-width:420px;height:auto;display:block;margin:0 auto;overflow:visible}" +
      ".skp .sk-radar text{font-family:var(--sans)}" +
      ".skp .sk-weak{display:flex;flex-direction:column;gap:10px;min-width:0}" +
      ".skp .sk-w{border:1.5px solid var(--line);border-radius:12px;padding:10px 12px}" +
      ".skp .sk-w b{display:block}.skp .sk-w .sk-u{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:6px;font-size:.9rem}" +
      ".skp .sk-w .sk-u span{min-width:0}.skp .sk-w .sk-u .pen{flex:none;padding:2px 10px;font-size:.85rem}" +
      ".skp .sk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:14px}" +
      ".skp .sk-box h4{margin:0 0 4px;font-size:.95rem}" +
      ".skp .sk-m{margin:0 0 9px}.skp .sk-mh{display:flex;justify-content:space-between;gap:8px;font-size:.9rem;margin-bottom:3px}.skp .sk-mh small{color:var(--soft)}" +
      ".skp .sk-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:.82rem;color:var(--soft);margin-top:2px;justify-content:center}" +
      ".skp .sk-legend i{display:inline-block;width:18px;height:0;border-top:2.5px solid var(--p3);vertical-align:middle;margin-right:5px}" +
      ".skp .sk-legend i.ref{border-top:2px dashed var(--soft)}.skp .sk-legend i.ln{border-top:1.5px dashed var(--p1)}" +
      ".skp .sk-miss{font-size:.85rem;color:var(--soft);margin-top:6px}" +
      "@media(max-width:640px){.skp .sk-main{grid-template-columns:1fr}}";
    var el = document.createElement("style"); el.textContent = css; document.head.appendChild(el);
  }

  /* ---- 章節：單元代號 6uk-1.3 → 章 6uk-1 → 學期 6uk ---- */
  function byId(id) {
    if (NB.ed && NB.ed.byId) return NB.ed.byId(id);
    var f = NB.flat || []; for (var i = 0; i < f.length; i++) if (f[i].id === id) return f[i];
    return null;
  }
  function chKey(u) { return String(u).replace(/\.\d+$/, ""); }
  function semKey(ch) { return String(ch).replace(/-[^-]+$/, ""); }
  /* 一章的名稱：用這一章第一節去查目錄 */
  function chInfo(ch, anyUnit) {
    var o = (anyUnit && byId(anyUnit)) || byId(ch + ".1");
    var no = +String(ch).split("-").pop();
    if (o && o.ch) return { sem: o.sem, no: o.ch.no || no, name: o.ch.name };
    return { sem: semKey(ch), no: no, name: "第 " + no + " 章" };
  }
  function cmpId(a, b) { return NB.ed && NB.ed.cmp ? NB.ed.cmp(a, b) : (a < b ? -1 : a > b ? 1 : 0); }

  /* U（各單元）→ 各章 [作答, 答對]，並記住每章裡的單元，給「先補這幾章」用 */
  function chaptersFromU(U) {
    var out = {};
    Object.keys(U || {}).forEach(function (u) {
      var x = U[u]; if (!x || !x.n) return;
      var k = chKey(u), C = out[k] = out[k] || { n: 0, c: 0, units: [] };
      C.n += x.n; C.c += x.c || 0; C.units.push(u);
    });
    return out;
  }
  function chaptersFromCH(CH) {
    var out = {};
    Object.keys(CH || {}).forEach(function (k) { var r = CH[k]; if (r && r[0]) out[k] = { n: r[0], c: r[1], s: r[2], low: r[3], units: [] }; });
    return out;
  }
  /* 依學期分組，學期與章都照課本順序 */
  function groupSems(chs) {
    var by = {};
    Object.keys(chs).forEach(function (k) { var s = semKey(k); (by[s] = by[s] || []).push(k); });
    var keys = Object.keys(by).sort(cmpId), labels = {}, seen = {};
    keys.forEach(function (s) { var f = by[s].sort(cmpId)[0], inf = chInfo(f, chs[f].units[0]); labels[s] = inf.sem; seen[inf.sem] = (seen[inf.sem] || 0) + 1; });
    /* 同一個學期有兩個版本（例如換過課本）才在後面註明是哪一版 */
    keys.forEach(function (s) { if (seen[labels[s]] > 1 && NB.ed && NB.ed.edOf) { var e = NB.ed.edOf(by[s][0] + ".1"); labels[s] += e ? "・" + NB.ed.name(e) : "・通用"; } });
    return { keys: keys, by: by, labels: labels };
  }
  /* 預設學期：現在這個學期（8 月～1 月上學期、2 月～7 月下學期）有資料就用它，否則用作答最多的 */
  function pickSem(G, chs, grade) {
    var m = new Date().getMonth() + 1, ud = m >= 8 || m === 1 ? "u" : "d", want = grade ? String(grade) + ud : "";
    for (var i = 0; i < G.keys.length; i++) if (want && G.keys[i].indexOf(want) === 0) return G.keys[i];
    var best = G.keys[0], bn = -1;
    G.keys.forEach(function (s) { var n = G.by[s].reduce(function (a, k) { return a + chs[k].n; }, 0); if (n > bn) { bn = n; best = s; } });
    return best;
  }

  /* ---- 雷達圖 ----
     axes [{l: 標籤, v: 0~100, n: 題數, r: 對照值或 null}]；值都是答對率 */
  /* 標籤最多兩行，太長的第二行結尾用「…」 */
  function wrap(s, w) { s = String(s); if (s.length <= w) return [s]; if (s.length <= w * 2) return [s.slice(0, w), s.slice(w)]; return [s.slice(0, w), s.slice(w, w * 2 - 1) + "…"]; }
  function radar(axes, opt) {
    opt = opt || {};
    var N = axes.length, sm = !!opt.small, bg = !sm && !!opt.big, W = sm ? 330 : 440, H = sm ? 300 : 400, cx = W / 2, cy = sm ? 150 : 196, R = sm ? 82 : bg ? 104 : 128, F = sm || bg ? 15 : 11.5, LH = F + 2, i;
    var ang = function (k) { return -Math.PI / 2 + k * 2 * Math.PI / N; };
    var pt = function (k, v) { var a = ang(k), r = R * Math.max(0, Math.min(100, v)) / 100; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    var poly = function (vals) { return vals.map(function (v, k) { var p = pt(k, v); return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); };
    var s = '<svg class="sk-radar" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opt.label || "雷達圖") + '">';
    [25, 50, 75, 100].forEach(function (g) { s += '<polygon points="' + poly(axes.map(function () { return g; })) + '" fill="none" stroke="var(--line)" stroke-width="1"/>'; });
    s += '<polygon points="' + poly(axes.map(function () { return LINE; })) + '" fill="none" stroke="var(--p1)" stroke-width="1.3" stroke-dasharray="4 4" opacity=".85"/>';
    for (i = 0; i < N; i++) { var e = pt(i, 100); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>'; }
    [50, 100].forEach(function (g) { s += '<text x="' + (cx + 4) + '" y="' + (cy - R * g / 100 + 11) + '" font-size="' + (F - 1.5) + '" fill="var(--soft)">' + g + "%</text>"; });
    if (axes.some(function (a) { return a.r != null; })) s += '<polygon points="' + poly(axes.map(function (a) { return a.r == null ? 0 : a.r; })) + '" fill="none" stroke="var(--soft)" stroke-width="2" stroke-dasharray="5 4"/>';
    s += '<polygon points="' + poly(axes.map(function (a) { return a.v; })) + '" fill="var(--p3)" fill-opacity=".22" stroke="var(--p3)" stroke-width="2.5" stroke-linejoin="round"/>';
    axes.forEach(function (a, k) {
      var p = pt(k, a.v), low = a.v < LINE;
      s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (low ? 5 : 4) + '" fill="' + (low ? "var(--p1)" : "var(--p3)") + '" stroke="var(--paper)" stroke-width="1.5"><title>' + esc(a.l) + "：" + a.v + "%（" + a.n + " 題）</title></circle>";
      var q = ang(k), lx = cx + (R + 20) * Math.cos(q), ly = cy + (R + 20) * Math.sin(q), c = Math.cos(q);
      var anc = Math.abs(c) < 0.25 ? "middle" : c > 0 ? "start" : "end", lines = wrap(a.l, opt.wrap || 7);
      var top = ly + (Math.sin(q) < -0.5 ? -(lines.length * LH + F) : Math.sin(q) > 0.5 ? 4 : -((lines.length + 1) * LH) / 2);
      lines.forEach(function (t, j) { s += '<text x="' + lx.toFixed(1) + '" y="' + (top + F + j * LH).toFixed(1) + '" font-size="' + F + '" text-anchor="' + anc + '" fill="var(--ink)">' + esc(t) + "</text>"; });
      s += '<text x="' + lx.toFixed(1) + '" y="' + (top + F + lines.length * LH + 1).toFixed(1) + '" font-size="' + (F + 0.5) + '" font-weight="700" text-anchor="' + anc + '" fill="' + (low ? "var(--p1)" : "var(--soft)") + '">' + a.v + "%" + (a.r != null ? '<tspan font-weight="400" fill="var(--soft)">／' + a.r + "%</tspan>" : "") + "</text>";
    });
    return s + "</svg>";
  }

  function meter(label, n, c, right, ref) {
    var p = pc(c, n) || 0;
    return '<div class="sk-m"><div class="sk-mh"><span>' + esc(label) + "</span><span><b>" + p + "%</b>" + (ref != null ? "／" + ref + "%" : "") + " <small>" + (right || n + " 題") + '</small></span></div><div class="meter"><i style="width:' + p + '%"></i></div></div>';
  }
  /* 分類統計 → 長條；3 個以上有足夠資料就改畫小雷達 */
  function axBox(title, B, refB, order, names, unitWord, who) {
    var keys = Object.keys(B || {}).filter(function (k) { return Array.isArray(B[k]) && B[k][0]; });
    if (!keys.length) return "";
    keys.sort(order ? function (a, b) { return (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)); } : function (a, b) { return B[b][0] - B[a][0]; });
    var out = '<div class="sk-box"><h4>' + title + "</h4>";
    keys.forEach(function (k) {
      var r = B[k], ref = refB && refB[k] ? pc(refB[k][1], refB[k][0]) : null;
      out += meter(names ? names[k] || k : k, r[0], r[1], r[0] + " 題" + (who === "class" && r[2] ? "・" + r[2] + " 人" : ""), ref);
    });
    return out + "</div>";
  }

  NB.sk = {};
  NB.sk.panel = function (el, o) {
    style(); o = o || {};
    var who = o.who || "me", chs = o.CH ? chaptersFromCH(o.CH) : chaptersFromU(o.U), refC = o.ref ? chaptersFromCH(o.ref) : null;
    var wrapEl = h('<div class="skp"></div>'); el.appendChild(wrapEl);
    if (!Object.keys(chs).length) { wrapEl.appendChild(h('<p class="meta">' + (who === "me" ? "還沒有作答紀錄。做幾份小測驗之後，這裡會畫出你在各章的強弱。" : "還沒有作答紀錄。") + "</p>")); return; }
    var G = groupSems(chs), cur = pickSem(G, chs, o.grade);
    var semBar = h('<div class="sk-sems"></div>'), main = h('<div class="sk-main"></div>');
    if (G.keys.length > 1) G.keys.forEach(function (s) {
      var b = h('<button class="pen' + (s === cur ? " go" : "") + '" type="button"></button>'); b.textContent = G.labels[s];
      b.onclick = function () { cur = s; [].forEach.call(semBar.children, function (x) { x.classList.remove("go"); }); b.classList.add("go"); draw(); };
      semBar.appendChild(b);
    });
    wrapEl.appendChild(semBar); wrapEl.appendChild(main);

    function draw() {
      main.innerHTML = "";
      var narrow = (wrapEl.clientWidth || 999) < 560; /* 手機：雷達圖會縮小，字要先放大才看得清楚 */
      var ks = G.by[cur].slice().sort(cmpId), shown = [], miss = [];
      ks.forEach(function (k) {
        var C = chs[k], inf = chInfo(k, C.units[0]), lab = "第" + (CN[inf.no - 1] || inf.no) + "章 " + inf.name;
        if (C.n < MIN_CH) { miss.push(lab); return; }
        var R = refC && refC[k] ? pc(refC[k].c, refC[k].n) : null;
        shown.push({ k: k, l: lab, short: inf.name, v: pc(C.c, C.n), n: C.n, r: R, C: C });
      });
      var left = h("<div></div>");
      if (shown.length >= 3) {
        left.innerHTML = radar(shown.map(function (a) { return { l: a.short, v: a.v, n: a.n, r: a.r }; }), { label: G.labels[cur] + " 各章答對率", big: narrow, wrap: narrow ? 6 : 7 });
        left.appendChild(h('<div class="sk-legend"><span><i></i>' + (who === "class" ? "全班答對率" : who === "stu" ? "這位同學" : "你的答對率") + "</span>" + (refC ? '<span><i class="ref"></i>全班平均</span>' : "") + '<span><i class="ln"></i>' + LINE + "% 線</span></div>"));
      } else {
        /* 章太少畫不成雷達圖，改用長條 */
        left.innerHTML = shown.map(function (a) { return meter(a.l, a.C.n, a.C.c, a.C.n + " 題", a.r); }).join("") || '<p class="meta">這學期每一章都還不到 ' + MIN_CH + " 題，再多練一些就會畫出來。</p>";
      }
      if (miss.length) left.appendChild(h('<p class="sk-miss">還沒練夠（少於 ' + MIN_CH + " 題）：" + miss.map(esc).join("、") + "</p>"));
      main.appendChild(left);

      /* 右邊：先補哪幾章 */
      var right = h('<div class="sk-weak"></div>');
      var weak = shown.filter(function (a) { return a.n >= MIN_WEAK && a.v < WEAK; }).sort(function (a, b) { return a.v - b.v; }).slice(0, 3);
      right.appendChild(h('<p class="meta" style="margin:0">' + (who === "class" ? "全班最需要加強的章" : who === "stu" ? "這位同學最需要加強的章" : "先補這幾章") + "</p>"));
      if (!weak.length) right.appendChild(h('<div class="sk-w"><b>' + (shown.length ? "這學期每一章都在 " + WEAK + "% 以上" : "資料還不夠") + "</b><small>" + (shown.length ? "可以挑戰比較難的題目，或換一個學期看看。" : "每章至少作答 " + MIN_WEAK + " 題才會列出來。") + "</small></div>"));
      weak.forEach(function (a) {
        var box = h('<div class="sk-w"><b>' + esc(a.l) + "　" + a.v + "%</b></div>");
        if (who === "class") box.appendChild(h("<small>作答 " + a.C.n + " 題・" + a.C.s + " 人有練習・<b style=\"display:inline\">" + a.C.low + " 人</b>低於 60%" + "</small>"));
        else {
          if (a.r != null) box.appendChild(h("<small>全班平均 " + a.r + "%</small>"));
          var us = a.C.units.filter(function (u) { return o.U[u].n && pc(o.U[u].c, o.U[u].n) < WEAK; }).sort(function (x, y) { return pc(o.U[x].c, o.U[x].n) - pc(o.U[y].c, o.U[y].n); }).slice(0, 2);
          us.forEach(function (u) {
            var x = o.U[u], t = byId(u), row = h('<div class="sk-u"><span>' + esc(t ? t.num + " " + t.title : u) + "　" + pc(x.c, x.n) + "%<small>（" + x.n + " 題）</small></span></div>");
            if (o.link) { var a2 = h('<a class="pen" href="' + esc(o.link(u)) + '">去練習</a>'); row.appendChild(a2); }
            box.appendChild(row);
          });
        }
        right.appendChild(box);
      });
      main.appendChild(right);
      if (window.Zhuyin && Zhuyin.refresh) try { Zhuyin.refresh(); } catch (e) { /* 注音沒載入就算了 */ }
    }
    draw();

    /* 下面一排：學習主題、難易度、題目類別、認知層次 */
    var st = o.st || null;
    if (!st && o.U && o.us) { st = {}; Object.keys(o.us).forEach(function (k) { (o.us[k] || []).forEach(function (u) { var x = o.U[u]; if (!x || !x.n) return; var t = st[k] = st[k] || [0, 0]; t[0] += x.n; t[1] += x.c || 0; }); }); }
    var refSt = o.refSt || null, grid = h('<div class="sk-grid"></div>'), parts = [];
    var stKeys = ["N", "S", "R", "D"].filter(function (k) { return st && st[k] && st[k][0] >= MIN_CH; });
    if (stKeys.length >= 3) {
      var box = h('<div class="sk-box"><h4>學習主題</h4></div>');
      box.innerHTML += radar(stKeys.map(function (k) { return { l: STRAND[k], v: pc(st[k][1], st[k][0]), n: st[k][0], r: refSt && refSt[k] ? pc(refSt[k][1], refSt[k][0]) : null }; }), { label: "學習主題答對率", wrap: 5, small: 1 });
      parts.push(box);
    } else if (stKeys.length) parts.push(h(axBox("學習主題", st, refSt, ["N", "S", "R", "D"], STRAND, "題", who)));
    var ax = o.ax || {}, refAx = o.refAx || {};
    [["難易度", "d", ["1", "2", "3"], LVL], ["題目類別", "k", ["計算題", "應用題", "情境題", "圖表題", "概念題"], null], ["認知層次", "g", ["記憶", "理解", "應用", "分析", "評鑑", "創造"], null]].forEach(function (x) {
      var s2 = axBox(x[0], ax[x[1]], refAx[x[1]], x[2], x[3], "題", who); if (s2) parts.push(h(s2));
    });
    parts.forEach(function (p) { grid.appendChild(p); });
    if (parts.length) wrapEl.appendChild(grid);
    if (!ax.d || !Object.keys(ax.d).length) wrapEl.appendChild(h('<p class="sk-miss">難易度、題目類別、認知層次是這次更新之後才開始記錄，多練幾題就會出現。' + (stKeys.length ? "" : "「學習主題」要等題庫匯入學習內容代碼（N、S、R、D 開頭）才看得到。") + "</p>"));
    else if (refC || refSt || o.refAx) wrapEl.appendChild(h('<p class="sk-miss">斜線後面是全班平均。</p>'));
  };
})();
