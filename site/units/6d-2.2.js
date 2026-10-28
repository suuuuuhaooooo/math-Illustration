/* 六下 第二章 速率的應用 2.2 相離和相遇問題 */
NB.unit({title:"相離和相遇問題",ref:"康軒 六下・第二章 速率的應用・2.2 相離和相遇問題",
 q:"小安和小美相距 180 公尺，面對面走。小安每分鐘走 40 公尺，小美每分鐘走 50 公尺，幾分鐘後相遇？",
 steps:["每分鐘兩人一起縮短：40 + 50 = 90 公尺","距離 ÷ 速度和：180 ÷ 90 = 2 分鐘"],
 ch:{q:"相距 270 公尺，甲每分 60 公尺、乙每分 30 公尺，面對面走，幾分鐘相遇？",a:3,h:"速度和是 60+30=90。"},
 tool:function(b,eq){
  var D=180,st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,190);
  var v1=NB.slider(b,"小安速度",10,80,5,40,"公尺/分",function(){draw()}),v2=NB.slider(b,"小美速度",10,80,5,50,"公尺/分",function(){draw()}),tm=NB.slider(b,"經過時間",0,6,0.1,0,"分鐘",function(){draw()});
  function draw(){v.innerHTML="";var x0=50,W=460,f=function(d){return x0+Math.max(0,Math.min(d,D))/D*W},T=D/(v1.v+v2.v),t=tm.v,a=v1.v*t,bb=D-v2.v*t,met=a>=bb,mx=f(D*v1.v/(v1.v+v2.v));
   NB.mk("path",{d:"M"+x0+" 130H"+(x0+W),fill:"none"},v,3);NB.mk("path",{d:"M"+x0+" 122v16M"+(x0+W)+" 122v16",fill:"none"},v,2.5);
   NB.mk("path",{d:"M"+mx+" 40V140",fill:"none",stroke:"var(--p1)","stroke-dasharray":"6 5"},v,2.5);NB.t(v,mx,32,"相遇點",{z:14,c:"var(--p1)"});
   NB.person(v,met?mx-12:f(a),108,"var(--p2)",1);NB.person(v,met?mx+12:f(bb),108,"var(--p3)",1);
   NB.t(v,x0,165,"小安 0",{z:14});NB.t(v,x0+W,165,"小美 "+D+" 公尺",{z:14});
   eq.innerHTML=D+" ÷ ("+v1.v+"+"+v2.v+") = <b>"+(+T.toFixed(2))+"</b> 分鐘後相遇"+(met?"　已經相遇囉！":"")}
  draw()}});
