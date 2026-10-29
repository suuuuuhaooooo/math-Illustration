/* 製圖：LaTeX 數學式 → 純 SVG。
   KaTeX 排出來的是 HTML（一堆絕對定位的 span），直接塞進 SVG 的 foreignObject
   只有瀏覽器看得懂，Illustrator、Inkscape、Word 都會開不出來。
   所以這裡把 KaTeX 排好的版面「量出來」，改寫成 SVG 的 <text> 和 <rect>，
   這樣匯出的檔案就是真正的向量，而且版面跟 LaTeX 一模一樣。

   另外 Computer Modern（KaTeX 用的字型）只有拉丁字母，整套才幾十 KB，
   匯出時可以把它 base64 嵌進 SVG，對方電腦沒裝字型也不會跑版。 */
(function () {
  "use strict";
  var NB = window.NB, DM = (NB.drawMath = {});
  var root = (document.body.getAttribute("data-root") || "./") + "assets/vendor/katex/fonts/";

  /* 量字用的隱形容器 */
  var host = null;
  function stage() {
    if (host) return host;
    host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;white-space:nowrap";
    document.body.appendChild(host);
    return host;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rd(v) { return Math.round(v * 100) / 100; }

  /* 找出一段文字的基線：塞一個 0×0 的 inline-block 進去，它的底邊就是基線 */
  function baseline(el) {
    var p = document.createElement("span");
    p.style.cssText = "display:inline-block;width:0;height:0;overflow:hidden";
    el.appendChild(p);
    var b = p.getBoundingClientRect().bottom;
    el.removeChild(p);
    return b;
  }

  /* 把 KaTeX 排好的 DOM 走一遍，收成 SVG 要用的零件 */
  function collect(node, base, out, used) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType !== 1) continue;
      var cls = " " + (n.getAttribute("class") || "") + " ";
      if (/\bkatex-mathml\b/.test(cls)) continue;              /* 無障礙用的 MathML，不要畫 */
      var r = n.getBoundingClientRect();

      if (n.nodeName.toLowerCase() === "svg") {                /* 根號那種 KaTeX 自己畫的線 */
        var inner = n.innerHTML, vb = n.getAttribute("viewBox") || "";
        out.push('<svg x="' + rd(r.left - base.left) + '" y="' + rd(r.top - base.top) + '" width="' + rd(r.width) + '" height="' + rd(r.height) + '"' +
          (vb ? ' viewBox="' + vb + '"' : "") + ' preserveAspectRatio="none">' + inner + "</svg>");
        continue;
      }

      var cs = getComputedStyle(n);
      /* 分數線、根號橫槓、上下劃線：KaTeX 用 border 畫的 */
      var bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw > 0 && r.width > 0) {
        out.push('<rect x="' + rd(r.left - base.left) + '" y="' + rd(r.top - base.top) + '" width="' + rd(r.width) + '" height="' + rd(Math.max(bw, 0.6)) + '" fill="currentColor" stroke="none"/>');
      }
      /* 有背景色的小方塊（例如 \colorbox、刪節線） */
      var bg = cs.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && r.width > 0 && r.height > 0 && !n.children.length) {
        out.push('<rect x="' + rd(r.left - base.left) + '" y="' + rd(r.top - base.top) + '" width="' + rd(r.width) + '" height="' + rd(r.height) + '" fill="' + bg + '" stroke="none"/>');
      }

      var hasEl = false;
      for (var k = 0; k < n.childNodes.length; k++) if (n.childNodes[k].nodeType === 1) { hasEl = true; break; }
      var txt = hasEl ? "" : (n.textContent || "");
      if (txt && txt.trim()) {
        var fam = cs.fontFamily.replace(/"/g, "'"), fs = parseFloat(cs.fontSize) || 12;
        var y = baseline(n) - base.top;
        (fam.match(/KaTeX_[A-Za-z]+/g) || []).forEach(function (f) { used[f + "|" + cs.fontStyle + "|" + cs.fontWeight] = 1; });
        out.push('<text x="' + rd(r.left - base.left) + '" y="' + rd(y) + '" font-family="' + esc(fam) + '" font-size="' + rd(fs) + '"' +
          (cs.fontStyle !== "normal" ? ' font-style="' + cs.fontStyle + '"' : "") +
          (cs.fontWeight && cs.fontWeight !== "400" && cs.fontWeight !== "normal" ? ' font-weight="' + cs.fontWeight + '"' : "") +
          ' fill="currentColor">' + esc(txt) + "</text>");
      } else if (hasEl) collect(n, base, out, used);
    }
  }

  /* tex → { svg, w, h, fonts }；排不出來就回傳 err */
  DM.toSvg = function (tex, fs, display) {
    if (!window.katex) return { err: "KaTeX 還沒載入" };
    var box = stage();
    box.innerHTML = "";
    box.style.fontSize = (fs || 20) + "px";
    var d = document.createElement("div");
    d.style.cssText = "display:inline-block";
    box.appendChild(d);
    try { katex.render(String(tex || ""), d, { displayMode: !!display, throwOnError: true, output: "html" }); }
    catch (e) { return { err: (e && e.message ? String(e.message) : "語法有問題").replace(/^KaTeX parse error:\s*/, "") }; }
    var kat = d.querySelector(".katex-html") || d.querySelector(".katex") || d;
    var base = kat.getBoundingClientRect();
    if (!base.width || !base.height) return { err: "這段式子排不出東西" };
    var out = [], used = {};
    collect(kat, base, out, used);
    box.innerHTML = "";
    return { svg: out.join(""), w: rd(base.width), h: rd(base.height), fonts: Object.keys(used) };
  };

  /* ---- 字型嵌進 SVG ---- */
  /* KaTeX 的字型檔名規則：KaTeX_Main-Regular / -Bold / -Italic / -BoldItalic */
  function fileOf(key) {
    var p = key.split("|"), fam = p[0], st = p[1], w = p[2];
    var bold = w === "700" || w === "bold" || +w >= 600, ital = st === "italic" || st === "oblique";
    var suf = bold && ital ? "BoldItalic" : bold ? "Bold" : ital ? "Italic" : "Regular";
    /* 有些家族只有一種字重 */
    if (/Math/.test(fam)) suf = bold ? "BoldItalic" : "Italic";
    if (/AMS|Caligraphic|Fraktur|SansSerif|Script|Typewriter|Size\d/.test(fam) && suf === "BoldItalic") suf = "Bold";
    return fam + "-" + suf;
  }
  var cache = {};
  function grab(name) {
    if (cache[name]) return cache[name];
    cache[name] = fetch(root + name + ".woff2").then(function (r) {
      if (!r.ok) throw new Error("404");
      return r.arrayBuffer();
    }).then(function (buf) {
      var b = new Uint8Array(buf), s = "", CH = 8192;
      for (var i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
      return btoa(s);
    }).catch(function () { return null; });
    return cache[name];
  }
  /* 回傳 <style> 字串（嵌好的 @font-face），失敗就回空字串 */
  DM.fontCss = function (keys) {
    var names = {}, list = [];
    (keys || []).forEach(function (k) { var f = fileOf(k); if (!names[f]) { names[f] = k; list.push(f); } });
    if (!list.length) return Promise.resolve("");
    return Promise.all(list.map(grab)).then(function (datas) {
      var css = "";
      datas.forEach(function (b64, i) {
        if (!b64) return;
        var f = list[i], p = f.split("-"), fam = p[0], suf = p[1];
        var weight = /Bold/.test(suf) ? "bold" : "normal", style = /Italic/.test(suf) ? "italic" : "normal";
        css += "@font-face{font-family:'" + fam + "';font-style:" + style + ";font-weight:" + weight +
          ";src:url(data:font/woff2;base64," + b64 + ") format('woff2');}";
      });
      return css ? "<style>" + css + "</style>" : "";
    });
  };
  /* 這些字型檔總共多大（給介面顯示） */
  DM.fontSize = function (keys) {
    var names = {}; (keys || []).forEach(function (k) { names[fileOf(k)] = 1; });
    return Object.keys(names).length;
  };
})();
