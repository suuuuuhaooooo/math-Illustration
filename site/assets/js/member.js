/* 班級專區（資料層）：登入狀態與 API 呼叫。
   所有「算分、判分、記錄」都在伺服器（Cloudflare Worker）；這裡只負責把畫面需要的資料拿回來。
   安全性：瀏覽器端的任何資料（含 localStorage）都不被信任，改了也不會影響成績。 */
(function(){
"use strict";
var CFG=window.NB_CONFIG||{},M=NB.member={},CK="nb-chip",SN="nb-seen";
function pad(n){return("0"+n).slice(-2)}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}

/* 本機日期（只用在圖表顯示；積分與每日一題用伺服器日期 M.T） */
M.today=function(d){d=d||new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
M.prev=function(t){var d=new Date(t+"T00:00:00Z");d.setUTCDate(d.getUTCDate()-1);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())};
M.lv=function(D){return Math.floor(D.pts/150)+1};
M.tot=function(D){var n=0,c=0,k;for(k in D.u){n+=D.u[k].n;c+=D.u[k].c}return{n:n,c:c}};
M.seen=function(D){return Object.keys(D.u).filter(function(k){return D.u[k].seen}).length};
M.has=function(id){return(M.units||[]).indexOf(id)>=0};

/* auth.js（模組）載入完成後會呼叫這個；12 秒還沒好就當作無法登入 */
M.ready=new Promise(function(res){window.__nbAuthResolve=res;setTimeout(function(){res(null)},12000)});

M.api=function(method,path,body){
 if(!CFG.api)return Promise.reject(Object.assign(new Error("noapi"),{code:"noapi"}));
 if(!M.auth||!M.auth.user())return Promise.reject(Object.assign(new Error("nologin"),{code:"nologin"}));
 return M.auth.token().then(function(tok){
  var o={method:method,headers:{Authorization:"Bearer "+tok}};
  if(body){o.headers["Content-Type"]="application/json";o.body=JSON.stringify(body)}
  return fetch(CFG.api+path,o)}).then(function(r){return r.json().then(function(j){
   if(!r.ok){var e=new Error(j.err||"http");e.code=j.err||"http";e.status=r.status;throw e}return j},function(){var e=new Error("bad");e.code="net";throw e})},function(e){if(e.code)throw e;var x=new Error("net");x.code="net";throw x})};

M.load=function(){return M.api("GET","/api/me").then(function(r){
 M.U=r.user;M.D=r.data;M.STK=r.stk;M.units=r.units;M.gens=r.gens;M.T=r.today;
 ls(CK,JSON.stringify({n:r.user.name,lv:M.lv(r.data),pts:r.data.pts}));
 var seen=[];try{seen=JSON.parse(ls(SN)||"[]")}catch(e){}
 if(seen.length&&r.user.role==="student")M.api("POST","/api/seen",{ids:seen}).then(function(){ls(SN,null)},function(){});
 return r})};
M.boot=function(){M.err=null;return M.ready.then(function(A){
 M.auth=A;if(!A){M.U=null;M.err=CFG.firebase&&CFG.firebase.apiKey?"noauth":"noconfig";return}
 if(!A.user()){M.U=null;return}
 return M.load().catch(function(e){M.U=null;M.err=e.code||"net"})})};
M.setData=function(D){M.D=D;ls(CK,JSON.stringify({n:M.U.name,lv:M.lv(D),pts:D.pts}))};
M.signIn=function(){return M.auth.signIn()};
M.logout=function(){ls(CK,null);M.U=null;M.D=null;return M.auth?M.auth.signOut():Promise.resolve()};

/* ---- 與首頁、單元頁的接點（這兩頁不載入 Firebase，只讀本機的「顯示用」資訊） ---- */
M.cur=function(){try{return JSON.parse(ls(CK)||"null")}catch(e){return null}};
M.chip=function(){var u=M.cur(),a=NB.h('<a class="chip" href="'+NB.root+'member.html"></a>');a.textContent=u?u.n+"・Lv."+u.lv+"・"+u.pts+" 分":"班級專區・登入";return a};
M.onUnit=function(app,id){var u=M.cur(),el,R=NB.root;
 if(u){var s=[];try{s=JSON.parse(ls(SN)||"[]")}catch(e){}if(s.indexOf(id)<0){s.push(id);ls(SN,JSON.stringify(s.slice(-60)))}
  el=NB.h('<section class="sheet"><h2><span class="tag">班級專區</span>學完了，來考考自己</h2><div class="ctl"><a class="pen go" href="'+R+'member.html#quiz/'+id+'">這一節的小測驗</a><a class="pen" href="'+R+'member.html#wrong">錯題本</a><a class="pen" href="'+R+'member.html#daily">每日一題</a></div></section>')}
 else el=NB.h('<section class="sheet"><h2><span class="tag">班級專區</span>小測驗・錯題本・貼紙・排行榜</h2><p>這些功能只開放給班上同學使用。</p><a class="pen go" href="'+R+'member.html#login">同學登入</a></section>');
 app.insertBefore(el,app.lastElementChild)};
})();
