/* 製圖：題庫圖庫。
   題庫裡的 DR.fig（drill-core.js ＋ drill-fig2.js）本來就是一支一支吐 SVG 的函式，
   出版社課本裡那些圖幾乎都在裡面：時鐘、量角器、分數條、各種角柱角錐、水箱、線段圖……
   這個檔只做一件事：幫每一支函式寫下「它有哪些參數、預設值是多少」，
   製圖頁才能把它們列成圖庫、讓老師調數字。

   參數型別：num 數字、txt 文字、bool 開關、nums 逗號分隔的數字、txts 逗號分隔的文字、
             pts「x,y x,y」座標、sel 下拉、o* 塞進最後那個 options 物件 */
(function () {
  "use strict";
  var NB = window.NB, L = (NB.drawLib = {});

  function N(k, n, v, min, max, step) { return { t: "num", k: k, n: n, v: v, min: min == null ? 0 : min, max: max == null ? 999 : max, step: step || 1 }; }
  function T(k, n, v) { return { t: "txt", k: k, n: n, v: v }; }
  function B(k, n, v) { return { t: "bool", k: k, n: n, v: v ? 1 : 0 }; }
  function NS(k, n, v) { return { t: "nums", k: k, n: n, v: v }; }
  function TS(k, n, v) { return { t: "txts", k: k, n: n, v: v }; }
  function PT(k, n, v) { return { t: "pts", k: k, n: n, v: v }; }
  function S(k, n, v, opts) { return { t: "sel", k: k, n: n, v: v, o: opts }; }

  /* f：DR.fig 裡的函式名；a：參數依序；g：分類；n：顯示名稱 */
  L.SPECS = [
    /* ---- 數與計算 ---- */
    { f: "dots", g: "數與計算", n: "點點圖", a: [N("n", "幾個", 7, 1, 40)] },
    { f: "row", g: "數與計算", n: "一排圓點（標示其中幾個）", a: [N("n", "全部", 10, 1, 30), N("hi", "標示到第幾個", 4, 0, 30)] },
    { f: "tenFrame", g: "數與計算", n: "十格框", a: [N("a", "第一組", 7, 0, 10), N("b", "第二組", 5, 0, 10)] },
    { f: "blocks", g: "數與計算", n: "積木（百十個）", a: [N("h", "百", 2, 0, 9), N("t", "十", 3, 0, 9)] },
    { f: "bond", g: "數與計算", n: "分合圖", a: [N("t", "合起來", 10, 1, 100), N("a", "左邊", 4, 0, 100), N("b", "右邊", 6, 0, 100)] },
    { f: "groups", g: "數與計算", n: "分組圖", a: [N("a", "每組幾個", 4, 1, 12), N("k", "幾組", 3, 1, 8)] },
    { f: "roundLine", g: "數與計算", n: "四捨五入數線", a: [N("n", "這個數", 376, 0, 99999), N("unit", "進到哪一位", 100, 1, 10000)] },
    { f: "fbar", g: "數與計算", n: "分數條", a: [N("n", "分子", 3, 0, 20), N("d", "分母", 4, 1, 20)] },
    { f: "fpie", g: "數與計算", n: "分數圓", a: [N("n", "分子", 3, 0, 20), N("d", "分母", 8, 1, 20)] },
    { f: "nline", g: "數與計算", n: "數線（題庫版）", a: [N("a", "起", 0, -999, 999), N("b", "迄", 10, -999, 999), N("step", "刻度", 1, 0.1, 100, 0.1), N("q", "問號在哪（空白就不標）", 4, -999, 999)] },
    { f: "areaModel", g: "數與計算", n: "分數面積模型", a: [N("a", "甲分子", 2, 1, 9), N("b", "甲分母", 3, 1, 9), N("c", "乙分子", 3, 1, 9), N("d", "乙分母", 4, 1, 9)] },
    { f: "shortDiv", g: "數與計算", n: "短除法", a: [N("a", "甲數", 24, 1, 9999), N("b", "乙數", 36, 1, 9999)] },

    /* ---- 量與測量 ---- */
    { f: "clock", g: "量與測量", n: "時鐘", a: [N("h", "時", 3, 1, 12), N("m", "分", 30, 0, 59)] },
    { f: "ruler", g: "量與測量", n: "直尺", a: [N("a", "量的起點", 0, 0, 30), N("b", "量的終點", 7, 0, 30)] },
    { f: "protractor", g: "量與測量", n: "量角器", a: [N("deg", "角度", 60, 0, 180)] },
    { f: "scale", g: "量與測量", n: "磅秤", a: [N("g", "指到幾", 700, 0, 5000, 10), N("max", "滿刻度", 1000, 100, 5000, 100)] },
    { f: "cup", g: "量與測量", n: "量杯", a: [N("v", "水量", 350, 0, 2000, 10), N("max", "容量", 1000, 100, 2000, 100), N("step", "刻度間隔", 100, 10, 500, 10)] },
    { f: "money", g: "量與測量", n: "錢幣", a: [NS("list", "面額（逗號分隔）", "100,50,10,5,1")] },
    { f: "lenBars", g: "量與測量", n: "長度長條", a: [NS("lens", "長度", "6,9,4"), TS("labs", "標籤", "甲,乙,丙")] },
    { f: "mapScale", g: "量與測量", n: "比例尺", a: [N("cm", "圖上幾公分", 4, 1, 50), N("scale", "幾分之一", 1000, 10, 100000, 10)] },
    { f: "timeline", g: "量與測量", n: "時間軸", a: [T("t1", "起", "8:20"), T("t2", "迄", "10:05"), T("lab", "中間標的字", "經過多久？")] },

    /* ---- 平面圖形 ---- */
    { f: "shape", g: "平面圖形", n: "基本圖形", a: [S("k", "形狀", "三角形", ["三角形", "正方形", "長方形", "平行四邊形", "梯形", "菱形", "五邊形", "六邊形", "八邊形", "圓形", "星形"])] },
    { f: "ngon", g: "平面圖形", n: "正多邊形", a: [N("n", "幾邊形", 6, 3, 12)] },
    { f: "angle", g: "平面圖形", n: "角", a: [N("deg", "角度", 55, 0, 360)] },
    { f: "poly", g: "平面圖形", n: "多邊形（自訂頂點）", a: [PT("pts", "頂點 x,y", "20,20 140,20 160,110 10,100"), TS("labs", "頂點標籤", "A,B,C,D")] },
    { f: "triH", g: "平面圖形", n: "三角形（底與高）", a: [T("bLab", "底", "8 公分"), T("hLab", "高", "5 公分")] },
    { f: "triSides", g: "平面圖形", n: "三角形（三邊）", a: [N("a", "邊 a", 6, 1, 99), N("b", "邊 b", 8, 1, 99), N("c", "邊 c", 10, 1, 99), TS("labs", "頂點標籤", "A,B,C")] },
    { f: "triAng", g: "平面圖形", n: "三角形（兩角）", a: [N("A", "角 A", 50, 1, 178), N("B", "角 B", 60, 1, 178), TS("labs", "頂點標籤", "A,B,C")] },
    { f: "para", g: "平面圖形", n: "平行四邊形", a: [T("bLab", "底", "10 公分"), T("hLab", "高", "6 公分")] },
    { f: "trap", g: "平面圖形", n: "梯形", a: [T("tLab", "上底", "6 公分"), T("bLab", "下底", "10 公分"), T("hLab", "高", "4 公分")] },
    { f: "rect", g: "平面圖形", n: "長方形", a: [T("wLab", "寬", "8 公分"), T("hLab", "高", "5 公分")] },
    { f: "lshape", g: "平面圖形", n: "L 形", a: [N("W", "總寬", 10, 2, 40), N("H", "總高", 8, 2, 40), N("cw", "缺口寬", 4, 1, 39), N("ch", "缺口高", 3, 1, 39), TS("labs", "邊長標籤", "")] },
    { f: "circle", g: "平面圖形", n: "圓（半徑）", a: [T("lab", "標示", "半徑 5 公分")] },
    { f: "sector", g: "平面圖形", n: "扇形", a: [N("deg", "圓心角", 120, 1, 359), T("lab", "標示", "半徑 6 公分")] },
    { f: "polyDiag", g: "平面圖形", n: "多邊形對角線", a: [N("n", "幾邊形", 6, 3, 12)] },
    { f: "angSplit", g: "平面圖形", n: "角的分割", a: [N("tot", "全角", 120, 2, 359), N("a", "其中一角", 50, 1, 358), TS("labs", "標籤", "")] },
    { f: "symGrid", g: "平面圖形", n: "對稱方格", a: [N("ax", "對稱軸在第幾格", 4, 1, 12), N("px", "點 x", 2, 0, 12), N("py", "點 y", 3, 0, 12)] },
    { f: "sqQuarter", g: "平面圖形", n: "正方形四等分", a: [T("lab", "標示", "")] },
    { f: "sqCircle", g: "平面圖形", n: "正方形內接圓", a: [T("lab", "標示", "邊長 10 公分")] },
    { f: "gridShape", g: "平面圖形", n: "方格紙上的圖形", a: [PT("cells", "塗色格子 欄,列", "1,1 2,1 3,1 2,2 2,3")] },
    { f: "enlarge", g: "平面圖形", n: "放大縮小", a: [N("a", "原寬", 3, 1, 20), N("b", "原高", 2, 1, 20), N("k", "倍率", 2, 1, 6)] },

    /* ---- 立體圖形 ---- */
    { f: "cube", g: "立體圖形", n: "正方體", a: [T("lab", "邊長標示", "5 公分")] },
    { f: "box", g: "立體圖形", n: "長方體", a: [N("l", "長", 6, 1, 30), N("w", "寬", 4, 1, 30), N("h", "高", 3, 1, 30), TS("labs", "標示（長,寬,高）", "6 公分,4 公分,3 公分")] },
    { f: "cuboid", g: "立體圖形", n: "長方體（題庫版）", a: [N("l", "長", 5, 1, 30), N("w", "寬", 3, 1, 30), N("h", "高", 4, 1, 30), TS("labs", "標示", "")] },
    { f: "cubes", g: "立體圖形", n: "小積木堆成的長方體", a: [N("a", "長", 3, 1, 8), N("b", "寬", 2, 1, 8), N("c", "高", 2, 1, 8)] },
    { f: "prism", g: "立體圖形", n: "角柱", a: [N("n", "底面幾邊形", 5, 3, 10)] },
    { f: "pyramid", g: "立體圖形", n: "角錐", a: [N("n", "底面幾邊形", 4, 3, 10)] },
    { f: "triPrism", g: "立體圖形", n: "三角柱", a: [N("a", "底", 6, 1, 30), N("b", "高", 4, 1, 30), N("H", "柱長", 10, 1, 40), TS("labs", "標示", "")] },
    { f: "cylinder", g: "立體圖形", n: "圓柱", a: [T("rLab", "半徑標示", "3 公分"), T("hLab", "高標示", "8 公分")] },
    { f: "cyl", g: "立體圖形", n: "圓柱（題庫版）", a: [T("rLab", "半徑標示", "3 公分"), T("hLab", "高標示", "8 公分")] },
    { f: "cone", g: "立體圖形", n: "圓錐", a: [T("rLab", "半徑標示", "4 公分"), T("hLab", "高標示", "9 公分")] },
    { f: "sphere", g: "立體圖形", n: "球", a: [T("lab", "標示", "半徑 5 公分")] },
    { f: "tank", g: "立體圖形", n: "水箱（含水位）", a: [N("l", "長", 20, 1, 100), N("w", "寬", 10, 1, 100), N("h", "高", 15, 1, 100)] },
    { f: "drain", g: "立體圖形", n: "水位變化", a: [N("l", "長", 20, 1, 100), N("w", "寬", 10, 1, 100), N("h", "高", 15, 1, 100), N("w1", "原水位", 12, 0, 100), N("w2", "後水位", 6, 0, 100), TS("labs", "標示", "")] },
    { f: "lsolid", g: "立體圖形", n: "L 形柱體", a: [N("l1", "長 1", 8, 1, 40), N("h1", "高 1", 6, 1, 40), N("l2", "長 2", 4, 1, 40), N("h2", "高 2", 3, 1, 40), N("w", "寬", 5, 1, 40), TS("labs", "標示", "")] },
    { f: "holeBox", g: "立體圖形", n: "挖洞的長方體", a: [N("l", "長", 10, 1, 40), N("w", "寬", 6, 1, 40), N("h", "高", 5, 1, 40), N("r", "洞半徑", 2, 1, 20), TS("labs", "標示", "")] },
    { f: "stack", g: "立體圖形", n: "積木堆（俯視高度）", a: [{ t: "grid", k: "hm", n: "每一格疊幾層", v: "3,2,1\n2,2,1\n1,1,1" }] },
    { f: "net", g: "立體圖形", n: "展開圖", a: [S("kind", "哪一種", "cube", [["cube", "正方體"], ["cylinder", "圓柱"], ["cone", "圓錐"], ["tri", "三角柱"]])] },

    /* ---- 統計圖表 ---- */
    { f: "bars", g: "統計圖表", n: "長條圖", a: [TS("labels", "項目", "甲,乙,丙,丁"), NS("vals", "數值", "6,9,4,7")] },
    { f: "lines", g: "統計圖表", n: "折線圖", a: [TS("labels", "項目", "一月,二月,三月,四月"), NS("vals", "數值", "12,18,9,15")] },
    { f: "pie", g: "統計圖表", n: "圓形圖", a: [TS("labels", "項目", "甲,乙,丙"), NS("pct", "百分比", "50,30,20")] },
    { f: "avgBars", g: "統計圖表", n: "平均長條", a: [NS("vals", "數值", "6,9,4,5"), N("avg", "平均線", 6, 0, 999)] },

    /* ---- 解題輔助 ---- */
    { f: "segs", g: "解題輔助", n: "線段圖（條狀）", a: [{ t: "segs", k: "rows", n: "每一列：標籤 數值,數值", v: "哥哥 3,2\n弟弟 3" }] },
    { f: "track", g: "解題輔助", n: "相遇／追趕", a: [S("kind", "哪一種", "meet", [["meet", "相遇"], ["apart", "背向"], ["chase", "追趕"]]), T("la", "甲", "甲"), T("lb", "乙", "乙"), T("tot", "全長", "100 公尺")] },
    { f: "river", g: "解題輔助", n: "流水問題", a: [B("up", "逆流", 0)] },
    { f: "sticks", g: "解題輔助", n: "小棒排列", a: [N("a", "第一個用幾根", 4, 1, 30), N("b", "第二個", 7, 1, 40), N("c", "第三個", 10, 1, 50)] },
    { f: "hgrid", g: "解題輔助", n: "百格圖", a: [N("n", "塗幾格", 35, 0, 100)] },
    { f: "bag", g: "解題輔助", n: "袋子裡的球", a: [TS("cols", "顏色（r 紅 b 藍 g 綠 y 黃）", "r,r,b,b,g")] },
    { f: "handshake", g: "解題輔助", n: "握手問題", a: [N("n", "幾個人", 5, 2, 10)] },
    { f: "tree", g: "解題輔助", n: "樹狀圖", a: [N("a", "第一層", 3, 1, 6), N("b", "第二層", 2, 1, 6)] },
    { f: "cans", g: "解題輔助", n: "罐子", a: [N("n", "幾罐", 6, 1, 20)] },
    { f: "tables", g: "解題輔助", n: "桌子排列", a: [N("n", "幾張", 4, 1, 12)] },
    { f: "matches", g: "解題輔助", n: "火柴棒規律", a: [N("per", "每個用幾根", 4, 1, 12), N("add", "每多一個加幾根", 3, 1, 12), N("k", "排到第幾個", 4, 1, 10)] },
    { f: "stones", g: "解題輔助", n: "石子排列", a: [N("a", "第一排", 3, 1, 12), N("b", "第二排", 5, 1, 12), N("k", "排到第幾排", 4, 1, 10)] },
    { f: "balance", g: "解題輔助", n: "天平", a: [T("lab", "左邊", "1 個盒子"), N("n", "右邊幾個單位", 6, 1, 20)] },
    { f: "brace", g: "解題輔助", n: "大括號", a: [N("w", "寬度", 180, 40, 900, 10), T("t", "標示", "全部 24 個"), S("dir", "開口", "1", [["1", "朝下"], ["-1", "朝上"]])],
      b: function (fig, v) { var w = +v.w, d = +v.dir, y = d > 0 ? 10 : 30; return fig.svg(w, 44, fig.brace(6, w - 6, y, v.t, d), { k: 1 }); } }
  ];

  /* 把介面上填的值轉成函式真正要的參數 */
  function val(a, raw) {
    var v = raw == null ? a.v : raw;
    if (a.t === "num") return +v;
    if (a.t === "bool") return !!+v;
    if (a.t === "nums") return String(v).split(/[,\s]+/).filter(function (x) { return x !== ""; }).map(Number);
    /* 空白就傳 undefined，讓函式自己用內建的預設標籤（不然會印出 undefined） */
    if (a.t === "txts") { var t = String(v).trim(); if (!t) return undefined; return t.split(",").map(function (x) { return x.trim(); }); }
    if (a.t === "pts") return String(v).trim().split(/\s+/).filter(Boolean).map(function (p) { return p.split(",").map(Number); });
    if (a.t === "grid") return String(v).trim().split("\n").map(function (r) { return r.split(/[,\s]+/).filter(Boolean).map(Number); });
    if (a.t === "segs") {
      return String(v).trim().split("\n").map(function (r) {
        var m = /^(\S*)\s+(.+)$/.exec(r.trim()) || [0, "", r.trim()];
        return { lab: m[1], parts: String(m[2]).split(/[,\s]+/).filter(Boolean).map(function (x) { return { v: +x, lab: x }; }) };
      });
    }
    return String(v);
  }
  L.byName = function (f) { for (var i = 0; i < L.SPECS.length; i++) if (L.SPECS[i].f === f) return L.SPECS[i]; return null; };
  /* 畫出來：回傳 SVG 字串，失敗回 null */
  L.render = function (f, vals) {
    var sp = L.byName(f), fig = window.DR && DR.fig;
    if (!sp || !fig || (!sp.b && typeof fig[f] !== "function")) return null;
    var args = sp.a.map(function (a) { return val(a, vals ? vals[a.k] : null); });
    try {
      var s;
      if (sp.b) { var vv = {}; sp.a.forEach(function (a, i) { vv[a.k] = args[i]; }); s = sp.b(fig, vv); }
      else {
        try { s = fig[f].apply(null, args); }
        catch (e1) {
          /* 有些函式會直接拿 labs 去索引，傳 undefined 會爆；改傳空陣列再試一次 */
          var a2 = sp.a.map(function (a, i) { return a.t === "txts" && args[i] === undefined ? [] : args[i]; });
          s = fig[f].apply(null, a2);
        }
      }
      if (!s || typeof s !== "string" || s.indexOf("<svg") < 0) return null;   /* 回傳 HTML 的（表格那類）不收 */
      return s;
    } catch (e) { return null; }
  };
  L.defaults = function (f) {
    var sp = L.byName(f), o = {};
    if (sp) sp.a.forEach(function (a) { o[a.k] = a.v; });
    return o;
  };
  L.groups = function () {
    var g = [], seen = {};
    L.SPECS.forEach(function (s) { if (!seen[s.g]) { seen[s.g] = 1; g.push(s.g); } });
    return g;
  };
})();
