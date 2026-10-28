/* 六上 6.1 認識圓周率 (滾動圓形測量) */
NB.unit({
 q:"如果把一個圓形輪子沿著直線滾動一圈，它滾過的距離（圓周長）會是直徑的幾倍呢？",
 steps:[
  "在圓形的邊緣做一個記號，讓它在直尺上滾動剛好一圈。",
  "觀察它滾過的距離，發現它比直徑的 3 倍還要多一點點。",
  "這個倍數是固定的，我們稱為「圓周率」，大約等於 3.14。"
 ],
 ch:{q:"直徑 10 公分的圓，圓周長大約是多少公分？",a:31.4,h:"圓周長 ＝ 直徑 × 3.14"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,220);
  var roll=NB.slider(b,"推動輪子",0,100,1,0,"%",draw);
  
  function draw(){
   v.innerHTML="";
   var progress = roll.v / 100; // 0 ~ 1
   var D = 100, R = D / 2;
   var C = D * 3.14; 
   
   var startX = 60, cy = 90;
   var currentX = startX + C * progress;
   var angle = progress * 360; // 滾動的角度

   /* 畫地面與直徑倍數標示 */
   NB.mk("line",{x1:startX-20, y1:cy+R, x2:520, y2:cy+R, stroke:"var(--ink)", 'stroke-width':3},v);
   for(var i=0; i<=3; i++){
       var markX = startX + D * i;
       NB.mk("line",{x1:markX, y1:cy+R-5, x2:markX, y2:cy+R+10, stroke:"var(--soft)", 'stroke-width':2},v);
       NB.t(v, markX, cy+R+25, i+"倍直徑", {z:12, fill:"var(--soft)"});
   }
   
   /* 畫 3.14 倍的特殊標記 */
   var piX = startX + C;
   NB.mk("line",{x1:piX, y1:cy+R-10, x2:piX, y2:cy+R+15, stroke:"var(--p1)", 'stroke-width':2},v);
   NB.t(v, piX, cy+R+35, "3.14倍", {z:14, fill:"var(--p1)", b:1});

   /* 畫滾動的軌跡 (地上的線) */
   if(progress > 0) {
       NB.mk("line",{x1:startX, y1:cy+R-2, x2:currentX, y2:cy+R-2, stroke:"var(--p4)", 'stroke-width':4},v);
   }

   /* 畫輪子 */
   var g = NB.s("g", {transform:"translate("+currentX+","+cy+") rotate("+angle+")"}, v);
   NB.mk("circle",{cx:0, cy:0, r:R, fill:"color-mix(in srgb,var(--p2) 30%,transparent)", stroke:"var(--ink)", 'stroke-width':2}, g);
   // 畫輪輻 (十字線) 幫助看清旋轉
   NB.mk("line",{x1:-R, y1:0, x2:R, y2:0, stroke:"var(--ink)", 'stroke-width':1, 'stroke-dasharray':"4 4"}, g);
   NB.mk("line",{x1:0, y1:-R, x2:0, y2:R, stroke:"var(--ink)", 'stroke-width':1, 'stroke-dasharray':"4 4"}, g);
   // 畫起點標記點 (紅點)
   NB.mk("circle",{cx:0, cy:R, r:5, fill:"var(--p1)"}, g);

   eq.innerHTML="滾動進度："+roll.v+"%<br>圓周長 ＝ 直徑 × <b class='ok'>3.14</b> (圓周率)";
  }
  draw();
 }
});