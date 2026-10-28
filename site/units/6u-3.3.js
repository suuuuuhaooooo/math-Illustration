/* 六上 3.3 商不變 */
NB.unit({
 q:"有 12 顆糖果，平分給 4 個小朋友，每人可以分到 3 顆。如果糖果數量和小朋友人數同時變成原來的 2 倍，每人分到的糖果數量會改變嗎？",
 steps:["原本：12 ÷ 4 = 3（顆）。","變成 2 倍：糖果變成 24 顆，小朋友變成 8 人。現在算式是 24 ÷ 8。","結果還是 3 顆。","當「被除數」和「除數」同時乘上或除以同一個不為零的數，「商」永遠不會變，這叫做「商不變」。"],
 ch:{q:"如果 a ÷ b = 5，那麼 (a × 3) ÷ (b × 3) = ？",a:5,h:"被除數和除數同時乘 3，商不變。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,220);
  var mul=NB.slider(b,"同時放大的倍數",1,5,1,1,"倍",draw);
  function draw(){
   v.innerHTML="";
   var m = mul.v;
   var base_dividend = 12;
   var base_divisor = 4;
   var quotient = base_dividend / base_divisor; // 固定為 3
   
   var now_dividend = base_dividend * m;
   var now_divisor = base_divisor * m;

   var cx = 55, cy = 60, gap_x = 50, gap_y = 90;
   var cols = 10; // 每排最多畫 10 個人

   /* 畫出所有的小朋友與他們分到的糖果 */
   for(var i=0; i<now_divisor; i++){
       var row = Math.floor(i / cols);
       var col = i % cols;
       var px = cx + col * gap_x;
       var py = cy + row * gap_y;

       // 呼叫內建的人物角色
       NB.person(v, px, py, "var(--p2)", 0.6);

       // 畫出每個人固定拿到的糖果 (商)
       for(var j=0; j<quotient; j++){
           NB.mk("circle",{cx: px - 10 + j*10, cy: py + 20, r: 4, fill: "var(--p4)"},v);
       }
   }

   var msg = m === 1 ? "原本數量" : "數量和人數同時放大 <b>" + m + "</b> 倍";

   eq.innerHTML="狀態："+msg+"<br>總糖果 ("+now_dividend+") ÷ 總人數 ("+now_divisor+") = 每人分到 <b class='ok'>"+quotient+"</b> 顆 (商不變)";
  }
  draw();
 }
});