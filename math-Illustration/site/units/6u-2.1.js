/* 六上 2.1 最簡分數 */
NB.unit({
 q:"請找出 12/18 的最簡分數。",
 steps:["最簡分數的分子和分母只有公因數 1（互質），無法再約分。","可以用分子和分母的『公因數』慢慢除。","或者直接除以『最大公因數』，一步算出最簡分數。"],
 ch:{q:"把 16/24 化為最簡分數，分子是多少？",a:2,h:"分子和分母同除以最大公因數 8，變成 2/3。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,180);
  var div=NB.slider(b,"嘗試同除以 (約分)",1,6,1,1,"",draw);
  function draw(){
   v.innerHTML="";
   var d=div.v, num=12, den=18;
   var isFactor = (num%d===0 && den%d===0);

   var cx=40, cy=60, w=480, h=40;
   
   /* 畫底色 (18等分) */
   NB.mk("rect",{x:cx,y:cy,width:w,height:h,fill:"var(--paper2)",stroke:"var(--ink)"},v);
   for(var i=1; i<den; i++){
       NB.mk("line",{x1:cx+i*(w/den),y1:cy,x2:cx+i*(w/den),y2:cy+h,stroke:"var(--soft)", 'stroke-width':1},v);
   }
   
   /* 畫分子 (12等分) */
   NB.mk("rect",{x:cx,y:cy,width:w*(num/den),height:h,fill:"color-mix(in srgb,var(--p2) 60%,transparent)",stroke:"var(--ink)"},v);

   var msg = "";
   if(isFactor){
       var newNum = num/d, newDen = den/d;
       /* 畫出約分後的新格線 (較粗的紅線) */
       for(var j=1; j<newDen; j++){
           NB.mk("line",{x1:cx+j*(w/newDen),y1:cy-10,x2:cx+j*(w/newDen),y2:cy+h+10,stroke:"var(--p1)", 'stroke-width':3},v);
       }
       if(d===6) msg = "<b class='ok'>除以最大公因數 6，得到最簡分數！</b>";
       else if(d!==1) msg = "<b class='ok'>可以約分！變成 "+newNum+"/"+newDen+"。</b>";
       else msg = "原分數：12/18";

       eq.innerHTML="嘗試約分：分子分母同除以 "+d+"<br>➔ "+msg;
   } else {
       msg = "<b class='no'>"+d+" 不是公因數，不能約分！</b>";
       eq.innerHTML="嘗試約分：分子分母同除以 "+d+"<br>➔ "+msg;
   }
  }
  draw();
 }
});