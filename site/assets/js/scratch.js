/* 計算紙：答題時可以直接在畫面上算、畫圖。
   - 手指、觸控筆、滑鼠都能寫；觸控筆寫過之後就自動擋掉手指（防手掌誤觸）
   - 筆跡存的是向量（一串點），所以縮放視窗、轉成全螢幕都不會變模糊，復原也只要砍掉最後一筆
   - 每一題各有一張紙：模擬考按「上一題」回去，原本算的過程還在
   - 同一份卷子的筆跡會暫存在這台瀏覽器裡（localStorage），不小心重新整理不會全部白費；
     不會上傳伺服器，交卷或離開就清掉
   座標用「以寬度為 1」的相對值存（y 也除以寬度），所以換尺寸時整張等比例放大縮小。 */
(function () {
  "use strict";
  var COLORS = ["#1b3a6b", "#c0392b", "#1e7a4b", "#6b6b6b"]; /* 墨藍、紅、綠、鉛筆灰 */
  var WIDTHS = [1.6, 3, 5.5];
  var PAPERS = ["方格", "橫線", "空白"];
  var LSK = "nb-pad";          /* 筆跡暫存 */
  var PREF = "nb-pad-pref";    /* 記住上次用的筆、紙、開合 */

  function ls(k, v) {
    try { if (v === undefined) { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    return null;
  }
  /* open 有三種狀態：true＝展開、false＝學生自己收起來過、null＝還沒設定過（預設展開，
   計算紙本來就是要用的）。筆和紙的設定與 open 分開存，免得存筆色時把 open 洗掉。 */
function pref() { var p = ls(PREF) || {}; return { c: +p.c || 0, w: p.w === undefined ? 1 : +p.w, bg: +p.bg || 0, open: p.open === true ? true : p.open === false ? false : null }; }
/* 只蓋掉有給值的欄位（null／undefined 跳過），不會把沒帶到的設定清掉 */
function setPref(o) { var cur = ls(PREF) || {}; Object.keys(o).forEach(function (k) { if (o[k] !== null && o[k] !== undefined) cur[k] = o[k]; }); ls(PREF, cur); }
function setOpen(v) { var cur = ls(PREF) || {}; cur.open = !!v; ls(PREF, cur); }

  /* ---- 筆跡暫存：以「卷號」為單位，一份卷子一包 ---- */
  function store(sid) {
    var all = ls(LSK) || {};
    return {
      get: function (k) { var b = all[sid]; return (b && b[k]) || null; },
      put: function (k, v) {
        var b = all[sid] || (all[sid] = {});
        if (v && v.length) b[k] = v; else delete b[k];
        /* 只留最近 3 份卷子，不要把瀏覽器的空間吃光 */
        var ks = Object.keys(all);
        if (ks.length > 3) ks.slice(0, ks.length - 3).forEach(function (x) { if (x !== sid) delete all[x]; });
        ls(LSK, all);
      },
      drop: function () { delete all[sid]; ls(LSK, all); }
    };
  }

  function ic(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; }
  var ICO = {
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    era: '<path d="M20 20H9L4 15a2 2 0 0 1 0-3l7-7a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-5 5"/><path d="M8 19l7-7"/>',
    undo: '<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>',
    clr: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
    big: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    small: '<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>'
  };

  /* ---- 一張紙 ---- */
  function makePad(host, opt) {
    var P = pref(), strokes = (opt.load && opt.load()) || [], cur = null, mode = "pen", penSeen = false, big = false;
    var wrap = document.createElement("div"); wrap.className = "pad";
    wrap.innerHTML =
      '<div class="pad-bar">' +
        '<div class="pad-g pad-tool">' +
          '<button type="button" class="pad-b" data-m="pen" title="筆">' + ic(ICO.pen) + "</button>" +
          '<button type="button" class="pad-b" data-m="era" title="橡皮擦（擦掉整筆）">' + ic(ICO.era) + "</button>" +
        "</div>" +
        '<div class="pad-g pad-col">' + COLORS.map(function (c, i) { return '<button type="button" class="pad-c" data-c="' + i + '" style="--pc:' + c + '" title="換顏色"><i></i></button>'; }).join("") + "</div>" +
        '<div class="pad-g pad-wid">' + WIDTHS.map(function (w, i) { return '<button type="button" class="pad-w" data-w="' + i + '" title="粗細"><i style="height:' + Math.max(2, w) + 'px"></i></button>'; }).join("") + "</div>" +
        '<div class="pad-g">' +
          '<button type="button" class="pad-b" data-a="undo" title="復原">' + ic(ICO.undo) + "</button>" +
          '<button type="button" class="pad-b" data-a="clr" title="整張清空">' + ic(ICO.clr) + "</button>" +
        "</div>" +
        '<div class="pad-g pad-end">' +
          '<button type="button" class="pad-b pad-bg" data-a="bg" title="換紙">方格</button>' +
          '<button type="button" class="pad-b" data-a="big" title="放大">' + ic(ICO.big) + "</button>" +
        "</div>" +
      "</div>" +
      '<div class="pad-sheet"><canvas></canvas></div>';
    host.appendChild(wrap);

    var sheet = wrap.querySelector(".pad-sheet"), cv = wrap.querySelector("canvas"), ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1;

    function paper() {
      var step = 24 * (W / 760 < 0.6 ? 0.8 : 1), m = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(getComputedStyle(wrap).color || "");
      var c = m ? [+m[1], +m[2], +m[3]] : [0, 0, 0], line = "rgba(" + c.join(",") + ",.13)";
      if (P.bg === 2) return;
      ctx.save(); ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var y = step; y < H; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
      if (P.bg === 0) for (var x = step; x < W; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
      ctx.stroke(); ctx.restore();
    }
    function line(s) {
      var p = s.p; if (p.length < 2) return;
      ctx.strokeStyle = COLORS[s.c] || COLORS[0]; ctx.lineWidth = (WIDTHS[s.w] || WIDTHS[1]) * (s.f || 1);
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
      ctx.moveTo(p[0] * W, p[1] * W);
      if (p.length === 2) { ctx.lineTo(p[0] * W + .1, p[1] * W); ctx.stroke(); return; }
      /* 用中點當控制點畫平滑曲線，手寫起來才不會一節一節 */
      for (var i = 2; i < p.length - 2; i += 2) ctx.quadraticCurveTo(p[i] * W, p[i + 1] * W, (p[i] + p[i + 2]) / 2 * W, (p[i + 1] + p[i + 3]) / 2 * W);
      ctx.lineTo(p[p.length - 2] * W, p[p.length - 1] * W);
      ctx.stroke();
    }
    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.scale(dpr, dpr);
      paper(); strokes.forEach(line); if (cur) line(cur);
    }
    function size() {
      var w = sheet.clientWidth, hh = sheet.clientHeight;
      if (!w || !hh) return;
      W = w; H = hh; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr);
      cv.style.width = w + "px"; cv.style.height = hh + "px";
      draw();
    }

    /* ---- 寫字 ---- */
    function at(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / W, (e.clientY - r.top) / W]; }
    /* 橡皮擦：碰到哪一筆就整筆擦掉（比一點一點擦好用，也不用存點陣圖） */
    function erase(pt) {
      var tol = 10 / W, hit = -1;
      for (var i = strokes.length - 1; i >= 0 && hit < 0; i--) {
        var p = strokes[i].p, r = tol + (WIDTHS[strokes[i].w] || 3) / 2 / W;
        for (var j = 0; j < p.length - 1; j += 2) {
          var dx = p[j] - pt[0], dy = p[j + 1] - pt[1];
          if (dx * dx + dy * dy < r * r) { hit = i; break; }
        }
      }
      if (hit >= 0) { strokes.splice(hit, 1); draw(); save(); }
    }
    function save() { if (opt.save) opt.save(strokes); }

    var drawing = 0;
    cv.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "pen") penSeen = true;
      if (penSeen && e.pointerType === "touch") return; /* 用過觸控筆就不收手指，手掌靠著也不會畫到 */
      if (e.button) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      drawing = e.pointerId;
      if (mode === "era") { erase(at(e)); return; }
      var f = e.pointerType === "pen" && e.pressure ? .5 + e.pressure : 1;
      cur = { c: P.c, w: P.w, f: Math.round(f * 100) / 100, p: at(e) };
      draw();
    });
    cv.addEventListener("pointermove", function (e) {
      if (drawing !== e.pointerId) return;
      e.preventDefault();
      if (mode === "era") { erase(at(e)); return; }
      if (!cur) return;
      var p = at(e), n = cur.p.length;
      /* 太近的點不收，筆跡才不會爆肥 */
      if (n >= 2 && Math.abs(p[0] - cur.p[n - 2]) < .002 && Math.abs(p[1] - cur.p[n - 1]) < .002) return;
      cur.p.push(p[0], p[1]); draw();
    });
    function up(e) {
      if (drawing !== e.pointerId) return;
      drawing = 0;
      try { cv.releasePointerCapture(e.pointerId); } catch (x) {}
      if (cur) { if (cur.p.length >= 2) strokes.push(cur); cur = null; draw(); save(); }
    }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);

    /* ---- 工具列 ---- */
    function paint() {
      wrap.querySelectorAll(".pad-b[data-m]").forEach(function (b) { b.classList.toggle("on", b.dataset.m === mode); });
      wrap.querySelectorAll(".pad-c").forEach(function (b) { b.classList.toggle("on", +b.dataset.c === P.c); });
      wrap.querySelectorAll(".pad-w").forEach(function (b) { b.classList.toggle("on", +b.dataset.w === P.w); });
      wrap.querySelector(".pad-bg").textContent = PAPERS[P.bg];
      wrap.querySelector('[data-a="big"]').innerHTML = ic(big ? ICO.small : ICO.big);
      wrap.classList.toggle("era", mode === "era");
      cv.style.setProperty("--pc", COLORS[P.c]);
    }
    function setBig(v) {
      big = v; wrap.classList.toggle("pad-full", big);
      document.body.classList.toggle("pad-lock", big);
      paint(); setTimeout(size, 30);
    }
    wrap.querySelector(".pad-bar").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      e.preventDefault();
      if (b.dataset.m) mode = b.dataset.m;
      else if (b.dataset.c !== undefined) { P.c = +b.dataset.c; mode = "pen"; }
      else if (b.dataset.w !== undefined) { P.w = +b.dataset.w; mode = "pen"; }
      else if (b.dataset.a === "undo") { if (strokes.length) { strokes.pop(); draw(); save(); } }
      else if (b.dataset.a === "clr") { if (strokes.length && confirm("要把這張計算紙整張清掉嗎？")) { strokes = []; draw(); save(); } }
      else if (b.dataset.a === "bg") { P.bg = (P.bg + 1) % PAPERS.length; draw(); }
      else if (b.dataset.a === "big") { setBig(!big); }
      setPref(P); paint();
    });
    /* 全螢幕時按 Esc 收起來 */
    function esc(e) { if (e.key === "Escape" && big) setBig(false); }
    document.addEventListener("keydown", esc);

    var ro = null;
    try { ro = new ResizeObserver(function () { size(); }); ro.observe(sheet); } catch (e) { window.addEventListener("resize", size); }

    paint(); size(); setTimeout(size, 0);
    return {
      el: wrap,
      resize: size,
      destroy: function () {
        document.removeEventListener("keydown", esc);
        if (ro) ro.disconnect(); else window.removeEventListener("resize", size);
        document.body.classList.remove("pad-lock");
        if (wrap.parentNode) wrap.remove();
      }
    };
  }

  /* ---- 掛在一題上面：一顆「計算紙」按鈕，展開才真的建畫布 ---- */
  function attach(host, o) {
    o = o || {};
    var st = o.sid ? store(o.sid) : null, key = String(o.key == null ? "" : o.key);
    var had = st && st.get(key) && st.get(key).length;
    var box = document.createElement("div"); box.className = "padwrap";
    var bt = document.createElement("button");
    bt.type = "button"; bt.className = "pen padtg";
    bt.innerHTML = ic(ICO.pen) + "<span>計算紙</span>";
    box.appendChild(bt); host.appendChild(box);

    var pad = null, open = false;
    function openIt(v) {
      open = v; bt.classList.toggle("on", open); bt.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && !pad) {
        pad = makePad(box, {
          load: function () { return st ? st.get(key) : null; },
          save: function (s) { if (st) st.put(key, s); }
        });
      } else if (pad) { pad.el.style.display = open ? "" : "none"; if (open) pad.resize(); }
      setOpen(open);
    }
    bt.onclick = function () { openIt(!open); };
    /* 這一題本來就有算過，或這個人沒有自己收起來過，就直接展開 */
    if (had || pref().open !== false) openIt(true);   /* null（沒設定過）也算要展開 */
    return { destroy: function () { if (pad) pad.destroy(); if (box.parentNode) box.remove(); }, drop: function () { if (st) st.drop(); } };
  }

  window.NB = window.NB || {};
  NB.pad = { attach: attach, clear: function (sid) { if (sid) store(sid).drop(); } };
})();
