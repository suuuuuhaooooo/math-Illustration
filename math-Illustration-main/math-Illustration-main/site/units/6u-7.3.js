/* 六上 7.3 複合圖形面積 (葉子形狀) */
NB.unit({
 q:"一個邊長 10 公分的正方形裡面，有一片葉子形狀的塗色面積。請問這片葉子的面積是多少？",
 steps:[
  "這個葉子圖案沒辦法直接算，我們要用「扣除法」來拆解。",
  "先算出 1/4 圓的面積 (半徑10)。",
  "再算出直角三角形的面積 (底10、高10)。",
  "把它們相減，就會得到「半片葉子」的面積。",
  "最後把半片葉子 × 2，就是完整的葉子面積了！"
 ],
 ch:{q:"邊長 20 公分的正方形，裡面的葉子面積是多少？",a:228,h:"(20×20×3.14÷4 - 20×20÷2) × 2"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  var labels = ["1. 看見1/4圓", "2. 扣掉三角形", "3. 得到半片葉子", "4. 變成完整葉子"];
  labels.forEach(function(txt, i){
      var btn = NB.h('<button class="pen'+(i===0?" on":"")+'">'+txt+'</button>');
      btn.onclick = function(){ 
          btns.forEach(function(bb){ bb.className="pen"; }); 
          btn.className="pen on"; 
          draw(i); 
      };
      btns.push(btn); ctl.appendChild(btn);
  });
  b.insertBefore(ctl, st);
  
  function draw(step){
   v.innerHTML="";
   var cx = 100, cy = 40, size = 160; // 正方形的起點與邊長

   /* 畫基礎正方形 */
   NB.mk("rect",{x:cx, y:cy, width:size, height:size, fill:"var(--paper2)", stroke:"var(--ink)", 'stroke-dasharray':"4 2"},v);
   NB.t(v, cx-20, cy+size/2, "10", {z:14, b:1});
   NB.t(v, cx+size/2, cy-10, "10", {z:14, b:1});

   var calc_msg = "";

   if(step === 0){
       /* 1/4圓 (從左上角為圓心) */
       NB.mk("path",{d:"M"+cx+" "+cy+" L"+(cx+size)+" "+cy+" A"+size+" "+size+" 0 0 1 "+cx+" "+(cy+size)+" Z", fill:"color-mix(in srgb,var(--p2) 50%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);
       calc_msg = "<b>1/4 圓面積</b> ＝ 10 × 10 × 3.14 ÷ 4 ＝ <b class='ok'>78.5</b>";
   } 
   else if(step === 1){
       /* 顯示1/4圓並覆蓋三角形區塊來表示扣除 */
       NB.mk("path",{d:"M"+cx+" "+cy+" L"+(cx+size)+" "+cy+" A"+size+" "+size+" 0 0 1 "+cx+" "+(cy+size)+" Z", fill:"color-mix(in srgb,var(--p2) 50%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);
       NB.mk("polygon",{points:cx+","+cy+" "+(cx+size)+","+cy+" "+cx+","+(cy+size), fill:"color-mix(in srgb,var(--p1) 70%,transparent)", stroke:"var(--ink)"},v);
       calc_msg = "<b>直角三角形</b> ＝ 10 × 10 ÷ 2 ＝ <b class='ok'>50</b>";
   }
   else if(step === 2){
       /* 半片葉子 */
       NB.mk("path",{d:"M"+(cx+size)+" "+cy+" A"+size+" "+size+" 0 0 1 "+cx+" "+(cy+size)+" Z", fill:"color-mix(in srgb,var(--p4) 70%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);
       calc_msg = "<b>半片葉子</b> ＝ 1/4圓(78.5) － 三角形(50) ＝ <b class='ok'>28.5</b>";
   }
   else if(step === 3){
       /* 完整葉子 */
       NB.mk("path",{d:"M"+(cx+size)+" "+cy+" A"+size+" "+size+" 0 0 1 "+cx+" "+(cy+size)+" A"+size+" "+size+" 0 0 1 "+(cx+size)+" "+cy+" Z", fill:"color-mix(in srgb,var(--p4) 70%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);
       calc_msg = "<b>完整葉子</b> ＝ 半片(28.5) × 2 ＝ <b class='ok'>57</b> 平方公分";
   }

   eq.innerHTML = calc_msg;
  }
  draw(0);
 }
});