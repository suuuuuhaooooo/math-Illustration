/* 六上 8.3 平均速率 (爬山問題) */
NB.unit({
 q:"小華去爬山，上山走了 6 公里，花了 2 小時；下山原路折返 6 公里，花了 1 小時。請問他整趟來回的「平均速率」是多少？",
 steps:[
  "【常見錯誤】上山時速是 3，下山時速是 6，所以平均是 (3+6)÷2 ＝ 4.5 ➔ 錯！",
  "平均速率不能直接把速率相加除以二！",
  "正確公式：平均速率 ＝ 總距離 ÷ 總時間。",
  "總距離：6 + 6 ＝ 12 公里。總時間：2 + 1 ＝ 3 小時。",
  "平均速率 ＝ 12 ÷ 3 ＝ 4 (km/h)。"
 ],
 ch:{q:"開車去程 60 公里花 2 小時，回程 60 公里花 1 小時，平均速率是時速幾公里？",a:40,h:"(60+60) ÷ (2+1) ＝ 120 ÷ 3"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,220);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btns = [];
  var modes = ["1. 上山", "2. 下山", "3. 算平均速率"];
  modes.forEach(function(txt, i){
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
   var cx = 280, cy = 60, lx = 80, rx = 480, base_y = 180;

   /* 畫山脈背景 */
   NB.mk("polygon",{points:(lx-40)+","+base_y+" "+cx+","+cy+" "+(rx+40)+","+base_y, fill:"color-mix(in srgb,var(--p3) 20%,transparent)", stroke:"var(--soft)", 'stroke-width':2, 'stroke-dasharray':"4 4"},v);
   
   if(step === 0){
       /* 上山路徑 */
       NB.mk("line",{x1:lx, y1:base_y, x2:cx, y2:cy, stroke:"var(--p1)", 'stroke-width':4},v);
       NB.mk("polygon",{points:(cx-15)+","+(cy+20)+" "+cx+","+cy+" "+(cx-20)+","+(cy+10), fill:"var(--p1)"},v); // 箭頭
       NB.person(v, lx+50, base_y-30, "var(--p1)", 0.8);
       NB.t(v, 150, 110, "距離: 6 km", {z:14, b:1});
       NB.t(v, 150, 130, "時間: 2 小時", {z:14, fill:"var(--p1)"});
       
       eq.innerHTML="上山階段：<br>上山速率 ＝ 6 ÷ 2 ＝ <b>時速 3 公里</b>";
   }
   else if(step === 1){
       /* 保留上山灰線，畫下山路徑 */
       NB.mk("line",{x1:lx, y1:base_y, x2:cx, y2:cy, stroke:"var(--soft)", 'stroke-width':2},v);
       NB.mk("line",{x1:cx, y1:cy, x2:rx, y2:base_y, stroke:"var(--p2)", 'stroke-width':4},v);
       NB.mk("polygon",{points:(rx-20)+","+(base_y-10)+" "+rx+","+base_y+" "+(rx-15)+","+(base_y-20), fill:"var(--p2)"},v); // 箭頭
       NB.person(v, rx-50, base_y-30, "var(--p2)", 0.8);
       NB.t(v, 410, 110, "距離: 6 km", {z:14, b:1});
       NB.t(v, 410, 130, "時間: 1 小時", {z:14, fill:"var(--p2)"});

       eq.innerHTML="下山階段：<br>下山速率 ＝ 6 ÷ 1 ＝ <b>時速 6 公里</b>";
   }
   else if(step === 2){
       /* 總結 */
       NB.mk("line",{x1:lx, y1:base_y, x2:cx, y2:cy, stroke:"var(--p1)", 'stroke-width':4},v);
       NB.mk("line",{x1:cx, y1:cy, x2:rx, y2:base_y, stroke:"var(--p2)", 'stroke-width':4},v);
       
       NB.mk("rect",{x:180, y:60, width:200, height:100, rx:10, fill:"var(--paper)", stroke:"var(--p4)", 'stroke-width':3},v);
       NB.t(v, 280, 90, "總距離：6+6 = 12", {z:14, b:1});
       NB.t(v, 280, 115, "總時間：2+1 = 3", {z:14, b:1});
       NB.mk("line",{x1:200, y1:125, x2:360, y2:125, stroke:"var(--soft)"},v);
       NB.t(v, 280, 145, "12 ÷ 3 = 4 km/h", {z:16, fill:"var(--p4)", b:1});

       eq.innerHTML="<b class='no'>注意：平均速率不是 (3+6)÷2 ＝ 4.5！</b><br>正確算法：平均速率 ＝ 總距離 ÷ 總時間 ＝ <b class='ok'>4 km/h</b>";
   }
  }
  draw(0);
 }
});