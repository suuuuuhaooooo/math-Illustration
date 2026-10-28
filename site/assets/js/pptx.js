/* 匯出 PPT（上課檢討用）：一題一張，下一張是同一題＋答案與詳解。
   不靠外部套件：投影片內容先用網頁排好（數學式、附圖、題組都和卷面一樣），再畫成圖片放進 .pptx。
   投影片是圖片，所以題目文字不能直接複製出來（和浮水印一樣，降低題目外流）；每張右下角印卷號與出卷人。
   用法：NB.pptx.make({ qs, secs, merge, name, tx, qimg, pid, who, onStep }) → Promise<Blob>；NB.pptx.save(blob, 檔名) */
(function () {
  "use strict";
  var W = 1280, H = 720, SCALE = 2, EMU_W = 12192000, EMU_H = 6858000;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function L(i) { return String.fromCharCode(65 + i); }

  /* ---------- 1. 最小的 zip（不壓縮，PNG 本來就壓過了） ---------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  var enc = new TextEncoder();
  function zip(files) { /* files：[{name, data: Uint8Array|string}] */
    var parts = [], central = [], off = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
      parts.push(new Uint8Array(lh.buffer), name, data); central.push(new Uint8Array(ch.buffer), name);
      off += 30 + name.length + data.length;
    });
    var csize = central.reduce(function (a, x) { return a + x.length; }, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  }

  /* ---------- 2. PPTX 的各個 XML（16:9，空白版面，每張一張全版圖片） ---------- */
  var NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  var X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var GRP = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  function rels(list) { return X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + list.map(function (r, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/' + r[0] + '" Target="' + r[1] + '"/>'; }).join("") + "</Relationships>"; }
  var RT = { doc: "officeDocument/2006/relationships/officeDocument", core: "package/2006/relationships/metadata/core-properties", app: "officeDocument/2006/relationships/extended-properties", master: "officeDocument/2006/relationships/slideMaster", layout: "officeDocument/2006/relationships/slideLayout", theme: "officeDocument/2006/relationships/theme", slide: "officeDocument/2006/relationships/slide", image: "officeDocument/2006/relationships/image" };
  var CT = "application/vnd.openxmlformats-officedocument.presentationml.";
  function theme() {
    var c = function (n, v) { return "<a:" + n + '><a:srgbClr val="' + v + '"/></a:' + n + ">"; };
    var fill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>', ln = '<a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>';
    return X + '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Paper"><a:themeElements><a:clrScheme name="Paper">' +
      '<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' + c("dk2", "333333") + c("lt2", "F7F3EA") + c("accent1", "C0392B") + c("accent2", "2E86AB") + c("accent3", "3C9D5D") + c("accent4", "D9A93C") + c("accent5", "8E6BD6") + c("accent6", "B87333") + c("hlink", "2E86AB") + c("folHlink", "8E6BD6") +
      '</a:clrScheme><a:fontScheme name="Paper"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface="Microsoft JhengHei"/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface="Microsoft JhengHei"/><a:cs typeface=""/></a:minorFont></a:fontScheme>' +
      '<a:fmtScheme name="Paper"><a:fillStyleLst>' + fill + fill + fill + "</a:fillStyleLst><a:lnStyleLst>" + ln + ln + ln + "</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>" + fill + fill + fill + "</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>";
  }
  function pptx(pngs, title) {
    var n = pngs.length, files = [], now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    var ct = X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/ppt/presentation.xml" ContentType="' + CT + 'presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="' + CT + 'slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="' + CT + 'slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>';
    for (var i = 1; i <= n; i++) ct += '<Override PartName="/ppt/slides/slide' + i + '.xml" ContentType="' + CT + 'slide+xml"/>';
    files.push({ name: "[Content_Types].xml", data: ct + "</Types>" });
    files.push({ name: "_rels/.rels", data: rels([[RT.doc, "ppt/presentation.xml"], [RT.core, "docProps/core.xml"], [RT.app, "docProps/app.xml"]]) });
    files.push({ name: "docProps/core.xml", data: X + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + esc(title) + '</dc:title><dc:creator>蘇昊數理</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + "</dcterms:modified></cp:coreProperties>" });
    files.push({ name: "docProps/app.xml", data: X + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>蘇昊數理</Application><Slides>' + n + "</Slides></Properties>" });
    var pres = X + "<p:presentation " + NS + '><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>';
    for (var j = 0; j < n; j++) pres += '<p:sldId id="' + (256 + j) + '" r:id="rId' + (j + 3) + '"/>';
    files.push({ name: "ppt/presentation.xml", data: pres + '</p:sldIdLst><p:sldSz cx="' + EMU_W + '" cy="' + EMU_H + '"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>' });
    var pr = [[RT.master, "slideMasters/slideMaster1.xml"], [RT.theme, "theme/theme1.xml"]]; for (var k = 1; k <= n; k++) pr.push([RT.slide, "slides/slide" + k + ".xml"]);
    files.push({ name: "ppt/_rels/presentation.xml.rels", data: rels(pr) });
    files.push({ name: "ppt/theme/theme1.xml", data: theme() });
    files.push({ name: "ppt/slideMasters/slideMaster1.xml", data: X + "<p:sldMaster " + NS + '><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>' + GRP + '</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>' });
    files.push({ name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: rels([[RT.layout, "../slideLayouts/slideLayout1.xml"], [RT.theme, "../theme/theme1.xml"]]) });
    files.push({ name: "ppt/slideLayouts/slideLayout1.xml", data: X + "<p:sldLayout " + NS + ' type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>' + GRP + "</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>" });
    files.push({ name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: rels([[RT.master, "../slideMasters/slideMaster1.xml"]]) });
    pngs.forEach(function (p, i) {
      var no = i + 1;
      files.push({ name: "ppt/slides/slide" + no + ".xml", data: X + "<p:sld " + NS + "><p:cSld><p:spTree>" + GRP + '<p:pic><p:nvPicPr><p:cNvPr id="2" name="Slide ' + no + '" descr="' + esc(p.alt) + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + EMU_W + '" cy="' + EMU_H + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>' });
      files.push({ name: "ppt/slides/_rels/slide" + no + ".xml.rels", data: rels([[RT.layout, "../slideLayouts/slideLayout1.xml"], [RT.image, "../media/image" + no + ".png"]]) });
      files.push({ name: "ppt/media/image" + no + ".png", data: p.data });
    });
    return zip(files);
  }

  /* ---------- 3. 投影片的畫面：先用 HTML 排，再畫成圖 ---------- */
  var CSS = ".ps{width:" + W + "px;height:" + H + "px;box-sizing:border-box;background:#fffdf7;color:#1d1d1f;font-family:'GenSen Rounded PPT','Noto Sans TC','Microsoft JhengHei','PingFang TC',sans-serif;position:relative;overflow:hidden;padding:26px 54px 40px}" +
    ".ps .bar{display:flex;align-items:center;gap:14px;border-bottom:3px solid #c0392b;padding-bottom:10px;font-size:22px;color:#555}.ps .no{background:#c0392b;color:#fff;border-radius:999px;padding:4px 18px;font-size:26px;font-weight:700}.ps .kind{margin-left:auto;font-size:22px;padding:3px 14px;border:2px solid currentColor;border-radius:8px}.ps.ans .kind{color:#2e7d4f}" +
    ".ps .body{position:absolute;left:54px;right:54px;top:92px;bottom:46px;overflow:hidden}.ps .fit{line-height:1.6}" +
    ".ps .stem{margin:0 0 .5em}.ps .sub{display:grid;grid-template-columns:2.4em 1fr;margin:.35em 0}.ps .sn{color:#c0392b;font-weight:700}" +
    ".ps .opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.25em 1.6em;margin:.45em 0 0}.ps .opts.one{grid-template-columns:1fr}.ps .opt{padding:.12em .4em;border-radius:8px}.ps .opt.ok{background:#dff3e6;outline:3px solid #3c9d5d;font-weight:700}" +
    ".ps .lab{color:#c0392b;font-weight:700;margin-right:.3em}.ps .ans{margin-top:.55em;padding:.35em .7em;border-left:8px solid #3c9d5d;background:#f0f8f2;border-radius:6px}.ps .ans b{color:#2e7d4f}.ps .ans .h{display:block;font-size:.82em;color:#333;margin-top:.15em}" +
    ".ps img{max-width:100%;max-height:300px;vertical-align:middle;display:block;margin:.3em 0}.ps .ans img{max-height:220px}.ps table{border-collapse:collapse;font-size:.9em;margin:.3em 0}.ps td,.ps th{border:2px solid #333;padding:.15em .6em}" +
    ".ps .foot{position:absolute;right:24px;bottom:12px;font-size:15px;color:rgba(0,0,0,.38)}.ps .tf{display:inline-block;margin-right:.3em}" +
    ".ps.cover .body{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}.ps.cover h1{font-size:60px;margin:0 0 20px}.ps.cover p{font-size:28px;color:#555;margin:6px 0}";
  var fontCss = null;
  function dataUrl(blob) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = no; r.readAsDataURL(blob); }); }
  function getData(url) { return fetch(url, { mode: "cors", credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(dataUrl); }
  /* 字型與 KaTeX 樣式（畫成圖時不能讀外部檔，全部轉成內嵌） */
  function fonts() {
    if (fontCss) return Promise.resolve(fontCss);
    var root = (window.NB && NB.root) || "";
    var f = function (p) { return getData(root + p).catch(function () { return ""; }); };
    return Promise.all([f("assets/fonts/gensen-round-tw-r.woff"), f("assets/fonts/gensen-round-tw-b.woff"), f("assets/vendor/katex/KaTeX_Main-Regular.woff2"), fetch(root + "assets/vendor/katex/katex.min.css").then(function (r) { return r.ok ? r.text() : ""; }).catch(function () { return ""; })]).then(function (a) {
      var css = "";
      if (a[0]) css += "@font-face{font-family:'GenSen Rounded PPT';src:url(" + a[0] + ") format('woff');font-weight:400}";
      if (a[1]) css += "@font-face{font-family:'GenSen Rounded PPT';src:url(" + a[1] + ") format('woff');font-weight:700}";
      if (a[2]) css += "@font-face{font-family:KaTeX_Main;src:url(" + a[2] + ") format('woff2')}";
      css += String(a[3] || "").replace(/@font-face\{[^}]*\}/g, "");
      fontCss = css; return css;
    });
  }
  /* 附圖改成內嵌；讀不到就換成一行說明 */
  function inlineImgs(node) {
    return Promise.all(Array.prototype.map.call(node.querySelectorAll("img"), function (im) {
      if (/^data:/.test(im.src)) return null;
      return getData(im.src).then(function (d) { im.setAttribute("src", d); }, function () { var s = document.createElement("span"); s.textContent = "（附圖無法放進投影片，請看紙本）"; s.style.color = "#c0392b"; im.replaceWith(s); });
    }));
  }
  /* 內容太多就縮小字，直到放得下（最小 16px） */
  function fit(slide) {
    var body = slide.querySelector(".body"), box = slide.querySelector(".fit"); if (!box) return;
    for (var fs = slide.classList.contains("ans") ? 34 : 38; fs >= 16; fs -= 2) { box.style.fontSize = fs + "px"; if (box.scrollHeight <= body.clientHeight && box.scrollWidth <= body.clientWidth + 1) return; }
  }
  function toPng(slide, css) {
    var xml = new XMLSerializer().serializeToString(slide);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject x="0" y="0" width="' + W + '" height="' + H + '"><div xmlns="http://www.w3.org/1999/xhtml"><style><![CDATA[' + css.replace(/\]\]>/g, "] ]>") + "]]></style>" + xml + "</div></foreignObject></svg>";
    return new Promise(function (ok, no) {
      var im = new Image();
      im.onload = function () {
        var cv = document.createElement("canvas"); cv.width = W * SCALE; cv.height = H * SCALE; var g = cv.getContext("2d"); g.scale(SCALE, SCALE); g.fillStyle = "#fffdf7"; g.fillRect(0, 0, W, H);
        try { g.drawImage(im, 0, 0, W, H); cv.toBlob(function (b) { if (!b) return no(new Error("toBlob")); b.arrayBuffer().then(function (ab) { ok(new Uint8Array(ab)); }, no); }, "image/png"); } catch (e) { no(e); }
      };
      im.onerror = function () { no(new Error("svg")); };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }

  /* ---------- 4. 組出每一張 ---------- */
  function make(o) {
    var tx = o.tx || function (s) { return esc(s); }, qimg = o.qimg || function () { return ""; }, CN = "一二三四五六七八九十";
    var TYN = { choice: "選擇題", tf: "是非題", num: "填充題", text: "填充題", multi: "勾選題", match: "連連看", group: "題組", any: "綜合題" };
    var bs = NB.score.blocks(o.qs, true), foot = esc([o.pid ? "卷號 " + o.pid : "", o.who || "", "© 蘇昊數理・僅供課堂教學"].filter(Boolean).join("｜"));
    function optsHtml(q, show) {
      if (q.ty === "match") return "<table><tr><th>題目</th><th>答案</th></tr>" + q.L.map(function (l, i) { return "<tr><td>（" + (show ? esc(L(q.R.indexOf(q.pr[i][1]))) : "　") + "）" + (i + 1) + "．" + tx(esc(l)) + "</td><td>(" + L(i) + ") " + tx(esc(q.R[i])) + "</td></tr>"; }).join("") + "</table>";
      if (!q.o || q.ty === "tf") return "";
      var ma = q.ty === "multi" ? String(q.a).split("|") : [String(q.a)], long = q.o.some(function (t) { return String(t).length > 14; });
      return '<div class="opts' + (long ? " one" : "") + '">' + q.o.map(function (t, k) { var ok = show && ma.indexOf(String(t)) >= 0; return '<div class="opt' + (ok ? " ok" : "") + '">' + (q.ty === "multi" ? "□ " : "") + '<span class="lab">(' + L(k) + ")</span>" + tx(esc(t)) + "</div>"; }).join("") + "</div>";
    }
    function ansHtml(q) {
      var a = q.ty === "tf" ? (q.a === "對" ? "○ 對" : "✕ 錯") : q.ty === "match" ? esc(q.al || "") : q.ty === "multi" ? esc(String(q.al || "").split("、").map(function (c) { return "(" + c + ")"; }).join("")) + " " + String(q.a).split("|").map(function (t) { return tx(esc(t)); }).join("、") : (q.al ? "(" + esc(q.al) + ") " : "") + tx(esc(String(q.a)));
      return '<div class="ans"><b>答案：</b>' + a + (q.h ? '<span class="h">詳解：' + tx(esc(q.h)) + "</span>" : "") + qimg(q.himg) + "</div>";
    }
    function one(q, show) { return (q.ty === "tf" ? '<span class="tf">（' + (show ? (q.a === "對" ? "○" : "✕") : "　") + "）</span>" : "") + tx(q.q) + qimg(q.img) + optsHtml(q, show) + (show ? ansHtml(q) : ""); }
    function content(b, show) {
      if (b.gid && b.qs[0].gs) return '<div class="stem">' + tx(b.qs[0].gs) + qimg(b.qs[0].gi) + "</div>" + b.qs.map(function (q, k) { return '<div class="sub"><span class="sn">(' + (k + 1) + ")</span><div>" + one(q, show) + "</div></div>"; }).join("");
      return one(b.qs[0], show);
    }
    var list = [], cnt = {};
    list.push({ cover: true, alt: o.name || "練習卷" });
    bs.forEach(function (b) {
      var si = o.secs ? b.s : 0; cnt[si] = (cnt[si] || 0) + 1; var sec = o.secs && o.secs[si];
      var lab = (sec ? CN[si] + "、" + (sec.title || (sec.ty === "any" && sec.kd ? sec.kd : TYN[sec.ty] || "題目")) + "　" : "") + (b.gid && b.qs[0].gs && !(sec && sec.ty === "group" && !sec.title) ? "題組" : "");
      [false, true].forEach(function (show) { list.push({ b: b, show: show, no: cnt[si], lab: lab, alt: (sec ? CN[si] + "、" : "") + "第 " + cnt[si] + " 題" + (show ? "（答案）" : "") }); });
    });
    var stage = document.createElement("div"); stage.className = "nozy"; stage.setAttribute("data-nozy", "1"); stage.setAttribute("aria-hidden", "true");
    stage.style.cssText = "position:fixed;left:-20000px;top:0;width:" + W + "px;height:" + H + "px;overflow:hidden;pointer-events:none";
    var st = document.createElement("style"); st.textContent = CSS; stage.appendChild(st); document.body.appendChild(stage);
    var pngs = [];
    return fonts().then(function (fcss) {
      var css = fcss + CSS, i = 0;
      function next() {
        if (i >= list.length) return null;
        var x = list[i++], el = document.createElement("div");
        if (x.cover) { el.className = "ps cover"; el.innerHTML = '<div class="body"><h1>' + esc(o.name || "練習卷") + "</h1><p>上課檢討用・共 " + bs.length + " 題</p><p>每一題後面接一張答案與詳解</p></div>" + '<div class="foot">' + foot + "</div>"; }
        else { el.className = "ps" + (x.show ? " ans" : ""); el.innerHTML = '<div class="bar"><span class="no">第 ' + x.no + " 題</span><span>" + esc(x.lab) + '</span><span class="kind">' + (x.show ? "答案與詳解" : "題目") + '</span></div><div class="body"><div class="fit">' + content(x.b, x.show) + '</div></div><div class="foot">' + foot + "</div>"; }
        stage.appendChild(el);
        return inlineImgs(el).then(function () { return document.fonts && document.fonts.ready; }).then(function () { fit(el); return toPng(el, css); }).then(function (png) { pngs.push({ data: png, alt: x.alt }); stage.removeChild(el); if (o.onStep) o.onStep(i, list.length); return next(); });
      }
      return next();
    }).then(function () { stage.remove(); return pptx(pngs, o.name || "練習卷"); }, function (e) { stage.remove(); throw e; });
  }
  function save(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  window.NB = window.NB || {}; NB.pptx = { make: make, save: save, _zip: zip, _pptx: pptx };
})();
