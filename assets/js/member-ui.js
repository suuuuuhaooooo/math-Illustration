/* 學員專區（畫面）：登入、首頁、每日一題、單元小測驗、模擬卷、錯題本、學習進度、貼紙、排行榜、列印練習卷 */
(function(){
"use strict";
var M=NB.member,app=document.getElementById("app"),h=NB.h,tx=NB.tx,view,who,TM=null,EX={},qg=null;
var TABS=[["home","首頁"],["daily","每日一題"],["quiz","單元小測驗"],["mock","模擬卷"],["wrong","錯題本"],["progress","學習進度"],["stickers","貼紙"],["board","排行榜"],["print","列印練習卷"]];
function pad(n){return("0"+n).slice(-2)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function sheet(tag,sub){return h('<section class="sheet"><h2><span class="tag">'+tag+'</span>'+(sub||"")+'</h2></section>')}
function title(id){var o=NB.flat.filter(function(x){return x.id===id})[0];return o?o.sem+" "+o.num+" "+o.title:id}
NB.onDef=function(id,c){EX[id]=[].concat(c.ch?[{q:c.ch.q,a:c.ch.a,h:c.ch.h}]:[],c.qs||[]).map(function(x){return Object.assign({id:id},x)})};
function stkSvg(s,i,on){var c="var(--p"+(i%5+1)+")";return'<svg viewBox="0 0 64 64" class="stk" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="'+(on?c:"var(--paper2)")+'" fill-opacity="'+(on?.3:1)+'" stroke="var(--ink)" stroke-width="2.4"'+(on?"":' stroke-dasharray="4 4"')+'/><circle cx="32" cy="32" r="23" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 4" opacity=".5"/><g transform="translate(16 16) scale(1.33)" fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'+(on?"":' opacity=".28"')+'><path d="'+s.g+'"/></g></svg>'}

/* ---- 外框與路由 ---- */
function shell(){
 app.innerHTML="";var bar=h('<nav class="bar"><a class="back" href="index.html">← 回到目錄</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);app.appendChild(h('<div class="ruler"></div>'));
 app.appendChild(h('<h1 class="title"><mark>學員專區</mark></h1>'));
 var u=M.cur();if(!u){login();return false}
 who=h('<div class="who"><b></b><span></span><button class="pen">登出</button></div>');who.querySelector("b").textContent=u.cls.name+"　"+u.st.no+" 號　"+u.st.n;
 who.querySelector("button").onclick=function(){M.logout();location.hash="#login";route()};app.appendChild(who);updWho();
 var tabs=h('<div class="tabs"></div>'),cur=(location.hash||"#home").slice(1).split("/")[0];
 TABS.forEach(function(t){tabs.appendChild(h('<a class="pen'+(cur===t[0]?" on":"")+'" href="#'+t[0]+'">'+t[1]+"</a>"))});app.appendChild(tabs);
 view=h("<div></div>");app.appendChild(view);return true}
function updWho(){var D=M.data(),t=M.today(),y=M.today(new Date(Date.now()-864e5));if(!who||!D)return;who.querySelector("span").textContent="Lv."+M.lv(D)+"・"+D.pts+" 分・連續 "+(D.sk.last===t||D.sk.last===y?D.sk.n:0)+" 天"}
function route(){clearInterval(TM);if(!shell())return;var p=(location.hash||"#home").slice(1).split("/");(V[p[0]]||V.home)(p[1]);window.scrollTo(0,0)}
function login(){
 var s=sheet("登入","只有班上同學可以使用"),f=h('<div class="ctl lg"><input class="num" placeholder="班級代碼" autocomplete="off"><input class="num" inputmode="numeric" placeholder="座號"><input class="num" type="password" inputmode="numeric" placeholder="密碼"><button class="pen go">登入</button></div>'),fb=h('<div class="fb"></div>'),n=f.querySelectorAll("input");
 s.appendChild(h("<p>小測驗、模擬卷、錯題本、學習進度、貼紙、每日一題、列印練習卷和排行榜，都要登入才能用。班級代碼、座號和密碼請向老師領取。</p>"));s.appendChild(f);s.appendChild(fb);app.appendChild(s);
 function go(){fb.className="fb";fb.textContent="檢查中…";M.login(n[0].value,n[1].value,n[2].value).then(function(ok){if(ok){location.hash="#home";route()}else{fb.className="fb no";fb.textContent="班級、座號或密碼不對，再檢查一次。"}}).catch(function(){fb.className="fb no";fb.textContent="這個網址無法做加密驗證，請用 https 網址或 localhost 開啟。"})}
 f.querySelector("button").onclick=go;n.forEach(function(i){i.onkeydown=function(e){if(e.key==="Enter")go()}})}

/* ---- 作答引擎：一題一題出，答完記錄、算積分、發貼紙 ---- */
function run(o){
 var qs=o.qs,i=0,res=[],D=M.data(),pts0=D.pts,left=o.timer||0,box=sheet(o.tag,o.title),body=h("<div></div>");
 box.appendChild(body);view.innerHTML="";view.appendChild(box);
 if(o.timer){var clock=h('<span class="clock"></span>');box.querySelector("h2").appendChild(clock);TM=setInterval(tick,1000);tick()}
 function tick(){clock.textContent="剩 "+pad(Math.floor(left/60))+":"+pad(left%60);if(left<=0)return finish();left--}
 function show(){
  var q=qs[i],sel=null,done=false,ob=[],inp,hb,d=h('<div><div class="prog">第 '+(i+1)+" / "+qs.length+' 題</div><div class="q">'+tx(q.q)+"</div></div>");body.innerHTML="";
  if(q.o){var w=h('<div class="opts"></div>');q.o.forEach(function(t){var b=h('<button class="pen"></button>');b.innerHTML=tx(esc(t));b.dataset.v=t;b.onclick=function(){if(done)return;sel=t;ob.forEach(function(x){x.classList.toggle("sel",x===b)})};ob.push(b);w.appendChild(b)});d.appendChild(w)}
  else{var c=h('<div class="ctl"><input class="num" type="number" step="any" inputmode="decimal" placeholder="答案"></div>');inp=c.firstChild;d.appendChild(c)}
  var bar=h('<div class="ctl"><button class="pen go">'+(o.exam?"下一題":"檢查")+"</button></div>"),go=bar.firstChild,fb=h('<div class="fb"></div>');
  if(!o.exam){hb=h('<button class="pen">提示</button>');bar.appendChild(hb);hb.onclick=function(){fb.className="fb";fb.innerHTML=tx("提示："+q.h)}}
  d.appendChild(bar);d.appendChild(fb);body.appendChild(d);
  if(inp){inp.focus();inp.onkeydown=function(e){if(e.key==="Enter")go.click()}}
  go.onclick=function(){
   if(done){next();return}
   var v=q.o?sel:inp.value;if(v===null||v==="")return;
   var ok=q.o?String(v)===String(q.a):Math.abs(+v-q.a)<1e-6;
   res.push({q:q,ok:ok});M.rec(q.id,q,ok,o.wrong);
   if(o.exam){next();return}
   done=true;go.textContent=i+1<qs.length?"下一題":"看結果";if(hb)hb.disabled=true;
   if(q.o)ob.forEach(function(b){b.disabled=true;if(b.dataset.v===String(q.a))b.classList.add("right");else if(b.classList.contains("sel"))b.classList.add("wrong")});else inp.disabled=true;
   fb.className="fb "+(ok?"ok":"no");
   fb.innerHTML=ok?"答對了！":tx("答案是 "+q.a+"。"+q.h)+"<br><small>"+(o.wrong?"還沒訂正成功，會留在錯題本。":"這題已放進錯題本。")+"</small>"}}
 function next(){i++;if(i<qs.length)show();else finish()}
 function finish(){
  clearInterval(TM);if(o.exam)for(;i<qs.length;i++){res.push({q:qs[i],ok:false});M.rec(qs[i].id,qs[i],false,false)}
  var n=res.length,c=res.filter(function(x){return x.ok}).length;if(o.bonus)o.bonus(res,D,c,n);
  M.touchDay();var got=M.award();M.save();updWho();
  var s=h('<div><div class="q">'+(o.exam?Math.round(c/n*100)+" 分（"+c+" / "+n+"）":c+" / "+n+" 題答對")+"</div><p>這次獲得 <b>"+(D.pts-pts0)+"</b> 積分，目前 Lv."+M.lv(D)+"。</p></div>");
  if(got.length){s.appendChild(h('<p class="hl">解鎖新貼紙！</p>'));var g=h('<div class="stkgrid"></div>');got.forEach(function(k){g.appendChild(h('<div class="stkc">'+stkSvg(k,M.STK.indexOf(k),1)+"<b>"+k.n+"</b>"+k.d+"</div>"))});s.appendChild(g)}
  var bad=res.filter(function(x){return!x.ok});
  if(o.exam&&bad.length){var l=h('<div><p class="meta">答錯的題目（已放進錯題本）</p></div>');bad.forEach(function(x){l.appendChild(h('<div class="wi"><div>'+tx(x.q.q)+"</div><small>"+tx("答案："+x.q.a+"。"+x.q.h)+"</small></div>"))});s.appendChild(l)}
  var bt=h('<div class="ctl"></div>');
  if(o.again){var a=h('<button class="pen go">再來一次</button>');a.onclick=o.again;bt.appendChild(a)}
  bt.appendChild(h('<a class="pen" href="#wrong">錯題本</a>'));bt.appendChild(h('<a class="pen" href="#home">回首頁</a>'));s.appendChild(bt);body.innerHTML="";body.appendChild(s)}
 show()}
function quizBonus(res,D,c,n){if(n>=3)D.pts+=20;if(n>=5&&c===n)D.pf++}

/* ---- 各分頁 ---- */
var V={};
V.home=function(){
 var D=M.data(),t=M.today(),y=M.today(new Date(Date.now()-864e5)),tot=M.tot(D),tiles=h('<div class="tiles"></div>');
 tiles.innerHTML='<div class="tile"><small>積分</small><strong>'+D.pts+'</strong><div class="meter"><i style="width:'+(D.pts%150)/1.5+'%"></i></div><small>再 '+(150-D.pts%150)+" 分升 Lv."+(M.lv(D)+1)+"</small></div>"+
  '<div class="tile"><small>連續練習</small><strong>'+(D.sk.last===t||D.sk.last===y?D.sk.n:0)+" 天</strong></div>"+
  '<a class="tile" href="#daily"><small>每日一題</small><strong>'+(D.dq[t]?"已完成":"還沒寫")+"</strong></a>"+
  '<a class="tile" href="#wrong"><small>錯題本</small><strong>'+D.wr.length+" 題</strong></a>"+
  '<a class="tile" href="#stickers"><small>貼紙</small><strong>'+Object.keys(D.stk).length+" / "+M.STK.length+"</strong></a>"+
  '<a class="tile" href="#progress"><small>答題正確率</small><strong>'+(tot.n?Math.round(tot.c/tot.n*100):0)+"%</strong></a>";
 view.appendChild(tiles);
 var s=sheet("獎勵","怎麼賺積分和貼紙");s.appendChild(h("<ol class=\"steps\"><li>每答對 1 題：+10 分</li><li>完成一份小測驗（3 題以上）：+20 分</li><li>每日一題：答對 +30 分，答錯也有 +5 分</li><li>連續練習：第 2 天起每天加分，最多每天 +14 分</li><li>模擬卷：完成 +20 分，80 分以上再 +50 分</li><li>錯題訂正：同一題訂正答對 2 次畢業，+15 分</li><li>解鎖貼紙：每張 +20 分。每 150 分升一級</li></ol>"));view.appendChild(s)};

V.daily=function(){
 var u=M.cur(),D=M.data(),t=M.today(),r=M.rng(t+"|"+u.cls.code),p=M.pool(u.grade),q=M.gen(p[Math.floor(r()*p.length)].id,r);
 if(D.dq[t]){var s=sheet("每日一題","今天已經完成了"),days=[],i;for(i=6;i>=0;i--)days.push(M.today(new Date(Date.now()-i*864e5)));
  s.appendChild(h('<div class="q">'+tx(q.q)+"</div>"));s.appendChild(h('<p class="'+(D.dq[t].ok?"ok":"no")+'">'+(D.dq[t].ok?"你答對了！":"這題答錯了，記得到錯題本訂正。")+"</p>"));
  s.appendChild(h("<p>答案：<b>"+tx(String(q.a))+"</b>　"+tx(q.h)+"</p>"));
  s.appendChild(h('<p class="meta">最近 7 天：'+days.map(function(d){return D.dq[d]?"●":"○"}).join(" ")+"　連續練習 "+D.sk.n+" 天・明天再來！</p>"));view.appendChild(s);return}
 run({tag:"每日一題",title:"全班今天同一題",qs:[q],bonus:function(res,D){D.dq[t]={ok:res[0].ok};D.pts+=res[0].ok?30:5}})};

V.quiz=function(id){
 if(id)return startQuiz(id);
 var u=M.cur(),CN="一二三四五六七八九十";if(qg===null)qg=Math.min(6,Math.max(3,u.grade));
 var tabs=h('<div class="tabs"></div>');[3,4,5,6].forEach(function(g){var b=h('<button class="pen'+(qg===g?" on":"")+'">'+"三四五六"[g-3]+"年級</button>");b.onclick=function(){qg=g;view.innerHTML="";V.quiz()};tabs.appendChild(b)});view.appendChild(tabs);
 NB.cat.filter(function(S){return S.grade===qg}).forEach(function(S,k){
  var d=h('<details class="sheet"><summary><span class="tag">'+S.sem+"</span></summary></details>");
  S.chs.forEach(function(c){d.appendChild(h('<div class="chap"><span class="no">第'+CN[c.no-1]+'章</span><b>'+esc(c.name)+'</b><span class="dots"></span></div>'));var ul=h('<div class="secs"></div>');
   c.secs.forEach(function(o){ul.appendChild(h('<a class="'+(M.has(o.id)?"lnk":"todo")+'" href="#quiz/'+o.id+'">'+o.num+" "+esc(o.title)+"</a>"))});d.appendChild(ul)});
  view.appendChild(d);if(k===0)d.open=true});
 view.appendChild(h('<p class="meta" style="text-align:center">實線＝有題庫，每次出新題　虛線＝只有單元裡的挑戰題</p>'))};
function startQuiz(id){
 view.innerHTML="";view.appendChild(h('<p class="meta">載入題目…</p>'));NB.load(id,go,go);
 function go(){var g=M.has(id),q=(g?M.set(id,5):[]).concat((EX[id]||[]).slice(0,g?2:5));
  if(!q.length){view.innerHTML="";var s=sheet("小測驗",esc(title(id)));s.appendChild(h("<p>這一節的題目還在準備中，先看看其他單元吧。</p>"));s.appendChild(h('<a class="pen go" href="#quiz">回單元列表</a>'));view.appendChild(s);return}
  run({tag:"小測驗",title:esc(title(id)),qs:q,bonus:quizBonus,again:function(){startQuiz(id)}})}}

V.mock=function(){
 var u=M.cur(),D=M.data(),s=sheet("模擬卷","10 題・20 分鐘・交卷才公布答案");
 s.appendChild(h("<p>從"+"三四五六"[Math.min(6,Math.max(3,u.grade))-3]+"年級的題庫隨機出題，時間到會自動交卷，沒寫的算錯。答錯的題目會進錯題本。</p>"));
 var b=h('<div class="ctl"><button class="pen go">開始作答</button></div>');b.firstChild.onclick=function(){start()};s.appendChild(b);
 if(D.mk.length)s.appendChild(h('<p class="meta">最近成績：'+D.mk.slice(-5).map(function(m){return m.sc+" 分"}).join("、")+"</p>"));view.appendChild(s);
 function start(){run({tag:"模擬卷",title:"請在時間內完成",exam:true,timer:1200,qs:M.mix(u.grade,10),again:start,bonus:function(res,D,c,n){var sc=Math.round(c/n*100);D.mk.push({d:M.today(),sc:sc});D.pts+=20+(sc>=80?50:0)}})}};

V.wrong=function(){
 var D=M.data(),s=sheet("錯題本",D.wr.length+" 題");view.appendChild(s);
 if(!D.wr.length){s.appendChild(h("<p>目前沒有錯題，真棒！</p>"));return}
 s.appendChild(h("<p>同一題訂正答對 2 次就會畢業，還能拿積分。</p>"));
 var b=h('<div class="ctl"><button class="pen go">開始訂正（最多 10 題）</button></div>');b.firstChild.onclick=function(){fix()};s.appendChild(b);
 D.wr.slice().reverse().forEach(function(w){var d=h('<div class="wi"><div>'+tx(w.q)+"</div><small>"+esc(title(w.id))+"・錯 "+w.n+" 次・已訂正對 "+(w.ok||0)+"/2　</small></div>"),dt=h("<details><summary>看答案</summary></details>");dt.appendChild(h("<div>"+tx("答案："+w.a+"。"+w.h)+"</div>"));d.appendChild(dt);s.appendChild(d)});
 function fix(){var D=M.data();run({tag:"錯題訂正",title:"把錯的題目弄懂",wrong:true,qs:D.wr.slice(0,10).map(function(w){return{id:w.id,q:w.q,a:w.a,o:w.o,h:w.h}}),again:function(){view.innerHTML="";V.wrong()}})}};

V.progress=function(){
 var D=M.data(),tot=M.tot(D),s=sheet("學習進度","看看自己的成長"),tl=h('<div class="tiles"></div>');
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
 var D=M.data(),s=sheet("貼紙","已收集 "+Object.keys(D.stk).length+" / "+M.STK.length),g=h('<div class="stkgrid"></div>');
 M.STK.forEach(function(k,i){var on=!!D.stk[k.id];g.appendChild(h('<div class="stkc'+(on?"":" off")+'">'+stkSvg(k,i,on)+"<b>"+(on?k.n:"？？？")+"</b>"+k.d+(on?"<br><small>"+D.stk[k.id]+"</small>":"")+"</div>"))});
 s.appendChild(g);view.appendChild(s)};

V.board=function(){
 var u=M.cur(),s=sheet("排行榜",esc(u.cls.name)),box=h("<div>載入中…</div>");s.appendChild(box);view.appendChild(s);
 M.board().then(function(r){var rows=r.rows.slice().sort(function(a,b){return b.pts-a.pts});
  if(!rows.length){box.textContent="還沒有人上榜，先去做一份小測驗吧。";return}
  box.innerHTML='<table class="tb"><tr><th>名次</th><th>同學</th><th>等級</th><th>積分</th><th>答對</th><th>貼紙</th></tr>'+rows.map(function(x,i){return'<tr class="'+(x.no===u.st.no?"me":"")+'"><td><span class="rk r'+(i+1)+'">'+(i+1)+"</span></td><td>"+esc(x.n)+"</td><td>Lv."+x.lv+"</td><td>"+x.pts+"</td><td>"+x.ok+"</td><td>"+x.stk+"</td></tr>"}).join("")+"</table>"+(r.cloud?"":'<p class="meta">目前是單機版：只看得到在這台裝置上練習過的同學。老師設定雲端同步後，全班都會上榜。</p>')})
 .catch(function(){box.textContent="排行榜暫時連不上，請稍後再試。"})};

V.print=function(){
 var u=M.cur(),D=M.data(),s=sheet("列印練習卷","選好題目就可以印出來寫");s.classList.add("noprint");
 var src='<select id="ps"><option value="mix">本年級綜合</option>'+(D.wr.length?'<option value="wrong">我的錯題（'+D.wr.length+" 題）</option>":"")+M.G.map(function(g){return'<option value="'+g.id+'">'+esc(title(g.id))+"</option>"}).join("")+"</select>";
 var ctl=h('<div class="ctl"><label>題目來源</label>'+src+'<label>題數</label><select id="pn"><option>10</option><option>15</option><option>20</option></select><button class="pen go">出題</button><button class="pen">列印</button></div>');
 var out=h("<div></div>");s.appendChild(ctl);view.appendChild(s);view.appendChild(out);
 var bs=ctl.querySelectorAll("button");bs[0].onclick=make;bs[1].onclick=function(){window.print()};make();
 function make(){
  var v=ctl.querySelector("#ps").value,n=+ctl.querySelector("#pn").value,r=M.rng(Date.now()),qs=v==="wrong"?M.data().wr.slice(0,n):v==="mix"?M.mix(u.grade,n,r):M.set(v,n,r);
  var nm=v==="wrong"?"錯題重練":v==="mix"?"綜合練習":title(v);
  var P='<div class="psheet"><h3>數學練習卷｜'+esc(nm)+'</h3><div class="pinfo"><span>班級：'+esc(u.cls.name)+"</span><span>座號："+u.st.no+"</span><span>姓名：<b>"+esc(u.st.n)+"</b></span><span>日期："+M.today()+"</span><span>分數：＿＿＿</span></div><ol>"+
   qs.map(function(q){return"<li>"+tx(q.q)+(q.o?'<br><span>選項：'+q.o.map(function(t){return"（　）"+tx(esc(t))}).join("　　")+"</span>":"")+'<span class="ln">答：＿＿＿＿＿＿＿＿＿</span></li>'}).join("")+"</ol></div>"+
   '<div class="psheet key"><h3>解答｜'+esc(nm)+"</h3><ol>"+qs.map(function(q){return"<li>"+tx(String(q.a))+"<br><small>"+tx(q.h)+"</small></li>"}).join("")+"</ol></div>";
  out.innerHTML=P}};

window.addEventListener("hashchange",route);route();
})();
