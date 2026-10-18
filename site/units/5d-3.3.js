/* 五下 3.3 不規則物體的體積：排水法 */
NB.unit({
 q:"水槽底面是 10 公分 × 8 公分。放入一顆石頭後，水面從 5 公分升到 6 公分。石頭的體積是多少？",
 steps:["水面升高的部分，就是石頭擠開的水","上升的體積 = 10 × 8 × (6 − 5) = 80 立方公分","所以石頭的體積是 80 立方公分"],
 ch:{q:"底面 10×8 公分的水槽，放入石頭後水面升高 2 公分，石頭體積幾立方公分？",a:160,h:"10×8×2。"},
 tool:function(b,eq){
  var S=NB.solid(b),inn=true,row=NB.h('<div class="ctl" style="margin-bottom:6px"></div>'),bt=NB.h('<button class="pen go">拿出石頭</button>');row.appendChild(bt);b.appendChild(row);
  var sz=NB.slider(b,"石頭大小",2,4,2,2,"",up),base=NB.slider(b,"原本水位",3,7,1,5,"公分",up);
  bt.onclick=function(){inn=!inn;bt.textContent=inn?"拿出石頭":"放入石頭";up()};
  function up(){var s=sz.v,V=s*s*s+4*s,rise=V/80,B=base.v,lv=inn?Math.min(10,B+rise):B,ox=inn?0:13,F=[];
   F=F.concat(NB.solid.cuboid(0,0,0,10,10,8,{f:"var(--p2)",o:.08,both:true,sw:1.6}));
   F=F.concat(NB.solid.cuboid(0,0,0,10,lv,8,{f:"var(--p2)",o:.55,s:"var(--p2)",sw:1}));
   F=F.concat(NB.solid.cuboid(ox+1,0,1,ox+1+s,s,1+s,{f:"var(--p4b)",sw:1.5})).concat(NB.solid.cuboid(ox+1+s,0,1,ox+3+s,2,1+s,{f:"var(--p4b)",sw:1.5}));
   S.draw(F,[inn?5:8,5,4],14);
   eq.innerHTML=inn?"水位 "+B+" → <b>"+(+lv.toFixed(2))+"</b> 公分，上升 "+(+(lv-B).toFixed(2))+"<br>石頭體積 = 10×8×"+(+(lv-B).toFixed(2))+" = <b>"+Math.round((lv-B)*80)+"</b> 立方公分"+(B+rise>10?"（水滿出來了，結果不準！）":""):"石頭還在水外面，水位是 "+B+" 公分。把它放進去看看水位變多少。"}
  up()}});
