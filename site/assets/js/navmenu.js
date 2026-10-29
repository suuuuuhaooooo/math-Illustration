/* 全站漢堡選單：學員專區、學習地圖、無限出題……
   之後要加新功能，只要在 NB.NAV 加一筆 { g:"分組", href, t:"名稱", d:"一句說明", ic:"圖示名" } 就好。
   NB.menu() 回傳按鈕元素（放進 .bar），點開時三條槓會變成叉叉。 */
(function () {
  "use strict";
  var NB = window.NB = window.NB || {}, root = document.body.getAttribute("data-root") || "./";
  var IC = {
    member: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    pen: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13 7l4 4"/>',
    log: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    cup: '<path d="M6 8h12l-1.5 12a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2z"/><path d="M5 8h14M14 3l-2 5"/><circle cx="10" cy="17" r="1"/><circle cx="13.5" cy="15.5" r="1"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'
  };
  function cfg() { return window.NB_CONFIG || {}; }
  NB.NAV = NB.NAV || [
    { g: "學習", id: "member", href: "member.html", t: "學員專區", d: "每日一題、錯題本、模擬卷與積分", ic: "member" },
    { g: "學習", id: "map", href: "map.html", t: "學習地圖", d: "單元之間怎麼連起來", ic: "map" },
    { g: "免費工具・不用登入", id: "drill", href: "drill.html#print", t: "無限出題", d: "自動排版的 A4 練習卷，附答案卷", ic: "print" },
    { g: "免費工具・不用登入", id: "online", href: "drill.html#online", t: "線上練習", d: "一題一題作答，馬上批改", ic: "pen" },
    { g: "免費工具・不用登入", id: "log", href: "drill.html#log", t: "練習紀錄", d: "答對率、錯題再練（存在這台裝置）", ic: "log" },
    { g: "其他", id: "intro", href: "../", t: "島覽頁", d: "數光島筆記本介紹", ic: "home" },
    { g: "其他", id: "plans", href: "plans.html", t: "方案與價格", d: "班級與個人方案", ic: "tag" },
    { g: "其他", id: "donate", href: "", t: "請島民喝珍奶", d: "小額贊助，支持網站持續更新", ic: "cup", ext: 1 }
  ];
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[k] || "") + "</svg>"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var uid = 0;
  NB.menu = function (o) {
    o = o || {}; var id = "nbm" + ++uid, cur = o.cur || "";
    var wrap = document.createElement("div"); wrap.className = "nbm";
    wrap.innerHTML = '<button type="button" class="nbm-btn" aria-expanded="false" aria-controls="' + id + '" aria-label="開啟選單"><span class="nbm-ic" aria-hidden="true"><i></i><i></i><i></i></span><span class="nbm-tx">選單</span></button>' +
      '<div class="nbm-pan" id="' + id + '" role="menu" hidden></div>';
    var btn = wrap.firstChild, pan = wrap.lastChild;
    function build() {
      var dn = (cfg().donate || {}), groups = {}, order = [], html = "";
      NB.NAV.forEach(function (it) {
        if (it.id === "donate" && !dn.url) return;
        if (!groups[it.g]) { groups[it.g] = []; order.push(it.g); }
        groups[it.g].push(it);
      });
      order.forEach(function (g) {
        html += '<div class="nbm-g"><p class="nbm-gh">' + esc(g) + "</p>";
        groups[g].forEach(function (it) {
          var href = it.id === "donate" ? dn.url : /^(https?:|\.\.\/|\/)/.test(it.href) ? it.href : root + it.href, t = it.t, d = it.d;
          if (it.id === "donate" && dn.label) t = dn.label;
          if (it.id === "member" && NB.member && NB.member.cur) { var u = NB.member.cur(); if (u) { t = "學員專區・" + u.n; d = "Lv." + u.lv + "・" + u.pts + " 分"; } else d = "登入後使用" + "每日一題、錯題本與積分"; }
          var on = cur && it.id === cur ? " on" : "";
          html += '<a role="menuitem" class="nbm-it' + on + (it.id === "donate" ? " nbm-dn" : "") + '" href="' + esc(href) + '"' + (it.ext ? ' target="_blank" rel="noopener"' : "") + ">" + svg(it.ic) + '<span><b>' + esc(t) + "</b><small>" + esc(d) + "</small></span></a>";
        });
        html += "</div>";
      });
      pan.innerHTML = html;
    }
    function open(v) {
      if (v) build();
      wrap.classList.toggle("open", v); btn.setAttribute("aria-expanded", v ? "true" : "false"); btn.setAttribute("aria-label", v ? "關閉選單" : "開啟選單");
      if (v) { pan.hidden = false; requestAnimationFrame(function () { pan.classList.add("in"); var f = pan.querySelector("a"); if (f && !o.noFocus) f.focus({ preventScroll: true }); }); }
      else { pan.classList.remove("in"); setTimeout(function () { if (!wrap.classList.contains("open")) pan.hidden = true; }, 220); }
    }
    btn.onclick = function (e) { e.stopPropagation(); open(!wrap.classList.contains("open")); };
    document.addEventListener("click", function (e) { if (wrap.classList.contains("open") && !wrap.contains(e.target)) open(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && wrap.classList.contains("open")) { open(false); btn.focus(); } });
    pan.addEventListener("click", function (e) { if (e.target.closest("a")) open(false); });
    return wrap;
  };
  /* 贊助按鈕：頁面上有 [data-donate] 的元素就填入（沒設定網址就保持隱藏） */
  NB.donate = function () {
    var dn = cfg().donate || {}; if (!dn.url) return;
    var els = document.querySelectorAll("[data-donate]");
    for (var i = 0; i < els.length; i++) { var a = els[i]; a.href = dn.url; a.target = "_blank"; a.rel = "noopener"; if (!a.textContent.trim()) a.innerHTML = svg("cup") + "<span>" + esc(dn.label || "請島民喝珍奶") + "</span>"; a.hidden = false; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", NB.donate); else NB.donate();
})();
