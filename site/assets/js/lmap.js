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
/* map.html：群島地圖。橫軸是學期，縱軸是領域，每一章是一座小島，先備關係用弧線連起來。 */
var DCOL={N:"var(--p2)",S:"var(--p3)",R:"var(--p5)",D:"var(--p4)"},SVGNS="http://www.w3.org/2000/svg";
function S_(tag,a,p){var e=document.createElementNS(SVGNS,tag);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function closure(k,dir){var seen={},q=[k];while(q.length){var x=q.pop();((dir<0?M.ch[x].p:succ[x])||[]).forEach(function(y){if(!seen[y]){seen[y]=1;q.push(y)}})}return seen}
function trailOf(k){var u=NB.trail.all(),c=chInfo[k].c.secs,seen=0,done=0;c.forEach(function(o){var x=u[o.id];if(x){if(x.v)seen++;if(x.d)done++}});return{seen:seen,done:done,n:c.length}}
function page(){
 var app=document.getElementById("app");app.innerHTML="";
 var bar=NB.h('<nav class="bar"><a class="back" href="'+root+'island.html">← 回到目錄</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);
 app.appendChild(NB.h('<h1 class="title"><mark>學習地圖</mark></h1>'));
 app.appendChild(NB.h('<p class="lead">一座島是一章，弧線是「先學這個，才學得會那個」。點一個領域，整片島群就會亮起那個領域；點一座島，會亮出它前後的整條路，小島民還會跳著帶你走一遍。</p>'));
 app.appendChild(NB.deco.rule());
 var f={dom:"",th:"",cog:"",know:""},sel="",want=new URLSearchParams(location.search).get("c")||"";
 var fb=el("div","lm-filter");app.appendChild(fb);
 var grid=el("div","lm-grid");app.appendChild(grid);var left=el("div");grid.appendChild(left);var wrap=el("div","lm-map");left.appendChild(wrap);left.appendChild(el("p","meta lm-hint","可以上下左右滑動；點島看細節，再點一次取消。"));
 var info=el("div","lm-info");grid.appendChild(info);info.appendChild(el("p","meta","點一座島，這裡會顯示它的小節、先備與接續。"));
 /* ---- 版面 ---- */
 var sems=NB.cat.map(function(x){return x.id}),CW=132,X0=96,doms=["N","S","R","D"],pos={},bandTop={},bandH={},cnt={};
 Object.keys(M.ch).forEach(function(k){var d=M.ch[k].d,c=sems.indexOf(k.split("-")[0]);(cnt[d]=cnt[d]||{});(cnt[d][c]=cnt[d][c]||[]).push(k)});
 var y=52;doms.forEach(function(d){var mx=1;Object.keys(cnt[d]||{}).forEach(function(c){mx=Math.max(mx,cnt[d][c].length)});bandTop[d]=y;bandH[d]=mx*52+60;y+=bandH[d]+22});
 var Wd=X0+sems.length*CW+30,Hd=y;
 doms.forEach(function(d){Object.keys(cnt[d]||{}).forEach(function(c){var arr=cnt[d][c].sort(function(a,b){return +a.split("-")[1]-+b.split("-")[1]}),off=(bandH[d]-60-arr.length*52)/2;arr.forEach(function(k,i){pos[k]={x:X0+(+c)*CW+CW/2-10,y:bandTop[d]+40+off+i*52+20}})})});
 var svg=S_("svg",{viewBox:"0 0 "+Wd+" "+Hd,width:Wd,height:Hd,"class":"mapsvg",role:"img","aria-label":"學習地圖：各領域各章的先備關係"});wrap.appendChild(svg);
 var defs=S_("defs",{},svg);var gl=S_("filter",{id:"lmglow",x:"-60%",y:"-60%",width:"220%",height:"220%"},defs);S_("feGaussianBlur",{stdDeviation:"5",result:"b"},gl);var mg=S_("feMerge",{},gl);S_("feMergeNode",{"in":"b"},mg);S_("feMergeNode",{"in":"SourceGraphic"},mg);
 S_("rect",{x:0,y:0,width:Wd,height:Hd,"class":"lm-sea"},svg);
 var wv=S_("g",{"class":"lm-waves"},svg);for(var wy=70;wy<Hd;wy+=46){for(var wx=((wy/46)%2)*60+20;wx<Wd;wx+=120){S_("path",{d:"M"+wx+" "+wy+"q10 -7 20 0t20 0","class":"wv"},wv)}}
 var bt=S_("g",{"class":"lm-boats","aria-hidden":"true"},svg);[[.18,0],[.5,-22],[.82,-40]].forEach(function(b,i){var by=Math.max(60,Hd*b[0]),g=S_("g",{"class":"lm-boat b"+i,style:"--by:"+by+"px;--dx:"+(Wd+120)+"px;animation-duration:"+(70+i*26)+"s;animation-delay:"+b[1]+"s",transform:"translate(-60,"+by+")"},bt),bb=S_("g",{"class":"bob"},g);S_("path",{d:"M-16 0h32l-6 8h-20z",fill:"#b5835a",stroke:"var(--ink)","stroke-width":1.6,"stroke-linejoin":"round"},bb);S_("path",{d:"M0 -1V-24L13 -3Z",fill:"#fffdf7",stroke:"var(--ink)","stroke-width":1.5,"stroke-linejoin":"round"},bb)});
 var sp=S_("g",{"class":"lm-spark","aria-hidden":"true"},svg);for(var q=0;q<46;q++){var c=S_("circle",{cx:(q*173)%Wd,cy:(q*97)%Hd,r:1.6,style:"animation-delay:"+((q*0.37)%4).toFixed(2)+"s"},sp)}
 /* 學期標頭 */
 NB.cat.forEach(function(S,i){var t=S_("text",{x:X0+i*CW+CW/2-10,y:30,"text-anchor":"middle","class":"lm-sem"},svg);t.textContent=S.sem;if(i&&S.grade!==NB.cat[i-1].grade)S_("path",{d:"M"+(X0+i*CW-10)+" 40V"+(Hd-8),"class":"lm-gl"},svg)});
 /* 領域群島的底 */
 var bands={};doms.forEach(function(d){var g=S_("g",{"class":"lm-band d"+d},svg),t=bandTop[d],h=bandH[d],w=Wd-24;
  var path="M14 "+(t+18)+"Q40 "+t+" 80 "+(t+10)+"T170 "+(t+14)+"T300 "+(t+8)+"T"+(w*.6)+" "+(t+14)+"T"+w+" "+(t+10)+"V"+(t+h-14)+"Q"+(w-40)+" "+(t+h+4)+" "+(w-90)+" "+(t+h-8)+"T"+(w*.55)+" "+(t+h-4)+"T200 "+(t+h-10)+"T14 "+(t+h-6)+"Z";
  S_("path",{d:path,"class":"bd",fill:DCOL[d]},g);var lb=S_("text",{x:20,y:t+30,"class":"lm-dn"},g);lb.textContent=DOM[d];bands[d]=g});
 /* 弧線 */
 var edges=[],eg=S_("g",{"class":"lm-edges"},svg);
 Object.keys(M.ch).forEach(function(k){(M.ch[k].p||[]).forEach(function(p){if(!pos[p]||!pos[k])return;var a=pos[p],b=pos[k],dx=b.x-a.x,d;
   if(Math.abs(dx)<4){var yy=(a.y+b.y)/2;d="M"+(a.x+16)+" "+a.y+"Q"+(a.x+70)+" "+yy+" "+(b.x+16)+" "+b.y}
   else{var c=Math.min(70,30+Math.abs(b.y-a.y)*.25)+Math.abs(dx)*.06;d="M"+(a.x+16)+" "+a.y+"C"+(a.x+dx*.45)+" "+(a.y-c)+" "+(b.x-dx*.45)+" "+(b.y-c)+" "+(b.x-16)+" "+b.y}
   var pe=S_("path",{d:d,"class":"lm-e d"+M.ch[k].d,fill:"none"},eg);edges.push({p:p,k:k,el:pe})})});
 /* 小島（章） */
 var nodes={},ng=S_("g",{"class":"lm-nodes"},svg),last=NB.trail.last(),lastK=last?ckey(last):"";
 Object.keys(pos).forEach(function(k){var P=pos[k],d=M.ch[k].d,t=trailOf(k),g=S_("g",{"class":"lm-n d"+d+(t.seen?" seen":"")+(k===lastK?" here":""),transform:"translate("+P.x+","+P.y+")",tabindex:0,role:"button","aria-label":chInfo[k].label},ng);
  S_("ellipse",{cx:0,cy:11,rx:25,ry:8,"class":"rip"},g);
  S_("path",{d:"M-19 8C-19 1-9 -1 0 -1C10 -1 19 1 19 8C19 14 9 16 0 16C-9 16-19 14-19 8Z","class":"sand"},g);
  S_("path",{d:"M-13 3C-13-7-5-12 1-12C9-12 13-6 13 3C7 6-7 6-13 3Z","class":"isl",fill:DCOL[d]},g);
  S_("path",{d:"M7 3C7-3 6-8 8-13","class":"trk"},g);[[8,-13,3,-17],[8,-13,14,-17],[8,-13,11,-9]].forEach(function(l){S_("path",{d:"M"+l[0]+" "+l[1]+"Q"+(l[0]+(l[2]-l[0])/2)+" "+(l[1]-6)+" "+l[2]+" "+l[3]+"M"+l[0]+" "+l[1]+"L"+l[2]+" "+l[3],"class":"plm"},g)});
  if(t.done)S_("path",{d:"M-6 2l4 4 8-9","class":"ck"},g);
  var tx=S_("text",{y:30,"text-anchor":"middle","class":"lm-nl"},g);var nm=chInfo[k].c.name;tx.textContent=nm.length>7?nm.slice(0,6)+"…":nm;
  var ti=S_("title",{},g);ti.textContent=chInfo[k].label;
  g.addEventListener("click",function(){choose(k)});g.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(k)}});nodes[k]=g});
 /* 小島民：會在島之間跳 */
 var hop=S_("g",{"class":"lm-hop",transform:"translate(-100,-100)"},svg),hb=S_("g",{},hop);
 S_("path",{d:"M-12 0C-16-12-6-24 1-22C11-24 16-10 12 0C6 3-7 3-12 0Z",fill:"var(--p1)",stroke:"var(--ink)","stroke-width":1.6,"stroke-linejoin":"round"},hb);
 [[-4,-14],[5,-15]].forEach(function(e){S_("circle",{cx:e[0],cy:e[1],r:4,fill:"#fff",stroke:"var(--ink)","stroke-width":1.2},hb);S_("circle",{cx:e[0]+1,cy:e[1]+1,r:1.7,fill:"var(--ink)"},hb)});
 S_("path",{d:"M-3 -7q3 3 7 0",fill:"none",stroke:"var(--ink)","stroke-width":1.4,"stroke-linecap":"round"},hb);
 var cur=lastK&&pos[lastK]?lastK:"",anim=0;
 function place(x,y){hop.setAttribute("transform","translate("+x+","+y+")")}
 function jump(to,done,ms){var from=cur&&pos[cur]?pos[cur]:{x:pos[to].x-60,y:pos[to].y-80},T=pos[to],t0=null,dur=ms||(reduce()?1:650);cancelAnimationFrame(anim);
  function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;place(from.x+(T.x-from.x)*e,from.y+(T.y-from.y)*e-14-Math.sin(Math.PI*k)*(34+Math.abs(T.x-from.x)*.12));if(k<1)anim=requestAnimationFrame(step);else{cur=to;place(T.x,T.y-14);done&&done()}}
  anim=requestAnimationFrame(step)}
 function reduce(){return window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches}
 if(cur)place(pos[cur].x,pos[cur].y-14);
 /* ---- 狀態：領域亮起、選中的島、篩選 ---- */
 function match(sid){var m=M.sec[sid];return(!f.cog||m[0]===f.cog)&&(!f.know||m[1]===f.know)}
 var thSet={};
 function paint(){
  thSet={};if(f.th)M.th[f.th].forEach(function(k){thSet[k]=1});
  var up=sel?closure(sel,-1):{},dn=sel?closure(sel,1):{};if(sel){up[sel]=1;dn[sel]=1}
  doms.forEach(function(d){bands[d].classList.toggle("on",f.dom===d);bands[d].classList.toggle("off",!!f.dom&&f.dom!==d)});
  Object.keys(nodes).forEach(function(k){var g=nodes[k],d=M.ch[k].d,lit=true;
   if(f.dom&&d!==f.dom)lit=false;if(f.th&&!thSet[k])lit=false;if((f.cog||f.know)&&!chInfo[k].c.secs.some(function(o){return match(o.id)}))lit=false;
   if(sel&&!(up[k]||dn[k]))lit=false;
   g.classList.toggle("dim",!lit);g.classList.toggle("glow",lit&&(!!f.dom||!!sel||!!f.th));g.classList.toggle("sel",k===sel)});
  edges.forEach(function(e){var dN=M.ch[e.k].d,on=true,hi=false;
   if(f.dom)on=M.ch[e.p].d===f.dom||dN===f.dom;if(f.th)on=on&&thSet[e.p]&&thSet[e.k];
   if(sel){var inUp=up[e.k]&&up[e.p],inDn=dn[e.p]&&dn[e.k];hi=!!(inUp||inDn);on=on&&hi}
   e.el.classList.toggle("dim",!on);e.el.classList.toggle("hi",on&&(hi||!!f.dom||!!f.th))})}
 function choose(k){
  if(sel===k){sel="";info.innerHTML="";info.appendChild(el("p","meta","點一座島，這裡會顯示它的小節、先備與接續。"));paint();return}
  sel=k;paint();jump(k);wrap.scrollTo&&wrap.scrollTo({left:Math.max(0,pos[k].x-wrap.clientWidth/2),top:Math.max(0,pos[k].y-wrap.clientHeight/2),behavior:reduce()?"auto":"smooth"});info.innerHTML="";info.appendChild(detail(k));if(innerWidth<1000)setTimeout(function(){info.scrollIntoView({behavior:"smooth",block:"start"})},350);
  var nb=info.querySelector(".lm-tour");if(nb)nb.onclick=function(){tour(k)}}
 function tour(k){var path=[k],x=k;while((M.ch[x].p||[]).length){x=sort(M.ch[x].p)[0];path.unshift(x)}
  var i=0;(function go(){if(i>=path.length)return;var kk=path[i++];wrap.scrollTo&&wrap.scrollTo({left:Math.max(0,pos[kk].x-wrap.clientWidth/2),top:Math.max(0,pos[kk].y-wrap.clientHeight/2),behavior:reduce()?"auto":"smooth"});jump(kk,function(){setTimeout(go,260)},reduce()?1:560)})()}
 function detail(k){
  var i=chInfo[k],m=M.ch[k],d=el("div","lm-detail");d.appendChild(el("h3",null,i.label));chips(d,k);
  var ul=el("div","lm-secs");i.c.secs.forEach(function(o){var r=el("div","lm-sec"+(match(o.id)?"":" dim")),a=el("a","lnk",o.num+" "+o.title);a.href=NB.link(o);r.appendChild(a);var x=NB.trail.get(o.id);if(x&&x.d)r.appendChild(el("span","lm-st","答對過"));else if(x&&x.v)r.appendChild(el("span","lm-st","看過"));r.appendChild(el("small",null,M.sec[o.id][0]+"・"+M.sec[o.id][1]));ul.appendChild(r)});d.appendChild(ul);
  function row(t,list){if(!list.length)return;var r=el("div","lm-row");r.appendChild(el("b",null,t));list.forEach(function(x){var a=el("a","lnk",chInfo[x].label);a.href="#";a.onclick=function(ev){ev.preventDefault();choose(x)};r.appendChild(a)});d.appendChild(r)}
  row("先學過",sort(m.p||[]));row("接著學",sort(succ[k]||[]));
  var tb=el("button","pen go lm-tour","跳島導覽：從起點走到這裡");tb.type="button";d.appendChild(tb);return d}
 /* ---- 篩選列 ---- */
 function group(label,key,vals){var g=el("div","lm-fg");g.appendChild(el("span","lm-fl",label));[["","全部"]].concat(vals.map(function(v){return Array.isArray(v)?v:[v,v]})).forEach(function(v){var b=el("button","pen"+(f[key]===v[0]?" on":""),v[1]);b.type="button";b.onclick=function(){f[key]=v[0];Array.prototype.forEach.call(g.querySelectorAll(".pen"),function(x){x.classList.toggle("on",x===b)});paint()};g.appendChild(b)});fb.appendChild(g)}
 group("領域","dom",doms.map(function(k){return[k,DOM[k]]}));
 group("認知層次","cog",COG.filter(function(v){return used[v]}));group("知識類型","know",KNOW);
 var tg=el("div","lm-fg");tg.appendChild(el("span","lm-fl","主題線"));var se=el("select");se.setAttribute("aria-label","主題線");se.appendChild(new Option("全部主題","")); Object.keys(M.th).forEach(function(n){se.appendChild(new Option(n,n))});se.onchange=function(){f.th=se.value;paint()};tg.appendChild(se);fb.appendChild(tg);
 paint();
 if(want&&pos[want]){setTimeout(function(){choose(want);wrap.scrollTo&&wrap.scrollTo({left:Math.max(0,pos[want].x-wrap.clientWidth/2)})},80)}
 else if(cur){setTimeout(function(){wrap.scrollTo&&wrap.scrollTo({left:Math.max(0,pos[cur].x-wrap.clientWidth/2)})},80)}}
NB.map={card:card,page:page,info:function(id){var k=ckey(id);return M.ch[k]?{ch:M.ch[k],sec:M.sec[id]}:null}};
})();
