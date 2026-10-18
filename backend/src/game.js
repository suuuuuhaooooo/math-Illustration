/* 積分、貼紙、錯題本、連續天數：全部在伺服器計算，前端只負責顯示 */

export const TZ_HOURS = 8; // 台灣時間
export function ymd(ms = Date.now()) {
  const d = new Date(ms + TZ_HOURS * 3600e3);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}

export const blank = () => ({ pts: 0, u: {}, day: {}, wr: [], stk: {}, dq: {}, mk: [], sk: { last: "", n: 0 }, pf: 0, fx: 0, cap: { d: "", n: 0, mk: 0 } });
export const norm = (d) => Object.assign(blank(), d || {});

/* 防刷：每天最多 100 題計分、最多 3 份模擬卷拿獎勵 */
export const CAP_Q = 100, CAP_MOCK = 3;
function cap(D, t) { if (D.cap.d !== t) D.cap = { d: t, n: 0, mk: 0 }; return D.cap; }

export const overCap = (D, t = ymd()) => D.cap.d === t && D.cap.n > CAP_Q;

export const tot = (D) => { let n = 0, c = 0; for (const k in D.u) { n += D.u[k].n; c += D.u[k].c; } return { n, c }; };
export const lv = (D) => Math.floor(D.pts / 150) + 1;
export const seen = (D) => Object.keys(D.u).filter((k) => D.u[k].seen).length;
const dqOk = (D) => Object.keys(D.dq).filter((k) => D.dq[k].ok).length;

export const STK = [
  { id: "first", n: "初試啼聲", d: "完成第一次練習", g: "M4 20l1-4L16 5l3 3L8 19zM13.5 7.5l3 3", ok: (D) => tot(D).n >= 1 },
  { id: "c10", n: "十題達人", d: "累積答對 10 題", g: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z", ok: (D) => tot(D).c >= 10 },
  { id: "c50", n: "五十題勇士", d: "累積答對 50 題", g: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13.5L7 21l5-3 5 3-1.5-7.5", ok: (D) => tot(D).c >= 50 },
  { id: "c100", n: "百題王者", d: "累積答對 100 題", g: "M3 8l4 4 5-7 5 7 4-4-2 11H5z", ok: (D) => tot(D).c >= 100 },
  { id: "perfect", n: "百發百中", d: "一份小測驗全對", g: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01", ok: (D) => D.pf >= 1 },
  { id: "s3", n: "小火苗", d: "連續 3 天練習", g: "M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z", ok: (D) => D.sk.n >= 3 },
  { id: "s7", n: "持之以恆", d: "連續 7 天練習", g: "M4 6h16v14H4zM4 11h16M8 3v5M16 3v5M8 15l2.5 2.5L16 14", ok: (D) => D.sk.n >= 7 },
  { id: "dq5", n: "每日小太陽", d: "每日一題答對 5 次", g: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2", ok: (D) => dqOk(D) >= 5 },
  { id: "mock80", n: "模擬卷高手", d: "模擬卷 80 分以上", g: "M5 21V3M5 4h12l-2 4 2 4H5z", ok: (D) => D.mk.some((m) => m.sc >= 80) },
  { id: "fix5", n: "錯題終結者", d: "訂正畢業 5 題錯題", g: "M12 20S4 15 4 9.5A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 8 1.5C20 15 12 20 12 20z", ok: (D) => D.fx >= 5 },
  { id: "explore", n: "單元探險家", d: "逛過 5 個單元", g: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z", ok: (D) => seen(D) >= 5 },
  { id: "lv5", n: "閃亮新星", d: "升到 Lv.5", g: "M6 4h12l4 6-10 11L2 10zM2 10h20", ok: (D) => lv(D) >= 5 },
];
export const STK_PUBLIC = STK.map(({ id, n, d, g }) => ({ id, n, d, g }));

/* 記錄一題。回傳是否有計分 */
export function rec(D, q, ok, wrongMode, t = ymd()) {
  const id = q.unit, k = id + "|" + q.q, c = cap(D, t), scored = c.n < CAP_Q;
  const u = (D.u[id] = D.u[id] || { n: 0, c: 0 }), d = (D.day[t] = D.day[t] || { n: 0, c: 0 }), w = D.wr.find((x) => x.k === k);
  u.n++; d.n++; c.n++;
  if (ok) {
    u.c++; d.c++; if (scored) D.pts += 10;
    if (w && wrongMode) { w.ok = (w.ok || 0) + 1; if (w.ok >= 2) { D.wr.splice(D.wr.indexOf(w), 1); D.fx++; D.pts += 15; } }
  } else if (w) { w.ok = 0; w.n++; }
  else {
    D.wr.push({ k, id, q: q.q, a: q.a, o: q.o, h: q.h, n: 1, ok: 0, at: t });
    if (D.wr.length > 200) D.wr.shift();
  }
  // 日誌只保留最近 21 天
  const keys = Object.keys(D.day).sort();
  while (keys.length > 21) delete D.day[keys.shift()];
  return scored;
}

export function touchDay(D, t = ymd(), now = Date.now()) {
  const y = ymd(now - 864e5);
  if (D.sk.last === t) return;
  D.sk.n = D.sk.last === y ? D.sk.n + 1 : 1; D.sk.last = t;
  if (D.sk.n > 1) D.pts += Math.min(D.sk.n, 7) * 2;
}

export function award(D, t = ymd()) {
  const got = [];
  for (const s of STK) if (!D.stk[s.id] && s.ok(D)) { D.stk[s.id] = t; D.pts += 20; got.push(s.id); }
  return got;
}

/* 模擬卷獎勵（每天前 3 份） */
export function mockBonus(D, sc, t = ymd()) {
  const c = cap(D, t);
  D.mk.push({ d: t, sc }); if (D.mk.length > 30) D.mk.shift();
  if (c.mk < CAP_MOCK) { c.mk++; D.pts += 20 + (sc >= 80 ? 50 : 0); }
}
