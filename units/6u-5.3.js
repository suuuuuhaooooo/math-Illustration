/* 六上 5.3 比的應用 (比例分配，點擊分發) */
NB.unit({
 q:"有 30 顆金幣，要按照 3 : 2 的比例分給海盜甲和海盜乙，請問甲和乙各分到多少顆金幣？",
 steps:[
  "按照 3 : 2 的比例，代表每次分發時，甲拿 3 顆，乙拿 2 顆。",
  "也就是說，每分一次，總共要發出 3 + 2 ＝ 5 顆金幣。",
  "30 顆金幣除以 5 顆，可以分發 6 次（30 ÷ 5 ＝ 6）。",
  "甲拿了 6 次的 3 顆：3 × 6 ＝ 18 顆；乙拿了 6 次的 2 顆：2 × 6 ＝ 12 顆。"
 ],
 ch:{q:"40 顆糖果按 5 : 3 分給哥哥和弟弟，哥哥分到幾顆？",a:25,h:"總共分成 5+3=8 份。40÷8=5，哥哥拿 5 份：5×5。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btnDeal = NB.h('<button class="pen on" style="background:var(--p4); color:#333; margin-right:10px;">💰 按 3:2 分發一次</button>');
  var btnReset = NB.h('<button class="pen">重新分發</button>');
  ctl.appendChild(btnDeal); ctl.appendChild(btnReset);
  b.insertBefore(ctl, st);

  var total = 30;
  var step = 0; // 最多 6 次 (30 / 5)

  btnDeal.onclick = function(){ if(step < 6) { step++; draw(); } };
  btnReset.onclick = function(){ step = 0; draw(); };
  
  function draw(){
   v.innerHTML="";
   var a_takes = 3, b_takes = 2;
   var pool_now = total - step * (a_takes + b_takes);
   var a_has = step * a_takes;
   var b_has = step * b_takes;

   var cx_pool = 280, cx_a = 100, cx_b = 460, cy = 130;

   /* 畫中央金幣庫 */
   NB.mk("circle",{cx:cx_pool, cy:cy, r:60, fill:"var(--paper2)", stroke:"var(--soft)", 'stroke-dasharray':"4 4"},v);
   NB.t(v, cx_pool, cy-70, "金幣庫", {z:14, fill:"var(--soft)"});
   NB.t(v, cx_pool, cy+10, pool_now, {z:40, b:1, fill:"var(--p4b)"});

   /* 畫海盜甲 (3份) */
   NB.person(v, cx_a, cy+60, "var(--p1)", 1.2);
   NB.t(v, cx_a, cy-70, "海盜甲 (3份)", {z:14});
   NB.t(v, cx_a, cy-45, a_has+" 顆", {z:20, b:1, fill:"var(--p1)"});

   /* 畫海盜乙 (2份) */
   NB.person(v, cx_b, cy+60, "var(--p2)", 1.2);
   NB.t(v, cx_b, cy-70, "海盜乙 (2份)", {z:14});
   NB.t(v, cx_b, cy-45, b_has+" 顆", {z:20, b:1, fill:"var(--p2)"});

   /* 畫分發箭頭 */
   if(pool_now > 0) {
       NB.mk("path",{d:"M "+(cx_pool-70)+" "+cy+" Q "+(cx_a+50)+" "+cy+" "+(cx_a+30)+" "+(cy-30), fill:"none", stroke:"var(--p1)", 'stroke-width':2, 'stroke-dasharray':"2 2"},v);
       NB.mk("path",{d:"M "+(cx_pool+70)+" "+cy+" Q "+(cx_b-50)+" "+cy+" "+(cx_b-30)+" "+(cy-30), fill:"none", stroke:"var(--p2)", 'stroke-width':2, 'stroke-dasharray':"2 2"},v);
   }

   if(step === 0){
       eq.innerHTML="目前金幣庫有 30 顆。請點擊「分發」按鈕！";
   } else if (step < 6) {
       eq.innerHTML="第 "+step+" 次分發 ➔ 甲拿 3 顆，乙拿 2 顆。<br>目前甲有 "+a_has+" 顆，乙有 "+b_has+" 顆。金幣庫剩 "+pool_now+" 顆。";
   } else {
       eq.innerHTML="<b class='ok'>分發完畢！</b> (共分了 6 次)<br>甲獲得 3 × 6 ＝ <b>18</b> 顆 ｜ 乙獲得 2 × 6 ＝ <b>12</b> 顆";
   }
  }
  draw();
 }
});