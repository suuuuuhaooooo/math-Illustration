/* 六上 9.1 縮圖與放大圖 */
NB.unit({
 q:"把一個長方形放大 2 倍，它的「邊長」和「面積」分別會變成原來的幾倍？",
 steps:[
  "「放大 2 倍」的意思是，圖形的「每一條邊長」都變成原來的 2 倍。",
  "但要注意面積！面積 = 長 × 寬。",
  "長變 2 倍、寬也變 2 倍，所以面積會變成 2 × 2 = 4 倍！",
  "如果是縮小 1/2 倍，邊長變 1/2，面積就會變成 1/4 倍。"
 ],
 ch:{q:"把一個正方形放大 3 倍，面積會變成原來的幾倍？",a:9,h:"面積倍數 ＝ 放大倍數 × 放大倍數 (3 × 3)。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  var modes = ["縮小 1/2 倍", "◎ 原始圖形", "放大 2 倍"];
  var scales = [0.5, 1, 2];
  
  modes.forEach(function(txt, i){
      var btn = NB.h('<button class="pen'+(i===1?" on":"")+'">'+txt+'</button>');
      btn.onclick = function(){ 
          btns.forEach(function(bb){ bb.className="pen"; }); 
          btn.className="pen on"; 
          draw(scales[i]); 
      };
      btns.push(btn); ctl.appendChild(btn);
  });
  b.insertBefore(ctl, st);
  
  function draw(scale){
   v.innerHTML="";
   var base_w = 2, base_h = 3; // 原圖的格子數 (2x3)
   var cur_w = base_w * scale, cur_h = base_h * scale;
   
   var gridSize = 25; // 每一格 25px
   var cx = 200, cy = 40; 

   /* 畫背景大方格紙 */
   for(var i=0; i<=8; i++){
       NB.mk("line",{x1:cx+i*gridSize, y1:cy, x2:cx+i*gridSize, y2:cy+6*gridSize, stroke:"var(--rule)", 'stroke-dasharray':"2 2"},v);
   }
   for(var j=0; j<=6; j++){
       NB.mk("line",{x1:cx, y1:cy+j*gridSize, x2:cx+8*gridSize, y2:cy+j*gridSize, stroke:"var(--rule)", 'stroke-dasharray':"2 2"},v);
   }

   /* 畫出目前的圖形 */
   NB.mk("rect",{x:cx, y:cy, width:cur_w*gridSize, height:cur_h*gridSize, fill:"color-mix(in srgb,var(--p2) 60%,transparent)", stroke:"var(--ink)", 'stroke-width':3},v);
   
   /* 標示邊長格數 */
   NB.mk("path",{d:"M"+cx+" "+(cy-5)+" L"+cx+" "+(cy-15)+" L"+(cx+cur_w*gridSize)+" "+(cy-15)+" L"+(cx+cur_w*gridSize)+" "+(cy-5), fill:"none", stroke:"var(--p1)", 'stroke-width':2},v);
   NB.t(v, cx+cur_w*gridSize/2, cy-20, cur_w+" 格", {z:14, fill:"var(--p1)", b:1});

   NB.mk("path",{d:"M"+(cx-5)+" "+cy+" L"+(cx-15)+" "+cy+" L"+(cx-15)+" "+(cy+cur_h*gridSize)+" L"+(cx-5)+" "+(cy+cur_h*gridSize), fill:"none", stroke:"var(--p1)", 'stroke-width':2},v);
   NB.t(v, cx-25, cy+cur_h*gridSize/2+5, cur_h+" 格", {z:14, fill:"var(--p1)", b:1});

   /* 結論區 */
   var area = cur_w * cur_h;
   var area_msg = "";
   if(scale === 1) area_msg = "基準面積：2 × 3 ＝ <b>6</b> 格";
   else if(scale === 2) area_msg = "放大 2 倍 ➔ 面積變成 4 × 6 ＝ <b>24</b> 格 (是原圖的 <b class='ok'>4</b> 倍)";
   else if(scale === 0.5) area_msg = "縮小 1/2 倍 ➔ 面積變成 1 × 1.5 ＝ <b>1.5</b> 格 (是原圖的 <b class='ok'>1/4</b> 倍)";

   eq.innerHTML="目前狀態：<b>"+ (scale===1 ? "原圖" : (scale>1 ? "放大 "+scale+" 倍" : "縮小 "+scale+" 倍")) + "</b><br>邊長變成原圖的 <b>"+scale+"</b> 倍。<br>" + area_msg;
  }
  draw(1);
 }
});
