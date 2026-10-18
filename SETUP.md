# 部署說明：Firebase 登入 ＋ Cloudflare 後端 ＋ GitHub 網站 ＋ Google 試算表

全部使用免費方案，**都不需要綁信用卡**。大約 40 分鐘，一次做完。

```
學生手機/電腦 ──Google 登入──▶ Firebase（只證明「你是誰」）
      │                              
      └─ 帶著證明 ─▶ Cloudflare Worker ──▶ D1 資料庫（成績、錯題、積分）
                      │  ├ 驗證證明（簽章、過期、專案）
                      │  ├ 對照名單（只有老師登記的 email 能用）
                      │  └ 出題、計時、判分、算積分（答案只存在這裡）
                      ▲
        Google 試算表（老師編輯「題庫」「名單」）──每 30 分鐘 GitHub Action 檢查後同步
```

資料夾：`site/` 是公開網站（GitHub Pages）、`backend/` 是後端（**請放在獨立的私有 repo**，裡面有名單和答案）。

---

## 一、GitHub（5 分鐘）
1. 建立兩個 repo：`math-site`（**Public**，GitHub Pages 免費方案需要公開）與 `math-api`（**Private**）。
2. 把 `site/` 的內容推到 `math-site`，`backend/` 的內容推到 `math-api`（含 `.github/`）。
3. `math-site` → Settings → Pages → Source 選 `main` 分支 `/ (root)`。網址會是 `https://你的帳號.github.io/math-site/`。

## 二、Firebase（只用 Google 登入，5 分鐘）
1. <https://console.firebase.google.com> → 新增專案（不用開 Google Analytics）。**維持 Spark 免費方案。**
2. Build → Authentication → 開始使用 → Sign-in method → 啟用 **Google**（填專案公開名稱與支援 email）。
3. Authentication → Settings → **Authorized domains** → 新增 `你的帳號.github.io`。
4. 專案設定（齒輪）→ 一般 → 你的應用程式 → 新增網頁應用程式 → 複製 `firebaseConfig`，貼到 `site/assets/data/config.js` 的 `firebase:{…}`（`apiKey` 等欄位本來就是公開的）。
5. 記下 **專案 ID**（下一步要用）。

> 不要啟用「電子郵件/密碼」。後端預設只接受 `google.com` 登入（`ALLOWED_PROVIDERS`）。

## 三、Cloudflare Worker（10 分鐘）
需要 Node.js 22。在 `backend/` 資料夾：
```bash
npm install
npx wrangler login
npx wrangler d1 create math-class          # 記下 database_id
npx wrangler kv namespace create DATA      # 記下 id
```
編輯 `wrangler.toml`：貼上上面兩個 id；`FIREBASE_PROJECT_ID` 填專案 ID；`ALLOWED_ORIGINS` 填 `https://你的帳號.github.io`（不含路徑）。然後：
```bash
npx wrangler d1 execute math-class --remote --file=schema.sql
npx wrangler deploy
```
部署完會顯示 `https://math-class-api.xxx.workers.dev`，貼到 `site/assets/data/config.js` 的 `api:`，並提交 `math-site`。

## 四、Google 試算表（題庫＋名單，10 分鐘）
1. 新增一份試算表，建立兩個分頁，**分頁名稱必須是 `bank` 和 `roster`**，第一列是欄位名稱（可直接貼 `backend/data-src/bank.csv`、`roster.csv` 的內容當範本）。
2. **roster 分頁**（誰能登入）：

   | email | class | no | name | role | grade | active |
   |---|---|---|---|---|---|---|
   | teacher@school.edu.tw | all | 0 | 王老師 | teacher | 6 | 1 |
   | s01@school.edu.tw | 601 | 1 | 小明 | student | 6 | 1 |

   `role` 是 `student` 或 `teacher`。`grade` 是 3–6，決定模擬卷與每日一題的範圍。`active` 填 0 就是停用。**至少要有一位 teacher。** 排行榜顯示的是 `name`，建議用暱稱或只用姓。
3. **bank 分頁**（固定題庫）欄位說明見下方〈題庫欄位〉。
4. 建立「讀取試算表」的服務帳號（免費，不需要信用卡）：
   - <https://console.cloud.google.com> → 選擇和 Firebase 同一個專案 → APIs & Services → 啟用 **Google Sheets API**。
   - IAM 與管理 → 服務帳戶 → 建立服務帳戶 → 進入後「金鑰」→ 新增金鑰 → JSON，下載。
   - 把試算表「共用」給該服務帳戶的 email（檢視者即可）。試算表**不需要**設成公開。
5. 在 `math-api` repo → Settings → Secrets and variables → Actions，新增：

   | Secret | 內容 |
   |---|---|
   | `GOOGLE_SA_JSON` | 剛下載的 JSON 檔「全文」 |
   | `SHEET_ID` | 試算表網址 `/d/` 和 `/edit` 中間那串 |
   | `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → 用「Edit Cloudflare Workers」範本建立 |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 儀表板右側 |
   | `KV_NAMESPACE_ID` | 第三步的 KV id |
6. Actions → 「同步 Google 試算表」→ Run workflow。成功後，之後每 30 分鐘自動同步；老師改完想立刻生效就手動按一次。**資料有錯（例如答案不在選項裡）會整批不上傳、線上維持上一版**，錯誤原因會寫在 Actions 的紀錄裡。

## 五、驗收清單
- [ ] 用名單內的帳號登入 → 看得到首頁；用名單外的 Google 帳號登入 → 看到「不在班級名單」。
- [ ] 做一份小測驗、一份模擬卷，積分有增加。
- [ ] 用老師帳號開 `teacher.html` 看得到全班。
- [ ] 把名單某人 `active` 改成 0，同步後他無法再進入。
- [ ] 瀏覽器開發者工具的 Network 裡，題目回應**沒有** `a`（答案）欄位。

---

## 題庫欄位（bank 分頁）

| 欄位 | 說明 |
|---|---|
| `id` | 不重複的編號，例如 `6d-5.3-f7` |
| `unit` | 單元，格式同檔名，例如 `6d-5.3` |
| `type` | `num`（填數字）或 `choice`（選擇） |
| `lv` | 難度 1 基礎／2 應用／3 挑戰。模擬卷依 3:5:2 的比例抽題，由易到難 |
| `q` | 題目，可用 `$…$` 寫 LaTeX |
| `options` | 選擇題的選項，用 `|` 分隔 |
| `answer` | 答案。選擇題必須和某個選項完全相同 |
| `hint` | 解析，答完後顯示 |
| `diag` | **錯因診斷**（選填）：`錯誤答案=>給學生的提示`，多筆用 `;;` 分隔。例：`7.5=>忘了除以 2;;15=>這是兩倍` |
| `print` | 填 1 才允許出現在列印練習卷（會連答案一起印，預設不出現） |
| `active` | 填 0 就停用這題 |

> ⚠️ 試算表會把 `3/4` 這種文字自動當成日期。把 `q`、`options`、`answer`、`hint`、`diag` 這幾欄先設成「純文字」格式（格式 → 數字 → 純文字），再貼資料。

**好題庫的做法**
- 誘答要有教學意義：把學生最常犯的錯寫進 `diag`，老師後台會統計「全班最常見的迷思」。
- 每個單元至少 3 題 lv1、3 題 lv2、2 題 lv3，模擬卷的難度配比才會準（目前 3–5 年級的固定題偏少，是最需要補的地方）。
- 檔案內附的 45 題是從現有單元的「挑戰題」匯入的；它們同時也公開在單元頁裡，要用於考試請另外新增沒公開過的題目。
- 想新增「可無限出新題」的題型，在 `backend/src/gen.js` 的 `GENS` 加一行，`npm test` 會自動跑 3000 組亂數檢查答案、選項與診斷是否正確。

---

## 安全設計說明
| 威脅 | 怎麼擋 |
|---|---|
| 猜密碼、撞庫 | 沒有密碼。登入交給 Google（含 2 步驟驗證、異常登入偵測） |
| 外人用自己的 Google 帳號進來 | Worker 對照名單，不在名單一律 403 |
| 偽造登入證明 | Worker 驗 RS256 簽章、發行者、專案、有效期限、email 已驗證 |
| 改 localStorage / 改 JS 跳過登入 | 瀏覽器端資料不被信任；所有 API 都要有效證明 |
| 看原始碼找答案、改成績 | 答案、積分、計時都在伺服器；題目回應不含答案 |
| 模擬卷超時作弊 | 計時在伺服器，逾時只接受 10 秒寬限，超過視為未作答 |
| 寫程式自動刷分 | 每天 100 題計分上限、模擬卷獎勵每天 3 份 |
| 偷看別人的 session / 資料 | 每份作答綁定 email；學生只能讀自己的資料與同班排行榜 |
| 別的網站呼叫 API | CORS 只允許 `ALLOWED_ORIGINS` |
| 名單外洩 | 名單和答案在私有 repo、Cloudflare KV；公開網站裡沒有 |

**建議再加一道（免費）：** Cloudflare 儀表板 → Security → WAF → Rate limiting rules，對 `/api/*` 設定每個 IP 每分鐘 120 次。

## 已知限制（請先知道）
- **我在沙箱裡用「假的 Firebase 簽章」和「假的 D1/KV」完整測過後端與前端（15 項後端測試、6 項瀏覽器測試），但沒有辦法連到真正的 Firebase 與 Cloudflare。** 第一次部署請照〈驗收清單〉逐項確認。
- 學生年齡：未滿 13 歲的個人 Google 帳號受 Family Link 限制，較適合使用**學校的 Google Workspace for Education 帳號**；也請依學校規定取得家長同意、只收集必要資料。
- 登入用彈出視窗。LINE、Facebook 等 App 內建瀏覽器常擋彈窗，請學生用 Chrome 或 Safari 開啟。
- 免費額度（Firebase Spark、Cloudflare Workers/D1/KV、GitHub Actions）對一個班級綽綽有餘，但額度與政策會變動，上線前請看一眼官方頁面。免費方案沒有 SLA。
- 尚未做：自適應難度、間隔複習（錯題 1/3/7 天再出現）、Email 備援登入。後端結構已預留，要加再說。
