/* 學習地圖：單元頁底部的「前後連貫」卡片，以及 map.html 的主題線地圖。資料在 assets/data/learning-map.js。 */
(function(){
var M=window.NB_MAP;if(!M||!window.NB)return;
var DOM={N:"數與量",S:"空間與形狀",R:"關係",D:"資料與不確定性"},COG=["知識","理解","應用","分析","評鑑","創造"],KNOW=["事實性","概念性","程序性","後設認知"],CN="一二三四五六七八九十",
 root=document.body.getAttribute("data-root")||"./";
var chInfo={},succ={},used={};Object.keys(M.sec).forEach(function(k){used[M.sec[k][0]]=1});
NB.cat.forEach(function(S){S.chs.forEach(function(c){var k=S.id+"-"+c.no;chInfo[k]={key:k,S:S,c:c,label:S.sem+" 第"+CN[c.no-1]+"章 "+c.name,short:S.sem+" "+c.no+" "+c.name}})});
Object.keys(M.ch).forEach(function(k){(M.ch[k].p||[]).forEach(function(p){(succ[p]=succ[p]||[]).push(k)})});
function ckey(id){return String(id).replace(/\.\d+$/,"")}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function chLink(k){var i=chInfo[k];if(!i)return null;var a=el("a","lnk",i.label);a.href=NB.link(i.c.secs[0]);return a}
function sort(a){return a.slice().sort(function(x,y){return NB.sortIds([x+".1",y+".1"])[0]===x+".1"?-1:1})}
function stage(g){return g<=2?"I":g<=4?"II":"III"}
function perf(k){var i=chInfo[k],m=M.ch[k];return m.d.toLowerCase()+"-"+stage(i.S.grade)}
function chips(parent,k,sid){
 var m=M.ch[k],i=chInfo[k],g=[["領域",DOM[m.d]+"（"+m.d+"）"],["學習內容",m.c.length?m.c.join("、"):"（依該年級課綱）"],["學習表現",perf(k)+"（第"+({I:"一",II:"二",III:"三"}[stage(i.S.grade)])+"學習階段）"]];
 if(sid&&M.sec[sid]){g.push(["認知層次",M.sec[sid][0]]);g.push(["知識類型",M.sec[sid][1]])}
 var d=el("div","lm-tags");g.forEach(function(x){var r=el("span","lm-tag");r.appendChild(el("small",null,x[0]));r.appendChild(el("b",null,x[1]));d.appendChild(r)});parent.appendChild(d)}
/* 單元頁底部 */
function card(app,id){
 var k=ckey(id),m=M.ch[k];if(!m)return;
 var s=el("section","sheet lmap"),h=el("h2");h.appendChild(el("span","tag","學習地圖"));h.appendChild(document.createTextNode("前後連貫"));s.appendChild(h);
 function row(t,list){if(!list.length)return;var r=el("div","lm-row");r.appendChild(el("b",null,t));list.forEach(function(x){var a=chLink(x);if(a)r.appendChild(a)});s.appendChild(r)}
 row("先學過",sort(m.p||[]));row("接著學",sort(succ[k]||[]));
 if(!(m.p||[]).length&&!(succ[k]||[]).length)s.appendChild(el("p","meta","這一章是獨立的起點。"));
 var d=el("details","lm-det"),sm=el("summary",null,"課綱對照（領域、學習內容、認知層次、知識類型）");d.appendChild(sm);chips(d,k,id);
 d.appendChild(el("p","meta","認知層次與知識類型是依小節名稱的建議標記，供備課與出卷參考。"));s.appendChild(d);
 var a=el("a","lnk lm-all","看整張學習地圖");a.href=root+"map.html?c="+encodeURIComponent(k);s.appendChild(a);
 var nv=app.querySelector("nav.bar:last-of-type");if(nv&&nv.parentNode===app&&app.lastElementChild===nv)app.insertBefore(s,nv);else app.appendChild(s)}
/* map.html */
function trailOf(k){var u=NB.trail.all(),c=chInfo[k].c.secs,seen=0,done=0;c.forEach(function(o){var x=u[o.id];if(x){if(x.v)seen++;if(x.d)done++}});return{seen:seen,done:done,n:c.length}}
function page(){
 var app=document.getElementById("app");app.innerHTML="";
 var bar=NB.h('<nav class="bar"><a class="back" href="'+root+'index.html">← 回到目錄</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);
 app.appendChild(NB.h('<h1 class="title"><mark>學習地圖</mark></h1>'));
 app.appendChild(NB.h('<p class="lead">每一條線是一個主題，從低年級一路連到高年級。點一個節點，看它的小節、先備單元與課綱對照；有玩過的地方會留下記號。</p>'));
 app.appendChild(NB.deco.rule());
 var f={dom:"",cog:"",know:""},want=new URLSearchParams(location.search).get("c")||"";
 var fb=el("div","lm-filter");app.appendChild(fb);var lanes=el("div","lm-lanes");app.appendChild(lanes);
 function group(label,key,vals,all){var g=el("div","lm-fg");g.appendChild(el("span","lm-fl",label));[["","全部"]].concat(vals.map(function(v){return Array.isArray(v)?v:[v,v]})).forEach(function(v){var b=el("button","pen"+(f[key]===v[0]?" on":""),v[1]);b.onclick=function(){f[key]=v[0];draw()};g.appendChild(b)});fb.appendChild(g)}
 function match(sid){var m=M.sec[sid];return(!f.cog||m[0]===f.cog)&&(!f.know||m[1]===f.know)}
 function detail(k){
  var i=chInfo[k],m=M.ch[k],d=el("div","lm-detail");d.appendChild(el("h3",null,i.label));chips(d,k);
  var ul=el("div","lm-secs");i.c.secs.forEach(function(o){var r=el("div","lm-sec"+(match(o.id)?"":" dim")),a=el("a","lnk",o.num+" "+o.title);a.href=NB.link(o);r.appendChild(a);var x=NB.trail.get(o.id);if(x&&x.d)r.appendChild(el("span","lm-st","答對過"));else if(x&&x.v)r.appendChild(el("span","lm-st","看過"));r.appendChild(el("small",null,M.sec[o.id][0]+"・"+M.sec[o.id][1]));ul.appendChild(r)});d.appendChild(ul);
  function row(t,list){if(!list.length)return;var r=el("div","lm-row");r.appendChild(el("b",null,t));list.forEach(function(x){var a=chLink(x);if(a)r.appendChild(a)});d.appendChild(r)}
  row("先學過",sort(m.p||[]));row("接著學",sort(succ[k]||[]));return d}
 function draw(){
  fb.innerHTML="";group("領域","dom",Object.keys(DOM).map(function(k){return[k,DOM[k]]}));group("認知層次","cog",COG.filter(function(v){return used[v]}));group("知識類型","know",KNOW);
  lanes.innerHTML="";var last=NB.trail.last(),lastK=last?ckey(last):"",opened="";
  Object.keys(M.th).forEach(function(name){
   var list=sort(M.th[name]),cnt={};list.forEach(function(k){cnt[M.ch[k].d]=(cnt[M.ch[k].d]||0)+1});
   var dom=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]})[0];if(f.dom&&dom!==f.dom)return;
   var s=el("section","sheet lane"),h=el("h2");h.appendChild(el("span","tag",DOM[dom]));h.appendChild(document.createTextNode(name));s.appendChild(h);
   var row=el("div","lm-row2"),slot=el("div");
   list.forEach(function(k,ix){
    if(ix)row.appendChild(el("span","lm-arrow","→"));
    var t=trailOf(k),hit=chInfo[k].c.secs.some(function(o){return match(o.id)}),b=el("button","lm-node d"+M.ch[k].d+(hit?"":" dim")+(t.seen?" seen":"")+(k===lastK?" here":""));
    b.appendChild(el("small",null,chInfo[k].S.sem));b.appendChild(el("b",null,chInfo[k].c.name));
    b.appendChild(el("em",null,t.seen?("已玩 "+t.seen+"／"+t.n+(t.done?"，答對 "+t.done:"")):("共 "+t.n+" 節")));
    b.onclick=function(){var open=slot.dataset.k===k;slot.innerHTML="";slot.dataset.k=open?"":k;if(!open)slot.appendChild(detail(k))};
    row.appendChild(b);if(want===k&&!opened){opened=k;slot.dataset.k=k;slot.appendChild(detail(k))}});
   s.appendChild(row);s.appendChild(slot);lanes.appendChild(s)});
  if(!lanes.children.length)lanes.appendChild(el("p","meta","這個領域目前沒有主題線。"));
  if(opened){var n=lanes.querySelector(".lm-detail");if(n)setTimeout(function(){n.scrollIntoView({block:"center"})},50);want=""}}
 draw()}
NB.map={card:card,page:page,info:function(id){var k=ckey(id);return M.ch[k]?{ch:M.ch[k],sec:M.sec[id]}:null}};
})();
