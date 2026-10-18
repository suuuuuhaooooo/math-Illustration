/* 組卷：小測驗、模擬卷（細目表）、每日一題。答案只留在伺服器。 */
import { GENS, GEN_IDS, runGen, gradeOf, shuffle, ri, rng, key } from "./gen.js";

/* ---- 固定題庫（來自 Google 試算表）轉成內部題目 ---- */
export function parseDiag(s, type) {
  const d = {};
  String(s || "").split(";;").forEach((p) => {
    const i = p.indexOf("=>");
    if (i < 1) return;
    const k = p.slice(0, i).trim(), v = p.slice(i + 2).trim();
    if (k && v) d[type === "num" ? key(k) : k] = v;
  });
  return d;
}
export function fixedToQ(row) {
  const o = row.type === "choice" ? String(row.options || "").split("|").map((s) => s.trim()).filter(Boolean) : null;
  return { unit: row.unit, qid: row.id, q: row.q, o, a: row.type === "num" ? +row.answer : String(row.answer), h: row.hint || "", d: parseDiag(row.diag, row.type), lv: +row.lv || 2, print: row.print === "1" || row.print === 1 };
}
const fixedFor = (bank, pred) => bank.filter((r) => r.active !== "0" && r.active !== 0 && pred(r)).map(fixedToQ);

function finalize(q, r) { if (q.o) q.o = shuffle(q.o, r); return q; }

/* ---- 小測驗：單元產生器 5 題＋固定題 2 題；沒有產生器就用固定題最多 5 題 ---- */
export function buildQuiz(unit, bank, r) {
  const fx = shuffle(fixedFor(bank, (x) => x.unit === unit), r), out = [], seen = new Set();
  const add = (q) => { if (q && !seen.has(q.q)) { seen.add(q.q); out.push(finalize(q, r)); return true; } return false; };
  if (GEN_IDS.has(unit)) {
    for (let i = 0; out.length < 5 && i < 40; i++) add(runGen(unit, r));
    fx.slice(0, 2).forEach(add);
  } else fx.slice(0, 5).forEach(add);
  return out;
}

/* ---- 模擬卷：雙向細目表。難度 3:5:2，同一單元最多 2 題，由易到難 ---- */
export function mockPool(grade, bank) {
  let units = GENS.filter((g) => gradeOf(g.id) <= grade && gradeOf(g.id) >= grade - 1);
  if (units.length < 3) units = GENS.filter((g) => gradeOf(g.id) <= grade);
  const ok = new Set(units.map((g) => g.id));
  const cands = units.map((g) => ({ kind: "gen", unit: g.id, lv: g.lv }));
  fixedFor(bank, (x) => gradeOf(x.unit) <= grade && gradeOf(x.unit) >= grade - 1).forEach((q) => cands.push({ kind: "fix", unit: q.unit, lv: q.lv, q }));
  return { cands, units: ok };
}
export function buildMock(grade, bank, r, n = 10) {
  const { cands } = mockPool(grade, bank);
  const c1 = Math.round(n * 0.3), c3 = Math.round(n * 0.2), plan = [[3, c3], [2, n - c1 - c3], [1, c1]];
  const out = [], seen = new Set(), per = {};
  const tryAdd = (c, maxPer) => {
    if ((per[c.unit] || 0) >= maxPer) return false;
    const q = c.kind === "gen" ? runGen(c.unit, r) : { ...c.q };
    if (!q || seen.has(q.q)) return false;
    seen.add(q.q); per[c.unit] = (per[c.unit] || 0) + 1; out.push(finalize(q, r)); return true;
  };
  const fill = (need, filt, maxPer) => {
    const list = shuffle(cands.filter(filt), r);
    for (let round = 0; need > 0 && round < 6 && list.length; round++) for (const c of list) { if (need > 0 && tryAdd(c, maxPer)) need--; }
    return need;
  };
  let lack = 0;
  for (const [lv, need] of plan) lack += fill(need, (c) => c.lv === lv, 2);
  if (lack) lack = fill(lack, () => true, 3);
  if (lack) fill(lack, () => true, 99);
  return out.map((q, i) => [q, i]).sort((a, b) => a[0].lv - b[0].lv || a[1] - b[1]).map((x) => x[0]);
}

/* ---- 每日一題：全班同一題（只用產生器，種子＝日期＋班級） ---- */
export function buildDaily(grade, cls, date) {
  const r = rng(date + "|" + cls);
  let units = GENS.filter((g) => gradeOf(g.id) <= grade && gradeOf(g.id) >= grade - 1);
  if (units.length < 3) units = GENS.filter((g) => gradeOf(g.id) <= grade);
  const g = units[ri(r, 0, units.length - 1)];
  return finalize(runGen(g.id, r), r);
}

/* ---- 評分 ---- */
export function isCorrect(q, v) {
  if (v === null || v === undefined || v === "") return false;
  if (q.o) return String(v) === String(q.a);
  const x = +v;
  return Number.isFinite(x) && Math.abs(x - q.a) < 1e-6;
}
export function diagnose(q, v) {
  if (!q.d || v === null || v === undefined || v === "") return "";
  return (q.o ? q.d[String(v)] : q.d[key(v)]) || "";
}
/* 給前端的題目（不含答案、提示、診斷） */
export const publicQ = (q, i) => ({ i, unit: q.unit, q: q.q, o: q.o || undefined });
