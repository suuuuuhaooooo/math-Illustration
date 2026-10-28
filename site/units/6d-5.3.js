/* 六下 第五章 怎樣解題 5.3 雞兔問題 */
NB.unit({title:"雞兔問題（雞兔同籠）",ref:"康軒 六下・第五章 怎樣解題・5.3 雞兔問題",
 q:"籠子裡有雞和兔共 8 隻，數一數共有 26 隻腳。雞和兔各幾隻？",
 steps:["假設 8 隻全是雞：8 × 2 = 16 隻腳","實際 26 隻腳，少了 26 − 16 = 10 隻","每把 1 隻雞換成兔，多 2 隻腳：10 ÷ 2 = 5 隻兔","雞 = 8 − 5 = 3 隻"],
 ch:{q:"雞兔共 12 隻，共 34 隻腳，兔有幾隻？",a:5,h:"假設全是雞：24 腳，少了 10 腳。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,240);
  var hd=NB.slider(b,"頭（隻數）",2,16,1,8,"隻",function(){lg.el.min=2*hd.v;lg.el.max=4*hd.v;if(lg.v<2*hd.v)lg.v=2*hd.v;if(lg.v>4*hd.v)lg.v=4*hd.v;draw()}),lg=NB.slider(b,"腳的總數",16,64,2,26,"隻",function(){draw()});
  lg.el.min=16;lg.el.max=32;
  function draw(){v.innerHTML="";var H=hd.v,L=lg.v,r=(L-2*H)/2,c=H-r,i,x,y;
   for(i=0;i<H;i++){x=42+(i%8)*62;y=60+Math.floor(i/8)*84;if(i<c)NB.chicken(v,x,y,.95);else NB.rabbit(v,x,y,.9)}
   NB.t(v,280,228,"假設全是雞：每隻 2 腳，共 "+2*H+" 腳，還差 "+(L-2*H)+" 腳",{z:15});
   eq.innerHTML="兔："+"("+L+"−"+H+"×2)÷2 = <b>"+r+"</b> 隻　｜　雞："+H+"−"+r+" = <b>"+c+"</b> 隻"}
  draw()}});
