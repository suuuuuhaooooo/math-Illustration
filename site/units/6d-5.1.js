/* 六下 第五章 怎樣解題 5.1 和差問題 */
NB.unit({title:"和差問題",ref:"康軒 六下・第五章 怎樣解題・5.1 和差問題",
 q:"哥哥和妹妹共有 100 元，哥哥比妹妹多 20 元。兩人各有多少元？",
 steps:["把「多的 20 元」先拿走，剩 100 − 20 = 80 元","剩下的兩人一樣多：80 ÷ 2 = 40 元（妹妹）","哥哥 = 40 + 20 = 60 元"],
 ch:{q:"兩數和是 150，差是 30，較大的數是多少？",a:90,h:"(150−30)÷2=60，再加 30。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,210);
  var s=NB.slider(b,"兩數和",20,100,2,100,"",function(){df.el.max=s.v-2;if(df.v>s.v-2)df.v=s.v-2;draw()}),df=NB.slider(b,"兩數差",0,98,2,20,"",function(){draw()});
  function draw(){v.innerHTML="";var T=s.v,D=df.v,sm=(T-D)/2,bg=sm+D,sc=420/Math.max(bg,1);
   NB.mk("rect",{x:70,y:44,width:bg*sc,height:42,fill:"var(--p4)"},v,2.5);
   NB.mk("rect",{x:70+sm*sc,y:44,width:D*sc,height:42,fill:"var(--p1)"},v,2.5);
   NB.mk("rect",{x:70,y:124,width:sm*sc,height:42,fill:"var(--p3)"},v,2.5);
   NB.t(v,34,72,"哥哥",{b:1});NB.t(v,34,152,"妹妹",{b:1});
   if(D>0)NB.t(v,70+(sm+D/2)*sc,36,"差 "+D,{b:1,c:"var(--p1)"});
   NB.t(v,70+sm*sc/2,72,sm,{b:1,c:"#2f2a26"});NB.t(v,70+sm*sc/2,152,sm,{b:1,c:"#2f2a26"});
   NB.mk("path",{d:"M70 192H"+(70+bg*sc),fill:"none",stroke:"var(--p2)"},v,2.5);NB.t(v,70+bg*sc/2,205,"哥哥的錢",{z:13});
   eq.innerHTML="妹妹 ("+T+"−"+D+")÷2 = <b>"+sm+"</b>　｜　哥哥 "+sm+"+"+D+" = <b>"+bg+"</b>"}
  draw()}});
