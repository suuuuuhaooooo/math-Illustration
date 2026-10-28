/* 五下 7.2 長方體的表面積：立體圖＋展開圖 */
NB.unit({
 q:"長方體的長 5 公分、寬 3 公分、高 4 公分。要把它的 6 個面都貼上色紙，至少需要多少平方公分的色紙？",
 steps:["長方體有 3 組一樣大的面：上下、前後、左右","上下：5×3 = 15（2 個）　前後：5×4 = 20（2 個）　左右：3×4 = 12（2 個）","表面積 = (15 + 20 + 12) × 2 = 94 平方公分"],
 ch:{q:"長 6、寬 4、高 3 公分的長方體，表面積是幾平方公分？",a:108,h:"(24+18+12)×2。"},
 tool:function(b,eq){
  var S=NB.solid(b),C={top:"var(--p4)",bottom:"var(--p4)",front:"var(--p1)",back:"var(--p1)",left:"var(--p3)",right:"var(--p3)"};
  var l=NB.slider(b,"長",1,8,1,5,"公分",up),w=NB.slider(b,"寬",1,6,1,3,"公分",up),hh=NB.slider(b,"高",1,6,1,4,"公分",up);
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,250);
  function up(){var L=l.v,Wd=w.v,H=hh.v;S.draw(NB.solid.grid(0,0,0,L,H,Wd,{col:C,sw:.9}),[L/2,H/2,Wd/2],Math.min(32,170/Math.max(L,H+1,Wd,4)));
   v.innerHTML="";var u=Math.min(18,500/(2*L+2*Wd),215/(2*Wd+H)),x0=(560-(2*L+2*Wd)*u)/2,y0=14;
   function R(x,y,ww,hh2,col,lab){NB.mk("rect",{x:x0+x*u,y:y0+y*u,width:ww*u,height:hh2*u,fill:col,opacity:.9},v,2);NB.t(v,x0+(x+ww/2)*u,y0+(y+hh2/2)*u+5,lab,{z:13,c:"#2f2a26",b:1})}
   R(Wd,0,L,Wd,C.top,L+"×"+Wd);R(0,Wd,Wd,H,C.left,Wd+"×"+H);R(Wd,Wd,L,H,C.front,L+"×"+H);R(Wd+L,Wd,Wd,H,C.right,Wd+"×"+H);R(2*Wd+L,Wd,L,H,C.back,L+"×"+H);R(Wd,Wd+H,L,Wd,C.bottom,L+"×"+Wd);
   var a=L*Wd,c=L*H,d=Wd*H;eq.innerHTML="("+a+" + "+c+" + "+d+") × 2 = <b>"+(a+c+d)*2+"</b> 平方公分　（同色的面一樣大）"}
  up()}});
