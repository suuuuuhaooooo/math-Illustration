/* 遊戲場：六個小遊戲。題目全部來自無限出題的題庫，所以 412 個小節都玩得到。
   完全在瀏覽器裡跑：不登入、不呼叫後端，成績與印章只存在這台裝置。
   路由：#hub 大廳、#fix 修補計算機、#hunt 錯誤獵人、#card 島民挑戰卡、
         #race 快速反應賽、#teach 我是出題老師、#match 概念配對、#play?… 別人分享的卷 */
(function () {
  "use strict";
  var D = window.DR, NB = window.NB, GM = window.GM, app = document.getElementById("app");
  var h = GM.h, esc = GM.esc, tx = GM.tx;

  var IC = {
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="4"/><path d="M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01"/>',
    pen: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13 7l4 4"/>',
    stamp: '<path d="M9 3h6v5l3 3v3H6v-3l3-3z"/><rect x="5" y="17" width="14" height="4" rx="1"/>',
    bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
    board: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 9h6M7 12h3"/>',
    cards: '<rect x="3" y="6" width="11" height="14" rx="2"/><path d="M8 4h9a2 2 0 0 1 2 2v12"/>'
  };
  function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[k] || "") + "</svg>"; }

  var GAMES = [
    { id: "fix", ic: "calc", t: "修補計算機", d: "島上那台老計算機會算錯。看它這次對不對，錯了就幫它改回來。", why: "學會檢查答案，而不是算完就交" },
    { id: "hunt", ic: "pen", t: "錯誤獵人", d: "一張寫好的練習卷，裡面有幾題是錯的。你來當老師，把它們圈出來。", why: "看懂別人錯在哪裡，自己就不會錯" },
    { id: "card", ic: "stamp", t: "島民挑戰卡", d: "島民各出五題。過關蓋一個印章。", why: "一次五題，剛好的份量" },
    { id: "race", ic: "bolt", t: "快速反應賽", d: "六十秒，看能答對幾題。答錯扣一點時間。", why: "把算過很多次的東西變成反射" },
    { id: "teach", ic: "board", t: "我是出題老師", d: "自己挑題、自己改數字，做一張卷丟給同學。", why: "出得出題目，才是真的懂" },
    { id: "match", ic: "cards", t: "概念配對", d: "十二張牌蓋著，把算式和答案配成一對。", why: "把算式和答案連在一起記" }
  ];
  function game(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; return null; }

  /* ---------- 版面骨架 ---------- */
  app.appendChild(GM.topBar("games"));
  app.appendChild(h('<div class="ruler"></div>'));
  var view = h('<div id="gm-view" aria-live="polite"></div>');
  app.appendChild(view);

  function clear() { view.innerHTML = ""; }
  /* 切頁：如果網址本來就是這一頁（例如印章簿按「看印章簿」），hashchange 不會觸發，要自己重畫 */
  function goto(hs) { if (location.hash === hs) { lastHash = null; route(); } else location.hash = hs; }
  function top() { window.scrollTo({ top: 0, behavior: "smooth" }); }
  /* 手機的畫面比較窄、版面被拉得很長，按下去之後新冒出來的那一塊常常落在螢幕外，
     看起來就像「按了沒反應」或「按鈕按不到」。只要不在畫面裡就幫使用者捲過去。 */
  function reveal(el, block) {
    if (!el) return;
    setTimeout(function () {
      try {
        var r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        if (r.bottom > window.innerHeight - 10 || r.top < 8) el.scrollIntoView({ behavior: "smooth", block: block || "center" });
      } catch (e) {}
    }, 30);
  }
  /* 手機上不要把焦點丟給輸入框（會彈出鍵盤把畫面擠掉），按鈕則可以 */
  function hold(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} } reveal(el); }
  function rangeText() {
    var S = GM.S;
    if (!S.sel.length) return "一二三四五六"[S.grade - 1] + "年級全部";
    if (S.sel.length === 1) return GM.secName(S.sel[0]);
    var chs = {}; S.sel.forEach(function (id) { chs[GM.chapKey(id)] = 1; });
    return "已選 " + S.sel.length + " 個小節（" + Object.keys(chs).length + " 章）";
  }
  /* 每個遊戲的開始畫面：說明、範圍、難度、開始按鈕 */
  function startScreen(g, opt) {
    clear();
    var box = h('<section class="sheet gm-start"><a class="back gm-back" href="#hub">← 回遊戲場</a>' +
      '<h1 class="gm-gt">' + ic(g.ic) + esc(g.t) + "</h1>" +
      '<p class="lead">' + esc(g.d) + "</p>" +
      '<p class="meta">' + esc(g.why) + "</p>" +
      '<div class="gm-range"><span class="dr-lab">範圍</span><b class="gm-rt"></b><button type="button" class="pen gm-chg">換範圍</button></div>' +
      '<div class="gm-setpan" hidden></div>' +
      '<div class="gm-opt"></div>' +
      '<div class="dr-btns"><button type="button" class="pen go gm-go">' + (opt.goText || "開始") + "</button></div>" +
      '<p class="dr-note gm-note"></p></section>');
    var rt = box.querySelector(".gm-rt"), pan = box.querySelector(".gm-setpan");
    function paint() { rt.textContent = rangeText(); }
    paint();
    box.querySelector(".gm-chg").onclick = function () {
      if (pan.firstChild) { pan.hidden = !pan.hidden; return; }
      pan.appendChild(GM.lvRow(paint));
      pan.appendChild(GM.picker(paint, { note: "選好的範圍，六個遊戲都會用這一份。" }));
      pan.hidden = false; reveal(pan, "start");
    };
    if (opt.note) box.querySelector(".gm-note").textContent = opt.note;
    var best = opt.bestText && opt.bestText();
    if (best) box.querySelector(".gm-opt").appendChild(h('<p class="gm-bestline">' + esc(best) + "</p>"));
    if (opt.options) opt.options(box.querySelector(".gm-opt"));
    box.querySelector(".gm-go").onclick = function () { opt.go(); };
    view.appendChild(box);
    if (opt.extra) opt.extra(view);
    top();
    return box;
  }
  /* 遊戲進行中的上方列 */
  function playBar(g, right) {
    return h('<div class="gm-pbar"><a class="back" href="#hub">← 遊戲場</a><b>' + esc(g.t) + "</b><span>" + (right || "") + "</span></div>");
  }
  function need(f, min, name) {
    var ids = GM.playable(GM.ids(), GM.S.lv, f);
    if (ids.length) return ids;
    GM.say("這個範圍玩不了「" + name + "」", "你選的小節做不出這個遊戲要的題目（例如只有圖形判斷、沒有算出來的答案）。\n請按「換範圍」多選幾個小節，或換個遊戲。", null);
    return null;
  }
  function endCard(title, lines, acts) {
    var s = h('<section class="sheet gm-end gm-pop"><p class="eyebrow">結果</p><h2>' + esc(title) + "</h2></section>");
    lines.forEach(function (L) { if (L.t) s.appendChild(h('<p class="' + (L.big ? "gm-big" : "meta") + '">' + L.t + "</p>")); });
    var b = h('<div class="dr-btns"></div>');
    acts.forEach(function (a) { var x = h('<button type="button" class="pen' + (a.go ? " go" : "") + '">' + esc(a.t) + "</button>"); x.onclick = a.f; b.appendChild(x); });
    s.appendChild(b);
    return s;
  }

  /* ================================================================
     1. 修補計算機
     ================================================================ */
  function fixGame() {
    var g = game("fix");
    startScreen(g, {
      goText: "開機，開始修",
      note: "十題。計算機有時候算對、有時候算錯，你要先判斷，說它壞了就要寫出正確答案。",
      bestText: function () { var b = GM.R.best.fix; return b == null ? "" : "這台裝置最好成績：判斷正確 " + b + " / 10"; },
      go: function () {
        var ids = need({ produced: true, noopts: true, wrongs: 1 }, 1, g.t); if (!ids) return;
        run(ids);
      }
    });
    function run(ids) {
      var N = 10, R = D.rng(D.hash("fix" + Date.now()));
      var qs = GM.pool(ids, GM.S.lv, Date.now(), N, { produced: true, noopts: true, wrongs: 1 });
      if (!qs.length) { GM.say("出不來題目", "這個範圍湊不出題目，請換範圍。"); return; }
      var P = { i: 0, n: qs.length, judge: 0, fixed: 0, broken: 0, qs: qs };
      /* 大約三分之一是「其實算對了」，學生才需要真的判斷 */
      qs.forEach(function (Q, i) {
        var w = R.chance(0.34) ? null : GM.aWrong(Q, R);
        Q._w = w;
        if (w) P.broken++;
      });
      GM.played("fix");
      step();
      function face(k) {
        /* k：0 全壞 → 1 全修好。嘴巴從倒 U 變成 U */
        var m = -6 + 12 * k;
        return '<svg class="gm-face" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' +
          '<circle cx="17" cy="19" r="1.6" fill="currentColor" stroke="none"/><circle cx="31" cy="19" r="1.6" fill="currentColor" stroke="none"/>' +
          '<path d="M15 30 Q24 ' + (30 + m) + ' 33 30"/></g></svg>';
      }
      function step() {
        if (P.i >= P.n) return done();
        var Q = P.qs[P.i], w = Q._w, vals = w ? w.vals : GM.vals(Q);
        clear();
        view.appendChild(playBar(g, "第 " + (P.i + 1) + " / " + P.n + " 台"));
        var k = P.broken ? P.fixed / P.broken : 1;
        var card = h('<section class="sheet gm-fix gm-pop">' +
          '<div class="gm-calc"><div class="gm-calch">' + face(k) + '<span>島上的老計算機</span></div>' +
          '<div class="gm-tape"><p class="gm-tapeh">它算的這一題</p><div class="gm-tq">' + GM.figHtml(Q, "q", { nocalc: true }) + GM.qhtml(Q, vals, "lcd") + "</div></div>" +
          '<div class="gm-keys" aria-hidden="true"></div></div>' +
          '<p class="gm-ask">它算對了嗎？</p>' +
          '<div class="gm-jd"><button type="button" class="pen" data-j="ok">算對了</button><button type="button" class="pen" data-j="bad">壞掉了</button></div>' +
          '<div class="gm-fixin" hidden></div><div class="gm-fb" aria-live="polite"></div></section>');
        var keys = card.querySelector(".gm-keys");
        for (var i = 0; i < 12; i++) keys.appendChild(h("<i></i>"));
        card.querySelector(".gm-tq").appendChild(h('<p class="gm-src">' + esc(GM.secShort(Q.id)) + "</p>"));
        view.appendChild(card);
        card.querySelectorAll("[data-j]").forEach(function (b) { b.onclick = function () { judge(card, Q, b.dataset.j === "bad"); }; });
        top();
      }
      function judge(card, Q, saidBad) {
        var w = Q._w, reallyBad = !!w;
        card.querySelectorAll("[data-j]").forEach(function (b) { b.disabled = true; });
        if (saidBad === reallyBad) P.judge++;
        if (saidBad && reallyBad) {
          /* 判斷對了，接著要修：寫出正確答案 */
          var box = card.querySelector(".gm-fixin");
          box.innerHTML = '<p class="gm-ask">抓到了！正確答案是多少？</p><div class="gm-fixrow">' + GM.inHtml(Q) + '</div><div class="dr-btns"><button type="button" class="pen go">修好它</button></div>';
          box.hidden = false;
          var inp = box.querySelector("input"); if (inp && window.innerWidth > 640) inp.focus();
          reveal(box);
          box.querySelector("button").onclick = function () {
            var r = GM.grade(box, Q);
            if (r.empty) { tell(card, "bad", "還沒寫答案", "", Q, true); return; }
            GM.mark(box, Q, r.res);
            box.querySelector("button").disabled = true;
            if (r.ok) { P.fixed++; tell(card, "ok", "修好了！", "它原本的錯是：" + w.why + "。", Q); }
            else tell(card, "bad", "答案還不對", "正確答案是 " + GM.ansLine(Q) + "。它原本的錯是：" + w.why + "。", Q);
          };
          return;
        }
        if (!saidBad && !reallyBad) tell(card, "ok", "沒錯，這台這次算對了", "", Q);
        else if (saidBad && !reallyBad) tell(card, "bad", "這一題它其實算對了", "正確答案就是 " + GM.ansLine(Q) + "。", Q);
        else tell(card, "bad", "它其實算錯了", "正確答案是 " + GM.ansLine(Q) + "，它的錯是：" + w.why + "。", Q);
      }
      function tell(card, kind, title, text, Q, keep) {
        var fb = card.querySelector(".gm-fb");
        fb.className = "gm-fb show " + kind;
        /* 說明裡可能有分數（$\frac{…}{…}$），要讓 KaTeX 排出來 */
        fb.innerHTML = "<h3>" + esc(title) + "</h3>" + (text ? "<p>" + tx(esc(text)) + "</p>" : "");
        if (keep) return;
        if (kind === "ok") GM.spark(fb);
        if (Q.calc) { try { fb.innerHTML += '<div class="gm-fig gm-calcv">' + D.V.svg(Q.calc, "a", { mode: "filled", grid: "cell", pv: true, carry: true, u: 24, k: 0.8 }) + "</div>"; } catch (e) {} }
        var nx = h('<div class="dr-btns"><button type="button" class="pen go">' + (P.i + 1 >= P.n ? "看結果" : "下一台") + "</button></div>");
        nx.firstChild.onclick = function () { P.i++; step(); };
        fb.appendChild(nx); hold(nx.firstChild);
      }
      function done() {
        var rec = GM.best("fix", P.judge, true);
        clear();
        view.appendChild(playBar(g, ""));
        view.appendChild(endCard("修完了", [
          { t: "判斷正確 <b>" + P.judge + "</b> / " + P.n + " 題", big: true },
          { t: "修好 " + P.fixed + " 台（壞掉的有 " + P.broken + " 台）" + (rec ? "・新紀錄！" : "") }
        ], [
          { t: "再修一輪", go: true, f: function () { run(ids); } },
          { t: "回遊戲場", f: function () { goto("#hub"); } }
        ]));
        top();
      }
    }
  }

  /* ================================================================
     2. 錯誤獵人
     ================================================================ */
  function huntGame() {
    var g = game("hunt");
    startScreen(g, {
      goText: "拿到練習卷，開始找",
      note: "一張八題的卷，裡面有幾題是錯的。點一下題目就是「這題錯了」，圈完按批改。",
      bestText: function () { var b = GM.R.best.hunt; return b == null ? "" : "這台裝置最好成績：抓到 " + b + " 成"; },
      go: function () {
        var ids = need({ judge: true, wrongs: 1 }, 1, g.t); if (!ids) return;
        run(ids);
      }
    });
    function run(ids) {
      var N = 8, K = GM.S.lv <= 1 ? 2 : GM.S.lv === 2 ? 3 : 4;
      var R = D.rng(D.hash("hunt" + Date.now()));
      var qs = GM.pool(ids, GM.S.lv, Date.now(), N, { judge: true, wrongs: 1 });
      if (qs.length < 3) { GM.say("出不來題目", "這個範圍湊不出一張卷，請換範圍。"); return; }
      var badIx = R.shuffle(qs.map(function (q, i) { return i; })).slice(0, Math.min(K, qs.length - 1));
      var rows = qs.map(function (Q, i) {
        var isBad = badIx.indexOf(i) >= 0, w = isBad ? GM.aWrong(Q, R) : null;
        if (isBad && !w) isBad = false;
        return { Q: Q, bad: isBad, w: w, vals: isBad ? w.vals : GM.vals(Q), mark: false };
      });
      var realBad = rows.filter(function (r) { return r.bad; }).length;
      GM.played("hunt");
      clear();
      view.appendChild(playBar(g, "藏了 " + realBad + " 題錯的"));
      var sheet = h('<section class="sheet gm-hunt"><p class="eyebrow">島上某位同學的練習卷</p>' +
        '<h2 class="gm-hh">哪幾題錯了？</h2><p class="meta">點一下你覺得錯的那一題，可以再點一次取消。</p><div class="gm-hrows"></div>' +
        '<div class="dr-btns"><button type="button" class="pen go">批改完成</button></div></section>');
      var host = sheet.querySelector(".gm-hrows");
      rows.forEach(function (r, i) {
        /* 選擇題的話，顯示「這位同學選了哪個」 */
        var pick = r.Q.opts ? "ABCD".indexOf(String(r.vals[0]).replace(/[()]/g, "")) : -1;
        var el = h('<button type="button" class="gm-hrow" aria-pressed="false"><span class="gm-hn">' + (i + 1) + '.</span>' +
          '<span class="gm-hq">' + GM.figHtml(r.Q, "q", { nocalc: true }) + GM.qhtml(r.Q, r.Q.opts ? null : r.vals, "hand") + (r.Q.opts ? GM.optsHtml(r.Q, pick) : "") + "</span>" +
          '<span class="gm-hmk" aria-hidden="true"></span></button>');
        el.onclick = function () { r.mark = !r.mark; el.setAttribute("aria-pressed", r.mark ? "true" : "false"); el.classList.toggle("marked", r.mark); };
        host.appendChild(el);
      });
      sheet.querySelector("button.go").onclick = function () { mark(); };
      view.appendChild(sheet);
      top();
      function mark() {
        var found = 0, wrongMark = 0, missed = 0;
        sheet.querySelector("button.go").disabled = true;
        host.querySelectorAll(".gm-hrow").forEach(function (el, i) {
          var r = rows[i];
          el.disabled = true; el.classList.add("done");
          var vd = "", cls = "";
          if (r.mark && r.bad) { found++; cls = "hit"; vd = "抓到了：" + r.w.why; }
          else if (r.mark && !r.bad) { wrongMark++; cls = "miss"; vd = "這一題其實是對的"; }
          else if (!r.mark && r.bad) { missed++; cls = "lost"; vd = "漏掉了。正確答案是 " + GM.ansLine(r.Q) + "（" + r.w.why + "）"; }
          else cls = "pass";
          el.classList.add(cls);
          /* 說明裡會有分數之類的 LaTeX（$\frac{1}{6}$），要讓它排出來，不能直接當純文字 */
          if (vd) el.appendChild(h('<span class="gm-hv">' + tx(esc(vd)) + "</span>"));
        });
        var pc = realBad ? Math.round((found / realBad) * 10) : 10;
        var rec = GM.best("hunt", pc, true);
        var s = endCard("批改完成", [
          { t: "抓到 <b>" + found + "</b> / " + realBad + " 題錯的", big: true },
          { t: "冤枉了 " + wrongMark + " 題・漏掉 " + missed + " 題" + (rec ? "・新紀錄！" : "") }
        ], [
          { t: "再抓一張", go: true, f: function () { run(ids); } },
          { t: "回遊戲場", f: function () { goto("#hub"); } }
        ]);
        view.appendChild(s);
        s.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  /* ================================================================
     3. 島民挑戰卡
     ================================================================ */
  function cardGame() {
    var g = game("card");
    startScreen(g, {
      goText: "接下挑戰卡",
      note: "一張卡五題，答對四題以上就過關，蓋下這一章的印章。印章存在這台裝置。",
      bestText: function () { var n = Object.keys(GM.R.stamp).length; return n ? "已經蓋到 " + n + " 個印章" : ""; },
      go: function () {
        var ids = GM.ids(); if (!ids.length) { GM.say("還沒有範圍", "請先選範圍。"); return; }
        run(ids);
      },
      extra: function (host) { host.appendChild(stampBook()); }
    });
    function stampBook() {
      var S = GM.S, box = h('<section class="sheet gm-book"><h2>印章簿</h2><p class="meta">' + "一二三四五六"[S.grade - 1] + "年級的每一章，過關一次就蓋一個。</p></section>");
      NB.cat.filter(function (x) { return x.grade === S.grade; }).forEach(function (sem) {
        var row = h('<div class="gm-brow"><span class="tag">' + sem.sem + '</span><div class="gm-bgrid"></div></div>');
        var grid = row.querySelector(".gm-bgrid");
        sem.chs.forEach(function (c) {
          var key = sem.sem + "#" + c.no, got = GM.R.stamp[key], f = GM.FOLK[D.hash(key) % GM.FOLK.length];
          var cell = h('<div class="gm-cell' + (got ? " got" : "") + '" title="' + esc(c.name) + '"><span class="gm-cn">第' + "一二三四五六七八九十"[c.no - 1] + '章</span>' +
            (got ? '<span class="gm-stamp">' + GM.folkSvg(f, 34) + "</span>" : '<span class="gm-cq" aria-hidden="true"></span>') + "</div>");
          grid.appendChild(cell);
        });
        box.appendChild(row);
      });
      return box;
    }
    function run(ids) {
      var seed = Date.now(), R = D.rng(D.hash("card" + seed));
      var pick = R.pick(ids), key = GM.chapKey(pick), folk = GM.folkOf(pick);
      /* 這一張卡的題目都從同一章出，印章才對得上 */
      var chIds = ids.filter(function (id) { return GM.chapKey(id) === key; });
      var qs = GM.pool(chIds.length ? chIds : ids, GM.S.lv, seed, 5, {});
      if (!qs.length) { GM.say("出不來題目", "這一章出不了題，請換範圍。"); return; }
      var P = { i: 0, n: qs.length, ok: 0, qs: qs, answered: false };
      GM.played("card");
      step();
      function step() {
        if (P.i >= P.n) return done();
        var Q = P.qs[P.i];
        clear();
        view.appendChild(playBar(g, "第 " + (P.i + 1) + " / " + P.n + " 題"));
        var card = h('<section class="sheet gm-card gm-pop">' +
          '<div class="gm-folkh">' + GM.folkSvg(folk, 56) + '<div><b>' + esc(folk.n) + "</b><small>" + esc(folk.job) + "</small></div>" +
          '<span class="gm-ch">' + esc(GM.chapName(pick)) + "</span></div>" +
          (P.i === 0 ? '<p class="gm-say">「' + esc(folk.say) + "」</p>" : "") +
          '<div class="gm-prog"><i style="width:' + (P.i / P.n) * 100 + '%"></i></div>' +
          '<div class="dq"><span class="dq-t">' + GM.inHtml(Q) + "</span>" + GM.figHtml(Q, "q") + GM.mcHtml(Q) + "</div>" +
          '<div class="gm-fb" aria-live="polite"></div>' +
          '<div class="dr-btns"><button type="button" class="pen go gm-sub">送出</button>' +
          (GM.hasAid(Q) ? '<button type="button" class="pen gm-hint">提示</button>' : "") +
          '<button type="button" class="pen gm-skip">不會，看答案</button></div><div class="gm-hintbox" hidden></div></section>');
        view.appendChild(card);
        card.querySelectorAll(".dsel,.dmc").forEach(function (gr) {
          gr.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b || P.answered) return; gr.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); });
        });
        var sub = card.querySelector(".gm-sub");
        sub.onclick = function () { P.answered ? (P.i++, P.answered = false, step()) : submit(card, Q, false); };
        card.querySelector(".gm-skip").onclick = function () { if (!P.answered) submit(card, Q, true); };
        var hb = card.querySelector(".gm-hint");
        if (hb) hb.onclick = function () { var b = card.querySelector(".gm-hintbox"); b.innerHTML = GM.figHtml(Q, "q", { aid: true, nocalc: true }); b.hidden = false; hb.hidden = true; reveal(b); };
        var f = card.querySelector("input"); if (f && window.innerWidth > 640) f.focus();
        top();
      }
      function submit(card, Q, give) {
        var r = GM.grade(card, Q);
        var fb = card.querySelector(".gm-fb");
        if (r.empty && !give) { fb.className = "gm-fb show"; fb.innerHTML = "<p>還沒作答喔。不會的話可以按「不會，看答案」。</p>"; return; }
        P.answered = true;
        var ok = r.ok && !give;
        GM.mark(card, Q, give ? r.res.map(function () { return false; }) : r.res);
        if (ok) P.ok++;
        var hb = card.querySelector(".gm-hint"); if (hb) hb.hidden = true;
        card.querySelector(".gm-hintbox").hidden = true;
        card.querySelector(".gm-skip").hidden = true;
        fb.className = "gm-fb show " + (ok ? "ok" : "bad");
        fb.innerHTML = "<h3>" + (ok ? "答對了" : give ? "沒關係，看答案" : "再想想看") + "</h3>" +
          (ok ? "" : "<p>正確答案：" + tx(esc(GM.ansLine(Q))) + "</p>") + (Q.sol ? "<p>" + tx("算式：" + Q.sol) + "</p>" : "");
        if (ok) GM.spark(fb);
        var w = GM.figHtml(Q, "a", { aid: true });
        if (w) fb.appendChild(h('<div class="gm-worked">' + w + "</div>"));
        var sub = card.querySelector(".gm-sub");
        sub.textContent = P.i + 1 >= P.n ? "看結果" : "下一題"; hold(sub);
      }
      function done() {
        var pass = P.ok >= 4, got = false;
        if (pass) { var s = GM.R.stamp[key]; GM.R.stamp[key] = { t: Date.now(), n: (s && s.n || 0) + 1 }; GM.save(); got = !s; }
        clear();
        view.appendChild(playBar(g, ""));
        var lines = [{ t: "答對 <b>" + P.ok + "</b> / " + P.n + " 題", big: true },
          { t: pass ? (got ? "過關！蓋到「" + GM.chapName(pick) + "」的印章" : "再次過關，這一章的印章你已經有了") : "答對四題以上才算過關，再試一次" }];
        var s2 = endCard(pass ? folk.n + "收下你的答案" : "差一點", lines, [
          { t: "再接一張", go: true, f: function () { run(ids); } },
          { t: "看印章簿", f: function () { goto("#card"); } },
          { t: "回遊戲場", f: function () { goto("#hub"); } }
        ]);
        if (pass) s2.insertBefore(h('<div class="gm-gotstamp">' + GM.folkSvg(folk, 72) + "</div>"), s2.querySelector(".gm-big"));
        view.appendChild(s2);
        top();
      }
    }
  }

  /* ================================================================
     4. 快速反應賽
     ================================================================ */
  function raceGame() {
    var g = game("race");
    var SEC = 60;
    startScreen(g, {
      goText: "開始，六十秒",
      note: "六十秒內答對越多越好。答錯會扣 1.5 秒，所以寧願慢一點也要算對。",
      bestText: function () { var b = GM.R.best.race; return b == null ? "" : "這台裝置最好成績：" + b + " 題"; },
      go: function () {
        var ids = need({ one: true, wrongs: 1 }, 1, g.t); if (!ids) return;
        run(ids);
      }
    });
    function opt4(Q, R) {
      if (Q.opts) return { list: Q.opts.map(function (o, i) { return { t: o, ok: i === Q.b[0].a }; }), tex: true };
      var right = GM.vals(Q)[0], ws = GM.wrongs(Q).slice(0, 6), seen = {};
      var list = [{ t: right, ok: true }];
      ws.forEach(function (w) { if (list.length >= 4 || seen[w.t] || w.t === right) return; seen[w.t] = 1; list.push({ t: w.t, ok: false }); });
      /* 湊不到四個就給兩三個選項（例如「直線／曲線」只有兩種答案），不要整節不能玩 */
      if (list.length < 2) return null;
      return { list: R.shuffle(list), tex: true };
    }
    function run(ids) {
      var R = D.rng(D.hash("race" + Date.now()));
      var raw = GM.pool(ids, GM.S.lv, Date.now(), 46, { one: true, wrongs: 1 });
      var queue = [];
      raw.forEach(function (Q) { var o = opt4(Q, R); if (o) queue.push({ Q: Q, o: o }); });
      if (queue.length < 5) { GM.say("出不來題目", "這個範圍湊不出四個選項的題目，請換範圍或換個遊戲。"); return; }
      var P = { i: 0, ok: 0, streak: 0, best: 0, pen: 0, over: false };
      GM.played("race");
      clear();
      view.appendChild(playBar(g, ""));
      var wrap = h('<section class="sheet gm-race"><div class="gm-rhead"><span class="gm-clock"><b class="gm-time">60.0</b> 秒</span>' +
        '<span>答對 <b class="gm-ok">0</b></span><span>連對 <b class="gm-st">0</b></span></div>' +
        '<div class="gm-tbar"><i></i></div><div class="gm-rq"></div><div class="gm-ro"></div></section>');
      view.appendChild(wrap);
      var tEl = wrap.querySelector(".gm-time"), bar = wrap.querySelector(".gm-tbar i");
      /* 計時含罰秒：答錯會直接扣掉時間 */
      var t0 = Date.now();
      function left() { return Math.max(0, SEC - (Date.now() - t0) / 1000 - P.pen); }
      var tick = setInterval(function () {
        if (P.over) return clearInterval(tick);
        var L = left();
        tEl.textContent = L.toFixed(1); bar.style.width = (L / SEC) * 100 + "%";
        if (L <= 0) { clearInterval(tick); finish(); }
      }, 100);
      paint();
      top();
      function paint() {
        if (P.over) return;
        if (P.i >= queue.length) { var more = GM.pool(ids, GM.S.lv, Date.now() + P.i, 20, { one: true, wrongs: 1 }); more.forEach(function (Q) { var o = opt4(Q, R); if (o) queue.push({ Q: Q, o: o }); }); }
        var it = queue[P.i]; if (!it) return finish();
        var q = wrap.querySelector(".gm-rq"), o = wrap.querySelector(".gm-ro");
        q.innerHTML = GM.figHtml(it.Q, "q", { nocalc: true }) + '<div class="gm-rqt">' + GM.qhtml(it.Q) + '</div><p class="gm-src">' + esc(GM.secShort(it.Q.id)) + "</p>";
        o.innerHTML = "";
        it.o.list.forEach(function (x) {
          var b = h('<button type="button" class="pen gm-rb">' + tx(esc(String(x.t))) + "</button>");
          b.onclick = function () { hit(b, x.ok); };
          o.appendChild(b);
        });
      }
      function hit(b, ok) {
        if (P.over) return;
        var all = wrap.querySelectorAll(".gm-rb"), it = queue[P.i];
        all.forEach(function (x) { x.disabled = true; });
        if (ok) { P.ok++; P.streak++; P.best = Math.max(P.best, P.streak); b.classList.add("ok-b"); }
        else {
          P.streak = 0; P.pen += 1.5; b.classList.add("bad-b");
          /* 答錯就把正確答案亮出來，不然錯過就不知道對的是哪個 */
          all.forEach(function (x, i) { if (it.o.list[i] && it.o.list[i].ok) x.classList.add("ok-b"); });
          wrap.classList.add("shake"); setTimeout(function () { wrap.classList.remove("shake"); }, 260);
        }
        wrap.querySelector(".gm-ok").textContent = P.ok;
        wrap.querySelector(".gm-st").textContent = P.streak;
        if (left() <= 0) return finish();
        setTimeout(function () { if (!P.over) { P.i++; paint(); } }, ok ? 170 : 700);
      }
      function finish() {
        if (P.over) return; P.over = true; clearInterval(tick);
        var rec = GM.best("race", P.ok, true);
        clear();
        view.appendChild(playBar(g, ""));
        view.appendChild(endCard("時間到", [
          { t: "答對 <b>" + P.ok + "</b> 題", big: true },
          { t: "最長連對 " + P.best + " 題" + (P.pen ? "・答錯扣了 " + P.pen.toFixed(1) + " 秒" : "") + (rec ? "・新紀錄！" : "") }
        ], [
          { t: "再來一次", go: true, f: function () { run(ids); } },
          { t: "回遊戲場", f: function () { goto("#hub"); } }
        ]));
        top();
      }
    }
  }

  /* ================================================================
     5. 我是出題老師
     ================================================================ */
  function teachGame() {
    var g = game("teach");
    var CNT = [3, 5, 8, 10], cnt = 5;
    startScreen(g, {
      goText: "開始挑題目",
      note: "挑好題目可以換題、刪掉，直式的題目還可以自己改數字。做好會給你一個連結，傳給同學就能作答。",
      options: function (host) {
        var r = h('<div class="gm-lv"><span class="dr-lab">題數</span><div class="dr-seg" role="group">' +
          CNT.map(function (n) { return '<button type="button" data-v="' + n + '">' + n + " 題</button>"; }).join("") + "</div></div>");
        function m() { r.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", +b.dataset.v === cnt); }); }
        r.querySelectorAll("button").forEach(function (b) { b.onclick = function () { cnt = +b.dataset.v; m(); }; });
        m(); host.appendChild(r);
      },
      go: function () {
        var ids = GM.ids(); if (!ids.length) { GM.say("還沒有範圍", "請先選範圍。"); return; }
        build(ids);
      }
    });
    function build(ids) {
      var seed = Date.now();
      var items = GM.pool(ids, GM.S.lv, seed, cnt, {}).map(function (Q) { return { Q: Q, id: Q.id, seed: Q.seed || 0, vi: Q.vi, ab: null }; });
      /* GM.pool 用自己的卷號，這裡要記下來才能重建 */
      items.forEach(function (it) { it.seed = it.Q.seed; });
      if (!items.length) { GM.say("出不來題目", "這個範圍出不了題，請換範圍。"); return; }
      var title = "", by = "";
      draw();
      function reroll(it) {
        var s = 100000 + Math.floor(Math.random() * 899999);
        var Q = D.make(it.id, s, GM.S.lv, it.vi == null ? null : [it.vi]);
        if (!Q) return;
        it.Q = Q; it.seed = s; it.ab = null; draw();
      }
      function draw() {
        clear();
        view.appendChild(playBar(g, items.length + " 題"));
        var box = h('<section class="sheet gm-teach"><p class="eyebrow">第一步</p><h2>挑題目</h2>' +
          '<p class="meta">不喜歡的換掉或刪掉；有「改數字」的可以自己出數字，答案和直式會跟著算好。</p><ol class="gm-tlist"></ol>' +
          '<div class="dr-btns"><button type="button" class="pen gm-add">加一題</button></div></section>');
        var list = box.querySelector(".gm-tlist");
        items.forEach(function (it, i) {
          var ed = GM.editable(it.Q);
          var li = h("<li><div class=\"gm-ti\"><div class=\"dq\"><span class=\"dq-t\">" + GM.qhtml(it.Q) + "</span>" + GM.figHtml(it.Q, "q") + GM.optsHtml(it.Q) + "</div>" +
            '<p class="gm-src">' + esc(GM.secShort(it.id)) + "・答案 " + tx(esc(GM.ansLine(it.Q))) + "</p></div>" +
            '<div class="gm-tb"><button type="button" data-a="rr">換一題</button>' + (ed ? '<button type="button" data-a="ed">改數字</button>' : "") +
            (items.length > 1 ? '<button type="button" data-a="del">刪除</button>' : "") + "</div><div class=\"gm-edit\" hidden></div></li>");
          li.querySelectorAll("[data-a]").forEach(function (b) {
            b.onclick = function () {
              var a = b.dataset.a;
              if (a === "rr") reroll(it);
              else if (a === "del") { items.splice(i, 1); draw(); }
              else editRow(li, it, ed);
            };
          });
          list.appendChild(li);
        });
        box.querySelector(".gm-add").onclick = function () {
          var more = GM.pool(ids, GM.S.lv, Date.now() + items.length, 1, {});
          if (more.length) { items.push({ Q: more[0], id: more[0].id, seed: more[0].seed, vi: more[0].vi, ab: null }); draw(); }
        };
        view.appendChild(box);
        view.appendChild(nameBox());
        top();
      }
      function editRow(li, it, ed) {
        var pan = li.querySelector(".gm-edit");
        if (!pan.hidden) { pan.hidden = true; return; }
        pan.innerHTML = '<p class="gm-ask">自己出數字</p><div class="gm-edrow">' +
          '<input class="dr-in gm-ea" inputmode="numeric" value="' + ed.a + '"><span>' + esc(ed.raw) + '</span>' +
          '<input class="dr-in gm-eb" inputmode="numeric" value="' + ed.b + '"><button type="button" class="pen go">算一下</button></div>' +
          '<p class="gm-eout meta"></p>';
        pan.hidden = false;
        var ea = pan.querySelector(".gm-ea"), eb = pan.querySelector(".gm-eb"), out = pan.querySelector(".gm-eout");
        pan.querySelector("button").onclick = function () {
          var r = GM.recalc(it.Q, +ea.value, +eb.value);
          if (r.err) { out.textContent = r.err; out.className = "gm-eout meta bad"; return; }
          it.Q = r.Q; it.ab = [+ea.value, +eb.value]; draw();
        };
      }
      function nameBox() {
        var box = h('<section class="sheet gm-teach2"><p class="eyebrow">第二步</p><h2>命名，然後傳出去</h2>' +
          '<div class="gm-two"><label>卷名<input class="dr-in gm-t1" maxlength="20" placeholder="例如：三上加減法小考"></label>' +
          '<label>出題老師<input class="dr-in gm-t2" maxlength="10" placeholder="你的名字"></label></div>' +
          '<div class="dr-btns"><button type="button" class="pen go gm-mk">做好了，給我連結</button>' +
          '<button type="button" class="pen gm-try">我自己先試做</button>' +
          '<button type="button" class="pen gm-pr">列印這張卷</button></div>' +
          '<div class="gm-link" hidden></div></section>');
        var t1 = box.querySelector(".gm-t1"), t2 = box.querySelector(".gm-t2");
        t1.value = title; t2.value = by;
        t1.oninput = function () { title = t1.value; }; t2.oninput = function () { by = t2.value; };
        function pack() { return { lv: GM.S.lv, title: t1.value || "挑戰卷", by: t2.value, list: items.map(function (it) { return { id: it.id, seed: it.seed, vi: it.Q.vi, ab: it.ab }; }) }; }
        box.querySelector(".gm-mk").onclick = function () {
          var url = location.href.split("#")[0] + GM.encode(pack());
          var lk = box.querySelector(".gm-link");
          lk.innerHTML = '<p class="gm-ask">把這個連結傳給同學</p><div class="gm-lrow"><input class="dr-in" readonly value="' + esc(url) + '"><button type="button" class="pen">複製</button></div>' +
            '<p class="meta">同學打開就會看到你出的這幾題，做完會看到分數。連結裡就是題目本身，不會用到伺服器。</p>';
          lk.hidden = false;
          var inp = lk.querySelector("input");
          lk.querySelector("button").onclick = function () {
            inp.select();
            var done = function () { lk.querySelector("button").textContent = "已複製"; };
            if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { try { document.execCommand("copy"); done(); } catch (e) {} });
            else { try { document.execCommand("copy"); done(); } catch (e) {} }
          };
          if (NB.qr && NB.qr.svg) { try { lk.appendChild(h('<div class="gm-qr">' + NB.qr.svg(url, { px: 3 }) + "<p class=\"meta\">用手機掃也可以</p></div>")); } catch (e) {} }
          if (window.innerWidth > 640) { inp.focus(); inp.select(); }
          reveal(lk, "start");
        };
        box.querySelector(".gm-try").onclick = function () { play(pack(), true); };
        box.querySelector(".gm-pr").onclick = function () { printPaper(pack()); };
        return box;
      }
    }
    /* 列印：題目一張、答案在後面 */
    function printPaper(P) {
      var old = document.querySelector(".gm-paper"); if (old) old.parentNode.removeChild(old);
      var qs = P.list.map(function (x) { return GM.rebuild(x, P.lv); }).filter(Boolean);
      var html = '<div class="gm-paper"><div class="gm-psheet"><h1>' + esc(P.title || "挑戰卷") + "</h1>" +
        '<p class="gm-pby">出題：' + esc(P.by || "島上的某位同學") + "　　姓名：＿＿＿＿＿　得分：＿＿＿</p><ol>" +
        qs.map(function (Q) { return "<li>" + GM.qhtml(Q) + GM.figHtml(Q, "q") + GM.optsHtml(Q) + "</li>"; }).join("") + "</ol></div>" +
        '<div class="gm-psheet"><h1>答案</h1><ol>' + qs.map(function (Q) { return "<li>" + tx(esc(GM.ansLine(Q))) + "</li>"; }).join("") + "</ol></div></div>";
      document.body.appendChild(h(html));
      document.body.classList.add("gm-printing");
      setTimeout(function () {
        window.print();
        setTimeout(function () { document.body.classList.remove("gm-printing"); var p = document.querySelector(".gm-paper"); if (p) p.parentNode.removeChild(p); }, 400);
      }, 120);
    }
    GM._print = printPaper;
  }

  /* ---------- 作答別人分享的卷（也用在「我自己先試做」） ---------- */
  function play(P, selfTest) {
    var qs = P.list.map(function (x) { return GM.rebuild(x, P.lv); }).filter(Boolean);
    if (!qs.length) { clear(); view.appendChild(h('<section class="sheet"><h2>這個連結壞掉了</h2><p class="meta">題目讀不出來，可能連結被截斷了。</p><div class="dr-btns"><a class="pen go" href="#hub">去遊戲場</a></div></section>')); return; }
    var S = { i: 0, ok: 0, wrong: [], answered: false };
    step();
    function step() {
      if (S.i >= qs.length) return done();
      var Q = qs[S.i];
      clear();
      view.appendChild(h('<div class="gm-pbar"><a class="back" href="#hub">← 遊戲場</a><b>' + esc(P.title || "挑戰卷") + "</b><span>第 " + (S.i + 1) + " / " + qs.length + " 題</span></div>"));
      var card = h('<section class="sheet gm-card gm-pop">' +
        '<p class="eyebrow">' + (selfTest ? "試做自己出的卷" : esc(P.by ? P.by + " 出的題目" : "同學出的題目")) + "</p>" +
        '<div class="gm-prog"><i style="width:' + (S.i / qs.length) * 100 + '%"></i></div>' +
        '<div class="dq"><span class="dq-t">' + GM.inHtml(Q) + "</span>" + GM.figHtml(Q, "q") + GM.mcHtml(Q) + "</div>" +
        '<div class="gm-fb" aria-live="polite"></div><div class="dr-btns"><button type="button" class="pen go gm-sub">送出</button></div></section>');
      view.appendChild(card);
      card.querySelectorAll(".dsel,.dmc").forEach(function (gr) {
        gr.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b || S.answered) return; gr.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); });
      });
      var sub = card.querySelector(".gm-sub");
      sub.onclick = function () {
        if (S.answered) { S.i++; S.answered = false; step(); return; }
        var r = GM.grade(card, Q), fb = card.querySelector(".gm-fb");
        if (r.empty) { fb.className = "gm-fb show"; fb.innerHTML = "<p>還沒作答喔。</p>"; return; }
        S.answered = true; GM.mark(card, Q, r.res);
        if (r.ok) S.ok++; else S.wrong.push(Q);
        fb.className = "gm-fb show " + (r.ok ? "ok" : "bad");
        fb.innerHTML = "<h3>" + (r.ok ? "答對了" : "再想想看") + "</h3>" + (r.ok ? "" : "<p>正確答案：" + tx(esc(GM.ansLine(Q))) + "</p>");
        if (r.ok) GM.spark(fb);
        var w = GM.figHtml(Q, "a", { aid: true }); if (w) fb.appendChild(h('<div class="gm-worked">' + w + "</div>"));
        sub.textContent = S.i + 1 >= qs.length ? "看分數" : "下一題"; hold(sub);
      };
      var f = card.querySelector("input"); if (f && window.innerWidth > 640) f.focus();
      top();
    }
    function done() {
      clear();
      view.appendChild(h('<div class="gm-pbar"><a class="back" href="#hub">← 遊戲場</a><b>' + esc(P.title || "挑戰卷") + "</b><span></span></div>"));
      view.appendChild(endCard(selfTest ? "試做完了" : "做完了", [
        { t: "答對 <b>" + S.ok + "</b> / " + qs.length + " 題", big: true },
        { t: P.by ? "這張卷是 " + esc(P.by) + " 出的" : "" }
      ], [
        { t: "再做一次", go: true, f: function () { play(P, selfTest); } },
        { t: selfTest ? "回去出題" : "我也要出一張", f: function () { goto("#teach"); } },
        { t: "回遊戲場", f: function () { goto("#hub"); } }
      ]));
      top();
    }
  }

  /* ================================================================
     6. 概念配對
     ================================================================ */
  function matchGame() {
    var g = game("match");
    startScreen(g, {
      goText: "發牌，開始翻",
      note: "十二張牌，六組配對。翻開算式，再找出它的答案。",
      bestText: function () { var b = GM.R.best.match; return b == null ? "" : "這台裝置最少翻牌：" + b + " 次"; },
      go: function () {
        var ids = need({ short: true }, 1, g.t); if (!ids) return;
        run(ids);
      }
    });
    function run(ids) {
      var R = D.rng(D.hash("match" + Date.now()));
      var raw = GM.pool(ids, GM.S.lv, Date.now(), 14, { short: true });
      /* 答案不能重複，不然會配對不出來 */
      var pairs = [], seen = {};
      raw.forEach(function (Q) {
        if (pairs.length >= 6) return;
        var a = GM.vals(Q)[0]; if (seen[a]) return; seen[a] = 1;
        pairs.push({ Q: Q, a: a });
      });
      if (pairs.length < 4) { GM.say("出不來題目", "這個範圍湊不出夠短的題目，請多選幾個小節或換個遊戲。"); return; }
      var cards = [];
      pairs.forEach(function (p, i) { cards.push({ p: i, k: "q" }); cards.push({ p: i, k: "a" }); });
      cards = R.shuffle(cards);
      var P = { flips: 0, done: 0, open: [], lock: false, n: pairs.length };
      GM.played("match");
      clear();
      view.appendChild(playBar(g, pairs.length + " 組"));
      var box = h('<section class="sheet gm-match"><div class="gm-mhead"><span>翻牌 <b class="gm-fl">0</b> 次</span><span>配對 <b class="gm-dn">0</b> / ' + pairs.length +
        '</span><span>用時 <b class="gm-tm">0:00</b></span></div><div class="gm-grid"></div></section>');
      var grid = box.querySelector(".gm-grid");
      cards.forEach(function (c, i) {
        var inner = c.k === "q" ? GM.qhtml(pairs[c.p].Q) : tx(esc(pairs[c.p].a));
        /* 牌面是 flex（置中），內容要再包一層才會照正常的文字排版流動，
           不然題幹的每一段都變成一個 flex item，被擠成一行一個字 */
        var n = GM.plain(c.k === "q" ? pairs[c.p].Q.q : pairs[c.p].a).length;
        var sz = n > 30 ? " s2" : n > 20 ? " s1" : "";
        var el = h('<button type="button" class="gm-mc" aria-pressed="false"><span class="gm-mb" aria-hidden="true"><i>?</i></span>' +
          '<span class="gm-mf gm-' + c.k + sz + '"><span class="gm-mi">' + inner + "</span></span></button>");
        el.onclick = function () { flip(c, el); };
        c.el = el; grid.appendChild(el);
      });
      view.appendChild(box);
      var T = GM.upTimer(box.querySelector(".gm-tm"));
      top();
      function flip(c, el) {
        if (P.lock || c.gone || el.classList.contains("up")) return;
        el.classList.add("up"); el.setAttribute("aria-pressed", "true");
        P.open.push({ c: c, el: el });
        if (P.open.length < 2) return;
        P.flips++; box.querySelector(".gm-fl").textContent = P.flips;
        var A = P.open[0], B = P.open[1];
        if (A.c.p === B.c.p && A.c.k !== B.c.k) {
          A.c.gone = B.c.gone = true;
          A.el.classList.add("hit"); B.el.classList.add("hit");
          P.done++; box.querySelector(".gm-dn").textContent = P.done;
          GM.spark(B.el);
          P.open = [];
          if (P.done >= P.n) setTimeout(win, 400);
          return;
        }
        P.lock = true;
        A.el.classList.add("no"); B.el.classList.add("no");
        setTimeout(function () {
          [A, B].forEach(function (x) { x.el.classList.remove("up", "no"); x.el.setAttribute("aria-pressed", "false"); });
          P.open = []; P.lock = false;
        }, 850);
      }
      function win() {
        T.stop();
        var rec = GM.best("match", P.flips, false);
        clear();
        view.appendChild(playBar(g, ""));
        var s = endCard("全部配對完成", [
          { t: "翻牌 <b>" + P.flips + "</b> 次", big: true },
          { t: "用時 " + GM.mmss(T.sec()) + (rec ? "・新紀錄！" : "") }
        ], [
          { t: "再發一局", go: true, f: function () { run(ids); } },
          { t: "回遊戲場", f: function () { goto("#hub"); } }
        ]);
        var ul = h('<ol class="gm-mlist"></ol>');
        pairs.forEach(function (p) { ul.appendChild(h("<li>" + GM.qhtml(p.Q, [p.a], "ok") + "</li>")); });
        s.appendChild(h('<p class="meta">這一局的題目</p>')); s.appendChild(ul);
        view.appendChild(s);
        top();
      }
    }
  }

  /* ================================================================
     大廳
     ================================================================ */
  function hub() {
    clear();
    /* 角落的塗鴉：小紅人在拍球。手繪感，不要又變成一張宣傳圖 */
    var doodle = '<span class="gm-doodle" aria-hidden="true"><svg viewBox="-19 -31 51 44">' +
      '<g fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">' +
      '<path d="M-12 0C-16-12-6-24 1-22C11-24 16-10 12 0C6 3-7 3-12 0Z" fill="var(--p1)"/>' +
      '<path d="M-6 3v5M5 3v5"/>' +
      '<circle cx="-4" cy="-14" r="4.2" fill="var(--paper)" stroke-width="1.2"/><circle cx="5" cy="-15" r="4.2" fill="var(--paper)" stroke-width="1.2"/>' +
      '<circle cx="-3" cy="-13" r="1.8" fill="var(--ink)" stroke="none"/><circle cx="6" cy="-14" r="1.8" fill="var(--ink)" stroke="none"/>' +
      '<path d="M-3 -7q3 3 7 0" stroke-width="1.5"/>' +
      '<path d="M14 -15q7 -5 10 5" stroke="var(--soft)" stroke-width="1.2" stroke-dasharray="2 3"/>' +
      '<circle cx="24" cy="-1" r="6" fill="var(--p4)"/><path d="M18.6 -3.6q5.4 2.4 10.8 0M24 -7v12" stroke="var(--ink)" stroke-width="1"/>' +
      "</g></svg></span>";
    var head = h('<header class="gm-head">' + doodle + '<p class="eyebrow">數光島工具箱</p>' +
      '<h1 class="title">遊戲場</h1>' +
      '<p class="lead">島上的題目拿來玩。六個遊戲跟無限出題同一個題庫，一到六年級都有。</p></header>');
    view.appendChild(head);
    var panel = h('<section class="sheet gm-hubset"><div class="gm-range"><span class="dr-lab">現在的範圍</span><b class="gm-rt"></b><button type="button" class="pen gm-chg">換範圍</button></div><div class="gm-setpan" hidden></div></section>');
    var rt = panel.querySelector(".gm-rt"), pan = panel.querySelector(".gm-setpan");
    function paint() { rt.textContent = rangeText() + "・" + GM.lvName(GM.S.lv); }
    paint();
    panel.querySelector(".gm-chg").onclick = function () {
      if (pan.firstChild) { pan.hidden = !pan.hidden; return; }
      pan.appendChild(GM.lvRow(paint));
      pan.appendChild(GM.picker(paint, { note: "選好的範圍，六個遊戲都會用這一份。" }));
      pan.hidden = false; reveal(pan, "start");
    };
    view.appendChild(panel);
    var list = h('<div class="gm-list"></div>');
    GAMES.forEach(function (gg) {
      var b = bestLine(gg.id);
      list.appendChild(h('<a class="gm-gc" href="#' + gg.id + '"><span class="gm-gic">' + ic(gg.ic) + "</span>" +
        '<span class="gm-gx"><b>' + esc(gg.t) + "</b><p>" + esc(gg.d) + "</p></span>" +
        (b ? '<span class="gm-gb">' + esc(b) + "</span>" : "") + "</a>"));
    });
    view.appendChild(list);
    view.appendChild(h('<p class="meta gm-tail">要整張 A4 的練習卷，去<a href="drill.html#print">無限出題</a>；想一題一題作答，用<a href="drill.html#online">線上練習</a>。成績和印章只留在這台裝置，換一台就沒有了。</p>'));
    top();
  }
  function bestLine(id) {
    var B = GM.R.best;
    if (id === "fix" && B.fix != null) return "最好：判斷正確 " + B.fix + " / 10";
    if (id === "hunt" && B.hunt != null) return "最好：抓到 " + B.hunt + " 成";
    if (id === "race" && B.race != null) return "最好：60 秒 " + B.race + " 題";
    if (id === "match" && B.match != null) return "最少：翻 " + B.match + " 次";
    if (id === "card") { var n = Object.keys(GM.R.stamp).length; return n ? "已蓋 " + n + " 個印章" : ""; }
    return "";
  }

  /* ---------- 路由 ---------- */
  var ROUTE = { hub: hub, fix: fixGame, hunt: huntGame, card: cardGame, race: raceGame, teach: teachGame, match: matchGame };
  var lastHash = null;
  function route() {
    var hs = location.hash || "#hub";
    if (hs === lastHash) return;
    lastHash = hs;
    var p = GM.decode(hs);
    if (p) { clear(); play(p, false); return; }
    var m = /^#([a-z]+)/.exec(hs), fn = m && ROUTE[m[1]];
    (fn || hub)();
  }
  window.addEventListener("hashchange", route);
  route();
  /* 鍵盤：Enter 等於按下主要按鈕 */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.isComposing) return;
    var t = e.target;
    if (t && (t.tagName === "BUTTON" || t.tagName === "A")) return;
    var b = view.querySelector(".gm-fixin button:not([disabled]), .gm-fb .dr-btns button, .gm-sub, .gm-go");
    if (b) { e.preventDefault(); b.click(); }
  });
})();
