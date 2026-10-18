/* 網站設定（這些都是「公開」資訊，可以放心提交到 GitHub）
   - api：Cloudflare Worker 的網址（部署後 wrangler 會顯示，例如 https://math-class-api.你的帳號.workers.dev）
   - firebase：Firebase 專案設定 → 專案設定 → 一般 → 你的應用程式 → SDK 設定。
     apiKey 本來就是公開的，真正的防護在伺服器端驗證，不在這把 key
   - hd：（選填）學校 Google Workspace 網域，登入視窗會優先顯示該網域的帳號。只是提示，不是安全機制 */
var NB_CONFIG={
 api:"",
 firebase:{apiKey:"",authDomain:"",projectId:"",appId:""},
 hd:""
};
