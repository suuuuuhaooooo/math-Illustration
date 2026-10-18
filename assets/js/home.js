/* 首頁：依年級列出目錄。打開某個學期時，才去偵測哪些單元檔存在。 */
(function(){
var savedGrade = parseInt(sessionStorage.getItem("currentGrade")) || 3;
var app=document.getElementById("app"),grade=3,probed={},rows={};
function probe(S,sum){
 if(!probed[S.id]){probed[S.id]=1;var n=0,tot=0;
  S.chs.forEach(function(c){c.secs.forEach(function(o){tot++;NB.load(o.id,null,null)})});}
 count(S,sum)}
function count(S,sum){var n=0,t=0;S.chs.forEach(function(c){c.secs.forEach(function(o){t++;if(NB.built[o.id])n++})});sum.querySelector("small").textContent="已完成 "+n+" / "+t}
NB.onProbe=function(id){var r=rows[id];if(!r)return;var a=NB.h('<a class="lnk" href="'+NB.link(NB.flat.filter(function(o){return o.id===id})[0])+'"></a>');a.textContent=r.t.textContent;a.title="開始";r.t.replaceWith(a);
 NB.mk("path",{d:"M3 9l4 4 8-9",fill:"none",stroke:"var(--p3)"},NB.s("svg",{viewBox:"0 0 18 16",width:18,height:16,class:"ck"},a),3);
 var d=r.d.querySelector("summary");count(r.S,d)};
function render(){
 app.innerHTML="";rows={};
 var bar=NB.h('<nav class="bar"><span class="brand">數學筆記本</span></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);
 app.appendChild(NB.h('<h1 class="title">看懂數學，<mark>動手玩一玩</mark></h1>'));
 app.appendChild(NB.h('<p class="lead">國小三到六年級・手繪圖解、立體互動、練習挑戰</p>'));
 var tabs=NB.h('<div class="tabs"></div>');
 [3,4,5,6].forEach(function(g){var b=NB.h('<button class="pen'+(grade===g?" on":"")+'">'+"三四五六"[g-3]+'年級</button>');b.onclick=function(){grade=g;sessionStorage.setItem("currentGrade", g);render()};tabs.appendChild(b)});
 app.appendChild(tabs);
 NB.cat.filter(function(S){return S.grade===grade}).forEach(function(S,k){
  var d=NB.h('<details class="sheet"><summary><span class="tag">'+S.sem+'</span><small></small></summary></details>');
  S.chs.forEach(function(c){var p=NB.h('<div class="chap"><span>第'+"一二三四五六七八九十"[c.no-1]+'章</span><b>'+c.name+'</b></div>'),ul=NB.h('<div class="secs"></div>');
   c.secs.forEach(function(o){var t=NB.h('<span class="todo">'+o.num+" "+o.title+'</span>');ul.appendChild(t);rows[o.id]={t:t,d:d,S:S}});
   d.appendChild(p);d.appendChild(ul)});
  d.addEventListener("toggle",function(){if(d.open)probe(S,d.querySelector("summary"))});
  app.appendChild(d);if(k===0){d.open=true}});
 NB.cat.filter(function(S){return S.grade===grade}).forEach(function(S){if(probed[S.id]){}});
 Object.keys(NB.built).forEach(function(id){NB.onProbe(id)});
 var first=app.querySelector("details");if(first)probe(NB.cat.filter(function(S){return S.grade===grade})[0],first.querySelector("summary"));
 app.appendChild(NB.h('<p class="meta" style="text-align:center">灰色虛線＝建置中；打勾＝可以玩了</p>'));
}
render();
})();
