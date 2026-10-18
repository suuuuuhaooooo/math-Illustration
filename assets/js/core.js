/* 核心：SVG 手繪工具、主題切換、單元頁樣板 */
(function(){
var NS="http://www.w3.org/2000/svg",KEY="nb-theme",root=document.body.getAttribute("data-root")||"./";
var NB=window.NB={root:root},INK="var(--ink)";
function h(html){var d=document.createElement("div");d.innerHTML=html.trim();return d.firstChild}
function s(tag,a,p){var e=document.createElementNS(NS,tag);for(var k in a){if(k==="fill"||k==="stroke")e.style.setProperty(k,a[k]);else e.setAttribute(k,a[k])}if(p)p.appendChild(e);return e}
function t(p,x,y,str,o){o=o||{};var e=s("text",{x:x,y:y,"text-anchor":o.a||"middle","font-size":o.z||16},p);if(o.c)e.style.fill=o.c;if(o.b)e.style.fontWeight=700;e.textContent=str;return e}
function svg(p,w,hh){return s("svg",{viewBox:"0 0 "+w+" "+hh,class:"sk",role:"img"},p)}
NB.h=h;NB.s=s;NB.t=t;NB.svg=svg;
function mk(tag,a,p,w){var o={stroke:INK,"stroke-width":w||2,"stroke-linecap":"round","stroke-linejoin":"round"};for(var k in a)o[k]=a[k];return s(tag,o,p)}
NB.mk=mk;
/* 手繪角色與圖樣（全部以 SVG 繪製，不使用 emoji） */
NB.tree=function(p,x,y,k){k=k||1;mk("rect",{x:x-3*k,y:y-12*k,width:6*k,height:24*k,fill:"var(--p4b)"},p);mk("circle",{cx:x,cy:y-22*k,r:15*k,fill:"var(--p3)"},p);mk("circle",{cx:x-9*k,cy:y-11*k,r:9*k,fill:"var(--p3)"},p);mk("circle",{cx:x+9*k,cy:y-11*k,r:9*k,fill:"var(--p3)"},p)};
NB.chicken=function(p,x,y,k){k=k||1;mk("path",{d:"M"+(x-4*k)+" "+(y+10*k)+"v"+11*k+"M"+(x+5*k)+" "+(y+10*k)+"v"+11*k,fill:"none"},p);mk("ellipse",{cx:x,cy:y,rx:16*k,ry:12*k,fill:"var(--paper)"},p);mk("path",{d:"M"+(x-8*k)+" "+y+"q"+6*k+" "+8*k+" "+13*k+" 0",fill:"none"},p,1.5);mk("circle",{cx:x+13*k,cy:y-13*k,r:7*k,fill:"var(--paper)"},p);mk("circle",{cx:x+12*k,cy:y-20*k,r:3*k,fill:"var(--p1)"},p,1.5);mk("path",{d:"M"+(x+19*k)+" "+(y-15*k)+"l"+7*k+" "+3*k+"l"+(-7*k)+" "+2*k+"z",fill:"var(--p4)"},p,1.5);mk("circle",{cx:x+15*k,cy:y-14*k,r:1.2*k,fill:INK},p,1)};
NB.rabbit=function(p,x,y,k){k=k||1;var i,lx=[-11,-5,5,11];for(i=0;i<4;i++)mk("path",{d:"M"+(x+lx[i]*k)+" "+(y+9*k)+"v"+12*k,fill:"none"},p);mk("ellipse",{cx:x,cy:y,rx:16*k,ry:12*k,fill:"var(--paper)"},p);mk("circle",{cx:x-17*k,cy:y-2*k,r:5*k,fill:"var(--paper)"},p,1.5);mk("circle",{cx:x+13*k,cy:y-11*k,r:8*k,fill:"var(--paper)"},p);mk("ellipse",{cx:x+10*k,cy:y-28*k,rx:3.2*k,ry:11*k,fill:"var(--paper)"},p);mk("ellipse",{cx:x+17*k,cy:y-27*k,rx:3.2*k,ry:11*k,fill:"var(--paper)"},p);mk("circle",{cx:x+16*k,cy:y-12*k,r:1.3*k,fill:INK},p,1);mk("circle",{cx:x+20*k,cy:y-9*k,r:1.6*k,fill:"var(--p1)"},p,1)};
NB.person=function(p,x,y,col,k){k=k||1;mk("circle",{cx:x,cy:y-30*k,r:7*k,fill:"var(--paper)"},p);mk("path",{d:"M"+x+" "+(y-23*k)+"V"+y+"M"+(x-9*k)+" "+(y-15*k)+"L"+x+" "+(y-19*k)+"L"+(x+9*k)+" "+(y-15*k)+"M"+x+" "+y+"L"+(x-7*k)+" "+(y+16*k)+"M"+x+" "+y+"L"+(x+7*k)+" "+(y+16*k),fill:"none",stroke:col||"var(--p1)"},p,3)};
NB.icon=function(type,p){var v=s("svg",{viewBox:"0 0 64 64",class:"sk","aria-hidden":"true"},p),i;
 if(type==="gap"){NB.tree(v,16,38,.75);NB.tree(v,48,38,.75);mk("path",{d:"M4 54H60",fill:"none"},v,2.5)}
 else if(type==="area"){mk("rect",{x:10,y:16,width:44,height:32,fill:"var(--p2)",opacity:.45},v);for(i=1;i<4;i++)mk("path",{d:"M"+(10+i*11)+" 16v32",fill:"none"},v,1.2);mk("path",{d:"M10 32H54",fill:"none"},v,1.2);mk("rect",{x:10,y:16,width:44,height:32,fill:"none"},v,2.5)}
 else if(type==="frac"){mk("circle",{cx:32,cy:32,r:22,fill:"var(--paper2)"},v);mk("path",{d:"M32 32V10A22 22 0 1 1 10 32Z",fill:"var(--p4)"},v);mk("path",{d:"M32 10V54M10 32H54",fill:"none"},v,1.5)}
 else if(type==="sd"){mk("rect",{x:8,y:14,width:48,height:14,fill:"var(--p4)"},v);mk("rect",{x:36,y:14,width:20,height:14,fill:"var(--p1)"},v);mk("rect",{x:8,y:36,width:28,height:14,fill:"var(--p3)"},v)}
 else if(type==="cr"){NB.chicken(v,22,38,.8);NB.rabbit(v,44,38,.7)}
 else{NB.person(v,16,36,"var(--p1)",.8);NB.person(v,48,36,"var(--p2)",.8);mk("path",{d:"M24 20H40M36 16l4 4-4 4",fill:"none"},v,1.8)}
 return v};
/* 手繪抖動濾鏡（全站共用） */
document.body.appendChild(h('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="wob"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></svg>'));
/* 主題：淺色 / 深色 / 跟隨系統 */
function mode(){try{return localStorage.getItem(KEY)||"system"}catch(e){return"system"}}
function apply(m){var r=document.documentElement;if(m==="light"||m==="dark")r.setAttribute("data-theme",m);else r.removeAttribute("data-theme");var bs=document.querySelectorAll(".themes button");for(var i=0;i<bs.length;i++)bs[i].classList.toggle("on",bs[i].dataset.m===m)}
NB.themeBar=function(){
 var I={light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',dark:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',system:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'};
 var L={light:"淺色",dark:"深色",system:"系統"},d=h('<div class="themes" role="group" aria-label="主題"></div>');
 ["light","dark","system"].forEach(function(m){var b=h('<button data-m="'+m+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+I[m]+'</svg>'+L[m]+'</button>');
  b.onclick=function(){try{localStorage.setItem(KEY,m)}catch(e){}apply(m)};d.appendChild(b)});
 setTimeout(function(){apply(mode())},0);return d};
apply(mode());
/* 滑桿 */
NB.slider=function(box,label,min,max,step,val,unit,fn){
 var w=h('<div class="ctl"><label>'+label+'</label><input type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"><output></output></div>'),i=w.querySelector("input"),o=w.querySelector("output");
 function up(){o.textContent=i.value+unit}i.oninput=function(){up();fn()};up();box.appendChild(w);
 return{el:i,get v(){return+i.value},set v(x){i.value=x;up()}}};
/* 單元頁樣板：例題 → 動手玩 → 解法 → 挑戰 */
function sheet(tag,sub,body){var d=h('<section class="sheet"><h2><span class="tag">'+tag+'</span>'+(sub||"")+'</h2></section>');if(body)d.appendChild(body);return d}
function mount(c){
 var app=document.getElementById("app"),I=NB.info(NB.cur)||{};c.title=c.title||I.title||"單元";c.ref=c.ref||I.ref||"";document.title=c.title+"｜數學筆記本";
 var bar=h('<nav class="bar"><a class="back" href="'+root+'index.html">← 回到目錄</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);
 app.appendChild(h('<h1 class="title"><mark>'+c.title+'</mark></h1>'));app.appendChild(h('<p class="meta">'+c.ref+'</p>'));
 app.appendChild(sheet("例題","",h('<div class="q">'+c.q+'</div>')));
 var box=h("<div></div>"),eq=h('<div class="eq"></div>');c.tool(box,eq);box.appendChild(eq);app.appendChild(sheet("動手玩","拖拖看，觀察變化",box));
 app.appendChild(sheet("解法","一步一步來",h('<ol class="steps">'+c.steps.map(function(x){return"<li>"+x+"</li>"}).join("")+"</ol>")));
 var ch=h('<div><div class="q">'+c.ch.q+'</div><div class="ctl"><input class="num" type="number" inputmode="numeric" placeholder="答案"><button class="pen go">檢查</button><button class="pen">提示</button></div><div class="fb"></div></div>');
 var inp=ch.querySelector("input"),fb=ch.querySelector(".fb"),bs=ch.querySelectorAll("button");
 bs[0].onclick=function(){if(inp.value==="")return;var ok=+inp.value===c.ch.a;fb.className="fb "+(ok?"ok":"no");fb.textContent=ok?"答對了！你好厲害！":"再想想看，可以按「提示」喔。"};
 bs[1].onclick=function(){fb.className="fb";fb.textContent="提示："+c.ch.h};
 app.appendChild(sheet("挑戰","換你試試",ch));
 var nv=h('<nav class="bar"></nav>');if(I.prev)nv.appendChild(h('<a class="back" href="'+NB.link(I.prev)+'">← '+I.prev.title+'</a>'));else nv.appendChild(h("<span></span>"));if(I.next)nv.appendChild(h('<a class="back" href="'+NB.link(I.next)+'">'+I.next.title+' →</a>'));app.appendChild(nv);
}
NB.mount=mount;

/* ---- 目錄解析、單元載入（放一個 units/<id>.js 就會自動出現） ---- */
var CN="一二三四五六七八九十".split(""),FLAT=[],BYID={};
NB.cat=(window.CATALOG||[]).map(function(S){return{sem:S.sem,id:S.id,grade:S.grade,chs:S.ch.map(function(row,i){var a=row.split("|"),c={no:i+1,name:a[0],secs:[]};a.slice(1).forEach(function(t,j){var o={id:S.id+"-"+(i+1)+"."+(j+1),num:(i+1)+"."+(j+1),title:t,sem:S.sem,ch:c};c.secs.push(o);FLAT.push(o);BYID[o.id]=o});return c})}});
NB.flat=FLAT;
NB.link=function(o){return root+"unit.html?u="+o.id};
NB.info=function(id){var o=BYID[id];if(!o)return null;var i=FLAT.indexOf(o);return{title:o.num+" "+o.title,ref:"通用 "+o.sem+"・第"+CN[o.ch.no-1]+"章 "+o.ch.name+"・"+o.num+" "+o.title,prev:FLAT[i-1]&&{id:FLAT[i-1].id,title:FLAT[i-1].num+" "+FLAT[i-1].title},next:FLAT[i+1]&&{id:FLAT[i+1].id,title:FLAT[i+1].num+" "+FLAT[i+1].title}}};
NB.page=document.body.getAttribute("data-page")||"unit";NB.cur=null;NB.built={};
/* 單元檔只要呼叫 NB.unit({...})：在首頁只登記「已完成」，在單元頁才真正畫出來 */
NB.unit=function(c){var sc=document.currentScript,id=sc&&sc.dataset.id;if(NB.page==="home"){NB.built[id]=true;if(NB.onProbe)NB.onProbe(id);return}mount(c)};
NB.load=function(id,ok,no){var e=document.createElement("script");e.src=root+"units/"+id+".js";e.dataset.id=id;e.onload=function(){e.remove();ok&&ok()};e.onerror=function(){e.remove();no&&no()};document.head.appendChild(e)};
NB.boot=function(){var id=new URLSearchParams(location.search).get("u");NB.cur=id;var app=document.getElementById("app");
 NB.load(id,null,function(){var I=NB.info(id),bar=h('<nav class="bar"><a class="back" href="'+root+'index.html">← 回到目錄</a></nav>');bar.appendChild(NB.themeBar());app.appendChild(bar);
  app.appendChild(h('<h1 class="title"><mark>'+(I?I.title:"找不到單元")+'</mark></h1>'));
  app.appendChild(sheet("建置中","",h('<p>這一節還沒有做好，先回目錄看看其他單元吧。<br><small class="meta">想補上它：新增檔案 units/'+id+'.js 即可。</small></p>')))})};
})();
