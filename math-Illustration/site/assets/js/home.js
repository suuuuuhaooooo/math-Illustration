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
  '<ul class="i3-leg"><li><i style="background:#7cc47e"></i>數與量</li><li><i style="background:#69c0cf"></i>空間與形狀</li><li><i style="background:#b59ae4"></i>關係</li><li><i style="background:#f2b664"></i>資料與不確定性</li></ul></div>'+
  '<div class="i3-tools"><div class="i3-find"><input type="search" placeholder="找單元，例如：分數、面積、時鐘" aria-label="搜尋單元"><div class="i3-res" hidden></div></div>'+
  '<div class="i3-row i3-grades" role="group" aria-label="只看某個年級"></div>'+
  '<div class="i3-row i3-tb" role="toolbar" aria-label="群島工具列">'+
   '<button type="button" class="pen i3-b-idx" aria-expanded="false">☰ 主題索引</button>'+
   '<button type="button" class="pen on i3-b-lab" aria-pressed="true">名牌</button>'+
   '<button type="button" class="pen on i3-links" aria-pressed="true">先備線</button>'+
   '<button type="button" class="pen on i3-b-folk" aria-pressed="true">島民</button>'+
   '<button type="button" class="pen i3-b-pause" aria-pressed="false">暫停</button>'+
   '<button type="button" class="pen i3-b-bird" aria-pressed="false">鳥瞰</button>'+
   '<button type="button" class="pen on i3-b-log" aria-pressed="true">日誌</button></div></div>'+
  '<aside class="i3-idx" hidden aria-label="主題索引"></aside>'+
  '<aside class="i3-panel" hidden aria-live="polite"></aside>'+
  '<div class="i3-clock"><span class="i3-ck-t">00:00</span><input type="range" min="0" max="24" step="0.25" aria-label="時間 00:00～24:00"><span class="i3-ck-e">24:00</span><button type="button" class="pen on i3-ck-auto" aria-pressed="true">自動</button></div>'+
  '<div class="i3-play" hidden><p class="i3-pl-cap" aria-live="polite"></p><div class="i3-pl-c"><b class="i3-pl-n">00 / 00</b><span class="i3-pl-bar"><i></i></span><button type="button" class="pen i3-pl-pause">暫停</button><button type="button" class="pen i3-pl-re">重播</button><button type="button" class="pen i3-pl-x">離開</button><button type="button" class="pen i3-pl-skip">略過</button><button type="button" class="pen on i3-pl-next">下一步 →</button></div></div>'+
  '<div class="i3-log"><div class="i3-log-top"><button type="button" class="i3-log-h" aria-expanded="true"><i class="i3-live"></i>群島日誌 <b>LIVE</b></button><button type="button" class="i3-x i3-log-x" aria-label="關閉日誌">×</button></div>'+
   '<div class="i3-log-tabs" role="tablist"><button type="button" role="tab" class="on" data-k="sum" aria-selected="true">群島概況</button><button type="button" role="tab" data-k="log" aria-selected="false">日誌</button></div>'+
   '<div class="i3-log-sum"><p class="i3-guide"><span class="i3-gface" aria-hidden="true"></span><span>點一座島，開始探索！或選一段導覽，讓我帶你逛。</span></p><ol class="i3-tours"></ol></div>'+
   '<ol class="i3-log-l" aria-live="polite" hidden></ol></div>'+
  '<div class="i3-sr"><p>用鍵盤或螢幕閱讀器：選一座島，就會列出這座島的章節。</p><ul></ul></div></section>');
 app.appendChild(st);
 /* 手機：上方導覽列比較高，讓群島剛好填滿螢幕剩下的高度（工具列才不會跑到畫面外） */
 var fitH=0;function fit(){if(innerWidth>=640){st.style.height="";return}var top=st.getBoundingClientRect().top+scrollY,h=Math.max(460,innerHeight-top);if(Math.abs(h-fitH)>20){fitH=h;st.style.height=h+"px"}}fit();setTimeout(fit,600);setTimeout(fit,2000);addEventListener("resize",fit);addEventListener("orientationchange",function(){fitH=0;setTimeout(fit,300)});
 var panel=st.querySelector(".i3-panel"),srl=st.querySelector(".i3-sr ul"),logl=st.querySelector(".i3-log-l"),idx=st.querySelector(".i3-idx"),TOUR=null;
 function hm(){var d=new Date();return("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2)}
 function addLog(m){var li=NB.h('<li><time></time><span></span></li>');li.firstChild.textContent=hm();li.lastChild.textContent=m;logl.insertBefore(li,logl.firstChild);while(logl.children.length>(innerWidth<640?3:6))logl.removeChild(logl.lastChild)}
 ISLE=NB.isle3d.mount(st,{onPick:function(t,cid){if(TOUR&&!TOUR.busy)tourStop();if(!TOUR)show(t,cid);markIdx(t)},onLog:addLog,onFail:function(){ISLE=null;st.remove();renderList();homeTour()}});
 if(!ISLE){st.remove();renderList();homeTour();return}
 /* 探索進度：看過任一小節的章、有章被看過的島（只記在這台裝置） */
 var pg=ISLE.progress(),hud=NB.h('<div class="i3-hud"><span>探索進度</span><b>'+pg.islands+"／"+pg.total+'</b> 島<span class="i3-bar"><i style="width:'+Math.round(pg.chapters/Math.max(1,pg.chTotal)*100)+'%"></i></span><b>'+pg.chapters+"／"+pg.chTotal+"</b> 章</div>");st.querySelector(".i3-intro").appendChild(hud);
 /* 年級篩選 */
 var gr=st.querySelector(".i3-grades");[0,1,2,3,4,5,6].forEach(function(g){var b=NB.h('<button type="button" class="pen'+(g===0?" on":"")+'">'+(g?"一二三四五六"[g-1]+"年級":"全部")+"</button>");b.onclick=function(){Array.prototype.forEach.call(gr.children,function(x){x.classList.toggle("on",x===b)});ISLE.setGrade(g);if(panel.dataset.t)show(panel.dataset.t)};gr.appendChild(b)});
 var GSEL=function(){var on=gr.querySelector(".on");return on?Array.prototype.indexOf.call(gr.children,on):0};
 /* 工具列：名牌／先備線／暫停／鳥瞰 */
 function tog(sel,get,set,txt){var b=st.querySelector(sel);b.onclick=function(){var on=!get();set(on);b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);if(txt)b.textContent=txt(on)};return b}
 tog(".i3-b-lab",ISLE.labelsOn,ISLE.setLabels);tog(".i3-links",ISLE.links,ISLE.setLinks);
 tog(".i3-b-pause",ISLE.paused,ISLE.setPaused,function(on){return on?"繼續":"暫停"});
 var bb=tog(".i3-b-bird",ISLE.bird,function(on){ISLE.birdsEye(on);if(on)show(null)});
 /* 時間軸 00:00～24:00；「自動」跟著現在的時間 */
 var rg=st.querySelector(".i3-clock input"),ct=st.querySelector(".i3-ck-t"),au=st.querySelector(".i3-ck-auto");
 function clk(){var h=ISLE.hour();if(ISLE.auto())rg.value=h;ct.textContent=ISLE.hourText()}clk();setInterval(clk,30000);
 rg.addEventListener("input",function(){ISLE.setHour(+rg.value);au.classList.remove("on");au.setAttribute("aria-pressed",false);clk()});
 au.onclick=function(){ISLE.setHour(null);au.classList.add("on");au.setAttribute("aria-pressed",true);clk()};
 tog(".i3-b-folk",ISLE.folksOn,ISLE.setFolks);
 /* 群島日誌：「群島概況」（導覽清單）和「日誌」（即時紀錄）兩個分頁；手機上預設收起來 */
 var LOG=st.querySelector(".i3-log"),lh=st.querySelector(".i3-log-h"),blog=st.querySelector(".i3-b-log");
 function logOpen(on){LOG.hidden=!on;blog.classList.toggle("on",on);blog.setAttribute("aria-pressed",on)}
 blog.onclick=function(){logOpen(LOG.hidden)};st.querySelector(".i3-log-x").onclick=function(){logOpen(false)};
 if(innerWidth<640){LOG.classList.add("shut");lh.setAttribute("aria-expanded",false)}
 lh.onclick=function(){var sh=LOG.classList.toggle("shut");lh.setAttribute("aria-expanded",!sh)};
 Array.prototype.forEach.call(st.querySelectorAll(".i3-log-tabs button"),function(b,_,all){b.onclick=function(){Array.prototype.forEach.call(st.querySelectorAll(".i3-log-tabs button"),function(x){x.classList.toggle("on",x===b);x.setAttribute("aria-selected",x===b)});st.querySelector(".i3-log-sum").hidden=b.dataset.k!=="sum";logl.hidden=b.dataset.k!=="log";LOG.classList.remove("shut")}});
 /* 導覽：像一段短片，一步一步飛到各座島，時間也跟著走 */
 var D0=ISLE.data,TOURS=buildTours();
 function buildTours(){
  var cnt=function(t,g){return ISLE.info[t].filter(function(c){return c.grade===g})},out=[];
  var a=[];for(var g=1;g<=6;g++){var best=D0.themes.map(function(t){return{t:t,cs:cnt(t,g)}}).filter(function(o){return o.cs.length}).sort(function(x,y){return y.cs.length-x.cs.length}).slice(0,2);
   best.forEach(function(o,k){a.push({t:o.t,cid:o.cs[0].id,grade:g,text:"一二三四五六"[g-1]+"年級"+(k?"，也會到":"，先到")+"「"+o.t+"」島："+o.cs.map(function(c){return c.name}).slice(0,2).join("、")+(o.cs.length>2?"⋯":"")})})}
  a.forEach(function(st,i){st.hour=7+i/(a.length-1)*11});out.push({name:"小學六年",desc:"從一年級到六年級，每年會去哪些島",steps:a});
  var b=[],cur="整數與位值",seen={};if(!ISLE.info[cur])cur=D0.themes[0];
  var from=null;while(cur&&b.length<8){seen[cur]=1;b.push({t:cur,text:b.length?"接著是「"+cur+"」島（"+ISLE.info[cur].length+" 章），會用到「"+from+"」島學過的東西":"從「"+cur+"」島出發：數數、位值是一切的起點"});
   var best=null;Object.keys(seen).forEach(function(v){ISLE.neighbors(v).post.forEach(function(e){if(!seen[e.b]&&(!best||e.n>best.n))best=e})});from=best&&best.a;cur=best&&best.b}
  b.forEach(function(st,i){st.hour=8+i*1.5});b.push({t:null,bird:1,hour:20,text:"從上面看：光管就是剛剛走過的先備路線"});out.push({name:"一條先備路線",desc:"順著光管，一座接一座",steps:b});
  var c=[],DN={N:"數與量",S:"空間與形狀",R:"關係",D:"資料與不確定性"};["N","S","R","D"].forEach(function(k,i){var L=D0.groups[k]||[];if(!L.length)return;var top=L.slice().sort(function(x,y){return ISLE.info[y].length-ISLE.info[x].length})[0];c.push({t:top,dom:k,hour:9+i*3,text:DN[k]+"："+L.length+" 座島，最大的是「"+top+"」島（"+ISLE.info[top].length+" 章）"})});
  out.push({name:"四大領域",desc:"數與量、空間與形狀、關係、資料",steps:c});return out}
 var tl=st.querySelector(".i3-tours");TOURS.forEach(function(T,i){var li=NB.h('<li><button type="button"><span class="i3-tn">0'+(i+1)+'</span><b></b><small></small><span class="i3-tp" aria-hidden="true">▶</span></button></li>');li.querySelector("b").textContent=T.name;li.querySelector("small").textContent=T.desc+"・"+T.steps.length+" 站";li.firstChild.onclick=function(){tourStart(i)};tl.appendChild(li)});
 var PL=st.querySelector(".i3-play"),CK=st.querySelector(".i3-clock"),pcap=PL.querySelector(".i3-pl-cap"),pn=PL.querySelector(".i3-pl-n"),pbar=PL.querySelector(".i3-pl-bar i"),ppause=PL.querySelector(".i3-pl-pause");
 function tourStart(i){tourStop(true);TOUR={i:i,k:-1,T:TOURS[i],paused:false,tm:0};show(null);openIdx(false);PL.hidden=false;CK.hidden=true;st.classList.add("touring");ISLE.setInset(innerWidth<640?[0,-.12]:[0,.08]);addLog("開始導覽「"+TOUR.T.name+"」");tourGo(0)}
 function tourGo(k){if(!TOUR)return;clearTimeout(TOUR.tm);var S=TOUR.T.steps;if(k>=S.length){var nm=TOUR.T.name;tourStop();addLog("導覽「"+nm+"」結束");return}
  TOUR.k=k;var x=S[k];pn.textContent=("0"+(k+1)).slice(-2)+" / "+("0"+S.length).slice(-2);pcap.textContent=x.text;pbar.style.width=((k+1)/S.length*100)+"%";
  ISLE.setHour(x.hour);ISLE.setGrade(x.grade||0);ISLE.setDomains(x.dom?[x.dom]:null);
  TOUR.busy=true;if(x.bird)ISLE.birdsEye(true);else if(x.t)ISLE.select(x.t,x.cid);TOUR.busy=false;
  var end=k===S.length-1;PL.querySelector(".i3-pl-next").textContent=end?"完成 ✓":"下一步 →";
  if(!TOUR.paused&&!end)TOUR.tm=setTimeout(function(){tourGo(k+1)},5200)}
 function tourStop(quiet){if(!TOUR)return;clearTimeout(TOUR.tm);TOUR=null;PL.hidden=true;CK.hidden=false;st.classList.remove("touring");ISLE.setInset(null);ISLE.setGrade(GSEL());ISLE.setDomains(domSel());if(au.classList.contains("on"))ISLE.setHour(null);else ISLE.setHour(+rg.value);clk();if(!quiet&&ISLE.bird())ISLE.birdsEye(false)}
 ppause.onclick=function(){if(!TOUR)return;TOUR.paused=!TOUR.paused;ppause.textContent=TOUR.paused?"繼續":"暫停";if(TOUR.paused)clearTimeout(TOUR.tm);else if(TOUR.k<TOUR.T.steps.length-1)TOUR.tm=setTimeout(function(){tourGo(TOUR.k+1)},2500)};
 PL.querySelector(".i3-pl-re").onclick=function(){if(TOUR){ISLE.birdsEye(false);tourGo(0)}};
 PL.querySelector(".i3-pl-x").onclick=function(){tourStop();ISLE.select(null)};
 PL.querySelector(".i3-pl-skip").onclick=function(){if(TOUR)tourGo(TOUR.T.steps.length-1)};
 PL.querySelector(".i3-pl-next").onclick=function(){if(TOUR){if(ISLE.bird())ISLE.birdsEye(false);tourGo(TOUR.k+1)}};
 /* 主題索引：4 個領域，每座島列出章數、探索過打勾，點了就飛過去 */
 var bi=st.querySelector(".i3-b-idx");
 (function(){var D=ISLE.data;idx.appendChild(NB.h('<div class="i3-idx-h"><b>主題索引</b><button type="button" class="i3-x" aria-label="關閉">×</button></div>'));
  var pg0=ISLE.progress();idx.appendChild(NB.h('<p class="meta i3-idx-s">'+pg0.total+' 座主題島、'+pg0.chTotal+' 章。選一座島就會飛過去；下面的領域可以複選，只看那幾區。</p>'));
  var fl=NB.h('<div class="i3-idx-f" role="group" aria-label="只看某些領域（可複選）"></div>');[["N","數與量"],["S","空間與形狀"],["R","關係"],["D","資料與不確定性"]].forEach(function(k){if(!(D.groups[k[0]]||[]).length)return;var b=NB.h('<button type="button" class="i3-dom i3-d'+k[0]+'" aria-pressed="false"></button>');b.dataset.k=k[0];b.textContent=k[1];b.onclick=function(){var on=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",on);b.classList.toggle("sel",on);if(!TOUR)ISLE.setDomains(domSel())};fl.appendChild(b)});idx.appendChild(fl);
  [["N","數與量"],["S","空間與形狀"],["R","關係"],["D","資料與不確定性"]].forEach(function(k){var list=D.groups[k[0]];if(!list||!list.length)return;
   var sec=NB.h('<div class="i3-idx-d"><p class="i3-dom i3-d'+k[0]+'"></p><div></div></div>');sec.firstChild.textContent=k[1]+"（"+list.length+" 島）";
   list.forEach(function(t){var b=NB.h('<button type="button" class="i3-idx-i"><span></span><small></small></button>');b.dataset.t=t;b.firstChild.textContent=(ISLE.explored(t)?"✓ ":"")+t;b.lastChild.textContent=ISLE.info[t].length+" 章";b.onclick=function(){ISLE.select(t);if(innerWidth<900)openIdx(false)};sec.lastChild.appendChild(b)});idx.appendChild(sec)});
  idx.querySelector(".i3-x").onclick=function(){openIdx(false)}})();
 function domSel(){return Array.prototype.filter.call(idx.querySelectorAll(".i3-idx-f button"),function(b){return b.getAttribute("aria-pressed")==="true"}).map(function(b){return b.dataset.k})}
 function openIdx(on){idx.hidden=!on;bi.classList.toggle("on",on);bi.setAttribute("aria-expanded",on);st.classList.toggle("idx-on",on)}
 function markIdx(t){Array.prototype.forEach.call(idx.querySelectorAll(".i3-idx-i"),function(b){b.classList.toggle("on",b.dataset.t===t)});if(t&&ISLE.bird()){bb.classList.remove("on");bb.setAttribute("aria-pressed",false)}}
 bi.onclick=function(){openIdx(idx.hidden)};
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
  {sel:".i3-tb",title:"工具列",text:"「主題索引」列出所有島；「名牌」開關島名；「島民」開關走來走去的小島民；「日誌」開關右下角的群島日誌；「先備線」是島與島之間的光管（藍色先學、黃色接著學）；「暫停」讓時間停下來；「鳥瞰」從正上方看整片群島。"},
  {sel:".i3-clock",title:"時間軸",text:"拖動可以看群島從清晨到深夜的樣子，晚上房子會亮燈；按「自動」就跟著現在的時間。"},
  {sel:".i3-log",title:"群島日誌",text:"「群島概況」裡有三段導覽，按 ▶ 就會自動帶你逛；「日誌」會即時記下島民跳島、說話和天色變化。"}])}

/* 3D 引擎是 module，會比這支程式晚到：等它準備好（最多 4 秒），沒來就用清單 */
function canGL(){try{var c=document.createElement("canvas");return!!(window.WebGLRenderingContext&&(c.getContext("webgl2")||c.getContext("webgl")))}catch(e){return false}}
function render(){
 if(!window.NB_MAP||!canGL()){renderList();homeTour();return}
 if(NB.isle3d)return render3d();
 app.innerHTML='<p class="meta" style="text-align:center;padding:3em 0">群島浮出海面中⋯⋯</p>';
 var done=false,go=function(ok){if(done)return;done=true;if(ok&&NB.isle3d)render3d();else{renderList();homeTour()}};
 window.addEventListener("isle3d-ready",function(){go(true)});setTimeout(function(){go(!!NB.isle3d)},4000)}
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
function homeTour(){if(NB.tour)NB.tour.setup("home",[{title:"歡迎來到數光島筆記本",text:"花一分鐘看看怎麼找單元、怎麼玩。想再看一次，隨時按右下角的 i 圓形按鈕。"},
 {sel:".tabs",title:"選年級",text:"各年級的目錄都在這裡，按一下就切換。"},
 {sel:"details.sheet summary",title:"展開學期",text:"每個學期是一張紙，點一下展開，會看到章與小節。"},
 {sel:".secs .lnk",title:"選一個小節",text:"每個小節都是一頁：先看例題，再動手拖拉，接著看解法，最後挑戰一題。"},
 {sel:".resume",title:"繼續上次",text:"玩過的單元會被記住，按這裡回到上次的地方。"},
 {sel:".maplink",title:"學習地圖",text:"看單元之間怎麼連起來：先學什麼、接著學什麼。"},
 {sel:".chip",title:"學員專區",text:"正式學員在這裡登入，有每日一題、錯題本、模擬卷和積分。"},
 {sel:".themes",title:"外觀與注音",text:"可以切換永晝、永夜或跟隨系統，也能開關注音。"}])}
render();
})();
