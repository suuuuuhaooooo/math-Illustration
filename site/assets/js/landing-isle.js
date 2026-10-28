/* 導覽頁的島嶼：故意畫得歪歪的、有點醜的手繪風。燈塔會掃光，島民的眼睛會跟著指標轉，點他們會說話。全部原創 SVG。 */
(function(){
var NS="http://www.w3.org/2000/svg",$=function(s){return document.querySelector(s)};
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches,INK="#101a2e";
function sv(tag,a,p){var e=document.createElementNS(NS,tag);for(var k in a){if(k==="fill"&&/^var\(/.test(a[k]))e.style.fill=a[k];else e.setAttribute(k,a[k])}if(p)p.appendChild(e);return e}
function wave(y,amp,w,fill,cls,p){var d="M-1400 "+y,n=Math.ceil((w+1400)/100);for(var i=0;i<n;i++)d+="q25 "+(-amp)+" 50 0t50 0";d+="V400H-1400Z";return sv("path",{d:d,fill:fill,"class":cls},p)}
function eye(p,cx,cy,r){var g=sv("g",{"class":"eye","data-r":r},p);sv("circle",{cx:cx,cy:cy,r:r,fill:"#fff",stroke:INK,"stroke-width":2.4},g);sv("circle",{"class":"pu",cx:cx,cy:cy,r:r*.45,fill:INK},g);return g}
function blob(p,x,y,sc,col,rl,rr,mood){
 var g=sv("g",{"class":"blob",transform:"translate("+x+","+y+")scale("+sc+")",tabindex:0,role:"img","aria-label":"島民"},p),b=sv("g",{"class":"bi"},g);
 sv("path",{d:"M-34 0C-44-30-20-60 2-56C30-60 46-28 36 0C20 7-18 9-34 0Z",fill:col,stroke:INK,"stroke-width":3,"stroke-linejoin":"round"},b);
 sv("path",{d:"M-30 0v10M-8 6v9M18 5v10",stroke:INK,"stroke-width":3,"stroke-linecap":"round"},b);
 eye(b,-12,-34,rl);eye(b,15,-37,rr);
 sv("path",{d:mood==="o"?"M-4 -16q6 -7 12 0q-6 7 -12 0z":mood==="w"?"M-12 -17q8 10 22 -4":"M-10 -14q8 5 17 -3",fill:mood==="o"?INK:"none",stroke:INK,"stroke-width":2.8,"stroke-linecap":"round"},b);
 sv("path",{d:"M-34 -20q-12 -8 -16 -22M36 -22q10 -10 12 -24",fill:"none",stroke:INK,"stroke-width":3,"stroke-linecap":"round"},b);
 return g}
/* ---- 主視覺的島 ---- */
var hero=$("#hero"),box=document.createElement("div");box.className="isle";box.setAttribute("aria-hidden","false");hero.appendChild(box);
var s=sv("svg",{viewBox:"0 0 1200 320",preserveAspectRatio:"xMidYMax slice","class":"isvg"},box);function par(){s.setAttribute("preserveAspectRatio",innerWidth>900?"xMidYMax meet":"xMidYMax slice")}par();addEventListener("resize",par);
var df=sv("defs",{},s),lg=sv("linearGradient",{id:"beam",x1:0,x2:1,y1:0,y2:0},df);sv("stop",{offset:0,"stop-color":"#ffe9a0","stop-opacity":.75},lg);sv("stop",{offset:1,"stop-color":"#ffe9a0","stop-opacity":0},lg);
var lg2=sv("linearGradient",{id:"beam2",x1:1,x2:0,y1:0,y2:0},df);sv("stop",{offset:0,"stop-color":"#ffe9a0","stop-opacity":.75},lg2);sv("stop",{offset:1,"stop-color":"#ffe9a0","stop-opacity":0},lg2);
sv("polygon",{points:"640,108 1500,30 1500,118","class":"beam b1",fill:"url(#beam)"},s);
sv("polygon",{points:"640,108 -300,30 -300,118","class":"beam b2",fill:"url(#beam2)"},s);
var hg=sv("radialGradient",{id:"hglow",cx:"50%",cy:"100%",r:"60%"},df);sv("stop",{offset:0,"stop-color":"#e9b85a","stop-opacity":.28},hg);sv("stop",{offset:1,"stop-color":"#e9b85a","stop-opacity":0},hg);
sv("rect",{x:0,y:120,width:1200,height:200,fill:"url(#hglow)"},s);
sv("path",{d:"M-20 262C40 236 90 226 140 244C170 222 214 214 252 240C290 232 330 246 360 262Z",fill:"var(--lp-hill,#142340)"},s);
sv("path",{d:"M980 262C1010 232 1060 214 1110 230C1150 218 1190 236 1230 262Z",fill:"var(--lp-hill,#142340)"},s);
sv("path",{d:"M150 266C200 250 250 246 300 262Z",fill:"var(--lp-hill2,#0f1b33)"},s);
sv("path",{d:"M900 266C930 252 980 248 1020 266Z",fill:"var(--lp-hill2,#0f1b33)"},s);
wave(262,10,2600,"var(--lp-wv1,#16294a)","wv w1",s);
/* 小船 */
var bt=sv("g",{"class":"boat"},s);sv("path",{d:"M990 266h62l-10 18h-42z",fill:"#9a6b3c",stroke:INK,"stroke-width":3,"stroke-linejoin":"round"},bt);sv("path",{d:"M1022 262V206L1060 262z",fill:"#f6f0e2",stroke:INK,"stroke-width":3,"stroke-linejoin":"round"},bt);sv("path",{d:"M1022 206v-12",stroke:INK,"stroke-width":3},bt);
/* 島 */
sv("path",{d:"M290 272C322 214 420 190 520 188C600 178 700 180 790 192C884 202 936 238 958 272Z",fill:"#e3c27a",stroke:INK,"stroke-width":3.5,"stroke-linejoin":"round"},s);
sv("path",{d:"M330 232C400 196 520 190 640 186C760 184 880 200 925 236C860 214 760 206 650 208C520 210 420 214 330 232Z",fill:"#4f8c6e",stroke:INK,"stroke-width":3,"stroke-linejoin":"round"},s);
/* 椰子樹（歪的） */
var pm=sv("g",{"class":"palm"},s);sv("path",{d:"M470 196C452 160 474 132 450 100",fill:"none",stroke:"#9a6b3c","stroke-width":12,"stroke-linecap":"round"},pm);sv("path",{d:"M470 196C452 160 474 132 450 100",fill:"none",stroke:INK,"stroke-width":2,"stroke-dasharray":"2 10","stroke-linecap":"round"},pm);
["M450 100C420 66 378 78 362 106C396 94 426 100 450 100Z","M450 100C446 62 410 40 380 48C410 62 432 80 450 100Z","M450 100C470 60 508 48 536 64C504 66 478 80 450 100Z","M450 100C486 84 528 100 540 128C512 108 482 104 450 100Z","M450 100C430 120 398 126 380 148C410 140 436 126 450 100Z"].forEach(function(d){sv("path",{d:d,fill:"#7fc3a0",stroke:INK,"stroke-width":2.6,"stroke-linejoin":"round"},pm)});
sv("circle",{cx:444,cy:108,r:7,fill:"#9a6b3c",stroke:INK,"stroke-width":2.2},pm);sv("circle",{cx:459,cy:111,r:6,fill:"#9a6b3c",stroke:INK,"stroke-width":2.2},pm);
/* 燈塔（光）*/
var lh=sv("g",{"class":"lh"},s);sv("polygon",{points:"610,266 623,124 659,124 672,266",fill:"#f6f0e2",stroke:INK,"stroke-width":3.2,"stroke-linejoin":"round"},lh);
sv("polygon",{points:"615,222 667,222 670,244 612,244",fill:"#bf5b43","fill-opacity":.9,stroke:INK,"stroke-width":2.4},lh);sv("polygon",{points:"620,160 662,160 665,182 618,182",fill:"#bf5b43","fill-opacity":.9,stroke:INK,"stroke-width":2.4},lh);
sv("rect",{x:619,y:96,width:44,height:28,rx:3,fill:"#ecc566",stroke:INK,"stroke-width":3},lh);sv("polygon",{points:"612,96 641,70 670,96",fill:"#bf5b43",stroke:INK,"stroke-width":3,"stroke-linejoin":"round"},lh);
sv("circle",{cx:641,cy:110,r:16,"class":"lamp",fill:"#fff3c4","fill-opacity":.75},lh);
/* 島民 */
var bl=[blob(s,530,236,.95,"#78a9e0",12,8,"w"),blob(s,742,230,.82,"#e58a73",8,12,"o"),blob(s,858,246,.72,"#7fc3a0",11,11,"s")];
wave(284,12,2600,"var(--lp-wv2,#1b3560)","wv w2",s);
/* 月亮（一隻大眼睛）*/
var mo=document.createElement("div");mo.className="moon";hero.appendChild(mo);
var ms=sv("svg",{viewBox:"0 0 120 120","aria-hidden":"true"},mo);sv("path",{d:"M78 14C46 12 20 38 22 68C24 98 54 112 80 104C52 96 46 56 62 36C68 28 74 20 78 14Z",fill:"var(--lp-moon,#f3e3a6)",stroke:INK,"stroke-width":3,"stroke-linejoin":"round"},ms);eye(ms,52,60,10);sv("path",{d:"M44 82q8 5 18-2",fill:"none",stroke:INK,"stroke-width":2.6,"stroke-linecap":"round"},ms);
/* ---- 結尾的島民 ---- */
var fin=$("#finisle");
if(fin){var fs=sv("svg",{viewBox:"0 -70 520 220",preserveAspectRatio:"xMidYMax meet","aria-hidden":"true"},fin);wave(122,8,1400,"var(--lp-wv2,#1b3560)","wv w2",fs);blob(fs,150,118,1.1,"#78a9e0",12,8,"w");blob(fs,270,114,1.25,"#e58a73",9,13,"o");blob(fs,390,118,1.05,"#7fc3a0",11,11,"s");wave(138,9,1400,"var(--lp-wv1,#16294a)","wv w1",fs)}
/* ---- 說話與點擊 ---- */
var lines=["路過的，進來玩玩吧！","拖一下，我就懂了","數學不可怕，我才可怕","按下面的按鈕上島","燈塔是為你亮的","你的眼睛在看我嗎","一二三，點我一下"],li=0;
function say(g,text,ms){if(!g.ownerSVGElement||g.parentNode!==s)return;var old=s.querySelector(".say");if(old)old.remove();
 var tr=g.getAttribute("transform").match(/translate\(([-\d.]+),([-\d.]+)\)/),x=+tr[1],y=+tr[2]-92,w=text.length*21+26,bx=Math.max(w/2+6,Math.min(1200-w/2-6,x)),bg=sv("g",{"class":"say"},s);
 sv("rect",{x:bx-w/2,y:y-30,width:w,height:36,rx:14,fill:"#fffdf7",stroke:INK,"stroke-width":2.6},bg);sv("path",{d:"M"+(x-6)+" "+(y+5)+"l6 14l8-14",fill:"#fffdf7",stroke:INK,"stroke-width":2.6,"stroke-linejoin":"round"},bg);sv("rect",{x:x-5,y:y+2,width:14,height:5,fill:"#fffdf7"},bg);
 var t=sv("text",{x:bx,y:y-6,"text-anchor":"middle","font-size":20,fill:INK,"font-family":"Iansui,Huninn,sans-serif","font-weight":700},bg);t.textContent=text;var br=bg.getBoundingClientRect();[].forEach.call(document.querySelectorAll(".hero2 .cta,.hero2 .trust,.hero2 .lead2"),function(e){var r=e.getBoundingClientRect();if(br.bottom>r.top&&br.top<r.bottom&&br.right>r.left&&br.left<r.right)bg.style.display="none"});setTimeout(function(){bg.remove()},ms||2600)}
function hop(g){var b=g.querySelector(".bi");b.classList.remove("hop");void b.getBoundingClientRect();b.classList.add("hop")}
function bind(g,sayIt){g.addEventListener("click",function(){hop(g);if(sayIt)say(g,lines[li++%lines.length])});g.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();g.dispatchEvent(new Event("click"))}})}
bl.forEach(function(g){bind(g,true)});if(fin)[].forEach.call(fin.querySelectorAll(".blob"),function(g){bind(g,false)});
if(!reduce){setInterval(function(){var r=hero.getBoundingClientRect();if(r.bottom>innerHeight*.35&&r.top<innerHeight*.5&&!document.hidden){var g=bl[li%3];say(g,lines[li++%lines.length])}},4200);setTimeout(function(){say(bl[0],lines[0])},2600)}
/* ---- 眼睛跟著指標；沒動的時候自己亂看，還會眨眼 ---- */
var eyes=[].slice.call(document.querySelectorAll(".eye")),px=null,py=null,idle=0;
function look(tx,ty){eyes.forEach(function(g){var c=g.firstChild.getBoundingClientRect(),r=+g.dataset.r,cx=c.left+c.width/2,cy=c.top+c.height/2,a=Math.atan2(ty-cy,tx-cx),d=Math.min(r*.5,Math.hypot(tx-cx,ty-cy)/6);g.querySelector(".pu").setAttribute("transform","translate("+Math.cos(a)*d+","+Math.sin(a)*d+")")})}
addEventListener("pointermove",function(e){px=e.clientX;py=e.clientY;idle=0;look(px,py)},{passive:true});
setInterval(function(){idle++;if(idle>3||px===null){look(Math.random()*innerWidth,Math.random()*innerHeight)}},1800);
if(!reduce)setInterval(function(){var g=eyes[Math.floor(Math.random()*eyes.length)];if(!g)return;g.classList.add("blink");setTimeout(function(){g.classList.remove("blink")},130)},900);
look(innerWidth/2,innerHeight*.4);
/* 切到別的分頁時，標題會招手 */
var T=document.title;document.addEventListener("visibilitychange",function(){document.title=document.hidden?"數光島在等你，回來玩吧":T});
})();
