/* 六上 5.2 相等的比 (按鈕切換倍數) */
NB.unit({
 q:"有一個基礎比例是 2 : 3。如果我們把它同時放大 2 倍、3 倍或 4 倍，會變成多少？",
 steps:[
  "比的前項和後項「同時乘上」一個不為 0 的數，比值不會改變。這叫做「相等的比」。",
  "例如：2 : 3 同乘 2 倍 ➔ 4 : 6",
  "2 : 3 和 4 : 6 的比值都是 2/3，所以它們是相等的比。"
 ],
 ch:{q:"5 : 8 放大 3 倍後，會變成多少比多少？（填寫前項）",a:15,h:"前項和後項都要乘以 3。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,240);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  [1, 2, 3, 4].forEach(function(m){
      var btn = NB.h('<button class="pen'+(m===1?" on":"")+'">放大 '+m+' 倍</button>');
      btn.onclick = function(){ 
          btns.forEach(function(bb){ bb.className="pen"; }); // 取消所有按鈕亮起
          btn.className="pen on"; // 亮起當前按鈕
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
   var cx = 80, cy = 40, gap = 40;

   NB.t(v, cx-40, cy, "前項", {z:14});
   NB.t(v, cx-40, cy+60, "後項", {z:14});

   /* 以矩陣方式畫出圖形，讓「倍數」概念視覺化 */
   for(var row=0; row<mul; row++){
       var y_offset = row * (gap/2);
       // 畫前項(藍方塊)
       for(var i=0; i<base_a; i++){
           NB.mk("rect",{x:cx+i*gap+row*(base_a*gap+20), y:cy-15+y_offset, width:25, height:25, fill:"var(--p2)", stroke:"var(--ink)"},v);
       }
       // 畫後項(綠方塊)
       for(var j=0; j<base_b; j++){
           NB.mk("rect",{x:cx+j*gap+row*(base_b*gap+20), y:cy+45+y_offset, width:25, height:25, fill:"var(--p3)", stroke:"var(--ink)", rx:12},v); // 圓角矩形
       }

       // 用虛線框出每一組 2:3
       NB.mk("rect",{x:cx-5+row*(base_b*gap+20), y:cy-25+y_offset, width:Math.max(base_a, base_b)*gap+5, height:100, fill:"none", stroke:"var(--soft)", 'stroke-dasharray':"4 2"},v);
   }

   eq.innerHTML="放大 <b>"+mul+"</b> 倍：<br>前項 ＝ 2 × "+mul+" ＝ <b>"+total_a+"</b> ｜ 後項 ＝ 3 × "+mul+" ＝ <b>"+total_b+"</b><br>所以 <b class='ok'>2 : 3 ＝ "+total_a+" : "+total_b+"</b>";
  }
  draw(1);
 }
});