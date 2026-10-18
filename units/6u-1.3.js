/* 六上 1.3 最大公因數 */
NB.unit({
 q:"一塊長 24 公分、寬 18 公分的長方形，要剪成大小相同的正方形且不能有剩下，正方形的邊長最大是幾公分？",
 steps:["要能剛好剪完不剩下，正方形的邊長必須同時是 24 和 18 的「因數」。","找出 24 和 18 的所有公因數：1, 2, 3, 6。","最大的公因數是 6，所以正方形邊長最大是 6 公分。"],
 ch:{q:"長 30 公分、寬 20 公分的長方形，剪成最大正方形的邊長是多少公分？",a:10,h:"找 30 和 20 的最大公因數。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,280);
  var side=NB.slider(b,"嘗試正方形邊長",1,10,1,5,"公分",draw);
  function draw(){
   v.innerHTML="";
   var s=side.v, L=24, W=18, scale=11; 
   var cx=(560-L*scale)/2, cy=(280-W*scale)/2;
   
   NB.mk("rect",{x:cx,y:cy,width:L*scale,height:W*scale,fill:"var(--paper2)",stroke:"var(--ink)",'stroke-width':2},v);
   
   var countX = Math.floor(L/s), countY = Math.floor(W/s);
   for(var i=0; i<countX; i++){
    for(var j=0; j<countY; j++){
     NB.mk("rect",{x:cx+i*s*scale,y:cy+j*s*scale,width:s*scale,height:s*scale,fill:"color-mix(in srgb,var(--p2) 30%,transparent)",stroke:"var(--p2)",'stroke-width':1},v);
    }
   }
   
   var remX = L % s, remY = W % s;
   if(remX > 0) NB.mk("rect",{x:cx+countX*s*scale,y:cy,width:remX*scale,height:W*scale,fill:"color-mix(in srgb,var(--p1) 50%,transparent)"},v);
   if(remY > 0) NB.mk("rect",{x:cx,y:cy+countY*s*scale,width:L*scale,height:remY*scale,fill:"color-mix(in srgb,var(--p1) 50%,transparent)"},v);

   var isFactor = (remX === 0 && remY === 0);
   var msg = isFactor ? "<b class='ok'>剛好鋪滿不剩下！是公因數。</b>" : "<b class='no'>會剩下紅色區域！不是公因數。</b>";
   if(s===6) msg = "<b class='ok'>剛好鋪滿！且是最大的公因數！</b>";
   
   eq.innerHTML="嘗試邊長："+s+" 公分 ➔ "+msg+"<br>長邊可排 "+countX+" 個（剩 "+remX+"），寬邊可排 "+countY+" 個（剩 "+remY+"）";
  }
  draw()
 }});