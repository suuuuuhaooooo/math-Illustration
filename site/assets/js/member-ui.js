/* 學員專區（畫面）：登入、首頁、每日一題、單元小測驗、模擬卷、錯題本、學習進度、貼紙、排行榜、列印練習卷
   題目、判分、積分都由伺服器處理（見 member.js）；這裡只負責顯示與收集答案。 */
(function(){
"use strict";
var M=NB.member,app=document.getElementById("app"),h=NB.h,tx=NB.tx,view,who,TM=null,qg=null,booted=false;
var TABS=[["home","首頁"],["daily","每日一題"],["quiz","單元小測驗"],["mock","模擬卷"],["wrong","錯題本"],["progress","學習進度"],["stickers","貼紙"],["board","排行榜"],["print","列印練習卷"]];
function pad(n){return("0"+n).slice(-2)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function sheet(tag,sub){return h('<section class="sheet"><h2><span class="tag">'+tag+'</span>'+(sub||"")+'</h2></section>')}
function title(id){var o=NB.flat.filter(function(x){return x.id===id})[0];return o?o.sem+" "+o.num+" "+o.title:id}
function stkSvg(s,i,on){var c="var(--p"+(i%5+1)+")";return'<svg viewBox="0 0 64 64" class="stk" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="'+(on?c:"var(--paper2)")+'" fill-opacity="'+(on?.3:1)+'" stroke="var(--ink)" stroke-width="2.4"'+(on?"":' stroke-dasharray="4 4"')+'/><circle cx="32" cy="32" r="23" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 4" opacity=".5"/><g transform="translate(16 16) scale(1.33)" fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'+(on?"":' opacity=".28"')+'><path d="'+s.g+'"/></g></svg>'}
function errMsg(e){var c=e&&e.code;return{net:"連不上伺服器，請檢查網路後再試一次。",noapi:"網站還沒設定好伺服器網址，請老師完成設定。",bad_token:"登入已失效，請重新整理頁面再登入。",not_in_roster:"這個帳號不在班級名單裡。",no_session:"這份題目已經失效，請重新開始。",already_done:"這份題目已經交過了。",already_answered:"這題已經送出了。",server:"伺服器忙碌中，請稍後再試。"}[c]||"發生了一點問題（"+(c||"未知")+"），請再試一次。"}
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
 M.boot().then(function(){booted=true;booting=false;route()})}
function route(){clearInterval(TM);if(!booted){boot();return}if(!shell())return;var p=(location.hash||"#home").slice(1).split("/");(V[p[0]]||V.home)(p[1]);window.scrollTo(0,0)}

function login(){
 var s=sheet("登入","只有班上同學可以使用"),fb=h('<div class="fb"></div>'),em=M.auth&&M.auth.user()?M.auth.user().email:"";
 s.appendChild(h("<p>用老師登記的 Google 帳號登入。小測驗、模擬卷、錯題本、學習進度、貼紙、每日一題、列印練習卷和排行榜，都要登入才能用。</p>"));
 var msg={noconfig:"網站還沒設定好登入功能，請老師完成設定。",noauth:"登入服務載入失敗，請檢查網路後重新整理頁面。",net:"連不上伺服器，請稍後再試。",noapi:"網站還沒設定好伺服器網址，請老師完成設定。",bad_token:"登入已失效，請重新登入。",not_in_roster:"「"+esc(em)+"」不在班級名單裡。請改用老師登記的帳號，或請老師把這個帳號加進名單。"}[M.err];
 if(msg){fb.className="fb no";fb.innerHTML=msg}
 var bar=h('<div class="ctl"></div>');
 if(M.err==="not_in_roster"||M.err==="bad_token"){var o=h('<button class="pen go">換一個帳號登入</button>');o.onclick=function(){M.logout().then(function(){M.err=null;booted=false;route()})};bar.appendChild(o)}
 else if(M.auth){var b=h('<button class="pen go gbtn"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.400c2-1.800 3.100-4.500 3.100-7.600z"/><path fill="#34A853" d="M12 22c2.800 0 5.100-.9 6.800-2.500l-3.300-2.600c-.9.600-2.100 1-3.500 1-2.700 0-5-1.800-5.800-4.300H2.800v2.700A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.200 13.600a6 6 0 0 1 0-3.800V7.100H2.800a10 10 0 0 0 0 9.200z"/><path fill="#EA4335" d="M12 5.900c1.500 0 2.900.5 4 1.600l3-3A10 10 0 0 0 2.800 7.100l3.400 2.700C7 7.700 9.300 5.900 12 5.900z"/></svg> 使用 Google 登入</button>');
  b.onclick=function(){b.disabled=true;fb.className="fb";fb.textContent="登入中…";M.signIn().then(function(){booted=false;location.hash="#home";route()}).catch(function(e){b.disabled=false;fb.className="fb no";fb.textContent=e&&e.code==="auth/popup-closed-by-user"?"登入視窗被關閉了，再按一次登入。":"登入沒有成功，請再試一次。"})};bar.appendChild(b)}
 s.appendChild(bar);s.appendChild(fb);app.appendChild(s)}

/* ---- 作答引擎：題目與判分都來自伺服器 ----
   練習（小測驗、每日一題、錯題訂正）：每題送出就由伺服器判分並回傳解答
   模擬卷：全部寫完交卷才一次判分；時間由伺服器管，逾時視為未作答 */
function run(o){
 var S=o.sess,qs=S.qs,exam=S.kind==="mock",i=0,ans=[],res=[],left=S.seconds||0,box=sheet(o.tag,o.title),body=h("<div></div>"),busy=false,fin=false;
 box.appendChild(body);view.innerHTML="";view.appendChild(box);
 if(exam){var clock=h('<span class="clock"></span>');box.querySelector("h2").appendChild(clock);var t0=Date.now();TM=setInterval(tick,1000);tick()}
 function tick(){left=S.seconds-Math.floor((Date.now()-t0)/1000);if(left<0)left=0;clock.textContent="剩 "+pad(Math.floor(left/60))+":"+pad(left%60);if(left<=0)finish()}
 function show(){
  var q=qs[i],sel=null,done=false,ob=[],inp,hb,d=h('<div><div class="prog">第 '+(i+1)+" / "+qs.length+' 題</div><div class="q">'+tx(q.q)+"</div></div>");body.innerHTML="";
  if(q.o){var w=h('<div class="opts"></div>');q.o.forEach(function(t){var b=h('<button class="pen"></button>');b.innerHTML=tx(esc(t));b.dataset.v=t;b.onclick=function(){if(done)return;sel=t;ob.forEach(function(x){x.classList.toggle("sel",x===b)})};ob.push(b);w.appendChild(b)});d.appendChild(w)}
  else{var c=h('<div class="ctl"><input class="num" type="number" step="any" inputmode="decimal" placeholder="答案"></div>');inp=c.firstChild;d.appendChild(c)}
  var bar=h('<div class="ctl"><button class="pen go">'+(exam?(i+1<qs.length?"下一題":"交卷"):"檢查")+"</button></div>"),go=bar.firstChild,fb=h('<div class="fb"></div>');
  if(!exam){hb=h('<button class="pen">提示</button>');bar.appendChild(hb);hb.onclick=function(){M.api("POST","/api/hint",{sid:S.sid,i:i}).then(function(r){fb.className="fb";fb.innerHTML=tx("提示："+r.h)},function(e){fb.className="fb no";fb.textContent=errMsg(e)})}}
  if(exam&&i>0){var pv=h('<button class="pen">上一題</button>');pv.onclick=function(){i--;show()};bar.insertBefore(pv,go)}
  d.appendChild(bar);d.appendChild(fb);body.appendChild(d);
  if(exam&&ans[i]!==undefined&&ans[i]!==null){if(q.o)ob.forEach(function(b){if(b.dataset.v===String(ans[i])){sel=ans[i];b.classList.add("sel")}});else inp.value=ans[i]}
  if(inp){inp.focus();inp.onkeydown=function(e){if(e.key==="Enter")go.click()}}
  go.onclick=function(){
   if(busy)return;
   if(done){next();return}
   var v=q.o?sel:inp.value;
   if(exam){ans[i]=v===""?null:v;next();return}
   if(v===null||v==="")return;
   busy=true;go.disabled=true;
   M.api("POST","/api/check",{sid:S.sid,i:i,v:v}).then(function(r){
    busy=false;go.disabled=false;res.push({q:q,ok:r.ok});done=true;go.textContent=i+1<qs.length?"下一題":"看結果";if(hb)hb.disabled=true;
    if(q.o)ob.forEach(function(b){b.disabled=true;if(b.dataset.v===String(r.a))b.classList.add("right");else if(b.classList.contains("sel"))b.classList.add("wrong")});else inp.disabled=true;
    fb.className="fb "+(r.ok?"ok":"no");
    fb.innerHTML=r.ok?"答對了！":tx("答案是 "+r.a+"。"+r.h)+(r.diag?'<br><b class="diag">'+tx(r.diag)+"</b>":"")+"<br><small>"+(S.kind==="fix"?"還沒訂正成功，會留在錯題本。":"這題已放進錯題本。")+"</small>"
   }).catch(function(e){busy=false;go.disabled=false;fb.className="fb no";fb.textContent=errMsg(e)})}}
 function next(){if(i+1<qs.length){i++;show()}else finish()}
 function finish(){
  if(fin||busy)return;fin=true;clearInterval(TM);body.innerHTML="";body.appendChild(h('<p class="meta">'+(exam?"交卷中，伺服器判分…":"結算中…")+"</p>"));
  var p=exam?M.api("POST","/api/submit",{sid:S.sid,ans:qs.map(function(_,k){return ans[k]===undefined?null:ans[k]})}):M.api("POST","/api/finish",{sid:S.sid});
  p.then(function(r){M.setData(r.data);updWho();result(r)},function(e){fin=false;body.innerHTML="";var s=h('<div><div class="fb no">'+esc(errMsg(e))+"</div></div>"),b=h('<div class="ctl"><button class="pen go">再試一次</button></div>');b.firstChild.onclick=function(){finish()};s.appendChild(b);body.appendChild(s);if(exam&&e.code==="no_session"){s.appendChild(h('<a class="pen" href="#home">回首頁</a>'))}})}
 function result(r){
  var D=M.D,n=exam?r.n:r.n,c=r.c;
  var s=h('<div><div class="q">'+(exam?r.sc+" 分（"+c+" / "+n+"）":c+" / "+n+" 題答對")+"</div>"+(r.late?'<p class="fb no">已超過作答時間，伺服器只接受時限內的答案，這份卷子沒有計分。</p>':"")+"<p>這次獲得 <b>"+r.gain+"</b> 積分，目前 Lv."+M.lv(D)+"。</p></div>");
  if(r.got&&r.got.length){s.appendChild(h('<p class="hl">解鎖新貼紙！</p>'));var g=h('<div class="stkgrid"></div>');r.got.forEach(function(id){var k=M.STK.filter(function(x){return x.id===id})[0],ix=M.STK.indexOf(k);g.appendChild(h('<div class="stkc">'+stkSvg(k,ix,1)+"<b>"+k.n+"</b>"+k.d+"</div>"))});s.appendChild(g)}
  if(exam&&r.review&&r.review.length){var l=h('<div><p class="meta">答錯或沒寫的題目（已放進錯題本）</p></div>');r.review.forEach(function(x){l.appendChild(h('<div class="wi"><div>'+tx(x.q)+"</div><small>"+(x.v===null||x.v===""?"你沒有作答。":tx("你的答案："+x.v+"。"))+" "+tx("答案："+x.a+"。"+x.h)+(x.diag?'<br><b class="diag">'+tx(x.diag)+"</b>":"")+"</small></div>"))});s.appendChild(l)}
  var bt=h('<div class="ctl"></div>');
  if(o.again){var a=h('<button class="pen go">再來一次</button>');a.onclick=o.again;bt.appendChild(a)}
  bt.appendChild(h('<a class="pen" href="#wrong">錯題本</a>'));bt.appendChild(h('<a class="pen" href="#home">回首頁</a>'));s.appendChild(bt);body.innerHTML="";body.appendChild(s)}
 show()}
function begin(payload,fn){view.innerHTML="";view.appendChild(h('<p class="meta">準備題目…</p>'));M.api("POST","/api/start",payload).then(fn,function(e){view.innerHTML="";var s=sheet("出題失敗","");s.appendChild(h('<div class="fb no">'+esc(errMsg(e))+"</div>"));s.appendChild(h('<a class="pen go" href="#home">回首頁</a>'));view.appendChild(s)})}

/* ---- 各分頁 ---- */
var V={};
V.home=function(){
 var D=M.D,t=ymdT(),y=M.prev(t),tot=M.tot(D),tiles=h('<div class="tiles"></div>');
 tiles.innerHTML='<div class="tile"><small>積分</small><strong>'+D.pts+'</strong><div class="meter"><i style="width:'+(D.pts%150)/1.5+'%"></i></div><small>再 '+(150-D.pts%150)+" 分升 Lv."+(M.lv(D)+1)+"</small></div>"+
  '<div class="tile"><small>連續練習</small><strong>'+(D.sk.last===t||D.sk.last===y?D.sk.n:0)+" 天</strong></div>"+
  '<a class="tile" href="#daily"><small>每日一題</small><strong>'+(D.dq[t]?"已完成":"還沒寫")+"</strong></a>"+
  '<a class="tile" href="#wrong"><small>錯題本</small><strong>'+D.wr.length+" 題</strong></a>"+
  '<a class="tile" href="#stickers"><small>貼紙</small><strong>'+Object.keys(D.stk).length+" / "+M.STK.length+"</strong></a>"+
  '<a class="tile" href="#progress"><small>答題正確率</small><strong>'+(tot.n?Math.round(tot.c/tot.n*100):0)+"%</strong></a>";
 view.appendChild(tiles);
 var s=sheet("獎勵","怎麼賺積分和貼紙");s.appendChild(h("<ol class=\"steps\"><li>每答對 1 題：+10 分（每天最多計 100 題）</li><li>完成一份小測驗（3 題以上）：+20 分</li><li>每日一題：答對 +30 分，答錯也有 +5 分</li><li>連續練習：第 2 天起每天加分，最多每天 +14 分</li><li>模擬卷：完成 +20 分，80 分以上再 +50 分（每天前 3 份）</li><li>錯題訂正：同一題訂正答對 2 次畢業，+15 分</li><li>解鎖貼紙：每張 +20 分。每 150 分升一級</li></ol>"));view.appendChild(s)};

V.daily=function(){
 begin({kind:"daily"},function(r){
  if(r.done){var s=sheet("每日一題","今天已經完成了"),days=[],i,D=M.D,t=ymdT();for(i=6;i>=0;i--)days.push(M.today(new Date(Date.now()-i*864e5)));
   s.appendChild(h('<div class="q">'+tx(r.q)+"</div>"));s.appendChild(h('<p class="'+(r.ok?"ok":"no")+'">'+(r.ok?"你答對了！":"這題答錯了，記得到錯題本訂正。")+"</p>"));
   s.appendChild(h("<p>答案：<b>"+tx(String(r.a))+"</b>　"+tx(r.h)+"</p>"));
   s.appendChild(h('<p class="meta">最近 7 天：'+days.map(function(d){return D.dq[d]?"●":"○"}).join(" ")+"　連續練習 "+D.sk.n+" 天・明天再來！</p>"));view.innerHTML="";view.appendChild(s);return}
  run({tag:"每日一題",title:"全班今天同一題",sess:r})})};

V.quiz=function(id){
 if(id)return startQuiz(id);
 var u=user(),CN="一二三四五六七八九十";if(qg===null)qg=Math.min(6,Math.max(3,u.grade));
 var tabs=h('<div class="tabs"></div>');[3,4,5,6].forEach(function(g){var b=h('<button class="pen'+(qg===g?" on":"")+'">'+"三四五六"[g-3]+"年級</button>");b.onclick=function(){qg=g;view.innerHTML="";V.quiz()};tabs.appendChild(b)});view.appendChild(tabs);
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

V.mock=function(){
 var u=user(),D=M.D,s=sheet("模擬卷","10 題・20 分鐘・交卷才公布答案");
 s.appendChild(h("<p>依照「由易到難、題型分配」的細目表，從"+"三四五六"[Math.min(6,Math.max(3,u.grade))-3]+"年級和前一年級的題庫出題。每個人的題目和選項順序都不同。時間由伺服器計算，時間到會自動交卷，沒寫的算錯，答錯的題目會進錯題本。</p>"));
 var b=h('<div class="ctl"><button class="pen go">開始作答</button></div>');b.firstChild.onclick=function(){start()};s.appendChild(b);
 if(D.mk.length)s.appendChild(h('<p class="meta">最近成績：'+D.mk.slice(-5).map(function(m){return m.sc+" 分"}).join("、")+"</p>"));view.appendChild(s);
 function start(){begin({kind:"mock"},function(r){run({tag:"模擬卷",title:"請在時間內完成",sess:r,again:start})})}};

V.wrong=function(){
 var D=M.D,s=sheet("錯題本",D.wr.length+" 題");view.appendChild(s);
 if(!D.wr.length){s.appendChild(h("<p>目前沒有錯題，真棒！</p>"));return}
 s.appendChild(h("<p>同一題訂正答對 2 次就會畢業，還能拿積分。</p>"));
 var b=h('<div class="ctl"><button class="pen go">開始訂正（最多 10 題）</button></div>');b.firstChild.onclick=function(){fix()};s.appendChild(b);
 D.wr.slice().reverse().forEach(function(w){var d=h('<div class="wi"><div>'+tx(w.q)+"</div><small>"+esc(title(w.id))+"・錯 "+w.n+" 次・已訂正對 "+(w.ok||0)+"/2　</small></div>"),dt=h("<details><summary>看答案</summary></details>");dt.appendChild(h("<div>"+tx("答案："+w.a+"。"+(w.h||""))+"</div>"));d.appendChild(dt);s.appendChild(d)});
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
 ks.forEach(function(k){var u=D.u[k],p=Math.round(u.c/u.n*100);s.appendChild(h('<div class="urow"><span>'+esc(title(k))+'</span><div class="meter"><i style="width:'+p+'%"></i></div><span>'+u.c+"/"+u.n+"（"+p+"%）</span></div>"))});
 if(D.mk.length){s.appendChild(h('<p class="meta">模擬卷成績</p>'));s.appendChild(h("<p>"+D.mk.slice(-8).map(function(m){return m.d.slice(5)+"　"+m.sc+" 分"}).join("<br>")+"</p>"))}
 view.appendChild(s)};

V.stickers=function(){
 var D=M.D,s=sheet("貼紙","已收集 "+Object.keys(D.stk).length+" / "+M.STK.length),g=h('<div class="stkgrid"></div>');
 M.STK.forEach(function(k,i){var on=!!D.stk[k.id];g.appendChild(h('<div class="stkc'+(on?"":" off")+'">'+stkSvg(k,i,on)+"<b>"+(on?k.n:"？？？")+"</b>"+k.d+(on?"<br><small>"+D.stk[k.id]+"</small>":"")+"</div>"))});
 s.appendChild(g);view.appendChild(s)};

V.board=function(){
 var u=user(),s=sheet("排行榜",esc(u.cls+" 班")),box=h("<div>載入中…</div>");s.appendChild(box);view.appendChild(s);
 M.api("GET","/api/board").then(function(r){var rows=r.rows.slice().sort(function(a,b){return b.pts-a.pts});
  if(!rows.length){box.textContent="還沒有人上榜，先去做一份小測驗吧。";return}
  box.innerHTML='<table class="tb"><tr><th>名次</th><th>同學</th><th>等級</th><th>積分</th><th>答對</th><th>貼紙</th></tr>'+rows.map(function(x,i){return'<tr class="'+(x.no===u.no?"me":"")+'"><td><span class="rk r'+(i+1)+'">'+(i+1)+"</span></td><td>"+esc(x.n)+"</td><td>Lv."+x.lv+"</td><td>"+x.pts+"</td><td>"+x.ok+"</td><td>"+x.stk+"</td></tr>"}).join("")+"</table>"})
 .catch(function(e){box.textContent=errMsg(e)})};

V.print=function(){
 var u=user(),D=M.D,s=sheet("列印練習卷","選好題目就可以印出來寫");s.classList.add("noprint");
 var src='<select id="ps"><option value="mix">本年級綜合</option>'+(D.wr.length?'<option value="wrong">我的錯題（'+D.wr.length+" 題）</option>":"")+(M.gens||[]).slice().sort().map(function(g){return'<option value="'+g+'">'+esc(title(g))+"</option>"}).join("")+"</select>";
 var ctl=h('<div class="ctl"><label>題目來源</label>'+src+'<label>題數</label><select id="pn"><option>10</option><option>15</option><option>20</option></select><button class="pen go">出題</button><button class="pen">列印</button></div>');
 var out=h("<div></div>");s.appendChild(ctl);view.appendChild(s);view.appendChild(out);
 var bs=ctl.querySelectorAll("button");bs[0].onclick=make;bs[1].onclick=function(){window.print()};make();
 function make(){
  var v=ctl.querySelector("#ps").value,n=+ctl.querySelector("#pn").value;out.innerHTML='<p class="meta">出題中…</p>';
  M.api("GET","/api/print?src="+encodeURIComponent(v)+"&n="+n).then(function(r){
   var nm=v==="wrong"?"錯題重練":v==="mix"?"綜合練習":title(v),qs=r.qs;
   out.innerHTML='<div class="psheet"><h3>數學練習卷｜'+esc(nm)+'</h3><div class="pinfo"><span>班級：'+esc(u.cls)+"</span><span>座號："+u.no+"</span><span>姓名：<b>"+esc(u.name)+"</b></span><span>日期："+M.today()+"</span><span>分數：＿＿＿</span></div><ol>"+
    qs.map(function(q){return"<li>"+tx(q.q)+(q.o?'<br><span>選項：'+q.o.map(function(t){return"（　）"+tx(esc(t))}).join("　　")+"</span>":"")+'<span class="ln">答：＿＿＿＿＿＿＿＿＿</span></li>'}).join("")+"</ol></div>"+
    '<div class="psheet key"><h3>解答｜'+esc(nm)+"</h3><ol>"+qs.map(function(q){return"<li>"+tx(String(q.a))+"<br><small>"+tx(q.h||"")+"</small></li>"}).join("")+"</ol></div>"},
   function(e){out.innerHTML='<div class="fb no">'+esc(errMsg(e))+"</div>"})}};

window.addEventListener("hashchange",route);route();
})();
