# 數學圖解互動工具（國小版）

手繪筆記風的圖解互動網站。純 HTML / CSS / JavaScript，直接開 `index.html`（需連網載入字體）。

## 新增一個單元＝只新增一個檔案
1. 複製 `units/_template.js`
2. 改名為 `<年級><u上/d下>-<章>.<節>.js`，例如：六下 5.3 → `6d-5.3.js`、五上 9.2 → `5u-9.2.js`
3. 完成。首頁會自動偵測並打勾；標題、章節、上一節／下一節都從 `catalog.js` 自動帶入。

章節目錄在 `assets/js/catalog.js`，每章一行，編號自動產生。要補一、二年級，照格式加一個學期即可。

## 結構
- `index.html`：首頁（年級分頁、學期目錄、已完成打勾）
- `unit.html`：所有單元共用的頁面，用 `unit.html?u=6d-5.3` 載入對應檔案
- `assets/js/core.js`：SVG 手繪工具與角色、主題切換（淺色／深色／系統）、單元樣板 `NB.unit`
- `assets/js/solid.js`：純 SVG 3D 引擎（可拖曳旋轉），提供 `cuboid`、`grid`、`prism`
- `assets/js/catalog.js`：目錄
- `assets/js/home.js`：首頁
- `units/`：每個單元一個 `.js`

## 已完成單元
三上 9.4 分數比大小・三下 3.3 間隔問題・四下 6.3 周長和面積・五上 9.2 三角形面積・
五下 1.1 長方體體積（3D）・五下 3.1 認識容積（3D）・五下 3.3 排水法（3D）・五下 7.2 表面積（3D＋展開圖）・
六上 7.1 圓面積・六下 2.2 相遇問題・六下 3.1 柱體體積（3D）・六下 5.1 和差問題・六下 5.3 雞兔問題

## 數學式（KaTeX）
- 文字裡用 `$...$`（行內）或 `$$...$$`（獨立一行）寫 LaTeX，例如 `"面積 $=\\frac{1}{2}\\times a\\times h$"`
- 沒加 `$` 的算式（含 × ÷ ＝ + 分數 π ²）會自動轉成 LaTeX；轉得不理想時，用 `$...$` 明確包起來
- 適用：`q`、`steps`、`ch.q`、`ch.h`、`eq.innerHTML`；SVG 裡的文字（`NB.t`）不支援
- KaTeX 放在 `assets/vendor/katex/`（目前只含 Main-Regular 字型；要完整的斜體變數、大型符號，請換成官方完整 fonts）

## 圖形清晰度
全站 SVG 不再套用濾鏡（濾鏡會讓整張圖先點陣化而變糊），卡片也不再旋轉。需要手繪感請用線條端點圓角、手寫字體與歪斜邊框。

## 學員專區
開放給同學：每日一題、單元小測驗、模擬卷、錯題本、學習進度、貼紙、積分等級、排行榜、列印練習卷；老師另有 `teacher.html` 後台。
未登入的人仍可看圖解單元，但上述功能會被鎖住。

- 登入：Google 帳號（Firebase Auth）。能不能用由後端對照老師在 Google 試算表維護的名單決定
- 題目、判分、計時、積分都在後端（Cloudflare Worker），瀏覽器拿不到答案，改 localStorage 也改不了成績
- 設定：`assets/data/config.js`（API 網址與 Firebase 設定，都是公開資訊）
- 畫面：`assets/js/member-ui.js`；資料層：`assets/js/member.js`；登入：`assets/js/auth.js`；老師後台：`assets/js/teacher.js`
- 部署與維護：見專案外層的 `SETUP.md`；後端程式在 `backend/`（請放私有 repo）

## 視覺（象牙製圖紙風＋手繪）
- 字體：標題／例題用「霞鶩文楷 TC」，標籤與數字用「芫荽」手寫字，內文用 Noto Sans TC。已移除細明體；離線時退到標楷體（楷體）
- 手繪感：不規則圓角邊框、素描雙線框、波浪底線，全是 CSS，不用濾鏡所以不會變糊
- 色彩與字型都在 `assets/css/notebook.css` 最上方的 CSS 變數（`--p1`～`--p5`、`--serif`、`--sans`、`--hand`），淺色／深色各一組
- 原創 SVG 點綴在 `core.js` 的 `NB.deco`：`hero()` 首頁插圖、`rule()` 分隔線、`logo()`、`icon()`（例題／動手玩／解法／挑戰）、`bg()` 背景幾何線條
- 目錄：章名＋點線＋「共 N 小節」；已完成單元為實線，建置中為虛線
