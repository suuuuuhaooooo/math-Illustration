/* 六上 4.1 整數 ÷ 小數 */
NB.unit({
 q:"把 12 公尺長的彩帶，每 1.5 公尺剪成一段，可以剪成幾段？",
 steps:[
  "除數是小數 (1.5) 時不方便計算，我們利用「商不變」性質，將被除數和除數同時乘以 10。",
  "算式：12 ÷ 1.5 ＝ (12 × 10) ÷ (1.5 × 10) ＝ 120 ÷ 15。",
  "120 ÷ 15 ＝ 8，所以可以剪成 8 段。"
 ],
 ch:{q:"15 ÷ 0.5 ＝ ？",a:30,h:"同時乘以 10 變成 150 ÷ 5。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,220);
  var piece=NB.slider(b,"每段長度 (公尺)",0.5,3,0.5,1.5,"m",draw);
  
  function draw(){
   v.innerHTML="";
   var p=piece.v, total=12;
   var count = total / p;
   var scale = 36, cx = 40, cy = 80;
   var total_px = total * scale;

   /* 畫底彩帶 */
   NB.mk("rect",{x:cx,y:cy,width:total_px,height:30,fill:"var(--paper2)",stroke:"var(--ink)",'stroke-width':2},v);
   NB.t(v, cx+total_px/2, cy-15, "總長 12 公尺", {z:14, b:1});

   /* 畫切割線與段數 */
   var colors = ["var(--p1)","var(--p2)","var(--p3)","var(--p4)","var(--p5)"];
   for(var i=0; i<count; i++){
    var sx = cx + i * (p * scale);
    var fill = "color-mix(in srgb,"+colors[i%colors.length]+" 50%,transparent)";
    NB.mk("rect",{x:sx,y:cy,width:p*scale,height:30,fill:fill,stroke:"var(--ink)",'stroke-width':1.5},v);
    if(count <= 12) NB.t(v, sx + (p*scale)/2, cy+20, (i+1), {z:12});
   }

   /* 標示小數點擴大轉化 */
   var x10_dividend = total * 10;
   var x10_divisor = Math.round(p * 10);

   eq.innerHTML="原算式：12 ÷ <b>"+p+"</b><br>同乘 10 倍轉為整數除法：<b>"+x10_dividend+" ÷ "+x10_divisor+"</b> ＝ <b class='ok'>"+count+"</b> 段";
  }
  draw();
 }
});