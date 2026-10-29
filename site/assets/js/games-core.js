/* 遊戲場：六個小遊戲的共用引擎（純前端，不呼叫後端、不登入）
   題目全部來自無限出題的題庫（DR.make），所以 412 個小節都能玩。
   這一支負責四件事：
   1. 錯答產生器 GM.wrongs：照國小常見的錯誤做出「很像但是錯」的答案，並且說得出錯在哪裡
   2. 題目池 GM.pool：依選到的小節抽題，可以篩「只有一格」「答案很短」等條件
   3. 共用介面：範圍選擇器、難度、計時器、紀錄（localStorage）
   4. 改數字重算 GM.recalc：直式題可以讓學生自己改數字，答案與直式跟著變 */
(function () {
  "use strict";
  var D = window.DR, NB = window.NB, GM = (window.GM = {});
  var BY = {}; NB.flat.forEach(function (o) { BY[o.id] = o; });
  GM.BY = BY;
  GM.h = function (s) { return NB.h(s); };
  GM.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  GM.tx = function (s) { return NB.tx(String(s).replace(/\\frac\{/g, "\\dfrac{")); };
  GM.secName = function (id) { var o = BY[id]; return o ? o.sem + " " + o.num + " " + o.title : id; };
  GM.secShort = function (id) { var o = BY[id]; return o ? o.num + " " + o.title : id; };
  GM.lvName = function (lv) { return lv <= 1 ? "基礎" : lv === 2 ? "標準" : "挑戰"; };

  /* ---------- 紀錄：只存在這台裝置 ---------- */
  var KEY = "nb-games";
  function ld() { try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  function sv() { try { localStorage.setItem(KEY, JSON.stringify(GM.R)); } catch (e) {} }
  GM.R = ld();
  GM.R.best = GM.R.best || {};       /* 各遊戲最佳成績 */
  GM.R.stamp = GM.R.stamp || {};     /* 島民挑戰卡的印章：鍵是「學期+第幾章」 */
  GM.R.play = GM.R.play || {};       /* 各遊戲玩過幾次 */
  GM.save = sv;
  GM.best = function (k, v, bigger) {
    var o = GM.R.best[k];
    if (o == null || (bigger ? v > o : v < o)) { GM.R.best[k] = v; sv(); return true; }
    return false;
  };
  GM.played = function (k) { GM.R.play[k] = (GM.R.play[k] || 0) + 1; sv(); };

  /* ---------- 共用設定：選到的小節與難度（跟無限出題分開存，兩邊互不干擾） ---------- */
  GM.S = Object.assign({ sel: [], lv: 2, grade: 3 }, GM.R.set || {});
  GM.S.sel = (GM.S.sel || []).filter(D.has);
  if (!GM.S.grade) { try { GM.S.grade = parseInt(localStorage.getItem("currentGrade")) || 3; } catch (e) { GM.S.grade = 3; } }
  GM.setSave = function () { GM.R.set = { sel: GM.S.sel, lv: GM.S.lv, grade: GM.S.grade }; sv(); };
  /* 沒選範圍時的預設：拿該年級第一章當暖身 */
  GM.ids = function () {
    if (GM.S.sel.length) return GM.S.sel.filter(D.has);
    var out = [];
    NB.cat.forEach(function (sem) { if (sem.grade !== GM.S.grade) return; sem.chs.forEach(function (c) { c.secs.forEach(function (o) { if (D.has(o.id)) out.push(o.id); }); }); });
    return out;
  };

  /* ---------- 小工具 ---------- */
  function decs(x) { var s = String(x); var i = s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; }
  function rd(x, k) { var p = Math.pow(10, k); return Math.round(x * p) / p; }
  var fmt = D.fmt;
  /* 去掉 LaTeX，用來量長度 */
  GM.plain = function (s) { return String(s == null ? "" : s).replace(/\$[^$]*\$/g, "□").replace(/\[\?\]/g, "＿").replace(/<[^>]*>/g, ""); };

  /* ---------- 正解的顯示字串 ---------- */
  GM.vals = function (Q) { return Q.b.map(function (b) { return String(D.ansTex(b)); }); };
  GM.ansLine = function (Q) { return GM.vals(Q).join("、"); };

  /* ---------- 錯答產生器 ---------- */
  /* 直式的 a、b 是字串（可能帶小數），減號是「−」不是「-」 */
  function cnum(x) { var v = parseFloat(String(x).replace(/,/g, "")); return isFinite(v) ? v : null; }
  function cop(op) { return op === "−" || op === "-" ? "-" : op; }
  function cint(x) { return /^\d+$/.test(String(x)); }
  GM.cnum = cnum; GM.cop = cop;
  /* 加法不進位：每一位各自相加只寫個位，最左邊那一位會整個寫下來（例如 95+87 寫成 172） */
  function noCarry(a, b) {
    var A = String(a), B = String(b), i = A.length - 1, j = B.length - 1, o = [];
    while (i >= 0 || j >= 0) {
      var s = (+(A[i] || 0)) + (+(B[j] || 0));
      o.unshift(i <= 0 && j <= 0 ? s : s % 10);
      i--; j--;
    }
    return +o.join("");
  }
  /* 減法不借位：每一位都大減小 */
  function noBorrow(a, b) {
    var A = String(a), B = String(b), i = A.length - 1, j = B.length - 1, o = [];
    while (i >= 0 || j >= 0) { var x = +(A[i] || 0), y = +(B[j] || 0); o.unshift(Math.abs(x - y)); i--; j--; }
    return +o.join("");
  }
  /* 乘一位數忘記進位：每一位乘完只寫個位，最左邊那一位整個寫下來（例如 67×9 寫成 543） */
  function mulNoCarry(a, b) {
    if (b < 2 || b > 9) return null;
    var A = String(a), o = "";
    for (var i = 0; i < A.length; i++) { var p = (+A[i]) * b; o += i === 0 ? String(p) : String(p % 10); }
    if (/^0/.test(o)) return null;
    return +o;
  }
  /* 把最後兩位數字對調（位值顛倒） */
  function swap2(a) {
    var s = String(Math.abs(a)), i = s.indexOf("."), t = i < 0 ? s : s.slice(0, i), tail = i < 0 ? "" : s.slice(i);
    if (t.length < 2) return null;
    var c = t.split(""), n = c.length;
    if (c[n - 1] === c[n - 2]) return null;
    var x = c[n - 1]; c[n - 1] = c[n - 2]; c[n - 2] = x;
    if (c[0] === "0") return null;
    var v = +(c.join("") + tail);
    return a < 0 ? -v : v;
  }
  /* 字串答案（例如 3:45、幾點幾分）：把最後一段數字加減一點 */
  function strNudge(s, k) {
    var m = /(\d+)(\D*)$/.exec(s); if (!m) return null;
    var v = +m[1] + k; if (v < 0) return null;
    var w = String(v); if (m[1].length > 1 && w.length < m[1].length) w = new Array(m[1].length - w.length + 1).join("0") + w;
    return s.slice(0, m.index) + w + m[2];
  }
  function fdisp(n, d, mixed) {
    if (!(d > 0) || n < 0 || n % 1 || d % 1) return null;
    if (d === 1) return String(n);
    if (mixed && n > d) { var w = Math.floor(n / d), r = n % d; return "$" + (r ? w + "\\frac{" + r + "}{" + d + "}" : String(w)) + "$"; }
    return "$\\frac{" + n + "}{" + d + "}$";
  }
  /* 分數的經典錯誤：從題幹讀出兩個分數，先驗算「正解真的是它們的和（差）」再加，說明才不會亂講。
     例如 5/10＋4/10 的正解是 9/10，分母也相加就會得到 9/20。 */
  function frWrongs(Q, right, mixed) {
    var out = [], fr = [], re = /\\frac\{(\d+)\}\{(\d+)\}/g, m, q = String(Q.q);
    while ((m = re.exec(q))) fr.push([+m[1], +m[2]]);
    if (fr.length !== 2 || !fr[0][1] || !fr[1][1]) return out;
    var A = fr[0], B = fr[1];
    function near(v) { return Math.abs(v - right) < 1e-9; }
    function push(n, d, why) { if (!(d > 0) || n < 0 || near(n / d)) return; var t = fdisp(n, d, mixed); if (t) out.push({ t: t, why: why }); }
    var s = D.fadd(A, B); if (near(s[0] / s[1])) push(A[0] + B[0], A[1] + B[1], "分母也跟著相加了");
    var u = D.fsub(A, B); if (near(u[0] / u[1]) && A[1] !== B[1] && A[0] > B[0]) push(A[0] - B[0], Math.abs(A[1] - B[1]), "分子和分母各自相減了");
    return out;
  }
  /* 一個空格的錯答候選，前面的比較像「真的會犯的錯」
     bix 是這是第幾格：直式的錯誤（忘記進位等）只會發生在「算出來的那一格」，也就是第一格 */
  function wrongOne(Q, b, bix) {
    var out = [], seen = {};
    /* tier 1 是「結構性的錯」（忘記進位、用錯運算…），最值得拿來教，排在前面 */
    function add(t, why, tier) {
      if (t == null || t === "" || typeof t === "number" && !isFinite(t)) return;
      t = String(t); if (!t || /NaN|Infinity|e[+-]/.test(t) || seen[t]) return;
      seen[t] = 1; out.push({ t: t, why: why, tier: tier || 2 });
    }
    if (b.k === "n" && typeof b.a === "number") {
      var a = b.a, dp = decs(a), c = Q.calc, pos = a >= 0;
      function addN(v, why, tier) {
        if (v == null || !isFinite(v)) return;
        v = rd(v, Math.max(dp, 2)); if (decs(v) > dp + 1) return;
        if (pos && v < 0) return; if (v === a) return;
        if (String(Math.abs(v)).replace(".", "").length > String(Math.abs(a)).replace(".", "").length + 2) return;
        add(fmt(v), why, tier);
      }
      if (bix === 0) frWrongs(Q, a, false).forEach(function (w) { add(w.t, w.why, 1); });
      /* 用題幹裡的數字湊出「用錯運算」的錯答。只有先驗算過關係成立才加，所以說明一定是對的 */
      if (bix === 0 && Q.b.length === 1) {
        var qt = String(Q.q), ns = (qt.match(/\d+/g) || []).map(Number).filter(function (x) { return x > 0 && x < 100000; });
        if (ns.length >= 2 && ns.length <= 4 && a % 1 === 0) {
          var prod = ns.reduce(function (t, x) { return t * x; }, 1), sum = ns.reduce(function (t, x) { return t + x; }, 0);
          var dropLast = ns.slice(0, -1);
          if (prod === a) {
            /* 三個數以上相乘（體積、連乘）才有「漏掉一個因數」這種錯；兩個數的話那只是把題目抄下來 */
            if (ns.length >= 3) addN(dropLast.reduce(function (t, x) { return t * x; }, 1), "少乘了一個數", 1);
            addN(sum, "用加法算了，這一題要用乘法", 1);
          } else if (sum === a) {
            addN(prod, "用乘法算了，這一題要用加法", 1);
            if (ns.length > 2) addN(dropLast.reduce(function (t, x) { return t + x; }, 0), "少加了一個數", 1);
          } else if (ns.length === 2) {
            if (a === ns[0] - ns[1]) addN(ns[0] + ns[1], "用加法算了，這一題要用減法", 1);
            if (a === ns[0] * ns[1] || a === ns[0] / ns[1]) addN(ns[0] - ns[1], "用減法算了，看清楚是乘還是除", 1);
          }
        }
        /* 正方體、正方形：題幹只有一個數，但常見錯誤很固定 */
        if (ns.length === 1 && a % 1 === 0) {
          var k1 = ns[0];
          if (a === k1 * k1 * k1) addN(k1 * k1, "只乘了兩次，體積要長×寬×高乘三次", 1);
          if (a === k1 * k1) { if (/正方形/.test(qt)) addN(4 * k1, "算成周長了，面積要邊長×邊長", 1); addN(k1 + k1, "算成加法了，面積要用乘法", 1); }
          if (a === 4 * k1 && /正方形/.test(qt)) addN(k1 * k1, "算成面積了，周長是邊長×4", 1);
          if (a === 6 * k1 * k1) addN(k1 * k1, "只算了一個面，正方體有 6 個面", 1);
        }
      }
      if (bix === 0 && c && cint(c.a) && cint(c.b)) {
        var ca = cnum(c.a), cb = cnum(c.b), co = cop(c.op);
        if (co === "+") addN(noCarry(ca, cb), "直式加法忘記進位", 1);
        if (co === "-") addN(noBorrow(ca, cb), "直式減法忘記借位，每一位都大減小", 1);
        if (co === "×") {
          if (cb > 9) addN(ca * (cb % 10), "只乘了個位數，十位忘記乘", 1);
          else addN(mulNoCarry(ca, cb), "乘出來的進位忘記加上去", 1);
          if (cb % 10 === 0 || ca % 10 === 0) addN(a / 10, "後面少寫了一個 0", 1);
        }
        if (co === "÷") { addN(a + 1, "商多算了 1", 1); addN(a - 1, "商少算了 1", 1); if (cb && cb !== a) addN(cb, "把除數抄成答案了"); }
      } else if (bix === 0 && c && cnum(c.a) != null && cnum(c.b) != null && dp > 0) {
        var co2 = cop(c.op);
        if (co2 === "+" || co2 === "-") addN(cnum(c.a) + (co2 === "+" ? 1 : -1) * cnum(c.b) * 10, "小數點沒有對齊就直接算");
      }
      addN(a + 1, "差 1，再數一次就發現了");
      if (a - 1 !== 0 || a < 1) addN(a - 1, "差 1，再數一次就發現了");   /* 答案是 1 的時候，0 不像學生會寫的答案 */
      if (Math.abs(a) >= 10) { addN(a + 10, "位值看錯，差了 10"); addN(a - 10, "位值看錯，差了 10"); }
      addN(swap2(a), "數字前後顛倒了");
      if (dp > 0) { addN(a * 10, "小數點位置錯了"); addN(a / 10, "小數點位置錯了"); }
      else if (Math.abs(a) >= 20 && a % 10 === 0) addN(a / 10, "少算了一個 10 倍");
      addN(a + 2, "差了一點點"); addN(a - 2, "差了一點點");
    } else if (b.k === "n") {
      var s0 = String(b.a);
      add(strNudge(s0, 1), "差了一點，再算一次");
      add(strNudge(s0, -1), "差了一點，再算一次");
      add(strNudge(s0, 10), "位值看錯了");
      add(strNudge(s0, -10), "位值看錯了");
    } else if (b.k === "f") {
      var n = b.n, d = b.d, mx = !!b.mixed;
      function addF(nn, dd, why, tier) { if (nn * d === n * dd) return; var t = fdisp(nn, dd, mx); if (t) add(t, why, tier); }
      if (bix === 0) frWrongs(Q, n / d, mx).forEach(function (w) { add(w.t, w.why, 1); });
      if (mx) addF(b.w + b.r, b.d, "整數部分沒有乘分母就直接加上去", 1);
      if (n !== d && n > 0) addF(d, n, "分子和分母寫反了", 1);
      addF(n + 1, d, "分子算錯 1"); addF(n - 1, d, "分子算錯 1");
      addF(n, d + 1, "分母算錯 1"); addF(n, d - 1, "分母算錯 1");
    } else if (b.k === "s" && b.o) {
      var why = D.CMP.indexOf(b.o[0]) >= 0 ? "大小比反了" : "選錯了";
      b.o.forEach(function (o) { if (String(o) !== String(b.a)) add(o, why); });
    } else if (b.k === "c" && Q.opts) {
      for (var i = 0; i < Q.opts.length; i++) if (i !== b.a) add("(" + "ABCDEF"[i] + ")", "選錯了");
    }
    return out;
  }
  /* 整題一起看才找得到的錯：有餘數的除法最常見的就是「沒有除完」 */
  function wrongQ(Q) {
    var out = [], c = Q.calc;
    if (c && c.rem && Q.b.length === 2 && Q.b[0].k === "n" && Q.b[1].k === "n" && typeof Q.b[0].a === "number" && typeof Q.b[1].a === "number") {
      var b = cnum(c.b), q0 = Q.b[0].a, r0 = Q.b[1].a;
      if (b && q0 > 1) out.push({ vals: [fmt(q0 - 1), fmt(r0 + b)], bi: 1, t: fmt(r0 + b), why: "餘數比除數大，表示還可以再除一次", tier: 1 });
      if (b && r0 > 0 && b - r0 !== r0) out.push({ vals: [fmt(q0), fmt(b - r0)], bi: 1, t: fmt(b - r0), why: "餘數算成「還差多少才分得完」了", tier: 1 });
    }
    return out;
  }
  /* 整題的錯答：把其中一格換成錯的，其他格保持正確。
     回傳 [{vals:每一格要顯示的字串, bi:錯在第幾格, t:錯的那一格, why:錯在哪裡}]，前面的比較像真的會犯的錯。 */
  GM.wrongs = function (Q) {
    var ok = GM.vals(Q), key = ok.join("\u0001"), seen = {}, out = [], lists = [];
    wrongQ(Q).forEach(function (w) { var k = w.vals.join("\u0001"); if (k === key || seen[k]) return; seen[k] = 1; out.push(w); });
    Q.b.forEach(function (b, i) { lists.push({ i: i, w: wrongOne(Q, b, i) }); });
    var max = 0; lists.forEach(function (L) { max = Math.max(max, L.w.length); });
    for (var r = 0; r < max; r++) {
      for (var j = 0; j < lists.length; j++) {
        var w = lists[j].w[r]; if (!w) continue;
        var vals = ok.slice(); vals[lists[j].i] = w.t;
        var k = vals.join("\u0001"); if (k === key || seen[k]) continue; seen[k] = 1;
        out.push({ vals: vals, bi: lists[j].i, t: w.t, why: w.why, tier: w.tier || 2 });
      }
    }
    /* 排序：結構性的錯（忘記進位、用錯運算…）優先，其次是位數跟正解一樣的（位數差一截太好猜） */
    function dg(s) { return String(s).replace(/[^\d]/g, "").length; }
    var g = [[], [], [], []];
    out.forEach(function (w) { g[((w.tier || 2) - 1) * 2 + (dg(w.t) === dg(ok[w.bi]) ? 0 : 1)].push(w); });
    return g[0].concat(g[1], g[2], g[3]);
  };
  /* 抽一個錯答（從最像的前幾個裡面挑） */
  GM.aWrong = function (Q, R) { var w = GM.wrongs(Q); if (!w.length) return null; return w[R.int(0, Math.min(2, w.length - 1))]; };

  /* ---------- 題目：篩選與抽題 ---------- */
  GM.sig = function (Q) { return Q.id + "|" + Q.q + "|" + (Q.opts || []).join() + "|" + Q.b.map(function (b) { return b.a != null ? b.a : b.n + "/" + b.d; }).join(); };
  /* 答案是「學生自己算出來的數」（不是選擇題），遊戲才能把答案填進去給學生判斷 */
  function produced(Q) { return Q.b.length > 0 && Q.b.length <= 2 && Q.b.every(function (b) { return b.k === "n" || b.k === "f" || b.k === "s"; }); }
  GM.fits = function (Q, f) {
    if (!Q || !Q.b) return false;
    f = f || {};
    if (f.produced && !produced(Q)) return false;
    if (f.judge && !produced(Q) && !(Q.opts && Q.b.length === 1)) return false;
    if (f.one && !(Q.b.length === 1 && (Q.b[0].k === "n" || Q.b[0].k === "f" || Q.b[0].k === "s" || Q.opts))) return false;
    if (f.nofig && (Q.fig || Q.figFn || Q.calc)) return false;
    /* 不畫圖的遊戲（修補計算機、錯誤獵人、快速反應賽）不能收「一定要看圖才答得出來」的題。
       fig 照專案慣例就是題目必要的圖；calc（直式）光看文字就答得出來，所以留著 */
    if (f.nopic && (Q.fig || Q.figFn)) return false;
    if (f.noopts && Q.opts) return false;
    if (f.short) {
      if (Q.opts) return false;
      if (Q.b.length !== 1) return false;
      /* 配對的牌放不下圖，少了圖「量杯裡有 □ 毫升」這種題根本答不出來，直接不收 */
      if (Q.fig || Q.figFn) return false;
      if (GM.plain(Q.q).length > 44) return false;
      if (GM.plain(GM.vals(Q)[0]).length > 7) return false;
    }
    if (f.wrongs && GM.wrongs(Q).length < f.wrongs) return false;
    return true;
  };
  /* 從 ids 抽 n 題，符合 f 的條件；抽不到就回傳比較少的題數 */
  GM.pool = function (ids, lv, seed, n, f) {
    if (!ids || !ids.length) return [];
    var R = D.rng(D.hash("pool|" + seed + "|" + n)), out = [], used = {}, guard = 0, lim = n * 40 + 200;
    while (out.length < n && guard < lim) {
      guard++;
      var id = R.pick(ids), s = 100000 + R.int(0, 899999), Q;
      try { Q = D.make(id, s, lv); } catch (e) { continue; }
      if (!GM.fits(Q, f)) continue;
      var k = GM.sig(Q); if (used[k]) continue; used[k] = 1;
      out.push(Q);
    }
    return out;
  };
  /* 這些小節裡面，有哪些做得出這種遊戲的題目 */
  GM.playable = function (ids, lv, f) {
    return ids.filter(function (id) {
      for (var i = 0; i < 10; i++) { var Q; try { Q = D.make(id, 70001 + i * 13, lv); } catch (e) { continue; } if (GM.fits(Q, f)) return true; }
      return false;
    });
  };

  /* ---------- 題目轉 HTML ---------- */
  /* 把 vals 填進題幹的空格裡（cls 可以標紅／標綠）；沒給 vals 就畫空白格 */
  GM.qhtml = function (Q, vals, cls) {
    var parts = String(Q.q).split("[?]"), bi = Q.b.map(function (b, i) { return i; }).filter(function (i) { return Q.b[i].k !== "c"; }), k = 0, out = "";
    parts.forEach(function (p, j) {
      out += GM.tx(p);
      if (j >= parts.length - 1) return;
      var i = bi[k++]; if (i == null) return;
      var b = Q.b[i], u = b.u || "", nx = (parts[j + 1] || "").replace(/^[\s　]+/, "");
      if (u && nx.indexOf(u) === 0) u = "";
      var v = vals ? vals[i] : null;
      out += '<span class="gm-v' + (cls ? " " + cls : "") + (v == null ? " gm-blank" : "") + '">' + (v == null ? "　" : GM.tx(String(v))) + "</span>" + (u ? '<span class="gm-u">' + GM.esc(u) + "</span>" : "");
    });
    return out;
  };
  GM.optsHtml = function (Q, pick) {
    if (!Q.opts) return "";
    return '<div class="gm-opts">' + Q.opts.map(function (o, i) {
      return '<span class="gm-opt' + (pick === i ? " on" : "") + '"><b>(' + "ABCD"[i] + ")</b>" + GM.tx(o) + "</span>";
    }).join("") + "</div>";
  };
  /* 題目的圖（圖形、直式、解題小幫手）。md "q" 題目版、"a" 答案版 */
  GM.figHtml = function (Q, md, opt) {
    var s = "", f = Q.figFn ? Q.figFn(md) : Q.fig;
    if (f) s += '<div class="gm-fig">' + f + "</div>";
    if (Q.calc && !(opt && opt.nocalc)) { try { s += '<div class="gm-fig gm-calc">' + D.V.svg(Q.calc, md, { mode: "filled", grid: "cell", pv: true, carry: true, u: 24, k: 0.8 }) + "</div>"; } catch (e) {} }
    if (opt && opt.aid) { var a = Q.aidFn ? Q.aidFn(md) : Q.aid; if (a) s += '<div class="gm-aid"><span class="gm-aidh">解題小幫手</span>' + a + "</div>"; }
    return s;
  };
  GM.hasAid = function (Q) { return !!(Q.aid || Q.aidFn); };

  /* ---------- 作答用的空格（跟無限出題的線上練習一樣） ---------- */
  GM.inHtml = function (Q) {
    var parts = String(Q.q).split("[?]"), bi = Q.b.map(function (b, i) { return i; }).filter(function (i) { return Q.b[i].k !== "c"; }), k = 0, out = "";
    parts.forEach(function (p, j) {
      out += GM.tx(p);
      if (j >= parts.length - 1) return;
      var i = bi[k++]; if (i == null) return;
      var b = Q.b[i], u = b.u || "", nx = (parts[j + 1] || "").replace(/^[\s　]+/, "");
      if (u && nx.indexOf(u) === 0) u = "";
      if (b.k === "n") out += '<input class="din" data-b="' + i + '" inputmode="decimal" autocomplete="off" aria-label="第 ' + (i + 1) + ' 格">' + GM.esc(u);
      else if (b.k === "f") out += '<span class="dinf" data-b="' + i + '"><input class="din w" data-p="w" inputmode="numeric" aria-label="整數部分（沒有就空白）"><span><input class="din sm" data-p="n" inputmode="numeric" aria-label="分子"><em></em><input class="din sm" data-p="d" inputmode="numeric" aria-label="分母"></span></span>' + GM.esc(u);
      else if (b.k === "s") out += '<span class="dsel" data-b="' + i + '">' + b.o.map(function (o) { return '<button type="button" data-v="' + GM.esc(o) + '" aria-pressed="false">' + GM.esc(o) + "</button>"; }).join("") + "</span>" + GM.esc(u);
    });
    return out;
  };
  GM.mcHtml = function (Q) {
    if (!Q.opts) return "";
    return '<div class="dmc" data-b="0">' + Q.opts.map(function (o, i) { return '<button type="button" data-v="' + i + '" aria-pressed="false"><b>(' + "ABCD"[i] + ")</b>" + GM.tx(o) + "</button>"; }).join("") + "</div>";
  };
  GM.readVal = function (card, b, i) {
    if (b.k === "n") { var e = card.querySelector('input[data-b="' + i + '"]'); return e ? e.value : ""; }
    if (b.k === "f") { var w = card.querySelector('.dinf[data-b="' + i + '"]'); if (!w) return {}; return { w: w.querySelector('[data-p="w"]').value, n: w.querySelector('[data-p="n"]').value, d: w.querySelector('[data-p="d"]').value }; }
    var sel = card.querySelector((b.k === "c" ? ".dmc" : '.dsel[data-b="' + i + '"]') + ' [aria-pressed="true"]');
    return sel ? sel.dataset.v : null;
  };
  /* 批改一張作答卡：回傳 {ok:全對, res:[每格對不對], empty:都沒填} */
  GM.grade = function (card, Q) {
    var ok = true, empty = true;
    var res = Q.b.map(function (b, i) {
      var v = GM.readVal(card, b, i);
      if (v != null && v !== "" && !(typeof v === "object" && !v.n && !v.d && !v.w)) empty = false;
      var r = D.check(b, v); if (!r) ok = false; return r;
    });
    return { ok: ok, res: res, empty: empty };
  };
  /* 作答後把對錯標在空格上 */
  GM.mark = function (card, Q, res) {
    Q.b.forEach(function (b, i) {
      var el = b.k === "n" ? card.querySelector('input[data-b="' + i + '"]') : b.k === "f" ? card.querySelector('.dinf[data-b="' + i + '"]') : null;
      if (el) (b.k === "f" ? el.querySelectorAll("input") : [el]).forEach(function (x) { x.classList.add(res[i] ? "ok-b" : "bad-b"); x.readOnly = true; });
      if (b.k === "s" || b.k === "c") {
        var g = b.k === "c" ? card.querySelector(".dmc") : card.querySelector('.dsel[data-b="' + i + '"]');
        if (g) g.querySelectorAll("button").forEach(function (x) {
          var right = b.k === "c" ? +x.dataset.v === b.a : x.dataset.v === String(b.a);
          if (right) x.classList.add("ok-b"); else if (x.getAttribute("aria-pressed") === "true") x.classList.add("bad-b");
          x.disabled = true;
        });
      }
    });
  };

  /* ---------- 改數字重算（直式題才有） ---------- */
  /* 條件嚴格：只有一格數字答案、直式的兩個數都是整數、而且題幹裡找得到這兩個數 */
  GM.editable = function (Q) {
    var c = Q.calc; if (!c || !c.op || c.rem || c.tz) return null;
    if (!(Q.b.length === 1 && Q.b[0].k === "n" && typeof Q.b[0].a === "number")) return null;
    if (!cint(c.a) || !cint(c.b)) return null;                       /* 只讓學生改整數，比較不會改出怪題 */
    var a = cnum(c.a), b = cnum(c.b), op = cop(c.op);
    if (!(a >= 0) || !(b > 0)) return null;
    var v = calcOf(op, a, b); if (v == null || Math.abs(v - Q.b[0].a) > 1e-9) return null;
    var q = String(Q.q);
    if (!swapNums(q, a, b, a, b)) return null;    /* 換得動才算可以改 */
    return { op: op, raw: c.op, a: a, b: b };
  };
  function calcOf(op, a, b) {
    op = cop(op);
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "×") return a * b;
    if (op === "÷") return b && a % b === 0 ? a / b : null;
    return null;
  }
  GM.calcOf = calcOf;
  /* 在題幹裡找一個「完整的數」：前後不能再接數字或小數點，免得 29 被找到「129」裡面去 */
  function findNum(q, s, from) {
    var i = q.indexOf(s, from || 0);
    while (i >= 0) {
      var bf = i > 0 ? q.charAt(i - 1) : "", af = i + s.length < q.length ? q.charAt(i + s.length) : "";
      if (!/[\d.]/.test(bf) && !/[\d.]/.test(af)) return i;
      i = q.indexOf(s, i + 1);
    }
    return -1;
  }
  GM.findNum = findNum;
  /* 把題幹裡的兩個數換掉。題目可能是「29 箱，每箱 488 元」這種反過來的寫法，
     所以兩個數各自找位置，再從後面往前換（這樣前面的位置才不會跑掉）。 */
  function swapNums(q, a, b, a2, b2) {
    var sa = String(a), sb = String(b), ia = findNum(q, sa), ib = findNum(q, sb);
    if (ia < 0 || ib < 0) return null;
    if (ia === ib) { ib = findNum(q, sb, ia + sa.length); if (ib < 0) return null; }     /* 兩個數一樣，例如 25+25 */
    var reps = [{ i: ia, n: sa.length, v: String(a2) }, { i: ib, n: sb.length, v: String(b2) }].sort(function (x, y) { return y.i - x.i; });
    if (reps[1].i + reps[1].n > reps[0].i) return null;                                  /* 位置重疊，不要亂換 */
    var out = q;
    reps.forEach(function (r) { out = out.slice(0, r.i) + r.v + out.slice(r.i + r.n); });
    return out;
  }
  /* 回傳新的題目物件（改好數字的），不合理就回傳 {err:"原因"} */
  GM.recalc = function (Q, a2, b2) {
    var e = GM.editable(Q); if (!e) return { err: "這一題不能改數字" };
    if (!(a2 > 0) || !(b2 > 0) || a2 % 1 || b2 % 1) return { err: "請填大於 0 的整數" };
    if (a2 > 99999 || b2 > 99999) return { err: "數字太大了" };
    if (e.op === "-" && a2 <= b2) return { err: "減法要前面的數比較大" };
    if (e.op === "÷" && a2 % b2 !== 0) return { err: a2 + " 不能整除 " + b2 + "，換個數字" };
    var v = calcOf(e.op, a2, b2); if (v == null) return { err: "算不出來，換個數字" };
    var q = swapNums(String(Q.q), e.a, e.b, a2, b2); if (!q) return { err: "這一題不能改數字" };
    /* 圖、小幫手、算式都是照原來的數字畫的，改了數字就不留；直式會照新數字重畫 */
    var N = Object.assign({}, Q, { q: q, b: [D.N(v, Q.b[0].u)], calc: { op: e.raw, a: String(a2), b: String(b2) }, sol: null, aid: null, aidFn: null, fig: null, figFn: null, edited: 1 });
    return { Q: N };
  };

  /* ---------- 版面：上方列、標題 ---------- */
  GM.topBar = function (cur) {
    var bar = GM.h('<nav class="bar"><a class="back" href="' + NB.root + 'island.html">← 回到目錄</a></nav>');
    var right = GM.h('<div class="bar-r"></div>');
    right.appendChild(NB.themeBar()); right.appendChild(NB.menu({ cur: cur || "games" }));
    bar.appendChild(right); return bar;
  };

  /* ---------- 範圍選擇器（跟無限出題同一套樣式） ---------- */
  var CN = "一二三四五六七八九十";
  GM.picker = function (onChange, opt) {
    opt = opt || {};
    var S = GM.S;
    var box = GM.h('<section class="sheet gm-pick"><h2>選範圍</h2><p class="meta">' + (opt.note || "選好的範圍，六個遊戲都會用這一份。") + '</p><div class="dr-row dr-grades" role="group" aria-label="年級"></div><div class="dr-semlist"></div><div class="dr-picked"><span></span><button type="button">全部清除</button></div></section>');
    var gr = box.querySelector(".dr-grades"), list = box.querySelector(".dr-semlist"), pk = box.querySelector(".dr-picked");
    [1, 2, 3, 4, 5, 6].forEach(function (g) {
      var b = GM.h('<button type="button" class="pen">' + "一二三四五六"[g - 1] + "年級</button>");
      b.onclick = function () { S.grade = g; GM.setSave(); draw(); markG(); if (onChange) onChange(); };
      gr.appendChild(b);
    });
    function markG() { gr.querySelectorAll("button").forEach(function (b, i) { b.classList.toggle("on", i + 1 === S.grade); }); }
    function cnt(c) { return c.secs.filter(function (o) { return S.sel.indexOf(o.id) >= 0; }).length; }
    function toggle(id, on) { var i = S.sel.indexOf(id); if (on && i < 0) S.sel.push(id); if (!on && i >= 0) S.sel.splice(i, 1); }
    function picked() {
      pk.firstChild.textContent = S.sel.length ? "已選 " + S.sel.length + " 個小節" : "沒有選的話，就出整個" + "一二三四五六"[S.grade - 1] + "年級";
      pk.lastChild.hidden = !S.sel.length;
    }
    function draw() {
      list.innerHTML = "";
      NB.cat.filter(function (x) { return x.grade === S.grade; }).forEach(function (sem) {
        var d = GM.h('<div class="dr-sem"><div class="dr-semh"><span class="tag">' + sem.sem + "</span></div></div>");
        sem.chs.forEach(function (c) {
          var ch = GM.h('<div class="dr-chap"><button type="button" aria-expanded="false"><span class="no">第' + CN[c.no - 1] + '章</span><b>' + GM.esc(c.name) + '</b><span class="ct"></span></button><div class="dr-secs" hidden></div></div>');
          var btn = ch.firstChild, secs = ch.lastChild, ct = btn.querySelector(".ct");
          function upd() { var n = cnt(c); ct.textContent = n ? "已選 " + n + "/" + c.secs.length : c.secs.length + " 節"; ct.classList.toggle("on", !!n); }
          var all = GM.h('<button type="button" class="dr-sec" aria-pressed="false">整章</button>');
          all.onclick = function () { var on = cnt(c) < c.secs.length; c.secs.forEach(function (o) { if (D.has(o.id)) toggle(o.id, on); }); refresh(); };
          secs.appendChild(all);
          c.secs.forEach(function (o) {
            if (!D.has(o.id)) return;
            var b = GM.h('<button type="button" class="dr-sec" data-id="' + o.id + '" aria-pressed="false"><span class="n">' + o.num + "</span>" + GM.esc(o.title) + "</button>");
            b.onclick = function () { toggle(o.id, S.sel.indexOf(o.id) < 0); refresh(); };
            secs.appendChild(b);
          });
          function refresh() {
            secs.querySelectorAll("[data-id]").forEach(function (b) { b.setAttribute("aria-pressed", S.sel.indexOf(b.dataset.id) >= 0 ? "true" : "false"); });
            all.setAttribute("aria-pressed", cnt(c) === c.secs.length ? "true" : "false");
            upd(); picked(); GM.setSave(); if (onChange) onChange();
          }
          btn.onclick = function () { var v = secs.hidden; secs.hidden = !v; btn.setAttribute("aria-expanded", v ? "true" : "false"); };
          if (cnt(c)) { secs.hidden = false; btn.setAttribute("aria-expanded", "true"); }
          upd();
          secs.querySelectorAll("[data-id]").forEach(function (b) { b.setAttribute("aria-pressed", S.sel.indexOf(b.dataset.id) >= 0 ? "true" : "false"); });
          all.setAttribute("aria-pressed", cnt(c) === c.secs.length ? "true" : "false");
          d.appendChild(ch);
        });
        list.appendChild(d);
      });
    }
    pk.lastChild.onclick = function () { S.sel = []; GM.setSave(); draw(); picked(); if (onChange) onChange(); };
    markG(); draw(); picked();
    return box;
  };
  GM.lvRow = function (onChange) {
    var r = GM.h('<div class="gm-lv"><span class="dr-lab">難度</span><div class="dr-seg" role="group"><button type="button" data-v="1">基礎</button><button type="button" data-v="2">標準</button><button type="button" data-v="3">挑戰</button></div></div>');
    function m() { r.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", +b.dataset.v === GM.S.lv); }); }
    r.querySelectorAll("button").forEach(function (b) { b.onclick = function () { GM.S.lv = +b.dataset.v; GM.setSave(); m(); if (onChange) onChange(); }; });
    m(); return r;
  };

  /* ---------- 計時器 ---------- */
  GM.timer = function (el, secs, onEnd, onTick) {
    var t0 = Date.now(), id = setInterval(function () {
      var left = secs - (Date.now() - t0) / 1000;
      if (left <= 0) { clearInterval(id); el.textContent = "0.0"; if (onEnd) onEnd(); return; }
      el.textContent = left.toFixed(1);
      if (onTick) onTick(left);
    }, 100);
    el.textContent = secs.toFixed(1);
    return { stop: function () { clearInterval(id); }, left: function () { return Math.max(0, secs - (Date.now() - t0) / 1000); } };
  };
  GM.upTimer = function (el) {
    var t0 = Date.now(), id = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); el.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }, 500);
    el.textContent = "0:00";
    return { stop: function () { clearInterval(id); }, sec: function () { return Math.round((Date.now() - t0) / 1000); } };
  };
  GM.mmss = function (s) { return Math.floor(s / 60) + " 分 " + (s % 60) + " 秒"; };

  /* ---------- 小動畫：答對的時候冒出光點（不用圖片、不用表情符號） ---------- */
  GM.spark = function (host) {
    if (!host) return;
    var s = document.createElement("span"); s.className = "gm-spark"; s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<svg viewBox="0 0 60 60"><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M30 8v10"/><path d="M30 42v10"/><path d="M8 30h10"/><path d="M42 30h10"/>' +
      '<path d="M14 14l7 7"/><path d="M39 39l7 7"/><path d="M46 14l-7 7"/><path d="M21 39l-7 7"/></g></svg>';
    host.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
  };
  /* 提示框（取代 alert，樣式跟網站一致） */
  GM.say = function (title, text, onOk) {
    var w = GM.h('<div class="gm-modal" role="dialog" aria-modal="true"><div class="gm-mbox sheet"><h3></h3><div class="gm-mtx"></div><div class="dr-btns"><button type="button" class="pen go">知道了</button></div></div></div>');
    w.querySelector("h3").textContent = title;
    w.querySelector(".gm-mtx").innerHTML = typeof text === "string" ? "<p>" + GM.esc(text).replace(/\n/g, "<br>") + "</p>" : "";
    if (typeof text !== "string" && text) w.querySelector(".gm-mtx").appendChild(text);
    function close() { if (w.parentNode) w.parentNode.removeChild(w); if (onOk) onOk(); }
    w.querySelector("button").onclick = close;
    w.addEventListener("click", function (e) { if (e.target === w) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { document.removeEventListener("keydown", esc); close(); } });
    document.body.appendChild(w);
    w.querySelector("button").focus();
    return w;
  };

  /* ---------- 島民：挑戰卡的關主。每一章固定對到一位，所以 412 個小節都有關主 ---------- */
  GM.FOLK = [
    { id: "lamp", n: "守燈人", job: "顧著島上的燈塔", say: "燈油要算準，少一格就暗一夜。" },
    { id: "fish", n: "老漁夫", job: "天亮前就出海", say: "網子收幾次、魚分幾堆，都是數學。" },
    { id: "farm", n: "菜園阿姨", job: "照顧島上的菜田", say: "幾排幾株，心裡要有數。" },
    { id: "bake", n: "麵包師", job: "烤全島的麵包", say: "麵團要秤、爐子要計時。" },
    { id: "post", n: "小郵差", job: "每天送信繞一圈", say: "走哪條路最近，我算過。" },
    { id: "book", n: "書店老闆", job: "管一整櫃的舊書", say: "書要分類，帳也要平。" },
    { id: "ship", n: "修船匠", job: "補船、量木板", say: "量錯一公分，船就會漏。" },
    { id: "star", n: "觀星人", job: "記錄夜空的變化", say: "星星的位置，是會算的。" }
  ];
  GM.folkOf = function (id) {
    var o = BY[id]; if (!o) return GM.FOLK[0];
    return GM.FOLK[D.hash(o.sem + "#" + o.ch.no) % GM.FOLK.length];
  };
  GM.chapKey = function (id) { var o = BY[id]; return o ? o.sem + "#" + o.ch.no : ""; };
  GM.chapName = function (id) { var o = BY[id]; return o ? o.sem + "・第" + CN[o.ch.no - 1] + "章 " + o.ch.name : ""; };
  /* 島民的樣子：小紅人加上一樣道具（純 SVG，沒有圖檔） */
  GM.folkSvg = function (f, size) {
    var P = {
      lamp: '<path d="M26 16h8M30 8v8" /><path d="M24 16h12l-2 8H26z"/>',
      fish: '<path d="M20 14c4-4 12-4 16 0" /><path d="M22 13l-3-4M38 13l3-4"/>',
      farm: '<path d="M18 16h24M30 6v10"/><path d="M22 12c3-4 13-4 16 0"/>',
      bake: '<path d="M20 16c0-6 4-9 10-9s10 3 10 9z"/><path d="M20 16h20"/>',
      post: '<path d="M20 10h20v8H20z"/><path d="M20 10l10 6 10-6"/>',
      book: '<path d="M22 8v12l8-3 8 3V8z"/>',
      ship: '<path d="M18 18h24l-4 6H22z"/><path d="M30 6v12"/>',
      star: '<path d="M30 6l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>'
    };
    var s = size || 64;
    return '<svg class="gm-folk" viewBox="0 0 60 78" width="' + s + '" height="' + Math.round(s * 1.3) + '" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      (P[f.id] || "") +
      '<circle cx="30" cy="34" r="9"/><path d="M21 52c1-6 4-9 9-9s8 3 9 9z"/><path d="M19 52h22l-2 20H21z"/><path d="M26 60h8"/>' +
      "</g></svg>";
  };

  /* ---------- 分享連結：我是出題老師用 ---------- */
  /* 題目用 id~卷號~題型 記下來，所以朋友打開看到的是一模一樣的題 */
  GM.encode = function (o) {
    var q = o.list.map(function (x) { return x.id + "~" + x.seed + "~" + (x.vi == null ? "" : x.vi) + (x.ab ? "~" + x.ab[0] + "_" + x.ab[1] : ""); }).join("!");
    return "#play?v=1&lv=" + o.lv + "&t=" + encodeURIComponent(o.title || "") + "&by=" + encodeURIComponent(o.by || "") + "&q=" + q;
  };
  GM.decode = function (hash) {
    var m = /^#play\?(.*)$/.exec(hash || ""); if (!m) return null;
    var p = {}; m[1].split("&").forEach(function (kv) { var i = kv.indexOf("="); p[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); });
    if (!p.q) return null;
    var list = p.q.split("!").map(function (s) {
      var a = s.split("~"); if (!D.has(a[0])) return null;
      var o = { id: a[0], seed: +a[1] || 1, vi: a[2] === "" || a[2] == null ? null : +a[2] };
      if (a[3]) { var ab = a[3].split("_"); o.ab = [+ab[0], +ab[1]]; }
      return o;
    }).filter(Boolean);
    if (!list.length) return null;
    return { lv: Math.min(3, Math.max(1, +p.lv || 2)), title: p.t || "", by: p.by || "", list: list };
  };
  /* 照分享連結重建題目 */
  GM.rebuild = function (x, lv) {
    var Q; try { Q = D.make(x.id, x.seed, lv, x.vi == null ? null : [x.vi]); } catch (e) { return null; }
    if (!Q) return null;
    if (x.ab) { var r = GM.recalc(Q, x.ab[0], x.ab[1]); if (r.Q) Q = r.Q; }
    return Q;
  };
})();
