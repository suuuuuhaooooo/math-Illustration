/* 學員專區（畫面）：登入、首頁、每日一題、單元小測驗、模擬卷、錯題本、學習進度、貼紙、排行榜、列印練習卷
   題目、判分、積分都由伺服器處理（見 member.js）；這裡只負責顯示與收集答案。 */
(function(){
"use strict";
var M=NB.member,app=document.getElementById("app"),h=NB.h,tx=NB.tx,view,who,TM=null,XG=null,PS=null,qg=null,booted=false;
var TABS=[["home","首頁"],["daily","每日一題"],["quiz","單元小測驗"],["assign","待測清單"],["mock","模擬卷"],["wrong","錯題本"],["progress","學習進度"],["stickers","勳章"],["board","排行榜"],["print","列印練習卷"]];
function pad(n){return("0"+n).slice(-2)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function sheet(tag,sub){return h('<section class="sheet"><h2><span class="tag">'+tag+'</span>'+(sub||"")+'</h2></section>')}
function title(id){var o=NB.flat.filter(function(x){return x.id===id})[0];return o?o.sem+" "+o.num+" "+o.title:id}
/* 科目差異：數學依「年級＋上下學期」（單元代號 5u-3.2：第 1 碼年級、第 2 碼學期）；理化依「冊」（v3-4.2：第 2 碼是冊別，一冊就是一學期） */
var SCI=M.subj==="sci",GL=SCI?[3,4,5,6]:[1,2,3,4,5,6],VOL=["","","","第三冊","第四冊","第五冊","第六冊"],CNZ="零一二三四五六七八九十";
function gOf(id){return String(id).charAt(SCI?1:0)}
function gLab(g){return SCI?VOL[g]:"一二三四五六"[g-1]+"年級"}
function gShort(g){return SCI?VOL[g]:"一二三四五六"[g-1]}
function chNo(c){return c.no==="跨科"||c.cross?"跨科":"第"+(SCI?CNZ[c.no]:"一二三四五六七八九十"[c.no-1])+"章"}
function gClamp(g){g=+g||GL[GL.length-1];return Math.min(GL[GL.length-1],Math.max(GL[0],g))}
var TC=["#b87333","#9aa5b1","#d9a93c","#5fb6c9","#8e6bd6"],TN=["銅","銀","金","白金","鑽石"];
function stkSvg(s,i,on){var t=(s.t||1)-1,c=TC[t],pips="",k;for(k=0;k<=t;k++)pips+='<circle cx="'+(32-t*4+k*8)+'" cy="58" r="2" fill="'+(on?c:"var(--soft)")+'"/>';
 return'<svg viewBox="0 0 64 64" class="stk" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="'+(on?c:"var(--paper2)")+'" fill-opacity="'+(on?.28:1)+'" stroke="'+(on?c:"var(--ink)")+'" stroke-width="'+(on?3.4:2.4)+'"'+(on?"":' stroke-dasharray="4 4"')+'/><circle cx="32" cy="32" r="23" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 4" opacity=".5"/><g transform="translate(17 14) scale(1.2)" fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'+(on?"":' opacity=".28"')+'><path d="'+s.g+'"/></g>'+pips+'</svg>'}
/* Firebase 登入錯誤 → 看得懂的說明（一定把代碼附上，方便回報） */
function authMsg(c){var m={"auth/popup-closed-by-user":"登入視窗被關閉了，再按一次登入。","auth/network-request-failed":"網路不穩，連不上 Google 登入服務，請檢查網路後再試。","auth/unauthorized-domain":"這個網址還沒加進 Firebase 的「授權網域」，請管理員到 Firebase 設定。","auth/popup-blocked":"瀏覽器擋掉了登入視窗，請允許這個網站的彈出視窗後再試。","auth/operation-not-supported-in-this-environment":"這個瀏覽器不支援 Google 登入，請改用 Chrome 或 Safari 開啟。","auth/web-storage-unsupported":"瀏覽器關閉了網站儲存功能（或無痕模式限制），請改用一般視窗，並允許 Cookie。","auth/internal-error":"登入服務發生內部錯誤，請稍後再試。","auth/user-disabled":"這個 Google 帳號已被停用。"}[c];return(m||"登入沒有成功，請再試一次。")+(c?"（"+c+"）":"")}
function errMsg(e){var c=e&&e.code;if(c==="expired"&&M.U&&M.U.role==="teacher")return"你的老師帳號使用期限已到期，請聯絡管理員延長；延長後重新整理頁面就能繼續使用。";return{qr_off:"老師目前沒有開放 QR code 線上作答。",paper_closed:"這份卷已經關閉線上作答。",already_done:"你已經交過這份卷了。",bad_qr:"QR code 作答資料有問題，請重新出卷。",not_found:"找不到這份卷，請確認 QR code 是不是完整的。",plan_too_big:"題數超過上限了，請減少題數。",bad_plan:"大題設定有誤，請檢查後再試。",preview_limit:"審題預覽太頻繁了，請等幾分鐘再試（為了節省資源，預覽每 10 分鐘有次數上限）。",pool_limit:"挑題查得太頻繁了，請等幾分鐘再試。",rate_limit:"操作太快了，請等一分鐘再試。",no_units:"請先勾選單元。",print_limit:"今天出的練習卷已經到上限了，明天再來，或請管理員調整。",net:"連不上伺服器，請檢查網路後再試一次。",noapi:"網站還沒設定好伺服器網址，請管理員完成設定。",bad_token:"登入已失效，請重新整理頁面再登入。",not_in_roster:"這個帳號不在班級名單裡。",no_session:"這份題目已經失效，請重新開始。",already_done:"這份題目已經交過了。",already_answered:"這題已經送出了。",expired:"你的正式學員授權已到期，請找管理員延期。",forbidden:"沒有權限。",no_questions:"這個範圍（或篩選條件）沒有可以出的題目。",closed:"這份卷子已經截止，或老師已經結束這份派卷。",not_found:"找不到這份卷子，可能已被老師刪除。",server:"伺服器忙碌中，請稍後再試。",wrong_subject:"這份卷是「"+((e&&M.SUBJ[e.subj])||"另一科")+"」的卷，請用正確的 QR code 或網址開啟。",no_subject:"你的帳號沒有開通「"+(M.SUBJ[M.subj]||M.subj)+"」。",last_subject:"每個帳號至少要保留一個科目；要停用請改用刪除。"}[c]||"發生了一點問題（"+(c||"未知")+"），請再試一次。"}
/* 題組的共用題幹：每一小題上方都顯示一次（學生一題一題作答，不用往上翻）；只有一小題（例如錯題本單獨練習）就不寫「第幾小題」 */
function gstem(g,s,im,k,n){return s?'<div class="gstem">'+(n>1?'<small class="gtag">題組・第 '+k+"／"+n+" 小題</small>":'<small class="gtag">題組</small>')+"<div>"+tx(s)+"</div>"+qimg(im)+"</div>":""}
function qimg(p,c){return p?'<img class="qimg'+(c?" "+c:"")+'" alt="附圖" src="'+esc(M.img(p))+'">':""}

function L(i){return String.fromCharCode(65+i)}
function labOf(o,v){if(o&&o.length===2&&o[0]==="對"&&o[1]==="錯")return v==="對"?"○ 對":v==="錯"?"✕ 錯":v;var k=o?o.indexOf(String(v)):-1;return k>=0?"("+L(k)+") "+v:v}
/* 單元多選器：不選＝由系統依年級自動配；可依年級展開勾選 */
function picker(ids,mine){
 var el=h('<details class="upick"><summary>自選單元（<b class="cnt">0</b> 個）</summary><div class="ctl"><button class="pen" data-a="all">全選</button><button class="pen" data-a="none">全不選</button><button class="pen" data-a="mine">只選我的年級</button></div><div class="ug"></div></details>'),g=el.querySelector(".ug"),boxes=[];
 var by={};NB.sortIds(ids).forEach(function(id){var o=NB.flat.filter(function(x){return x.id===id})[0];if(!o)return;(by[gOf(id)]=by[gOf(id)]||[]).push(o)});
 if(!Object.keys(by).length)g.appendChild(h('<p class="meta">'+(SCI?"國中理化":"這一科")+"的題庫還在準備中，題目上線後這裡就會出現可以選的單元。</p>"));
 Object.keys(by).sort().forEach(function(gr){var d=h('<div class="ugr"><b>'+gLab(+gr)+"</b></div>");by[gr].forEach(function(o){var l=h('<label class="uck"><input type="checkbox"> <span></span></label>');l.querySelector("input").value=o.id;l.querySelector("span").textContent=o.sem+" "+o.num+" "+o.title;boxes.push(l.querySelector("input"));d.appendChild(l)});g.appendChild(d)});
 function cnt(){el.querySelector(".cnt").textContent=boxes.filter(function(b){return b.checked&&!b.parentNode.hidden}).length}
 el.addEventListener("change",cnt);
 el.querySelector(".ctl").onclick=function(e){var b=e.target.closest("button");if(!b)return;boxes.forEach(function(x){x.checked=b.dataset.a==="all"||(b.dataset.a==="mine"&&gOf(x.value)==String(mine))});cnt()};
 function vis(b){return!b.parentNode.hidden}
 function filter(gr,sem){boxes.forEach(function(b){b.parentNode.hidden=!!((gr&&gr.length&&gr.indexOf(gOf(b.value))<0)||(!SCI&&sem&&b.value[1]!=sem))});Array.prototype.forEach.call(g.querySelectorAll(".ugr"),function(d){d.hidden=!d.querySelector(".uck:not([hidden])")});cnt()}
 return{el:el,filter:filter,visible:function(){return boxes.filter(vis).map(function(b){return b.value})},get:function(){return boxes.filter(function(b){return b.checked&&vis(b)}).map(function(b){return b.value})}}}
function user(){return M.U}
function ymdT(){return M.T||M.today()}

/* ---- 外框與路由 ---- */
function shell(){
 app.innerHTML="";var bar=h('<nav class="bar"><a class="back" href="'+(SCI?M.SITE.sci:"island.html")+'">← '+(SCI?"回到見微理畫":"回到目錄")+'</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);app.appendChild(h('<div class="ruler"></div>'));
 app.appendChild(h('<h1 class="title"><mark>學員專區</mark><small class="subj-now">'+(M.SUBJ[M.subj]||"")+'</small></h1>'));
 var u=user();if(!u){login();return false}
 if(M.catErr)app.appendChild(h('<div class="fb no">讀不到見微理畫（國中理化網站）的單元目錄，單元名稱暫時無法顯示，請稍後再重新整理。</div>'));
 /* 兩科都開通：可以切換（同一個帳號、各科資料分開） */
 if((u.subjects||[]).length>1){var sw=h('<div class="ctl subj-sw noprint"><span class="meta">科目：</span></div>');u.subjects.forEach(function(k){if(!M.SUBJ[k])return;var a=h('<a class="pen'+(k===M.subj?" go":"")+'"></a>');a.textContent=M.SUBJ[k];a.href=location.pathname+(k==="math"?"":"?s="+k);sw.appendChild(a)});app.appendChild(sw)}
 who=h('<div class="who"><b></b><span></span><button class="pen">登出</button></div>');
 who.querySelector("b").textContent=u.role==="teacher"?"老師　"+u.name:u.cls+" 班　"+u.no+" 號　"+u.name;
 who.querySelector("button").onclick=function(){M.logout().then(function(){location.hash="#login";route()})};app.appendChild(who);updWho();
 var tabs=h('<div class="tabs"></div>'),cur=(location.hash||"#home").slice(1).split("/")[0];
 TABS.forEach(function(t){tabs.appendChild(h('<a class="pen'+(cur===t[0]?" on":"")+'" href="#'+t[0]+'">'+t[1]+"</a>"))});
 if(u.role==="teacher")tabs.appendChild(h('<a class="pen go" href="teacher.html">老師後台</a>'));
 app.appendChild(tabs);view=h("<div></div>");app.appendChild(view);return true}
function updWho(){var D=M.D,t=ymdT(),y=M.prev(t);if(!who||!D)return;who.querySelector("span").textContent="Lv."+M.lv(D)+"・"+D.pts+" 分・連續 "+(D.sk.last===t||D.sk.last===y?D.sk.n:0)+" 天"}
var booting=false;
function boot(){
 if(booting)return;booting=true;
 app.innerHTML="";app.appendChild(h('<p class="meta" style="text-align:center;margin-top:3em">載入中…</p>'));
 M.boot().catch(function(e){M.U=null;M.err=(e&&e.code)||"net"}).then(function(){booted=true;booting=false;route()})}
/* 理化小工具：從見微理畫（同一個網域）載入 */
function sciTools(cb){if(window.SciTools)return cb(window.SciTools);var sc=document.createElement("script");sc.src=(M.sciRoot||"/science-illustration/site/")+"assets/js/scitools.js";sc.onload=function(){if(window.SciTools)cb(window.SciTools)};document.head.appendChild(sc)}
function route(){clearInterval(TM);if(window.SciTools)SciTools.remove();if(XG){XG();XG=null}if(!booted){boot();return}var p=(location.hash||"#home").slice(1).split("/");if(p[0]==="print"&&PS&&PS.alive()){PS.go(p[1]);return}/* 出卷的步驟只切換顯示，不重畫整個頁面，設定與已出的卷子才不會遺失 */if(!shell()){if(NB.tour)NB.tour.off();return}if(M.acct&&M.acct.expired&&["home","progress","stickers"].indexOf(p[0])<0)p=["expired"];(V[p[0]]||V.home)(p[1]);window.scrollTo(0,0);tourFor(p[0]||"home")}

/* ---- 鎂光燈導覽（第一次進入每個分頁會自動帶一遍，之後按右下角的 i 可以再看） ---- */
function tab(h){return function(){return document.querySelector('.tabs a[href="#'+h+'"]')}}
var TOURS={
 home:[{title:"歡迎來到學員專區",text:"花一分鐘看看主要功能。想再看一次，隨時按右下角的 i 圓形按鈕。"},
  {sel:".who",title:"你的狀態",text:"這裡是你的班級、座號、等級、積分，以及連續練習的天數。"},
  {sel:".tabs",title:"功能分頁",text:"每日一題、單元小測驗、待測清單、模擬卷、錯題本、學習進度、勳章、排行榜和列印練習卷，都從這排進去。"},
  {sel:".tiles .tile",title:"積分與等級",text:"答對題目、完成測驗都會得到積分，積分累積到一定數量就會升級。"},
  {sel:'.tiles a[href="#daily"]',title:"每日一題",text:"每天只有一次機會。做完這題，今天就完成了。"},
  {sel:'.tiles a[href="#wrong"]',title:"錯題本",text:"答錯的題目會自動放進來，之後再答對就能慢慢畢業。"},
  {sel:'.tiles a[href="#stickers"]',title:"勳章",text:"達成不同的目標可以收集勳章，從銅牌一路到鑽石。"},
  {sel:tab("mock"),title:"模擬卷",text:"自己選單元和題數，像考試一樣限時作答，交卷後才公布答案。"},
  {sel:tab("print"),title:"列印練習卷",text:"選好範圍與題數，按「出題」，就能印出題目卷和答案卷。"}],
 daily:[{sel:".sheet",title:"每日一題",text:"每天只有一次機會，答對加比較多積分，答錯也有一點。做完就不用再做了。"}],
 quiz:[{sel:".sheet",title:"單元小測驗",text:"選一個單元開始練習，完成一份測驗（3 題以上）還有額外積分。"}],
 assign:[{sel:".sheet",title:"待測清單",text:"老師派給你的卷子在這裡。開始後就會計時，而且只能作答一次，準備好再按開始。"}],
 mock:[{sel:".sheet",title:"模擬卷",text:"自選單元與題數，每題限時，交卷後才公布答案，適合考前練習。"}],
 wrong:[{sel:".sheet",title:"錯題本",text:"答錯的題目都收在這裡。隔幾天各答對一次，這題就畢業了。"}],
 progress:[{sel:".sheet",title:"學習進度",text:"看看累積答題數、答對題數和每個單元的成長。"}],
 stickers:[{sel:".sheet",title:"勳章",text:"每枚勳章都有達成條件，收集越多，積分獎勵越多。"}],
 board:[{sel:".sheet",title:"排行榜",text:"同班同學的排名，只顯示座號，不會顯示姓名。"}],
 print:[{sel:".sheet",title:"列印練習卷",text:"跟著畫面一步一步設定範圍與題數，最後出題並列印。"}]};
function tourFor(r){if(!NB.tour)return;var t=TOURS[r]||TOURS.home;NB.tour.setup("member-"+(TOURS[r]?r:"home"),t)}
/* 帳號沒有開通這一科：告訴他開通的是哪一科、該去哪裡用 */
function subjMsg(e){var have=(e&&e.subjects)||[],cur=M.SUBJ[M.subj]||M.subj,o=have.filter(function(k){return k!==M.subj&&M.SUBJ[k]});
 var t="這個帳號沒有開通「"+cur+"」。";
 if(o.length)t+="你開通的是「"+o.map(function(k){return M.SUBJ[k]}).join("、")+"」，"+(o[0]==="sci"?'請到 <a href="'+M.SITE.sci+'">見微理畫</a> 使用。':'請到 <a href="'+M.SITE.math+'site/member.html">數光島筆記本的學員專區</a> 使用。');
 else t+="如果需要，請找管理員開通。";
 return t}
function login(){
 try{if(sessionStorage.getItem("nb-idle")){sessionStorage.removeItem("nb-idle");setTimeout(function(){var f=document.querySelector(".fb");if(f){f.className="fb no";f.textContent="因為閒置太久，已為了帳號安全自動登出，請重新登入。"}},0)}}catch(e){}
 var s=sheet("登入","僅供班內學員使用"),fb=h('<div class="fb"></div>'),em=M.auth&&M.auth.user()?M.auth.user().email:"";
 s.appendChild(h("<p>請使用老師登記的 Google 帳號登入平台。登入後，即可使用小測驗、模擬卷、錯題本、學習進度、貼紙獎勵、每日一題、列印練習卷及排行榜等功能。上述功能皆須登入後方可使用。</p>"));
 s.appendChild(h('<p class="meta">登入即表示你已閱讀並同意<a href="terms.html" target="_blank" rel="noopener">使用者條款</a>與<a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a>。未滿 18 歲請家長或監護人一起閱讀。</p>'));
 var msg={noconfig:"網站還沒設定好登入功能，請管理員完成設定。",noauth:"登入服務載入失敗，請檢查網路後重新整理頁面。",net:"連不上伺服器，請稍後再試。",noapi:"網站還沒設定好伺服器網址，請管理員完成設定。",bad_token:"登入已失效，請重新登入。",no_subject:subjMsg(M.errX),not_in_roster:"「"+esc(em)+"」不在班級名單裡。請改用老師登記的帳號，或請管理員把這個帳號加進名單。"}[M.err];
 if(!msg&&M.err)msg=(M.auth&&M.auth.user()?"Google 登入成功了，但載入學員資料時出了問題":"登入沒有完成")+"（錯誤代碼："+esc(M.err)+"）。請按「重新載入」再試一次；還是不行，請把這個代碼告訴管理員。";
 if(!msg&&window.__nbAuthErr)msg=authMsg(window.__nbAuthErr);
 if(msg){fb.className="fb no";fb.innerHTML=msg}
 if(/Line\/|FBAN|FBAV|Instagram|MicroMessenger|; wv\)/i.test(navigator.userAgent)){var w=h('<div class="fb no">你正在 App 內建瀏覽器裡，Google 登入常會被擋住。請點右上角「⋯」選「用瀏覽器開啟」（Chrome／Safari），或 <button class="pen">複製網址</button> 貼到瀏覽器。</div>');w.querySelector("button").onclick=function(){var u=location.href.split("#")[0];(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){w.querySelector("button").textContent="已複製"},function(){prompt("請複製這個網址：",u)})};s.appendChild(w)}
 var bar=h('<div class="ctl"></div>');
 if(M.err==="not_in_roster"||M.err==="bad_token"||M.err==="no_subject"){var o=h('<button class="pen go">換一個帳號登入</button>');o.onclick=function(){M.logout().then(function(){M.err=null;booted=false;route()})};bar.appendChild(o)}
 else if(M.err&&M.auth&&M.auth.user()){var rt=h('<button class="pen go">重新載入</button>'),o2=h('<button class="pen">換一個帳號登入</button>');
  rt.onclick=function(){M.err=null;booted=false;booting=false;route()};o2.onclick=function(){M.logout().then(function(){M.err=null;booted=false;route()})};bar.appendChild(rt);bar.appendChild(o2)}
 else if(M.auth){var b=h('<button class="pen go gbtn"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.400c2-1.800 3.100-4.500 3.100-7.600z"/><path fill="#34A853" d="M12 22c2.800 0 5.100-.9 6.800-2.500l-3.300-2.600c-.9.600-2.100 1-3.500 1-2.700 0-5-1.800-5.800-4.300H2.800v2.700A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.200 13.600a6 6 0 0 1 0-3.800V7.100H2.800a10 10 0 0 0 0 9.200z"/><path fill="#EA4335" d="M12 5.900c1.500 0 2.900.5 4 1.600l3-3A10 10 0 0 0 2.800 7.100l3.400 2.700C7 7.700 9.300 5.900 12 5.900z"/></svg> 使用 Google 登入</button>');
  b.onclick=function(){b.disabled=true;fb.className="fb";fb.textContent="登入中…";window.__nbAuthErr=null;M.signIn().then(function(){M.err=null;booted=false;booting=false;if(location.hash==="#home"||location.hash==="")route();else location.hash="#home"}).catch(function(e){b.disabled=false;var c=e&&e.code;if(c==="auth/cancelled-popup-request"){fb.className="fb";fb.textContent="";return}fb.className="fb no";fb.textContent=authMsg(c)})};bar.appendChild(b)}
 s.appendChild(bar);s.appendChild(fb);app.appendChild(s)}

/* ---- 作答引擎：題目與判分都來自伺服器 ----
   練習（小測驗、每日一題、錯題訂正）：每題送出就由伺服器判分並回傳解答
   模擬卷：全部寫完交卷才一次判分；時間由伺服器管，逾時視為未作答 */
function run(o){
 var S=o.sess,qs=S.qs,exam=S.kind==="mock",i=0,ans=[],res=[],left=S.seconds||0,box=sheet(o.tag,o.title),body=h("<div></div>"),busy=false,fin=false,dres=null,hinted={};
 box.appendChild(body);view.innerHTML="";view.appendChild(box);if(o.note)box.insertBefore(h('<p class="meta"></p>'),body).textContent=o.note;
 if(SCI){var tc=(M.cfg&&M.cfg.tools)||{practice:true,mock:false},okT=S.tools!==undefined?!!S.tools:exam?!!tc.mock:!!tc.practice; /* 理化小工具：派卷看老師的設定，其他看管理員的設定 */
  if(okT)sciTools(function(T){T.button()});else if(window.SciTools)SciTools.remove();
  box.insertBefore(h('<p class="meta">'+(okT?"這一份可以使用右下角的「小工具」（週期表、公式卡、單位換算）。":"這一份不開放使用小工具。")+"</p>"),body)}
 if(exam){var clock=h('<span class="clock"></span>');box.querySelector("h2").appendChild(clock);var t0=Date.now();TM=setInterval(tick,1000);tick();if(XG)XG();XG=NB.xg?NB.xg.start({sid:S.sid,lw:S.lw,user:user(),api:M.api,box:box}):null}
 function tick(){left=S.seconds-Math.floor((Date.now()-t0)/1000);if(left<0)left=0;clock.textContent="剩 "+pad(Math.floor(left/60))+":"+pad(left%60);if(left<=0)finish()}
 function show(){
  var q=qs[i],sel=null,done=false,ob=[],inp,hb,d=h('<div><div class="prog">第 '+(i+1)+" / "+qs.length+' 題</div>'+(q.g?gstem(0,q.g.s,q.g.i,q.g.k,q.g.n):"")+'<div class="q">'+tx(q.q)+"</div>"+qimg(q.img)+"</div>");body.innerHTML="";
  if(q.o){var w=h('<div class="opts"></div>');q.o.forEach(function(t,ti){var b=h('<button class="pen opt"></button>');b.innerHTML=q.tf?"<b>"+(t==="對"?"○":"✕")+"　</b>"+tx(esc(t)):"<b>("+L(ti)+")</b> "+tx(esc(t));b.dataset.v=t;b.onclick=function(){if(done)return;sel=t;ob.forEach(function(x){x.classList.toggle("sel",x===b)})};ob.push(b);w.appendChild(b)});d.appendChild(w)}
  else if(q.t==="text"){var c=h('<div class="ctl"><input class="num txt" type="text" maxlength="60" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="輸入答案"></div>');inp=c.firstChild;d.appendChild(c)}
  else if(q.sn){var c=h('<div class="ctl"><input class="num sci" autocomplete="off" maxlength="40" placeholder="數值（可寫單位、科學記號）"></div>');inp=c.firstChild;if(q.u)c.appendChild(h('<span class="unit">'+tx(esc(q.u.replace(/\^(-?\d+)/g,"$^{$1}$")))+"</span>"));c.appendChild(h('<small class="meta sci-tip">例：2.7、2.7 g/cm³、1.6×10^-19、1.6e-19</small>'));d.appendChild(c)}
  else{var c=h('<div class="ctl"><input class="num" type="number" step="any" inputmode="decimal" placeholder="答案"></div>');inp=c.firstChild;d.appendChild(c)}
  var bar=h('<div class="ctl"><button class="pen go">'+(exam?(i+1<qs.length?"下一題":"交卷"):"檢查")+"</button></div>"),go=bar.firstChild,fb=h('<div class="fb"></div>');
  if(!exam){var hc=(M.cfg&&M.cfg.hint)||0;hb=h('<button class="pen">提示'+(hc?"（－"+hc+" 分）":"")+"</button>");bar.appendChild(hb);hb.onclick=function(){
   if(!hinted[i]&&hc&&!confirm("看提示會扣 "+hc+" 分，而且這題答對只能拿一半的積分。\n確定要看嗎？"))return;
   M.api("POST","/api/hint",{sid:S.sid,i:i}).then(function(r){hinted[i]=1;if(r.data){M.setData(r.data);updWho()}fb.className="fb";fb.innerHTML=tx("提示："+r.h)+qimg(r.himg)+(r.cost?"<br><small>已扣 "+r.cost+" 分，這題答對只拿一半積分。</small>":"")},function(e){fb.className="fb no";fb.textContent=errMsg(e)})}}
  if(exam&&i>0){var pv=h('<button class="pen">上一題</button>');pv.onclick=function(){i--;show()};bar.insertBefore(pv,go)}
  d.appendChild(bar);d.appendChild(fb);body.appendChild(d);
  if(exam&&ans[i]!==undefined&&ans[i]!==null){if(q.o)ob.forEach(function(b){if(b.dataset.v===String(ans[i])){sel=ans[i];b.classList.add("sel")}});else inp.value=ans[i]}
  if(inp){inp.focus();inp.onkeydown=function(e){if(e.key==="Enter")go.click()}}
  go.onclick=function(){
   if(busy)return;
   if(done){next();return}
   var v=q.o?sel:q.t==="text"?inp.value.trim():inp.value;
   if(exam){ans[i]=v===""?null:v;next();return}
   if(v===null||v==="")return;
   busy=true;go.disabled=true;
   M.api("POST","/api/check",{sid:S.sid,i:i,v:v}).then(function(r){
    busy=false;go.disabled=false;res.push({q:q,ok:r.ok});if(S.kind==="daily"&&r.data){M.setData(r.data,r.prog);dres={gain:r.gain,got:r.got||[]};updWho()}done=true;go.textContent=i+1<qs.length?"下一題":"看結果";if(hb)hb.disabled=true;
    if(q.o)ob.forEach(function(b){b.disabled=true;if(b.dataset.v===String(r.a))b.classList.add("right");else if(b.classList.contains("sel"))b.classList.add("wrong")});else inp.disabled=true;
    fb.className="fb "+(r.ok?"ok":"no");
    fb.innerHTML=r.ok?"答對了！":tx("答案是 "+(r.al?"("+r.al+") ":"")+r.a+"。"+r.h)+(r.diag?'<br><b class="diag">'+tx(r.diag)+"</b>":"")+qimg(r.himg)+"<br><small>"+(S.kind==="fix"?"還沒訂正成功，會留在錯題本。":"這題已放進錯題本。")+"</small>"
   }).catch(function(e){busy=false;go.disabled=false;fb.className="fb no";fb.textContent=errMsg(e)})}}
 function next(){if(i+1<qs.length){i++;show()}else finish()}
 function finish(){
  if(fin||busy)return;fin=true;clearInterval(TM);body.innerHTML="";body.appendChild(h('<p class="meta">'+(exam?"交卷中，伺服器判分…":"結算中…")+"</p>"));
  var p=S.kind==="daily"&&dres?Promise.resolve({n:1,c:res[0]&&res[0].ok?1:0,gain:dres.gain,got:dres.got,data:M.D}):exam?M.api("POST","/api/submit",{sid:S.sid,ans:qs.map(function(_,k){return ans[k]===undefined?null:ans[k]})}):M.api("POST","/api/finish",{sid:S.sid});
  p.then(function(r){if(XG){XG();XG=null}M.setData(r.data,r.prog);updWho();result(r)},function(e){fin=false;body.innerHTML="";var s=h('<div><div class="fb no">'+esc(errMsg(e))+"</div></div>"),b=h('<div class="ctl"><button class="pen go">再試一次</button></div>');b.firstChild.onclick=function(){finish()};s.appendChild(b);body.appendChild(s);if(exam&&e.code==="no_session"){s.appendChild(h('<a class="pen" href="#home">回首頁</a>'))}})}
 function result(r){
  var D=M.D,n=exam?r.n:r.n,c=r.c;
  var s=h('<div><div class="q">'+(exam?r.sc+" 分（"+c+" / "+n+"）":c+" / "+n+" 題答對")+"</div>"+(r.late?'<p class="fb no">已超過作答時間，伺服器只接受時限內的答案，這份卷子沒有計分。</p>':"")+"<p>這次獲得 <b>"+r.gain+"</b> 積分，目前 Lv."+M.lv(D)+"。</p></div>");
  if(r.got&&r.got.length){s.appendChild(h('<p class="hl">解鎖新勳章！</p>'));var g=h('<div class="stkgrid"></div>');r.got.forEach(function(id){var k=M.STK.filter(function(x){return x.id===id})[0],ix=M.STK.indexOf(k);g.appendChild(h('<div class="stkc">'+stkSvg(k,ix,1)+"<b>"+k.n+"</b>"+k.d+"</div>"))});s.appendChild(g)}
  if(exam&&r.review&&r.review.length){var l=h('<div><p class="meta">答錯或沒寫的題目（已放進錯題本）</p></div>');r.review.forEach(function(x){l.appendChild(h('<div class="wi">'+gstem(0,x.gs,x.gi,1,1)+"<div>"+tx(x.q)+"</div>"+qimg(x.img)+"<small>"+(x.v===null||x.v===""?"你沒有作答。":tx("你的答案："+labOf(x.o,x.v)+"。"))+" "+tx("答案："+labOf(x.o,x.a)+"。"+x.h)+(x.diag?'<br><b class="diag">'+tx(x.diag)+"</b>":"")+qimg(x.himg)+"</small></div>"))});s.appendChild(l)}
  var bt=h('<div class="ctl"></div>');
  if(o.again){var a=h('<button class="pen go">再來一次</button>');a.onclick=o.again;bt.appendChild(a)}
  bt.appendChild(h('<a class="pen" href="#wrong">錯題本</a>'));bt.appendChild(h('<a class="pen" href="#home">回首頁</a>'));s.appendChild(bt);body.innerHTML="";body.appendChild(s)}
 show()}
function begin(payload,fn){view.innerHTML="";view.appendChild(h('<p class="meta">準備題目…</p>'));M.api("POST","/api/start",payload).then(fn,function(e){view.innerHTML="";var s=sheet("出題失敗","");s.appendChild(h('<div class="fb no">'+esc(errMsg(e))+"</div>"));s.appendChild(h('<a class="pen go" href="#home">回首頁</a>'));view.appendChild(s)})}

/* ---- 各分頁 ---- */
var V={};
V.home=function(){
 var D=M.D,t=ymdT(),y=M.prev(t),tot=M.tot(D),tiles=h('<div class="tiles"></div>');
 tiles.innerHTML='<div class="tile"><small>積分</small><strong>'+D.pts+'</strong><div class="meter"><i style="width:'+(D.pts%M.step)/M.step*100+'%"></i></div><small>再 '+(M.step-D.pts%M.step)+" 分升 Lv."+(M.lv(D)+1)+"</small></div>"+
  '<div class="tile"><small>連續練習</small><strong>'+(D.sk.last===t||D.sk.last===y?D.sk.n:0)+" 天</strong></div>"+
  '<a class="tile" href="#daily"><small>每日一題</small><strong>'+(D.dq[t]?(D.dq[t].ok?"已完成 ✓":"已完成"):"還沒寫")+"</strong></a>"+
  '<a class="tile" href="#wrong"><small>錯題本</small><strong>'+D.wr.length+" 題</strong></a>"+
  '<a class="tile" href="#stickers"><small>勳章</small><strong>'+Object.keys(D.stk).length+" / "+M.STK.length+"</strong></a>"+
  '<a class="tile" href="#progress"><small>答題正確率</small><strong>'+(tot.n?Math.round(tot.c/tot.n*100):0)+"%</strong></a>";
 var a=M.acct||{};if(a.expired)view.appendChild(h('<div class="fb no">你的正式學員授權已到期（'+esc(a.expires)+'），目前只能查看資料。請找管理員延長授權。</div>'));else if(a.daysLeft!==null&&a.daysLeft!==undefined&&a.daysLeft<=14)view.appendChild(h('<div class="fb">提醒：你的授權將在 '+(a.daysLeft+1)+' 天內到期（'+esc(a.expires)+'），要續用請告訴管理員。</div>'));
 var bnr=h("<div></div>");view.appendChild(bnr);view.appendChild(tiles);
 M.api("GET","/api/assigns").then(function(r){var n=(r.rows||[]).filter(function(x){return x.st==="new"||x.st==="open"}).length;if(n)bnr.appendChild(h('<a class="fb" style="display:block;text-decoration:none;color:inherit" href="#assign"><b>你有 '+n+' 份待測的卷子</b>，點這裡查看。</a>'))},function(){});
 var c=M.cfg,s=sheet("獎勵","怎麼賺積分和勳章");s.appendChild(h("<ol class=\"steps\"><li>答對 1 題：依題目難度 +"+c.pts[0]+"／+"+c.pts[1]+"／+"+c.pts[2]+" 分（基礎／應用／挑戰，每天最多計 "+c.capQ+" 題）</li><li>完成一份小測驗（3 題以上）：+20 分</li><li>每日一題：每天只有一次機會，答對 +30 分，答錯 +5 分；做完就不用再做了</li><li>看提示：每題第一次看扣 "+(c.hint||0)+" 分，而且這題答對只拿一半積分</li><li>連續練習：第 2 天起每天加分，最多每天 +14 分</li><li>模擬卷：完成 +20 分，80 分以上再 +50 分（每天前 "+c.capMock+" 份）</li><li>錯題複習：同一題在 "+c.review.join("、")+" 天後各答對一次就畢業，+15 分</li><li>解鎖勳章：銅 +10、銀 +20、金 +30、白金 +50、鑽石 +80 分（共 "+M.STK.length+" 枚）。每 "+c.step+" 分升一級</li></ol>"));view.appendChild(s)};

V.daily=function(){
 begin({kind:"daily"},function(r){
  if(r.done){var s=sheet("每日一題","今天已經完成了"),days=[],i,D=M.D,t=ymdT();for(i=6;i>=0;i--)days.push(M.today(new Date(Date.now()-i*864e5)));
   s.appendChild(h('<div class="q">'+tx(r.q)+"</div>"));if(r.img)s.appendChild(h(qimg(r.img)));s.appendChild(h('<p class="'+(r.ok?"ok":"no")+'">'+(r.ok?"你答對了！":"這題答錯了，記得到錯題本訂正。")+"</p>"));
   s.appendChild(h("<p>答案：<b>"+tx(String(r.a))+"</b>　"+tx(r.h)+"</p>"));if(r.himg)s.appendChild(h(qimg(r.himg)));
   s.appendChild(h('<p class="meta">最近 7 天：'+days.map(function(d){return D.dq[d]?"●":"○"}).join(" ")+"　連續練習 "+D.sk.n+" 天・明天再來！</p>"));view.innerHTML="";view.appendChild(s);return}
  run({tag:"每日一題",title:"全班今天同一題",sess:r})})};

V.quiz=function(id){
 if(id)return startQuiz(id);
 var u=user();if(qg===null)qg=gClamp(u.grade);
 var tabs=h('<div class="tabs"></div>');GL.forEach(function(g){var b=h('<button class="pen'+(qg===g?" on":"")+'">'+gLab(g)+"</button>");b.onclick=function(){qg=g;view.innerHTML="";V.quiz()};tabs.appendChild(b)});view.appendChild(tabs);
 NB.cat.filter(function(S){return S.grade===qg}).forEach(function(S,k){
  var d=h('<details class="sheet"><summary><span class="tag">'+S.sem+"</span></summary></details>");
  S.chs.forEach(function(c){d.appendChild(h('<div class="chap"><span class="no">'+chNo(c)+'</span><b>'+esc(c.name)+'</b><span class="dots"></span></div>'));var ul=h('<div class="secs"></div>');
   c.secs.forEach(function(o){ul.appendChild(h('<a class="'+(M.has(o.id)?"lnk":"todo")+'" href="#quiz/'+o.id+'">'+o.num+" "+esc(o.title)+"</a>"))});d.appendChild(ul)});
  view.appendChild(d);if(k===0)d.open=true});
 view.appendChild(h('<p class="meta" style="text-align:center">實線＝有題庫　虛線＝題庫還在準備中</p>'))};
function startQuiz(id){
 begin({kind:"quiz",unit:id},function(r){
  if(r.empty){view.innerHTML="";var s=sheet("小測驗",esc(title(id)));s.appendChild(h("<p>這一節的題目還在準備中，先看看其他單元吧。</p>"));s.appendChild(h('<a class="pen go" href="#quiz">回單元列表</a>'));view.appendChild(s);return}
  run({tag:"小測驗",title:esc(title(id)),sess:r,again:function(){startQuiz(id)}})})}

V.assign=function(){
 var s=sheet("待測清單","老師派給你的卷子。開始後就會計時，而且只能作答一次");view.appendChild(s);
 var box=h('<p class="meta">讀取中…</p>');s.appendChild(box);
 function ymd(t){var d=new Date(t+288e5).toISOString();return d.slice(0,10)}
 function load(){M.api("GET","/api/assigns").then(function(r){box.remove();box=h("<div></div>");s.appendChild(box);
  if(!r.rows.length){box.appendChild(h("<p>目前沒有老師派的卷子。</p>"));return}
  r.rows.forEach(function(a){
   var info=a.n+" 題・限時 "+a.mins+" 分鐘"+(a.due?"・截止 "+ymd(a.due):""),st={new:"還沒寫",open:"作答中（可以繼續）",done:a.late?"已交（逾時，沒有計分）":"已完成："+a.sc+" 分（答對 "+a.c+" / "+a.n+"）",closed:"已截止（或老師已結束）"}[a.st],
   row=h('<div class="wi"><div><b>'+esc(a.title)+"</b></div><small>"+esc(info)+"</small><div class=\"meta\">"+esc(st)+"</div></div>");
   if(a.st==="new"||a.st==="open"){var b=h('<button class="pen go">'+(a.st==="open"?"繼續作答":"開始作答")+"</button>");b.onclick=function(){if(a.st==="new"&&!confirm("開始後就會計時（"+a.mins+" 分鐘），而且只能作答一次。確定開始？"))return;
    begin({kind:"assign",id:a.id},function(r){var note=[];if(r.resumed)note.push("接續上次還沒交的卷子。");if(r.short)note.push("可出的題目不足，這份只有 "+r.qs.length+" 題。");run({tag:"派卷",title:r.title||a.title,sess:r,note:note.join(" ")})})};row.appendChild(h('<div class="ctl"></div>')).appendChild(b)}
   box.appendChild(row)})},function(e){box.textContent=errMsg(e)})}
 load()};

V.mock=function(){
 var u=user(),D=M.D,s=sheet("模擬卷","自選單元與題數・每題 2 分鐘・交卷才公布答案"),gr=gClamp(u.grade);
 s.appendChild(h("<p>不選單元時，依照「由易到難、題型分配」的細目表，從"+(SCI?gLab(gr)+"和前一冊":gShort(gr)+"年級和前一年級")+"的題庫出題；也可以自己挑想考的單元（可多可少）。每個人的題目和選項順序都不同。時間由伺服器計算，時間到會自動交卷，沒寫的算錯，答錯的題目會進錯題本。</p>"));
 var n=h('<div class="ctl"><label>題數</label><select id="mn"><option>5</option><option selected>10</option><option>15</option><option>20</option><option>30</option></select><span class="meta" id="mt"></span></div>'),pk=picker(M.units||[],u.grade);
 s.appendChild(n);s.appendChild(pk.el);
 var nn=n.querySelector("#mn");function tm(){n.querySelector("#mt").textContent="限時 "+(+nn.value*2)+" 分鐘"}nn.onchange=tm;tm();
 var b=h('<div class="ctl"><button class="pen go">開始作答</button></div>');b.firstChild.onclick=function(){start()};s.appendChild(b);
 if(D.mk.length)s.appendChild(h('<p class="meta">最近成績：'+D.mk.slice(-5).map(function(m){return m.sc+" 分"}).join("、")+"</p>"));view.appendChild(s);
 function start(){begin({kind:"mock",n:+nn.value,units:pk.get()},function(r){
  if(r.empty){view.innerHTML="";var e=sheet("沒有題目","");e.appendChild(h('<p>這個範圍目前沒有題目。</p><a class="pen go" href="#mock">重新選擇</a>'));view.appendChild(e);return}
  var note=[];if(r.filled)note.push("你選的單元題目不夠多，已用"+(SCI?"同冊":"同年級")+"其他單元補了 "+r.filled+" 題。");if(r.short)note.push("可出的題目不足，這份只有 "+r.qs.length+" 題。");if(r.small)note.push("題數少於 8 題的練習不計入模擬卷獎勵與勳章。");
  run({tag:"模擬卷",title:"請在時間內完成",sess:r,note:note.join(" "),again:start})})}};


/* 篩選列：年級、學期，以及各頁自己的選項；回傳 {el, val()} */
function fbar(parts,onchg){var el=h('<div class="fbar"></div>'),sel={};parts.forEach(function(p){var lb=h("<label>"+p.l+" </label>"),se=h("<select></select>");if(p.hide)lb.hidden=true;p.o.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];se.appendChild(op)});se.onchange=function(){onchg()};lb.appendChild(se);el.appendChild(lb);sel[p.k]=se});return{el:el,val:function(k){return sel[k].value},set:function(k,v){sel[k].value=v}}}
var GRADE_OPT=[["",SCI?"全部冊別":"全部年級"]].concat(GL.map(function(g){return[String(g),gLab(g)]})),SEM_OPT=SCI?[["","全冊"]]:[["","上下學期"],["u","上學期"],["d","下學期"]];
function gsOk(id,g,m){id=String(id);return(!g||gOf(id)===g)&&(SCI||!m||id.charAt(1)===m)}
V.wrong=function(){
 var D=M.D,s=sheet("錯題本",D.wr.length+" 題");view.appendChild(s);
 if(!D.wr.length){s.appendChild(h("<p>目前沒有錯題，真棒！</p>"));return}
 var due=D.wr.filter(function(w){return!w.due||w.due<=ymdT()}).length;s.appendChild(h("<p>每一題要在 "+M.cfg.review.join("、")+" 天後各答對一次才會畢業（間隔複習，記得最牢），還能拿積分。今天該複習 <b>"+due+"</b> 題。</p>"));
 var b=h('<div class="ctl"><button class="pen go">開始訂正（最多 10 題）</button></div>');b.firstChild.onclick=function(){fix()};if(!due)b.firstChild.textContent="今天沒有要複習的題目";s.appendChild(b);
 var units=[],seen={};D.wr.forEach(function(w){if(!seen[w.id]){seen[w.id]=1;units.push(w.id)}});units=NB.sortIds(units);
 var F=fbar([{k:"g",l:SCI?"冊別":"年級",o:GRADE_OPT},{k:"m",l:"學期",o:SEM_OPT,hide:SCI},{k:"u",l:"單元",o:[["","全部單元"]]},{k:"st",l:"狀態",o:[["","全部"],["due","今天可複習"],["wait","還沒到複習日"],["hard","錯 2 次以上"]]}],draw);
 s.appendChild(F.el);var cnt=h('<p class="meta"></p>');s.appendChild(cnt);
 var sbx=h('<div class="sbox"></div>');s.appendChild(sbx);
 function unitOpts(){var se=F.el.querySelectorAll("select")[2],cur=se.value;se.innerHTML="";var o0=document.createElement("option");o0.value="";o0.textContent="全部單元";se.appendChild(o0);units.filter(function(id){return gsOk(id,F.val("g"),F.val("m"))}).forEach(function(id){var o=document.createElement("option");o.value=id;o.textContent=title(id);se.appendChild(o)});se.value=cur;if(se.value!==cur)se.value=""}
 F.el.querySelectorAll("select")[0].onchange=F.el.querySelectorAll("select")[1].onchange=function(){unitOpts();draw()};
 function draw(){sbx.innerHTML="";var t=ymdT(),n=0;
  D.wr.slice().reverse().forEach(function(w){var isDue=!w.due||w.due<=t;
   if(!gsOk(w.id,F.val("g"),F.val("m")))return;if(F.val("u")&&w.id!==F.val("u"))return;
   var st=F.val("st");if(st==="due"&&!isDue)return;if(st==="wait"&&isDue)return;if(st==="hard"&&!(w.n>=2))return;n++;
   var d=h('<div class="wi">'+gstem(0,w.gs,w.gi,1,1)+"<div>"+tx(w.q)+"</div>"+qimg(w.img)+"<small>"+(w.qid?"<span class=\"qid\">"+esc(w.qid)+"</span>　":"")+esc(title(w.id))+"・錯 "+w.n+" 次・已通過 "+(w.ok||0)+"/"+M.cfg.review.length+"・"+(isDue?"今天可複習":w.due.slice(5)+" 再複習")+"　</small></div>"),dt=h("<details><summary>看答案</summary></details>");dt.appendChild(h("<div>"+tx("答案："+w.a+"。"+(w.h||""))+"</div>"));d.appendChild(dt);sbx.appendChild(d)});
  if(!n)sbx.appendChild(h("<p>這個篩選條件下沒有錯題。</p>"));cnt.textContent="符合條件 "+n+" 題（共 "+D.wr.length+" 題）";
  if(window.Zhuyin&&Zhuyin.refresh)try{Zhuyin.refresh()}catch(e){}}
 unitOpts();draw();
 function fix(){begin({kind:"fix"},function(r){if(r.empty){view.innerHTML="";V.wrong();return}run({tag:"錯題訂正",title:"把錯的題目弄懂",sess:r,again:function(){view.innerHTML="";V.wrong()}})})}};

V.progress=function(){
 var D=M.D,tot=M.tot(D),s=sheet("學習進度","看看自己的成長"),tl=h('<div class="tiles"></div>');
 tl.innerHTML='<div class="tile"><small>累積答題</small><strong>'+tot.n+'</strong></div><div class="tile"><small>答對</small><strong>'+tot.c+'</strong></div><div class="tile"><small>逛過的單元</small><strong>'+M.seen(D)+'</strong></div><div class="tile"><small>練習天數</small><strong>'+Object.keys(D.day).length+"</strong></div>";
 s.appendChild(tl);
 var days=[],i,mx=5;for(i=6;i>=0;i--){var dt=new Date(Date.now()-i*864e5),k=M.today(dt),x=D.day[k]||{n:0,c:0};days.push({l:(dt.getMonth()+1)+"/"+dt.getDate(),n:x.n,c:x.c});mx=Math.max(mx,x.n)}
 s.appendChild(h('<p class="meta">最近 7 天（淺色＝答題數，綠色＝答對數）</p>'));var st=h('<div class="stage"></div>');s.appendChild(st);var sv=NB.svg(st,420,150);
 days.forEach(function(d,j){var X=30+j*56,H=d.n/mx*100,C=d.c/mx*100;NB.mk("rect",{x:X,y:120-H,width:34,height:H,fill:"var(--p2)",opacity:.28},sv,1.6);NB.mk("rect",{x:X,y:120-C,width:34,height:C,fill:"var(--p3)"},sv,1.6);NB.t(sv,X+17,142,d.l,{z:12,c:"var(--soft)"})});
 s.appendChild(h('<p class="meta">各單元答對率</p>'));var ks=NB.sortIds(Object.keys(D.u).filter(function(k){return D.u[k].n}));
 if(!ks.length)s.appendChild(h("<p>還沒有作答紀錄，去做一份小測驗吧。</p>"));
 var ubx=h('<div class="sbox"></div>'),PF=null;
 if(ks.length){PF=fbar([{k:"g",l:SCI?"冊別":"年級",o:GRADE_OPT},{k:"m",l:"學期",o:SEM_OPT,hide:SCI},{k:"o",l:"排序",o:[["id","單元順序"],["low","答對率由低到高"],["many","答題數由多到少"]]},{k:"w",l:"顯示",o:[["","全部"],["weak","待加強（低於 70%）"],["good","很穩（90% 以上）"]]}],drawU);s.appendChild(PF.el);s.appendChild(ubx)}
 function drawU(){ubx.innerHTML="";var L=ks.filter(function(k){var u=D.u[k],p=u.c/u.n*100;if(!gsOk(k,PF.val("g"),PF.val("m")))return false;if(PF.val("w")==="weak"&&!(p<70))return false;if(PF.val("w")==="good"&&!(p>=90))return false;return true});
  var o=PF.val("o");if(o==="low")L.sort(function(x,y){return D.u[x].c/D.u[x].n-D.u[y].c/D.u[y].n});else if(o==="many")L.sort(function(x,y){return D.u[y].n-D.u[x].n});
  if(!L.length)ubx.appendChild(h("<p>這個篩選條件下沒有單元。</p>"));
  L.forEach(function(k){var u=D.u[k],p=Math.round(u.c/u.n*100);ubx.appendChild(h('<div class="urow"><span>'+esc(title(k))+'</span><div class="meter"><i style="width:'+p+'%"></i></div><span>'+u.c+"/"+u.n+"（"+p+"%）</span></div>"))});
  if(window.Zhuyin&&Zhuyin.refresh)try{Zhuyin.refresh()}catch(e){}}
 if(ks.length)drawU();
 if(D.mk.length){s.appendChild(h('<p class="meta">模擬卷成績</p>'));s.appendChild(h("<p>"+D.mk.slice(-8).map(function(m){return m.d.slice(5)+"　"+m.sc+" 分"}).join("<br>")+"</p>"))}
 view.appendChild(s)};

V.stickers=function(){
 var D=M.D,P=M.prog||{},cats=[],cur=sessionStorage.getItem("nb-cat")||"全部",s=sheet("勳章","已收集 "+Object.keys(D.stk).length+" / "+M.STK.length+" 枚");
 M.STK.forEach(function(k){if(cats.indexOf(k.cat)<0)cats.push(k.cat)});if(cur!=="全部"&&cats.indexOf(cur)<0)cur="全部"; /* 換科目後，數學的「年級」分類在理化不存在 */
 var tb=h('<div class="tabs"></div>'),nx=h('<div class="nextlist"></div>'),g=h('<div class="stkgrid"></div>');
 ["全部"].concat(cats).forEach(function(c){var b=h('<button class="pen'+(c===cur?" go":"")+'">'+c+"</button>");b.onclick=function(){try{sessionStorage.setItem("nb-cat",c)}catch(e){}view.innerHTML="";V.stickers()};tb.appendChild(b)});
 s.appendChild(tb);
 var fam={};M.STK.forEach(function(k){(fam[k.f]=fam[k.f]||[]).push(k)});
 Object.keys(P).forEach(function(f){var p=P[f],k=M.STK.filter(function(x){return x.id===p.id})[0];if(!k||(cur!=="全部"&&k.cat!==cur)||D.stk[k.id])return;var pc=Math.min(100,Math.round(p.cur/p.target*100));nx.appendChild(h('<div class="nx"><b>'+k.n+"</b> <small>"+k.d+"（"+Math.min(p.cur,p.target)+" / "+p.target+'）</small><div class="meter"><i style="width:'+pc+'%"></i></div></div>'))});
 if(nx.children.length){s.appendChild(h('<p class="meta">快要解鎖</p>'));s.appendChild(nx)}
 M.STK.forEach(function(k,i){if(cur!=="全部"&&k.cat!==cur)return;var on=!!D.stk[k.id];g.appendChild(h('<div class="stkc'+(on?"":" off")+'">'+stkSvg(k,i,on)+"<b>"+(on?k.n:"？？？")+"</b><small>"+TN[k.t-1]+"</small><br>"+k.d+(on?"<br><small>"+D.stk[k.id]+"</small>":"")+"</div>"))});
 s.appendChild(g);view.appendChild(s)};

V.board=function(){
 var u=user(),s=sheet("排行榜",esc(u.cls+" 班")),box=h("<div>載入中…</div>");s.appendChild(box);view.appendChild(s);
 M.api("GET","/api/board").then(function(r){var rows=r.rows.slice().sort(function(a,b){return b.pts-a.pts});
  if(!rows.length){box.textContent="還沒有人上榜，先去做一份小測驗吧。";return}
  box.innerHTML='<table class="tb"><tr><th>名次</th><th>座號</th><th>等級</th><th>積分</th><th>答對</th><th>勳章</th></tr>'+rows.map(function(x,i){return'<tr class="'+(x.no===u.no?"me":"")+'"><td><span class="rk r'+(i+1)+'">'+(i+1)+"</span></td><td>"+esc(x.no)+(x.no===u.no?"（我）":"")+"</td><td>Lv."+x.lv+"</td><td>"+x.pts+"</td><td>"+x.ok+"</td><td>"+x.stk+"</td></tr>"}).join("")+"</table>"})
 .catch(function(e){box.textContent=errMsg(e)})};

/* ---- 列印練習卷 ----
   學生：陽春版（來源、題數、出題、列印題目卷／答案卷）。
   管理員與老師：五步驟 出題方式 → 範圍 → 審題預覽 → 版面配置 → 進行出卷；每一步有問題就跳出視窗說明。 */
function popup(ttl,msg,after){
 var ov=h('<div class="pkov noprint" role="alertdialog" aria-modal="true"><div class="pkbox pkmsg"><h3></h3><p></p><div class="ctl"><button type="button" class="pen go">知道了</button></div></div></div>');
 ov.querySelector("h3").textContent=ttl;ov.querySelector("p").textContent=msg;
 function close(){ov.remove();document.removeEventListener("keydown",key);if(after)after()}
 function key(e){if(e.key==="Escape"||e.key==="Enter"){e.preventDefault();close()}}
 ov.querySelector("button").onclick=close;ov.addEventListener("click",function(e){if(e.target===ov)close()});document.addEventListener("keydown",key);document.body.appendChild(ov);ov.querySelector("button").focus()}
function fq(P){var o="";if(P.fd&&P.fd.length)o+="&d="+encodeURIComponent(P.fd.join(","));if(P.fg&&P.fg.length)o+="&cg="+encodeURIComponent(P.fg.join(","));if(P.fk)o+="&kw="+encodeURIComponent(P.fk);if(P.fp)o+="&pf="+encodeURIComponent(P.fp);return o}
function ansOf(q){return(q.al?"("+q.al+") ":"")+(q.ty==="match"?"":q.a)}

V.print=function(arg){return user().role==="student"?printStudent():printWiz(arg)};

/* ---- 學生：陽春版 ---- */
function printStudent(){
 var u=user(),D=M.D,PP=NB.pp,s=sheet("列印練習卷","選好範圍與題數，按「出題」，就能印出題目卷和答案卷");s.classList.add("noprint");
 var src='<select id="ps"><option value="mix">'+(SCI?"本冊綜合":"本年級綜合")+'</option>'+(D.wr.length?'<option value="wrong">我的錯題（'+D.wr.length+" 題）</option>":"")+'<option value="pick">自選單元（下方勾選）</option></select>';
 var ctl=h('<div class="ctl"><label>題目來源</label>'+src+'<label>題數</label><select id="pn"><option>5</option><option>10</option><option selected>15</option><option>20</option><option>30</option><option>40</option></select><button class="pen go" id="go">出題</button></div>');
 var pk=picker(NB.sortIds(M.gens||[]),u.grade),out=h("<div></div>"),note=h('<p class="meta noprint"></p>'),last=null,panel=PP.panel(u,function(){});
 var acts=h('<div class="ctl pact noprint" hidden><button class="pen go" data-k="q-0">列印題目卷</button><button class="pen" data-k="ak-0">列印答案卷（簡答與詳解）</button></div>');
 s.appendChild(ctl);s.appendChild(pk.el);s.appendChild(acts);s.appendChild(note);view.appendChild(s);view.appendChild(out);
 /* 學生的卷面固定：題目卷＋答案卷、一份、有頁碼、浮水印強制 */
 function P(){var p=panel.get();p.kinds={q:true,ak:true};p.variants=1;p.matrix=false;p.pageNo="kn";p.fd=[];p.fg=[];p.fk="";p.fp="";return p}
 function deps(){return{u:u,today:M.today(),title:title,tx:tx,qimg:qimg,wm:last&&last.wm,secs:last&&last.secs}}
 function redraw(){if(!last)return;var p=P();PP.applyPage(p);out.innerHTML=PP.build(p,last.qs,last.nm,deps())}
 out.innerHTML='<p class="meta noprint">按上面的「出題」，題目就會出現在這裡。</p>';
 acts.onclick=function(e){var b=e.target.closest("button");if(!b)return;redraw();PP.printSheet(out,b.dataset.k)};
 var stopG=PP.guard(out,function(){return !!(last&&last.wm&&last.wm.force)},function(){redraw()});
 window.addEventListener("hashchange",function f(){if(!/^#print(\/|$)/.test(location.hash)){PP.clearPage();stopG();window.removeEventListener("hashchange",f)}});
 pk.el.addEventListener("change",function(){if(pk.get().length)ctl.querySelector("#ps").value="pick"});
 var busy=false;
 ctl.querySelector("#go").onclick=function(){
  if(busy)return;var v=ctl.querySelector("#ps").value,n=+ctl.querySelector("#pn").value,us=pk.get();
  if(v==="pick"&&!us.length){popup("還沒選單元","你選了「自選單元」，請先在下面勾選至少一個單元。");return}
  busy=true;out.innerHTML='<p class="meta noprint">出題中…</p>';note.textContent="";acts.hidden=true;
  PP.device().then(function(dv){return M.api("GET","/api/print?src="+(v==="pick"?"mix&units="+encodeURIComponent(us.join(",")):encodeURIComponent(v))+"&n="+n+"&dev="+encodeURIComponent(JSON.stringify(dv)))}).then(function(r){
   busy=false;last={qs:r.qs,nm:v==="wrong"?"錯題重練":v==="mix"?"綜合練習":"自選 "+us.length+" 個單元",wm:r.wm};
   if(r.filled)note.textContent="你選的單元不重複的題目不夠，已用"+(SCI?"同冊":"同年級")+"其他單元補了 "+r.filled+" 題。";if(r.short)note.textContent+=" 可出的題目只有 "+r.qs.length+" 題。";
   acts.hidden=false;redraw()},function(e){busy=false;out.innerHTML="";popup("出題失敗",errMsg(e))})}}

/* ---- 管理員／老師：五步驟 ---- */
function printWiz(arg){
 var u=user(),PP=NB.pp,s=sheet("列印練習卷","一步一步設定，最後按「進行出卷」");s.classList.add("noprint");
 var W={mode:"quick",scope:"paper"},STEPS=[["出題方式","第 1 步　選擇出題方式"],["範圍","第 2 步　選擇出題範圍"],["審題預覽","第 3 步　審題預覽（還沒有正式出卷，不會留下列印紀錄）"],["版面配置","第 4 步　版面配置"],["進行出卷","第 5 步　確認並進行出卷"]],step=1;
 var pk=picker(NB.sortIds(M.gens||[]),u.grade),out=h("<div></div>"),pv=null,pvSig="",last=null,cm=null,busy=false,showAns=false;
 var panel=PP.panel(u,function(){if(step===4)drawDraft()});
 var ed=NB.plan.editor({role:u.role,admin:!!u.admin,api:function(m,p){return M.api(m,p)},tx:tx,title:title,units:function(){return unitsNow()},online:function(){return W.scope==="online"},avail:function(us,on){return M.api("GET","/api/print/avail?units="+encodeURIComponent(us.join(","))+(on?"&scope=online":""))},say:function(m){popup("提醒",m)}},function(){});ed.el.classList.add("noprint");
 var bar=h('<ol class="pstepbar noprint"></ol>'),hd=h('<h3 class="pst noprint"></h3>'),nav=h('<div class="ctl pnav noprint"><button class="pen" type="button">上一步</button><button class="pen go" type="button">下一步</button></div>');
 STEPS.forEach(function(x,i){bar.appendChild(h('<li><a href="#print/step'+(i+1)+'"><b>'+(i+1)+"</b><span>"+x[0]+"</span></a></li>"))});
 var s1=h('<div class="pstp"><div class="pmodes"><label class="pmode"><input type="radio" name="pw-mode" value="quick" checked><b>快速出題</b><small>選好範圍和題數，電腦直接隨機出題。最快，適合日常練習卷。</small></label><label class="pmode"><input type="radio" name="pw-mode" value="auto"><b>電腦出題</b><small>自己安排大題、題型、題數、配分與難易度比例，題目由電腦依條件挑；可以用「智慧配分」。</small></label><label class="pmode"><input type="radio" name="pw-mode" value="manual"><b>手動出題</b><small>每個大題自己從題庫挑題（可用題目 ID 搜尋），考哪些題完全由你決定。</small></label></div></div>');
 if(M.cfg&&M.cfg.qr)s1.appendChild(h('<p class="meta"><a href="#qr">QR code 線上作答成績 →</a></p>'));
 var gsel='<span id="pw-g" class="pgs">'+GL.map(function(g){return'<label class="ppc"><input type="checkbox" value="'+g+'"'+(gClamp(u.grade)==g?" checked":"")+">"+gShort(g)+"</label>"}).join("")+"</span>";
 var s2=h('<div class="pstp"><h4>出題範圍</h4><div class="pmodes"><label class="pmode"><input type="radio" name="pw-scope" value="paper" checked><b>紙本出卷</b><small>題目較全，題型較多（含勾選題、連連看）。</small></label><label class="pmode"><input type="radio" name="pw-scope" value="online"><b>線上速測</b><small>只用線上題庫的題目（沒有勾選題、連連看），和學生線上測驗的題目一致。</small></label></div>'+
  '<div class="ctl"><label>'+(SCI?"冊別（可多選）":"年級（可多選）")+'</label>'+gsel+'<label'+(SCI?" hidden":"")+'>冊次</label><select id="pw-sem"'+(SCI?" hidden":"")+'><option value="a">上下冊（全學年）</option><option value="u">上冊</option><option value="d">下冊</option></select><label>課次</label><select id="pw-src"><option value="all">整個範圍綜合</option><option value="pick">自選課次（下方勾選）</option></select><label class="qn">題數</label><select id="pw-n"><option>5</option><option>10</option><option selected>15</option><option>20</option><option>30</option><option>40</option></select></div><div class="pbox2"></div></div>');
 var INFO=[["ty","題型"],["lv","難易度"],["unit","單元"],["id","題目ID"],["kd","題目類別"],["p","學習表現"],["c","學習內容"],["g","認知層次"],["k","知識類型"]],IKEY="nb-pvinfo",info=(function(){var d={ty:1,lv:1,unit:1,id:1};try{var s=JSON.parse(localStorage.getItem(IKEY)||"null");if(s&&typeof s==="object")return s}catch(e){}return d})();
 var s3=h('<div class="pstp"><div class="ctl pvbar"><button type="button" class="pen" id="pv-re">重新出題</button><label class="ppc"><input type="checkbox" id="pv-ans"> 顯示答案</label><span class="pvinfo"><b>題目資訊</b>'+INFO.map(function(x){return'<label class="ppc"><input type="checkbox" data-i="'+x[0]+'"'+(info[x[0]]?" checked":"")+"> "+x[1]+"</label>"}).join("")+'</span></div>'+
  '<div class="ctl pvsort"><b>排序</b><button type="button" class="pen" data-o="easy">由易到難</button><button type="button" class="pen" data-o="hard">由難到易</button><button type="button" class="pen" data-o="unit">依單元</button><button type="button" class="pen" data-o="rand">隨機</button><span class="meta">也可以拖曳題目左邊的 ⠿，或按 ↑ ↓ 調整順序（只在同一大題內移動）。</span></div><div class="pvsum"></div><div class="pvscore"></div><div class="pvlist"></div></div>');
 var s4=h('<div class="pstp"><p class="meta">下面的卷面預覽只是草稿，還沒有正式出卷；到下一步按「進行出卷」才算數。</p><div class="pbox4"></div></div>');
 var s5=h('<div class="pstp"><div class="pstsum"></div><div class="ctl"><button type="button" class="pen go" id="pw-go">進行出卷</button></div><div class="pres"></div></div>');
 var stepEls=[s1,s2,s3,s4,s5],box2=s2.querySelector(".pbox2"),box4=s4.querySelector(".pbox4"),dts=panel.el.querySelectorAll(":scope > details");
 s2.insertBefore(pk.el,box2);box2.appendChild(ed.el);
 s.appendChild(bar);s.appendChild(hd);stepEls.forEach(function(x){s.appendChild(x)});s.appendChild(nav);view.appendChild(s);view.appendChild(out);
 function $(sel,root){return(root||s).querySelector(sel)}
 function val(id){return $("#"+id).value}
 function grades(){return Array.prototype.map.call($("#pw-g").querySelectorAll("input:checked"),function(x){return x.value})}
 function unitsNow(){var e=$("#pw-src");return e&&e.value==="pick"?pk.get():pk.visible()}
 function curPlan(){return W.mode==="quick"?null:ed.get()}
 function qurl(dry,g){var p=panel.get(),pick=val("pw-src")==="pick",us=pk.get();
  return"/api/print?src=mix"+(pick?"&units="+encodeURIComponent(us.join(",")):"&sem="+val("pw-sem"))+"&g="+grades().join(",")+(W.scope==="online"?"&scope=online":"")+fq(p)+(g&&g.plan?"&plan="+encodeURIComponent(JSON.stringify(g.plan)):"&n="+val("pw-n"))+(dry?"&dry=1":"")}
 function sig(){var g=curPlan();return g&&g.err?"ERR:"+g.err:qurl(true,g)}
 /* 各步驟的檢查：有問題回傳要說的話 */
 function chk(n){
  if(n===2){if(val("pw-src")==="pick"&&!pk.get().length)return["還沒選課次","你選了「自選課次」，但還沒有勾選任何課次。請在下方勾選，或把「課次」改成「整個範圍綜合」。"];if(W.mode!=="quick"){var g=ed.get();if(g.err)return["大題設定有問題",g.err]}}
  if(n===3){if(busy)return["出題中","題目還在準備，請稍等一下再按下一步。"];if(pv&&pvSig!==sig())return["需要重新審題","範圍或題目設定改過了，需要先重新審題。"];if(!pv)return["還沒有審題","請先在第 3 步看過這份卷的題目（系統正在幫你出題），再往後走。"];if(!pv.qs.length)return["沒有題目","目前沒有可以出的題目。請回到上一步放寬範圍或條件，或按「重新出題」。"]}
  if(n===4){var P=panel.get();if(!Object.keys(P.kinds||{}).some(function(k){return P.kinds[k]})&&!P.matrix)return["還沒選輸出卷別","請至少勾選一種輸出卷別（例如題目卷），不然沒有東西可以印。"]}
  return null}
 function request(n){
  n=Math.max(1,Math.min(5,n||1));
  var order=[2,3,4];for(var k=0;k<order.length;k++){var st=order[k];if(st>=n)break;var bad=chk(st);if(bad){popup(bad[0],bad[1],function(){});show(st);if(location.hash!=="#print/step"+st)location.replace("#print/step"+st);return}}
  show(n)}
 function show(n){
  step=n;hd.textContent=STEPS[n-1][1];stepEls.forEach(function(x,i){x.hidden=i+1!==n});
  if(n===2){layout2();box2.appendChild(panel.el);for(var i=0;i<dts.length;i++){dts[i].hidden=i!==4;if(i===4)dts[i].open=true}}
  if(n===3){if(!pv||pvSig!==sig())runPreview();else drawPreview()}
  if(n===4){box4.appendChild(panel.el);for(var j=0;j<dts.length;j++){dts[j].hidden=j===4;if(j!==4)dts[j].open=j<3}drawDraft()}
  if(n===5){if(fresh())redrawFinal();else out.innerHTML="";summ()}
  out.hidden=!(n===4||(n===5&&fresh()));
  nav.children[0].hidden=n===1;nav.children[1].hidden=n===5;nav.children[1].textContent=n===4?"下一步：進行出卷":"下一步";
  Array.prototype.forEach.call(bar.children,function(li,i){li.className=i+1===n?"on":i+1<n?"done":"";var a=li.firstChild;if(i+1===n)a.setAttribute("aria-current","step");else a.removeAttribute("aria-current")});
  if(n!==4&&n!==5)out.innerHTML=""}
 function qrWant(){var P=panel.get();return !!(P.qr&&M.cfg&&M.cfg.qr&&u.role==="teacher")}
 /* QR 卷的答案格跟著「題組合併、配分」走；這些改了就要重新出卷，掃描結果才會和卷面一致 */
 function qrSig(){var P=panel.get();return qrWant()?"|qr|"+(P.gmerge!==false)+"|"+JSON.stringify((pv&&pv.secs||[]).map(function(x){return[x.per,x.pts,x.take]})):""}
 function keyOf(){return pv?pv.qs.map(function(q){return q.unit+"|"+q.q+"|"+q.a}).join("\n")+qrSig():""}
 /* 每一份題序（甲乙丙丁，先四份都算好，之後改份數也不用重出）的答案格：題號、題型、選項數、答案（答案只送到伺服器存） */
 function qrPayload(){
  var P=panel.get(),mg=P.gmerge!==false,tagged=pv.qs.map(function(q,i){return Object.assign({},q,{__i:i})}),vars=[];
  for(var v=0;v<4;v++){var arr=PP.variant(tagged,v,pv.secs),bs=NB.score.blocks(arr,true),rows=[],no={},lastS=-1;
   bs.forEach(function(b){var si=pv.secs?b.s:0;if(no[si]===undefined)no[si]=0;
    b.qs.forEach(function(q,k){var g=b.gid&&b.qs[0].gs;if(!mg||!g||k===0)no[si]++;var ty=q.ty||(q.o?"choice":(String(q.a).trim()!==""&&isFinite(+q.a)?"num":"text"));
     var key=ty==="choice"||ty==="multi"?q.al:ty==="match"?q.L.map(function(_,j){return L(q.R.indexOf(q.pr[j][1]))}):ty==="num"?+q.a:String(q.a);
     var lab=(pv.secs?CNS[si]+"、":"")+no[si]+(mg&&g?"("+(k+1)+")":"");
     rows.push({s:pv.secs?si:null,g:no[si],k:g?k+1:0,ty:ty,n:q.o?q.o.length:q.L?q.L.length:0,key:key,lab:lab,i:q.__i,unit:q.unit,qid:q.qid,q:String(q.q||"").slice(0,600),o:q.o,a:String(q.a==null?"":q.a),h:q.h,img:q.img,himg:q.himg,gs:q.gs,lv:q.lv})})});
   vars.push(rows)}
  return{merge:mg,secs:pv.secs?pv.secs.map(function(x){return{title:x.title,ty:x.ty,per:x.per,pts:x.pts,take:x.take}}):null,vars:vars}}
 function fresh(){return!!(last&&cm&&pv&&cm.key===keyOf())}
 function goStep(n){location.hash="#print/step"+Math.max(1,Math.min(5,n))}
 nav.children[0].onclick=function(){goStep(step-1)};nav.children[1].onclick=function(){goStep(step+1)};
 var node=s;PS={alive:function(){return document.body.contains(node)},go:function(a){var m=/^step([1-5])$/.exec(a||"");request(m?+m[1]:1);window.scrollTo(0,0)}};
 bar.addEventListener("click",function(e){var a=e.target.closest("a");if(!a)return;e.preventDefault();goStep(+a.getAttribute("href").slice(-1))});
 /* 第 1 步 */
 s1.addEventListener("change",function(e){if(e.target.name!=="pw-mode")return;W.mode=e.target.value;if(W.mode!=="quick")ed.setMode(W.mode);layout2()});
 /* 第 2 步 */
 function layout2(){var q=W.mode==="quick";$(".qn").hidden=q?false:true;$("#pw-n").hidden=!q;ed.el.hidden=q;pk.el.hidden=val("pw-src")!=="pick";if(!pk.el.hidden)pk.el.open=true;ed.refreshWeights()}
 function filt(){pk.filter(grades(),val("pw-sem")==="a"?"":val("pw-sem"));ed.refreshWeights()}
 s2.addEventListener("change",function(e){
  if(e.target.name==="pw-scope"){W.scope=e.target.value;if(W.mode!=="quick"){var c=ed.syncScope();if(c)popup("已調整題型",c+" 個大題原本是勾選題或連連看，線上速測的題庫沒有這些題型，已改成選擇題。")}}
  else if(e.target.closest("#pw-g")||e.target.id==="pw-sem"){if(e.target.closest("#pw-g")&&!grades().length){e.target.checked=true;popup(SCI?"至少選一冊":"至少選一個年級",SCI?"冊別不能全部取消，請至少保留一冊。":"年級不能全部取消，請至少保留一個。")}filt()}
  else if(e.target.id==="pw-src"){layout2()}});
 pk.el.addEventListener("change",function(){if(pk.get().length&&val("pw-src")!=="pick"){$("#pw-src").value="pick";layout2()}ed.refreshWeights()});
 /* 第 3 步：審題預覽（dry：不寫資料庫） */
 function runPreview(){
  if(busy)return;var g=curPlan(),sg=sig();if(g&&g.err){popup("大題設定有問題",g.err,function(){goStep(2)});return}
  busy=true;pv=null;$(".pvsum").textContent="";$(".pvlist").innerHTML='<p class="meta">出題中…</p>';
  M.api("GET",qurl(true,g)).then(function(r){busy=false;pv={qs:r.qs,secs:r.secs,nm:r.name,short:r.short,filled:r.filled};pvSig=sg;drawPreview();if(!r.qs.length)popup("沒有題目","目前的範圍與條件沒有可以出的題目。請回到上一步放寬條件。",function(){goStep(2)})},
   function(e){busy=false;pv=null;pvSig="";$(".pvlist").innerHTML="";popup("出題失敗",errMsg(e),function(){goStep(2)})})}
 $("#pv-re").onclick=function(){pvSig="";runPreview()};
 $("#pv-ans").onchange=function(){showAns=this.checked;drawPreview()};
 /* ---- 審題預覽的工具：題目資訊、排序、配分（題數／答數／每題或每答） ---- */
 function merge(){return panel.get().gmerge!==false}
 function ptsTotal(){return pv&&pv.secs?NB.score.total(NB.score.stats(pv.qs,pv.secs,merge())):0}
 var TYN={tf:"是非",multi:"勾選",match:"連連看"};function tyOf(q){return TYN[q.ty]||(q.o?"選擇":"填充")}
 function infoOf(q){var a=q.m||{},o=[];
  if(info.ty)o.push(tyOf(q));if(info.lv)o.push(a.d||({1:"易",2:"中",3:"難"})[q.lv]||"中");if(info.unit)o.push(title(q.unit).split(" ").slice(-1)[0]);if(info.id&&q.qid)o.push("ID "+q.qid);
  if(info.kd&&q.kd)o.push("類別："+q.kd);if(info.p&&a.p)o.push("學習表現："+a.p);if(info.c&&a.c)o.push("學習內容："+a.c);if(info.g&&a.g)o.push("認知層次："+a.g);if(info.k&&a.k)o.push("知識類型："+a.k);
  return o.join("｜")}
 /* 題目一律以「題號」為單位操作：題組整組一起換、移除、搬動 */
 function blocksNow(){return NB.score.blocks(pv.qs,true)}
 function setBlocks(bs){pv.qs=bs.reduce(function(a,b){return a.concat(b.qs)},[])}
 function bLv(b){return Math.max.apply(null,b.qs.map(function(q){return q.lv||2}))}
 var ORD={};NB.flat.forEach(function(o,i){ORD[o.id]=i});
 function sortBy(how){var bs=blocksNow(),r=Math.random;
  var key=function(b,i){return how==="easy"?[bLv(b),i]:how==="hard"?[-bLv(b),i]:how==="unit"?[b.qs[0].unit in ORD?ORD[b.qs[0].unit]:1e6,i]:[r(),i]};
  var ks=bs.map(function(b,i){return{b:b,k:key(b,i),s:pv.secs?b.s:0}});
  ks.sort(function(x,y){return x.s-y.s||x.k[0]-y.k[0]||x.k[1]-y.k[1]});setBlocks(ks.map(function(x){return x.b}));drawPreview()}
 function moveBlock(from,to,after){var bs=blocksNow(),b=bs[from],t=bs[to];if(!b||!t||from===to||(pv.secs&&b.s!==t.s))return;bs.splice(from,1);var at=bs.indexOf(t)+(after?1:0);bs.splice(at,0,b);setBlocks(bs);drawPreview()}
 s3.querySelector(".pvinfo").addEventListener("change",function(e){var k=e.target.dataset.i;if(!k)return;info[k]=e.target.checked?1:0;try{localStorage.setItem(IKEY,JSON.stringify(info))}catch(x){}drawPreview()});
 s3.querySelector(".pvsort").addEventListener("click",function(e){var b=e.target.closest("button[data-o]");if(b&&pv)sortBy(b.dataset.o)});
 var pool=[],poolSig="",swapBusy=false;
 function keyQ(q){return q.qid?"id:"+q.qid:"t:"+q.q+"|"+q.a}
 /* 候選題也以「題號」為單位（題組整組）；pred(b) 決定要哪一種 */
 function getCand(pred){
  var s0=pvSig;if(poolSig!==s0){pool=[];poolSig=s0}
  function have(b){return b.qs.some(function(c){return pv.qs.some(function(x){return keyQ(x)===keyQ(c)})})}
  function take(){for(var i=0;i<pool.length;i++){var b=pool[i];if(!have(b)&&pred(b)){pool.splice(i,1);return b}}return null}
  var c=take();if(c)return Promise.resolve(c);var tries=0;
  function more(){if(tries++>=3)return Promise.resolve(null);return M.api("GET",qurl(true,curPlan())).then(function(r){if(poolSig===s0)pool=pool.concat(NB.score.blocks(r.qs||[],true));var c=take();return c||more()})}
  return more()}
 function noMore(){popup("找不到更多題目","符合目前範圍與條件、而且還沒出現在這份卷裡的題目已經不多了。可以回上一步放寬條件，或按「重新出題」。")}
 function sameKind(a,b){return(pv.secs?a.s===b.s:true)&&!!a.gid===!!b.gid}
 function swapB(bi,btn){if(swapBusy)return;swapBusy=true;btn.disabled=true;var bs=blocksNow(),b0=bs[bi];
  getCand(function(c){return sameKind(c,b0)}).then(function(c){swapBusy=false;if(!c){btn.disabled=false;noMore();return}c.qs.forEach(function(q){q.s=b0.s});bs[bi]=c;setBlocks(bs);drawPreview()},function(e){swapBusy=false;btn.disabled=false;popup("換題失敗",errMsg(e))})}
 function addB(sec,btn){if(swapBusy)return;swapBusy=true;btn.disabled=true;
  getCand(function(c){return pv.secs?c.s===sec:true}).then(function(c){swapBusy=false;if(!c){btn.disabled=false;noMore();return}var bs=blocksNow(),at=bs.length;if(pv.secs){for(var k=bs.length-1;k>=0;k--){if(bs[k].s===sec){at=k+1;break}}}bs.splice(at,0,c);setBlocks(bs);drawPreview()},function(e){swapBusy=false;btn.disabled=false;popup("新增題目失敗",errMsg(e))})}
 /* 配分表（仿康軒「版面配置」的題型配分）：題數、答數、每題／每答、配分、小計；可以平均配分或智慧配分到滿分 */
 var fullV=100;
 function drawScore(){
  var box=$(".pvscore");box.innerHTML="";if(!pv||!pv.secs)return;
  var st=NB.score.stats(pv.qs,pv.secs,merge()),t=h('<table class="pvst"><tr><th>大題</th><th>題數</th><th>答數</th><th>配分方式</th><th>配分</th><th>小計</th></tr></table>');
  st.forEach(function(x,i){var sc=pv.secs[i];var tr=h("<table><tr><td></td><td>"+x.nq+(x.take?"（選答 "+x.take+"）":"")+"</td><td>"+x.na+'</td><td><select data-k="per"><option value="q"'+(x.per==="q"?" selected":"")+'>每題</option><option value="a"'+(x.per==="a"?" selected":"")+'>每答</option></select></td><td><input data-k="pts" type="number" min="0" max="100" step="0.1" value="'+x.pts+'"> 分</td><td class="sub">'+x.sub+"</td></tr></table>").querySelector("tr");
   tr.firstChild.textContent="第 "+(i+1)+" 大題"+(sc.title?"・"+sc.title:"");tr.dataset.i=i;t.querySelector("tbody").appendChild(tr)});
  t.querySelector("tbody").appendChild(h('<table><tr class="tot"><th>總計</th><th>'+st.reduce(function(a,x){return a+x.nq},0)+"</th><th>"+st.reduce(function(a,x){return a+x.na},0)+'</th><th></th><th></th><th class="tsum">'+NB.score.total(st)+"</th></tr></table>").querySelector("tr"));
  box.appendChild(t);
  var ctl=h('<div class="ctl"><label>滿分<input class="pvfull" type="number" min="1" max="500" step="1" value="'+fullV+'"></label><button type="button" class="pen go" data-a="smart">智慧配分</button><button type="button" class="pen" data-a="even">平均配分</button><span class="meta">「每答」＝題組每個小題、連連看每一組各算一答。這裡改的配分只用在這份卷；回上一步改設定會重新出題。</span></div>');box.appendChild(ctl);
  function sync(full){var st2=NB.score.stats(pv.qs,pv.secs,merge());Array.prototype.forEach.call(t.querySelectorAll("tr[data-i]"),function(tr){tr.querySelector(".sub").textContent=st2[+tr.dataset.i].sub});t.querySelector(".tsum").textContent=NB.score.total(st2);if(full)drawSum()}
  t.addEventListener("input",function(e){var tr=e.target.closest("tr[data-i]");if(!tr||e.target.dataset.k!=="pts")return;pv.secs[+tr.dataset.i].pts=Math.max(0,Math.min(100,Math.round((+e.target.value||0)*10)/10));sync(false)});
  t.addEventListener("change",function(e){var tr=e.target.closest("tr[data-i]");if(!tr)return;var sc=pv.secs[+tr.dataset.i];if(e.target.dataset.k==="per"){sc.per=e.target.value;if(sc.per==="a")sc.take=0;drawScore();drawSum();return}sync(true)});
  ctl.addEventListener("click",function(e){var b=e.target.closest("button[data-a]");if(!b)return;fullV=Math.max(1,+ctl.querySelector(".pvfull").value||100);var st2=NB.score.stats(pv.qs,pv.secs,merge()),res=b.dataset.a==="smart"?NB.score.smart(st2,fullV):NB.score.even(st2,fullV);if(!res)return;res.forEach(function(p,i){if(st2[i].units)pv.secs[i].pts=p});drawScore();drawSum();var tt=ptsTotal();if(Math.abs(tt-fullV)>0.01)popup("總分是 "+tt+" 分","題數和答數的組合沒辦法剛好湊到 "+fullV+" 分（配分到小數一位），已取最接近、不超過滿分的配法。康軒的卷子也常見 99.2 分這種總分；想湊整數可以手動微調某個大題。")})}
 function drawSum(){
  var n=blocksNow().length,st=pv.secs?NB.score.stats(pv.qs,pv.secs,merge()):null,na=st?st.reduce(function(a,x){return a+x.na},0):pv.qs.reduce(function(a,q){return a+NB.score.ansN(q)},0),lack=pv.secs?pv.secs.filter(function(x){return x.got<x.want}).map(function(x){return"第 "+(x.i+1)+" 大題缺 "+(x.want-x.got)+" 題"}):[];
  $(".pvsum").innerHTML="共 <b>"+(merge()?n:pv.qs.length)+"</b> 題"+(na!==(merge()?n:pv.qs.length)?" <b>"+na+"</b> 答":"")+(pv.secs&&ptsTotal()?"・總分 <b>"+ptsTotal()+"</b> 分":"")+"　<span class=\"meta\">不要的題目按「移除」，想換一題按「換題」，想多一題按「＋新增一題」；整份重來按「重新出題」。</span>"+(lack.length?'<div class="fb no">'+esc(lack.join("、"))+"（符合條件的題目不夠，可回上一步放寬題型、類別或難易度）。</div>":"")+(pv.filled&&!pv.secs?'<div class="fb no">你選的範圍不重複的題目不夠，已用"+(SCI?"同冊":"同年級")+"其他單元補了 '+pv.filled+" 題。</div>":"")+(pv.short&&!pv.secs?'<div class="fb no">可出的題目只有 '+pv.qs.length+" 題（想要的比較多）。</div>":"")}
 function qHtml(q){var opts=q.ty==="match"?"　"+q.L.map(function(l,k){return(k+1)+"."+esc(l)}).join("　")+"　／　"+q.R.map(function(r,k){return "("+L(k)+") "+esc(r)}).join("　"):q.o&&q.ty!=="tf"?"<div class=\"pvo\">"+q.o.map(function(o,k){return "("+L(k)+") "+tx(esc(o))}).join("　")+"</div>":"";
  var m=infoOf(q);return(m?'<div class="pvm">'+esc(m)+"</div>":"")+'<div class="pvt">'+tx(esc(q.q))+qimg(q.img)+opts+"</div>"+(showAns?'<div class="pva"><b>答案：</b><span>'+tx(esc(ansOf(q)))+(q.ty==="match"?esc(q.al||""):"")+"</span>"+(q.h?'<br><small>詳解：'+tx(esc(q.h))+"</small>":"")+"</div>":"")}
 var dragFrom=-1;
 function drawPreview(){
  if(!pv)return;var box=$(".pvlist"),bs=blocksNow(),mg=merge();drawSum();drawScore();
  box.innerHTML="";var lastS=-1,no=0;
  bs.forEach(function(b,bi){
   if(pv.secs&&b.s!==lastS){if(lastS>=0)addRow(lastS);lastS=b.s;no=0;var sc=pv.secs[b.s];if(sc)box.appendChild(h('<h4 class="pvsec">第 '+(b.s+1)+" 大題"+(sc.title?"・"+esc(sc.title):"")+"</h4>"))}
   var len=mg?1:b.qs.length,lab=len>1?(no+1)+"～"+(no+len):String(no+1);no+=len;
   var d=h('<div class="pvq" draggable="true" data-drag="1"><div class="pvh"><span class="pvdrag" title="拖曳調整順序" aria-hidden="true">⠿</span><b>'+lab+'</b><span class="pvtag"></span><button type="button" class="pen pv-up" title="往上移" aria-label="往上移">↑</button><button type="button" class="pen pv-dn" title="往下移" aria-label="往下移">↓</button><button type="button" class="pen pv-sw">換題</button><button type="button" class="pen pv-rm">移除</button></div><div class="pvbody"></div></div>');
   d.dataset.b=bi;var bd=d.querySelector(".pvbody");
   if(b.gid&&b.qs[0].gs){d.querySelector(".pvtag").textContent="題組・"+b.qs.length+" 小題";bd.innerHTML='<div class="pvgs">'+tx(esc(b.qs[0].gs))+qimg(b.qs[0].gi)+"</div>"+b.qs.map(function(q,k){return'<div class="pvsub"><span class="psn">('+(k+1)+")</span>"+qHtml(q)+"</div>"}).join("")}
   else bd.innerHTML=qHtml(b.qs[0]);
   d.querySelector(".pv-sw").onclick=function(){swapB(bi,this)};
   d.querySelector(".pv-rm").onclick=function(){if(bs.length<=1){popup("至少要留一題","這是最後一題了，不能再移除。想換一批題目請按「重新出題」。");return}bs.splice(bi,1);setBlocks(bs);drawPreview()};
   d.querySelector(".pv-up").onclick=function(){if(bi>0)moveBlock(bi,bi-1,false)};d.querySelector(".pv-dn").onclick=function(){if(bi<bs.length-1)moveBlock(bi,bi+1,true)};
   d.addEventListener("dragstart",function(e){dragFrom=bi;d.classList.add("drag");try{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(bi))}catch(x){}});
   d.addEventListener("dragend",function(){d.classList.remove("drag");dragFrom=-1;Array.prototype.forEach.call(box.querySelectorAll(".dropb,.dropa"),function(x){x.classList.remove("dropb","dropa")})});
   d.addEventListener("dragover",function(e){if(dragFrom<0||dragFrom===bi||(pv.secs&&bs[dragFrom].s!==b.s))return;e.preventDefault();var r=d.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;d.classList.toggle("dropa",after);d.classList.toggle("dropb",!after)});
   d.addEventListener("dragleave",function(){d.classList.remove("dropa","dropb")});
   d.addEventListener("drop",function(e){if(dragFrom<0)return;e.preventDefault();var after=d.classList.contains("dropa");moveBlock(dragFrom,bi,after)});
   box.appendChild(d)});
  if(pv.secs&&lastS>=0)addRow(lastS);else if(!pv.secs)addRow(0);
  function addRow(sec){var r=h('<div class="pvadd"><button type="button" class="pen go">＋新增一題</button></div>');r.firstChild.onclick=function(){addB(sec,this)};box.appendChild(r)}}
 /* 第 4 步：草稿（還沒有正式出卷，列印時不會輸出） */
 function deps(c){return{u:u,today:M.today(),title:title,tx:tx,qimg:qimg,wm:c&&c.wm,secs:c&&c.secs,qr:!!(c&&c.qr),qrBase:location.origin+location.pathname+(M.subj!=="math"?"?s="+M.subj:"")}}
 function drawDraft(){if(!pv)return;var P=panel.get();PP.applyPage(P);out.className="pdraft";out.innerHTML=PP.build(P,pv.qs,pv.nm,deps(pv))}
 function redrawFinal(){if(!last)return;var P=panel.get();PP.applyPage(P);out.className="";out.innerHTML=PP.build(P,last.qs,last.nm,deps(last));drawRes()}
 /* 第 5 步 */
 function summ(){
  var g=curPlan(),P=panel.get(),L=[],list=PP.list(P);
  L.push("出題方式："+({quick:"快速出題",auto:"電腦出題",manual:"手動出題"})[W.mode]);
  L.push("範圍："+(W.scope==="online"?"線上速測（只用線上題庫）":"紙本出卷（題型較全）")+"・"+(SCI?grades().map(function(g){return gLab(+g)}).join("、")+"・":grades().map(function(g){return"一二三四五六"[g-1]}).join("、")+"年級・"+({a:"上下冊",u:"上冊",d:"下冊"})[val("pw-sem")]+"・")+(val("pw-src")==="pick"?"自選 "+pk.get().length+" 個課次":"整個範圍綜合"));
  L.push("題目："+(pv?(function(){var n=merge()?blocksNow().length:pv.qs.length,na=pv.qs.reduce(function(x,q){return x+NB.score.ansN(q)},0);return n+" 題"+(na!==n?" "+na+" 答":"")})()+(pv.secs&&ptsTotal()?"・總分 "+ptsTotal()+" 分":""):"尚未審題"));
  L.push("紙張："+esc(P.paper)+"・"+({s1:"單欄",d2:"雙欄（直版）",d2s:"雙欄＋中線（直版）",d2l:"雙欄（橫版）"})[P.layout]+"・頁碼："+({kn:"卷別＋頁碼",knt:"卷別＋第N頁／共N頁",n:"只印頁碼",nt:"第N頁／共N頁",off:"不印"})[P.pageNo||"kn"]);
  L.push("輸出："+list.map(function(x){return esc(x.label)}).join("、")+"（共 "+list.length+" 份，每份頁碼各自從 1 開始）");
  $(".pstsum").innerHTML="<b>確認設定</b><ul>"+L.map(function(x){return"<li>"+x+"</li>"}).join("")+"</ul><p class=\"meta\">按「進行出卷」才會正式出卷，並記錄一筆列印紀錄；之後只改版面不會再多記一筆。</p>";
  drawRes()}
 $("#pw-go").onclick=function(){
  if(busy)return;
  if(!pv||pvSig!==sig()){popup("題目要重新審題","範圍或題目設定在審題之後改過了，請回到第 3 步重新審題。",function(){goStep(3)});return}
  var bad=chk(3)||chk(4);if(bad){popup(bad[0],bad[1],function(){goStep(bad[0]==="還沒選輸出卷別"?4:3)});return}
  var key=keyOf();
  if(fresh()){redrawFinal();return}
  busy=true;$("#pw-go").disabled=true;
  var P=panel.get(),srcTag=({quick:"快速出題",auto:"電腦出題",manual:"手動出題"})[W.mode]+(W.scope==="online"?"（線上速測）":"")+":"+grades().join("")+val("pw-sem");
  PP.device().then(function(dv){return M.api("POST","/api/print/commit",{src:srcTag,dev:dv,title:pv.nm,qr:qrWant()?qrPayload():undefined,qs:pv.qs.map(function(q){return{u:q.unit,q:String(q.q).slice(0,80),a:String(q.a).slice(0,30)}})})}).then(function(r){
   busy=false;$("#pw-go").disabled=false;cm={key:key};last={qs:pv.qs.slice(),secs:pv.secs,nm:pv.nm,wm:r.wm,qr:!!r.qr};redrawFinal();out.hidden=false;window.scrollTo(0,$(".pres").getBoundingClientRect().top+window.scrollY-60)},
   function(e){busy=false;$("#pw-go").disabled=false;popup("進行出卷失敗",errMsg(e))})}
 function drawRes(){
  var r=$(".pres");r.innerHTML="";if(!fresh()){return}
  var P=panel.get(),list=PP.list(P);
  r.appendChild(h('<div class="fb">已出卷，卷號 <b>'+esc(last.wm&&last.wm.pid||"")+"</b>。下面每一份都從第 1 頁開始編頁碼。</div>"));
  if(last.qr)r.appendChild(h('<div class="fb">這份卷有 QR code 線上作答（印在題目卷、答案卷右上角）。學生交卷後可以到 <a href="#qr/'+esc(last.wm.pid)+'">線上作答成績</a> 看分數和每題答對率。</div>'));
  var box=h('<div class="pshl"></div>');
  list.forEach(function(x){var row=h('<div class="pshr"><span></span><button type="button" class="pen go">列印這一份</button></div>');row.firstChild.textContent=x.label;row.lastChild.onclick=function(){if(!PP.printSheet(out,x.id))popup("找不到這一份","請重新按「進行出卷」。")};box.appendChild(row)});
  r.appendChild(box);
  var act=h('<div class="ctl"><button type="button" class="pen">全部一起列印（頁碼會接續）</button><button type="button" class="pen">匯出題目 CSV</button><button type="button" class="pen">回到版面配置修改</button><button type="button" class="pen go pv-ppt">下載 PPT（上課檢討用）</button></div>');
  act.children[0].onclick=function(){PP.printSheet(out,"")};act.children[1].onclick=function(){PP.csv(last.qs,deps(last))};act.children[2].onclick=function(){goStep(4)};
  /* PPT：一題一張、下一張是答案與詳解；投影片是圖片，右下角有卷號 */
  act.children[3].onclick=function(){var b=this;if(b.disabled)return;if(!NB.pptx){popup("無法匯出","PPT 匯出元件沒有載入，請重新整理頁面再試。");return}b.disabled=true;var t0=b.textContent;
   NB.pptx.make({qs:last.qs,secs:last.secs,name:(last.nm||"練習卷"),tx:tx,qimg:qimg,pid:last.wm&&last.wm.pid,who:u.name,onStep:function(i,n){b.textContent="製作中… "+i+"／"+n}}).then(function(blob){NB.pptx.save(blob,(last.nm||"練習卷")+"_檢討"+(last.wm&&last.wm.pid?"_"+last.wm.pid:"")+".pptx");b.disabled=false;b.textContent=t0},function(e){b.disabled=false;b.textContent=t0;popup("PPT 匯出失敗","這個瀏覽器沒辦法把題目畫成投影片（建議用電腦版 Chrome 或 Edge）。錯誤："+(e&&e.message||e))})};
  r.appendChild(act)}
 panel.csvBtn.onclick=function(){var c=last||pv;if(c)PP.csv(c.qs,deps(c));else popup("還沒有題目","請先到第 3 步審題。")};
 window.addEventListener("hashchange",function f(){if(!/^#print(\/|$)/.test(location.hash)){PS=null;PP.clearPage();window.removeEventListener("hashchange",f)}});
 filt();layout2();
 var m=/^step([1-5])$/.exec(arg||"");request(m?+m[1]:1)}

/* ---- QR code 線上作答（學生）：#ans/卷號-卷別 ---- */
var ZHV="甲乙丙丁",CNS="一二三四五六七八九十",TYZ={choice:"選擇題",tf:"是非題",num:"填充題",text:"填充題",multi:"勾選題",match:"連連看",group:"題組",any:"綜合題"};
function askBox(ttl,msg,okT,cb,noT){var ov=h('<div class="pkov" role="alertdialog" aria-modal="true"><div class="pkbox pkmsg"><h3></h3><p></p><div class="ctl"><button type="button" class="pen go"></button><button type="button" class="pen"></button></div></div></div>');ov.querySelector("h3").textContent=ttl;ov.querySelector("p").textContent=msg;var b=ov.querySelectorAll("button");b[0].textContent=okT;b[1].textContent=noT||"再檢查一下";b[0].onclick=function(){ov.remove();cb()};b[1].onclick=function(){ov.remove()};document.body.appendChild(ov);b[1].focus()}
function hm(ts){var d=new Date(ts);return(d.getMonth()+1)+"/"+d.getDate()+" "+pad(d.getHours())+":"+pad(d.getMinutes())}
V.ans=function(arg){
 var a=String(arg||""),k=a.lastIndexOf("-"),pid=k>0?a.slice(0,k):a,v=k>0?+a.slice(k+1)||0:0,s=sheet("線上作答","照著紙本卷，把答案填在這裡，按「交卷」就會自動改分");view.appendChild(s);
 var box=h('<div class="ans-wrap"><p class="meta">載入中…</p></div>');s.appendChild(box);
 function result(r,d){
  var u=user();box.innerHTML="";box.appendChild(h('<div class="ans-res"><div class="ans-sc"><b>'+esc(d.score)+"</b> / "+esc(d.total)+' 分</div><p>答對 <b>'+esc(d.c)+"</b>／"+esc(d.n)+" 格"+(d.ts?'　<span class="meta">交卷時間 '+hm(d.ts)+"</span>":"")+"</p></div>"));
  if(d.wrong&&d.wrong.length){var w=h('<div class="ans-wrong"><b>要再訂正的題號：</b></div>');d.wrong.forEach(function(x){w.appendChild(h('<span class="chip">'+esc(x)+"</span>"))});box.appendChild(w)}else box.appendChild(h('<div class="fb">全對，太厲害了！</div>'));
  if(u&&u.role==="student")box.appendChild(h('<p class="meta">答錯的題目已經放進<a href="#wrong">錯題本</a>（勾選題、連連看除外）。這份卷只能交一次，訂正請看紙本卷和老師的檢討。</p>'))}
 M.api("GET","/api/paper?pid="+encodeURIComponent(pid)+"&v="+v).then(function(r){
  s.querySelector("h2").lastChild.textContent=r.title||"線上作答";
  box.innerHTML="";box.appendChild(h('<p class="ans-hd">出卷：'+esc(r.by||"")+(r.nv>1?'　<b class="chip">'+ZHV[r.v]+"卷</b>":"")+'　<span class="meta">卷號 '+esc(r.pid)+"</span></p>"));
  if(r.done){var hd=box.firstChild;result(r,r.done);box.insertBefore(hd,box.firstChild);return}
  if(!r.open){box.appendChild(h('<div class="fb no">老師已經關閉這份卷的線上作答。</div>'));return}
  var ans=r.items.map(function(){return null}),lastS=-2,form=h('<div class="ans-form"></div>');
  r.items.forEach(function(it,i){
   if(it.s!==lastS&&r.secs&&it.s!==null&&r.secs[it.s]){var sc=r.secs[it.s];form.appendChild(h('<h4 class="ans-sec">'+CNS[it.s]+"、"+esc(sc.title||TYZ[sc.ty]||"題目")+"</h4>"))}lastS=it.s;
   var row=h('<div class="ans-row"><b class="ans-lab"></b><div class="ans-ctl"></div></div>'),c=row.lastChild;row.firstChild.textContent=it.lab;
   function pick(btns,multi){btns.forEach(function(b){b.onclick=function(){if(multi){b.classList.toggle("on");ans[i]=btns.filter(function(x){return x.classList.contains("on")}).map(function(x){return x.dataset.v}).join(",")||null}else{btns.forEach(function(x){x.classList.toggle("on",x===b)});ans[i]=b.dataset.v}row.classList.toggle("ok",!!ans[i])}})}
   if(it.ty==="choice"||it.ty==="multi"){var bs=[];for(var k=0;k<Math.max(2,it.n);k++){var b=h('<button type="button" class="pen abtn"></button>');b.textContent="("+L(k)+")";b.dataset.v=L(k);c.appendChild(b);bs.push(b)}pick(bs,it.ty==="multi");if(it.ty==="multi")c.appendChild(h('<small class="meta">可複選</small>'))}
   else if(it.ty==="tf"){var t1=h('<button type="button" class="pen abtn" data-v="對">○ 對</button>'),t2=h('<button type="button" class="pen abtn" data-v="錯">✕ 錯</button>');c.appendChild(t1);c.appendChild(t2);pick([t1,t2],false)}
   else if(it.ty==="match"){ans[i]=[];for(var m=0;m<it.n;m++){(function(m){var l=h('<label class="amatch">'+(m+1)+'．<select><option value="">—</option></select></label>'),se=l.querySelector("select");for(var z=0;z<it.n;z++){var op=document.createElement("option");op.value=L(z);op.textContent="("+L(z)+")";se.appendChild(op)}se.onchange=function(){ans[i][m]=se.value;row.classList.toggle("ok",ans[i].filter(Boolean).length===it.n)};c.appendChild(l)})(m)}}
   else{var inp=h('<input class="num ainp" autocomplete="off" maxlength="40">');if(it.ty==="num"&&!SCI)inp.setAttribute("inputmode","decimal");inp.placeholder=it.ty==="num"?(SCI?"填數值（可加單位，例如 2.7 g/cm³、1.6×10^-19）":"填數字（分數可寫 3/4）"):"填答案";inp.oninput=function(){ans[i]=inp.value.trim()||null;row.classList.toggle("ok",!!ans[i])};c.appendChild(inp)}
   form.appendChild(row)});
  box.appendChild(form);
  var go=h('<div class="ctl ans-go"><button type="button" class="pen go">交卷</button><span class="meta">只能交一次，交卷前請再檢查。</span></div>');box.appendChild(go);
  go.firstChild.onclick=function(){
   var blank=ans.filter(function(x){return x===null||x===""||(Array.isArray(x)&&!x.filter(Boolean).length)}).length;
   function send(){go.firstChild.disabled=true;M.api("POST","/api/paper/submit",{pid:r.pid,v:r.v,ans:ans}).then(function(d){var hd=box.firstChild;result(r,d);box.insertBefore(hd,box.firstChild);window.scrollTo(0,0)},function(e){go.firstChild.disabled=false;if(e&&e.code==="already_done"){location.reload();return}popup("交卷失敗",errMsg(e))})}
   askBox("確定要交卷嗎？",blank?"還有 "+blank+" 格沒有填，交出去就不能再改了。":"交出去就不能再改了。","確定交卷",send)}
 },function(e){box.innerHTML='<div class="fb no">'+esc(errMsg(e))+"</div>"})};

/* ---- QR code 線上作答（老師）：#qr＝我出的卷、#qr/卷號＝成績與每題答對率 ---- */
function qrDel(pid,what,id,done){M.api("POST","/api/paper/delete",{pid:pid,what:what,id:id}).then(done,function(e){popup("刪除失敗",errMsg(e))})}
V.qr=function(arg){
 var u=user();if(!u||u.role!=="teacher"){var s0=sheet("線上作答成績","");s0.appendChild(h('<p>這一頁只有老師可以看。</p>'));view.appendChild(s0);return}
 var s=sheet("線上作答成績",arg?"這份卷的作答情形":"用 QR code 出的卷子"),box=h('<div><p class="meta">載入中…</p></div>');s.appendChild(box);view.appendChild(s);
 if(!arg){M.api("GET","/api/paper/mine").then(function(r){box.innerHTML="";
  if(!r.on)box.appendChild(h('<div class="fb no">QR code 線上作答的總開關目前是關的，學生掃描後不能作答。管理員可以到老師後台「遊戲設定」打開。</div>'));
  if(!r.rows.length){box.appendChild(h('<p>還沒有用 QR code 出過卷。到「列印練習卷」第 4 步勾選「印 QR code 線上作答」，進行出卷後就會出現在這裡。</p>'));return}
  var t=h('<table class="pvst qrt"><tr><th>出卷時間</th><th>卷名</th><th>卷號</th><th>交卷人數</th><th>狀態</th><th></th></tr></table>');
  r.rows.forEach(function(x){var tr=h("<table><tr><td>"+hm(x.ts)+"</td><td>"+esc(x.title||"")+(u.admin&&x.name?'<br><small class="meta">'+esc(x.name)+"</small>":"")+"</td><td>"+esc(x.pid)+"</td><td>"+x.subs+"</td><td>"+(x.open?"開放作答":"已關閉")+'</td><td><a class="pen" href="#qr/'+esc(x.pid)+'">看成績</a>'+(u.admin?' <button type="button" class="pen qdel">刪除</button>':"")+"</td></tr></table>").querySelector("tr");
   if(u.admin)tr.querySelector(".qdel").onclick=function(){askBox("刪除這份卷？","卷號 "+x.pid+" 的 "+x.subs+" 筆作答會一起刪掉，紙本上的 QR code 之後也掃不到了。這個動作不能復原。","刪除",function(){qrDel(x.pid,"paper","",route)},"取消")};
   t.querySelector("tbody").appendChild(tr)});box.appendChild(t);box.appendChild(h('<p class="meta">'+(r.purge?"超過 "+r.purge+" 天的 QR 卷和作答會自動清除（管理員可在「設定」改成不自動清除）。":"目前設定為不自動清除，只能由管理員手動刪除。")+(u.admin?"刪除作答不會動到學生錯題本裡已經放進去的題目。":"要刪除作答請找管理員。")+"</p>"))},function(e){box.innerHTML='<div class="fb no">'+esc(errMsg(e))+"</div>"});return}
 function load(){M.api("GET","/api/paper/results?pid="+encodeURIComponent(arg)).then(function(r){box.innerHTML="";
  var n=r.subs.length,avg=n?Math.round(r.subs.reduce(function(a,x){return a+x.score},0)/n*10)/10:0,tot=n?r.subs[0].total:"";
  box.appendChild(h('<p><b>'+esc(r.title||"")+'</b>　<span class="meta">卷號 '+esc(r.pid)+"・"+hm(r.ts)+"出卷</span></p>"));
  box.appendChild(h('<div class="tiles qrsum"><div class="tile"><b>'+n+'</b><small>交卷人數</small></div><div class="tile"><b>'+(n?avg:"—")+'</b><small>平均分數'+(tot!==""?"（滿分 "+tot+"）":"")+'</small></div><div class="tile"><b>'+(r.open?"開放中":"已關閉")+"</b><small>線上作答</small></div></div>"));
  var ctl=h('<div class="ctl"><button type="button" class="pen go"></button><button type="button" class="pen">重新整理</button><a class="pen" href="#qr">回到清單</a>'+(u.admin?'<button type="button" class="pen qclr">清空所有作答</button><button type="button" class="pen qdelp">刪除這份卷</button>':"")+'</div>');
  if(u.admin)ctl.querySelector(".qclr").onclick=function(){if(!n){popup("沒有作答","這份卷還沒有人交卷。");return}askBox("清空所有作答？",n+" 位學生的作答和分數會刪掉，學生可以重新作答（卷子保留、QR code 照樣能用）。這個動作不能復原。","清空",function(){qrDel(r.pid,"subs","",load)},"取消")};
  if(u.admin)ctl.querySelector(".qdelp").onclick=function(){askBox("刪除這份卷？","這份卷和 "+n+" 筆作答會一起刪掉，紙本上的 QR code 之後也掃不到了。這個動作不能復原。","刪除",function(){qrDel(r.pid,"paper","",function(){location.hash="#qr"})},"取消")};ctl.children[0].textContent=r.open?"關閉作答（不再收卷）":"重新開放作答";
  ctl.children[0].onclick=function(){M.api("POST","/api/paper/open",{pid:r.pid,open:!r.open}).then(load,function(e){popup("失敗",errMsg(e))})};ctl.children[1].onclick=load;box.appendChild(ctl);
  if(n){var t=h('<table class="pvst"><tr><th>班級</th><th>座號</th><th>姓名</th>'+(r.nv>1?"<th>卷別</th>":"")+"<th>分數</th><th>答對</th><th>交卷時間</th>"+(u.admin?"<th></th>":"")+"</tr></table>");
   r.subs.forEach(function(x){t.querySelector("tbody").appendChild(h("<table><tr><td>"+esc(x.cls||"")+"</td><td>"+(x.role==="student"?esc(x.no):"老師")+"</td><td>"+esc(x.name||"")+"</td>"+(r.nv>1?"<td>"+ZHV[x.v]+"</td>":"")+"<td><b>"+esc(x.score)+"</b></td><td>"+x.c+"／"+x.n+"</td><td>"+hm(x.ts)+"</td>"+(u.admin?'<td><button type="button" class="pen qsub">刪除（可重交）</button></td>':"")+"</tr></table>").querySelector("tr"));
    if(u.admin)t.querySelector("tbody").lastChild.querySelector(".qsub").onclick=function(){askBox("刪除 "+(x.name||"")+" 的作答？","刪掉後這位學生可以重新掃描作答。這個動作不能復原。","刪除",function(){qrDel(r.pid,"sub",x.id,load)},"取消")}});
   box.appendChild(h("<h4>學生成績</h4>"));box.appendChild(t);
   var it=h('<table class="pvst qrrate"><tr><th>題號</th><th>題型</th><th>題目</th><th>答對率</th></tr></table>');
   r.items.forEach(function(x){var p=x.of?Math.round(x.ok/x.of*100):0;it.querySelector("tbody").appendChild(h("<table><tr><td>"+esc(x.lab)+"</td><td>"+(TYZ[x.ty]||"")+'</td><td class="qtx"></td><td><span class="rbar"><i style="width:'+p+'%"></i></span> '+p+"%（"+x.ok+"／"+x.of+"）</td></tr></table>").querySelector("tr"));it.querySelector("tbody").lastChild.querySelector(".qtx").innerHTML=tx(esc(x.q))});
   box.appendChild(h('<h4>每題答對率</h4>'));box.appendChild(it);box.appendChild(h('<p class="meta">題號是甲卷（第一份）的題號；乙丙丁卷的作答已經對回同一題。答對率低的題目可以優先檢討。</p>'))}
  else box.appendChild(h('<p class="meta">還沒有人交卷。學生用手機掃描卷子右上角的 QR code，登入後就能作答。</p>'))},function(e){box.innerHTML='<div class="fb no">'+esc(errMsg(e))+"</div>"})}
 load()};

V.expired=function(){
 var a=M.acct||{},u=user();
 if(u&&u.role==="teacher"){var t=sheet("使用期限已到期","老師功能暫停");t.appendChild(h("<p>你的老師帳號使用期限已於 <b>"+esc(a.expires||"")+"</b> 到期。目前只能查看首頁、學習進度與勳章；出卷、派卷、老師後台等功能需要管理員延長期限後才能使用。</p><p>請聯絡管理員延長使用期限，延長後重新整理頁面就能繼續使用。</p>"));t.appendChild(h('<div class="ctl"><button class="pen go" onclick="location.reload()">已延長，重新整理</button><a class="pen" href="#home">回首頁</a></div>'));view.appendChild(t);return}
 var s=sheet("授權已到期","正式學員功能暫停");s.appendChild(h("<p>你的正式學員授權已於 <b>"+esc(a.expires||"")+"</b> 到期。目前只能查看自己的首頁、學習進度與勳章；小測驗、模擬卷、錯題本、列印與排行榜需要老師延長授權後才能使用。</p>"));
 s.appendChild(h('<div class="ctl"><a class="pen go" href="#home">回首頁</a><a class="pen" href="#progress">學習進度</a></div>'));view.appendChild(s)};

window.addEventListener("hashchange",route);route();
})();
