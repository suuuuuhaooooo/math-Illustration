/* 六上 5.2 相等的比 */
NB.unit({
 q:"有一個基礎比例是 2 : 3。如果我們把它同時放大 2 倍、3 倍或 4 倍，會變成多少？",
 steps:[
  "比的前項和後項「同時乘上」一個不為 0 的數，比值不會改變。這叫做「相等的比」。",
  "例如：2 : 3 同乘 2 倍 ➔ 4 : 6",
  "2 : 3 和 4 : 6 的比值都是 2/3，所以它們是相等的比。"
 ],
 ch:{q:"5 : 8 放大 3 倍後，會變成多少比多少？（填寫前項）",a:15,h:"前項和後項都要乘以 3。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200); 
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  [1, 2, 3, 4].forEach(function(m){
      var btn = NB.h('<button class="pen'+(m===1?" on":"")+'">放大 '+m+' 倍</button>');
      btn.onclick = function(){ 
          btns.forEach(function(bb){ bb.className="pen"; }); 
          btn.className="pen on"; 
          draw(m); 
      };
      btns.push(btn);
      ctl.appendChild(btn);
  });
  b.insertBefore(ctl, st);
  
  function draw(mul){
   v.innerHTML="";
   var base_a = 2, base_b = 3;
   var total_a = base_a * mul, total_b = base_b * mul;
   
   /* 改用 2x2 雙欄矩陣，避免橫向擠壓超出邊界 */
   var cx = 110, cy = 35;
   
   NB.t(v, cx-55, cy+10, "前項(藍)", {z:13});
   NB.t(v, cx-55, cy+38, "後項(綠)", {z:13});

   for(var k=0; k<mul; k++){
       var col = k % 2;            // 第 0 或 1 欄
       var row = Math.floor(k / 2);  // 第 0 或 1 列
       
       var gx = cx + col * 180;    // 水平間距 180px
       var gy = cy + row * 75;     // 垂直間距 75px

       // 畫前項 (藍方塊)
       for(var i=0; i<base_a; i++){
           NB.mk("rect",{x:gx+i*26, y:gy, width:20, height:20, fill:"var(--p2)", stroke:"var(--ink)"},v);
       }
       // 畫後項 (綠圓角)
       for(var j=0; j<base_b; j++){
           NB.mk("rect",{x:gx+j*26, y:gy+28, width:20, height:20, fill:"var(--p3)", stroke:"var(--ink)", rx:8},v); 
       }

       // 用虛線框精準包覆每一組 2:3
       NB.mk("rect",{x:gx-6, y:gy-6, width:88, height:58, fill:"none", stroke:"var(--soft)", 'stroke-dasharray':"3 2"},v);
       NB.t(v, gx+38, gy-12, "第 "+(k+1)+" 組 (2:3)", {z:11, fill:"var(--soft)"});
   }

   eq.innerHTML="放大 <b>"+mul+"</b> 倍：<br>前項 ＝ 2 × "+mul+" ＝ <b>"+total_a+"</b> ｜ 後項 ＝ 3 × "+mul+" ＝ <b>"+total_b+"</b><br>所以 <b class='ok'>2 : 3 ＝ "+total_a+" : "+total_b+"</b>";
  }
  draw(1);
 }
});
