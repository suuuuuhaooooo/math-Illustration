/* 三下 第三章 尋找規律 3.3：間隔問題（植樹） */
NB.unit({title:"間隔問題（植樹）",ref:"康軒 三下・第三章 尋找規律・3.3 數形規律的應用",
 q:"一條 20 公尺長的路，每隔 5 公尺種一棵樹，<span class='hl'>兩端都要種</span>，一共要種幾棵？",
 steps:["先算有幾段：20 ÷ 5 = 4 段","兩端都種：棵數 = 段數 + 1","4 + 1 = 5 棵"],
 ch:{q:"36 公尺長的圍牆，每隔 4 公尺插一支旗子，兩端都插，共要幾支？",a:10,h:"36÷4=9 段，再加 1。"},
 tool:function(b,eq){
  var m=[["兩端都種",1],["只種一端",0],["兩端都不種",-1]],k=1,row=NB.h('<div class="ctl" style="margin-bottom:6px"></div>');
  var bs=m.map(function(x){var e=NB.h('<button class="pen">'+x[0]+'</button>');e.onclick=function(){k=x[1];draw()};row.appendChild(e);return e});b.appendChild(row);
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200);
  var n=NB.slider(b,"段數",1,10,1,4,"段",function(){draw()}),d=NB.slider(b,"每段長",1,10,1,5,"公尺",function(){draw()});
  function draw(){v.innerHTML="";bs.forEach(function(x,i){x.classList.toggle("on",m[i][1]===k)});
   var N=n.v,D=d.v,x0=36,W=488,u=W/N,c=0,i,x,on;
   NB.mk("rect",{x:x0-14,y:130,width:W+28,height:20,rx:6,fill:"var(--paper)"},v,2);
   for(i=0;i<=N;i++){x=x0+i*u;on=k===1||(k===0&&i>0)||(k===-1&&i>0&&i<N);
    if(on){c++;NB.tree(v,x,122,N>7?.6:.85)}else{NB.mk("path",{d:"M"+(x-7)+" 100l14 14M"+(x+7)+" 100l-14 14",stroke:"var(--p1)",fill:"none"},v,3)}
    if(i<N){NB.mk("path",{d:"M"+(x+5)+" 168H"+(x+u-5)+"M"+(x+5)+" 162v12M"+(x+u-5)+" 162v12",stroke:"var(--p2)",fill:"none"},v,2);NB.t(v,x+u/2,190,D+"公尺",{z:14})}}
   NB.t(v,x0+W/2,32,"全長 "+N*D+" 公尺，共 "+N+" 段",{z:18,b:1});
   eq.innerHTML=N+" 段 "+(k===1?"+ 1":k===0?"（只種一端，棵數＝段數）":"− 1")+" = <b>"+c+" 棵</b>　｜　全長 "+N+"×"+D+" = "+N*D}
  draw()}});
