/* 六上 3.2 差不變 (年齡問題) */
NB.unit({
 q:"爸爸今年 35 歲，小華今年 10 歲。過了幾年之後，爸爸和小華的『年齡差』會改變嗎？",
 steps:["每過一年，爸爸長大 1 歲，小華也長大 1 歲。","因為兩人增加的歲數一樣多，所以他們相差的歲數永遠一樣。","這叫做「差不變」。"],
 ch:{q:"媽媽今年 32 歲，妹妹今年 8 歲。當妹妹 18 歲時，媽媽是幾歲？",a:42,h:"年齡差是 24 歲，媽媽永遠比妹妹大 24 歲。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,180);
  var year=NB.slider(b,"經過時間",0,20,1,5,"年",draw);
  function draw(){
   v.innerHTML="";
   var y=year.v, p_age=35+y, c_age=10+y, diff=p_age-c_age;
   var scale=6;
   
   /* 爸爸的年齡條 */
   NB.mk("rect",{x:80,y:40,width:p_age*scale,height:24,fill:"color-mix(in srgb,var(--p2) 60%,transparent)",stroke:"var(--ink)"},v);
   NB.t(v,40,56,"爸爸",{z:14});
   NB.t(v,90+p_age*scale,56,p_age+"歲",{z:14,a:"start"});
   
   /* 小華的年齡條 */
   NB.mk("rect",{x:80,y:90,width:c_age*scale,height:24,fill:"color-mix(in srgb,var(--p1) 60%,transparent)",stroke:"var(--ink)"},v);
   NB.t(v,40,106,"小華",{z:14});
   NB.t(v,90+c_age*scale,106,c_age+"歲",{z:14,a:"start"});

   /* 畫虛線與差距標示 */
   NB.mk("line",{x1:80+c_age*scale,y1:40,x2:80+c_age*scale,y2:114,stroke:"var(--soft)",'stroke-dasharray':"4 2"},v);
   NB.mk("line",{x1:80+p_age*scale,y1:40,x2:80+p_age*scale,y2:114,stroke:"var(--soft)",'stroke-dasharray':"4 2"},v);
   NB.mk("path",{d:"M "+(80+c_age*scale)+" 120 L "+(80+p_age*scale)+" 120",fill:"none",stroke:"var(--p4)",'stroke-width':3},v);
   NB.t(v,80+(c_age+p_age)/2*scale, 135, "相差 "+diff+" 歲", {z:14,fill:"var(--p4)",b:1});

   eq.innerHTML="過了 "+y+" 年：爸爸是 "+(35+y)+" 歲，小華是 "+(10+y)+" 歲。<br>年齡差："+(35+y)+" - "+(10+y)+" = <b class='ok'>"+diff+"</b> 歲 (差不變)";
  }
  draw();
 }
});