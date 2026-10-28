/* 六下 3.1 柱體的體積：底面積 × 高 */
NB.unit({
 q:"一個直角三角柱，底面的兩股長 4 公分和 3 公分，高是 5 公分。體積是多少立方公分？",
 steps:["底面是直角三角形：面積 = 4 × 3 ÷ 2 = 6 平方公分","柱體每一層都長得一樣：疊 5 層","體積 = 底面積 × 高 = 6 × 5 = 30 立方公分"],
 ch:{q:"底面積 12 平方公分、高 7 公分的柱體，體積是幾立方公分？",a:84,h:"底面積 × 高。"},
 tool:function(b,eq){
  var S=NB.solid(b),kind=0,names=["長方形","直角三角形","梯形"],row=NB.h('<div class="ctl" style="margin-bottom:6px"><label>底面形狀</label></div>');
  var bs=names.map(function(n,i){var e=NB.h('<button class="pen">'+n+'</button>');e.onclick=function(){kind=i;up()};row.appendChild(e);return e});b.appendChild(row);
  var a=NB.slider(b,"底面 a",2,8,2,4,"公分",up),bb=NB.slider(b,"底面 b",1,6,1,3,"公分",up),hh=NB.slider(b,"柱高",1,8,1,5,"公分",up),k=NB.slider(b,"疊到第幾層",1,8,1,5,"層",up);
  function up(){bs.forEach(function(e,i){e.classList.toggle("on",i===kind)});k.el.max=hh.v;if(k.v>hh.v)k.v=hh.v;
   var A=a.v,B=bb.v,H=hh.v,K=k.v,P=kind===0?[[0,0],[A,0],[A,B],[0,B]]:kind===1?[[0,0],[A,0],[0,B]]:[[0,0],[A,0],[A*3/4,B],[A/4,B]],ar=NB.solid.area(P),F=[],i;
   if(K<H)F=F.concat(NB.solid.prism(P,K,H,{f:"var(--p2)",o:.07,both:true,s:"var(--soft)",dash:"4 3"}));
   for(i=0;i<K;i++)F=F.concat(NB.solid.prism(P,i,i+1,{f:i===K-1?"var(--p4)":"var(--p2)",sw:.9}));
   S.draw(F,[A/2,H/2,-B/2],Math.min(30,170/Math.max(A,B,H+1,4)));
   eq.innerHTML="底面積 = <b>"+(+ar.toFixed(2))+"</b> 平方公分　｜　體積 = "+(+ar.toFixed(2))+" × "+H+" = <b>"+(+(ar*H).toFixed(2))+"</b> 立方公分"}
  up()}});
