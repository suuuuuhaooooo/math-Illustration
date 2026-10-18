/* 驗證 Firebase 登入產生的 ID Token（RS256 JWT）。
   不需要任何套件，也不需要服務帳號金鑰：公鑰是 Google 公開的 JWKS。 */
const JWKS_DEFAULT = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let cache = { keys: new Map(), exp: 0 };

const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const json = (s) => JSON.parse(new TextDecoder().decode(b64u(s)));

async function loadKeys(env) {
  const r = await fetch(env.JWKS_URL || JWKS_DEFAULT);
  if (!r.ok) throw new Error("jwks_fetch");
  const m = /max-age=(\d+)/.exec(r.headers.get("cache-control") || "");
  const { keys } = await r.json();
  const map = new Map();
  for (const jwk of keys) map.set(jwk.kid, await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]));
  cache = { keys: map, exp: Date.now() + Math.min(+(m ? m[1] : 3600), 3600) * 1000 };
}

export class AuthError extends Error {}

export async function verifyToken(token, env) {
  const fail = (m) => { throw new AuthError(m); };
  const parts = String(token || "").split(".");
  if (parts.length !== 3) fail("format");
  let head, c;
  try { head = json(parts[0]); c = json(parts[1]); } catch { fail("format"); }
  if (head.alg !== "RS256" || !head.kid) fail("alg");
  if (Date.now() >= cache.exp || !cache.keys.has(head.kid)) await loadKeys(env); // 金鑰輪替時自動重抓
  const key = cache.keys.get(head.kid);
  if (!key) fail("kid");
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  if (!ok) fail("signature");
  const now = Math.floor(Date.now() / 1000), pid = env.FIREBASE_PROJECT_ID;
  if (!pid) throw new Error("FIREBASE_PROJECT_ID not set");
  if (c.iss !== "https://securetoken.google.com/" + pid || c.aud !== pid) fail("audience");
  if (!(c.exp > now)) fail("expired");
  if (c.iat > now + 300) fail("iat");
  if (!c.sub || typeof c.sub !== "string") fail("sub");
  if (!c.email || c.email_verified !== true) fail("email");
  const allowed = String(env.ALLOWED_PROVIDERS || "google.com").split(",").map((s) => s.trim());
  if (!allowed.includes(c.firebase && c.firebase.sign_in_provider)) fail("provider");
  return { uid: c.sub, email: c.email };
}

/* gmail 不分大小寫、忽略點與 +標籤；其他網域只轉小寫 */
export function normEmail(e) {
  e = String(e || "").trim().toLowerCase();
  const [l, d] = e.split("@");
  if (!d) return e;
  if (d === "gmail.com" || d === "googlemail.com") return l.split("+")[0].replace(/\./g, "") + "@gmail.com";
  return e;
}
