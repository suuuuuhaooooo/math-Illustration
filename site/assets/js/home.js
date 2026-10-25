/* 首頁：依年級列出目錄（章名……共 N 小節）。打開某個學期時，才去偵測哪些單元檔存在。 */
(function(){
var app=document.getElementById("app"),CN="一二三四五六七八九十",probed={},rows={},grade=3;
try{var sg=parseInt(localStorage.getItem("currentGrade"));if([1,2,3,4,5,6].indexOf(sg)>=0)grade=sg}catch(e){}
function chapText(c){return"共 "+c.secs.length+" 小節"}
function semText(S){var t=0,n=0,u=NB.trail.all();S.chs.forEach(function(c){t+=c.secs.length;c.secs.forEach(function(o){if(u[o.id]&&u[o.id].v)n++})});return"共 "+t+" 小節"+(n?"・已玩 "+n:"")}
/* ---- 數光群島（3D）：單元目錄就是群島；只有瀏覽器畫不出 canvas 時，才退回原本的年級清單 ---- */
var ISLE=null;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function topBar(){var bar=NB.h('<nav class="bar"><a class="brand" href="../" title="回到導覽頁" style="text-decoration:none;color:inherit">'+NB.deco.logo()+'數光島筆記本</a></nav>');if(NB.member)bar.appendChild(NB.member.chip());bar.appendChild(NB.h('<a class="lnk maplink" href="map.html">學習地圖</a>'));bar.appendChild(NB.themeBar());return bar}
function render3d(){
 app.innerHTML="";app.classList.add("i3page");app.appendChild(topBar());
 var st=NB.h('<section class="i3" aria-label="數光群島：22 座主題島">'+
  '<div class="i3-intro"><h1>數光群島</h1><p>22 座主題島，每間小房子是一章，越高的房子年級越高。<span class="i3-hint">拖曳轉動・滾輪或雙指縮放・點島看章節・戳戳島民</span></p>'+
  '<ul class="i3-leg"><li><i style="background:#76ba78"></i>數與量</li><li><i style="background:#60b6c4"></i>空間與形狀</li><li><i style="background:#b296de"></i>關係</li><li><i style="background:#f0b060"></i>資料與不確定性</li></ul></div>'+
  '<div class="i3-tools"><div class="i3-find"><input type="search" placeholder="找單元，例如：分數、面積、時鐘" aria-label="搜尋單元"><div class="i3-res" hidden></div></div>'+
  '<div class="i3-row i3-grades" role="group" aria-label="只看某個年級"></div>'+
  '<div class="i3-row"><button type="button" class="pen i3-links" aria-pressed="true">先備線：開</button><button type="button" class="pen i3-time"></button></div></div>'+
  '<aside class="i3-panel" hidden aria-live="polite"></aside>'+
  '<div class="i3-sr"><p>用鍵盤或螢幕閱讀器：選一座島，就會列出這座島的章節。</p><ul></ul></div></section>');
 app.appendChild(st);
 var panel=st.querySelector(".i3-panel"),srl=st.querySelector(".i3-sr ul");
 ISLE=NB.isle3d.mount(st,{onPick:function(t,cid){show(t,cid)}});
 /* 探索進度：看過任一小節的章、有章被看過的島（只記在這台裝置） */
 var pg=ISLE.progress(),hud=NB.h('<div class="i3-hud"><span>探索進度</span><b>'+pg.islands+"／"+pg.total+'</b> 島<span class="i3-bar"><i style="width:'+Math.round(pg.chapters/Math.max(1,pg.chTotal)*100)+'%"></i></span><b>'+pg.chapters+"／"+pg.chTotal+"</b> 章</div>");st.querySelector(".i3-intro").appendChild(hud);
 /* 年級篩選 */
 var gr=st.querySelector(".i3-grades");[0,1,2,3,4,5,6].forEach(function(g){var b=NB.h('<button type="button" class="pen'+(g===0?" on":"")+'">'+(g?"一二三四五六"[g-1]+"年級":"全部")+"</button>");b.onclick=function(){Array.prototype.forEach.call(gr.children,function(x){x.classList.toggle("on",x===b)});ISLE.setGrade(g);if(panel.dataset.t)show(panel.dataset.t)};gr.appendChild(b)});
 var GSEL=function(){var on=gr.querySelector(".on");return on?Array.prototype.indexOf.call(gr.children,on):0};
 var lk=st.querySelector(".i3-links");lk.onclick=function(){var on=!ISLE.links();ISLE.setLinks(on);lk.textContent="先備線："+(on?"開":"關");lk.setAttribute("aria-pressed",on)};
 var TM=["auto","dawn","day","dusk","night"],ti=0,tb=st.querySelector(".i3-time");function tl(){tb.textContent="天空："+ISLE.timeLabel()}tl();setInterval(tl,60000);tb.onclick=function(){ti=(ti+1)%TM.length;ISLE.setTime(TM[ti]);tl()};
 /* 搜尋 */
 var inp=st.querySelector(".i3-find input"),res=st.querySelector(".i3-res"),tmr=0;
 inp.addEventListener("input",function(){clearTimeout(tmr);tmr=setTimeout(function(){var r=ISLE.search(inp.value);res.innerHTML="";if(!inp.value.trim()){res.hidden=true;return}
  res.hidden=false;if(!r.length){res.appendChild(NB.h('<p class="meta">找不到「'+esc(inp.value.trim())+'」</p>'));return}
  r.slice(0,12).forEach(function(x){var b=NB.h('<button type="button"><b></b><small></small></button>');b.querySelector("b").textContent=(x.secs[0]?x.secs[0].num+" "+x.secs[0].title:x.c.name);b.querySelector("small").textContent=x.t+"島・"+x.c.sem+" 第"+x.c.no+"章 "+x.c.name;b.onclick=function(){res.hidden=true;ISLE.select(x.t,x.c.id)};res.appendChild(b)});
  if(r.length>12)res.appendChild(NB.h('<p class="meta">還有 '+(r.length-12)+' 筆，請再打得精確一點</p>'))},180)});
 inp.addEventListener("keydown",function(e){if(e.key==="Escape"){inp.value="";ISLE.search("");res.hidden=true}});
 /* 螢幕閱讀器與鍵盤用的島嶼清單 */
 ISLE.data.themes.slice().sort(function(a,b){return ISLE.domKey(a).localeCompare(ISLE.domKey(b))}).forEach(function(t){var li=NB.h('<li><button type="button"></button></li>');li.firstChild.textContent=t+"島（"+ISLE.domName(t)+"，"+ISLE.info[t].length+" 章）";li.firstChild.onclick=function(){ISLE.select(t)};srl.appendChild(li)});
 var pk=NB.h('<li><button type="button">戳戳島民（他會說話）</button></li>'),said=NB.h('<li aria-live="polite"></li>');pk.firstChild.onclick=function(){said.textContent="島民說："+ISLE.poke()};srl.appendChild(pk);srl.appendChild(said);
 /* 島的面板：章依年級排，每章列出小節；下面是先學／接著學的島 */
 function show(t,cid){
  if(!t){panel.hidden=true;delete panel.dataset.t;return}
  panel.dataset.t=t;panel.hidden=false;var cs=ISLE.info[t],g=GSEL(),tr=NB.trail.all(),nb=ISLE.neighbors(t);
  panel.innerHTML='<button type="button" class="i3-x" aria-label="關閉">×</button><p class="i3-dom i3-d'+ISLE.domKey(t)+'">'+esc(ISLE.domName(t))+'</p><h2>'+esc(t)+'島</h2><p class="meta">'+cs.length+' 章'+(g?"・目前只看"+"一二三四五六"[g-1]+"年級":"")+'</p><div class="i3-chs"></div><div class="i3-nb"></div>';
  panel.querySelector(".i3-x").onclick=function(){ISLE.select(null)};
  var box=panel.querySelector(".i3-chs");
  cs.filter(function(c){return!g||c.grade===g}).forEach(function(c){
   var d=NB.h('<details class="i3-ch"'+(c.id===cid?" open":"")+'><summary><span class="i3-g" style="background:rgb('+NB.isle3d.GRADE_COL[c.grade].join(",")+')">'+c.sem+'</span><b></b><small></small></summary><div class="secs"></div></details>');
   d.querySelector("b").textContent="第"+"一二三四五六七八九十"[c.no-1]+"章 "+c.name;var seen=c.secs.filter(function(o){return tr[o.id]}).length;d.querySelector("small").textContent=c.secs.length+" 小節"+(seen?"・看過 "+seen:"");
   var ul=d.querySelector(".secs");c.secs.forEach(function(o){var x=tr[o.id],a=NB.h('<a class="lnk'+(x&&x.d?" fin":x&&x.v?" seen":"")+'" href="'+NB.link(o)+'"></a>');a.textContent=o.num+" "+o.title;ul.appendChild(a)});
   box.appendChild(d);if(c.id===cid)setTimeout(function(){d.scrollIntoView({block:"nearest"})},50)});
  if(!box.children.length)box.appendChild(NB.h('<p class="meta">這座島沒有這個年級的章。</p>'));
  var nbx=panel.querySelector(".i3-nb");
  function chips(title,list,key){if(!list.length)return;var w=NB.h('<div><p class="i3-nbt">'+title+'</p></div>');list.slice(0,6).forEach(function(e){var b=NB.h('<button type="button" class="i3-chip"></button>');b.textContent=e[key]+"島";b.title="有 "+e.n+" 組章節的先後關係";b.onclick=function(){ISLE.select(e[key])};w.appendChild(b)});nbx.appendChild(w)}
  chips("先學這些島（藍色光弧）",nb.pre,"a");chips("接著可以去（黃色光弧）",nb.post,"b");
  panel.scrollTop=0}
 /* 繼續上次 */
 var lt=NB.trail.last();if(lt){var li=NB.info(lt),rs=NB.h('<a class="i3-resume"><small>繼續上次</small><b></b></a>');rs.href=NB.link(NB.flat.filter(function(o){return o.id===lt})[0]);rs.querySelector("b").textContent=li.title;st.appendChild(rs)}
 if(NB.tour)NB.tour.setup("isle3d",[{title:"歡迎來到數光群島",text:"每座島是一條主題線（分數、面積、時間⋯），島上的小房子是各年級的章。想再看一次，按右下角的 i 圓形按鈕。"},
  {sel:".i3-cv",title:"轉一轉、點一點",text:"拖曳可以轉動群島，滾輪或雙指可以縮放。點一座島，就會看到這座島上的章節。"},
  {sel:".i3-find",title:"找單元",text:"輸入關鍵字，例如「分數」「時鐘」，相關的島和房子會亮起來。"},
  {sel:".i3-grades",title:"只看某個年級",text:"選年級後，其他年級的房子會變矮變灰。"},
  {sel:".i3-links",title:"先備線",text:"島與島之間的光弧代表學習順序：先學那座島，才接得上這座島。點選一座島時，藍色是要先學的、黃色是接著學的。"}])}

function render(){if(NB.isle3d&&window.NB_MAP&&document.createElement("canvas").getContext)return render3d();renderList()}
function renderList(){
 app.innerHTML="";app.classList.remove("i3page");rows={};
 var bar=NB.h('<nav class="bar"><a class="brand" href="../" title="回到導覽頁" style="text-decoration:none;color:inherit">'+NB.deco.logo()+'數光島筆記本</a></nav>');if(NB.member)bar.appendChild(NB.member.chip());var ml=NB.h('<a class="lnk maplink" href="map.html">學習地圖</a>');bar.appendChild(ml);bar.appendChild(NB.themeBar());app.appendChild(bar);app.appendChild(NB.h('<div class="ruler"></div>'));
 var hero=NB.h('<section class="hero"><div><p class="eyebrow">國小數學・圖解與互動</p><h1 class="title">看懂數學，<mark>動手玩一玩</mark></h1><p class="lead">從例題出發，拖拉、旋轉、疊一疊，把算式變成看得見的圖形。適用國小一至六年級。</p></div></section>');hero.appendChild(NB.deco.hero());app.appendChild(hero);
 app.appendChild(NB.h('<section class="feats" aria-label="特色"><div class="feat"><b>01</b><h3>看懂</h3><p>每個單元從一個例題出發，用手繪圖解一步一步拆開算式，先理解，再計算。</p></div><div class="feat"><b>02</b><h3>動手</h3><p>拖拉、旋轉、疊一疊，自己操作圖形，從錯誤中修正想法。</p></div><div class="feat"><b>03</b><h3>練習</h3><p>班級學員可使用小測驗、每日一題、錯題本與模擬卷，累積積分與勳章，並可列印練習卷。</p></div></section>'));
 app.appendChild(NB.deco.rule());
 var lt=NB.trail.last();
 if(lt){var li=NB.info(lt),rs=NB.h('<div class="resume"><b>繼續上次</b><a class="lnk"></a><small></small></div>');rs.querySelector("a").href=NB.link(NB.flat.filter(function(o){return o.id===lt})[0]);rs.querySelector("a").textContent=li.title;rs.querySelector("small").textContent=li.ref.replace(/^通用 /,"").split("・").slice(0,2).join("・");app.appendChild(rs)}
 var tabs=NB.h('<div class="tabs"></div>');
 [1,2,3,4,5,6].forEach(function(g){var b=NB.h('<button class="pen'+(grade===g?" on":"")+'">'+"一二三四五六"[g-1]+'年級</button>');b.onclick=function(){grade=g;try{localStorage.setItem("currentGrade",g)}catch(e){}renderList()};tabs.appendChild(b)});
 app.appendChild(tabs);
 var list=NB.cat.filter(function(S){return S.grade===grade});
 list.forEach(function(S,k){
  var d=NB.h('<details class="sheet"><summary><span class="tag">'+S.sem+'</span><small></small></summary></details>'),sum=d.querySelector("small");sum.textContent=semText(S);
  S.chs.forEach(function(c){
   var p=NB.h('<div class="chap"><span class="no">第'+CN[c.no-1]+'章</span><b>'+c.name+'</b><span class="dots"></span><span class="cnt"></span></div>'),cnt=p.querySelector(".cnt"),ul=NB.h('<div class="secs"></div>');cnt.textContent=chapText(c);
   c.secs.forEach(function(o){var x=NB.trail.get(o.id),t=NB.h('<a class="lnk'+(x&&x.d?" fin":x&&x.v?" seen":"")+'" href="'+NB.link(o)+'"'+(x&&x.d?' title="答對過挑戰"':x&&x.v?' title="看過"':"")+'></a>');t.textContent=o.num+" "+o.title;ul.appendChild(t)});
   d.appendChild(p);d.appendChild(ul)});
  app.appendChild(d);if(k===0)d.open=true});
 app.appendChild(NB.h('<p class="meta" style="text-align:center">選擇年級後展開學期，點小節即可開始</p>'));
}
render();
if(NB.tour&&!ISLE)NB.tour.setup("home",[{title:"歡迎來到數光島筆記本",text:"花一分鐘看看怎麼找單元、怎麼玩。想再看一次，隨時按右下角的 i 圓形按鈕。"},
 {sel:".tabs",title:"選年級",text:"各年級的目錄都在這裡，按一下就切換。"},
 {sel:"details.sheet summary",title:"展開學期",text:"每個學期是一張紙，點一下展開，會看到章與小節。"},
 {sel:".secs .lnk",title:"選一個小節",text:"每個小節都是一頁：先看例題，再動手拖拉，接著看解法，最後挑戰一題。"},
 {sel:".resume",title:"繼續上次",text:"玩過的單元會被記住，按這裡回到上次的地方。"},
 {sel:".maplink",title:"學習地圖",text:"看單元之間怎麼連起來：先學什麼、接著學什麼。"},
 {sel:".chip",title:"學員專區",text:"正式學員在這裡登入，有每日一題、錯題本、模擬卷和積分。"},
 {sel:".themes",title:"外觀與注音",text:"可以切換永晝、永夜或跟隨系統，也能開關注音。"}]);
})();
