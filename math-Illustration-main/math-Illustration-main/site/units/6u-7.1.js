/* 六上 7.1 圓面積公式的由來 */
NB.unit({
 q:"如果把圓形切成很多塊像披薩一樣的扇形，然後上下交錯拼起來，會變成什麼形狀？",
 steps:[
  "當我們把圓切得越來越細，拼出來的形狀就會越來越接近「長方形」。",
  "這個長方形的「寬」剛好是圓的「半徑」。",
  "長方形的「長」剛好是圓周長的一半（半徑 × 3.14）。",
  "所以圓面積 ＝ 長 × 寬 ＝ (半徑 × 3.14) × 半徑。"
 ],
 ch:{q:"半徑 10 公分的圓，面積是多少平方公分？",a:314,h:"10 × 10 × 3.14"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  var slice=NB.slider(b,"切割等份",4,32,4,4,"份",draw);
  
  function draw(){
   v.innerHTML="";
   var n = slice.v;
   var r = 50; 
   var rect_len = r * 3.14; // 157
   
   var cx = 90, cy = 90; // 左側圓心
   var px = 240, py = 120; // 右側拼圖起點
   
   /* 畫左側原始圓形與切線 */
   NB.mk("circle",{cx:cx, cy:cy, r:r, fill:"var(--paper2)", stroke:"var(--ink)"},v);
   for(var i=0; i<n; i++){
       var angle = (i * 360 / n) * (Math.PI / 180);
       NB.mk("line",{x1:cx, y1:cy, x2:cx+r*Math.cos(angle), y2:cy+r*Math.sin(angle), stroke:"var(--ink)", 'stroke-width':1},v);
   }
   NB.t(v, cx, cy+r+25, "切成 "+n+" 份", {z:14, b:1});

   /* 畫右側拼成的近似長方形 */
   var half_n = n / 2;
   var w = rect_len / half_n; // 每一塊底部的寬度

   for(var j=0; j<n; j++){
       var isDown = (j % 2 === 0);
       var idx = Math.floor(j / 2);
       
       var x_base = px + idx * w + (isDown ? 0 : w/2);
       var y_tip = isDown ? py : py - r;
       var y_base = isDown ? py - r : py;
       
       // 用三角形近似扇形，切越多越接近
       var pts = x_base+","+y_tip+" "+(x_base-w/2)+","+y_base+" "+(x_base+w/2)+","+y_base;
       NB.mk("polygon",{points:pts, fill:(isDown ? "var(--p1)" : "var(--p2)"), stroke:"var(--ink)", 'stroke-width':0.5},v);
   }

   /* 標示長方形的長與寬 */
   var total_w = w * half_n;
   NB.mk("line",{x1:px-w/2, y1:py+10, x2:px-w/2+total_w, y2:py+10, stroke:"var(--p4)", 'stroke-width':2},v);
   NB.t(v, px+total_w/2, py+28, "圓周長的一半 (半徑×3.14)", {z:12, fill:"var(--p4)", b:1});

   NB.mk("line",{x1:px+total_w+10, y1:py, x2:px+total_w+10, y2:py-r, stroke:"var(--p3)", 'stroke-width':2},v);
   NB.t(v, px+total_w+15, py-r/2+5, "半徑", {z:12, fill:"var(--p3)", b:1, a:"start"});

   eq.innerHTML="當切成 <b>"+n+"</b> 份時：<br>拼出的長方形面積 ＝ 長 × 寬 ＝ <b class='ok'>(半徑 × 3.14) × 半徑</b>";
  }
  draw();
 }
});