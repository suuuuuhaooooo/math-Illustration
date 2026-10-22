/* 首頁：依年級列出目錄（章名……共 N 小節）。打開某個學期時，才去偵測哪些單元檔存在。 */
(function(){
var app=document.getElementById("app"),CN="一二三四五六七八九十",probed={},rows={},grade=3;
try{var sg=parseInt(localStorage.getItem("currentGrade"));if([1,2,3,4,5,6].indexOf(sg)>=0)grade=sg}catch(e){}
function done(c){return c.secs.filter(function(o){return NB.built[o.id]}).length}
function chapText(c){var k=done(c);return"共 "+c.secs.length+" 小節"+(k?"・已完成 "+k:"")}
function semText(S){var t=0,n=0;S.chs.forEach(function(c){t+=c.secs.length;n+=done(c)});return"共 "+t+" 小節"+(n?"・已完成 "+n:"")}
function probe(S){if(probed[S.id])return;probed[S.id]=1;S.chs.forEach(function(c){c.secs.forEach(function(o){NB.load(o.id,null,null)})})}
NB.onProbe=function(id){var r=rows[id];if(!r)return;var o=NB.flat.filter(function(x){return x.id===id})[0],a=NB.h('<a class="lnk" href="'+NB.link(o)+'"></a>');a.textContent=r.t.textContent;r.t.replaceWith(a);r.t=a;r.cnt.textContent=chapText(r.c);r.sum.textContent=semText(r.S)};
function showNotice(el){
 var api=(window.NB_CONFIG&&NB_CONFIG.api)||"";if(!api||!window.fetch)return;
 function dstr(ts){if(!ts)return"";var d=new Date(ts+8*36e5);return d.getUTCFullYear()+"-"+("0"+(d.getUTCMonth()+1)).slice(-2)+"-"+("0"+d.getUTCDate()).slice(-2)}
 function item(a){var n=document.createElement("div");n.className="notice "+(a.level==="warn"?"warn":"info");
  var t=document.createElement("b");t.textContent=(a.pin?"置頂｜":"")+(a.title||(a.level==="warn"?"注意":"公告"));n.appendChild(t);
  var p=document.createElement("span");p.textContent=a.text;n.appendChild(p);
  var m=[];if(a.ts)m.push("發布 "+dstr(a.ts));if(a.until)m.push("公告至 "+a.until);
  if(m.length){var sm=document.createElement("small");sm.textContent=m.join("・");n.appendChild(sm)}
  return n}
 fetch(api+"/api/announce").then(function(r){return r.ok?r.json():null}).then(function(j){
  var L=j&&(j.list||(j.a?[j.a]:[]));if(!L||!L.length)return;
  el.hidden=false;var SHOW=3;
  L.slice(0,SHOW).forEach(function(a){el.appendChild(item(a))});
  if(L.length>SHOW){var lk=document.createElement("a");lk.className="lnk noticemore";lk.href="announcements.html";lk.textContent="查看全部公告（共 "+L.length+" 則）";el.appendChild(lk)}
 }).catch(function(){})}
function render(){
 app.innerHTML="";rows={};
 var bar=NB.h('<nav class="bar"><span class="brand">'+NB.deco.logo()+'數學筆記本</span></nav>');if(NB.member)bar.appendChild(NB.member.chip());bar.appendChild(NB.themeBar());app.appendChild(bar);app.appendChild(NB.h('<div class="ruler"></div>'));
 var hero=NB.h('<section class="hero"><div><p class="eyebrow">國小數學・圖解與互動</p><h1 class="title">看懂數學，<mark>動手玩一玩</mark></h1><p class="lead">從例題出發，拖拉、旋轉、疊一疊，把算式變成看得見的圖形。適用國小一至六年級。</p></div></section>');hero.appendChild(NB.deco.hero());app.appendChild(hero);
 var nt=NB.h('<div class="notices" hidden></div>');app.appendChild(nt);showNotice(nt);
 app.appendChild(NB.h('<section class="feats" aria-label="特色"><div class="feat"><b>01</b><h3>看懂</h3><p>每個單元從一個例題出發，用手繪圖解一步一步拆開算式，先理解，再計算。</p></div><div class="feat"><b>02</b><h3>動手</h3><p>拖拉、旋轉、疊一疊，自己操作圖形，從錯誤中修正想法。</p></div><div class="feat"><b>03</b><h3>練習</h3><p>班級學員可使用小測驗、每日一題、錯題本與模擬卷，累積積分與勳章，並可列印練習卷。</p></div></section>'));
 app.appendChild(NB.deco.rule());
 var tabs=NB.h('<div class="tabs"></div>');
 [1,2,3,4,5,6].forEach(function(g){var b=NB.h('<button class="pen'+(grade===g?" on":"")+'">'+"一二三四五六"[g-1]+'年級</button>');b.onclick=function(){grade=g;try{localStorage.setItem("currentGrade",g)}catch(e){}render()};tabs.appendChild(b)});
 app.appendChild(tabs);
 var list=NB.cat.filter(function(S){return S.grade===grade});
 list.forEach(function(S,k){
  var d=NB.h('<details class="sheet"><summary><span class="tag">'+S.sem+'</span><small></small></summary></details>'),sum=d.querySelector("small");sum.textContent=semText(S);
  S.chs.forEach(function(c){
   var p=NB.h('<div class="chap"><span class="no">第'+CN[c.no-1]+'章</span><b>'+c.name+'</b><span class="dots"></span><span class="cnt"></span></div>'),cnt=p.querySelector(".cnt"),ul=NB.h('<div class="secs"></div>');cnt.textContent=chapText(c);
   c.secs.forEach(function(o){var t=NB.h('<span class="todo">'+o.num+" "+o.title+'</span>');ul.appendChild(t);rows[o.id]={t:t,c:c,S:S,cnt:cnt,sum:sum}});
   d.appendChild(p);d.appendChild(ul)});
  d.addEventListener("toggle",function(){if(d.open)probe(S)});
  app.appendChild(d);if(k===0)d.open=true});
 Object.keys(NB.built).forEach(function(id){NB.onProbe(id)});
 if(list[0])probe(list[0]);
 app.appendChild(NB.h('<p class="meta" style="text-align:center">虛線＝建置中　實線＝可以開始玩　選擇年級後展開學期即可查看各單元</p>'));
}
render();
})();
