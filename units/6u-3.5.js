/* 六上 3.5 堆疊問題 (紙杯疊高) */
NB.unit({
 q:"一個紙杯高 10 公分。把紙杯疊起來，每多疊一個紙杯，高度就會增加 2 公分。如果疊了 5 個紙杯，總高度是多少公分？",
 steps:["第 1 個杯子貢獻了完整的 10 公分。","剩下的 4 個杯子，每一個只露出杯口邊緣的 2 公分。","總高度 = 第一個杯子高度 + (總杯數 - 1) × 露出的高度。","總高度 = 10 + (5 - 1) × 2 = 18 公分。"],
 ch:{q:"同樣的紙杯疊了 11 個，總高度是多少公分？",a:30,h:"10 + (11 - 1) × 2"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,280);
  var cup=NB.slider(b,"杯子數量",1,10,1,5,"個",draw);
  function draw(){
   v.innerHTML="";
   var n=cup.v, base_h=10, rim_h=2;
   var total = base_h + (n-1)*rim_h;
   
   var cx=280, base_y=240; 
   var cup_px=100, rim_px=20, w_top=80, w_bot=50;

   /* 從最底下畫到最上面，由下往上堆疊 */
   for(var i=0; i<n; i++){
    var y_top = base_y - cup_px - i*rim_px;
    var points = (cx-w_top/2)+","+y_top+" "+(cx+w_top/2)+","+y_top+" "+(cx+w_bot/2)+","+(y_top+cup_px)+" "+(cx-w_bot/2)+","+(y_top+cup_px);
    var fill = i===0 ? "color-mix(in srgb,var(--p2) 50%,transparent)" : "color-mix(in srgb,var(--p1) 30%,transparent)";
    NB.mk("polygon",{points:points,fill:fill,stroke:"var(--ink)",'stroke-width':2},v);
   }

   /* 標示總高度的測量線 */
   var top_y = base_y - cup_px - (n-1)*rim_px;
   NB.mk("line",{x1:cx+w_top/2+20, y1:top_y, x2:cx+w_top/2+20, y2:base_y, stroke:"var(--p4)",'stroke-width':3},v);
   NB.mk("line",{x1:cx+w_top/2+10, y1:top_y, x2:cx+w_top/2+30, y2:top_y, stroke:"var(--p4)",'stroke-width':3},v);
   NB.mk("line",{x1:cx+w_top/2+10, y1:base_y, x2:cx+w_top/2+30, y2:base_y, stroke:"var(--p4)",'stroke-width':3},v);
   NB.t(v,cx+w_top/2+55, base_y-(cup_px+(n-1)*rim_px)/2+6, total+"cm", {z:16, fill:"var(--p4)", b:1});

   eq.innerHTML="疊 "+n+" 個紙杯：1 個完整的底杯(" + base_h + "cm) + <b>"+(n-1)+"</b> 個杯緣(各" + rim_h + "cm)<br>總高 = 10 + "+(n-1)+" × 2 = <b class='ok'>"+total+"</b> 公分";
  }
  draw();
 }
});