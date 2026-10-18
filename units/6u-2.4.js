/* 六上 2.4 分數除法的應用 (修正高度超出問題) */
NB.unit({
 q:"有一個面積是 3/2 平方公尺的長方形公佈欄，已知它的長是 3/4 公尺，那麼寬是多少公尺？",
 steps:["長方形的面積公式是：長 × 寬 = 面積。","所以要求寬，就是反過來算：面積 ÷ 長。","算式：3/2 ÷ 3/4 = 3/2 × 4/3 = 2。寬是 2 公尺。"],
 ch:{q:"面積是 5/6 平方公尺的長方形，長是 5/3 公尺，寬是多少公尺？（填寫小數）",a:0.5,h:"5/6 ÷ 5/3 = 1/2，請轉換為小數 0.5。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,280);
  // 【修改1】滑桿的最小值從 1 改成 2，避免出現極端瘦長的形狀
  var l_slider=NB.slider(b,"長度 (分之4 公尺)",2,8,1,3,"",draw);
  
  function draw(){
   v.innerHTML="";
   var L_num = l_slider.v;
   var area = 1.5; // 3/2 平方公尺
   var L = L_num / 4; 
   var W = area / L;

   // 【修改2】縮放比例改為 70，起始位置往右移一點置中
   var scale = 70; 
   var cx = 140, cy = 30;

   /* 畫背景參考網格 (長 2 公尺、寬 3 公尺的範圍) */
   for(var i=0; i<2; i++){
       for(var j=0; j<3; j++){
           NB.mk("rect",{x:cx+i*scale, y:cy+j*scale, width:scale, height:scale, fill:"none", stroke:"var(--rule)", 'stroke-dasharray':"4 4"},v);
       }
   }

   /* 畫實際的長方形 */
   NB.mk("rect",{x:cx, y:cy, width:L*scale, height:W*scale, fill:"color-mix(in srgb,var(--p4) 50%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);

   /* 標示長度 (上方) */
   NB.mk("line",{x1:cx, y1:cy-10, x2:cx+L*scale, y2:cy-10, stroke:"var(--ink)", 'stroke-width':1.5},v);
   NB.t(v, cx + L*scale/2 - 10, cy-18, L_num+"/4 公尺", {z:14, fill:"var(--ink)"});

   /* 標示寬度 (左側) */
   NB.mk("line",{x1:cx-10, y1:cy, x2:cx-10, y2:cy+W*scale, stroke:"var(--ink)", 'stroke-width':1.5},v);
   NB.t(v, cx-70, cy + W*scale/2 + 5, "寬: ? 公尺", {z:14, fill:"var(--p1)", b:1});

   /* 格式化寬度的顯示數字 */
   var w_text = "";
   if (W % 1 === 0) w_text = W;
   else if ((W * 2) % 1 === 0) w_text = (W * 2) + "/2";
   else if ((W * 4) % 1 === 0) w_text = (W * 4) + "/4";
   else w_text = W.toFixed(2);

   eq.innerHTML="面積 = <b>3/2</b> 平方公尺 ｜ 長 = <b>"+L_num+"/4</b> 公尺<br>寬 = 面積 ÷ 長 = 3/2 ÷ "+L_num+"/4 = <b class='ok'>"+w_text+"</b> 公尺";
  }
  draw();
 }
});
