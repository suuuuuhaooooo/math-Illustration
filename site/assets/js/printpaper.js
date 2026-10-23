/* 列印練習卷的排版：卷頭、紙張、欄數、選項排列、輸出卷別、雙向細目表、不同題序、CSV。
   只負責「怎麼印」。題目由 /api/print 出好，這裡拿到題目後想換排版不用重新出題。 */
(function () {
  "use strict";
  var KEY = "nb-print-v1";
  var PAPER = { A3: [297, 420], A4: [210, 297], B4: [257, 364], B5: [182, 257] };
  var KINDS = [["q", "題目卷"], ["blank", "空白答案卷"], ["qa", "題目與詳解"], ["ak", "簡答與詳解"], ["short", "簡答卷"], ["qpk", "題目卷＋詳解卷"]];
  var LV = { 1: "易", 2: "中", 3: "難" }, ZH = "甲乙丙丁", DIFFS = ["易", "中", "難"], COGS = ["知識", "理解", "應用", "分析", "評鑑", "創造"];
  var MXR = [["unit", "單元"], ["content", "學習內容"], ["perf", "學習表現"], ["know", "知識類型"]], MXC = [["diff", "難易度"], ["cog", "認知層次"]];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function L(i) { return String.fromCharCode(65 + i); }
  function defaults(u) {
    var m = /^([1-6])(\d{1,2})$/.exec(String(u.cls || "")), t = u.role === "teacher";
    return { school: "", showSchool: false, exam: "數學練習卷", showExam: true, subject: "數學", showSubject: true, grade: m ? m[1] : "", cls: m ? String(+m[2]) : "", showClass: true,
      showScore: t, prefill: !t, paper: "A4", layout: "s1", optMode: "col", kinds: { q: true, ak: true }, showFocus: false, showId: false, showPerf: false, showCont: false, showLv: false, showCog: false, showKnow: false, metaAt: "q", matrix: false, mxRow: "unit", mxCol: "diff", variants: 1,
      wm: !t, wmName: true, wmCls: true, wmEmail: true, wmIp: true, wmDev: true, wmTime: true, wmText: "", wmDen: "2", wmDens: "1" };
  }
  function load(u) { var d = defaults(u), s = null; try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {} if (s) { Object.keys(d).forEach(function (k) { if (s[k] !== undefined && k !== "grade" && k !== "cls") d[k] = s[k]; }); } return d; }
  function save(P) { try { var c = Object.assign({}, P); delete c.grade; delete c.cls; delete c.fd; delete c.fg; delete c.fk; delete c.fp; localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }


  /* ---- 設定面板用的示意圖（SVG，線條用 currentColor，跟著主題變色） ---- */
  var SV = function (b) { return '<svg viewBox="0 0 56 56" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + "</svg>"; };
  var pg = function (x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2"/>'; };
  var ln = function (x1, y, x2, o) { return '<path d="M' + x1 + " " + y + "H" + x2 + '"' + (o || "") + "/>"; };
  var tx = function (x, y, t) { return '<text x="' + x + '" y="' + y + '" font-size="8" font-family="sans-serif" fill="currentColor" stroke="none">' + t + "</text>"; };
  var TH = ' stroke-width="1" opacity=".55"';
  function lines(x1, x2, y0, n, st) { var o = ""; for (var i = 0; i < n; i++) o += ln(x1, y0 + i * (st || 6), i % 3 === 2 ? x2 - 5 : x2, TH); return o; }
  var PG = pg(10, 5, 36, 46);
  function ico(kind, v) {
    if (kind === "paper") { var d = PAPER[v], w = d[0] * 0.105, h = d[1] * 0.105, x = (56 - w) / 2, y = (56 - h) / 2; return SV(pg(x.toFixed(1), y.toFixed(1), w.toFixed(1), h.toFixed(1)) + lines((x + 4).toFixed(1), (x + w - 4).toFixed(1), (y + 7).toFixed(1), Math.floor((h - 12) / 6), 6)); }
    if (kind === "layout") {
      if (v === "s1") return SV(PG + lines(15, 41, 13, 6, 6));
      if (v === "d2") return SV(PG + lines(15, 26, 13, 6, 6) + lines(30, 41, 13, 6, 6) + '<path d="M28 11V45" stroke-dasharray="2 2" stroke-width="1"/>');
      return SV(pg(4, 11, 48, 34) + lines(9, 25, 19, 4, 6) + lines(31, 47, 19, 4, 6) + '<path d="M28 15V41" stroke-dasharray="2 2" stroke-width="1"/>');
    }
    if (kind === "opt") {
      if (v === "col") return SV([0, 1, 2, 3].map(function (i) { return tx(8, 18 + i * 11, "ABCD".charAt(i) + ".") + ln(22, 15.5 + i * 11, 47, TH); }).join(""));
      return SV(ln(8, 14, 48, TH) + ln(8, 20, 36, TH) + ["A", "B", "C", "D"].map(function (c, i) { return '<text x="' + (5 + i * 12.5) + '" y="37" font-size="10" font-family="sans-serif" fill="currentColor" stroke="none">' + c + ".</text>"; }).join("") + ln(8, 47, 48, ' stroke-dasharray="2 2" stroke-width="1" opacity=".4"'));
    }
    var q = function (y) { return ln(15, y, 41, TH) + ln(15, y + 5, 33, TH); };
    if (v === "q") return SV(PG + ln(15, 12, 31, "") + q(20) + q(31) + q(42));
    if (v === "blank") { var b = ""; for (var r = 0; r < 5; r++) for (var c = 0; c < 2; c++) b += '<rect x="' + (15 + c * 14) + '" y="' + (11 + r * 7.5) + '" width="11" height="5.5" rx="1" stroke-width="1"/>'; return SV(PG + b); }
    if (v === "qa") return SV(PG + q(12) + q(22) + ln(15, 33, 41, ' stroke-dasharray="2 2" stroke-width="1"') + tx(14, 42, "A") + ln(22, 40.5, 41, "") + ln(22, 46, 36, TH));
    if (v === "ak") { var a = ""; for (var k = 0; k < 4; k++) a += tx(13, 16 + k * 9.5, k + 1 + ".") + ln(21, 14.5 + k * 9.5, 31, "") + ln(34, 14.5 + k * 9.5, 42, TH); return SV(PG + a); }
    if (v === "short") { var m = ""; for (var j = 0; j < 4; j++) m += tx(13, 16 + j * 9.5, j + 1 + ".") + ln(22, 14.5 + j * 9.5, 40, ""); return SV(PG + m); }
    return SV(pg(16, 4, 34, 42) + pg(6, 10, 34, 42) + ln(11, 20, 35, TH) + ln(11, 27, 35, TH) + ln(11, 34, 29, TH) + ln(11, 41, 35, TH));
  }
  function card(type, name, v, label, on, id, icon) { return '<label class="pcard"><input type="' + type + '" ' + (name ? 'name="' + name + '" value="' + v + '"' : "") + (id ? ' id="' + id + '"' : "") + (on ? " checked" : "") + '><span class="pci">' + icon + '</span><span class="pcl">' + label + "</span></label>"; }

  /* ---- 設定面板 ---- */
  function panel(u, onchange) {
    var P = load(u), el = document.createElement("div"); el.className = "ppanel noprint";
    function chk(id, label, on) { return '<label class="ppc"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + "> " + label + "</label>"; }
    function rad(name, v, label, cur) { return '<label class="ppc"><input type="radio" name="' + name + '" value="' + v + '"' + (cur === v ? " checked" : "") + "> " + label + "</label>"; }
    el.innerHTML =
      '<details open><summary>試卷卷頭設定</summary><div class="ppg">' +
      '<div class="ppr"><label>學校名稱 <input id="pp-school" maxlength="40" value="' + esc(P.school) + '"></label>' + chk("pp-showSchool", "顯示學校名稱", P.showSchool) + "</div>" +
      '<div class="ppr"><label>考試名稱 <input id="pp-exam" maxlength="40" value="' + esc(P.exam) + '"></label>' + chk("pp-showExam", "顯示考試名稱（後面會接出題範圍）", P.showExam) + "</div>" +
      '<div class="ppr"><label>科目 <input id="pp-subject" maxlength="12" value="' + esc(P.subject) + '" style="width:6em"></label>' + chk("pp-showSubject", "顯示科目", P.showSubject) + "</div>" +
      '<div class="ppr"><label>班級 <input id="pp-grade" maxlength="1" value="' + esc(P.grade) + '" style="width:2.5em"> 年 <input id="pp-cls" maxlength="2" value="' + esc(P.cls) + '" style="width:2.5em"> 班</label>' + chk("pp-showClass", "顯示班級", P.showClass) + "</div>" +
      '<div class="ppr">' + chk("pp-showScore", "顯示級距與得分框（100／99~90／…／未滿60、分數、家長簽章）", P.showScore) + chk("pp-prefill", "座號、姓名先填好（不勾＝留空白線）", P.prefill) + "</div></div></details>" +
      '<details open><summary>紙本卷列印設定</summary><div class="ppg">' +
      '<div class="ppr pcr"><b>紙張</b><div class="pcards p4">' + ["A3", "A4", "B4", "B5"].map(function (p) { return card("radio", "pp-paper", p, p, P.paper === p, "", ico("paper", p)); }).join("") + "</div></div>" +
      '<div class="ppr pcr"><b>排版</b><div class="pcards">' + [["s1", "橫書單欄"], ["d2", "橫書雙欄（直版）"], ["d2l", "橫書雙欄（橫版）"]].map(function (x) { return card("radio", "pp-layout", x[0], x[1], P.layout === x[0], "", ico("layout", x[0])); }).join("") + "</div></div>" +
      '<div class="ppr pcr"><b>選項排列</b><div class="pcards p2">' + [["col", "換行排列"], ["row", "接續排列"]].map(function (x) { return card("radio", "pp-opt", x[0], x[1], P.optMode === x[0], "", ico("opt", x[0])); }).join("") + "</div></div></div></details>" +
      '<details open><summary>輸出卷別</summary><div class="ppg"><div class="ppr">' + chk("pp-all", "全選", false) + '</div><div class="pcards pk">' + KINDS.map(function (k) { return card("checkbox", "", "", k[1], !!P.kinds[k[0]], "pp-k-" + k[0], ico("kind", k[0])); }).join("") + "</div></div></details>" +
      '<details open><summary>浮水印（防止試卷外流，可追查是誰印的）</summary><div class="ppg">' +
      (u.role === "teacher" ? "" : '<div class="ppr meta">學生列印一律會加上浮水印（姓名、班級座號、Email、IP、裝置、卷號、時間），也會留下列印紀錄，不能關閉。</div>') +
      '<div class="ppr">' + chk("pp-wm", "加上浮水印", P.wm) + chk("pp-wmName", "姓名", P.wmName) + chk("pp-wmCls", "班級座號", P.wmCls) + chk("pp-wmEmail", "Email", P.wmEmail) + chk("pp-wmIp", "IP 位址", P.wmIp) + chk("pp-wmDev", "裝置", P.wmDev) + chk("pp-wmTime", "列印時間", P.wmTime) + "</div>" +
      '<div class="ppr"><label>自訂文字 <input id="pp-wmText" maxlength="30" value="' + esc(P.wmText) + '" placeholder="例如：校內使用"></label><label>疏密 <select id="pp-wmDens"><option value="1"' + (P.wmDens === "1" ? " selected" : "") + '>疏</option><option value="2"' + (P.wmDens === "2" ? " selected" : "") + '>中</option><option value="3"' + (P.wmDens === "3" ? " selected" : "") + '>密</option></select></label><label>濃度 <select id="pp-wmDen"><option value="1"' + (P.wmDen === "1" ? " selected" : "") + '>淡</option><option value="2"' + (P.wmDen === "2" ? " selected" : "") + '>中</option><option value="3"' + (P.wmDen === "3" ? " selected" : "") + ">深</option></select></label></div></div></details>" +
      '<details><summary>題目篩選（依題庫屬性表挑題）</summary><div class="ppg">' +
      '<div class="ppr meta">有勾選或填寫任何一項，就只會從「已有屬性」的固定題裡挑；改完要按上面的「出題」才會套用。全部不選＝不篩選（照原本方式出題）。</div>' +
      '<div class="ppr"><b>難易度</b> ' + DIFFS.map(function (d) { return '<label class="ppc"><input type="checkbox" name="pp-fd" value="' + d + '"> ' + d + "</label>"; }).join("") + "</div>" +
      '<div class="ppr"><b>認知層次</b> ' + COGS.map(function (d) { return '<label class="ppc"><input type="checkbox" name="pp-fg" value="' + d + '"> ' + d + "</label>"; }).join("") + "</div>" +
      '<div class="ppr"><label>知識類型包含 <input id="pp-fk" maxlength="40" placeholder="例如：面積、公因數（可用逗號放多個）" style="width:18em"></label></div>' +
      '<div class="ppr"><label>學習表現／學習內容 <input id="pp-fp" maxlength="60" placeholder="例如：n-III-3、S-5（前面符合就算，可放多個）" style="width:18em"></label></div></div></details>' +
      '<details><summary>題目資訊與延伸功能</summary><div class="ppg">' +
      '<div class="ppr"><b>每題顯示</b> ' + chk("pp-showFocus", "單元名稱", P.showFocus) + chk("pp-showId", "題目ID", P.showId) + chk("pp-showPerf", "學習表現", P.showPerf) + chk("pp-showCont", "學習內容", P.showCont) + chk("pp-showLv", "難易度", P.showLv) + chk("pp-showCog", "認知層次", P.showCog) + chk("pp-showKnow", "知識類型", P.showKnow) + "</div>" +
      '<div class="ppr"><b>印在哪裡</b> ' + rad("pp-metaAt", "q", "題目卷", P.metaAt) + rad("pp-metaAt", "a", "答案卷（簡答與詳解、簡答卷）", P.metaAt) + rad("pp-metaAt", "both", "兩個都印", P.metaAt) + "</div>" +
      '<div class="ppr">' + chk("pp-matrix", "附上雙向細目表", P.matrix) + ' <label>縱軸 <select id="pp-mxRow">' + MXR.map(function (r) { return '<option value="' + r[0] + '"' + (P.mxRow === r[0] ? " selected" : "") + ">" + r[1] + "</option>"; }).join("") + '</select></label> <label>橫軸 <select id="pp-mxCol">' + MXC.map(function (r) { return '<option value="' + r[0] + '"' + (P.mxCol === r[0] ? " selected" : "") + ">" + r[1] + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="ppr"><label>同題目不同題序 <select id="pp-variants">' + [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (P.variants === n ? " selected" : "") + ">" + (n === 1 ? "只印一份" : n + " 份（" + ZH.slice(0, n).split("").join("、") + "卷，題序與選項順序都不同）") + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="ppr"><button type="button" class="pen" id="pp-csv">匯出題目 CSV</button> <span class="meta">不含詳解以外的版面設定；可用 Excel 開啟</span></div></div></details>';
    function get() {
      var q = function (id) { return el.querySelector("#" + id); }, kinds = {}, checked = function (n) { return Array.prototype.map.call(el.querySelectorAll('input[name="' + n + '"]:checked'), function (x) { return x.value; }); };
      KINDS.forEach(function (k) { kinds[k[0]] = q("pp-k-" + k[0]).checked; });
      var r = function (n) { var x = el.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : ""; };
      return { school: q("pp-school").value.trim(), showSchool: q("pp-showSchool").checked, exam: q("pp-exam").value.trim(), showExam: q("pp-showExam").checked, subject: q("pp-subject").value.trim(), showSubject: q("pp-showSubject").checked,
        grade: q("pp-grade").value.trim(), cls: q("pp-cls").value.trim(), showClass: q("pp-showClass").checked, showScore: q("pp-showScore").checked, prefill: q("pp-prefill").checked,
        paper: r("pp-paper") || "A4", layout: r("pp-layout") || "s1", optMode: r("pp-opt") || "col", kinds: kinds, showFocus: q("pp-showFocus").checked, showId: q("pp-showId").checked, showPerf: q("pp-showPerf").checked, showCont: q("pp-showCont").checked, showLv: q("pp-showLv").checked, showCog: q("pp-showCog").checked, showKnow: q("pp-showKnow").checked, metaAt: r("pp-metaAt") || "q", matrix: q("pp-matrix").checked, mxRow: q("pp-mxRow").value, mxCol: q("pp-mxCol").value,
        fd: checked("pp-fd"), fg: checked("pp-fg"), fk: q("pp-fk").value.trim(), fp: q("pp-fp").value.trim(), variants: +q("pp-variants").value || 1,
        wm: q("pp-wm").checked, wmName: q("pp-wmName").checked, wmCls: q("pp-wmCls").checked, wmEmail: q("pp-wmEmail").checked, wmIp: q("pp-wmIp").checked, wmDev: q("pp-wmDev").checked, wmTime: q("pp-wmTime").checked, wmText: q("pp-wmText").value.trim(), wmDen: q("pp-wmDen").value, wmDens: q("pp-wmDens").value };
    }
    el.addEventListener("change", function (e) {
      if (e.target.id === "pp-all") { KINDS.forEach(function (k) { el.querySelector("#pp-k-" + k[0]).checked = e.target.checked; }); }
      else if (/^pp-k-/.test(e.target.id)) { el.querySelector("#pp-all").checked = KINDS.every(function (k) { return el.querySelector("#pp-k-" + k[0]).checked; }); }
      save(get()); onchange();
    });
    el.addEventListener("input", function (e) { if (e.target.type === "text" || e.target.tagName === "INPUT" && !e.target.type) { clearTimeout(el.__t); el.__t = setTimeout(function () { save(get()); onchange(); }, 250); } });
    el.querySelector("#pp-all").checked = KINDS.every(function (k) { return P.kinds[k[0]]; });
    return { el: el, get: get, csvBtn: el.querySelector("#pp-csv") };
  }

  /* ---- 紙張大小：換 @page ---- */
  function pageCss(P) { var s = PAPER[P.paper] || PAPER.A4, w = s[0], h = s[1]; if (P.layout === "d2l") { var t = w; w = h; h = t; } return { css: "@page{size:" + w + "mm " + h + "mm;margin:12mm 12mm 18mm}", w: w }; }
  function applyPage(P) { var st = document.getElementById("ppstyle"); if (!st) { st = document.createElement("style"); st.id = "ppstyle"; document.head.appendChild(st); } st.textContent = pageCss(P).css; }
  function clearPage() { var st = document.getElementById("ppstyle"); if (st) st.remove(); }

  /* ---- 不同題序：用固定種子洗牌，同一份設定每次結果一樣 ---- */
  function seeded(n) { var s = n * 2654435761 >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuf(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function variant1(qs, v) {
    var r = seeded(v + 1);
    var blocks = []; qs.forEach(function (q) { var l = blocks[blocks.length - 1]; if (q.gid && l && l[0].gid === q.gid) l.push(q); else blocks.push([q]); }); /* 題組整組一起換位置，組內維持原順序 */
    return shuf(blocks, r).reduce(function (a, b) { return a.concat(b); }, []).map(function (q) {
      if (q.ty === "match") { var R = shuf(q.R, r), ans = q.L.map(function (_, i) { return i + 1 + "-" + L(R.indexOf(q.pr[i][1])); }).join("、"); return Object.assign({}, q, { R: R, al: ans }); }
      if (!q.o) return q;
      var o = shuf(q.o, r);
      if (q.ty === "multi") { var ma = String(q.a).split("|"); return Object.assign({}, q, { o: o, al: o.map(function (t, i) { return ma.indexOf(t) >= 0 ? L(i) : ""; }).filter(Boolean).join("、") }); }
      var i = o.indexOf(String(q.a)); return Object.assign({}, q, { o: o, al: i >= 0 ? L(i) : q.al });
    });
  }
  /* 不同題序：有大題時，每個大題各自換序（題目不會跑到別的大題） */
  function variant(qs, v, secs) {
    if (!v) return qs;
    if (!secs) return variant1(qs, v);
    var out = []; secs.forEach(function (sc, si) { out = out.concat(variant1(qs.filter(function (q) { return q.s === si; }), v + si * 7)); }); return out;
  }

  /* 浮水印：整張卷斜著鋪滿重複的文字。是真正的文字，所以不管瀏覽器有沒有開「列印背景圖形」都印得出來 */
  function wmHtml(P, D) {
    var w = D.wm || {}, force = !!w.force, on = force || P.wm;
    if (!on) { /* 沒勾浮水印：每頁正中間只放「一條」淡淡的細線字，把所有資訊寫在同一行 */
      var u0 = D.u, all = [u0.name, u0.cls && u0.cls !== "all" ? u0.cls + " 班 " + u0.no + " 號" : "", w.email || "", w.ip ? "IP " + w.ip + (w.net ? "（" + w.net + "）" : "") : "", w.brief || "", w.ts ? stamp(w.ts) : "", w.pid ? "卷號 " + w.pid : ""].filter(Boolean).map(esc).join("　");
      if (!all) return null;
      var ln = '<div class="pwm-line">' + all + "</div>";
      return { scr: '<div class="pwm pwm-abs pwm-one" aria-hidden="true">' + ln + "</div>", prn: '<div class="pwm pwm-fix pwm-one" aria-hidden="true">' + ln + "</div>" };
    }
    var u = D.u, e = function (k, mine) { return force || P[k] ? mine : ""; }, A = [], B = [];
    A.push(e("wmName", u.name)); A.push(e("wmCls", u.cls && u.cls !== "all" ? u.cls + " 班 " + u.no + " 號" : "")); A.push(e("wmEmail", w.email || "")); if (w.pid) A.push("卷號 " + w.pid);
    B.push(e("wmIp", w.ip ? "IP " + w.ip + (w.net ? "（" + w.net + "）" : "") : "")); B.push(e("wmDev", w.brief || "")); B.push(e("wmTime", w.ts ? stamp(w.ts) : stamp(Date.now()))); if (P.wmText) B.push(P.wmText);
    var one = A.filter(Boolean).map(esc).join("　"), two = B.filter(Boolean).map(esc).join("　"); if (!one && !two) return null;
    var den = force ? "2" : P.wmDen, a = { 1: ".06", 2: ".10", 3: ".18" }[den] || ".10", ds = force ? "1" : P.wmDens, lh = { 1: "15em", 2: "9em", 3: "5em" }[ds] || "15em", mg = { 1: "5em", 2: "3em", 3: "1.5em" }[ds] || "5em", rep = { 1: 90, 2: 160, 3: 320 }[ds] || 90;
    var inner = '<div>' + Array.apply(null, Array(rep)).map(function (_, i) { var t = i % 2 ? two : one; return t ? '<span>' + t + "</span>" : ""; }).join("") + "</div>", sv = '--wa:' + a + ';--lh:' + lh + ';--mg:' + mg;
    var foot = '<div class="pfoot" aria-hidden="true">' + (w.pid ? "卷號 " + esc(w.pid) + "　" : "") + esc([u.name, u.cls && u.cls !== "all" ? u.cls + "班" + u.no + "號" : "", w.ts ? stamp(w.ts) : "", w.brief || ""].filter(Boolean).join("　")) + "</div>";
    return { scr: '<div class="pwm pwm-abs" aria-hidden="true" style="' + sv + '">' + inner + "</div>", prn: '<div class="pwm pwm-fix" aria-hidden="true" style="' + sv + '">' + inner + "</div>" + foot };
  }
  function stamp(t) { var d = new Date(t + 288e5).toISOString(); return d.slice(0, 10) + " " + d.slice(11, 16); }
  /* ---- 畫面 ---- */
  function build(P, qs, nm, D) { /* D：{u, today, title, tx, qimg} */
    var cols = P.layout === "s1" ? 1 : 2, kinds = [], out = [], pw = pageCss(P).w, WM = wmHtml(P, D);
    var K = P.kinds, want = { q: K.q || K.qpk, blank: K.blank, qa: K.qa, ak: K.ak || K.qpk, short: K.short };
    ["q", "blank", "qa", "ak", "short"].forEach(function (k) { if (want[k]) kinds.push(k); });
    if (!kinds.length && !P.matrix) return '<div class="fb no noprint">請至少勾選一種輸出卷別。</div>';
    function head(label, tag) {
      var h = '<div class="phead">';
      if (P.showSchool && P.school) h += '<div class="pschool">' + esc(P.school) + "</div>";
      var line = [];
      if (P.showExam) line.push('<b class="pexam">' + esc((P.exam || "練習卷") + (nm ? "（" + nm + "）" : "")) + (label ? "｜" + label : "") + (tag || "") + "</b>"); else if (label) line.push('<b class="pexam">' + label + (tag || "") + "</b>");
      if (P.showSubject && P.subject) line.push("<span>科目：" + esc(P.subject) + "</span>");
      if (P.showClass && (P.grade || P.cls)) line.push("<span>班級：" + esc(P.grade) + " 年 " + esc(P.cls) + " 班</span>");
      h += '<div class="ptitle">' + line.join("") + "</div>";
      var u = D.u, f = P.prefill;
      h += '<div class="pinfo"><span>座號：' + (f ? esc(u.no) : "＿＿＿") + "</span><span>姓名：" + (f ? "<b>" + esc(u.name) + "</b>" : "＿＿＿＿＿＿") + "</span><span>日期：" + (f ? D.today : "＿＿＿＿") + "</span>" + (P.showScore ? "" : "<span>分數：＿＿＿</span>") + (totalPts() ? "<span>滿分：" + totalPts() + " 分</span>" : "") + "</div>";
      if (P.showScore) h += '<table class="pscore"><tr><th>級距</th><td>100</td><td>99~90</td><td>89~80</td><td>79~70</td><td>69~60</td><td>未滿60</td><th>分數</th><th>家長簽章</th></tr><tr><th>得分</th><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>';
      return h + "</div>";
    }
    function meta(q, where) { /* where：q 題目卷、a 答案卷、qa 題目與詳解（題目和答案在同一張，選哪個都印一次） */
      var m = [], a = q.m || {}, at = P.metaAt || "q";
      if (!(at === "both" || where === "qa" || at === where)) return "";
      if (P.showFocus) m.push("單元：" + esc(D.title(q.unit)));
      if (P.showId && q.qid) m.push("題目ID：" + esc(q.qid));
      if (P.showPerf && a.p) m.push("學習表現：" + esc(a.p));
      if (P.showCont && a.c) m.push("學習內容：" + esc(a.c));
      if (P.showLv && (a.d || q.lv)) m.push("難易度：" + esc(a.d || LV[q.lv]));
      if (P.showCog && a.g) m.push("認知層次：" + esc(a.g));
      if (P.showKnow && a.k) m.push("知識類型：" + esc(a.k));
      return m.length ? '<div class="pmeta">' + m.join("　") + "</div>" : "";
    }
    var TYN = { choice: "選擇題", tf: "是非題", num: "填充題", text: "填充題", multi: "勾選題", match: "連連看", group: "題組", any: "綜合題" }, CN = "一二三四五六七八九十";
    function tyOf(q) { return q.ty || (q.o ? "choice" : "num"); }
    function matchTable(q, blank) {
      return '<table class="pmatch"><tr><th>題目</th><th>答案</th></tr>' + q.L.map(function (l, i) { return "<tr><td>（　）" + (i + 1) + "．" + D.tx(esc(l)) + "</td><td>" + (q.R[i] != null ? L(i) + "．" + D.tx(esc(q.R[i])) : "") + "</td></tr>"; }).join("") + "</table>";
    }
    function opts(q) {
      if (q.ty === "multi") return '<div class="popts ' + P.optMode + '">' + q.o.map(function (t, k) { return "<div>□ " + L(k) + "．" + D.tx(esc(t)) + "</div>"; }).join("") + "</div>";
      if (q.ty === "match") return matchTable(q);
      return q.o ? '<div class="popts ' + P.optMode + '">' + q.o.map(function (t, k) { return "<div>" + L(k) + "．" + D.tx(esc(t)) + "</div>"; }).join("") + "</div>" : "";
    }
    function ans(q) {
      if (q.ty === "tf") return (q.a === "對" ? "○" : "✕") + "（" + esc(q.a) + "）";
      if (q.ty === "multi") return esc(q.al) + "．" + String(q.a).split("|").map(function (t) { return D.tx(esc(t)); }).join("、");
      if (q.ty === "match") return esc(q.al);
      return (q.al ? q.al + "．" : "") + D.tx(esc(String(q.a)));
    }
    /* 題型提示：有大題標題時寫在標題上；沒有大題（快速出卷）就跟在題目後面 */
    function hint(q, bySec) {
      if (q.ty === "tf" && !bySec) return ' <small class="phint">（對的打 ○，錯的打 ✕）</small>';
      if (q.ty === "multi") return ' <small class="phint">（可複選）</small>';
      if (q.ty === "match" && !bySec) return ' <small class="phint">（把右邊的代號填進左邊的括號）</small>';
      return "";
    }
    /* 題組：共用題幹只在這組的第一小題前印一次，後面的小題標「承第 N 題」；題幹要完整放在第一小題的框裡，不拆頁 */
    function gHead(arr, i) {
      var q = arr[i]; if (!q.gid || !q.gs) return "";
      var p = arr[i - 1];
      if (p && p.gid === q.gid) {
        var st = i; while (st > 0 && arr[st - 1].gid === q.gid) st--;
        return '<div class="gcont">（題組，承第 ' + (st + 1) + " 題的敘述）</div>";
      }
      var n = 1; while (arr[i + n] && arr[i + n].gid === q.gid) n++;
      return '<div class="gstem"><small class="gtag">題組・第 ' + (i + 1) + (n > 1 ? "～" + (i + n) : "") + " 題</small><div>" + D.tx(q.gs) + "</div>" + D.qimg(q.gi) + "</div>";
    }
    /* 大題：依計畫把題目分組；沒有計畫（快速出卷）就是一整份 */
    function secsOf(arr) {
      if (!D.secs) return [{ sec: null, qs: arr }];
      return D.secs.map(function (sec, si) { return { sec: sec, qs: arr.filter(function (q) { return q.s === si; }) }; }).filter(function (x) { return x.qs.length; });
    }
    function ptsOf(sec, n) { var k = sec.take && sec.take < n ? sec.take : n; return sec.pts > 0 ? sec.pts * k : 0; }
    function secTitle(sec, si, n) {
      var ty = sec.ty, t = sec.title || (ty === "any" && sec.kd ? sec.kd : TYN[ty] || "題目"), d = [];
      if (sec.take && sec.take < n) d.push("共 " + n + " 題，任選 " + sec.take + " 題作答"); else d.push("共 " + n + " 題");
      if (sec.pts > 0) { d.push("每題 " + sec.pts + " 分"); d.push("共 " + ptsOf(sec, n) + " 分"); }
      var tip = ty === "tf" ? "對的打 ○，錯的打 ✕" : ty === "multi" ? "可複選" : ty === "match" ? "把右邊的代號填進左邊的括號" : "";
      return '<h4 class="psec">' + (CN[si] || si + 1) + "、" + esc(t) + "<small>（" + d.join("，") + (tip ? "；" + tip : "") + "）</small></h4>";
    }
    function totalPts() { var t = 0; if (D.secs) D.secs.forEach(function (sec, si) { var n = qs.filter(function (q) { return q.s === si; }).length; t += ptsOf(sec, n); }); return t; }
    function qItem(arr, q, qi, withAns, bySec) {
      var tf = q.ty === "tf";
      return "<li" + (q.gid ? ' class="gsub"' : "") + ">" + gHead(arr, qi) + meta(q, withAns ? "qa" : "q") + (tf && !withAns ? '<span class="pbr">（　　）</span>' : "") + D.tx(q.q) + hint(q, bySec) + D.qimg(q.img) + opts(q) +
        (withAns ? '<div class="pans"><b>答案：</b>' + ans(q) + (q.h ? "<br><small>詳解：" + D.tx(q.h) + "</small>" : "") + D.qimg(q.himg) + "</div>" : tf || q.ty === "match" ? "" : '<span class="ln">答：' + (q.o ? "（　　）" : "＿＿＿＿＿＿＿＿＿") + "</span>") + "</li>";
    }
    function qList(all, withAns) {
      var bySec = !!D.secs;
      return secsOf(all).map(function (x, si) { var arr = x.qs; return (x.sec ? secTitle(x.sec, D.secs.indexOf(x.sec), arr.length) : "") + "<ol>" + arr.map(function (q, qi) { return qItem(arr, q, qi, withAns, bySec); }).join("") + "</ol>"; }).join("");
    }
    function keyList(all, cls) {
      return secsOf(all).map(function (x) { var arr = x.qs; return (x.sec ? secTitle(x.sec, D.secs.indexOf(x.sec), arr.length) : "") + "<ol" + (cls ? ' class="' + cls + '"' : "") + ">" + arr.map(function (q) { return "<li>" + meta(q, "a") + ans(q) + (cls ? "" : (q.h ? "<br><small>" + D.tx(q.h) + "</small>" : "") + D.qimg(q.himg)) + "</li>"; }).join("") + "</ol>"; }).join("");
    }
    function blankList(all) {
      return secsOf(all).map(function (x) { var arr = x.qs; return (x.sec ? secTitle(x.sec, D.secs.indexOf(x.sec), arr.length) : "") + '<ol class="pblank">' + arr.map(function (q) {
        return "<li>" + (q.ty === "tf" ? '<span class="bub">○</span><span class="bub">✕</span>' : q.ty === "match" ? q.L.map(function (_, i) { return '<span class="ln0">' + (i + 1) + "＿</span>"; }).join("") : q.ty === "multi" ? q.o.map(function (_, i) { return '<span class="bub">' + L(i) + "</span>"; }).join("") : q.o ? q.o.map(function (_, i) { return '<span class="bub">' + L(i) + "</span>"; }).join("") : '<span class="ln0">＿＿＿＿＿＿＿＿</span>') + "</li>"; }).join("") + "</ol>"; }).join("");
    }
    function sheet(k, arr, tag) {
      var cls = "psheet pp pp-" + k, h;
      if (k === "q") h = head("題目卷", tag) + qList(arr, false);
      else if (k === "qa") h = head("題目與詳解", tag) + qList(arr, true);
      else if (k === "ak") { cls += " key"; h = head("簡答與詳解", tag) + keyList(arr, ""); }
      else if (k === "short") { cls += " key"; h = head("簡答卷", tag) + keyList(arr, "pshort"); }
      else h = head("答案卷", tag) + blankList(arr);
      return '<div class="' + cls + '" style="--pw:' + pw + 'mm" data-cols="' + (k === "short" ? Math.max(cols, 3) : cols) + '">' + (WM ? WM.scr : "") + h + '<p class="pcopy">© ' + new Date().getFullYear() + " suuuuuhaooooo・CC BY-NC-ND 4.0・僅供班級教學使用，請勿轉載</p></div>";
    }
    for (var v = 0; v < P.variants; v++) { var arr = variant(qs, v, D.secs), tag = P.variants > 1 ? "（" + ZH[v] + "卷）" : ""; kinds.forEach(function (k) { out.push(sheet(k, arr, tag)); }); }
    if (P.matrix) out.push(matrix(P, qs, nm, D, head, pw, WM));
    return (WM ? WM.prn : "") + out.join("");
  }
  /* 雙向細目表：縱軸（單元／學習內容／學習表現／知識類型）× 橫軸（難易度／認知層次），格子裡是題數與題號 */
  function matrix(P, qs, nm, D, head, pw, WM) {
    var rk = P.mxRow || "unit", ck = P.mxCol || "diff", NONE = "（未標示）";
    function rowOf(q) { var a = q.m || {}; return rk === "unit" ? D.title(q.unit) : (rk === "content" ? a.c : rk === "perf" ? a.p : a.k) || NONE; }
    function colOf(q) { var a = q.m || {}; return (ck === "diff" ? (a.d || LV[q.lv]) : a.g) || NONE; }
    var base = ck === "diff" ? DIFFS : COGS, present = {}, by = {}, order = [];
    qs.forEach(function (q) { present[colOf(q)] = 1; });
    var cols = base.filter(function (c) { return ck === "diff" || present[c]; }).concat(Object.keys(present).filter(function (c) { return base.indexOf(c) < 0; }));
    qs.forEach(function (q, i) { var r = rowOf(q), c = colOf(q); if (!by[r]) { by[r] = {}; order.push(r); } (by[r][c] || (by[r][c] = [])).push(i + 1); });
    var tot = {}; cols.forEach(function (c) { tot[c] = 0; });
    var rows = order.map(function (r) { var n = 0; cols.forEach(function (c) { var k = (by[r][c] || []).length; tot[c] += k; n += k; });
      return "<tr><td>" + esc(r) + "</td>" + cols.map(function (c) { var a = by[r][c] || []; return "<td>" + (a.length ? a.length + "<small>（" + a.join("、") + "）</small>" : "") + "</td>"; }).join("") + "<td>" + n + "</td></tr>"; }).join("");
    var rl = (MXR.filter(function (x) { return x[0] === rk; })[0] || MXR[0])[1];
    return '<div class="psheet pp pp-matrix" style="--pw:' + pw + 'mm" data-cols="1">' + (WM ? WM.scr : "") + head("雙向細目表", "") + '<table class="pscore pmx"><tr><th>' + rl + "</th>" + cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "<th>合計</th></tr>" + rows + "<tr><th>合計</th>" + cols.map(function (c) { return "<th>" + tot[c] + "</th>"; }).join("") + "<th>" + qs.length + '</th></tr></table><p class="pcopy">格子裡：題數（題號）</p></div>';
  }
  /* 裝置資訊：Chrome 類瀏覽器能問到 Android 手機型號；其他資訊（螢幕、時區、語言）一併附上，伺服器另外也會自己讀 User-Agent */
  function device() {
    var base = { scr: screen.width + "x" + screen.height + "@" + (window.devicePixelRatio || 1), tz: (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ""; } })(), lang: navigator.language || "", touch: navigator.maxTouchPoints || 0, plat: navigator.platform || "" };
    var uad = navigator.userAgentData; if (!uad || !uad.getHighEntropyValues) return Promise.resolve(base);
    return uad.getHighEntropyValues(["model", "platformVersion"]).then(function (h) { base.model = h.model || ""; base.pv = h.platformVersion || ""; return base; }, function () { return base; });
  }
  /* 防刪：學生的卷子浮水印一旦被移除、隱藏，馬上重畫；列印前再檢查一次 */
  function guard(root, must, redraw) {
    function ok() { var a = root.querySelector(".pwm-abs"), f = root.querySelector(".pwm-fix"); if (!a || !f || root.querySelectorAll(".pwm-abs").length !== root.querySelectorAll(".psheet").length) return false; var c = getComputedStyle(a); return c.visibility !== "hidden" && c.opacity !== "0" && c.display !== "none" && a.firstChild && a.firstChild.childNodes.length > 10; }
    var tries = 0;
    function fix() { if (!must() || !root.querySelector(".psheet")) return; if (ok()) { tries = 0; return; } if (tries++ < 2) redraw(); else root.innerHTML = '<div class="fb no">無法顯示浮水印，所以不能顯示試卷。請重新整理頁面後再試。</div>'; }
    var t = 0, mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(fix, 80); });
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "hidden"] });
    var bp = function () { fix(); }; window.addEventListener("beforeprint", bp);
    return function () { mo.disconnect(); window.removeEventListener("beforeprint", bp); };
  }
  function csv(qs, D) {
    function c(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var rows = [["題號", "單元", "學習表現", "學習內容", "難易度", "認知層次", "知識類型", "題型", "題目", "選項A", "選項B", "選項C", "選項D", "答案", "詳解", "有附圖", "題組ID", "題組題幹"]];
    qs.forEach(function (q, i) { var o = q.o || []; var a = q.m || {}; rows.push([i + 1, D.title(q.unit), a.p || "", a.c || "", a.d || LV[q.lv] || "", a.g || "", a.k || "", ({ tf: "是非題", multi: "勾選題", match: "連連看" })[q.ty] || (q.o ? "選擇題" : "填充題"), q.q, o[0] || "", o[1] || "", o[2] || "", o[3] || "", (q.al ? q.al + "．" : "") + q.a, q.h || "", q.img ? "是" : "", q.gid || "", q.gid && (i === 0 || qs[i - 1].gid !== q.gid) ? q.gs || "" : ""]); });
    var blob = new Blob(["﻿" + rows.map(function (r) { return r.map(c).join(","); }).join("\r\n")], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "練習卷題目.csv"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  window.NB = window.NB || {}; NB.pp = { panel: panel, build: build, csv: csv, applyPage: applyPage, clearPage: clearPage, device: device, guard: guard };
})();
