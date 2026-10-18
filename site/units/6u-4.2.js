/* 六上 4.2 小數 ÷ 小數 */
NB.unit({
 q:"水壺裡有 4.5 公升的水，每 0.5 公升倒滿一杯，可以倒滿幾杯？",
 steps:[
  "被除數 (4.5) 和除數 (0.5) 都是小數。",
  "將兩數的小數點同時向右移動一位（同乘 10），把除數變成整數。",
  "算式變成：45 ÷ 5 ＝ 9，所以可以倒滿 9 杯。"
 ],
 ch:{q:"6.4 ÷ 0.8 ＝ ？",a:8,h:"同乘 10 變成 64 ÷ 8。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200);
  var cup_size=NB.slider(b,"每杯容量 (公升)",0.3,1.5,0.3,0.5,"L",draw);
  
  function draw(){
   v.innerHTML="";
   var c = cup_size.v, total = 4.5;
   var count = Math.floor(total / c);
   var rem = +(total - count * c).toFixed(2);

   var cx = 50, cy = 60, gap = 45;
   var cols = 10;

   /* 畫小水杯 */
   for(var i=0; i<count; i++){
    var row = Math.floor(i / cols);
    var col = i % cols;
    var px = cx + col * gap;
    var py = cy + row * 60;

    /* 杯身 */
    NB.mk("path",{d:"M"+(px-15)+" "+py+" L"+(px+15)+" "+py+" L"+(px+12)+" "+(py+35)+" L"+(px-12)+" "+(py+35)+" Z", fill:"color-mix(in srgb,var(--p2) 60%,transparent)", stroke:"var(--ink)", 'stroke-width':1.5},v);
    NB.t(v, px, py+22, c+"L", {z:10});
   }

   var x10_dividend = 45;
   var x10_divisor = Math.round(c * 10);

   eq.innerHTML="原算式：4.5 ÷ <b>"+c+"</b> ➔ 擴大 10 倍：<b>45 ÷ "+x10_divisor+"</b><br>結果：可以倒滿 <b class='ok'>"+count+"</b> 杯" + (rem > 0 ? "，剩下 <b>"+rem+"</b> 公升" : "");
  }
  draw();
 }
});