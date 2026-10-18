/* 題目產生器（只在伺服器端執行）。每個單元一個產生器，每次用亂數種子出新題。
   回傳 { q, a, h, o?, d?, lv? }
   - o：選項（有的話是選擇題，a 必須是其中一個）
   - d：誘答診斷。{ 錯誤答案: "給學生的提示" }，學生選了／填了那個答案時會顯示
   - lv：難度 1 基礎、2 應用、3 挑戰（沒寫就用產生器的預設值）
   新增題型＝在 GENS 加一行 { id:"單元id", lv:2, f:function(r){…} } */

export function rng(s) {
  let a = typeof s === "number" ? s : 0;
  if (typeof s === "string") {
    a = 2166136261;
    for (let i = 0; i < s.length; i++) { a ^= s.charCodeAt(i); a = Math.imul(a, 16777619); }
  }
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export function shuffle(arr, r) {
  const p = arr.slice();
  for (let j = p.length - 1; j > 0; j--) { const t = Math.floor(r() * (j + 1)); [p[j], p[t]] = [p[t], p[j]]; }
  return p;
}
/* 數字轉成診斷表的鍵：和評分時用同一個格式 */
export const key = (n) => String(+(+n).toFixed(2));

export const GENS = [
  { id: "3u-9.4", lv: 1, f(r) {
    const d = ri(r, 5, 12), a = ri(r, 1, d - 2), b = ri(r, a + 1, d - 1), o = [a + "/" + d, b + "/" + d];
    if (r() < 0.5) o.reverse();
    return { q: `${o[0]} 和 ${o[1]}，哪一個分數比較大？`, o, a: b + "/" + d, h: "分母相同，分子大的分數比較大。", d: { [a + "/" + d]: "分母相同時，分子大的分數比較大，再比一次。" } };
  } },
  { id: "3d-3.3", lv: 2, f(r) {
    const d = pick(r, [3, 4, 5, 6, 8, 10]), n = ri(r, 4, 12);
    return { q: `一條路長 ${d * n} 公尺，每隔 ${d} 公尺種一棵樹，兩端都要種，共需幾棵樹？`, a: n + 1,
      h: `間隔數 ${d * n} ÷ ${d} = ${n}，棵數 = 間隔數 + 1。`, d: { [key(n)]: "兩端都要種，棵數要比間隔數多 1。" } };
  } },
  { id: "4d-6.3", lv: 1, f(r) {
    const l = ri(r, 5, 20), w = ri(r, 2, l - 1);
    return r() < 0.5
      ? { q: `長方形的長 ${l} 公分、寬 ${w} 公分，面積是幾平方公分？`, a: l * w, h: `長方形面積 = 長 × 寬 = ${l} × ${w}。`, d: { [key(2 * (l + w))]: "那是周長。面積是長 × 寬。" } }
      : { q: `長方形的長 ${l} 公分、寬 ${w} 公分，周長是幾公分？`, a: 2 * (l + w), h: `周長 = (長 + 寬) × 2 = (${l} + ${w}) × 2。`, d: { [key(l * w)]: "那是面積。周長是四邊的總長。" } };
  } },
  { id: "5u-9.2", lv: 1, f(r) {
    const b = pick(r, [6, 8, 10, 12, 14, 16]), t = ri(r, 3, 12);
    return { q: `三角形的底 ${b} 公分、高 ${t} 公分，面積是幾平方公分？`, a: (b * t) / 2, h: `三角形面積 = 底 × 高 ÷ 2 = ${b} × ${t} ÷ 2。`, d: { [key(b * t)]: "別忘了 ÷ 2，三角形是平行四邊形的一半。" } };
  } },
  { id: "5d-1.1", lv: 1, f(r) {
    const a = ri(r, 3, 12), b = ri(r, 2, 9), c = ri(r, 2, 8);
    return { q: `長方體的長 ${a} 公分、寬 ${b} 公分、高 ${c} 公分，體積是幾立方公分？`, a: a * b * c, h: `體積 = 長 × 寬 × 高 = ${a} × ${b} × ${c}。`, d: { [key(a + b + c)]: "體積要用乘的，不是把三個數相加。" } };
  } },
  { id: "5d-3.3", lv: 2, f(r) {
    const l = pick(r, [10, 12, 15, 20, 25]), w = pick(r, [8, 10, 12, 15]), t = ri(r, 1, 5);
    return { q: `長 ${l} 公分、寬 ${w} 公分的長方體水槽，放入一塊石頭後水面升高 ${t} 公分，石頭的體積是幾立方公分？`, a: l * w * t, h: `石頭體積 = 水槽底面積 × 水面升高 = ${l} × ${w} × ${t}。`, d: { [key(l * w)]: "那是底面積。還要乘上水面升高的高度。" } };
  } },
  { id: "5d-7.2", lv: 2, f(r) {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9);
    return { q: `長方體的長 ${a} 公分、寬 ${b} 公分、高 ${c} 公分，表面積是幾平方公分？`, a: 2 * (a * b + b * c + a * c),
      h: `表面積 = 2 × (長×寬 + 寬×高 + 長×高) = 2 × (${a * b} + ${b * c} + ${a * c})。`, d: { [key(a * b + b * c + a * c)]: "長方體有六個面，三組相對的面一樣大，要 × 2。" } };
  } },
  { id: "6u-7.1", lv: 2, f(r) {
    const x = ri(r, 2, 12);
    if (r() < 0.3) {
      const dd = 2 * x;
      return { q: `圓周率用 3.14，直徑 ${dd} 公分的圓，面積是幾平方公分？`, a: +(3.14 * x * x).toFixed(2), lv: 3,
        h: `半徑 = ${dd} ÷ 2 = ${x}，面積 = ${x} × ${x} × 3.14。`, d: { [key(3.14 * dd * dd)]: "題目給的是直徑，要先除以 2 變成半徑。" } };
    }
    return { q: `圓周率用 3.14，半徑 ${x} 公分的圓，面積是幾平方公分？`, a: +(3.14 * x * x).toFixed(2), h: `圓面積 = 半徑 × 半徑 × 3.14 = ${x} × ${x} × 3.14。`, d: { [key(3.14 * x * 2)]: "那是圓周長。面積要用半徑 × 半徑。" } };
  } },
  { id: "6d-2.2", lv: 2, f(r) {
    const a = ri(r, 40, 80), b = ri(r, 40, 80), t = ri(r, 3, 15);
    return { q: `甲乙兩人相距 ${(a + b) * t} 公尺，同時出發相向而行，甲每分鐘走 ${a} 公尺，乙每分鐘走 ${b} 公尺，幾分鐘後相遇？`, a: t, h: `相遇時間 = 距離 ÷ 速度和 = ${(a + b) * t} ÷ (${a} + ${b})。` };
  } },
  { id: "6d-3.1", lv: 2, f(r) {
    const b = pick(r, [4, 6, 8, 10]), t = ri(r, 3, 9), H = ri(r, 4, 12);
    return { q: `三角柱的底面是底 ${b} 公分、高 ${t} 公分的三角形，柱高 ${H} 公分，體積是幾立方公分？`, a: ((b * t) / 2) * H, h: `柱體體積 = 底面積 × 高 = (${b} × ${t} ÷ 2) × ${H}。`, d: { [key(b * t * H)]: "三角形底面積要 ÷ 2。" } };
  } },
  { id: "6d-5.1", lv: 2, f(r) {
    const d = ri(r, 2, 20), s = ri(r, 5, 40);
    return { q: `兩數的和是 ${2 * s + d}，差是 ${d}，較大的數是多少？`, a: s + d, h: `較大數 = (和 + 差) ÷ 2 = (${2 * s + d} + ${d}) ÷ 2。`, d: { [key(s)]: "那是較小的數，題目問的是較大的。" } };
  } },
  { id: "6d-5.3", lv: 3, f(r) {
    const n = ri(r, 6, 15), k = ri(r, 1, n - 1);
    return { q: `雞兔共 ${n} 隻，共 ${2 * n + 2 * k} 隻腳，兔有幾隻？`, a: k,
      h: `假設全是雞：2 × ${n} = ${2 * n} 隻腳，少了 ${2 * k} 隻，每換一隻兔多 2 隻腳，所以 ${2 * k} ÷ 2。`, d: { [key(n - k)]: "那是雞的隻數，題目問的是兔。" } };
  } },

  /* ---- 以下是新增的題型 ---- */
  { id: "3u-7.2", lv: 1, f(r) {
    const d = ri(r, 3, 9), k = ri(r, 3, 12), m = ri(r, 1, d - 1), n = d * k + m;
    return { q: `${n} 顆糖果，每 ${d} 顆裝成一袋，最多裝幾袋？剩下幾顆？請填「剩下的顆數」。`, a: m, h: `${n} ÷ ${d} = ${k} ……${m}，餘數就是剩下的顆數。`, d: { [key(k)]: "那是袋數（商），題目問的是剩下的（餘數）。" } };
  } },
  { id: "3d-1.2", lv: 1, f(r) {
    const d = ri(r, 5, 12), a = ri(r, 1, d - 3), b = ri(r, 1, d - a - 1), ans = `${a + b}/${d}`;
    const wrong = `${a + b}/${2 * d}`, third = `${a + b + 1}/${d}`;
    return { q: `${a}/${d} + ${b}/${d} = ?`, o: shuffle([ans, wrong, third], r), a: ans, h: "分母相同的分數相加，分母不變，分子相加。", d: { [wrong]: "分母不用相加，分母要保持不變。" } };
  } },
  { id: "3d-1.3", lv: 1, f(r) {
    const d = ri(r, 5, 12), b = ri(r, 1, d - 3), a = ri(r, b + 1, d - 1), ans = `${a - b}/${d}`;
    const wrong = `${a + b}/${d}`, third = `${a - b}/${2 * d}`;
    return { q: `${a}/${d} − ${b}/${d} = ?`, o: shuffle([ans, wrong, third], r), a: ans, h: "分母相同的分數相減，分母不變，分子相減。", d: { [wrong]: "這是相加的結果，題目是減法。", [third]: "分母不用跟著減，分母要保持不變。" } };
  } },
  { id: "4d-3.4", lv: 1, f(r) {
    const n = ri(r, 1100, 9899), ans = Math.round(n / 100) * 100;
    return { q: `把 ${n} 四捨五入到百位，是多少？`, a: ans, h: `看十位數 ${Math.floor(n / 10) % 10}：${Math.floor(n / 10) % 10 >= 5 ? "5 以上，進位" : "4 以下，捨去"}。`,
      d: { [key(Math.floor(n / 100) * 100)]: "四捨五入要看十位數，不是一律捨去。", [key(Math.ceil(n / 100) * 100)]: "四捨五入要看十位數，不是一律進位。" } };
  } },
  { id: "4d-5.1", lv: 1, f(r) {
    const x = ri(r, 11, 99), n = ri(r, 2, 9);
    if (x % 10 === 0) return GENS.find((g) => g.id === "4d-5.1").f(r);
    return { q: `${x / 10} × ${n} = ?`, a: +((x * n) / 10).toFixed(1), h: `先當成整數：${x} × ${n} = ${x * n}，再把小數點點回一位。`, d: { [key(x * n)]: "乘完後別忘了把小數點點回去。" } };
  } },
  { id: "4u-4.1", lv: 1, f(r) {
    const d = ri(r, 3, 9), k = ri(r, 150, 1100), m = ri(r, 1, d - 1), n = d * k + m;
    return r() < 0.5
      ? { q: `${n} ÷ ${d} 的商是多少？（餘數不用寫）`, a: k, h: `${n} ÷ ${d} = ${k} ……${m}。` }
      : { q: `${n} ÷ ${d} 的餘數是多少？`, a: m, h: `${n} ÷ ${d} = ${k} ……${m}。`, d: { [key(k)]: "那是商，題目問的是餘數。" } };
  } },
];

export const GEN_IDS = new Set(GENS.map((g) => g.id));
export const gradeOf = (id) => +id[0];

export function runGen(id, r) {
  const g = GENS.find((x) => x.id === id);
  if (!g) return null;
  const q = g.f(r);
  if (q.d) delete q.d[q.o ? q.a : key(q.a)]; // 誘答剛好等於正確答案時（例如面積＝周長）不顯示診斷
  q.unit = id; q.qid = "gen:" + id; q.lv = q.lv || g.lv;
  return q;
}
