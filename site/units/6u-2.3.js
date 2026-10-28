/* 六上 2.3 異分母分數的除法 */
NB.unit({
 q:"有 1/2 公升的果汁，每 1/6 公升倒一杯，可以倒幾杯？",
 steps:["先把不同的分母變成相同，也就是「通分」。","1/2 公升等於 3/6 公升。","現在題目變成「3/6 ÷ 1/6」，分子相除：3 ÷ 1 = 3 杯。"],
 ch:{q:"2/3 ÷ 1/6 = ?",a:4,h:"將 2/3 通分為 4/6，然後算 4 ÷ 1。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200);
  var cup=NB.slider(b,"每杯倒幾分之1",2,12,2,6,"",draw);
  function draw(){
   v.innerHTML="";
   var c=cup.v;
   var cx=40, cy1=40, cy2=120, w=480, h=40;

   /* 上方 1/2 的長條 */
   NB.mk("rect",{x:cx,y:cy1,width:w,height:h,fill:"var(--paper2)",stroke:"var(--ink)"},v);
   NB.mk("rect",{x:cx,y:cy1,width:w/2,height:h,fill:"color-mix(in srgb,var(--p2) 60%,transparent)",stroke:"var(--ink)",'stroke-width':2},v);
   NB.t(v,cx-25,cy1+25,"1/2", {z:16});

   /* 下方 1/c 的長條 */
   NB.mk("rect",{x:cx,y:cy2,width:w,height:h,fill:"var(--paper2)",stroke:"var(--ink)"},v);
   NB.mk("rect",{x:cx,y:cy2,width:w/c,height:h,fill:"color-mix(in srgb,var(--p4) 60%,transparent)",stroke:"var(--ink)",'stroke-width':2},v);
   NB.t(v,cx-25,cy2+25,"1/"+c, {z:16});

   for(var i=1; i<=c; i++){
       NB.mk("line",{x1:cx+i*(w/c),y1:cy2,x2:cx+i*(w/c),y2:cy2+h,stroke:"var(--ink)",'stroke-width':1},v);
   }

   /* 檢查是否能被 2 整除，畫出對應通分虛線 */
   if(c%2===0){
       for(var j=1; j<=c/2; j++){
           NB.mk("line",{x1:cx+j*(w/c),y1:cy1,x2:cx+j*(w/c),y2:cy1+h,stroke:"var(--p1)",'stroke-width':2,'stroke-dasharray':"4 2"},v);
       }
       var ans = (c/2)/1;
       eq.innerHTML="通分：1/2 變成了 <b>"+(c/2)+"/"+c+"</b><br>計算："+(c/2)+"/"+c+" ÷ 1/"+c+" = <b class='ok'>"+ans+"</b> 杯";
   } else {
       eq.innerHTML="1/2 無法直接通分為分母是 "+c+" 的整數分子。";
   }
  }
  draw();
 }
});