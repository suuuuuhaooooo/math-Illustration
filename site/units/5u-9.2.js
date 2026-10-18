/* 五上 9.2 三角形的面積：兩個一樣的三角形拼成平行四邊形 */
NB.unit({
 q:"一個三角形的底是 6 公分、高是 4 公分，面積是多少平方公分？",
 steps:["拿兩個一模一樣的三角形，轉一轉可以拼成平行四邊形","平行四邊形面積 = 底 × 高 = 6 × 4 = 24","三角形是它的一半：24 ÷ 2 = 12 平方公分"],
 ch:{q:"三角形的底 10 公分、高 7 公分，面積是幾平方公分？",a:35,h:"10×7÷2。"},
 tool:function(b,eq){
  var two=false,row=NB.h('<div class="ctl" style="margin-bottom:6px"></div>'),bt=NB.h('<button class="pen go">再拿一個拼起來</button>');row.appendChild(bt);b.appendChild(row);
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,260);
  var bs=NB.slider(b,"底",2,12,1,6,"公分",up),hh=NB.slider(b,"高",2,8,1,4,"公分",up),p=NB.slider(b,"頂點位置",0,12,1,3,"公分",up);
  bt.onclick=function(){two=!two;bt.textContent=two?"拆開":"再拿一個拼起來";up()};
  function up(){p.el.max=bs.v;if(p.v>bs.v)p.v=bs.v;v.innerHTML="";var B=bs.v,H=hh.v,X=p.v,u=Math.min(26,300/(B+X+1),190/H),x0=40,y0=235,i;
   for(i=0;i<=B+X+1&&i<=20;i++)NB.mk("path",{d:"M"+(x0+i*u)+" "+(y0-H*u)+"V"+y0,fill:"none",stroke:"var(--rule)"},v,1);for(i=0;i<=H;i++)NB.mk("path",{d:"M"+x0+" "+(y0-i*u)+"H"+(x0+(B+X+1)*u),fill:"none",stroke:"var(--rule)"},v,1);
   var T=[[x0,y0],[x0+B*u,y0],[x0+X*u,y0-H*u]];NB.mk("polygon",{points:T.join(" "),fill:"var(--p4)",opacity:.85},v,2.5);
   if(two)NB.mk("polygon",{points:[[x0+(B+X)*u,y0-H*u],[x0+X*u,y0-H*u],[x0+B*u,y0]].join(" "),fill:"var(--p2)",opacity:.8},v,2.5);
   NB.mk("path",{d:"M"+(x0+X*u)+" "+(y0-H*u)+"V"+y0,fill:"none",stroke:"var(--p1)","stroke-dasharray":"5 4"},v,2);
   NB.t(v,x0+B*u/2,y0+20,"底 "+B,{b:1});NB.t(v,x0+X*u+8,y0-H*u/2,"高 "+H,{a:"start",b:1,c:"var(--p1)"});
   eq.innerHTML=two?"平行四邊形 "+B+"×"+H+" = "+B*H+"　→　三角形 "+B*H+"÷2 = <b>"+B*H/2+"</b> 平方公分":"三角形面積 = 底×高÷2 = "+B+"×"+H+"÷2 = <b>"+B*H/2+"</b> 平方公分"}
  up()}});
