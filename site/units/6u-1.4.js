/* 六上 1.4 最小公倍數 */
NB.unit({
 q:"小華有厚度 4 公分的紅色積木，和厚度 6 公分的藍色積木。如果分別把它們往上疊，當兩種積木疊到『一樣高』時，最少是幾公分？",
 steps:["紅色積木的高度會是 4 的倍數：4, 8, 12, 16, 20...","藍色積木的高度會是 6 的倍數：6, 12, 18, 24...","第一個相同的高度是 12 公分，這就是 4 和 6 的『最小公倍數』。"],
 ch:{q:"厚 6 公分和 9 公分的積木，最少疊到幾公分會一樣高？",a:18,h:"找 6 和 9 的最小公倍數。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,280);
  var r_num=NB.slider(b,"紅色 (4cm) 數量",1,8,1,1,"個",draw);
  var b_num=NB.slider(b,"藍色 (6cm) 數量",1,8,1,1,"個",draw);
  
  function draw(){
   v.innerHTML="";
   var rn = r_num.v, bn = b_num.v;
   var rh = 4, bh = 6, scale = 8;
   var total_r = rn * rh, total_b = bn * bh;
   
   NB.mk("line",{x1:80,y1:240,x2:480,y2:240,stroke:"var(--ink)",'stroke-width':3},v);
   
   for(var i=0; i<rn; i++){
    NB.mk("rect",{x:180, y:240-(i+1)*rh*scale, width:60, height:rh*scale, fill:"color-mix(in srgb,var(--p1) 70%,transparent)", stroke:"var(--ink)"},v);
    NB.t(v, 210, 240-i*rh*scale-rh*scale/2+6, "4", {z:14});
   }
   NB.t(v, 210, 260, "紅積木", {b:1, z:16});
   NB.mk("line",{x1:170,y1:240-total_r*scale,x2:250,y2:240-total_r*scale,stroke:"var(--p1)",'stroke-dasharray':"4 4"},v);
   NB.t(v, 140, 240-total_r*scale+6, total_r+"cm", {b:1, z:14, fill:"var(--p1)"});

   for(var j=0; j<bn; j++){
    NB.mk("rect",{x:320, y:240-(j+1)*bh*scale, width:60, height:bh*scale, fill:"color-mix(in srgb,var(--p2) 70%,transparent)", stroke:"var(--ink)"},v);
    NB.t(v, 350, 240-j*bh*scale-bh*scale/2+6, "6", {z:14});
   }
   NB.t(v, 350, 260, "藍積木", {b:1, z:16});
   NB.mk("line",{x1:310,y1:240-total_b*scale,x2:390,y2:240-total_b*scale,stroke:"var(--p2)",'stroke-dasharray':"4 4"},v);
   NB.t(v, 420, 240-total_b*scale+6, total_b+"cm", {b:1, z:14, fill:"var(--p2)"});

   var msg = (total_r === total_b) ? "<b class='ok'>高度一樣了！"+total_r+" 是公倍數。</b>" : "<b class='no'>高度不一樣。</b>";
   if(total_r === 12 && total_b === 12) msg = "<b class='ok'>高度一樣了！12 是最小公倍數！</b>";

   eq.innerHTML="紅總高：4 × "+rn+" = <b>"+total_r+"</b> cm ｜ 藍總高：6 × "+bn+" = <b>"+total_b+"</b> cm<br>狀態："+msg;
  }
  draw()
 }});