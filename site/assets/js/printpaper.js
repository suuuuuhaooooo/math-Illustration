/* 列印練習卷的排版：卷頭、紙張、欄數、選項排列、輸出卷別、雙向細目表、不同題序、CSV。
   只負責「怎麼印」。題目由 /api/print 出好，這裡拿到題目後想換排版不用重新出題。 */
(function () {
  "use strict";
  var KEY = "nb-print-v1";
  var PAPER = { A3: [297, 420], A4: [210, 297], B4: [257, 364], B5: [182, 257] };
  var KINDS = [["q", "題目卷"], ["blank", "空白答案卷"], ["qa", "題目與詳解"], ["ak", "簡答與詳解"], ["short", "簡答卷"], ["qpk", "題目卷＋詳解卷"]];
  var LV = { 1: "基礎", 2: "應用", 3: "挑戰" }, ZH = "甲乙丙丁";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function L(i) { return String.fromCharCode(65 + i); }
  function defaults(u) {
    var m = /^([1-6])(\d{1,2})$/.exec(String(u.cls || "")), t = u.role === "teacher";
    return { school: "", showSchool: false, exam: "數學練習卷", showExam: true, subject: "數學", showSubject: true, grade: m ? m[1] : "", cls: m ? String(+m[2]) : "", showClass: true,
      showScore: t, prefill: !t, paper: "A4", layout: "s1", optMode: "col", kinds: { q: true, ak: true }, showFocus: false, showLv: false, matrix: false, variants: 1 };
  }
  function load(u) { var d = defaults(u), s = null; try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {} if (s) { Object.keys(d).forEach(function (k) { if (s[k] !== undefined && k !== "grade" && k !== "cls") d[k] = s[k]; }); } return d; }
  function save(P) { try { var c = Object.assign({}, P); delete c.grade; delete c.cls; localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }

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
      '<div class="ppr"><b>紙張</b> ' + ["A3", "A4", "B4", "B5"].map(function (p) { return rad("pp-paper", p, p, P.paper); }).join("") + "</div>" +
      '<div class="ppr"><b>排版</b> ' + rad("pp-layout", "s1", "橫書單欄", P.layout) + rad("pp-layout", "d2", "橫書雙欄（直版）", P.layout) + rad("pp-layout", "d2l", "橫書雙欄（橫版）", P.layout) + "</div>" +
      '<div class="ppr"><b>選項排列</b> ' + rad("pp-opt", "col", "換行排列", P.optMode) + rad("pp-opt", "row", "接續排列", P.optMode) + "</div></div></details>" +
      '<details open><summary>輸出卷別</summary><div class="ppg"><div class="ppr">' + chk("pp-all", "全選", false) + KINDS.map(function (k) { return chk("pp-k-" + k[0], k[1], !!P.kinds[k[0]]); }).join("") + "</div></div></details>" +
      '<details><summary>題目資訊與延伸功能</summary><div class="ppg">' +
      '<div class="ppr"><b>每題顯示</b> ' + chk("pp-showFocus", "學習重點（單元名稱）", P.showFocus) + chk("pp-showLv", "難易度", P.showLv) + "</div>" +
      '<div class="ppr">' + chk("pp-matrix", "附上雙向細目表（單元 × 難易度）", P.matrix) + "</div>" +
      '<div class="ppr"><label>同題目不同題序 <select id="pp-variants">' + [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (P.variants === n ? " selected" : "") + ">" + (n === 1 ? "只印一份" : n + " 份（" + ZH.slice(0, n).split("").join("、") + "卷，題序與選項順序都不同）") + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="ppr"><button type="button" class="pen" id="pp-csv">匯出題目 CSV</button> <span class="meta">不含詳解以外的版面設定；可用 Excel 開啟</span></div></div></details>';
    function get() {
      var q = function (id) { return el.querySelector("#" + id); }, kinds = {};
      KINDS.forEach(function (k) { kinds[k[0]] = q("pp-k-" + k[0]).checked; });
      var r = function (n) { var x = el.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : ""; };
      return { school: q("pp-school").value.trim(), showSchool: q("pp-showSchool").checked, exam: q("pp-exam").value.trim(), showExam: q("pp-showExam").checked, subject: q("pp-subject").value.trim(), showSubject: q("pp-showSubject").checked,
        grade: q("pp-grade").value.trim(), cls: q("pp-cls").value.trim(), showClass: q("pp-showClass").checked, showScore: q("pp-showScore").checked, prefill: q("pp-prefill").checked,
        paper: r("pp-paper") || "A4", layout: r("pp-layout") || "s1", optMode: r("pp-opt") || "col", kinds: kinds, showFocus: q("pp-showFocus").checked, showLv: q("pp-showLv").checked, matrix: q("pp-matrix").checked, variants: +q("pp-variants").value || 1 };
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
  function pageCss(P) { var s = PAPER[P.paper] || PAPER.A4, w = s[0], h = s[1]; if (P.layout === "d2l") { var t = w; w = h; h = t; } return { css: "@page{size:" + w + "mm " + h + "mm;margin:12mm}", w: w }; }
  function applyPage(P) { var st = document.getElementById("ppstyle"); if (!st) { st = document.createElement("style"); st.id = "ppstyle"; document.head.appendChild(st); } st.textContent = pageCss(P).css; }
  function clearPage() { var st = document.getElementById("ppstyle"); if (st) st.remove(); }

  /* ---- 不同題序：用固定種子洗牌，同一份設定每次結果一樣 ---- */
  function seeded(n) { var s = n * 2654435761 >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuf(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function variant(qs, v) {
    if (!v) return qs; var r = seeded(v + 1);
    return shuf(qs, r).map(function (q) { if (!q.o) return q; var o = shuf(q.o, r), i = o.indexOf(String(q.a)); return Object.assign({}, q, { o: o, al: i >= 0 ? L(i) : q.al }); });
  }

  /* ---- 畫面 ---- */
  function build(P, qs, nm, D) { /* D：{u, today, title, tx, qimg} */
    var cols = P.layout === "s1" ? 1 : 2, kinds = [], out = [], pw = pageCss(P).w;
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
      h += '<div class="pinfo"><span>座號：' + (f ? esc(u.no) : "＿＿＿") + "</span><span>姓名：" + (f ? "<b>" + esc(u.name) + "</b>" : "＿＿＿＿＿＿") + "</span><span>日期：" + (f ? D.today : "＿＿＿＿") + "</span>" + (P.showScore ? "" : "<span>分數：＿＿＿</span>") + "</div>";
      if (P.showScore) h += '<table class="pscore"><tr><th>級距</th><td>100</td><td>99~90</td><td>89~80</td><td>79~70</td><td>69~60</td><td>未滿60</td><th>分數</th><th>家長簽章</th></tr><tr><th>得分</th><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>';
      return h + "</div>";
    }
    function meta(q) { var m = []; if (P.showFocus) m.push("學習重點：" + esc(D.title(q.unit))); if (P.showLv && q.lv) m.push("難易度：" + (LV[q.lv] || q.lv)); return m.length ? '<div class="pmeta">' + m.join("　") + "</div>" : ""; }
    function opts(q) { return q.o ? '<div class="popts ' + P.optMode + '">' + q.o.map(function (t, k) { return "<div>" + L(k) + "．" + D.tx(esc(t)) + "</div>"; }).join("") + "</div>" : ""; }
    function ans(q) { return (q.al ? q.al + "．" : "") + D.tx(esc(String(q.a))); }
    function qList(arr, withAns) {
      return "<ol>" + arr.map(function (q) { return "<li>" + meta(q) + D.tx(q.q) + D.qimg(q.img) + opts(q) +
        (withAns ? '<div class="pans"><b>答案：</b>' + ans(q) + (q.h ? "<br><small>詳解：" + D.tx(q.h) + "</small>" : "") + D.qimg(q.himg) + "</div>" : '<span class="ln">答：' + (q.o ? "（　　）" : "＿＿＿＿＿＿＿＿＿") + "</span>") + "</li>"; }).join("") + "</ol>";
    }
    function sheet(k, arr, tag) {
      var cls = "psheet pp pp-" + k, h;
      if (k === "q") h = head("題目卷", tag) + qList(arr, false);
      else if (k === "qa") h = head("題目與詳解", tag) + qList(arr, true);
      else if (k === "ak") { cls += " key"; h = head("簡答與詳解", tag) + "<ol>" + arr.map(function (q) { return "<li>" + ans(q) + (q.h ? "<br><small>" + D.tx(q.h) + "</small>" : "") + D.qimg(q.himg) + "</li>"; }).join("") + "</ol>"; }
      else if (k === "short") { cls += " key"; h = head("簡答卷", tag) + '<ol class="pshort">' + arr.map(function (q) { return "<li>" + ans(q) + "</li>"; }).join("") + "</ol>"; }
      else h = head("答案卷", tag) + '<ol class="pblank">' + arr.map(function (q) { return "<li>" + (q.o ? q.o.map(function (_, i) { return "<span class=\"bub\">" + L(i) + "</span>"; }).join("") : '<span class="ln0">＿＿＿＿＿＿＿＿</span>') + "</li>"; }).join("") + "</ol>";
      return '<div class="' + cls + '" style="--pw:' + pw + 'mm" data-cols="' + (k === "short" ? Math.max(cols, 3) : cols) + '">' + h + '<p class="pcopy">© ' + new Date().getFullYear() + " suuuuuhaooooo・CC BY-NC-ND 4.0・僅供班級教學使用，請勿轉載</p></div>";
    }
    for (var v = 0; v < P.variants; v++) { var arr = variant(qs, v), tag = P.variants > 1 ? "（" + ZH[v] + "卷）" : ""; kinds.forEach(function (k) { out.push(sheet(k, arr, tag)); }); }
    if (P.matrix) out.push(matrix(P, qs, nm, D, head, pw));
    return out.join("");
  }
  /* 雙向細目表：每個單元各難易度出了幾題、是第幾題 */
  function matrix(P, qs, nm, D, head, pw) {
    var by = {}, order = [];
    qs.forEach(function (q, i) { if (!by[q.unit]) { by[q.unit] = { 1: [], 2: [], 3: [] }; order.push(q.unit); } (by[q.unit][q.lv] || (by[q.unit][q.lv] = [])).push(i + 1); });
    var lvs = [1, 2, 3], tot = { 1: 0, 2: 0, 3: 0 }, rows = order.map(function (u) { var n = 0; lvs.forEach(function (l) { var c = (by[u][l] || []).length; tot[l] += c; n += c; });
      return "<tr><td>" + esc(D.title(u)) + "</td>" + lvs.map(function (l) { var a = by[u][l] || []; return "<td>" + (a.length ? a.length + '<small>（' + a.join("、") + "）</small>" : "") + "</td>"; }).join("") + "<td>" + n + "</td></tr>"; }).join("");
    return '<div class="psheet pp pp-matrix" style="--pw:' + pw + 'mm" data-cols="1">' + head("雙向細目表", "") + '<table class="pscore pmx"><tr><th>單元</th>' + lvs.map(function (l) { return "<th>" + LV[l] + "</th>"; }).join("") + "<th>合計</th></tr>" + rows + "<tr><th>合計</th>" + lvs.map(function (l) { return "<th>" + tot[l] + "</th>"; }).join("") + "<th>" + qs.length + "</th></tr></table></div>";
  }
  function csv(qs, D) {
    function c(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var rows = [["題號", "單元", "難易度", "題型", "題目", "選項A", "選項B", "選項C", "選項D", "答案", "詳解", "有附圖"]];
    qs.forEach(function (q, i) { var o = q.o || []; rows.push([i + 1, D.title(q.unit), LV[q.lv] || "", q.o ? "選擇題" : "填充題", q.q, o[0] || "", o[1] || "", o[2] || "", o[3] || "", (q.al ? q.al + "．" : "") + q.a, q.h || "", q.img ? "是" : ""]); });
    var blob = new Blob(["﻿" + rows.map(function (r) { return r.map(c).join(","); }).join("\r\n")], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "練習卷題目.csv"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  window.NB = window.NB || {}; NB.pp = { panel: panel, build: build, csv: csv, applyPage: applyPage, clearPage: clearPage };
})();
