/* 製圖（老師後台）：自由畫布的向量編輯器。
   - 畫布本身就是 SVG，所以匯出 SVG 等於把畫布序列化出來，是真的向量、不失真
   - 顏色一律存實際色碼（不用 CSS 變數），匯出的檔案在別的軟體打開才不會變色
   - 檔案只存在這台電腦（localStorage），也可以匯出 .json 備份或換電腦
   用法：NB.draw.open(ctx)，ctx 來自 teacher.js 的分頁派送 */
(function () {
  "use strict";
  var NB = window.NB, h = NB.h, DW = (NB.draw = {});
  var KEY = "nb-draw-docs", SETK = "nb-draw-set";

  /* ---------- 小工具 ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rd(v, k) { var p = Math.pow(10, k == null ? 2 : k); return Math.round(v * p) / p; }
  function ld(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* ---------- 預設樣式與調色盤 ---------- */
  var PAL = ["#1c2635", "#bf5b43", "#35639a", "#4f8c6e", "#d9a93c", "#7a68a6", "#9aa1ab", "#ffffff"];
  var FONTS = [["sans-serif", "黑體"], ["serif", "明體"], ["'LXGW WenKai TC', cursive", "手寫"], ["monospace", "等寬"]];
  var DEF = { sc: "#1c2635", sw: 2, sd: "", fc: "none", fo: 1, fs: 18, fw: 400, fa: "middle", ff: "sans-serif", a1: 0, a2: 0, r: 0 };

  /* ---------- 文件 ---------- */
  function blank(name) {
    return { id: uid(), name: name || "未命名的圖", w: 800, h: 560, bg: "#ffffff", objs: [], t: Date.now() };
  }
  function docs() { return ld(KEY, []); }
  function saveDocs(a) { return sv(KEY, a); }

  /* ---------- 幾何 ---------- */
  function bbox(o) {
    if (o.t === "line" || o.t === "arrow") {
      return { x: Math.min(o.x, o.x2), y: Math.min(o.y, o.y2), w: Math.abs(o.x2 - o.x), h: Math.abs(o.y2 - o.y) };
    }
    return { x: o.x, y: o.y, w: o.w, h: o.h };
  }
  function unionBox(list) {
    if (!list.length) return null;
    var x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    list.forEach(function (o) { var b = bbox(o); x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h); });
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  /* 旋轉過的點（算命中用） */
  function unrot(o, px, py) {
    if (!o.rot) return [px, py];
    var b = bbox(o), cx = b.x + b.w / 2, cy = b.y + b.h / 2, a = (-o.rot * Math.PI) / 180;
    var dx = px - cx, dy = py - cy;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  }

  /* ---------- 畫一個物件（回傳 SVG 字串） ---------- */
  /* 箭頭直接畫成實心三角形，不用 <marker>。
     marker 搭 context-stroke 在 Chrome 沒問題，但 Word、Illustrator、舊版檢視器常常不吃，
     箭頭會整個不見或變成黑色。畫成路徑最保險。 */
  function head(x1, y1, x2, y2, w, col) {
    var a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(11, w * 4.6), W = L * 0.5;
    var bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
    return '<path d="M' + rd(x2) + " " + rd(y2) + "L" + rd(bx + W * Math.sin(a)) + " " + rd(by - W * Math.cos(a)) +
      "L" + rd(bx - W * Math.sin(a)) + " " + rd(by + W * Math.cos(a)) + 'Z" fill="' + col + '" stroke="none"/>';
  }
  /* 線加上箭頭：軸線先縮短一點，不然會從三角形尖端戳出去 */
  function lineWithHeads(x1, y1, x2, y2, s, a1, a2) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    var cut = Math.max(7, s.sw * 3.6) * 0.85;
    var sx = a1 ? x1 + ux * cut : x1, sy = a1 ? y1 + uy * cut : y1;
    var ex = a2 ? x2 - ux * cut : x2, ey = a2 ? y2 - uy * cut : y2;
    var out = '<path d="M' + rd(sx) + " " + rd(sy) + "L" + rd(ex) + " " + rd(ey) + '" stroke="' + s.sc + '" stroke-width="' + s.sw + '"' +
      (s.sd ? ' stroke-dasharray="' + s.sd + '"' : "") + ' fill="none" stroke-linecap="round"/>';
    if (a1) out += head(x2, y2, x1, y1, s.sw, s.sc);
    if (a2) out += head(x1, y1, x2, y2, s.sw, s.sc);
    return out;
  }
  function sAttr(s) {
    return 'stroke="' + s.sc + '" stroke-width="' + s.sw + '"' + (s.sd ? ' stroke-dasharray="' + s.sd + '"' : "") +
      ' fill="' + (s.fc || "none") + '"' + (s.fc && s.fc !== "none" && s.fo < 1 ? ' fill-opacity="' + s.fo + '"' : "") +
      ' stroke-linecap="round" stroke-linejoin="round"';
  }
  function tspans(o) {
    var lines = String(o.d.tx || "").split("\n"), s = o.s, lh = s.fs * 1.35;
    var ax = s.fa === "start" ? o.x + 4 : s.fa === "end" ? o.x + o.w - 4 : o.x + o.w / 2;
    var y0 = o.y + s.fs;
    return lines.map(function (t, i) { return '<tspan x="' + rd(ax) + '" y="' + rd(y0 + i * lh) + '">' + (esc(t) || " ") + "</tspan>"; }).join("");
  }
  /* 數線 */
  function nlineSvg(o) {
    var d = o.d, s = o.s, x = o.x, y = o.y + o.h / 2, w = o.w, n = Math.max(1, Math.round((d.max - d.min) / d.step));
    var out = lineWithHeads(x, y, x + w, y, { sc: s.sc, sw: s.sw, sd: "" }, d.a1 ? 1 : 0, d.a2 !== 0 ? 1 : 0);
    for (var i = 0; i <= n; i++) {
      var px = x + (w * i) / n, big = d.lab !== 0;
      out += '<path d="M' + rd(px) + " " + rd(y - 6) + "V" + rd(y + 6) + '" stroke="' + s.sc + '" stroke-width="' + Math.max(1, s.sw - .4) + '" fill="none"/>';
      if (big) { var v = rd(d.min + (d.max - d.min) * (i / n), 4); out += '<text x="' + rd(px) + '" y="' + rd(y + 22) + '" text-anchor="middle" font-size="' + s.fs + '" font-family="' + s.ff + '" fill="' + s.sc + '">' + esc(String(v)) + "</text>"; }
    }
    return out;
  }
  /* 座標軸 */
  function axesSvg(o) {
    var d = o.d, s = o.s, L = 22, x0 = o.x + L, y0 = o.y + o.h - L, W = o.w - L - 6, H = o.h - L - 6, out = "";
    var gx = Math.max(1, d.gx || 10), gy = Math.max(1, d.gy || 10);
    if (d.grid !== 0) {
      for (var i = 1; i <= gx; i++) { var px = x0 + (W * i) / gx; out += '<path d="M' + rd(px) + " " + rd(y0) + "V" + rd(y0 - H) + '" stroke="' + (d.gc || "#d8cfbb") + '" stroke-width="1" fill="none"/>'; }
      for (var j = 1; j <= gy; j++) { var py = y0 - (H * j) / gy; out += '<path d="M' + rd(x0) + " " + rd(py) + "H" + rd(x0 + W) + '" stroke="' + (d.gc || "#d8cfbb") + '" stroke-width="1" fill="none"/>'; }
    }
    out += lineWithHeads(x0, y0, x0 + W + 4, y0, { sc: s.sc, sw: s.sw, sd: "" }, 0, 1);
    out += lineWithHeads(x0, y0, x0, y0 - H - 4, { sc: s.sc, sw: s.sw, sd: "" }, 0, 1);
    out += '<text x="' + rd(x0 + W + 10) + '" y="' + rd(y0 + 5) + '" font-size="' + s.fs + '" font-family="' + s.ff + '" fill="' + s.sc + '">' + esc(d.xl || "x") + "</text>";
    out += '<text x="' + rd(x0 - 6) + '" y="' + rd(y0 - H - 10) + '" text-anchor="end" font-size="' + s.fs + '" font-family="' + s.ff + '" fill="' + s.sc + '">' + esc(d.yl || "y") + "</text>";
    out += '<text x="' + rd(x0 - 6) + '" y="' + rd(y0 + 16) + '" text-anchor="middle" font-size="' + s.fs + '" font-family="' + s.ff + '" fill="' + s.sc + '">O</text>';
    return out;
  }
  /* 方格紙 */
  function gridSvg(o) {
    var d = o.d, s = o.s, c = Math.max(4, d.cell || 24), out = "", x, y;
    out += '<rect x="' + rd(o.x) + '" y="' + rd(o.y) + '" width="' + rd(o.w) + '" height="' + rd(o.h) + '" fill="' + (o.s.fc || "none") + '"' + (o.s.fc !== "none" ? ' fill-opacity="' + o.s.fo + '"' : "") + ' stroke="none"/>';
    for (x = c; x < o.w - .5; x += c) out += '<path d="M' + rd(o.x + x) + " " + rd(o.y) + "V" + rd(o.y + o.h) + '" stroke="' + s.sc + '" stroke-width="' + Math.max(.5, s.sw - 1.2) + '" fill="none"' + (d.dash ? ' stroke-dasharray="3 3"' : "") + "/>";
    for (y = c; y < o.h - .5; y += c) out += '<path d="M' + rd(o.x) + " " + rd(o.y + y) + "H" + rd(o.x + o.w) + '" stroke="' + s.sc + '" stroke-width="' + Math.max(.5, s.sw - 1.2) + '" fill="none"' + (d.dash ? ' stroke-dasharray="3 3"' : "") + "/>";
    out += '<rect x="' + rd(o.x) + '" y="' + rd(o.y) + '" width="' + rd(o.w) + '" height="' + rd(o.h) + '" fill="none" stroke="' + s.sc + '" stroke-width="' + s.sw + '"/>';
    return out;
  }
  /* 表格 */
  function tableSvg(o) {
    var d = o.d, s = o.s, R = Math.max(1, d.r || 2), C = Math.max(1, d.c || 2), out = "", i;
    var cw = o.w / C, chh = o.h / R;
    out += '<rect x="' + rd(o.x) + '" y="' + rd(o.y) + '" width="' + rd(o.w) + '" height="' + rd(o.h) + '" fill="' + (s.fc || "none") + '"' + (s.fc !== "none" ? ' fill-opacity="' + s.fo + '"' : "") + ' stroke="' + s.sc + '" stroke-width="' + s.sw + '"/>';
    for (i = 1; i < C; i++) out += '<path d="M' + rd(o.x + cw * i) + " " + rd(o.y) + "V" + rd(o.y + o.h) + '" stroke="' + s.sc + '" stroke-width="' + Math.max(.6, s.sw - .6) + '" fill="none"/>';
    for (i = 1; i < R; i++) out += '<path d="M' + rd(o.x) + " " + rd(o.y + chh * i) + "H" + rd(o.x + o.w) + '" stroke="' + s.sc + '" stroke-width="' + Math.max(.6, s.sw - .6) + '" fill="none"/>';
    (d.cells || []).forEach(function (t, k) {
      if (!t) return; var r = Math.floor(k / C), c2 = k % C;
      out += '<text x="' + rd(o.x + cw * c2 + cw / 2) + '" y="' + rd(o.y + chh * r + chh / 2 + s.fs * .35) + '" text-anchor="middle" font-size="' + s.fs + '" font-family="' + s.ff + '" fill="' + s.sc + '">' + esc(t) + "</text>";
    });
    return out;
  }
  /* 多邊形（正 n 邊形） */
  function polyPts(o) {
    var n = Math.max(3, o.d.n || 5), cx = o.x + o.w / 2, cy = o.y + o.h / 2, rx = o.w / 2, ry = o.h / 2, p = [];
    for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (i * 2 * Math.PI) / n; p.push(rd(cx + rx * Math.cos(a)) + "," + rd(cy + ry * Math.sin(a))); }
    return p.join(" ");
  }
  function objSvg(o) {
    var s = o.s, b = bbox(o), inner = "";
    switch (o.t) {
      case "rect": inner = '<rect x="' + rd(o.x) + '" y="' + rd(o.y) + '" width="' + rd(o.w) + '" height="' + rd(o.h) + '"' + (s.r ? ' rx="' + s.r + '"' : "") + " " + sAttr(s) + "/>"; break;
      case "ellipse": inner = '<ellipse cx="' + rd(o.x + o.w / 2) + '" cy="' + rd(o.y + o.h / 2) + '" rx="' + rd(o.w / 2) + '" ry="' + rd(o.h / 2) + '" ' + sAttr(s) + "/>"; break;
      case "poly": inner = '<polygon points="' + polyPts(o) + '" ' + sAttr(s) + "/>"; break;
      case "line": case "arrow": inner = lineWithHeads(o.x, o.y, o.x2, o.y2, s, s.a1, s.a2); break;
      case "text": inner = '<text font-size="' + s.fs + '" font-weight="' + s.fw + '" font-family="' + s.ff + '" text-anchor="' + s.fa + '" fill="' + s.sc + '">' + tspans(o) + "</text>"; break;
      case "nline": inner = nlineSvg(o); break;
      case "axes": inner = axesSvg(o); break;
      case "grid": inner = gridSvg(o); break;
      case "table": inner = tableSvg(o); break;
      case "lib": inner = '<g transform="translate(' + rd(o.x) + " " + rd(o.y) + ") scale(" + rd(o.w / (o.d.w || 100), 4) + " " + rd(o.h / (o.d.h || 100), 4) + ')">' + (o.d.svg || "") + "</g>"; break;
    }
    var tr = o.rot ? ' transform="rotate(' + o.rot + " " + rd(b.x + b.w / 2) + " " + rd(b.y + b.h / 2) + ')"' : "";
    return '<g data-id="' + o.id + '"' + tr + (o.op != null && o.op < 1 ? ' opacity="' + o.op + '"' : "") + ">" + inner + "</g>";
  }

  /* ---------- 主程式 ---------- */
  DW.open = function (ctx) {
    var S = ld(SETK, { grid: 1, snap: 1, cell: 10 });
    var list = docs(), D = null, sel = [], undo = [], redo = [], tool = "sel", zoom = 1;
    var wrap, canvas, svg, layer, ovl, propsBox, docName, zEl, statusEl;

    /* ---- 版面 ---- */
    var box = ctx.sheet("製圖", "自由畫布：畫完可以匯出 SVG（向量、不失真）或 PNG。檔案存在這台電腦。");
    box.classList.add("dw");
    wrap = h('<div class="dw-wrap"></div>');
    box.appendChild(wrap);

    /* 左：工具列 */
    var TOOLS = [["sel", "選取", "M4 3l14 8-6 1.6L9 19z"], ["text", "文字", "M5 5h14M12 5v14M9 19h6"],
      ["rect", "矩形", "M4 6h16v12H4z"], ["ellipse", "橢圓", "M12 6a8 6 0 1 0 .01 0"], ["poly", "多邊形", "M12 4l8 6-3 9H7l-3-9z"],
      ["line", "直線", "M4 19L20 5"], ["arrow", "箭頭", "M4 19L20 5M20 5h-6M20 5v6"],
      ["nline", "數線", "M3 12h18M7 9v6M12 9v6M17 9v6"], ["axes", "座標軸", "M5 3v16h16M5 19L19 7"],
      ["grid", "方格", "M4 4h16v16H4zM10 4v16M16 4v16M4 10h16M4 16h16"], ["table", "表格", "M4 5h16v14H4zM4 10h16M12 5v14"]];
    var tbar = h('<div class="dw-tools" role="toolbar" aria-label="工具"></div>');
    TOOLS.forEach(function (t) {
      var b = h('<button type="button" class="dw-t" data-t="' + t[0] + '" title="' + t[1] + '" aria-label="' + t[1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + t[2] + '"/></svg></button>');
      b.onclick = function () { setTool(t[0]); };
      tbar.appendChild(b);
    });
    wrap.appendChild(tbar);

    /* 中：畫布 */
    var mid = h('<div class="dw-mid"></div>');
    var top = h('<div class="dw-top"></div>');
    mid.appendChild(top); wrap.appendChild(mid);
    canvas = h('<div class="dw-canvas"></div>');
    mid.appendChild(canvas);
    statusEl = h('<p class="dw-status meta"></p>');
    mid.appendChild(statusEl);

    /* 右：屬性 */
    propsBox = h('<div class="dw-props"></div>');
    wrap.appendChild(propsBox);

    buildTop();
    openDoc(list.length ? list[0] : null);

    /* ---- 上方：檔案與編輯 ---- */
    function buildTop() {
      top.innerHTML = "";
      docName = h('<input class="dw-name" aria-label="圖的名稱">');
      docName.onchange = function () { if (!D) return; D.name = docName.value.trim() || "未命名的圖"; store(); };
      top.appendChild(docName);
      var g1 = h('<div class="dw-grp"></div>');
      [["新增", function () { openDoc(null); }], ["開啟", openList], ["複製一份", dup], ["刪除", delDoc]].forEach(function (a) {
        var b = h('<button type="button" class="pen dw-b">' + a[0] + "</button>"); b.onclick = a[1]; g1.appendChild(b);
      });
      top.appendChild(g1);
      var g2 = h('<div class="dw-grp"></div>');
      [["復原", doUndo], ["重做", doRedo], ["上移", function () { zmove(1); }], ["下移", function () { zmove(-1); }], ["刪除選取", delSel]].forEach(function (a) {
        var b = h('<button type="button" class="pen dw-b">' + a[0] + "</button>"); b.onclick = a[1]; g2.appendChild(b);
      });
      top.appendChild(g2);
      var g3 = h('<div class="dw-grp"></div>');
      var ex = h('<button type="button" class="pen go dw-b">匯出</button>'); ex.onclick = exportDlg; g3.appendChild(ex);
      var im = h('<button type="button" class="pen dw-b">備份／還原</button>'); im.onclick = backupDlg; g3.appendChild(im);
      top.appendChild(g3);
      var g4 = h('<div class="dw-grp dw-zoom"></div>');
      zEl = h("<span>100%</span>");
      var zo = h('<button type="button" class="pen dw-b">−</button>'), zi = h('<button type="button" class="pen dw-b">＋</button>'), zf = h('<button type="button" class="pen dw-b">符合</button>');
      zo.onclick = function () { setZoom(zoom / 1.25); }; zi.onclick = function () { setZoom(zoom * 1.25); }; zf.onclick = fitZoom;
      g4.appendChild(zo); g4.appendChild(zEl); g4.appendChild(zi); g4.appendChild(zf);
      top.appendChild(g4);
    }

    function setTool(t) {
      tool = t;
      tbar.querySelectorAll(".dw-t").forEach(function (b) { b.classList.toggle("on", b.dataset.t === t); });
      canvas.classList.toggle("dw-draw", t !== "sel");
      status();
    }
    function status(m) {
      if (m) { statusEl.textContent = m; return; }
      statusEl.textContent = D ? D.w + " × " + D.h + " px・" + D.objs.length + " 個物件" + (sel.length ? "・選取 " + sel.length + " 個" : "") + "・檔案存在這台電腦" : "";
    }

    /* ---- 文件開關 ---- */
    function openDoc(d) {
      D = d ? clone(d) : blank("未命名的圖 " + (docs().length + 1));
      if (!d) { var a = docs(); a.unshift(clone(D)); saveDocs(a); }
      sel = []; undo = []; redo = [];
      docName.value = D.name;
      build(); fitZoom();
    }
    function store() {
      if (!D) return;
      D.t = Date.now();
      var a = docs(), i = -1;
      a.forEach(function (x, k) { if (x.id === D.id) i = k; });
      if (i < 0) a.unshift(clone(D)); else a[i] = clone(D);
      if (!saveDocs(a)) status("存不進去了：這台電腦的瀏覽器儲存空間滿了，請先刪掉幾張圖或匯出備份。");
    }
    function dup() { if (!D) return; var c = clone(D); c.id = uid(); c.name = D.name + "（複本）"; var a = docs(); a.unshift(c); saveDocs(a); openDoc(c); }
    function delDoc() {
      if (!D) return;
      ask("刪掉這張圖？", "「" + D.name + "」會從這台電腦刪掉，不能復原。", "刪除", function () {
        var a = docs().filter(function (x) { return x.id !== D.id; }); saveDocs(a);
        openDoc(a.length ? a[0] : null);
      });
    }
    function openList() {
      var a = docs();
      var body = h('<div class="dw-list"></div>');
      if (!a.length) body.appendChild(h('<p class="meta">這台電腦還沒有存過圖。</p>'));
      a.forEach(function (x) {
        var r = h('<button type="button" class="dw-li"><b>' + esc(x.name) + "</b><small>" + x.w + "×" + x.h + "・" + x.objs.length + " 個物件・" + new Date(x.t).toLocaleString("zh-TW") + "</small></button>");
        r.onclick = function () { closeDlg(); openDoc(x); };
        body.appendChild(r);
      });
      dlg("開啟", body, []);
    }

    /* ---- 畫布 ---- */
    function build() {
      canvas.innerHTML = "";
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "dw-svg");
      svg.setAttribute("viewBox", "0 0 " + D.w + " " + D.h);
      svg.innerHTML =
        '<rect class="dw-bg" x="0" y="0" width="' + D.w + '" height="' + D.h + '" fill="' + D.bg + '"/>' +
        '<g class="dw-gridl"></g><g class="dw-layer"></g><g class="dw-ovl"></g>';
      canvas.appendChild(svg);
      layer = svg.querySelector(".dw-layer");
      ovl = svg.querySelector(".dw-ovl");
      bindCanvas();
      render();
    }
    function gridLines() {
      var g = svg.querySelector(".dw-gridl");
      if (!S.grid) { g.innerHTML = ""; return; }
      var c = S.cell * 2, out = "", x, y;
      for (x = c; x < D.w; x += c) out += '<path d="M' + x + " 0V" + D.h + '" stroke="#e3dac6" stroke-width="1" fill="none"/>';
      for (y = c; y < D.h; y += c) out += '<path d="M0 ' + y + "H" + D.w + '" stroke="#e3dac6" stroke-width="1" fill="none"/>';
      g.innerHTML = out;
    }
    function render() {
      gridLines();
      layer.innerHTML = D.objs.map(objSvg).join("");
      overlay(); props(); status();
    }
    function setZoom(z) {
      zoom = clamp(z, 0.1, 4);
      svg.style.width = D.w * zoom + "px"; svg.style.height = D.h * zoom + "px";
      zEl.textContent = Math.round(zoom * 100) + "%";
    }
    function fitZoom() {
      var w = canvas.clientWidth - 24;
      setZoom(w > 0 ? Math.min(1, w / D.w) : 1);
    }

    /* ---- 座標轉換 ---- */
    function pt(e) {
      var r = svg.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * D.w, y: ((e.clientY - r.top) / r.height) * D.h };
    }
    function snap(v) { return S.snap ? Math.round(v / S.cell) * S.cell : v; }

    /* ---- 選取 ---- */
    function selObjs() { return D.objs.filter(function (o) { return sel.indexOf(o.id) >= 0; }); }
    function overlay() {
      var list = selObjs();
      if (!list.length) { ovl.innerHTML = ""; return; }
      var b = unionBox(list), out = "";
      out += '<rect x="' + rd(b.x) + '" y="' + rd(b.y) + '" width="' + rd(b.w) + '" height="' + rd(b.h) + '" fill="none" stroke="#35639a" stroke-width="' + rd(1.2 / zoom) + '" stroke-dasharray="' + rd(4 / zoom) + " " + rd(3 / zoom) + '"/>';
      var hs = handles(b), r = rd(4.5 / zoom);
      hs.forEach(function (p) { out += '<rect class="dw-h" data-k="' + p.k + '" x="' + rd(p.x - r) + '" y="' + rd(p.y - r) + '" width="' + rd(r * 2) + '" height="' + rd(r * 2) + '" fill="#fff" stroke="#35639a" stroke-width="' + rd(1.2 / zoom) + '"/>'; });
      out += '<circle class="dw-h" data-k="rot" cx="' + rd(b.x + b.w / 2) + '" cy="' + rd(b.y - 22 / zoom) + '" r="' + rd(5 / zoom) + '" fill="#fff" stroke="#bf5b43" stroke-width="' + rd(1.2 / zoom) + '"/>';
      out += '<path d="M' + rd(b.x + b.w / 2) + " " + rd(b.y) + "V" + rd(b.y - 17 / zoom) + '" stroke="#bf5b43" stroke-width="' + rd(1 / zoom) + '" fill="none"/>';
      ovl.innerHTML = out;
    }
    function handles(b) {
      return [{ k: "nw", x: b.x, y: b.y }, { k: "n", x: b.x + b.w / 2, y: b.y }, { k: "ne", x: b.x + b.w, y: b.y },
      { k: "e", x: b.x + b.w, y: b.y + b.h / 2 }, { k: "se", x: b.x + b.w, y: b.y + b.h },
      { k: "s", x: b.x + b.w / 2, y: b.y + b.h }, { k: "sw", x: b.x, y: b.y + b.h }, { k: "w", x: b.x, y: b.y + b.h / 2 }];
    }
    function hitAt(p) {
      for (var i = D.objs.length - 1; i >= 0; i--) {
        var o = D.objs[i], q = unrot(o, p.x, p.y), b = bbox(o), pad = Math.max(6, o.s.sw + 4);
        if (o.t === "line" || o.t === "arrow") {
          if (distSeg(q[0], q[1], o) <= pad) return o;
        } else if (q[0] >= b.x - pad && q[0] <= b.x + b.w + pad && q[1] >= b.y - pad && q[1] <= b.y + b.h + pad) return o;
      }
      return null;
    }
    function distSeg(px, py, o) {
      var dx = o.x2 - o.x, dy = o.y2 - o.y, L = dx * dx + dy * dy;
      var t = L ? clamp(((px - o.x) * dx + (py - o.y) * dy) / L, 0, 1) : 0;
      var qx = o.x + t * dx, qy = o.y + t * dy;
      return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
    }

    /* ---- 滑鼠／觸控 ---- */
    function bindCanvas() {
      var mode = null, st = null;
      svg.addEventListener("pointerdown", function (e) {
        if (e.button === 2) return;
        svg.setPointerCapture(e.pointerId);
        var p = pt(e);
        if (tool !== "sel") { mode = "new"; st = startNew(p); return; }
        var hk = e.target.closest ? e.target.closest(".dw-h") : null;
        if (hk) { mode = hk.dataset.k === "rot" ? "rot" : "size"; st = { k: hk.dataset.k, p0: p, box: unionBox(selObjs()), snap: clone(selObjs()) }; return; }
        var o = hitAt(p);
        if (o) {
          if (e.shiftKey) { var i = sel.indexOf(o.id); if (i < 0) sel.push(o.id); else sel.splice(i, 1); }
          else if (sel.indexOf(o.id) < 0) sel = [o.id];
          mode = "move"; st = { p0: p, snap: clone(selObjs()) };
          overlay(); props(); status();
        } else { if (!e.shiftKey) sel = []; mode = "marq"; st = { p0: p }; overlay(); props(); }
      });
      svg.addEventListener("pointermove", function (e) {
        if (!mode) return;
        var p = pt(e);
        if (mode === "move") moveBy(st, p.x - st.p0.x, p.y - st.p0.y);
        else if (mode === "size") sizeTo(st, p, e.shiftKey);
        else if (mode === "rot") rotTo(st, p, e.shiftKey);
        else if (mode === "new") growNew(st, p, e.shiftKey);
        else if (mode === "marq") marq(st, p);
      });
      svg.addEventListener("pointerup", function () {
        if (mode === "marq") ovl.querySelectorAll(".dw-marq").forEach(function (x) { x.remove(); });
        if (mode === "new" && st && st.o) {
          var b = bbox(st.o);
          if (b.w < 3 && b.h < 3 && st.o.t !== "text") { D.objs.pop(); sel = []; }
          else { sel = [st.o.id]; }
          setTool("sel");
        }
        if (mode) { push(); render(); store(); }
        mode = null; st = null;
      });
      svg.addEventListener("dblclick", function (e) {
        var o = hitAt(pt(e)); if (!o) return;
        if (o.t === "text") editText(o);
        else if (o.t === "table") editTable(o);
      });
    }
    function moveBy(st, dx, dy) {
      st.snap.forEach(function (s0) {
        var o = byId(s0.id); if (!o) return;
        if (o.t === "line" || o.t === "arrow") { o.x = snap(s0.x + dx); o.y = snap(s0.y + dy); o.x2 = snap(s0.x2 + dx); o.y2 = snap(s0.y2 + dy); }
        else { o.x = snap(s0.x + dx); o.y = snap(s0.y + dy); }
      });
      live();
    }
    function sizeTo(st, p, keep) {
      var b = st.box, k = st.k, nx = b.x, ny = b.y, nw = b.w, nh = b.h;
      if (k.indexOf("e") >= 0) nw = Math.max(4, snap(p.x) - b.x);
      if (k.indexOf("s") >= 0) nh = Math.max(4, snap(p.y) - b.y);
      if (k.indexOf("w") >= 0) { nx = Math.min(snap(p.x), b.x + b.w - 4); nw = b.x + b.w - nx; }
      if (k.indexOf("n") >= 0) { ny = Math.min(snap(p.y), b.y + b.h - 4); nh = b.y + b.h - ny; }
      if (keep && b.w && b.h) { var r = b.w / b.h; if (nw / nh > r) nw = nh * r; else nh = nw / r; }
      var sx = b.w ? nw / b.w : 1, sy = b.h ? nh / b.h : 1;
      st.snap.forEach(function (s0) {
        var o = byId(s0.id); if (!o) return;
        if (o.t === "line" || o.t === "arrow") {
          o.x = nx + (s0.x - b.x) * sx; o.y = ny + (s0.y - b.y) * sy;
          o.x2 = nx + (s0.x2 - b.x) * sx; o.y2 = ny + (s0.y2 - b.y) * sy;
        } else {
          o.x = nx + (s0.x - b.x) * sx; o.y = ny + (s0.y - b.y) * sy;
          o.w = Math.max(2, s0.w * sx); o.h = Math.max(2, s0.h * sy);
        }
      });
      live();
    }
    function rotTo(st, p, keep) {
      var b = st.box, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      var a = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
      if (keep) a = Math.round(a / 15) * 15;
      selObjs().forEach(function (o) { o.rot = Math.round(a); });
      live();
    }
    function startNew(p) {
      var o = mk(tool, snap(p.x), snap(p.y));
      D.objs.push(o); sel = [o.id];
      return { o: o, p0: { x: snap(p.x), y: snap(p.y) } };
    }
    function growNew(st, p, keep) {
      var o = st.o, x = snap(p.x), y = snap(p.y);
      if (o.t === "line" || o.t === "arrow") {
        o.x2 = x; o.y2 = y;
        if (keep) { if (Math.abs(x - o.x) > Math.abs(y - o.y)) o.y2 = o.y; else o.x2 = o.x; }
      } else {
        o.x = Math.min(st.p0.x, x); o.y = Math.min(st.p0.y, y);
        o.w = Math.max(2, Math.abs(x - st.p0.x)); o.h = Math.max(2, Math.abs(y - st.p0.y));
        if (keep) { var m = Math.max(o.w, o.h); o.w = m; o.h = m; }
      }
      live();
    }
    function marq(st, p) {
      var x = Math.min(st.p0.x, p.x), y = Math.min(st.p0.y, p.y), w = Math.abs(p.x - st.p0.x), hh = Math.abs(p.y - st.p0.y);
      ovl.innerHTML = '<rect class="dw-marq" x="' + rd(x) + '" y="' + rd(y) + '" width="' + rd(w) + '" height="' + rd(hh) + '" fill="#35639a" fill-opacity=".08" stroke="#35639a" stroke-width="' + rd(1 / zoom) + '"/>';
      sel = D.objs.filter(function (o) { var b = bbox(o); return b.x + b.w >= x && b.x <= x + w && b.y + b.h >= y && b.y <= y + hh; }).map(function (o) { return o.id; });
    }
    function live() { layer.innerHTML = D.objs.map(objSvg).join(""); overlay(); }
    function byId(id) { for (var i = 0; i < D.objs.length; i++) if (D.objs[i].id === id) return D.objs[i]; return null; }

    /* ---- 新物件 ---- */
    function mk(t, x, y) {
      var s = clone(DEF), o = { id: uid(), t: t, x: x, y: y, w: 2, h: 2, rot: 0, s: s, d: {} };
      if (t === "arrow") s.a2 = 1;
      if (t === "rect" || t === "ellipse" || t === "poly") s.fc = "none";
      if (t === "text") { o.w = 160; o.h = 28; o.d.tx = "文字"; s.fa = "start"; }
      if (t === "poly") o.d.n = 5;
      if (t === "nline") { o.w = 300; o.h = 46; o.d = { min: 0, max: 10, step: 1, lab: 1, a2: 1, a1: 0 }; s.fs = 13; }
      if (t === "axes") { o.w = 240; o.h = 200; o.d = { gx: 8, gy: 8, grid: 1, xl: "x", yl: "y" }; s.fs = 13; }
      if (t === "grid") { o.w = 240; o.h = 180; o.d = { cell: 24, dash: 0 }; }
      if (t === "table") { o.w = 260; o.h = 100; o.d = { r: 2, c: 3, cells: [] }; s.fs = 15; }
      if (t === "line" || t === "arrow") { o.x2 = x; o.y2 = y; }
      return o;
    }

    /* ---- 復原 ---- */
    function push() { undo.push(clone(D.objs)); if (undo.length > 60) undo.shift(); redo = []; }
    function doUndo() { if (!undo.length) return; redo.push(clone(D.objs)); D.objs = undo.pop(); sel = []; render(); store(); }
    function doRedo() { if (!redo.length) return; undo.push(clone(D.objs)); D.objs = redo.pop(); sel = []; render(); store(); }
    function delSel() { if (!sel.length) return; push(); D.objs = D.objs.filter(function (o) { return sel.indexOf(o.id) < 0; }); sel = []; render(); store(); }
    function zmove(dir) {
      if (!sel.length) return; push();
      var list = selObjs();
      list.forEach(function (o) {
        var i = D.objs.indexOf(o), j = i + dir;
        if (j < 0 || j >= D.objs.length) return;
        D.objs.splice(i, 1); D.objs.splice(j, 0, o);
      });
      render(); store();
    }

    /* ---- 屬性面板 ---- */
    function props() {
      propsBox.innerHTML = "";
      var list = selObjs();
      if (!list.length) { propsBox.appendChild(docPanel()); return; }
      var o = list[0];
      propsBox.appendChild(h('<p class="dw-ph">' + esc(tName(o.t)) + (list.length > 1 ? "（" + list.length + " 個）" : "") + "</p>"));
      var set = function (fn) { push(); list.forEach(fn); render(); store(); };
      propsBox.appendChild(colorRow("線條", o.s.sc, function (c) { set(function (x) { x.s.sc = c; }); }));
      propsBox.appendChild(numRow("粗細", o.s.sw, 0.5, 12, 0.5, function (v) { set(function (x) { x.s.sw = v; }); }));
      propsBox.appendChild(selRow("線型", [["", "實線"], ["7 5", "虛線"], ["2 4", "點線"]], o.s.sd, function (v) { set(function (x) { x.s.sd = v; }); }));
      if (["rect", "ellipse", "poly", "grid", "table"].indexOf(o.t) >= 0) {
        propsBox.appendChild(colorRow("填色", o.s.fc, function (c) { set(function (x) { x.s.fc = c; }); }, true));
        propsBox.appendChild(numRow("填色濃度", o.s.fo, 0, 1, 0.05, function (v) { set(function (x) { x.s.fo = v; }); }));
      }
      if (o.t === "rect") propsBox.appendChild(numRow("圓角", o.s.r, 0, 40, 1, function (v) { set(function (x) { x.s.r = v; }); }));
      if (o.t === "poly") propsBox.appendChild(numRow("幾邊形", o.d.n, 3, 12, 1, function (v) { set(function (x) { x.d.n = v; }); }));
      if (o.t === "line" || o.t === "arrow") {
        propsBox.appendChild(chkRow("起點箭頭", o.s.a1, function (v) { set(function (x) { x.s.a1 = v ? 1 : 0; }); }));
        propsBox.appendChild(chkRow("終點箭頭", o.s.a2, function (v) { set(function (x) { x.s.a2 = v ? 1 : 0; }); }));
      }
      if (["text", "nline", "axes", "table"].indexOf(o.t) >= 0) {
        propsBox.appendChild(numRow("字級", o.s.fs, 8, 72, 1, function (v) { set(function (x) { x.s.fs = v; }); }));
        propsBox.appendChild(selRow("字體", FONTS.map(function (f) { return [f[0], f[1]]; }), o.s.ff, function (v) { set(function (x) { x.s.ff = v; }); }));
      }
      if (o.t === "text") {
        propsBox.appendChild(selRow("對齊", [["start", "靠左"], ["middle", "置中"], ["end", "靠右"]], o.s.fa, function (v) { set(function (x) { x.s.fa = v; }); }));
        propsBox.appendChild(chkRow("粗體", o.s.fw >= 700, function (v) { set(function (x) { x.s.fw = v ? 700 : 400; }); }));
        var eb = h('<button type="button" class="pen dw-b dw-full">改文字</button>'); eb.onclick = function () { editText(o); }; propsBox.appendChild(eb);
      }
      if (o.t === "nline") {
        propsBox.appendChild(numRow("最小值", o.d.min, -1000, 1000, 1, function (v) { set(function (x) { x.d.min = v; }); }));
        propsBox.appendChild(numRow("最大值", o.d.max, -1000, 1000, 1, function (v) { set(function (x) { x.d.max = v; }); }));
        propsBox.appendChild(numRow("刻度間隔", o.d.step, 0.1, 100, 0.1, function (v) { set(function (x) { x.d.step = v; }); }));
        propsBox.appendChild(chkRow("顯示數字", o.d.lab, function (v) { set(function (x) { x.d.lab = v ? 1 : 0; }); }));
      }
      if (o.t === "axes") {
        propsBox.appendChild(numRow("橫向格數", o.d.gx, 1, 40, 1, function (v) { set(function (x) { x.d.gx = v; }); }));
        propsBox.appendChild(numRow("縱向格數", o.d.gy, 1, 40, 1, function (v) { set(function (x) { x.d.gy = v; }); }));
        propsBox.appendChild(chkRow("顯示格線", o.d.grid, function (v) { set(function (x) { x.d.grid = v ? 1 : 0; }); }));
        propsBox.appendChild(txtRow("橫軸名稱", o.d.xl, function (v) { set(function (x) { x.d.xl = v; }); }));
        propsBox.appendChild(txtRow("縱軸名稱", o.d.yl, function (v) { set(function (x) { x.d.yl = v; }); }));
      }
      if (o.t === "grid") {
        propsBox.appendChild(numRow("格子大小", o.d.cell, 4, 120, 1, function (v) { set(function (x) { x.d.cell = v; }); }));
        propsBox.appendChild(chkRow("虛線", o.d.dash, function (v) { set(function (x) { x.d.dash = v ? 1 : 0; }); }));
      }
      if (o.t === "table") {
        propsBox.appendChild(numRow("列數", o.d.r, 1, 20, 1, function (v) { set(function (x) { x.d.r = v; }); }));
        propsBox.appendChild(numRow("欄數", o.d.c, 1, 20, 1, function (v) { set(function (x) { x.d.c = v; }); }));
        var tb2 = h('<button type="button" class="pen dw-b dw-full">填內容</button>'); tb2.onclick = function () { editTable(o); }; propsBox.appendChild(tb2);
      }
      propsBox.appendChild(numRow("旋轉", o.rot || 0, -180, 180, 1, function (v) { set(function (x) { x.rot = v; }); }));
      var ab = h('<div class="dw-arr"></div>');
      [["靠左", "l"], ["置中", "c"], ["靠右", "r"], ["靠上", "t"], ["中線", "m"], ["靠下", "b"]].forEach(function (a) {
        var b = h('<button type="button" class="pen dw-b">' + a[0] + "</button>"); b.onclick = function () { align(a[1]); }; ab.appendChild(b);
      });
      if (list.length > 1) { propsBox.appendChild(h('<p class="dw-ph">對齊</p>')); propsBox.appendChild(ab); }
    }
    function tName(t) {
      return { sel: "選取", rect: "矩形", ellipse: "橢圓", poly: "多邊形", line: "直線", arrow: "箭頭", text: "文字", nline: "數線", axes: "座標軸", grid: "方格", table: "表格", lib: "圖形" }[t] || t;
    }
    function align(k) {
      var list = selObjs(); if (list.length < 2) return;
      var b = unionBox(list); push();
      list.forEach(function (o) {
        var ob = bbox(o), dx = 0, dy = 0;
        if (k === "l") dx = b.x - ob.x; if (k === "c") dx = b.x + b.w / 2 - (ob.x + ob.w / 2); if (k === "r") dx = b.x + b.w - (ob.x + ob.w);
        if (k === "t") dy = b.y - ob.y; if (k === "m") dy = b.y + b.h / 2 - (ob.y + ob.h / 2); if (k === "b") dy = b.y + b.h - (ob.y + ob.h);
        o.x += dx; o.y += dy; if (o.x2 != null) { o.x2 += dx; o.y2 += dy; }
      });
      render(); store();
    }
    function docPanel() {
      var d = h('<div><p class="dw-ph">畫布</p></div>');
      d.appendChild(numRow("寬", D.w, 100, 4000, 10, function (v) { D.w = v; build(); store(); }));
      d.appendChild(numRow("高", D.h, 100, 4000, 10, function (v) { D.h = v; build(); store(); }));
      d.appendChild(colorRow("底色", D.bg, function (c) { D.bg = c; build(); store(); }, true));
      d.appendChild(h('<p class="dw-ph">輔助</p>'));
      d.appendChild(chkRow("顯示格線", S.grid, function (v) { S.grid = v ? 1 : 0; sv(SETK, S); gridLines(); }));
      d.appendChild(chkRow("吸附格線", S.snap, function (v) { S.snap = v ? 1 : 0; sv(SETK, S); }));
      d.appendChild(numRow("格線間距", S.cell, 2, 50, 1, function (v) { S.cell = v; sv(SETK, S); gridLines(); }));
      d.appendChild(h('<p class="dw-note meta">快速鍵：Delete 刪除、Ctrl+Z 復原、Ctrl+Shift+Z 重做、Ctrl+D 複製、方向鍵微調、按住 Shift 畫正方形或正圓、拉把手時按 Shift 等比例。</p>'));
      return d;
    }

    /* ---- 小元件 ---- */
    function row(lab, el) { var r = h('<label class="dw-row"><span>' + esc(lab) + "</span></label>"); r.appendChild(el); return r; }
    function numRow(lab, v, min, max, step, cb) {
      var i = h('<input type="number" class="dw-in" value="' + v + '" min="' + min + '" max="' + max + '" step="' + step + '">');
      i.onchange = function () { cb(clamp(parseFloat(i.value) || 0, min, max)); };
      return row(lab, i);
    }
    function txtRow(lab, v, cb) { var i = h('<input class="dw-in" value="' + esc(v || "") + '">'); i.onchange = function () { cb(i.value); }; return row(lab, i); }
    function chkRow(lab, v, cb) { var i = h('<input type="checkbox"' + (v ? " checked" : "") + ">"); i.onchange = function () { cb(i.checked); }; return row(lab, i); }
    function selRow(lab, opts, v, cb) {
      var s = h('<select class="dw-in">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>");
      s.onchange = function () { cb(s.value); };
      return row(lab, s);
    }
    function colorRow(lab, v, cb, allowNone) {
      var d = h('<div class="dw-cols"></div>');
      if (allowNone) { var nb = h('<button type="button" class="dw-c dw-cn' + (v === "none" ? " on" : "") + '" title="不填">／</button>'); nb.onclick = function () { cb("none"); }; d.appendChild(nb); }
      PAL.forEach(function (c) {
        var b = h('<button type="button" class="dw-c' + (v === c ? " on" : "") + '" style="background:' + c + '" title="' + c + '"></button>');
        b.onclick = function () { cb(c); }; d.appendChild(b);
      });
      var cp = h('<input type="color" class="dw-cp" value="' + (/^#/.test(v) ? v : "#1c2635") + '" title="自訂顏色">');
      cp.oninput = function () { cb(cp.value); };
      d.appendChild(cp);
      return row(lab, d);
    }

    /* ---- 文字與表格編輯 ---- */
    function editText(o) {
      var ta = h('<textarea class="dw-ta" rows="5">' + esc(o.d.tx || "") + "</textarea>");
      dlg("改文字", ta, [["確定", function () { push(); o.d.tx = ta.value; closeDlg(); render(); store(); }, 1], ["取消", closeDlg]]);
      setTimeout(function () { ta.focus(); }, 30);
    }
    function editTable(o) {
      var R = o.d.r, C = o.d.c, g = h('<div class="dw-tg" style="grid-template-columns:repeat(' + C + ',1fr)"></div>'), ins = [];
      for (var i = 0; i < R * C; i++) {
        var inp = h('<input class="dw-in" value="' + esc((o.d.cells || [])[i] || "") + '">');
        ins.push(inp); g.appendChild(inp);
      }
      dlg("填表格內容", g, [["確定", function () { push(); o.d.cells = ins.map(function (x) { return x.value; }); closeDlg(); render(); store(); }, 1], ["取消", closeDlg]]);
    }

    /* ---- 匯出 ---- */
    function cleanSvg(scale) {
      /* 匯出用的 SVG：只要物件，不要格線、選取框、畫布底以外的東西 */
      var w = D.w, hh = D.h;
      var body = D.objs.map(objSvg).join("");
      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + rd(w * (scale || 1)) + '" height="' + rd(hh * (scale || 1)) + '" viewBox="0 0 ' + w + " " + hh + '">' +
        (D.bg && D.bg !== "none" ? '<rect x="0" y="0" width="' + w + '" height="' + hh + '" fill="' + D.bg + '"/>' : "") +
        body + "</svg>";
    }
    function dl(blob, name) {
      var a = document.createElement("a"), u = URL.createObjectURL(blob);
      a.href = u; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1000);
    }
    function fname(ext) { return (D.name || "圖").replace(/[\\/:*?"<>|]/g, "_") + "." + ext; }
    function exportDlg() {
      if (!D || !D.objs.length) { ask("還沒有東西可以匯出", "畫布上還是空的，先畫一點東西再匯出。", "知道了", null); return; }
      var body = h('<div class="dw-ex"></div>');
      body.appendChild(h('<p class="meta">選一種格式。SVG 是向量，放大不會糊，Word 2016 以後、Illustrator、Inkscape 都能開；PNG 是圖片，貼到哪裡都能看。</p>'));
      var fmt = h('<div class="dw-exf"><label><input type="radio" name="dwfmt" value="svg" checked> SVG（向量，不失真）</label>' +
        '<label><input type="radio" name="dwfmt" value="png"> PNG（圖片）</label></div>');
      body.appendChild(fmt);
      var scl = h('<div class="dw-exs"><span>PNG 解析度</span><select class="dw-in"><option value="1">1 倍（' + D.w + "×" + D.h + '）</option><option value="2" selected>2 倍</option><option value="4">4 倍（印刷用）</option></select></div>');
      body.appendChild(scl);
      var note = h('<p class="dw-note meta">SVG 裡的文字會記成字體名稱。如果對方電腦沒有那套字，文字會換成別的字體；要完全一樣，請改用 PNG，或在文字上改用「黑體／明體」這類通用字體。</p>');
      body.appendChild(note);
      function upd() { var v = fmt.querySelector("input:checked").value; scl.style.display = v === "png" ? "" : "none"; note.style.display = v === "svg" ? "" : "none"; }
      fmt.querySelectorAll("input").forEach(function (i) { i.onchange = upd; });
      upd();
      dlg("匯出", body, [["下載", function () {
        var v = fmt.querySelector("input:checked").value;
        if (v === "svg") { dl(new Blob([cleanSvg(1)], { type: "image/svg+xml;charset=utf-8" }), fname("svg")); closeDlg(); return; }
        var k = parseInt(scl.querySelector("select").value, 10) || 2;
        pngBlob(k, function (b) { if (b) dl(b, fname("png")); closeDlg(); });
      }, 1], ["取消", closeDlg]]);
    }
    function pngBlob(scale, cb) {
      var src = cleanSvg(1), img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        c.width = Math.round(D.w * scale); c.height = Math.round(D.h * scale);
        var g = c.getContext("2d");
        g.fillStyle = D.bg && D.bg !== "none" ? D.bg : "#ffffff";
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { cb(b); }, "image/png");
      };
      img.onerror = function () { cb(null); status("PNG 轉檔失敗，請改用 SVG。"); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
    }
    /* 備份：把這台電腦上的所有圖匯成一個 .json，或從 .json 還原 */
    function backupDlg() {
      var body = h('<div><p class="meta">圖只存在這台電腦。換電腦、或怕瀏覽器資料被清掉，就先匯出一份備份檔收著。</p></div>');
      var f = h('<input type="file" accept="application/json,.json" class="dw-in">');
      f.onchange = function () {
        var file = f.files[0]; if (!file) return;
        var r = new FileReader();
        r.onload = function () {
          try {
            var a = JSON.parse(r.result);
            if (!Array.isArray(a)) throw new Error("格式不對");
            var cur = docs(), has = {};
            cur.forEach(function (x) { has[x.id] = 1; });
            a.forEach(function (x) { if (x && x.id && x.objs) { if (has[x.id]) x.id = uid(); cur.unshift(x); } });
            saveDocs(cur); closeDlg(); openDoc(cur[0]);
            status("還原了 " + a.length + " 張圖。");
          } catch (e) { status("這個檔案讀不出來，請確認是這裡匯出的備份檔。"); }
        };
        r.readAsText(file);
      };
      body.appendChild(h('<p class="dw-ph">還原：選一個備份檔</p>'));
      body.appendChild(f);
      dlg("備份／還原", body, [["匯出全部備份", function () {
        dl(new Blob([JSON.stringify(docs())], { type: "application/json" }), "數光島製圖備份.json");
      }], ["關閉", closeDlg]]);
    }

    /* ---- 對話框 ---- */
    var dlgEl = null;
    function dlg(title, body, acts) {
      closeDlg();
      dlgEl = h('<div class="dw-modal" role="dialog" aria-modal="true"><div class="dw-mbox"><h3>' + esc(title) + '</h3><div class="dw-mbody"></div><div class="dw-mact"></div></div></div>');
      dlgEl.querySelector(".dw-mbody").appendChild(body);
      var act = dlgEl.querySelector(".dw-mact");
      (acts || []).forEach(function (a) {
        var b = h('<button type="button" class="pen' + (a[2] ? " go" : "") + '">' + esc(a[0]) + "</button>");
        b.onclick = a[1] || closeDlg; act.appendChild(b);
      });
      dlgEl.addEventListener("click", function (e) { if (e.target === dlgEl) closeDlg(); });
      document.body.appendChild(dlgEl);
    }
    function closeDlg() { if (dlgEl && dlgEl.parentNode) dlgEl.parentNode.removeChild(dlgEl); dlgEl = null; }
    function ask(title, text, okText, cb) {
      dlg(title, h("<p>" + esc(text) + "</p>"), cb ? [[okText || "確定", function () { closeDlg(); cb(); }, 1], ["取消", closeDlg]] : [[okText || "知道了", closeDlg, 1]]);
    }

    /* ---- 鍵盤 ---- */
    function onKey(e) {
      if (!document.body.contains(wrap)) { document.removeEventListener("keydown", onKey); return; }
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (dlgEl) { if (e.key === "Escape") closeDlg(); return; }
      var m = e.ctrlKey || e.metaKey;
      if (m && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
      if (m && e.key.toLowerCase() === "y") { e.preventDefault(); doRedo(); return; }
      if (m && e.key.toLowerCase() === "d") {
        e.preventDefault(); if (!sel.length) return;
        push();
        var add = selObjs().map(function (o) { var c = clone(o); c.id = uid(); c.x += 12; c.y += 12; if (c.x2 != null) { c.x2 += 12; c.y2 += 12; } return c; });
        add.forEach(function (c) { D.objs.push(c); });
        sel = add.map(function (c) { return c.id; });
        render(); store(); return;
      }
      if (m && e.key.toLowerCase() === "a") { e.preventDefault(); sel = D.objs.map(function (o) { return o.id; }); overlay(); props(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); delSel(); return; }
      if (e.key === "Escape") { sel = []; setTool("sel"); overlay(); props(); return; }
      if (/^Arrow/.test(e.key) && sel.length) {
        e.preventDefault();
        var d = e.shiftKey ? 10 : 1, dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0, dy = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
        selObjs().forEach(function (o) { o.x += dx; o.y += dy; if (o.x2 != null) { o.x2 += dx; o.y2 += dy; } });
        live(); store();
      }
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", function () { if (document.body.contains(wrap)) fitZoom(); });
    setTool("sel");
  };
})();
