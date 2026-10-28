/* 六上 4.3 小數除法的應用 (餘數對齊) */
NB.unit({
 q:"有 7.5 公升的沙拉油，每 1.2 公升裝成一瓶，最多可以裝滿幾瓶？還剩下幾公升？",
 steps:[
  "用直式計算 7.5 ÷ 1.2 時，先將小數點同時右移一位，變成 75 ÷ 12。",
  "75 ÷ 12 ＝ 6 餘 3。",
  "注意！『餘數的小數點』必須對齊『原本被除數 (7.5) 的小數點』！",
  "所以是裝滿 6 瓶，剩下 0.3 公升（而不是 3 公升）。"
 ],
 ch:{q:"9.8 公升的沙拉油，每 1.5 公升裝一瓶，最後剩下幾公升？（請填小數）",a:0.8,h:"9.8 ÷ 1.5 ＝ 6 餘 0.8。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,240);
  var bottle_s=NB.slider(b,"每瓶容量",0.8,2.0,0.2,1.2,"L",draw);
  
  function draw(){
   v.innerHTML="";
   var b_cap = bottle_s.v, total = 7.5;
   var count = Math.floor(total / b_cap);
   var rem = +(total - count * b_cap).toFixed(2);

   /* 畫大沙拉油桶 (左邊) */
   NB.mk("rect",{x:40, y:50, width:90, height:130, rx:10, fill:"color-mix(in srgb,var(--p4) 40%,transparent)", stroke:"var(--ink)", 'stroke-width':2},v);
   NB.t(v, 85, 40, "原油桶 7.5L", {z:13, b:1});
   /* 桶內剩餘油量 */
   var rem_h = (rem / total) * 110;
   if(rem > 0){
    NB.mk("rect",{x:45, y:175-rem_h, width:80, height:rem_h, fill:"var(--p4)", stroke:"none"},v);
    NB.t(v, 85, 170-rem_h/2, "剩 "+rem+"L", {z:12, fill:"var(--p1)", b:1});
   }

   /* 畫分裝的小瓶子 (右邊) */
   for(var i=0; i<count; i++){
    var bx = 170 + (i%5) * 75;
    var by = 60 + Math.floor(i/5) * 70;
    NB.mk("rect",{x:bx, y:by, width:40, height:50, rx:5, fill:"color-mix(in srgb,var(--p2) 50%,transparent)", stroke:"var(--ink)", 'stroke-width':1.5},v);
    NB.t(v, bx+20, by+30, b_cap+"L", {z:11});
   }

   eq.innerHTML="7.5 ÷ "+b_cap+" ＝ <b>"+count+"</b> (瓶) ... 餘數 <b>"+rem+"</b><br>關鍵念頭：餘數的小數點要還原對齊原本的 7.5 ➔ 剩下 <b class='ok'>"+rem+"</b> 公升";
  }
  draw();
 }
});