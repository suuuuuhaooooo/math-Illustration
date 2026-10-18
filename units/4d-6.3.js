/* 四下 第六章 周長與面積 6.3 */
NB.unit({title:"周長和面積的關係",ref:"康軒 四下・第六章 周長與面積・6.3 周長和面積的關係",
 q:"長方形的長是 6 公分、寬是 4 公分，周長和面積各是多少？",
 steps:["周長是繞一圈：(長 + 寬) × 2 = (6 + 4) × 2 = 20 公分","面積是數方格：長 × 寬 = 6 × 4 = 24 平方公分","周長一樣的長方形，面積不一定一樣，拖拖看就知道。"],
 ch:{q:"長方形周長 20 公分，長 6 公分，面積是幾平方公分？",a:24,h:"寬 = 20÷2 − 6 = 4。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,300);
  var w=NB.slider(b,"長",1,12,1,6,"公分",function(){draw()}),hh=NB.slider(b,"寬",1,8,1,4,"公分",function(){draw()});
  function draw(){v.innerHTML="";var W=w.v,H=hh.v,s=Math.min(38,440/W,230/H),x0=(560-W*s)/2,y0=(300-H*s)/2+6,i,j;
   for(i=0;i<W;i++)for(j=0;j<H;j++)NB.mk("rect",{x:x0+i*s,y:y0+j*s,width:s,height:s,fill:"var(--p2)",opacity:(i+j)%2?.38:.55},v,1);
   NB.mk("rect",{x:x0,y:y0,width:W*s,height:H*s,fill:"none",stroke:"var(--p1)"},v,4);
   NB.t(v,x0+W*s/2,y0-10,W+" 公分",{b:1});NB.t(v,x0-10,y0+H*s/2+5,H,{a:"end",b:1});
   eq.innerHTML="周長 ("+W+"+"+H+")×2 = <b>"+(W+H)*2+"</b> 公分　｜　面積 "+W+"×"+H+" = <b>"+W*H+"</b> 平方公分"}
  draw()}});
