/* 導覽頁動畫：全部原創，沒有外部圖片。尊重「減少動態效果」設定。 */
(function(){
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches,NS="http://www.w3.org/2000/svg";
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}function lerp(a,b,t){return a+(b-a)*t}function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function sv(tag,a,p){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
/* 逐字出場：把 .split 裡的每個字包成 span，進入畫面（或一開始）加上 .go */
function split(el){
 (function walk(n){[].slice.call(n.childNodes).forEach(function(c){
  if(c.nodeType===3){var f=document.createDocumentFragment();[].forEach.call(c.nodeValue,function(ch){var s=document.createElement("span");s.className="ch";s.setAttribute("aria-hidden","true");s.textContent=ch;f.appendChild(s)});c.replaceWith(f)}else if(c.nodeType===1&&c.tagName!=="BR")walk(c)})})(el);
 var i=0,d=+el.dataset.d||0;$$(".ch",el).forEach(function(s){s.style.setProperty("--i",i+++d)});
 if(!el.closest("[aria-label]")&&!el.getAttribute("aria-label"))el.setAttribute("aria-label",el.textContent)}
$$(".split").forEach(split);
var io=("IntersectionObserver"in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");if(e.target.classList.contains("split"))e.target.classList.add("go");$$(".split",e.target).forEach(function(s){s.classList.add("go")});io.unobserve(e.target)}})},{threshold:.25}):null;
$$(".rv,.split,.lane2,.mm").forEach(function(e){if(e.closest(".hero2"))return;if(io)io.observe(e);else{e.classList.add("in","go")}});
setTimeout(function(){$$(".hero2 .split").forEach(function(s){s.classList.add("go")})},60);
/* 頂端列 */
var top=$("#top");function onTop(){top.classList.toggle("solid",scrollY>innerHeight*.8)}addEventListener("scroll",onTop,{passive:true});onTop();
/* 主視覺：飄浮的數學符號、滑鼠追光與視差 */
var fl=$("#fl");
for(var i=0;i<110;i++){var e=document.createElement("b");var big=Math.random()<.1,z=big?2.6:Math.random()*1.5+.7;e.style.left=(Math.random()*100)+"%";e.style.top=(Math.random()*74)+"%";e.style.width=e.style.height=z+"px";e.style.setProperty("--t",(2+Math.random()*4)+"s");e.style.setProperty("--s",(-Math.random()*6)+"s");e.style.setProperty("--o",(.35+Math.random()*.6).toFixed(2));if(big)e.className="g";e.dataset.z=(Math.random()*.05+.01).toFixed(3);fl.appendChild(e)}
var hero=$("#hero");
if(!reduce){hero.addEventListener("pointermove",function(ev){var r=hero.getBoundingClientRect(),x=ev.clientX-r.left,y=ev.clientY-r.top;hero.style.setProperty("--mx",x+"px");hero.style.setProperty("--my",y+"px");var cx=x/r.width-.5,cy=y/r.height-.5;$$("b",fl).forEach(function(n){var z=+n.dataset.z;n.style.translate=(-cx*z*600)+"px "+(-cy*z*600)+"px"})})}
/* 逐字亮起的一句話 */
var st=$("#saytext");(function(){var t=st.dataset.t,hl=st.dataset.hl,at=t.indexOf(hl);[].forEach.call(t,function(ch,k){var b=document.createElement("b");b.textContent=ch;if(at>=0&&k>=at&&k<at+hl.length)b.className="hl";st.appendChild(b)})})();
var sayBox=$("#say"),sb=$$("b",st);
/* 加法積木 */
var svg=$("#addsvg"),A=[],B=[],R=[],rods={};
function rod(x,col,y){var g=sv("g",{},svg);sv("rect",{x:0,y:0,width:16,height:110,rx:3,fill:col,"fill-opacity":.85,stroke:"var(--ink)","stroke-width":1.6},g);for(var k=1;k<10;k++)sv("path",{d:"M0 "+k*11+"H16",stroke:"var(--ink)","stroke-opacity":.35,"stroke-width":1},g);g.setAttribute("transform","translate("+x+","+(y||60)+")");return g}
function sq(col){return sv("rect",{width:20,height:20,rx:3,fill:col,"fill-opacity":.9,stroke:"var(--ink)","stroke-width":1.4},svg)}
function tx(x,y,t,sz,anchor){var e=sv("text",{x:x,y:y,"text-anchor":anchor||"middle","font-size":sz||26,fill:"var(--ink)","font-family":"Iansui,Huninn,sans-serif","font-weight":700},svg);e.textContent=t;return e}
var rA=[rod(40,"var(--p2)"),rod(62,"var(--p2)")],rB=rod(400,"var(--p3)"),rN=rod(106,"var(--p1)");
var sA=[0,1,2].map(function(){return sq("var(--p4)")}),sB=[0,1,2,3,4,5,6,7,8].map(function(){return sq("var(--p3)")});
var lA=tx(80,215,"23"),lB=tx(480,215,"19"),plus=tx(300,128,"＋",40),res=tx(520,150,"＝ 42",54);
var slots=function(s){return[170+(s%6)*26,60+Math.floor(s/6)*26]};
var caps=["把 23 和 19 都拆成「幾個十」和「幾個一」。","十和十放在一起，一和一放在一起。","一共有 12 個一。10 個一，可以換成 1 個十！","4 個十，再加 2 個一，所以 23 ＋ 19 ＝ 42。"];
function scene(p){
 var t1=ease(clamp((p-.16)/.28,0,1)),t2=ease(clamp((p-.52)/.2,0,1)),t3=clamp((p-.78)/.14,0,1);
 rB.setAttribute("transform","translate("+lerp(400,84,t1)+",60)");
 sA.forEach(function(e,i){var s=slots(i);place(e,s[0],s[1],i,t2,1)});
 sB.forEach(function(e,i){var s=i+3,to=slots(s),fx=440+(i%3)*26,fy=60+Math.floor(i/3)*26,x=lerp(fx,to[0],t1),y=lerp(fy,to[1],t1);place(e,x,y,s,t2,0)});
 function place(e,x,y,s,t,isA){if(s<10){var cx=114,cy=115;x=lerp(x,cx,t);y=lerp(y,cy,t);e.setAttribute("opacity",1-t);e.setAttribute("transform","translate("+x+","+y+")scale("+lerp(1,.2,t)+")")}else{var k=s-10;x=lerp(x,170+k*26,t);y=lerp(y,60,t);e.setAttribute("fill-opacity",.9);e.setAttribute("transform","translate("+x+","+y+")")}}
 rN.style.opacity=t2;rN.setAttribute("transform","translate("+106+","+lerp(40,60,t2)+")scale("+lerp(.6,1,t2)+")");
 lA.style.opacity=1-t1;lB.style.opacity=1-t1;plus.style.opacity=1-t1;res.style.opacity=t3;res.setAttribute("transform","translate(0,"+(1-t3)*14+")");
 $("#addcap").textContent=caps[p<.16?0:p<.5?1:p<.78?2:3];$("#addbar").style.width=(p*100)+"%"}
/* 捲動進度 */
function prog(el){var r=el.getBoundingClientRect();return clamp(-r.top/(r.height-innerHeight),0,1)}
var sc=$("#scene"),ticking=false;
function frame(){ticking=false;
 var p=prog(sayBox),n=sb.length;sb.forEach(function(b,i){b.classList.toggle("on",reduce||i<p*n*1.25)});
 scene(reduce?1:prog(sc))}
function req(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
addEventListener("scroll",req,{passive:true});addEventListener("resize",req);frame();
/* 數字跳動 */
var th=window.NB_MAP&&NB_MAP.th?Object.keys(NB_MAP.th).length:22;$("#thn").dataset.to=th;
function count(el){var to=+el.dataset.to,t0=null;if(reduce){el.textContent=to;return}function step(t){if(!t0)t0=t;var k=clamp((t-t0)/1400,0,1);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
var io2=("IntersectionObserver"in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){count(e.target);io2.unobserve(e.target)}})},{threshold:.6}):null;
$$(".ngrid b").forEach(function(b){if(io2)io2.observe(b);else b.textContent=b.dataset.to});
/* 試玩一：長方形面積 */
(function(){var s=$("#ar"),W=3,H=2,C=30,O=20,g=sv("g",{},s),h=sv("circle",{r:13,fill:"var(--p1)",stroke:"var(--ink)","stroke-width":2,cursor:"grab"},s),out=$("#arout"),drag=false;
 function draw(){g.innerHTML="";sv("rect",{x:O,y:O,width:W*C,height:H*C,fill:"var(--p2)","fill-opacity":.28,stroke:"var(--ink)","stroke-width":2.2},g);
  for(var i=0;i<=12;i++)sv("path",{d:"M"+(O+i*C)+" "+O+"V"+(O+7*C),stroke:"var(--ink)","stroke-opacity":i<=W?.35:.1,"stroke-width":1},g);
  for(var j=0;j<=7;j++)sv("path",{d:"M"+O+" "+(O+j*C)+"H"+(O+12*C),stroke:"var(--ink)","stroke-opacity":j<=H?.35:.1,"stroke-width":1},g);
  h.setAttribute("cx",O+W*C);h.setAttribute("cy",O+H*C);out.innerHTML="長 <b>"+W+"</b> × 寬 <b>"+H+"</b> ＝ 面積 <b>"+W*H+"</b> 平方公分"}
 function mv(ev){var pt=s.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;var q=pt.matrixTransform(s.getScreenCTM().inverse());W=clamp(Math.round((q.x-O)/C),1,12);H=clamp(Math.round((q.y-O)/C),1,7);draw()}
 s.addEventListener("pointerdown",function(ev){drag=true;s.setPointerCapture(ev.pointerId);mv(ev)});s.addEventListener("pointermove",function(ev){if(drag)mv(ev)});s.addEventListener("pointerup",function(){drag=false});s.addEventListener("pointercancel",function(){drag=false});draw()})();
/* 試玩二：圓形分數 */
(function(){var s=$("#fr"),n=$("#fn"),k=$("#fk"),out=$("#frout");
 function draw(){var N=+n.value;k.max=N;if(+k.value>N)k.value=N;var K=+k.value;s.innerHTML="";var cx=130,cy=100,r=84;
  for(var i=0;i<N;i++){var a0=-Math.PI/2+i*2*Math.PI/N,a1=-Math.PI/2+(i+1)*2*Math.PI/N;
   var d=N===1?"":"M"+cx+" "+cy+"L"+(cx+r*Math.cos(a0))+" "+(cy+r*Math.sin(a0))+"A"+r+" "+r+" 0 0 1 "+(cx+r*Math.cos(a1))+" "+(cy+r*Math.sin(a1))+"Z";
   sv("path",{d:d,fill:i<K?"var(--p1)":"var(--paper2)","fill-opacity":i<K?.8:1,stroke:"var(--ink)","stroke-width":1.8,"stroke-linejoin":"round"},s)}
  out.innerHTML="分成 <b>"+N+"</b> 份，取 <b>"+K+"</b> 份，就是 <b>"+K+"／"+N+"</b>"}
 n.addEventListener("input",draw);k.addEventListener("input",draw);draw()})();
/* 學習地圖預覽：跳島 */
(function(){var lane=$("#lane"),M=window.NB_MAP,list=M&&M.th&&M.th["分數"];if(!list||!window.CATALOG)return;
 var n=list.length,GAP=124,W=n*GAP+60,H=250,pts=[],reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
 var svg=sv("svg",{viewBox:"0 0 "+W+" "+H,width:W,height:H,role:"img","aria-label":"分數這條線的學習路線，從二年級走到六年級"},lane);
 sv("rect",{x:0,y:0,width:W,height:H,"class":"lm-sea"},svg);
 var wv=sv("g",{"class":"lm-waves"},svg);for(var wy=36;wy<H;wy+=42){for(var wx=((wy/42)%2)*50+10;wx<W;wx+=110)sv("path",{d:"M"+wx+" "+wy+"q10 -7 20 0t20 0","class":"wv"},wv)}
 list.forEach(function(k,i){pts.push({x:70+i*GAP,y:H/2+(i%2?-34:26)+Math.sin(i*1.7)*10})});
 var eg=sv("g",{},svg);
 pts.forEach(function(P,i){if(!i)return;var A=pts[i-1],c=Math.min(70,40+Math.abs(P.y-A.y)*.4);var d="M"+(A.x+22)+" "+A.y+"C"+(A.x+60)+" "+(A.y-c)+" "+(P.x-60)+" "+(P.y-c)+" "+(P.x-22)+" "+P.y;var e=sv("path",{d:d,"class":"ln"},eg);e.style.transitionDelay=(i*.22-.1)+"s"});
 list.forEach(function(k,i){var sp=k.split("-"),S=CATALOG.filter(function(x){return x.id===sp[0]})[0],name=S.ch[+sp[1]-1].split("|")[0],P=pts[i];
  var g=sv("g",{"class":"lm-n lpn",transform:"translate("+P.x+","+P.y+") scale(1.9)"},svg);g.style.transitionDelay=(i*.22)+"s";
  sv("ellipse",{cx:0,cy:11,rx:25,ry:8,"class":"rip"},g);sv("path",{d:"M-19 8C-19 1-9 -1 0 -1C10 -1 19 1 19 8C19 14 9 16 0 16C-9 16-19 14-19 8Z","class":"sand"},g);
  sv("path",{d:"M-13 3C-13-7-5-12 1-12C9-12 13-6 13 3C7 6-7 6-13 3Z","class":"isl",fill:"var(--p2)"},g);
  sv("path",{d:"M7 3Q9 -4 8 -12","class":"trk"},g);["M8 -12Q1 -21 -5 -13Q2 -16 8 -12Z","M8 -12Q15 -21 21 -13Q14 -16 8 -12Z","M8 -12Q4 -22 11 -24Q10 -18 8 -12Z"].forEach(function(d){sv("path",{d:d,"class":"plm"},g)});
  var t1=sv("text",{x:P.x,y:P.y+54,"text-anchor":"middle","class":"lpt1"},svg);t1.textContent=S.sem;t1.style.transitionDelay=(i*.22)+"s";
  var t2=sv("text",{x:P.x,y:P.y+74,"text-anchor":"middle","class":"lpt2"},svg);t2.textContent=name.length>8?name.slice(0,7)+"…":name;t2.style.transitionDelay=(i*.22)+"s"});
 /* 小島民沿著弧線跳島 */
 var hb=sv("g",{"class":"lphop"},svg);sv("path",{d:"M-12 0C-16-12-6-24 1-22C11-24 16-10 12 0C6 3-7 3-12 0Z",fill:"#e58a73",stroke:"var(--ink)","stroke-width":1.6,"stroke-linejoin":"round"},hb);
 [[-4,-14],[5,-15]].forEach(function(e){sv("circle",{cx:e[0],cy:e[1],r:4,fill:"#fff",stroke:"var(--ink)","stroke-width":1.2},hb);sv("circle",{cx:e[0]+1,cy:e[1]+1,r:1.7,fill:"var(--ink)"},hb)});sv("path",{d:"M-3 -7q3 3 7 0",fill:"none",stroke:"var(--ink)","stroke-width":1.4,"stroke-linecap":"round"},hb);
 function put(t){var i=Math.min(n-2,Math.floor(t)),u=t-i,A=pts[i],B=pts[i+1],j=u<.4?0:(u-.4)/.6,e=j*j*(3-2*j),x=A.x+(B.x-A.x)*e,y=A.y+(B.y-A.y)*e-Math.sin(Math.PI*j)*(48+Math.abs(B.y-A.y)*.3)-14;hb.setAttribute("transform","translate("+x+","+y+") scale(1.9)")}
 put(0);if(reduce)return;var t0=0,run=false,last=0;function tick(ts){if(!run)return;var d=Math.min(.05,(ts-last)/1000||0);last=ts;t0+=d*.62;if(t0>n-1.01)t0=0;put(t0);requestAnimationFrame(tick)}
 if(window.IntersectionObserver)new IntersectionObserver(function(es){es.forEach(function(e){var on=e.isIntersecting;if(on&&!run){run=true;last=performance.now();requestAnimationFrame(tick)}else if(!on)run=false})}).observe(lane)})();
/* 學習日常小劇場：原創簡筆畫小人 */
function face(type){var s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 100 100");s.setAttribute("aria-hidden","true");
 sv("circle",{cx:50,cy:58,r:34,fill:"var(--paper)",stroke:"var(--ink)","stroke-width":3},s);
 function eyeSpiral(x){sv("circle",{cx:x,cy:52,r:8,fill:"none",stroke:"var(--ink)","stroke-width":2.4},s);sv("path",{d:"M"+x+" 52m-1 0a2 2 0 1 1 2 2",fill:"none",stroke:"var(--ink)","stroke-width":2.2},s)}
 function dot(x){sv("circle",{cx:x,cy:52,r:3.6,fill:"var(--ink)"},s)}
 function arc(x){sv("path",{d:"M"+(x-6)+" 54Q"+x+" 45 "+(x+6)+" 54",fill:"none",stroke:"var(--ink)","stroke-width":2.8,"stroke-linecap":"round"},s)}
 if(type==="spiral"){eyeSpiral(38);eyeSpiral(62);sv("path",{d:"M38 76q6-6 12 0t12 0",fill:"none",stroke:"var(--ink)","stroke-width":2.8,"stroke-linecap":"round"},s)}
 else if(type==="sweat"){dot(38);dot(62);sv("path",{d:"M40 76q10-7 20 0",fill:"none",stroke:"var(--ink)","stroke-width":2.8,"stroke-linecap":"round"},s);sv("path",{d:"M82 36q-7 10 0 14 7-4 0-14z",fill:"var(--p2)","fill-opacity":.7,stroke:"var(--ink)","stroke-width":1.6},s);sv("path",{d:"M28 44l12 3M72 44l-12 3",stroke:"var(--ink)","stroke-width":2.4,"stroke-linecap":"round"},s)}
 else if(type==="bulb"){arc(38);arc(62);sv("path",{d:"M36 70q14 14 28 0",fill:"none",stroke:"var(--ink)","stroke-width":2.8,"stroke-linecap":"round"},s);sv("circle",{cx:50,cy:14,r:9,fill:"var(--p4)",stroke:"var(--ink)","stroke-width":2},s);sv("path",{d:"M46 24h8M47 27h6",stroke:"var(--ink)","stroke-width":2,"stroke-linecap":"round"},s);sv("path",{d:"M50 0v-0M33 8l-5-4M67 8l5-4M30 16h-6M70 16h6",stroke:"var(--p4)","stroke-width":2.4,"stroke-linecap":"round"},s)}
 else{dot(38);dot(62);sv("path",{d:"M34 68q16 20 32 0z",fill:"var(--p1)","fill-opacity":.35,stroke:"var(--ink)","stroke-width":2.6,"stroke-linejoin":"round"},s);sv("circle",{cx:30,cy:66,r:5,fill:"var(--p1)","fill-opacity":.3},s);sv("circle",{cx:70,cy:66,r:5,fill:"var(--p1)","fill-opacity":.3},s)}
 return s}
(function(){var g=$("#mgrid"),D=[["spiral","老師說：「這題很簡單喔。」我的大腦：載入中……","bulb","先看圖，再算，一步一步就懂了。"],["sweat","9 ＋ 3 ＝ 12，那個 1 到底要放哪裡？","happy","10 個一換成 1 個十，看得見就不用硬背。"],["sweat","1/3 和 1/4，4 比較大，所以 1/4 比較大？","bulb","把圓拖開來看：分得越多，每一份越小。"]];
 D.forEach(function(d,i){var c=document.createElement("div");c.className="mm";c.innerHTML='<div class="pn bad"><p></p></div><div class="pn good"><p></p></div>';var b=c.children[0],y=c.children[1];b.insertBefore(face(d[0]),b.firstChild);y.insertBefore(face(d[2]),y.firstChild);b.lastChild.textContent=d[1];y.lastChild.textContent=d[3];c.style.transitionDelay=(i*.1)+"s";g.appendChild(c);if(io)io.observe(c);else c.classList.add("in")})})();
})();
