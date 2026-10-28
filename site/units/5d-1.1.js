/* 五下 1.1 長方體與正方體的體積：用小方塊一層一層疊 */
NB.unit({
 q:"長方體的長是 4 公分、寬是 3 公分、高是 2 公分。它的體積是多少立方公分？",
 steps:["先看第一層：長 4 × 寬 3 = 12 個 1 立方公分的小方塊","高是 2 公分，就疊 2 層","體積 = 12 × 2 = 24 立方公分（長 × 寬 × 高）"],
 ch:{q:"長 5 公分、寬 4 公分、高 3 公分的長方體，體積是幾立方公分？",a:60,h:"一層有 5×4 = 20 個，疊 3 層。"},
 tool:function(b,eq){
  var S=NB.solid(b),l=NB.slider(b,"長",1,10,1,4,"公分",up),w=NB.slider(b,"寬",1,8,1,3,"公分",up),hh=NB.slider(b,"高",1,8,1,2,"公分",up),k=NB.slider(b,"疊到第幾層",1,8,1,2,"層",up);
  function up(){k.el.max=hh.v;if(k.v>hh.v)k.v=hh.v;var L=l.v,Wd=w.v,H=hh.v,K=k.v,F=[];
   if(K<H)F=F.concat(NB.solid.cuboid(0,K,0,L,H,Wd,{f:"var(--p2)",o:.07,both:true,s:"var(--soft)",sw:1,dash:"4 3"}));
   F=F.concat(NB.solid.grid(0,0,0,L,K,Wd,{f:"var(--p2)",col:{top:"var(--p4)"},sw:.8}));
   S.draw(F,[L/2,H/2,Wd/2],Math.min(30,175/Math.max(L,H+1,Wd,4)));
   eq.innerHTML="一層："+L+"×"+Wd+" = "+L*Wd+" 個　｜　疊 "+K+" 層 = <b>"+L*Wd*K+"</b> 個"+(K===H?"　｜　體積 "+L+"×"+Wd+"×"+H+" = <b>"+L*Wd*H+"</b> 立方公分":"（還沒疊完）")}
  up()}});
