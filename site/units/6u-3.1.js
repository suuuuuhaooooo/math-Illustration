/* 六上 3.1 和不變 */
NB.unit({
 q:"甲容器有 300 毫升的水，乙容器有 100 毫升的水。如果把甲容器的水倒一些到乙容器，兩容器的『總水量』會改變嗎？",
 steps:["甲減少的水量，剛好等於乙增加的水量。","不管怎麼倒，水都沒有流到外面去。","所以兩容器的總水量永遠保持「和不變」。"],
 ch:{q:"哥哥有 150 元，弟弟有 50 元，哥哥給弟弟 20 元後，兩人合起來共有多少元？",a:200,h:"總金額不會變（和不變）。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200);
  var move=NB.slider(b,"甲倒給乙",0,150,10,50,"毫升",draw);
  function draw(){
   v.innerHTML="";
   var m=move.v, a_base=300, b_base=100;
   var a_now=a_base-m, b_now=b_base+m;
   var total=a_now+b_now;
   
   /* 畫甲杯 */
   NB.mk("rect",{x:120,y:40,width:80,height:120,fill:"none",stroke:"var(--ink)",'stroke-width':2},v);
   NB.mk("rect",{x:120,y:160-(a_now*0.3),width:80,height:(a_now*0.3),fill:"color-mix(in srgb,var(--p2) 60%,transparent)"},v);
   NB.t(v,160,180,"甲："+a_now+" ml",{z:14});

   /* 畫乙杯 */
   NB.mk("rect",{x:360,y:40,width:80,height:120,fill:"none",stroke:"var(--ink)",'stroke-width':2},v);
   NB.mk("rect",{x:360,y:160-(b_now*0.3),width:80,height:(b_now*0.3),fill:"color-mix(in srgb,var(--p1) 60%,transparent)"},v);
   NB.t(v,400,180,"乙："+b_now+" ml",{z:14});

   /* 畫轉移箭頭 */
   if(m>0) {
    NB.mk("path",{d:"M 220 80 Q 280 40 340 80",fill:"none",stroke:"var(--p4)",'stroke-width':3},v);
    NB.mk("polygon",{points:"335,75 345,85 330,85",fill:"var(--p4)"},v);
    NB.t(v,280,50,"倒出 "+m+" ml",{z:14,fill:"var(--p4)",b:1});
   }

   eq.innerHTML="甲現在：300 - "+m+" = "+a_now+" ｜ 乙現在：100 + "+m+" = "+b_now+"<br>總水量："+a_now+" + "+b_now+" = <b class='ok'>"+total+"</b> 毫升 (和不變)";
  }
  draw();
 }
});