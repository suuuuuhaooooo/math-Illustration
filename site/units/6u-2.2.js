/* 六上 2.2 同分母分數的除法 */
NB.unit({
 q:"有 6/7 塊披薩，每 2/7 塊裝成一盒，可以裝成幾盒？",
 steps:["分母相同時，我們只需要看「分子」：也就是把 6 份，每 2 份裝一盒。","算法：6/7 ÷ 2/7 = 6 ÷ 2 = 3。","所以可以剛好裝成 3 盒。"],
 ch:{q:"8/9 ÷ 4/9 = ?",a:2,h:"分母相同，直接算分子相除：8 ÷ 4。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,220);
  var parts=NB.slider(b,"每盒裝的份數 (分之7)",1,6,1,2,"份",draw);
  function draw(){
   v.innerHTML="";
   var p=parts.v, total=6, den=7;
   var cx=280, cy=100, r=90;

   /* 畫虛線底盤 */
   NB.mk("circle",{cx:cx,cy:cy,r:r,fill:"var(--paper2)",stroke:"var(--soft)",'stroke-dasharray':"4 4"},v);

   /* 畫扇形並依裝盒分組填色 */
   var rad = Math.PI*2/den;
   for(var i=0; i<total; i++){
       var a1 = i*rad - Math.PI/2, a2 = (i+1)*rad - Math.PI/2;
       var p1x = cx+r*Math.cos(a1), p1y = cy+r*Math.sin(a1);
       var p2x = cx+r*Math.cos(a2), p2y = cy+r*Math.sin(a2);
       var path = "M"+cx+" "+cy+" L"+p1x+" "+p1y+" A"+r+" "+r+" 0 0 1 "+p2x+" "+p2y+" Z";
       
       var group = Math.floor(i/p);
       var colors = ["var(--p1)","var(--p2)","var(--p3)","var(--p4)","var(--p5)"];
       var fill = "color-mix(in srgb,"+colors[group%colors.length]+" 60%,transparent)";
       NB.mk("path",{d:path,fill:fill,stroke:"var(--ink)",'stroke-width':1.5},v);
   }

   var ans = total/p;
   var isInt = total%p===0;
   var msg = isInt ? "<b class='ok'>剛好裝成 "+ans+" 盒</b>" : "<b class='no'>裝成 "+Math.floor(ans)+" 盒，然後還剩下！</b>";

   eq.innerHTML="計算：6/7 ÷ "+p+"/7 = 6 ÷ "+p+"<br>結果："+msg;
  }
  draw();
 }
});