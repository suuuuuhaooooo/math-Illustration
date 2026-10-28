/* 注音開關：一、二、三年級的學生預設自動顯示注音；其他人可以用右上角「注音」按鈕開關。
   設定存在瀏覽器（localStorage nb-zy：auto / on / off）。載入失敗時什麼都不做，畫面照常顯示國字。 */
import { Zhuyin } from "./zhuyin.js";
const KEY = "nb-zy", LBL = { auto: "自動", on: "開", font: "字體版", off: "關" }, NEXT = { auto: "on", on: "font", font: "off", off: "auto" };
const get = () => { try { return localStorage.getItem(KEY) || "auto"; } catch { return "auto"; } };
const set = (v) => { try { localStorage.setItem(KEY, v); } catch {} };
function wanted() {
  const m = get(); if (m === "font") return false; if (m === "on") return true; if (m === "off") return false;
  const U = window.NB && NB.member && NB.member.U; return !!(U && U.role === "student" && U.grade <= 3);
}
let shown = false;
function fontMode(on) {
  document.body.classList.toggle("zyfont", on);
  if (on && !document.getElementById("zyfont-css")) { const l = document.createElement("link"); l.id = "zyfont-css"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Bpmf+Huninn&display=swap"; document.head.appendChild(l); }
}
async function sync() {
  fontMode(get() === "font");
  const w = wanted(); document.body.classList.toggle("zymode", w);
  if (w && !shown) { shown = await Zhuyin.enable(); if (!shown) document.body.classList.remove("zymode"); }
  else if (!w && shown) { Zhuyin.disable(); shown = false; }
  const b = document.getElementById("zybtn"); if (b) b.textContent = "注音：" + LBL[get()];
}
function mount() {
  const bar = document.querySelector(".themes"); if (!bar || document.getElementById("zybtn")) return !!bar;
  const b = document.createElement("button"); b.id = "zybtn"; b.type = "button"; b.className = "nozy"; b.textContent = "注音：" + LBL[get()];
  b.title = "切換注音：自動（一至三年級學生）／開（上方注音）／字體版（注音字體，破音字可能顯示預設讀音）／關"; b.onclick = () => { set(NEXT[get()]); sync(); };
  bar.appendChild(b); return true;
}
window.NB = window.NB || {}; NB.zy = Zhuyin;
let n = 0; const t = setInterval(() => { mount(); sync(); if (++n > 25) clearInterval(t); }, 400);
mount(); sync();
