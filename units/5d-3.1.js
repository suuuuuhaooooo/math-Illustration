/* 五下 3.1 認識容積：容器「裡面」能裝多少 */
NB.unit({
 q:"一個水槽裡面長 10 公分、寬 8 公分、高 6 公分。它的容積是多少？裝滿水可以裝幾毫升？",
 steps:["容積是容器「裡面」的空間大小，量的是內部的長、寬、高","容積 = 10 × 8 × 6 = 480 立方公分","1 立方公分的水 = 1 毫升，所以裝滿是 480 毫升"],
 ch:{q:"裡面長 12 公分、寬 5 公分、高 4 公分的盒子，容積是幾立方公分？",a:240,h:"12×5×4。"},
 tool:function(b,eq){
  var S=NB.solid(b),l=NB.slider(b,"內長",4,12,1,10,"公分",up),w=NB.slider(b,"內寬",3,8,1,8,"公分",up),hh=NB.slider(b,"內高",3,10,1,6,"公分",up),lv=NB.slider(b,"水面高度",0,10,1,3,"公分",up);
  function up(){lv.el.max=hh.v;if(lv.v>hh.v)lv.v=hh.v;var L=l.v,Wd=w.v,H=hh.v,V=lv.v,F=NB.solid.cuboid(0,0,0,L,H,Wd,{f:"var(--p2)",o:.1,both:true,sw:1.6});
   if(V>0)F=F.concat(NB.solid.cuboid(0,0,0,L,V,Wd,{f:"var(--p2)",o:.62,s:"var(--p2)",sw:1}));
   var i;for(i=1;i<H;i++)F.push({p:[[L,i,Wd],[L,i,0]],f:"none",s:null});
   S.draw(F,[L/2,H/2,Wd/2],Math.min(30,175/Math.max(L,H+1,Wd,4)));
   var cap=L*Wd*H,cur=L*Wd*V;
   eq.innerHTML="容積 "+L+"×"+Wd+"×"+H+" = <b>"+cap+"</b> 立方公分 = <b>"+cap+"</b> 毫升"+(cap>=1000?"（約 "+(cap/1000)+" 公升）":"")+"<br>現在的水："+L+"×"+Wd+"×"+V+" = <b>"+cur+"</b> 毫升"}
  up()}});
