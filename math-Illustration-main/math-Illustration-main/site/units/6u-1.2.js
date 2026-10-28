/* 六上 1.2 質因數和質因數分解 */
NB.unit({
 q:"請將 24 進行質因數分解。",
 steps:["使用短除法，從最小的質數（2, 3, 5, 7...）開始除。","24 ÷ 2 = 12，12 ÷ 2 = 6，6 ÷ 2 = 3。","最後的商 3 也是質數，除法結束。將旁邊和下面的質數乘起來。"],
 ch:{q:"將 30 質因數分解，最大的一個質因數是多少？",a:5,h:"30 = 2 × 3 × 5"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  var num=NB.slider(b,"選擇數字",12,60,1,24,"",draw);
  var step=NB.slider(b,"分解步驟",0,5,1,0,"步",draw);
  
  function draw(){
   v.innerHTML="";
   var n=num.v, s=step.v, cx=280, cy=40, lh=40;
   var current = n, primes = [], i = 2;
   
   /* 預先計算分解過程 */
   var history = [];
   while(current > 1){
    if(current % i === 0){
     history.push({prime: i, dividend: current});
     current /= i;
     primes.push(i);
    } else {
     i++;
    }
   }
   
   /* 繪製短除法圖解 */
   var drawSteps = Math.min(s, history.length);
   for(var j=0; j<drawSteps; j++){
    var y = cy + j*lh;
    NB.t(v, cx-30, y+6, history[j].prime, {z:18, fill:"var(--p1)", b:1}); // 除數
    NB.t(v, cx+20, y+6, history[j].dividend, {z:18}); // 被除數
    // 短除法 L 型線條
    NB.mk("polyline",{points:(cx-10)+","+(y-15)+" "+(cx-10)+","+(y+15)+" "+(cx+50)+","+(y+15), fill:"none", stroke:"var(--ink)", 'stroke-width':2},v);
   }
   
   // 畫最後的商
   if(drawSteps > 0){
    var finalQuotient = history[drawSteps-1].dividend / history[drawSteps-1].prime;
    var yEnd = cy + drawSteps*lh;
    var isDone = drawSteps === history.length;
    NB.t(v, cx+20, yEnd+6, finalQuotient, {z:18, fill: isDone ? "var(--p1)" : "var(--ink)", b: isDone ? 1 : 0});
   } else {
    NB.t(v, cx+20, cy+6, n, {z:18});
   }
   
   var equation = primes.slice(0, drawSteps).join(" × ");
   if(drawSteps === history.length){
    eq.innerHTML="短除法完成！<br><b>"+n+"</b> 的質因數分解：<b>"+primes.join(" × ")+"</b>";
   } else {
    eq.innerHTML="請拉動滑桿進行短除法。<br>目前進度：用質數 "+(drawSteps>0 ? history[drawSteps-1].prime : "?")+" 去除。";
   }
  }
  draw()
 }});