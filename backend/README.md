# math-class-api

班級專區後端（Cloudflare Worker ＋ D1 ＋ KV）。**請放在私有 repo。** 部署步驟見上層的 `SETUP.md`。

- `src/index.js` API 路由　`src/auth.js` Firebase ID Token 驗證　`src/exam.js` 組卷與評分
- `src/gen.js` 題目產生器　`src/game.js` 積分／貼紙／錯題規則　`schema.sql` 資料表
- `tools/build-data.mjs` 檢查並同步 Google 試算表（題庫、名單）到 KV
- `npm test` 後端端對端測試＋題庫品質檢查；`npm run test:ui` 瀏覽器冒煙測試（需要 Playwright 與 `../site`）
