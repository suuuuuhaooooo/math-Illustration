/* 班級專區 API（Cloudflare Worker）。所有驗證、出卷、判分、積分都在這裡。
   前端只能：登入（Firebase）→ 要題目 → 送答案 → 看結果。 */
import { verifyToken, normEmail, AuthError } from "./auth.js";
import { blank, norm, ymd, rec, touchDay, award, mockBonus, overCap, tot, lv, STK_PUBLIC } from "./game.js";
import { buildQuiz, buildMock, buildDaily, isCorrect, diagnose, publicQ } from "./exam.js";
import { GEN_IDS, GENS, runGen, rng, gradeOf } from "./gen.js";

class HttpError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
const bad = (code, status = 400) => new HttpError(status, code);

/* ---- 資料（Google 試算表同步到 KV） ---- */
let mem = { t: 0, bank: [], roster: new Map() };
async function data(env) {
  if (Date.now() - mem.t < 60e3) return mem;
  const [b, r] = await Promise.all([env.KV.get("bank", "json"), env.KV.get("roster", "json")]);
  const roster = new Map();
  (r || []).forEach((x) => { if (x.active !== "0" && x.active !== 0) roster.set(normEmail(x.email), x); });
  mem = { t: Date.now(), bank: b || [], roster };
  return mem;
}

/* ---- CORS ---- */
function corsHeaders(req, env) {
  const o = req.headers.get("Origin") || "", list = String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const okLocal = env.ALLOW_LOCALHOST === "1" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  const h = { "Vary": "Origin", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (list.includes(o) || okLocal) {
    h["Access-Control-Allow-Origin"] = o;
    h["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    h["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    h["Access-Control-Max-Age"] = "600";
  }
  return h;
}
const out = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { ...h, "Content-Type": "application/json; charset=utf-8" } });

/* ---- 使用者與個人資料 ---- */
async function authed(req, env) {
  const m = /^Bearer (.+)$/.exec(req.headers.get("Authorization") || "");
  if (!m) throw bad("no_token", 401);
  let id;
  try { id = await verifyToken(m[1], env); } catch (e) { if (e instanceof AuthError) throw bad("bad_token", 401); throw e; }
  const D = await data(env), row = D.roster.get(normEmail(id.email));
  if (!row) throw bad("not_in_roster", 403);
  const user = { email: normEmail(id.email), uid: id.uid, cls: String(row.class), no: +row.no || 0, name: row.name || "座號" + row.no, role: row.role === "teacher" || row.role === "admin" ? "teacher" : "student", grade: Math.min(6, Math.max(3, +row.grade || 6)) };
  return { user, bank: D.bank, roster: D.roster };
}
async function loadProfile(env, u) {
  const r = await env.DB.prepare("SELECT data,cls,no,name,role,grade FROM profiles WHERE email=?").bind(u.email).first();
  if (!r) {
    const D = blank();
    await env.DB.prepare("INSERT OR IGNORE INTO profiles(email,cls,no,name,role,grade,data,updated) VALUES(?,?,?,?,?,?,?,?)")
      .bind(u.email, u.cls, u.no, u.name, u.role, u.grade, JSON.stringify(D), Date.now()).run();
    return D;
  }
  // 名單（試算表）改了班級、座號、名字時才同步，避免每次請求都寫資料庫
  if (r.cls !== u.cls || r.no !== u.no || r.name !== u.name || r.role !== u.role || r.grade !== u.grade)
    await env.DB.prepare("UPDATE profiles SET cls=?,no=?,name=?,role=?,grade=? WHERE email=?").bind(u.cls, u.no, u.name, u.role, u.grade, u.email).run();
  return norm(JSON.parse(r.data));
}
const saveProfile = (env, u, D) => env.DB.prepare("UPDATE profiles SET data=?, updated=? WHERE email=?").bind(JSON.stringify(D), Date.now(), u.email);

async function body(req) {
  const t = await req.text();
  if (t.length > 20000) throw bad("too_big", 413);
  try { return t ? JSON.parse(t) : {}; } catch { throw bad("bad_json"); }
}

/* ---- 作答階段（session） ---- */
const MOCK_SECONDS = 1200, GRACE = 10;
async function newSession(env, u, kind, qs, extra = {}) {
  const id = crypto.randomUUID(), now = Date.now();
  const deadline = kind === "mock" ? now + MOCK_SECONDS * 1000 : null;
  await env.DB.prepare("INSERT INTO sessions(id,email,kind,created,deadline,done,state) VALUES(?,?,?,?,?,0,?)")
    .bind(id, u.email, kind, now, deadline, JSON.stringify({ qs, ans: {}, ...extra })).run();
  if (Math.random() < 0.05) {
    await env.DB.prepare("DELETE FROM sessions WHERE created<?").bind(now - 2 * 864e5).run();
    await env.DB.prepare("DELETE FROM attempts WHERE ts<?").bind(now - 180 * 864e5).run();
  }
  return { sid: id, kind, deadline, seconds: kind === "mock" ? MOCK_SECONDS : 0, qs: qs.map(publicQ), ...extra };
}
async function getSession(env, u, sid, kinds) {
  const s = await env.DB.prepare("SELECT * FROM sessions WHERE id=? AND email=?").bind(String(sid), u.email).first();
  if (!s) throw bad("no_session", 404);
  if (s.done) throw bad("already_done", 409);
  if (kinds && !kinds.includes(s.kind)) throw bad("wrong_kind");
  return { ...s, st: JSON.parse(s.state) };
}
const saveSession = (env, s, done) => env.DB.prepare("UPDATE sessions SET state=?, done=? WHERE id=?").bind(JSON.stringify(s.st), done ? 1 : 0, s.id);
const attempt = (env, u, q, ok, dg) => env.DB.prepare("INSERT INTO attempts(email,cls,unit,qid,ok,dg,ts) VALUES(?,?,?,?,?,?,?)").bind(u.email, u.cls, q.unit, q.qid || "", ok ? 1 : 0, dg || "", Date.now());

/* ---- 路由 ---- */
const UNIT_RE = /^[3-6][ud]-\d{1,2}\.\d{1,2}$/;
const routes = {
  "GET /api/health": async () => ({ ok: true }),

  "GET /api/me": async (req, env) => {
    const { user, bank } = await authed(req, env);
    const D = await loadProfile(env, user);
    const units = [...new Set([...GEN_IDS, ...bank.filter((x) => x.active !== "0").map((x) => x.unit)])];
    return { user: { name: user.name, cls: user.cls, no: user.no, role: user.role, grade: user.grade }, data: D, stk: STK_PUBLIC, today: ymd(), units, gens: [...GEN_IDS] };
  },

  "POST /api/seen": async (req, env) => {
    const { user } = await authed(req, env), b = await body(req);
    const ids = (Array.isArray(b.ids) ? b.ids : []).filter((x) => UNIT_RE.test(String(x))).slice(0, 60);
    if (!ids.length) return { ok: true };
    const D = await loadProfile(env, user); let ch = false;
    ids.forEach((id) => { const x = (D.u[id] = D.u[id] || { n: 0, c: 0 }); if (!x.seen) { x.seen = 1; ch = true; } });
    if (ch) await saveProfile(env, user, D).run();
    return { ok: true };
  },

  "POST /api/start": async (req, env) => {
    const { user, bank } = await authed(req, env), b = await body(req), D = await loadProfile(env, user), t = ymd();
    if (b.kind === "quiz") {
      if (!UNIT_RE.test(String(b.unit))) throw bad("bad_unit");
      const qs = buildQuiz(b.unit, bank, Math.random);
      if (!qs.length) return { empty: true };
      return await newSession(env, user, "quiz", qs, { unit: b.unit, pts0: D.pts });
    }
    if (b.kind === "mock") return await newSession(env, user, "mock", buildMock(user.grade, bank, Math.random, 10));
    if (b.kind === "daily") {
      const q = buildDaily(user.grade, user.cls, t);
      if (D.dq[t]) return { done: true, ok: D.dq[t].ok, q: q.q, a: q.a, h: q.h };
      return await newSession(env, user, "daily", [q], { pts0: D.pts });
    }
    if (b.kind === "fix") {
      const qs = D.wr.slice(0, 10).map((w) => ({ unit: w.id, qid: "wrong", q: w.q, o: w.o || null, a: w.a, h: w.h || "", d: {}, lv: 2 }));
      if (!qs.length) return { empty: true };
      return await newSession(env, user, "fix", qs, { pts0: D.pts });
    }
    throw bad("bad_kind");
  },

  /* 練習模式：一題一題檢查 */
  "POST /api/check": async (req, env) => {
    const { user } = await authed(req, env), b = await body(req), s = await getSession(env, user, b.sid, ["quiz", "daily", "fix"]);
    const i = +b.i, q = s.st.qs[i];
    if (!q) throw bad("bad_index");
    if (s.st.ans[i] !== undefined) throw bad("already_answered", 409);
    const D = await loadProfile(env, user), ok = isCorrect(q, b.v), dg = ok ? "" : diagnose(q, b.v);
    s.st.ans[i] = { v: b.v === undefined ? null : b.v, ok };
    rec(D, q, ok, s.kind === "fix");
    await env.DB.batch([saveSession(env, s, false), saveProfile(env, user, D), attempt(env, user, q, ok, dg)]);
    return { ok, a: q.a, h: q.h, diag: dg, fixLeft: s.kind === "fix" ? D.wr.some((w) => w.k === q.unit + "|" + q.q) : undefined };
  },
  "POST /api/hint": async (req, env) => {
    const { user } = await authed(req, env), b = await body(req), s = await getSession(env, user, b.sid, ["quiz", "daily", "fix"]);
    const q = s.st.qs[+b.i];
    if (!q) throw bad("bad_index");
    return { h: q.h };
  },
  "POST /api/finish": async (req, env) => {
    const { user } = await authed(req, env), b = await body(req), s = await getSession(env, user, b.sid, ["quiz", "daily", "fix"]);
    const D = await loadProfile(env, user), pts0 = s.st.pts0 ?? D.pts, a = Object.values(s.st.ans), n = a.length, c = a.filter((x) => x.ok).length, t = ymd();
    if (s.kind === "quiz" && !overCap(D)) { if (n >= 3) D.pts += 20; if (n >= 5 && c === n) D.pf++; }
    if (s.kind === "daily" && n === 1 && !D.dq[t]) { D.dq[t] = { ok: a[0].ok }; D.pts += a[0].ok ? 30 : 5; }
    if (n) touchDay(D);
    const got = award(D);
    await env.DB.batch([saveSession(env, s, true), saveProfile(env, user, D)]);
    return { n, c, gain: D.pts - pts0, got, data: D };
  },

  /* 模擬卷：交卷時一次判分 */
  "POST /api/submit": async (req, env) => {
    const { user } = await authed(req, env), b = await body(req), s = await getSession(env, user, b.sid, ["mock"]);
    const late = Date.now() > s.deadline + GRACE * 1000, ans = Array.isArray(b.ans) ? b.ans : [];
    const D = await loadProfile(env, user), pts0 = D.pts, review = [], stmts = [];
    let c = 0;
    s.st.qs.forEach((q, i) => {
      const v = late ? null : ans[i], ok = isCorrect(q, v), dg = ok ? "" : diagnose(q, v);
      if (ok) c++;
      rec(D, q, ok, false);
      stmts.push(attempt(env, user, q, ok, dg));
      if (!ok) review.push({ i, q: q.q, o: q.o || undefined, unit: q.unit, v: v === undefined ? null : v, a: q.a, h: q.h, diag: dg });
    });
    const n = s.st.qs.length, sc = Math.round((c / n) * 100);
    mockBonus(D, sc); touchDay(D);
    const got = award(D);
    s.st.ans = { submitted: true };
    await env.DB.batch([saveSession(env, s, true), saveProfile(env, user, D), ...stmts]);
    return { sc, c, n, late, gain: D.pts - pts0, got, review, data: D };
  },

  "GET /api/board": async (req, env) => {
    const { user } = await authed(req, env);
    const { results } = await env.DB.prepare("SELECT no,name,data FROM profiles WHERE cls=? AND role='student'").bind(user.cls).all();
    const rows = (results || []).map((r) => { const D = norm(JSON.parse(r.data)), t = tot(D); return { no: r.no, n: r.name, pts: D.pts, lv: lv(D), stk: Object.keys(D.stk).length, ok: t.c, tot: t.n }; }).filter((x) => x.tot > 0);
    return { rows, me: user.no };
  },

  /* 列印練習卷：只給產生器題目和自己的錯題（固定題庫要在試算表標 print=1 才會出現） */
  "GET /api/print": async (req, env) => {
    const { user, bank } = await authed(req, env), url = new URL(req.url), src = url.searchParams.get("src") || "mix";
    const n = Math.min(20, Math.max(5, +url.searchParams.get("n") || 10)), r = rng(Date.now() + ":" + Math.random());
    const pack = (q) => ({ unit: q.unit, q: q.q, o: q.o || undefined, a: q.a, h: q.h });
    let qs = [], name = "";
    if (src === "wrong") { const D = await loadProfile(env, user); qs = D.wr.slice(0, n).map((w) => ({ unit: w.id, q: w.q, o: w.o, a: w.a, h: w.h })); name = "錯題重練"; }
    else if (UNIT_RE.test(src)) {
      if (!GEN_IDS.has(src)) throw bad("no_generator");
      const seen = new Set(); for (let i = 0; qs.length < n && i < n * 8; i++) { const q = runGen(src, r); if (!seen.has(q.q)) { seen.add(q.q); qs.push(pack(q)); } }
      name = src;
    } else {
      const ids = GENS.filter((g) => gradeOf(g.id) <= user.grade && gradeOf(g.id) >= user.grade - 1).map((g) => g.id), seen = new Set();
      for (let i = 0; qs.length < n && i < n * 10 && ids.length; i++) { const q = runGen(ids[Math.floor(r() * ids.length)], r); if (!seen.has(q.q)) { seen.add(q.q); qs.push(pack(q)); } }
      name = "綜合練習";
    }
    return { name, qs };
  },

  /* 老師後台 */
  "GET /api/admin/overview": async (req, env) => {
    const { user, roster } = await authed(req, env);
    if (user.role !== "teacher") throw bad("forbidden", 403);
    const classes = [...new Set([...roster.values()].map((x) => String(x.class)))].sort(), url = new URL(req.url);
    const cls = classes.includes(url.searchParams.get("cls")) ? url.searchParams.get("cls") : classes[0];
    const since = Date.now() - 30 * 864e5;
    const [st, un, ms, dg] = await Promise.all([
      env.DB.prepare("SELECT no,name,data,updated FROM profiles WHERE cls=? AND role='student' ORDER BY no").bind(cls).all(),
      env.DB.prepare("SELECT unit, COUNT(*) n, SUM(ok) c FROM attempts WHERE cls=? AND ts>? GROUP BY unit ORDER BY unit").bind(cls, since).all(),
      env.DB.prepare("SELECT qid, unit, COUNT(*) n, SUM(1-ok) w FROM attempts WHERE cls=? AND ts>? GROUP BY qid, unit HAVING w>0 ORDER BY w DESC LIMIT 10").bind(cls, since).all(),
      env.DB.prepare("SELECT dg, COUNT(*) n FROM attempts WHERE cls=? AND ts>? AND dg!='' GROUP BY dg ORDER BY n DESC LIMIT 10").bind(cls, since).all(),
    ]);
    const have = new Set((st.results || []).map((r) => r.no)), students = (st.results || []).map((r) => {
      const D = norm(JSON.parse(r.data)), t = tot(D), mk = D.mk.slice(-3);
      return { no: r.no, name: r.name, pts: D.pts, lv: lv(D), n: t.n, c: t.c, streak: D.sk.n, last: D.sk.last, mock: mk.length ? Math.round(mk.reduce((a, m) => a + m.sc, 0) / mk.length) : null, wrong: D.wr.length };
    });
    const never = [...roster.values()].filter((x) => String(x.class) === cls && x.role !== "teacher" && !have.has(+x.no)).map((x) => ({ no: +x.no, name: x.name }));
    return { classes, cls, students, never, units: un.results || [], missed: ms.results || [], misconceptions: dg.results || [] };
  },
};

export async function handle(req, env) {
  const h = corsHeaders(req, env), url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const fn = routes[req.method + " " + url.pathname];
  if (!fn) return out({ err: "not_found" }, 404, h);
  try { return out(await fn(req, env), 200, h); }
  catch (e) {
    if (e instanceof HttpError) return out({ err: e.code }, e.status, h);
    console.error(e && e.stack || e);
    return out({ err: "server" }, 500, h);
  }
}
export default { fetch: (req, env) => handle(req, env) };
