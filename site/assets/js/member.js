/* 學員專區（資料層）：登入狀態與 API 呼叫。 
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
M.step=150;
M.lv=function(D){return Math.floor(D.pts/M.step)+1};
/* 題目附圖：只寫檔名就放在 assets/q/，也可以是 https 網址 */
M.img=function(p){var m=/^d:([0-9a-f]{16})$/.exec(p);return m?CFG.api+"/api/img/"+m[1]:/^https:/.test(p)?p:NB.root+"assets/q/"+p};
M.tot=function(D){var n=0,c=0,k;for(k in D.u){n+=D.u[k].n;c+=D.u[k].c}return{n:n,c:c}};
M.seen=function(D){return Object.keys(D.u).filter(function(k){return D.u[k].seen}).length};
/* 科目：國小數學（本站）／國中理化（見微理畫）。帳號可同時開通兩科，各科資料分開。
   決定順序：網址 ?s= → 老師頁上次選的科目 → 設定檔 → 數學 */
M.SUBJ={math:"國小數學",sci:"國中理化"};
M.SITE={math:"https://suuuuuhaooooo.github.io/math-Illustration/",sci:"https://suuuuuhaooooo.github.io/science-illustration/site/island.html"};
M.TEACH=/teacher\.html$/.test(location.pathname);
M.subj=(function(){var q=/[?&]s=(math|sci)\b/.exec(location.search);if(q)return q[1];var t=M.TEACH&&ls("nb-subj");if(t==="math"||t==="sci")return t;return CFG.subject==="sci"?"sci":"math"})();
/* 理化的目錄：從見微理畫（同一個網域）讀 catalog.js，換掉這一頁的目錄（NB.cat、NB.flat），單元名稱、冊別、章節就都對了；讀不到就只顯示單元代號 */
/* 見微理畫的網址：GitHub Pages 的路徑分大小寫，repo 叫 science-illustration 或 science-Illustration 都試；設定檔可用 sciRoot 指定 */
M.sciRoot=CFG.sciRoot||"/science-illustration/site/";
function sciFetch(path){var roots=[CFG.sciRoot,"/science-illustration/site/","/science-Illustration/site/"].filter(function(x,i,a){return x&&a.indexOf(x)===i}),k=0;
 function next(){if(k>=roots.length)return Promise.resolve("");var r=roots[k++];return fetch(r+path).then(function(x){return x.ok?x.text().then(function(t){M.sciRoot=r;M.SITE.sci=location.origin+r+"island.html";return t}):next()},next)}return next()}
M.sciFetch=sciFetch;
M.loadCat=function(){if(M.subj!=="sci"||M.catDone)return Promise.resolve();
 return sciFetch("assets/js/catalog.js").then(function(t){if(!t){M.catErr=true;NB.flat.length=0;NB.cat.length=0;return} /* 讀不到理化目錄：清空，不要拿數學的單元充數 */var C=new Function(t+"\n;return typeof CATALOG!=='undefined'?CATALOG:[]")(),flat=[],cat=[];
  C.forEach(function(S){var n=S.start===undefined?1:S.start,o2={sem:S.sem,label:S.label,id:S.id,grade:S.grade,chs:[]};cat.push(o2);
   S.ch.forEach(function(row){var a=row.split("|"),x=/^跨科[:：]/.test(a[0]),key=x?"x":String(n),c={no:x?"跨科":n,cross:x,key:key,name:a[0].replace(/^跨科[:：]/,""),secs:[]};if(!x)n++;o2.chs.push(c);
    a.slice(1).forEach(function(tl,j){var o={id:S.id+"-"+key+"."+(j+1),num:x?(a.length>2?"跨科"+(j+1):"跨科"):key+"-"+(j+1),title:tl,sem:S.sem,ch:c};c.secs.push(o);flat.push(o)})})});
  if(flat.length){NB.flat.length=0;Array.prototype.push.apply(NB.flat,flat);NB.cat.length=0;Array.prototype.push.apply(NB.cat,cat);M.catDone=true}}).catch(function(){})};
/* 右上角的學員小卡、「看過哪些小節」：每一科各記一份（見微理畫讀 nb-chip-sci、寫 nb-seen-sci） */
function CKS(){return M.subj==="math"?CK:CK+"-"+M.subj}function SNS(){return M.subj==="math"?SN:SN+"-"+M.subj}
M.setSubj=function(s){if(!M.SUBJ[s])return;M.subj=s;if(M.TEACH)ls("nb-subj",s)};
M.has=function(id){return(M.units||[]).indexOf(id)>=0};

/* auth.js（模組）載入完成後會呼叫這個；12 秒還沒好就當作無法登入 */
M.ready=new Promise(function(res){window.__nbAuthResolve=res;setTimeout(function(){res(null)},12000)});

M.api=function(method,path,body){
 if(!CFG.api)return Promise.reject(Object.assign(new Error("noapi"),{code:"noapi"}));
 if(!M.auth||!M.auth.user())return Promise.reject(Object.assign(new Error("nologin"),{code:"nologin"}));
 return M.auth.token().then(function(tok){
  var o={method:method,headers:{Authorization:"Bearer "+tok,"X-Subject":M.subj}};
  if(body){o.headers["Content-Type"]="application/json";o.body=JSON.stringify(body)}
  return fetch(CFG.api+path,o)}).then(function(r){return r.json().then(function(j){
   if(!r.ok){var e=new Error(j.err||"http");e.code=j.err||"http";e.status=r.status;if(j.subjects)e.subjects=j.subjects;if(j.subj)e.subj=j.subj;throw e}return j},function(){var e=new Error("bad");e.code="net";throw e})},function(e){if(e.code)throw e;var x=new Error("net");x.code="net";throw x})};

M.load=function(){return M.api("GET","/api/me").then(function(r){
 M.U=r.user;M.D=r.data;M.STK=r.stk;M.prog=r.prog||{};M.acct=r.acct||{};M.units=r.units;M.gens=r.gens;M.T=r.today;M.cfg=r.cfg;M.step=r.cfg.step;
 ls(CKS(),JSON.stringify({n:r.user.name,lv:M.lv(r.data),pts:r.data.pts,r:r.user.admin?"admin":r.user.role}));
 var seen=[],sk=SNS();try{seen=JSON.parse(ls(sk)||"[]")}catch(e){}
 if(seen.length&&r.user.role==="student")M.api("POST","/api/seen",{ids:seen}).then(function(){ls(sk,null)},function(){});
 return r})};
/* 見微理畫那邊閒置太久會留下 nb-force-out：下次進學員專區先登出，避免共用電腦被別人接著用 */
M.forceOut=function(){var f=ls("nb-force-out");if(!f)return Promise.resolve();ls("nb-force-out",null);return M.ready.then(function(A){if(A&&A.user())return A.signOut().then(function(){try{sessionStorage.setItem("nb-idle","1")}catch(e){}})})};
M.boot=function(){M.err=null;M.errX=null;return M.forceOut().then(M.loadCat).then(function(){return M.ready}).then(function(A){
 M.auth=A;if(!A){M.U=null;M.err=CFG.firebase&&CFG.firebase.apiKey?"noauth":"noconfig";return}
 if(!A.user()){M.U=null;return}
 return M.load().catch(function(e){M.U=null;M.err=e.code||"net";M.errX=e})})};
M.setData=function(D,pg){M.D=D;if(pg)M.prog=pg;ls(CKS(),JSON.stringify({n:M.U.name,lv:M.lv(D),pts:D.pts}))};
M.signIn=function(){return M.auth.signIn()};
M.logout=function(){ls(CK,null);ls(CK+"-sci",null);M.U=null;M.D=null;return M.auth?M.auth.signOut():Promise.resolve()};

/* ---- 與首頁、單元頁的接點（這兩頁不載入 Firebase，只讀本機的「顯示用」資訊） ---- */
M.cur=function(){try{return JSON.parse(ls(CK)||"null")}catch(e){return null}};
M.chip=function(){var u=M.cur(),a=NB.h('<a class="chip" href="'+NB.root+'member.html"></a>');a.textContent=u?u.n+"・Lv."+u.lv+"・"+u.pts+" 分":"學員專區・登入";return a};
M.onUnit=function(app,id){var u=M.cur(),el,R=NB.root;
 if(u){var s=[];try{s=JSON.parse(ls(SN)||"[]")}catch(e){}if(s.indexOf(id)<0){s.push(id);ls(SN,JSON.stringify(s.slice(-60)))}
  el=NB.h('<section class="sheet"><h2><span class="tag">學員專區</span>學完了，來考考自己</h2><div class="ctl"><a class="pen go" href="'+R+'member.html#quiz/'+id+'">這一節的小測驗</a><a class="pen" href="'+R+'member.html#wrong">錯題本</a><a class="pen" href="'+R+'member.html#daily">每日一題</a></div></section>')}
 else el=NB.h('<section class="sheet"><h2><span class="tag">學員專區</span>小測驗・錯題本・勳章・排行榜</h2><p>此功能僅開放給班內學員使用。</p><a class="pen go" href="'+R+'member.html#login">同學登入</a></section>');
 app.insertBefore(el,app.lastElementChild)};
})();
