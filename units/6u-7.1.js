/* 六上 7.1 圓面積：切成小扇形，拼成長方形 */
NB.unit({
 q:"圓的半徑是 5 公分，圓面積是多少平方公分？（圓周率取 3.14）",
 steps:["把圓切成很多等分的小扇形，再交錯拼起來","份數越多，越像長方形：長 = 圓周長的一半 = 3.14 × 5，寬 = 半徑 5","圓面積 = 3.14 × 5 × 5 = 78.5 平方公分"],
 ch:{q:"半徑 10 公分的圓，面積是幾平方公分？（圓周率 3.14）",a:314,h:"3.14×10×10。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,300);
  var r=NB.slider(b,"半徑",2,6,1,5,"公分",up),n=NB.slider(b,"切成幾份",4,32,2,8,"份",up),t=NB.slider(b,"拼合程度",0,1,.05,0,"",up);
  function ang(a,T){var d=((T-a)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;return a+d}
  function up(){v.innerHTML="";var N=n.v,u=22,rr=r.v*u,th=Math.PI/N,T=t.v,i;
   var span=N*rr*Math.sin(th),cx=280,cy=135,xs=(560-span-rr*Math.sin(th))/2,yb=215;
   for(i=0;i<N;i++){var a0=-Math.PI/2+2*Math.PI*i/N,up2=i%2===0,k=Math.floor(i/2),ax=xs+k*2*rr*Math.sin(th)+(up2?0:rr*Math.sin(th)),ay=up2?yb:yb-rr*Math.cos(th),a1=ang(a0,up2?-Math.PI/2:Math.PI/2),
    X=cx+(ax-cx)*T,Y=cy+(ay-cy)*T,A=a0+(a1-a0)*T,p1=[X+rr*Math.cos(A-th),Y+rr*Math.sin(A-th)],p2=[X+rr*Math.cos(A+th),Y+rr*Math.sin(A+th)];
    NB.mk("path",{d:"M"+X+" "+Y+"L"+p1+"A"+rr+" "+rr+" 0 0 1 "+p2+"Z",fill:up2?"var(--p4)":"var(--p2)",opacity:.9},v,1.4)}
   var R2=r.v;eq.innerHTML="圓周長一半 ≈ 3.14×"+R2+" = "+(+(3.14*R2).toFixed(2))+"（長）｜ 半徑 "+R2+"（寬）<br>圓面積 = 3.14 × "+R2+" × "+R2+" = <b>"+(+(3.14*R2*R2).toFixed(2))+"</b> 平方公分"}
  up()}});
