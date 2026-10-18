/* 端對端測試：用假的 D1（node:sqlite）、假的 KV、本機假 JWKS，直接呼叫 Worker */
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { handle } from "../src/index.js";

/* --- 假 JWKS 伺服器 --- */
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256", use: "sig" };
const srv = http.createServer((q, s) => { s.setHeader("content-type", "application/json"); s.setHeader("cache-control", "max-age=3600"); s.end(JSON.stringify({ keys: [jwk] })); });
await new Promise((r) => srv.listen(0, r));
const PID = "test-proj";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function token(email, o = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: "https://securetoken.google.com/" + PID, aud: PID, sub: "uid-" + email, iat: now - 5, exp: now + 3600, auth_time: now - 5, email, email_verified: true, firebase: { sign_in_provider: "google.com", identities: {} }, ...o.claims };
  const head = b64({ alg: "RS256", kid: "k1", typ: "JWT" }), body = b64(claims);
  const sig = crypto.sign("RSA-SHA256", Buffer.from(head + "." + body), o.key || privateKey).toString("base64url");
  return head + "." + body + "." + sig;
}

/* --- 假 D1 / KV --- */
const sql = new DatabaseSync(":memory:"); sql.exec(fs.readFileSync("schema.sql", "utf8"));
class Stmt { constructor(s) { this.s = s; this.a = []; } bind(...a) { this.a = a; return this; }
  async first() { return sql.prepare(this.s).get(...this.a) || null; }
  async all() { return { results: sql.prepare(this.s).all(...this.a) }; }
  async run() { sql.prepare(this.s).run(...this.a); return { success: true }; }
  sync() { sql.prepare(this.s).run(...this.a); } }
const DB = { prepare: (s) => new Stmt(s), async batch(list) { sql.exec("BEGIN"); try { list.forEach((x) => x.sync()); sql.exec("COMMIT"); } catch (e) { sql.exec("ROLLBACK"); throw e; } return []; } };
const store = { bank: JSON.parse(fs.readFileSync("data-out/bank.json", "utf8")), roster: JSON.parse(fs.readFileSync("data-out/roster.json", "utf8")) };
const KV = { get: async (k) => store[k] };
const env = { DB, KV, FIREBASE_PROJECT_ID: PID, JWKS_URL: `http://127.0.0.1:${srv.address().port}/`, ALLOWED_ORIGINS: "https://good.github.io", ALLOW_LOCALHOST: "0" };

const T1 = "student1@example.com", T2 = "student2@example.com", TEA = "teacher@example.com";
async function api(method, path, tok, body, headers = {}) {
  const res = await handle(new Request("http://w" + path, { method, headers: { ...(tok ? { Authorization: "Bearer " + tok } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined }), env);
  return { status: res.status, json: await res.json(), headers: res.headers };
}
const t = (name, fn) => fn().then(() => console.log("✓", name), (e) => { console.error("✗", name); throw e; });
const sess = (sid) => JSON.parse(sql.prepare("SELECT state FROM sessions WHERE id=?").get(sid).state);

await t("沒有 / 假造 / 過期 / 錯專案 / 未驗證 email 的 token 全部擋下", async () => {
  assert.equal((await api("GET", "/api/me")).status, 401);
  assert.equal((await api("GET", "/api/me", "a.b.c")).status, 401);
  assert.equal((await api("GET", "/api/me", token(T1, { key: other.privateKey }))).status, 401, "簽章不對");
  assert.equal((await api("GET", "/api/me", token(T1, { claims: { exp: 1 } }))).status, 401, "過期");
  assert.equal((await api("GET", "/api/me", token(T1, { claims: { aud: "evil", iss: "https://securetoken.google.com/evil" } }))).status, 401, "別人的專案");
  assert.equal((await api("GET", "/api/me", token(T1, { claims: { email_verified: false } }))).status, 401);
  assert.equal((await api("GET", "/api/me", token(T1, { claims: { firebase: { sign_in_provider: "password" } } }))).status, 401, "非 Google 登入");
});
await t("Google 帳號對，但不在名單 → 403", async () => {
  const r = await api("GET", "/api/me", token("stranger@gmail.com")); assert.equal(r.status, 403); assert.equal(r.json.err, "not_in_roster");
});
await t("名單內的同學登入，拿到空白個人資料與貼紙定義", async () => {
  const r = await api("GET", "/api/me", token(T1)); assert.equal(r.status, 200);
  assert.equal(r.json.user.name, "小明"); assert.equal(r.json.data.pts, 0); assert.ok(r.json.stk.length >= 10); assert.ok(!JSON.stringify(r.json.stk).includes("ok"));
});
await t("小測驗：題目不含答案；答錯有診斷；重複送出擋下；完成給積分", async () => {
  const tok = token(T1), s = await api("POST", "/api/start", tok, { kind: "quiz", unit: "5u-9.2" });
  assert.equal(s.status, 200); assert.ok(s.json.qs.length >= 5);
  const raw = JSON.stringify(s.json); assert.ok(!/"a":|"h":|"d":/.test(raw), "題目回應裡不該有答案/提示/診斷：" + raw.slice(0, 200));
  const st = sess(s.json.sid), q0 = st.qs[0];
  const wrongV = Object.keys(q0.d)[0]; assert.ok(wrongV, "應有診斷");
  let r = await api("POST", "/api/check", tok, { sid: s.json.sid, i: 0, v: wrongV });
  assert.equal(r.json.ok, false); assert.ok(r.json.diag.includes("÷ 2")); assert.equal(r.json.a, q0.a);
  assert.equal((await api("POST", "/api/check", tok, { sid: s.json.sid, i: 0, v: q0.a })).status, 409, "同一題不能重答");
  for (let i = 1; i < st.qs.length; i++) assert.equal((await api("POST", "/api/check", tok, { sid: s.json.sid, i, v: st.qs[i].a })).json.ok, true);
  const f = await api("POST", "/api/finish", tok, { sid: s.json.sid });
  assert.equal(f.json.n, st.qs.length); assert.equal(f.json.c, st.qs.length - 1); assert.ok(f.json.gain >= 10 * (st.qs.length - 1) + 20);
  assert.ok(f.json.got.includes("first"));
  assert.equal(f.json.data.wr.length, 1, "答錯進錯題本");
  assert.equal((await api("POST", "/api/finish", tok, { sid: s.json.sid })).status, 409);
});
await t("別人的 session 用不了", async () => {
  const s = await api("POST", "/api/start", token(T1), { kind: "quiz", unit: "5u-9.2" });
  assert.equal((await api("POST", "/api/check", token(T2), { sid: s.json.sid, i: 0, v: 1 })).status, 404);
});
await t("模擬卷：10 題、由易到難、伺服器計時；交卷判分只算一次", async () => {
  const tok = token(T1), s = await api("POST", "/api/start", tok, { kind: "mock" });
  assert.equal(s.json.qs.length, 10); assert.equal(s.json.seconds, 1200);
  const st = sess(s.json.sid), lvs = st.qs.map((q) => q.lv); assert.deepEqual(lvs, [...lvs].sort());
  const ans = st.qs.map((q, i) => (i < 8 ? q.a : "99999"));
  const r = await api("POST", "/api/submit", tok, { sid: s.json.sid, ans });
  assert.equal(r.json.sc, 80); assert.equal(r.json.review.length, 2); assert.ok(r.json.got.includes("mock80"));
  assert.equal((await api("POST", "/api/submit", tok, { sid: s.json.sid, ans })).status, 409, "不能重複交卷");
});
await t("模擬卷超時：伺服器拒絕計分（前端改時間沒用）", async () => {
  const tok = token(T2), s = await api("POST", "/api/start", tok, { kind: "mock" }), st = sess(s.json.sid);
  sql.prepare("UPDATE sessions SET deadline=? WHERE id=?").run(Date.now() - 60e3, s.json.sid);
  const r = await api("POST", "/api/submit", tok, { sid: s.json.sid, ans: st.qs.map((q) => q.a) });
  assert.equal(r.json.late, true); assert.equal(r.json.sc, 0);
});
await t("每日一題：同班同一題、只能領一次", async () => {
  const a = await api("POST", "/api/start", token(T1), { kind: "daily" }), b = await api("POST", "/api/start", token(T2), { kind: "daily" });
  assert.equal(a.json.qs[0].q, b.json.qs[0].q, "同班同題");
  const q = sess(a.json.sid).qs[0];
  assert.equal((await api("POST", "/api/check", token(T1), { sid: a.json.sid, i: 0, v: q.a })).json.ok, true);
  const f = await api("POST", "/api/finish", token(T1), { sid: a.json.sid }); assert.ok(f.json.gain >= 40);
  const again = await api("POST", "/api/start", token(T1), { kind: "daily" }); assert.equal(again.json.done, true);
});
await t("防刷：每天超過 100 題後答對不再加分", async () => {
  const tok = token(T2); let last = 0;
  for (let k = 0; k < 40; k++) {
    const s = await api("POST", "/api/start", tok, { kind: "quiz", unit: "6d-5.1" }), st = sess(s.json.sid);
    for (let i = 0; i < st.qs.length; i++) await api("POST", "/api/check", tok, { sid: s.json.sid, i, v: st.qs[i].a });
    last = (await api("POST", "/api/finish", tok, { sid: s.json.sid })).json.gain;
  }
  const me = (await api("GET", "/api/me", tok)).json.data; assert.ok(me.cap.n > 100);
  assert.equal(last, 0, "超過上限後，答對與完成獎勵都不再加分，實際 +" + last);
});
await t("錯題訂正：答對兩次畢業", async () => {
  const tok = token(T1); let me = (await api("GET", "/api/me", tok)).json.data; const before = me.wr.length; assert.ok(before >= 1);
  for (let round = 0; round < 2; round++) {
    const s = await api("POST", "/api/start", tok, { kind: "fix" }), st = sess(s.json.sid);
    await api("POST", "/api/check", tok, { sid: s.json.sid, i: 0, v: st.qs[0].a }); await api("POST", "/api/finish", tok, { sid: s.json.sid });
  }
  me = (await api("GET", "/api/me", tok)).json.data; assert.equal(me.wr.length, before - 1); assert.equal(me.fx, 1);
});
await t("排行榜只含同班學生", async () => {
  const r = await api("GET", "/api/board", token(T1)); assert.ok(r.json.rows.length >= 2); assert.ok(r.json.rows.every((x) => x.n !== "老師"));
});
await t("列印練習卷不含固定題庫答案", async () => {
  const r = await api("GET", "/api/print?src=mix&n=10", token(T1)); assert.equal(r.json.qs.length, 10);
  const fixedQ = new Set(store.bank.map((b) => b.q)); assert.ok(r.json.qs.every((q) => !fixedQ.has(q.q)));
});
await t("老師後台：學生 403、老師看得到全班與迷思統計", async () => {
  assert.equal((await api("GET", "/api/admin/overview", token(T1))).status, 403);
  const r = await api("GET", "/api/admin/overview", token(TEA)); assert.equal(r.status, 200);
  assert.ok(r.json.students.length >= 2); assert.ok(r.json.units.length >= 1); assert.ok(r.json.never.some((x) => x.name === "小美")); assert.ok(r.json.misconceptions.length >= 1);
});
await t("CORS：只允許名單內的網站", async () => {
  const ok = await api("GET", "/api/health", null, null, { Origin: "https://good.github.io" }); assert.equal(ok.headers.get("access-control-allow-origin"), "https://good.github.io");
  const no = await api("GET", "/api/health", null, null, { Origin: "https://evil.example" }); assert.equal(no.headers.get("access-control-allow-origin"), null);
});
await t("名單移除 → 立刻失去權限（60 秒快取內也不會誤放行新帳號）", async () => {
  store.roster = store.roster.filter((x) => x.email !== T2);
  // 快取尚未過期時仍是舊名單；模擬快取過期
  const realNow = Date.now; Date.now = () => realNow() + 61e3;
  try { assert.equal((await api("GET", "/api/me", token(T2))).status, 403); } finally { Date.now = realNow; }
});
srv.close();
console.log("端對端測試全部通過");
