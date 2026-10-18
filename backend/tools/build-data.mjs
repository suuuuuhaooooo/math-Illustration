/* 把「題庫」和「名單」從 Google 試算表（或 CSV）整理、檢查，再同步到 Cloudflare KV。
   用法：
     node tools/build-data.mjs              只檢查並輸出到 data-out/（本機試跑）
     node tools/build-data.mjs --upload     檢查通過才上傳到 KV（GitHub Action 用這個）

   資料來源（依序，用第一個有設定的）：
     1. Google Sheets API：GOOGLE_SA_JSON（服務帳號金鑰 JSON 全文）＋ SHEET_ID
        試算表不用公開，只要「共用」給服務帳號的 email（檢視者即可）
     2. CSV 網址：BANK_CSV_URL、ROSTER_CSV_URL
     3. 本機檔案：data-src/bank.csv、data-src/roster.csv
   上傳需要：CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID、KV_NAMESPACE_ID */
import fs from "node:fs";
import crypto from "node:crypto";

const E = process.env, upload = process.argv.includes("--upload");
const UNIT_RE = /^[3-6][ud]-\d{1,2}\.\d{1,2}$/;

export function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); f = ""; if (row.some((x) => x !== "")) rows.push(row); row = []; }
    else f += c;
  }
  row.push(f); if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}
export function toObjects(rows) {
  const head = rows[0].map((s) => s.trim().toLowerCase());
  return rows.slice(1).map((r, i) => { const o = { _row: i + 2 }; head.forEach((h, j) => (o[h] = (r[j] ?? "").trim())); return o; });
}

/* ---- 檢查 ---- */
export function checkBank(rows) {
  const errs = [], ids = new Set(), out = [];
  for (const r of rows) {
    const e = (m) => errs.push(`題庫第 ${r._row} 列：${m}`);
    if (!r.id) { if (Object.values(r).some((v) => v && v !== r._row)) e("缺少 id"); continue; }
    if (ids.has(r.id)) e(`id「${r.id}」重複`); ids.add(r.id);
    if (!UNIT_RE.test(r.unit)) e(`unit「${r.unit}」格式不對，例如 6d-5.3`);
    if (!["num", "choice"].includes(r.type)) e(`type 要填 num 或 choice`);
    if (!r.q) e("題目是空的");
    const lv = r.lv === "" ? 2 : +r.lv;
    if (![1, 2, 3].includes(lv)) e("lv 要填 1、2 或 3");
    if (r.type === "num" && !Number.isFinite(+r.answer)) e(`數值題的 answer「${r.answer}」不是數字`);
    if (r.type === "choice") {
      const o = r.options.split("|").map((s) => s.trim()).filter(Boolean);
      if (o.length < 2) e("選擇題的 options 要用 | 分隔，至少兩個");
      else if (!o.includes(r.answer)) e(`answer「${r.answer}」不在 options 裡`);
      if (new Set(o).size !== o.length) e("options 有重複");
    }
    if (r.diag) for (const p of r.diag.split(";;")) if (!p.includes("=>")) e(`diag「${p}」格式要是「錯誤答案=>提示」`);
    out.push({ id: r.id, unit: r.unit, type: r.type, lv, q: r.q, options: r.options, answer: r.answer, hint: r.hint || "", diag: r.diag || "", print: r.print === "1" ? "1" : "", active: r.active === "0" ? "0" : "1" });
  }
  return { errs, out };
}
export function checkRoster(rows) {
  const errs = [], seen = new Set(), seat = new Set(), out = [];
  for (const r of rows) {
    const e = (m) => errs.push(`名單第 ${r._row} 列：${m}`);
    if (!r.email) continue;
    const em = r.email.toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) e(`email「${r.email}」格式不對`);
    if (seen.has(em)) e(`email「${em}」重複`); seen.add(em);
    const role = r.role === "" ? "student" : r.role;
    if (!["student", "teacher", "admin"].includes(role)) e("role 要填 student 或 teacher");
    if (!r.class) e("缺少 class");
    if (role === "student") {
      if (!(+r.no > 0)) e("學生要有座號 no");
      if (seat.has(r.class + "|" + r.no)) e(`${r.class} 班 ${r.no} 號重複`); seat.add(r.class + "|" + r.no);
    }
    const grade = r.grade === "" ? 6 : +r.grade;
    if (![3, 4, 5, 6].includes(grade)) e("grade 要填 3 到 6");
    out.push({ email: em, class: r.class, no: +r.no || 0, name: r.name || "", role, grade, active: r.active === "0" ? "0" : "1" });
  }
  if (!out.some((x) => x.role !== "student" && x.active !== "0")) errs.push("名單裡至少要有一位 teacher，否則沒人能開老師後台");
  return { errs, out };
}

/* ---- 讀取來源 ---- */
async function sheetsToken(sa) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url"), now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" }), claim = b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 });
  const sig = crypto.sign("RSA-SHA256", Buffer.from(head + "." + claim), sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: head + "." + claim + "." + sig }) });
  if (!r.ok) throw new Error("Google 服務帳號授權失敗：" + (await r.text()));
  return (await r.json()).access_token;
}
async function readSource() {
  if (E.GOOGLE_SA_JSON && E.SHEET_ID) {
    const tok = await sheetsToken(JSON.parse(E.GOOGLE_SA_JSON)), get = async (tab) => {
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${E.SHEET_ID}/values/${encodeURIComponent(tab)}?valueRenderOption=FORMATTED_VALUE`, { headers: { Authorization: "Bearer " + tok } });
      if (!r.ok) throw new Error(`讀取試算表分頁「${tab}」失敗：` + (await r.text()));
      return (await r.json()).values || [];
    };
    console.log("來源：Google Sheets API");
    return { bank: await get("bank"), roster: await get("roster") };
  }
  if (E.BANK_CSV_URL && E.ROSTER_CSV_URL) {
    console.log("來源：CSV 網址");
    const g = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error("下載失敗 " + r.status); return parseCSV(await r.text()); };
    return { bank: await g(E.BANK_CSV_URL), roster: await g(E.ROSTER_CSV_URL) };
  }
  console.log("來源：data-src/ 本機 CSV");
  return { bank: parseCSV(fs.readFileSync("data-src/bank.csv", "utf8")), roster: parseCSV(fs.readFileSync("data-src/roster.csv", "utf8")) };
}

async function kvPut(key, value) {
  const { CLOUDFLARE_API_TOKEN: t, CLOUDFLARE_ACCOUNT_ID: a, KV_NAMESPACE_ID: n } = E;
  if (!t || !a || !n) throw new Error("缺少 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / KV_NAMESPACE_ID");
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/storage/kv/namespaces/${n}/values/${key}`, { method: "PUT", headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify(value) });
  if (!r.ok) throw new Error(`上傳 ${key} 失敗：` + (await r.text()));
}

if (import.meta.url === "file://" + process.argv[1]) {
  const src = await readSource();
  const b = checkBank(toObjects(src.bank)), r = checkRoster(toObjects(src.roster));
  const errs = [...b.errs, ...r.errs];
  if (errs.length) { console.error("資料有問題，沒有上傳（線上維持上一版）：\n" + errs.map((x) => " - " + x).join("\n")); process.exit(1); }
  fs.mkdirSync("data-out", { recursive: true });
  fs.writeFileSync("data-out/bank.json", JSON.stringify(b.out));
  fs.writeFileSync("data-out/roster.json", JSON.stringify(r.out));
  console.log(`題庫 ${b.out.length} 題、名單 ${r.out.length} 人，檢查通過`);
  if (upload) { await kvPut("bank", b.out); await kvPut("roster", r.out); console.log("已同步到 Cloudflare KV"); }
}
