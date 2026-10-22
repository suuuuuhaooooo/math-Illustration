/* 學員專區（畫面）：登入、首頁、每日一題、單元小測驗、模擬卷、錯題本、學習進度、貼紙、排行榜、列印練習卷
   題目、判分、積分都由伺服器處理（見 member.js）；這裡只負責顯示與收集答案。 */
(function(){
"use strict";
var M=NB.member,app=document.getElementById("app"),h=NB.h,tx=NB.tx,view,who,TM=null,XG=null,qg=null,booted=false;
var TABS=[["home","首頁"],["daily","每日一題"],["quiz","單元小測驗"],["assign","待測清單"],["mock","模擬卷"],["wrong","錯題本"],["progress","學習進度"],["stickers","勳章"],["board","排行榜"],["print","列印練習卷"]];
function pad(n){return("0"+n).slice(-2)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function sheet(tag,sub){return h('<section class="sheet"><h2><span class="tag">'+tag+'</span>'+(sub||"")+'</h2></section>')}
function title(id){var o=NB.flat.filter(function(x){return x.id===id})[0];return o?o.sem+" "+o.num+" "+o.title:id}
var TC=["#b87333","#9aa5b1","#d9a93c","#5fb6c9","#8e6bd6"],TN=["銅","銀","金","白金","鑽石"];
function stkSvg(s,i,on){var t=(s.t||1)-1,c=TC[t],pips="",k;for(k=0;k<=t;k++)pips+='<circle cx="'+(32-t*4+k*8)+'" cy="58" r="2" fill="'+(on?c:"var(--soft)")+'"/>';
 return'<svg viewBox="0 0 64 64" class="stk" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="'+(on?c:"var(--paper2)")+'" fill-opacity="'+(on?.28:1)+'" stroke="'+(on?c:"var(--ink)")+'" stroke-width="'+(on?3.4:2.4)+'"'+(on?"":' stroke-dasharray="4 4"')+'/><circle cx="32" cy="32" r="23" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 4" opacity=".5"/><g transform="translate(17 14) scale(1.2)" fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'+(on?"":' opacity=".28"')+'><path d="'+s.g+'"/></g>'+pips+'</svg>'}
/* Firebase 登入錯誤 → 看得懂的說明（一定把代碼附上，方便回報） */
function authMsg(c){var m={"auth/popup-closed-by-user":"登入視窗被關閉了，再按一次登入。","auth/network-request-failed":"網路不穩，連不上 Google 登入服務，請檢查網路後再試。","auth/unauthorized-domain":"這個網址還沒加進 Firebase 的「授權網域」，請老師到 Firebase 設定。","auth/popup-blocked":"瀏覽器擋掉了登入視窗，請允許這個網站的彈出視窗後再試。","auth/operation-not-supported-in-this-environment":"這個瀏覽器不支援 Google 登入，請改用 Chrome 或 Safari 開啟。","auth/web-storage-unsupported":"瀏覽器關閉了網站儲存功能（或無痕模式限制），請改用一般視窗，並允許 Cookie。","auth/internal-error":"登入服務發生內部錯誤，請稍後再試。","auth/user-disabled":"這個 Google 帳號已被停用。"}[c];return(m||"登入沒有成功，請再試一次。")+(c?"（"+c+"）":"")}
function errMsg(e){var c=e&&e.code;return{print_limit:"今天出的練習卷已經到上限了，明天再來，或請老師調整。",net:"連不上伺服器，請檢查網路後再試一次。",noapi:"網站還沒設定好伺服器網址，請老師完成設定。",bad_token:"登入已失效，請重新整理頁面再登入。",not_in_roster:"這個帳號不在班級名單裡。",no_session:"這份題目已經失效，請重新開始。",already_done:"這份題目已經交過了。",already_answered:"這題已經送出了。",expired:"你的正式學員授權已到期，請找老師延期。",forbidden:"沒有權限。",no_questions:"這個範圍（或篩選條件）沒有可以出的題目。",closed:"這份卷子已經截止了。",not_found:"找不到這份卷子，可能已被老師刪除。",server:"伺服器忙碌中，請稍後再試。"}[c]||"發生了一點問題（"+(c||"未知")+"），請再試一次。"}
function qimg(p,c){return p?'<img class="qimg'+(c?" "+c:"")+'" alt="附圖" src="'+esc(M.img(p))+'">':""}

function L(i){return String.fromCharCode(65+i)}
function labOf(o,v){var k=o?o.indexOf(String(v)):-1;return k>=0?L(k)+"．"+v:v}
/* 單元多選器：不選＝由系統依年級自動配；可依年級展開勾選 */
function picker(ids,mine){
 var el=h('<details class="upick"><summary>自選單元（<b class="cnt">0</b> 個）</summary><div class="ctl"><button class="pen" data-a="all">全選</button><button class="pen" data-a="none">全不選</button><button class="pen" data-a="mine">只選我的年級</button></div><div class="ug"></div></details>'),g=el.querySelector(".ug"),boxes=[];
 var by={};ids.forEach(function(id){var o=NB.flat.filter(function(x){return x.id===id})[0];if(!o)return;(by[id[0]]=by[id[0]]||[]).push(o)});
 Object.keys(by).sort().forEach(function(gr){var d=h('<div class="ugr"><b>'+"一二三四五六"[gr-1]+"年級</b></div>");by[gr].forEach(function(o){var l=h('<label class="uck"><input type="checkbox"> <span></span></label>');l.querySelector("input").value=o.id;l.querySelector("span").textContent=o.sem+" "+o.num+" "+o.title;boxes.push(l.querySelector("input"));d.appendChild(l)});g.appendChild(d)});
 function cnt(){el.querySelector(".cnt").textContent=boxes.filter(function(b){return b.checked}).length}
 el.addEventListener("change",cnt);
 el.querySelector(".ctl").onclick=function(e){var b=e.target.closest("button");if(!b)return;boxes.forEach(function(x){x.checked=b.dataset.a==="all"||(b.dataset.a==="mine"&&x.value[0]==String(mine))});cnt()};
 return{el:el,get:function(){return boxes.filter(function(b){return b.checked}).map(function(b){return b.value})}}}
function user(){return M.U}
function ymdT(){return M.T||M.today()}

/* ---- 外框與路由 ---- */
function shell(){
 app.innerHTML="";var bar=h('<nav class="bar"><a class="back" href="index.html">← 回到目錄</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);app.appendChild(h('<div class="ruler"></div>'));
 app.appendChild(h('<h1 class="title"><mark>學員專區</mark></h1>'));
 var u=user();if(!u){login();return false}
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
function route(){clearInterval(TM);if(XG){XG();XG=null}if(!booted){boot();return}if(!shell())return;var p=(location.hash||"#home").slice(1).split("/");if(M.acct&&M.acct.expired&&["home","progress","stickers"].indexOf(p[0])<0)p=["expired"];(V[p[0]]||V.home)(p[1]);window.scrollTo(0,0)}

function login(){
 try{if(sessionStorage.getItem("nb-idle")){sessionStorage.removeItem("nb-idle");setTimeout(function(){var f=document.querySelector(".fb");if(f){f.className="fb no";f.textContent="因為閒置太久，已為了帳號安全自動登出，請重新登入。"}},0)}}catch(e){}
 var s=sheet("登入","僅供班內學員使用"),fb=h('<div class="fb"></div>'),em=M.auth&&M.auth.user()?M.auth.user().email:"";
 s.appendChild(h("<p>請使用老師登記的 Google 帳號登入平台。登入後，即可使用小測驗、模擬卷、錯題本、學習進度、貼紙獎勵、每日一題、列印練習卷及排行榜等功能。上述功能皆須登入後方可使用。</p>"));
 s.appendChild(h('<p class="meta">登入即表示你已閱讀並同意<a href="terms.html" target="_blank" rel="noopener">使用者條款</a>與<a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a>。未滿 18 歲請家長或監護人一起閱讀。</p>'));
 var msg={noconfig:"網站還沒設定好登入功能，請老師完成設定。",noauth:"登入服務載入失敗，請檢查網路後重新整理頁面。",net:"連不上伺服器，請稍後再試。",noapi:"網站還沒設定好伺服器網址，請老師完成設定。",bad_token:"登入已失效，請重新登入。",not_in_roster:"「"+esc(em)+"」不在班級名單裡。請改用老師登記的帳號，或請老師把這個帳號加進名單。"}[M.err];
 if(!msg&&M.err)msg=(M.auth&&M.auth.user()?"Google 登入成功了，但載入學員資料時出了問題":"登入沒有完成")+"（錯誤代碼："+esc(M.err)+"）。請按「重新載入」再試一次；還是不行，請把這個代碼告訴老師。";
 if(!msg&&window.__nbAuthErr)msg=authMsg(window.__nbAuthErr);
 if(msg){fb.className="fb no";fb.innerHTML=msg}
 if(/Line\/|FBAN|FBAV|Instagram|MicroMessenger|; wv\)/i.test(navigator.userAgent)){var w=h('<div class="fb no">你正在 App 內建瀏覽器裡，Google 登入常會被擋住。請點右上角「⋯」選「用瀏覽器開啟」（Chrome／Safari），或 <button class="pen">複製網址</button> 貼到瀏覽器。</div>');w.querySelector("button").onclick=function(){var u=location.href.split("#")[0];(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){w.querySelector("button").textContent="已複製"},function(){prompt("請複製這個網址：",u)})};s.appendChild(w)}
 var bar=h('<div class="ctl"></div>');
 if(M.err==="not_in_roster"||M.err==="bad_token"){var o=h('<button class="pen go">換一個帳號登入</button>');o.onclick=function(){M.logout().then(function(){M.err=null;booted=false;route()})};bar.appendChild(o)}
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
 if(exam){var clock=h('<span class="clock"></span>');box.querySelector("h2").appendChild(clock);var t0=Date.now();TM=setInterval(tick,1000);tick();if(XG)XG();XG=NB.xg?NB.xg.start({sid:S.sid,lw:S.lw,user:user(),api:M.api,box:box}):null}
 function tick(){left=S.seconds-Math.floor((Date.now()-t0)/1000);if(left<0)left=0;clock.textContent="剩 "+pad(Math.floor(left/60))+":"+pad(left%60);if(left<=0)finish()}
 function show(){
  var q=qs[i],sel=null,done=false,ob=[],inp,hb,d=h('<div><div class="prog">第 '+(i+1)+" / "+qs.length+' 題</div><div class="q">'+tx(q.q)+"</div>"+qimg(q.img)+"</div>");body.innerHTML="";
  if(q.o){var w=h('<div class="opts"></div>');q.o.forEach(function(t,ti){var b=h('<button class="pen opt"></button>');b.innerHTML="<b>"+L(ti)+"．</b>"+tx(esc(t));b.dataset.v=t;b.onclick=function(){if(done)return;sel=t;ob.forEach(function(x){x.classList.toggle("sel",x===b)})};ob.push(b);w.appendChild(b)});d.appendChild(w)}
  else if(q.t==="text"){var c=h('<div class="ctl"><input class="num txt" type="text" maxlength="60" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="輸入答案"></div>');inp=c.firstChild;d.appendChild(c)}
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
    fb.innerHTML=r.ok?"答對了！":tx("答案是 "+(r.al?r.al+"．":"")+r.a+"。"+r.h)+(r.diag?'<br><b class="diag">'+tx(r.diag)+"</b>":"")+qimg(r.himg)+"<br><small>"+(S.kind==="fix"?"還沒訂正成功，會留在錯題本。":"這題已放進錯題本。")+"</small>"
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
  if(exam&&r.review&&r.review.length){var l=h('<div><p class="meta">答錯或沒寫的題目（已放進錯題本）</p></div>');r.review.forEach(function(x){l.appendChild(h('<div class="wi"><div>'+tx(x.q)+"</div>"+qimg(x.img)+"<small>"+(x.v===null||x.v===""?"你沒有作答。":tx("你的答案："+labOf(x.o,x.v)+"。"))+" "+tx("答案："+labOf(x.o,x.a)+"。"+x.h)+(x.diag?'<br><b class="diag">'+tx(x.diag)+"</b>":"")+qimg(x.himg)+"</small></div>"))});s.appendChild(l)}
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
 var a=M.acct||{};if(a.expired)view.appendChild(h('<div class="fb no">你的正式學員授權已到期（'+esc(a.expires)+'），目前只能查看資料。請找老師延長授權。</div>'));else if(a.daysLeft!==null&&a.daysLeft!==undefined&&a.daysLeft<=14)view.appendChild(h('<div class="fb">提醒：你的授權將在 '+(a.daysLeft+1)+' 天內到期（'+esc(a.expires)+'），要續用請告訴老師。</div>'));
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
 var u=user(),CN="一二三四五六七八九十";if(qg===null)qg=Math.min(6,Math.max(1,u.grade));
 var tabs=h('<div class="tabs"></div>');[1,2,3,4,5,6].forEach(function(g){var b=h('<button class="pen'+(qg===g?" on":"")+'">'+"一二三四五六"[g-1]+"年級</button>");b.onclick=function(){qg=g;view.innerHTML="";V.quiz()};tabs.appendChild(b)});view.appendChild(tabs);
 NB.cat.filter(function(S){return S.grade===qg}).forEach(function(S,k){
  var d=h('<details class="sheet"><summary><span class="tag">'+S.sem+"</span></summary></details>");
  S.chs.forEach(function(c){d.appendChild(h('<div class="chap"><span class="no">第'+CN[c.no-1]+'章</span><b>'+esc(c.name)+'</b><span class="dots"></span></div>'));var ul=h('<div class="secs"></div>');
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
   var info=a.n+" 題・限時 "+a.mins+" 分鐘"+(a.due?"・截止 "+ymd(a.due):""),st={new:"還沒寫",open:"作答中（可以繼續）",done:a.late?"已交（逾時，沒有計分）":"已完成："+a.sc+" 分（答對 "+a.c+" / "+a.n+"）",closed:"已截止"}[a.st],
   row=h('<div class="wi"><div><b>'+esc(a.title)+"</b></div><small>"+esc(info)+"</small><div class=\"meta\">"+esc(st)+"</div></div>");
   if(a.st==="new"||a.st==="open"){var b=h('<button class="pen go">'+(a.st==="open"?"繼續作答":"開始作答")+"</button>");b.onclick=function(){if(a.st==="new"&&!confirm("開始後就會計時（"+a.mins+" 分鐘），而且只能作答一次。確定開始？"))return;
    begin({kind:"assign",id:a.id},function(r){var note=[];if(r.resumed)note.push("接續上次還沒交的卷子。");if(r.short)note.push("可出的題目不足，這份只有 "+r.qs.length+" 題。");run({tag:"派卷",title:r.title||a.title,sess:r,note:note.join(" ")})})};row.appendChild(h('<div class="ctl"></div>')).appendChild(b)}
   box.appendChild(row)})},function(e){box.textContent=errMsg(e)})}
 load()};

V.mock=function(){
 var u=user(),D=M.D,s=sheet("模擬卷","自選單元與題數・每題 2 分鐘・交卷才公布答案"),gr="一二三四五六"[Math.min(6,Math.max(1,u.grade))-1];
 s.appendChild(h("<p>不選單元時，依照「由易到難、題型分配」的細目表，從"+gr+"年級和前一年級的題庫出題；也可以自己挑想考的單元（可多可少）。每個人的題目和選項順序都不同。時間由伺服器計算，時間到會自動交卷，沒寫的算錯，答錯的題目會進錯題本。</p>"));
 var n=h('<div class="ctl"><label>題數</label><select id="mn"><option>5</option><option selected>10</option><option>15</option><option>20</option><option>30</option></select><span class="meta" id="mt"></span></div>'),pk=picker(M.units||[],u.grade);
 s.appendChild(n);s.appendChild(pk.el);
 var nn=n.querySelector("#mn");function tm(){n.querySelector("#mt").textContent="限時 "+(+nn.value*2)+" 分鐘"}nn.onchange=tm;tm();
 var b=h('<div class="ctl"><button class="pen go">開始作答</button></div>');b.firstChild.onclick=function(){start()};s.appendChild(b);
 if(D.mk.length)s.appendChild(h('<p class="meta">最近成績：'+D.mk.slice(-5).map(function(m){return m.sc+" 分"}).join("、")+"</p>"));view.appendChild(s);
 function start(){begin({kind:"mock",n:+nn.value,units:pk.get()},function(r){
  if(r.empty){view.innerHTML="";var e=sheet("沒有題目","");e.appendChild(h('<p>這個範圍目前沒有題目。</p><a class="pen go" href="#mock">重新選擇</a>'));view.appendChild(e);return}
  var note=[];if(r.filled)note.push("你選的單元題目不夠多，已用同年級其他單元補了 "+r.filled+" 題。");if(r.short)note.push("可出的題目不足，這份只有 "+r.qs.length+" 題。");if(r.small)note.push("題數少於 8 題的練習不計入模擬卷獎勵與勳章。");
  run({tag:"模擬卷",title:"請在時間內完成",sess:r,note:note.join(" "),again:start})})}};


/* 篩選列：年級、學期，以及各頁自己的選項；回傳 {el, val()} */
function fbar(parts,onchg){var el=h('<div class="fbar"></div>'),sel={};parts.forEach(function(p){var lb=h("<label>"+p.l+" </label>"),se=h("<select></select>");p.o.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];se.appendChild(op)});se.onchange=function(){onchg()};lb.appendChild(se);el.appendChild(lb);sel[p.k]=se});return{el:el,val:function(k){return sel[k].value},set:function(k,v){sel[k].value=v}}}
var GRADE_OPT=[["","全部年級"],["1","一年級"],["2","二年級"],["3","三年級"],["4","四年級"],["5","五年級"],["6","六年級"]],SEM_OPT=[["","上下學期"],["u","上學期"],["d","下學期"]];
function gsOk(id,g,m){id=String(id);return(!g||id.charAt(0)===g)&&(!m||id.charAt(1)===m)}
V.wrong=function(){
 var D=M.D,s=sheet("錯題本",D.wr.length+" 題");view.appendChild(s);
 if(!D.wr.length){s.appendChild(h("<p>目前沒有錯題，真棒！</p>"));return}
 var due=D.wr.filter(function(w){return!w.due||w.due<=ymdT()}).length;s.appendChild(h("<p>每一題要在 "+M.cfg.review.join("、")+" 天後各答對一次才會畢業（間隔複習，記得最牢），還能拿積分。今天該複習 <b>"+due+"</b> 題。</p>"));
 var b=h('<div class="ctl"><button class="pen go">開始訂正（最多 10 題）</button></div>');b.firstChild.onclick=function(){fix()};if(!due)b.firstChild.textContent="今天沒有要複習的題目";s.appendChild(b);
 var units=[],seen={};D.wr.forEach(function(w){if(!seen[w.id]){seen[w.id]=1;units.push(w.id)}});units.sort();
 var F=fbar([{k:"g",l:"年級",o:GRADE_OPT},{k:"m",l:"學期",o:SEM_OPT},{k:"u",l:"單元",o:[["","全部單元"]]},{k:"st",l:"狀態",o:[["","全部"],["due","今天可複習"],["wait","還沒到複習日"],["hard","錯 2 次以上"]]}],draw);
 s.appendChild(F.el);var cnt=h('<p class="meta"></p>');s.appendChild(cnt);
 var sbx=h('<div class="sbox"></div>');s.appendChild(sbx);
 function unitOpts(){var se=F.el.querySelectorAll("select")[2],cur=se.value;se.innerHTML="";var o0=document.createElement("option");o0.value="";o0.textContent="全部單元";se.appendChild(o0);units.filter(function(id){return gsOk(id,F.val("g"),F.val("m"))}).forEach(function(id){var o=document.createElement("option");o.value=id;o.textContent=title(id);se.appendChild(o)});se.value=cur;if(se.value!==cur)se.value=""}
 F.el.querySelectorAll("select")[0].onchange=F.el.querySelectorAll("select")[1].onchange=function(){unitOpts();draw()};
 function draw(){sbx.innerHTML="";var t=ymdT(),n=0;
  D.wr.slice().reverse().forEach(function(w){var isDue=!w.due||w.due<=t;
   if(!gsOk(w.id,F.val("g"),F.val("m")))return;if(F.val("u")&&w.id!==F.val("u"))return;
   var st=F.val("st");if(st==="due"&&!isDue)return;if(st==="wait"&&isDue)return;if(st==="hard"&&!(w.n>=2))return;n++;
   var d=h('<div class="wi"><div>'+tx(w.q)+"</div>"+qimg(w.img)+"<small>"+esc(title(w.id))+"・錯 "+w.n+" 次・已通過 "+(w.ok||0)+"/"+M.cfg.review.length+"・"+(isDue?"今天可複習":w.due.slice(5)+" 再複習")+"　</small></div>"),dt=h("<details><summary>看答案</summary></details>");dt.appendChild(h("<div>"+tx("答案："+w.a+"。"+(w.h||""))+"</div>"));d.appendChild(dt);sbx.appendChild(d)});
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
 s.appendChild(h('<p class="meta">各單元答對率</p>'));var ks=Object.keys(D.u).filter(function(k){return D.u[k].n}).sort();
 if(!ks.length)s.appendChild(h("<p>還沒有作答紀錄，去做一份小測驗吧。</p>"));
 var ubx=h('<div class="sbox"></div>'),PF=null;
 if(ks.length){PF=fbar([{k:"g",l:"年級",o:GRADE_OPT},{k:"m",l:"學期",o:SEM_OPT},{k:"o",l:"排序",o:[["id","單元順序"],["low","答對率由低到高"],["many","答題數由多到少"]]},{k:"w",l:"顯示",o:[["","全部"],["weak","待加強（低於 70%）"],["good","很穩（90% 以上）"]]}],drawU);s.appendChild(PF.el);s.appendChild(ubx)}
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
 M.STK.forEach(function(k){if(cats.indexOf(k.cat)<0)cats.push(k.cat)});
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
  box.innerHTML='<table class="tb"><tr><th>名次</th><th>同學</th><th>等級</th><th>積分</th><th>答對</th><th>勳章</th></tr>'+rows.map(function(x,i){return'<tr class="'+(x.no===u.no?"me":"")+'"><td><span class="rk r'+(i+1)+'">'+(i+1)+"</span></td><td>"+esc(x.n)+"</td><td>Lv."+x.lv+"</td><td>"+x.pts+"</td><td>"+x.ok+"</td><td>"+x.stk+"</td></tr>"}).join("")+"</table>"})
 .catch(function(e){box.textContent=errMsg(e)})};

V.print=function(){
 var u=user(),D=M.D,s=sheet("列印練習卷","選好單元與題數就可以印出來寫");s.classList.add("noprint");
 var src='<select id="ps"><option value="mix">本年級綜合</option>'+(D.wr.length?'<option value="wrong">我的錯題（'+D.wr.length+" 題）</option>":"")+'<option value="pick">自選單元（下方勾選）</option></select>';
 var ctl=h('<div class="ctl"><label>題目來源</label>'+src+'<label>題數</label><select id="pn"><option>5</option><option>10</option><option selected>15</option><option>20</option><option>30</option><option>40</option></select>'+(u.role==="teacher"?'<label>年級</label><select id="pg"><option value="1">一年級</option><option value="2">二年級</option><option value="3">三年級</option><option value="4">四年級</option><option value="5">五年級</option><option value="6" selected>六年級</option></select>':"")+'<button class="pen go">出題</button><button class="pen">列印</button></div>');
 var pk=picker((M.gens||[]).slice().sort(),u.grade),out=h("<div></div>"),note=h('<p class="meta noprint"></p>'),last=null,PP=NB.pp;
 var panel=PP.panel(u,redraw);s.appendChild(ctl);s.appendChild(pk.el);s.appendChild(panel.el);view.appendChild(s);view.appendChild(note);view.appendChild(out);
 var bs=ctl.querySelectorAll("button");bs[0].onclick=make;bs[1].onclick=function(){if(!last)return make();redraw();window.print()};
 panel.csvBtn.onclick=function(){if(last)PP.csv(last.qs,deps());else note.textContent="請先按「出題」。"};
 pk.el.addEventListener("change",function(){if(pk.get().length)ctl.querySelector("#ps").value="pick"});
 var stopG=PP.guard(out,function(){return !!(last&&last.wm&&last.wm.force)},function(){redraw()});
 window.addEventListener("hashchange",function f(){if(location.hash!=="#print"){PP.clearPage();stopG();window.removeEventListener("hashchange",f)}});
 function fq(P){var o="";if(v0()==="wrong")return o;if(P.fd&&P.fd.length)o+="&d="+encodeURIComponent(P.fd.join(","));if(P.fg&&P.fg.length)o+="&cg="+encodeURIComponent(P.fg.join(","));if(P.fk)o+="&kw="+encodeURIComponent(P.fk);if(P.fp)o+="&pf="+encodeURIComponent(P.fp);return o}
 function v0(){return ctl.querySelector("#ps").value}
 function deps(){return{u:u,today:M.today(),title:title,tx:tx,qimg:qimg,wm:last&&last.wm}}
 function redraw(){if(!last)return;var P=panel.get();PP.applyPage(P);out.innerHTML=PP.build(P,last.qs,last.nm,deps())}
 make();
 function make(){
  var v=ctl.querySelector("#ps").value,n=+ctl.querySelector("#pn").value,us=pk.get();if(v==="pick"&&!us.length){out.innerHTML='<div class="fb no">請先在下面勾選至少一個單元。</div>';return}
  out.innerHTML='<p class="meta">出題中…</p>';note.textContent="";
  PP.device().then(function(dv){return M.api("GET","/api/print?src="+(v==="pick"?"mix&units="+encodeURIComponent(us.join(",")):encodeURIComponent(v))+"&n="+n+(ctl.querySelector("#pg")?"&g="+ctl.querySelector("#pg").value:"")+fq(panel.get())+"&dev="+encodeURIComponent(JSON.stringify(dv)))}).then(function(r){
   var nm=v==="wrong"?"錯題重練":v==="mix"?"綜合練習":"自選 "+us.length+" 個單元",qs=r.qs;
   if(r.filled)note.textContent="你選的單元不重複的題目不夠，已用同年級其他單元補了 "+r.filled+" 題。";if(r.short)note.textContent+=(fq(panel.get())?" 符合篩選條件的題目只有 "+qs.length+" 題（只會從已有屬性的固定題挑；可放寬條件，或請管理員匯入屬性表）。":" 可出的題目只有 "+qs.length+" 題。");
   last={qs:qs,nm:nm,wm:r.wm};redraw()},
   function(e){out.innerHTML='<div class="fb no">'+esc(errMsg(e))+"</div>"})}};

V.expired=function(){
 var a=M.acct||{},s=sheet("授權已到期","正式學員功能暫停");s.appendChild(h("<p>你的正式學員授權已於 <b>"+esc(a.expires||"")+"</b> 到期。目前只能查看自己的首頁、學習進度與勳章；小測驗、模擬卷、錯題本、列印與排行榜需要老師延長授權後才能使用。</p>"));
 s.appendChild(h('<div class="ctl"><a class="pen go" href="#home">回首頁</a><a class="pen" href="#progress">學習進度</a></div>'));view.appendChild(s)};

window.addEventListener("hashchange",route);route();
})();
