/* 題庫品質檢查：每個產生器跑 3000 個種子，檢查答案、選項、診斷、單元編號 */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { GENS, runGen, rng, key } from "../src/gen.js";
import { isCorrect, buildMock, buildQuiz, fixedToQ } from "../src/exam.js";

// 單元編號必須存在於目錄
// 目錄在網站專案裡；後端單獨放在另一個 repo 時，用 CATALOG_PATH 指到 catalog.js，沒有就略過這項檢查
const catPath = process.env.CATALOG_PATH || new URL("../../site/assets/js/catalog.js", import.meta.url).pathname;
const ids = new Set(), hasCat = fs.existsSync(catPath);
if (hasCat) {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(catPath, "utf8") + ";this.C=CATALOG", ctx);
  ctx.C.forEach((s) => s.ch.forEach((c, i) => c.split("|").slice(1).forEach((_, j) => ids.add(`${s.id}-${i + 1}.${j + 1}`))));
} else console.warn("（找不到 catalog.js，略過單元編號檢查；可用 CATALOG_PATH 指定）");

let n = 0;
for (const g of GENS) {
  if (hasCat) assert.ok(ids.has(g.id), `產生器 ${g.id} 不在康軒目錄裡`);
  const seen = new Set();
  for (let seed = 1; seed <= 3000; seed++) {
    const q = runGen(g.id, rng(seed * 7919)); n++;
    const tag = `${g.id} seed=${seed}`;
    assert.ok(q.q && q.h, tag + " 缺題目或提示");
    if (q.o) {
      assert.ok(q.o.length >= 2 && new Set(q.o).size === q.o.length, tag + " 選項重複或太少");
      assert.ok(q.o.includes(q.a), tag + " 答案不在選項裡");
    } else {
      assert.ok(Number.isFinite(q.a) && q.a >= 0, tag + " 答案不是有限非負數：" + q.a);
      assert.ok(Math.abs(q.a * 100 - Math.round(q.a * 100)) < 1e-6, tag + " 答案超過兩位小數：" + q.a);
    }
    assert.ok(isCorrect(q, q.a), tag + " 標準答案被判錯");
    if (!q.o) assert.ok(isCorrect(q, String(q.a)), tag + " 字串答案被判錯");
    for (const k of Object.keys(q.d || {})) assert.notEqual(k, q.o ? q.a : key(q.a), tag + " 診斷鍵＝正確答案");
    seen.add(q.q);
  }
  assert.ok(seen.size >= 15, `${g.id} 3000 次只出了 ${seen.size} 種題目，太少`);
  console.log(`✓ ${g.id.padEnd(7)} lv${g.lv}  ${seen.size} 種不同題目`);
}

// 固定題庫
const rows = fs.existsSync("data-out/bank.json") ? JSON.parse(fs.readFileSync("data-out/bank.json", "utf8")) : [];
rows.forEach((r) => { if (hasCat) assert.ok(ids.has(r.unit), `固定題 ${r.id} 的單元 ${r.unit} 不在目錄`); const q = fixedToQ(r); assert.ok(isCorrect(q, q.a), r.id + " 標準答案被判錯"); });

// 組卷
for (const grade of [3, 4, 5, 6]) {
  for (let s = 0; s < 200; s++) {
    const m = buildMock(grade, rows, rng(s));
    assert.equal(m.length, 10, `${grade} 年級模擬卷題數 ${m.length}`);
    assert.equal(new Set(m.map((q) => q.q)).size, 10, "模擬卷有重複題");
    for (let i = 1; i < m.length; i++) assert.ok(m[i - 1].lv <= m[i].lv, "模擬卷沒有由易到難");
  }
  const m = buildMock(grade, rows, rng(1)); console.log(`✓ ${grade} 年級模擬卷難度分布：` + [1, 2, 3].map((l) => `lv${l}×${m.filter((q) => q.lv === l).length}`).join(" "));
}
for (const u of new Set([...GENS.map((g) => g.id), ...rows.map((r) => r.unit)])) assert.ok(buildQuiz(u, rows, rng(5)).length >= 1, u + " 小測驗沒有題目");
console.log(`全部通過（共檢查 ${n} 題）`);
