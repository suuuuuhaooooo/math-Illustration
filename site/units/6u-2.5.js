/* 六上 2.5 被除數、除數和商的關係 */
NB.unit({
 q:"觀察算式，當除數大於 1、等於 1、小於 1 時，『商』和『被除數』的大小關係是什麼？",
 steps:["除數 > 1 時：結果（商）會比原本的數（被除數）還要小。","除數 = 1 時：結果（商）和原本的數（被除數）一樣大。","除數 < 1 時：結果（商）會比原本的數（被除數）還要大！"],
 ch:{q:"如果 a ÷ 0.8 = b，請問 a 和 b 誰比較大？（輸入 1 代表 a，輸入 2 代表 b）",a:2,h:"除以小於 1 的數，商（b）會比被除數（a）大。"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,180);
  var div=NB.slider(b,"除數",0.5,2,0.5,1,"",draw);
  function draw(){
   v.innerHTML="";
   var d=div.v, dividend=60, cx=60, cy=80;
   var ans = dividend / d;

   /* 基準線 */
   NB.mk("line",{x1:cx,y1:cy-10,x2:cx,y2:cy+60,stroke:"var(--soft)",'stroke-dasharray':"4 2"},v);

   /* 被除數 Bar */
   NB.mk("rect",{x:cx,y:cy-20,width:dividend*3,height:20,fill:"var(--p2)",stroke:"var(--ink)",'stroke-width':1.5},v);
   NB.t(v,cx+dividend*3+15,cy-6,"被除數 ("+dividend+")",{z:14,fill:"var(--p2)",b:1});

   /* 商 Bar */
   NB.mk("rect",{x:cx,y:cy+30,width:ans*3,height:20,fill:"var(--p1)",stroke:"var(--ink)",'stroke-width':1.5},v);
   NB.t(v,cx+ans*3+15,cy+44,"商 ("+ans+")",{z:14,fill:"var(--p1)",b:1});

   var rel = "";
   if(d>1) rel = "<b class='no'>除數 > 1，商 < 被除數 (縮小了)</b>";
   else if(d===1) rel = "<b>除數 = 1，商 = 被除數 (沒變)</b>";
   else rel = "<b class='ok'>除數 < 1，商 > 被除數 (反而變大了！)</b>";

   eq.innerHTML="算式：60 ÷ "+d+" = <b>"+ans+"</b><br>➔ "+rel;
  }
  draw();
 }
});