/* 問題回報：右下角按鈕 → 選類型、寫說明、可附截圖 → 存進後台，並寄信給管理員。
   只有登入的人看得到按鈕（防濫用）。會自動附上頁面、裝置、最近的程式錯誤，不含密碼或其他個資。 */
(function () {
  "use strict";
  var errs = [];
  window.addEventListener("error", function (e) { errs.push(String(e.message || "error").slice(0, 160) + (e.filename ? " @" + String(e.filename).split("/").pop() + ":" + (e.lineno || 0) : "")); if (errs.length > 5) errs.shift(); });
  window.addEventListener("unhandledrejection", function (e) { errs.push("promise: " + String(e.reason && (e.reason.message || e.reason.code) || e.reason).slice(0, 160)); if (errs.length > 5) errs.shift(); });
  var CATS = ["題目或答案有誤", "畫面或功能壞掉", "登入或權限問題", "建議", "其他"];
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* 圖片縮到最長 1280px、轉成 JPEG，確保每張不超過約 400KB（手機截圖原檔常常好幾 MB） */
  function shrink(file) {
    return new Promise(function (ok, no) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        var q = .75, d; do { d = c.toDataURL("image/jpeg", q); q -= .1; } while (d.length > 520000 && q > .2);
        if (d.length > 560000) return no(new Error("big"));
        ok({ name: (file.name || "截圖").replace(/\.[^.]+$/, "") + ".jpg", mime: "image/jpeg", data: d.split(",")[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(u); no(new Error("img")); }; img.src = u;
    });
  }
  function open() {
    if (document.getElementById("rpov")) return;
    var M = window.NB && NB.member, files = [], busy = false;
    var ov = el("div", "rpov"), box = el("div", "rpbox"); ov.id = "rpov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "回報問題");
    box.innerHTML = '<h3>回報問題</h3><p class="meta">遇到錯誤、題目怪怪的、或有想法，都可以告訴管理員。系統會自動附上你目前看的頁面和裝置資訊，方便查原因。</p>' +
      '<label>類型<select id="rp-cat">' + CATS.map(function (c) { return "<option>" + c + "</option>"; }).join("") + "</select></label>" +
      '<label>題目ID（選填；錯題本或列印卷上的小字，多題用逗號分隔）<input id="rp-qid" type="text" maxlength="80" placeholder="例如 5u-9.2-003"></label>' +
      '<label>發生了什麼事？（請寫是哪個單元、哪一題、你按了什麼）<textarea id="rp-msg" rows="5" maxlength="2000" placeholder="例如：三上 2-1 的第 3 題，我選的答案是對的但顯示錯"></textarea></label>' +
      '<div class="rpfiles"><label class="pen rpadd">附上截圖（最多 3 張）<input type="file" accept="image/*" multiple hidden id="rp-file"></label><span id="rp-names" class="meta"></span></div>' +
      '<div class="fb" id="rp-fb" role="status"></div><div class="ctl"><button class="pen go" id="rp-send">送出</button><button class="pen" id="rp-x">取消</button></div>';
    ov.appendChild(box); document.body.appendChild(ov);
    var $ = function (i) { return box.querySelector("#" + i); }, fb = $("rp-fb");
    function say(t, ok) { fb.className = "fb " + (ok ? "ok" : "no"); fb.textContent = t; }
    function close() { document.removeEventListener("keydown", key); ov.remove(); }
    function key(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", key); ov.addEventListener("mousedown", function (e) { if (e.target === ov && !busy) close(); });
    $("rp-x").onclick = close; $("rp-msg").focus();
    function names() { $("rp-names").textContent = files.map(function (f) { return f.name; }).join("、"); }
    $("rp-file").onchange = function () {
      var list = Array.prototype.slice.call(this.files).slice(0, 3 - files.length); this.value = "";
      Promise.all(list.map(function (f) { return shrink(f).catch(function () { return null; }); })).then(function (r) {
        r.forEach(function (x) { if (x) files.push(x); }); if (r.some(function (x) { return !x; })) say("有一張圖片太大或無法讀取，已略過。", 0); names();
      });
    };
    $("rp-send").onclick = function () {
      var msg = $("rp-msg").value.trim(); if (busy) return;
      if (msg.length < 5) return say("請至少寫幾個字說明問題。", 0);
      if (!M || !M.api) return say("請先登入再回報。", 0);
      busy = true; $("rp-send").disabled = true; say("送出中…", 1);
      M.api("POST", "/api/report", { cat: $("rp-cat").value, msg: msg, qid: $("rp-qid").value.trim(), files: files, ctx: { page: location.pathname.split("/").pop() + location.hash, ua: navigator.userAgent, screen: innerWidth + "x" + innerHeight, errs: errs } }).then(function (r) {
        box.innerHTML = '<h3>已送出</h3><p>謝謝你的回報（編號 ' + esc(r.id) + '）。老師看到後會處理。</p><div class="ctl"><button class="pen go" id="rp-ok">關閉</button></div>'; box.querySelector("#rp-ok").onclick = close;
      }, function (e) {
        busy = false; $("rp-send").disabled = false;
        say(e.code === "rate_limited" ? "今天已經回報 5 次了，明天再試，或直接告訴管理員。" : e.code === "too_big" ? "附件太大，請少附幾張圖。" : e.code === "nologin" ? "請先登入再回報。" : "送出失敗（" + (e.code || "net") + "），請稍後再試。", 0);
      });
    };
  }
  function mount() {
    var b = el("button", "rpbtn nozy noprint", "回報問題"); b.type = "button"; b.hidden = true; b.setAttribute("aria-label", "回報問題"); b.onclick = open; document.body.appendChild(b);
    setInterval(function () { var on = !!(window.NB && NB.member && NB.member.U); if (b.hidden === on) b.hidden = !on; }, 1200);
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  window.NB = window.NB || {}; NB.report = { open: open };
})();
