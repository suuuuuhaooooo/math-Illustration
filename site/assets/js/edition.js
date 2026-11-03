/* 課本版本（適康版、適南版、適翰版）：讀取層
   ──────────────────────────────────────────────────────────────
   三家的章節分法、順序、名稱都不一樣，所以每一版就是一套完整的目錄，
   而且各有自己的小節代號——題庫就是靠代號分家的：

     3uk-1.1   適康版
     3un-1.1   適南版
     3uh-1.1   適翰版

   這樣各版的題目各自一區，匯入南一的題目不會跑到翰林去。
   沒有字母的 3u-1.1 是「通用目錄」（catalog.js），免費那一邊讀的就是它。

   適康版的章節編排跟通用目錄一模一樣（本來就是依康軒編的），
   所以不用抄第二遍：editions.js 寫 same:true＋sfx:"k"，
   程式直接拿 catalog.js 的內容換上 k 的代號。

   設計上要守住的兩件事：
   1. 不改 NB.cat。免費那一邊（島覽頁、單元頁、無限出題、遊戲場）全部直接讀
      NB.cat，而且島覽頁和單元頁也會載入 member.js，所以只要在那裡動手腳，
      免費功能就會跟著變。這支檔案只「另外組一份」，原本的 NB.cat 一個字都不動，
      而且只在 member.html、teacher.html 載入。
   2. 沒設定版本不等於壞掉。沒設定版本的人看到的就是依課綱編的通用目錄
      （也就是康軒那一套），跟現在一模一樣。

   提供給畫面用的：
     NB.ed.mine()      這個帳號有哪些版本（管理員三種都有）
     NB.ed.cur()       現在在看哪一個版本（多版本時可切換）；"" ＝通用
     NB.ed.set(k)      切換
     NB.ed.on()        現在是不是正在用某個版本的目錄
     NB.ed.cat()       目錄（形狀跟 NB.cat 一樣，畫面不用改寫法）
     NB.ed.flat()      所有小節（形狀跟 NB.flat 一樣）
     NB.ed.byId(id)    某一節（找不到會跨版本再找一次）
     NB.ed.title(id)   "三上 2.1 認識餘數" 這種字串
     NB.ed.label()     "適康版" 或 "通用（依課綱）"
     NB.ed.edOf(id)    這個代號是哪一版的
     NB.ed.where(id)   "適南版 三下・第六章 分數的加減・6.2 分數比大小"
     NB.ed.allFlat()   三個版本的所有小節（題庫管理用，要能看到別版的單元）
     NB.ed.sortIds(a)  依目前版本的順序排代號
     NB.ed.picker(cb)  版本切換器（只有一個版本的人不會看到）
   ────────────────────────────────────────────────────────────── */
(function () {
"use strict";
var NB = window.NB || (window.NB = {}), K = "nb-edition";
var CN = "一二三四五六七八九十十一十二".match(/十[一二]|./g);
var KEYS = ["kang", "nan", "han"], FALL = { kang: "適康版", nan: "適南版", han: "適翰版" };
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

var E = NB.ed = {}, cache = {}, bc = { t: null, byId: {} }, all = null, subs = [];
E.KEYS = KEYS;

function SRC() { return window.EDITIONS || {}; }
E.ready = function () { return !!window.EDITIONS; };

/* 版本名稱：伺服器給的優先（以後要改叫法，後端改一個地方就好），讀不到才用這裡的 */
E.name = function (k) { var M = NB.member, s = M && M.U && M.U.edNames; return (s && s[k]) || FALL[k] || k; };
/* 版本字母：康軒 k、南一 n、翰林 h */
E.sfx = function (k) { var d = SRC()[k]; return d && typeof d.sfx === "string" ? d.sfx : { kang: "k", nan: "n", han: "h" }[k] || ""; };
/* 從代號反推版本：3un-1.1 → nan。沒有字母的 3u-1.1 是通用目錄，不屬於任何版本，回空字串 */
E.edOf = function (id) {
  var m = /^([1-6])([ud])([a-z])-/.exec(String(id || ""));
  if (!m) return "";
  for (var i = 0; i < KEYS.length; i++) if (E.sfx(KEYS[i]) === m[3]) return KEYS[i];
  return "";
};
/* 把通用代號換成某一版的代號，或反過來拿掉字母。
   只有適康版用得到——它的章節編排跟通用目錄一樣，所以 3u-1.1 ↔ 3uk-1.1 是一對一。 */
E.toEd = function (id, k) { var f = E.sfx(k); return String(id).replace(/^([1-6][ud])[a-z]?-/, "$1" + f + "-"); };
E.toGen = function (id) { return String(id).replace(/^([1-6][ud])[a-z]-/, "$1-"); };

/* 這個帳號有哪些版本。管理員後端會回三種，所以後台可以預覽任何版本 */
E.mine = function () {
  var M = NB.member, a = (M && M.U && M.U.ed) || [];
  return KEYS.filter(function (k) { return a.indexOf(k) >= 0; });
};
E.has = function (k) { return E.mine().indexOf(k) >= 0; };

/* same:true＝這個版本的目錄就是通用目錄（適康版就是這種） */
function isSame(k) { var d = SRC()[k]; return !!(d && d.same); }
E.filled = function (k) { var d = SRC()[k]; return isSame(k) || !!(d && d.cat && d.cat.length); };
/* 還沒編排的冊別（後台提示用） */
E.todo = function (k) {
  var d = SRC()[k];
  if (isSame(k) || !d || !d.cat) return [];
  return d.cat.filter(function (S) { return !S.ch || !S.ch.length; }).map(function (S) { return S.sem; });
};

/* 現在看哪一個版本：
   只有一個版本就是那一個；有好幾個就看上次選的；都沒有就是通用（""）。
   注意這裡不會「幫人挑一個」——沒設定版本的人就是通用，不要自己亂選一本課本給他。 */
E.cur = function () {
  var m = E.mine();
  if (!m.length) return "";
  if (m.length === 1) return m[0];
  var p = ls(K);
  return m.indexOf(p) >= 0 ? p : m[0];
};
E.set = function (k) {
  if (k && E.mine().indexOf(k) < 0) return false;
  ls(K, k || null); fire(); return true;
};
E.on = function () {
  var M = NB.member;
  if (M && M.subj && M.subj !== "math") return false;   /* 版本只有國小數學有；理化的目錄是另一個網站給的 */
  var k = E.cur();
  return !!(k && E.ready() && E.filled(k));
};
E.label = function () { var k = E.on() ? E.cur() : ""; return k ? E.name(k) : "通用（依課綱）"; };

/* 換版本時要重畫的畫面，自己來登記 */
E.sub = function (fn) { if (typeof fn === "function") subs.push(fn); };
function fire() { cache = {}; subs.forEach(function (f) { try { f(); } catch (e) {} }); }
E.reset = function () { cache = {}; bc.t = null; all = null; };

/* ---- 組目錄 ---- */

/* NB.cat 可能被換掉（理化是從見微理畫讀回來的），所以用這個當快取的指紋 */
function stamp() { var M = NB.member; return (M && M.subj || "math") + ":" + (NB.cat || []).length + ":" + (NB.flat || []).length; }
function base() {
  var t = stamp();
  if (bc.t !== t) { var m = {}; (NB.flat || []).forEach(function (o) { m[o.id] = o; }); bc = { t: t, byId: m }; }
  return bc.byId;
}

/* 跟 core.js 組 NB.cat 的方式完全一樣：一章一行「章名|節名|節名…」，編號自動產生 */
function mk(rows) {
  var cat = [], flat = [], byId = {};
  (rows || []).forEach(function (S) {
    var V = { sem: S.sem, id: S.id, grade: S.grade, chs: [] };
    (S.ch || []).forEach(function (row, i) {
      var a = String(row).split("|"), c = { no: i + 1, name: a[0], secs: [] };
      a.slice(1).forEach(function (t, j) {
        var o = { id: S.id + "-" + (i + 1) + "." + (j + 1), num: (i + 1) + "." + (j + 1), title: t, sem: S.sem, ch: c };
        c.secs.push(o); flat.push(o); byId[o.id] = o;
      });
      if (c.secs.length) V.chs.push(c);
    });
    cat.push(V);
  });
  return { cat: cat, flat: flat, byId: byId };
}

/* same:true 的版本：拿通用目錄（NB.cat）的章節原樣重組，只把代號換成這一版的。
   注意是「另外組一份」，NB.cat 本身一個字都不會動——免費那一邊讀的還是原本那一組。 */
function fromCat(sfx) {
  return mk((NB.cat || []).map(function (S) {
    return { sem: S.sem, id: S.id.replace(/^([1-6][ud])[a-z]?$/, "$1" + sfx), grade: S.grade,
      /* | 是分隔字元，萬一哪天 catalog.js 的名稱裡出現，換成全形才不會把一節切成兩節 */
      ch: S.chs.map(function (c) { return [c.name].concat(c.secs.map(function (o) { return o.title; })).map(function (t) { return String(t).replace(/\|/g, "｜"); }).join("|"); }) };
  }));
}

function build(k) {
  var t = stamp() + "|" + k;
  if (cache[t]) return cache[t];
  if (isSame(k)) {
    var f = E.sfx(k);
    /* 字母是空的（＝就是通用目錄本身）才直接用原物件，否則重組一份 */
    if (!f) return (cache[t] = { cat: NB.cat || [], flat: NB.flat || [], byId: base() });
    return (cache[t] = fromCat(f));
  }
  var d = SRC()[k];
  return (cache[t] = mk(d && d.cat));
}

E.cat = function () { return E.on() ? build(E.cur()).cat : (NB.cat || []); };
E.flat = function () { return E.on() ? build(E.cur()).flat : (NB.flat || []); };

/* 三個版本的所有小節。題庫管理要用——管理員得看到、也得能匯入別版的單元。
   版本是國小數學才有的概念，所以理化的時候直接回那一科自己的目錄，
   不然理化的題庫管理畫面會跑出數學的單元。快取跟著科目走。 */
E.allFlat = function () {
  var M = NB.member, sj = (M && M.subj) || "math";
  if (sj !== "math") return NB.flat || [];
  if (all && all.t === stamp()) return all.a;
  var out = [], ix = {};
  KEYS.forEach(function (k) { if (E.filled(k)) out = out.concat(build(k).flat); });
  out.forEach(function (o) { ix[o.id] = o; });
  all = { t: stamp(), a: out, ix: ix };
  return out;
};
/* 代號 → 小節 的索引。find／byId 會被逐列呼叫（錯題本、各單元題數有上千列），
   線性搜尋 1,205 筆會把畫面拖垮，所以查表。 */
function allIx() { var M = NB.member; if (M && M.subj && M.subj !== "math") return base(); E.allFlat(); return (all && all.ix) || {}; }
E.allCat = function (k) {
  var M = NB.member;
  if (M && M.subj && M.subj !== "math") return [];
  return E.filled(k) ? build(k).cat : [];
};
/* 跨版本找一個代號（題庫管理、老師同時帶兩個版本的時候會用到） */
E.find = function (id) {
  var k = E.edOf(id);
  if (k && E.filled(k)) { var o = build(k).byId[id]; if (o) return o; }
  return allIx()[id] || null;
};

/* 找一個代號：先看目前這一版，再跨版本找，最後退回通用目錄。
   退回通用那一步是給舊資料用的——還沒搬家的紀錄裡會是 3u-1.1，
   至少要查得出名字，不要讓畫面上只剩一串代號。 */
E.byId = function (id) {
  var m = E.on() ? build(E.cur()).byId[id] : base()[id];
  return m || E.find(id) || base()[id] || null;
};
E.title = function (id) { var o = E.byId(id); return o ? o.sem + " " + o.num + " " + o.title : id; };
E.sortIds = function (a) {
  if (!E.on()) return NB.sortIds ? NB.sortIds(a) : a.slice();
  var ix = {}; build(E.cur()).flat.forEach(function (o, i) { ix[o.id] = i; });
  return a.slice().sort(function (x, y) { var i = x in ix ? ix[x] : 1e6, j = y in ix ? ix[y] : 1e6; return i - j || (x < y ? -1 : x > y ? 1 : 0); });
};

/* 某一節在它自己那一版的哪裡：「適南版 三下・第六章 分數的加減・6.2 分數比大小」 */
E.where = function (id) {
  var k = E.edOf(id), o = E.find(id) || base()[id];
  if (!o) return id;
  return (k ? E.name(k) : "通用") + " " + o.sem + "・第" + (CN[o.ch.no - 1] || o.ch.no) + "章 " + o.ch.name + "・" + o.num + " " + o.title;
};

/* ---- 版本切換器 ---- */
/* 樣式沿用科目切換器那一組（.subj-sw／.pen／.pen.go），不另外寫 CSS，長相才會一致 */
/* 只有一個版本的人看不到切換器（沒得選），但還是會看到自己是哪一版——那個在 label() */
E.picker = function (cb) {
  var m = E.mine();
  if (m.length < 2) return null;
  var cur = E.cur();
  var w = NB.h('<div class="ctl subj-sw noprint"><span class="meta">課本版本：</span></div>');
  m.forEach(function (k) {
    var b = NB.h('<button type="button" class="pen' + (k === cur ? " go" : "") + '"></button>');
    b.textContent = E.name(k) + (E.filled(k) ? "" : "（未編排）");
    b.setAttribute("aria-pressed", k === cur ? "true" : "false");
    b.onclick = function () { if (k === E.cur()) return; E.set(k); if (cb) cb(k); };
    w.appendChild(b);
  });
  return w;
};
/* 沒設定版本時畫面上那一句提示（設定好了就回 null） */
E.note = function () {
  if (E.mine().length) return null;
  return "目前用的是依課綱編的通用目錄。要改成適康版／適南版／適翰版，請跟老師或管理員說。";
};
})();
