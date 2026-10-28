/* 六上 4.4 被除數、除數和商的關係 */
NB.unit({
 q:"觀察小數除法，當除數大於 1、等於 1 或小於 1 時，『商』和『被除數』的大小關係是什麼？",
 steps:[
  "當除數 ＞ 1 時（例如 ÷ 1.5）：商會比被除數『小』。",
  "當除數 ＝ 1 時（例如 ÷ 1.0）：商和被除數『一樣大』。",
  "當除數 ＜ 1 時（例如 ÷ 0.5）：商會比被除數『大』！"
 ],
 ch:{q:"如果 12 ÷ x ＝ 15，請問 x 是大於 1 還是小於 1？（輸入 1 代表大於1，輸入 2 代表小於1）",a:2,h:"因為商 (15) 比被除數 (12) 還要大，所以除數 x 必定小於 1。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,180);
  var divisor=NB.slider(b,"選擇除數",0.2,2.0,0.1,0.5,"",draw);
  
  function draw(){
   v.innerHTML="";
   var d = divisor.v, dividend = 10;
   var quotient = +(dividend / d).toFixed(2);
   var scale = 20, cx = 80;

   /* 畫被除數 (固定長度) */
   NB.mk("rect",{x:cx, y:40, width:dividend*scale, height:24, fill:"var(--p2)", stroke:"var(--ink)", 'stroke-width':1.5},v);
   NB.t(v, cx-40, 56, "被除數", {z:14});
   NB.t(v, cx+dividend*scale+10, 56, "10", {z:14, a:"start", b:1});

   /* 畫商 (動態伸縮) */
   var q_width = Math.min(quotient * scale, 360); // 避免過長超出畫布
   NB.mk("rect",{x:cx, y:100, width:q_width, height:24, fill:"var(--p1)", stroke:"var(--ink)", 'stroke-width':1.5},v);
   NB.t(v, cx-40, 116, "商", {z:14});
   NB.t(v, cx+q_width+10, 116, quotient.toString(), {z:14, a:"start", fill:"var(--p1)", b:1});

   /* 對齊基準虛線 */
   NB.mk("line",{x1:cx+dividend*scale, y1:30, x2:cx+dividend*scale, y2:135, stroke:"var(--soft)", 'stroke-dasharray':"4 2"},v);

   var rel = "";
   if(d > 1) rel = "<b class='no'>除數 > 1 ➔ 商 < 被除數 (數值變小了)</b>";
   else if(d === 1) rel = "<b>除數 ＝ 1 ➔ 商 ＝ 被除數 (數值不變)</b>";
   else rel = "<b class='ok'>除數 < 1 ➔ 商 > 被除數 (數值反而變大了！)</b>";

   eq.innerHTML="算式：10 ÷ <b>"+d+"</b> ＝ <b>"+quotient+"</b><br>觀察："+rel;
  }
  draw();
 }
});