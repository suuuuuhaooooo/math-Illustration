/* 六上 1.1 質數和合數 */
NB.unit({
 q:"我們可以用積木排成長方形來找因數。請觀察積木的排列，哪些數字是質數？哪些是合數？",
 steps:["如果一個大於 1 的整數，只能排成「1 乘自己」的一種長方形（因數只有 1 和自己），這個數就是「質數」。","如果還能排成其他形狀的長方形（有 3 個以上的因數），這個數就是「合數」。","例如：5 只能排成 1x5（質數）；6 可以排成 1x6 和 2x3（合數）。"],
 ch:{q:"請問 13 是質數還是合數？",a:13,h:"13 只能被 1 和 13 整除，所以是質數（請輸入13代表質數）。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  var num=NB.slider(b,"積木數量",2,20,1,6,"個",draw);
  function draw(){
   v.innerHTML="";
   var n=num.v, scale=18, cx=30, cy=30, factors=[];
   
   for(var i=1; i<=n; i++){
    if(n%i===0) factors.push(i);
   }
   
   var isPrime = factors.length === 2;
   var msg = isPrime ? "<b class='ok'>只有 1 和自己兩個因數，是「質數」！</b>" : "<b class='no'>有 3 個以上的因數，是「合數」！</b>";
   
   /* 畫出所有可能的矩形排列 */
   var currentY = cy;
   for(var i=0; i<factors.length; i++){
    var w = factors[i], h = n/w;
    if(w > h) continue; // 避免重複畫轉 90 度的形狀
    
    for(var row=0; row<h; row++){
     for(var col=0; col<w; col++){
      NB.mk("rect",{x:cx+col*scale, y:currentY+row*scale, width:scale, height:scale, fill:"color-mix(in srgb,var(--p2) 40%,transparent)", stroke:"var(--ink)",'stroke-width':1},v);
     }
    }
    NB.t(v, cx+w*scale+15, currentY+h*scale/2+6, w+" × "+h, {z:14});
    currentY += h*scale + 20;
   }
   
   eq.innerHTML="數字 <b>"+n+"</b> 的因數有："+factors.join(", ")+"<br>➔ "+msg;
  }
  draw()
 }});