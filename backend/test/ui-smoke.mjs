/* 瀏覽器冒煙測試：真的 Chromium 開網站，Firebase 登入換成假的（簽好章的 token），後端是真的 Worker 程式碼 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import { handle } from "../src/index.js";
const require = createRequire("/opt/npm-tools/node_modules/");
const { chromium } = require("playwright");

const SITE = path.resolve("../site"), PID = "test-proj";
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256" };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function token(email) { const now = Math.floor(Date.now() / 1000), head = b64({ alg: "RS256", kid: "k1" }), body = b64({ iss: "https://securetoken.google.com/" + PID, aud: PID, sub: "u-" + email, iat: now - 5, exp: now + 3600, email, email_verified: true, firebase: { sign_in_provider: "google.com" } }); return head + "." + body + "." + crypto.sign("RSA-SHA256", Buffer.from(head + "." + body), privateKey).toString("base64url"); }

const sql = new DatabaseSync(":memory:"); sql.exec(fs.readFileSync("schema.sql", "utf8"));
class Stmt { constructor(s) { this.s = s; this.a = []; } bind(...a) { this.a = a; return this; } async first() { return sql.prepare(this.s).get(...this.a) || null; } async all() { return { results: sql.prepare(this.s).all(...this.a) }; } async run() { sql.prepare(this.s).run(...this.a); return {}; } sync() { sql.prepare(this.s).run(...this.a); } }
const DB = { prepare: (s) => new Stmt(s), async batch(l) { sql.exec("BEGIN"); l.forEach((x) => x.sync()); sql.exec("COMMIT"); return []; } };
const store = { bank: JSON.parse(fs.readFileSync("data-out/bank.json")), roster: JSON.parse(fs.readFileSync("data-out/roster.json")) };

const jw = http.createServer((q, s) => { s.setHeader("content-type", "application/json"); s.end(JSON.stringify({ keys: [jwk] })); }); await new Promise((r) => jw.listen(0, r));
let PORT;
const env = { DB, KV: { get: async (k) => store[k] }, FIREBASE_PROJECT_ID: PID, JWKS_URL: `http://127.0.0.1:${jw.address().port}/`, ALLOWED_ORIGINS: "", ALLOW_LOCALHOST: "1" };
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".ttf": "font/ttf", ".woff": "font/woff" };
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/api/")) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await handle(new Request("http://w" + req.url, { method: req.method, headers: req.headers, body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let f = path.join(SITE, u.pathname === "/" ? "index.html" : u.pathname);
  if (!f.startsWith(SITE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": mime[path.extname(f)] || "application/octet-stream" }); res.end(fs.readFileSync(f));
});
await new Promise((r) => srv.listen(0, r)); PORT = srv.address().port;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
async function open(email) {
  const ctx = await browser.newContext(), page = await ctx.newPage(), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await ctx.route("**/assets/data/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: `var NB_CONFIG={api:"http://localhost:${PORT}",firebase:{apiKey:"x",authDomain:"x",projectId:"${PID}",appId:"x"},hd:""};` }));
  // 假的 Firebase：auth.js 換成直接給一個已登入（或未登入）的帳號
  await ctx.route("**/assets/js/auth.js", (r) => r.fulfill({ contentType: "text/javascript", body: email
    ? `var u={email:${JSON.stringify(email)}};window.__nbAuthResolve({user:function(){return window.__out?null:u},token:function(){return Promise.resolve(${JSON.stringify(email ? token(email) : "")})},signIn:function(){return Promise.resolve()},signOut:function(){window.__out=1;return Promise.resolve()}})`
    : `window.__nbAuthResolve({user:function(){return null},token:function(){return Promise.reject()},signIn:function(){return Promise.resolve()},signOut:function(){return Promise.resolve()}})` }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|creativecommons/, (r) => r.abort());
  return { page, errs, ctx };
}
const t = async (name, fn) => { try { await fn(); console.log("✓", name); } catch (e) { console.error("✗", name); throw e; } };
const answersOf = (sid) => JSON.parse(sql.prepare("SELECT state FROM sessions WHERE id=?").get(sid).state).qs.map((q) => q.a);
const lastSid = () => sql.prepare("SELECT id FROM sessions ORDER BY created DESC, rowid DESC LIMIT 1").get().id;
const url = (p) => `http://localhost:${PORT}/${p}`;

await t("未登入 → 看到 Google 登入按鈕，不是密碼欄", async () => {
  const { page, errs } = await open(null); await page.goto(url("member.html")); await page.waitForSelector(".gbtn");
  assert.equal(await page.locator("input[type=password]").count(), 0); assert.ok((await page.textContent("body")).includes("使用 Google 登入")); assert.deepEqual(errs, []);
});
await t("名單外的帳號 → 明確提示，不進入專區", async () => {
  const { page } = await open("stranger@gmail.com"); await page.goto(url("member.html")); await page.waitForSelector(".fb.no");
  assert.ok((await page.textContent(".fb.no")).includes("不在班級名單")); assert.equal(await page.locator(".tabs").count(), 0);
});
await t("名單內學生：首頁、小測驗逐題判分、結算積分", async () => {
  const { page, errs } = await open("student1@example.com"); await page.goto(url("member.html")); await page.waitForSelector(".tiles");
  assert.ok((await page.textContent(".who")).includes("601 班")); 
  await page.goto(url("member.html#quiz/5u-9.2")); await page.waitForSelector(".q");
  const ans = answersOf(lastSid());
  for (let i = 0; i < ans.length; i++) {
    await page.waitForSelector(".prog"); assert.ok((await page.textContent(".prog")).includes(`第 ${i + 1} /`));
    await page.fill("input.num", String(i === 0 ? 99999 : ans[i])); await page.click("button.go"); await page.waitForSelector(".fb.ok, .fb.no");
    if (i === 0) { assert.ok((await page.textContent(".fb.no")).includes("答案是")); }
    await page.click("button.go");
  }
  await page.waitForSelector(".stkgrid, .q:has-text('題答對')"); assert.ok((await page.textContent("body")).includes(`${ans.length - 1} / ${ans.length}`));
  assert.deepEqual(errs, []);
});
await t("模擬卷：作答、交卷、看到伺服器判分與錯因", async () => {
  const { page, errs } = await open("student1@example.com"); await page.goto(url("member.html#mock")); await page.click("button.go");
  await page.waitForSelector(".clock"); const ans = answersOf(lastSid());
  for (let i = 0; i < ans.length; i++) {
    const hasOpts = await page.locator(".opts button").count();
    if (hasOpts) await page.click(`.opts button[data-v="${String(ans[i]).replace(/"/g, '\\"')}"]`); else await page.fill("input.num", i === 0 ? "99999" : String(ans[i]));
    await page.click("button.go");
  }
  await page.waitForSelector(".q:has-text('分（')"); const body = await page.textContent("body"); assert.ok(body.includes("90 分（9 / 10）"), body.slice(0, 300)); assert.deepEqual(errs, []);
});
await t("學生看不到老師後台；老師可以，且畫面有資料", async () => {
  const s = await open("student1@example.com"); await s.page.goto(url("teacher.html")); await s.page.waitForSelector(".sheet"); assert.ok((await s.page.textContent("body")).includes("只有老師"));
  const tc = await open("teacher@example.com"); await tc.page.goto(url("teacher.html")); await tc.page.waitForSelector(".tb"); const b = await tc.page.textContent("body");
  assert.ok(b.includes("小明") && b.includes("還沒登入過") && b.includes("小華"), b.slice(0, 300)); assert.deepEqual(tc.errs, []);
});
await t("首頁（不載入 Firebase）顯示登入標籤；登入後顯示積分", async () => {
  const { page } = await open("student1@example.com"); await page.goto(url("member.html")); await page.waitForSelector(".tiles");
  await page.goto(url("index.html")); await page.waitForSelector(".chip"); assert.match(await page.textContent(".chip"), /小明・Lv\.\d+・\d+ 分/);
});
await browser.close(); srv.close(); jw.close();
console.log("瀏覽器冒煙測試全部通過");
