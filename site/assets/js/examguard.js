/* 模擬考的防弊輔助：
   1. 偵測離開作答頁面（切到別的分頁、別的視窗、縮小）：只記錄次數和秒數回報給伺服器，不扣分、不交卷
   2. 畫面上的動態浮水印：姓名、班級座號、Email、IP、裝置、時間、卷號，每 10 秒換到隨機位置，截圖或拍照外流時可追查 */
(function () {
  "use strict";
  var MOVE_MS = 10000, MIN_AWAY = 2; /* 每 10 秒換一次位置；離開不到 2 秒不算（例如系統通知一閃而過） */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function start(o) {
    var n = 0, secs = 0, t0 = 0, stopped = false, timers = [], note = null, lw = o.lw, wm = null, blk = null, mo = null, fixes = 0;

    /* ---- 離開偵測：每秒看一次「頁面是不是隱藏、視窗有沒有焦點」，比單靠事件穩定 ---- */
    function away() { return document.hidden || (document.hasFocus && !document.hasFocus()); }
    function say(t) {
      if (!o.box) return;
      if (!note) { note = document.createElement("div"); note.className = "fb no xgnote"; o.box.insertBefore(note, o.box.firstChild.nextSibling); }
      note.textContent = t; clearTimeout(note.__t); note.__t = setTimeout(function () { if (note) note.remove(); note = null; }, 12000);
    }
    function report() { try { o.api("POST", "/api/leave", { sid: o.sid, n: n, secs: secs }).catch(function () {}); } catch (e) {} }
    timers.push(setInterval(function () {
      if (stopped) return;
      if (away()) { if (!t0) t0 = Date.now(); return; }
      if (t0) { var d = Math.round((Date.now() - t0) / 1000); t0 = 0; if (d >= MIN_AWAY) { n++; secs += d; report(); say("偵測到你離開了作答頁面（第 " + n + " 次，累計約 " + secs + " 秒），這會記錄給老師。請專心把卷子寫完。"); } }
    }, 1000));

    /* ---- 動態浮水印 ---- */
    function lines() {
      var u = o.user || {}, d = new Date(), l = [];
      l.push(esc(u.name || "") + "　" + (u.cls && u.cls !== "all" ? esc(u.cls) + " 班 " + esc(u.no) + " 號" : ""));
      if (lw && lw.email) l.push(esc(lw.email));
      if (lw && lw.ip) l.push("IP " + esc(lw.ip) + (lw.net ? "（" + esc(lw.net) + "）" : ""));
      l.push(esc((lw && lw.brief) || "") + "　" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + "　卷 " + esc(String(o.sid || "").slice(0, 6).toUpperCase()));
      return l;
    }
    /* 文字顏色跟著頁面文字色走（深色模式用白字、淺色模式用黑字），只調透明度；不加陰影，不然會糊 */
    function tint() {
      if (!blk) return;
      var m = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(getComputedStyle(document.body).color || ""), c = m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
      blk.style.color = "rgba(" + c.join(",") + ",.3)";
    }
    function place() {
      if (!blk) return;
      blk.style.opacity = "0";
      setTimeout(function () {
        if (!blk) return;
        blk.innerHTML = lines().map(function (t) { return "<div>" + t + "</div>"; }).join(""); tint();
        var vw = window.innerWidth, vh = window.innerHeight, w = blk.offsetWidth, h = blk.offsetHeight;
        blk.style.left = Math.max(4, Math.floor(Math.random() * Math.max(1, vw - w - 8))) + "px";
        blk.style.top = Math.max(4, Math.floor(Math.random() * Math.max(1, vh - h - 8))) + "px";
        blk.style.opacity = "1";
      }, 450);
    }
    function mount() {
      if (wm && wm.parentNode) wm.remove();
      wm = document.createElement("div"); wm.className = "lwm"; wm.setAttribute("aria-hidden", "true");
      blk = document.createElement("div"); blk.className = "lwm-b"; wm.appendChild(blk); document.body.appendChild(wm);
      blk.innerHTML = lines().map(function (t) { return "<div>" + t + "</div>"; }).join("");
      blk.style.left = "12px"; blk.style.top = "70px"; blk.style.opacity = "1"; tint(); place();
    }
    function alive() { if (!wm || !document.body.contains(wm) || !blk || !wm.contains(blk)) return false; var c = getComputedStyle(wm), b = getComputedStyle(blk); return c.display !== "none" && c.visibility !== "hidden" && +c.opacity > 0.5 && b.display !== "none" && b.visibility !== "hidden"; }
    if (lw) {
      mount();
      timers.push(setInterval(function () { if (!stopped) place(); }, MOVE_MS));
      /* 被刪掉、被隱藏就重畫（最多重畫 30 次，避免和別的程式搶） */
      timers.push(setInterval(function () { if (!stopped && !alive() && fixes < 30) { fixes++; mount(); } }, 1500));
      try { mo = new MutationObserver(function () { if (!stopped && !alive() && fixes < 30) { fixes++; mount(); } }); mo.observe(document.body, { childList: true }); } catch (e) {}
    }
    return function stop() {
      stopped = true; timers.forEach(clearInterval); if (mo) mo.disconnect(); if (wm) wm.remove(); wm = blk = null; if (note) { note.remove(); note = null; }
    };
  }
  window.NB = window.NB || {}; NB.xg = { start: start };
})();
