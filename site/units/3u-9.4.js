/* 三上 第九章 分數 9.4 */
NB.unit({title:"分數的大小比較",ref:"康軒 三上・第九章 分數・9.4 分數的大小比較",
 q:"3/4 和 5/8 哪一個比較大？",
 steps:["把兩條一樣長的紙條，分別切成 4 等份、8 等份","3/4 就是 6/8（分母一樣，才好直接比）","6/8 比 5/8 大，所以 3/4 比較大"],
 ch:{q:"7/8 比 3/4 多幾個 1/8？",a:1,h:"3/4 = 6/8。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,190);
  var d1=NB.slider(b,"上條分母",2,12,1,4,"",function(){n1.el.max=d1.v;if(n1.v>d1.v)n1.v=d1.v;draw()}),n1=NB.slider(b,"上條分子",0,4,1,3,"",function(){draw()});n1.el.max=4;
  var d2=NB.slider(b,"下條分母",2,12,1,8,"",function(){n2.el.max=d2.v;if(n2.v>d2.v)n2.v=d2.v;draw()}),n2=NB.slider(b,"下條分子",0,8,1,5,"",function(){draw()});
  function bar(y,n,d,col){var W=480,x0=40,i;for(i=0;i<d;i++)NB.mk("rect",{x:x0+i*W/d,y:y,width:W/d,height:46,fill:i<n?col:"var(--paper)"},v,2.2);NB.t(v,x0,y-9,n+"/"+d,{a:"start",b:1,z:18})}
  function draw(){v.innerHTML="";bar(32,n1.v,d1.v,"var(--p4)");bar(122,n2.v,d2.v,"var(--p3)");
   var a=n1.v/d1.v,c=n2.v/d2.v;
   eq.innerHTML=Math.abs(a-c)<1e-9?"兩個一樣大！<b>＝</b>":n1.v+"/"+d1.v+" <b>"+(a>c?"＞":"＜")+"</b> "+n2.v+"/"+d2.v+"　（約 "+Math.round(a*100)+"% 和 "+Math.round(c*100)+"%）"}
  draw()}});
