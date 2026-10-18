/* 六上 8.1 認識速率 (雞兔賽跑) */
NB.unit({
 q:"小雞和兔子在賽跑。小雞的速率是「秒速 3 公尺」，兔子的速率是「秒速 8 公尺」。拉動時間看看他們能跑多遠？",
 steps:[
  "「速率」就是用來表示移動快慢的數值，也就是單位時間內移動的距離。",
  "如果知道速率和時間，就可以算出距離：",
  "距離 ＝ 速率 × 時間。"
 ],
 ch:{q:"小明每秒跑 5 公尺，跑了 12 秒，共跑了幾公尺？",a:60,h:"距離 ＝ 5 × 12 ＝ 60 公尺"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,220);
  var time=NB.slider(b,"經過時間",0,10,1,0,"秒",draw);
  
  function draw(){
   v.innerHTML="";
   var t = time.v;
   var c_speed = 3, r_speed = 8;
   var c_dist = c_speed * t, r_dist = r_speed * t;
   
   var startX = 40, scale = 5; // 1公尺 = 5px
   
   /* 畫跑道與刻度 */
   NB.mk("line",{x1:startX, y1:40, x2:startX, y2:180, stroke:"var(--soft)", 'stroke-dasharray':"4 2"},v);
   NB.t(v, startX, 30, "起點", {z:12, fill:"var(--soft)"});
   
   NB.mk("line",{x1:startX+80*scale, y1:40, x2:startX+80*scale, y2:180, stroke:"var(--p1)", 'stroke-width':3},v);
   NB.t(v, startX+80*scale, 30, "終點 (80m)", {z:12, fill:"var(--p1)", b:1});

   /* 第一跑道：小雞 */
   NB.mk("line",{x1:startX, y1:100, x2:520, y2:100, stroke:"var(--rule)"},v);
   NB.chicken(v, startX + c_dist*scale, 95, 1);
   NB.mk("rect",{x:startX, y:60, width:c_dist*scale, height:10, fill:"color-mix(in srgb,var(--p2) 60%,transparent)", stroke:"none"},v);
   NB.t(v, startX + c_dist*scale/2, 55, c_dist+"m", {z:12, fill:"var(--p2)", b:1});

   /* 第二跑道：兔子 */
   NB.mk("line",{x1:startX, y1:180, x2:520, y2:180, stroke:"var(--rule)"},v);
   NB.rabbit(v, startX + r_dist*scale, 175, 1);
   NB.mk("rect",{x:startX, y:140, width:r_dist*scale, height:10, fill:"color-mix(in srgb,var(--p3) 60%,transparent)", stroke:"none"},v);
   NB.t(v, startX + r_dist*scale/2, 135, r_dist+"m", {z:12, fill:"var(--p3)", b:1});

   eq.innerHTML="過了 <b>"+t+"</b> 秒：<br>小雞跑了：3 × "+t+" ＝ <b>"+c_dist+"</b> 公尺<br>兔子跑了：8 × "+t+" ＝ <b>"+r_dist+"</b> 公尺";
  }
  draw();
 }
});