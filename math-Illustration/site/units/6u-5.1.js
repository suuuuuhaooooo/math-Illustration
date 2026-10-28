/* 六上 5.1 比與比值 (點擊增加互動) */
NB.unit({
 q:"桌上有蘋果和橘子，請動手加入你喜歡的數量！觀察它們的『比』和『比值』會怎麼變化？",
 steps:[
  "蘋果數量和橘子數量的關係，我們記作「蘋果數 : 橘子數」，這叫做「比」。",
  "前面的數叫前項，後面的數叫後項。",
  "把前項除以後項（前項 ÷ 後項），算出來的結果就叫做「比值」。"
 ],
 ch:{q:"如果蘋果有 3 顆，橘子有 4 顆，蘋果對橘子的比值是多少？（填寫分數或小數）",a:0.75,h:"3 ÷ 4 ＝ 3/4 ＝ 0.75"},
 tool:function(b,eq){
  var st=NB.h('<div class="stage"></div>');b.appendChild(st);var v=NB.svg(st,560,200);
  
  /* 建立按鈕控制區 (取代拉桿) */
  var ctl = NB.h('<div class="ctl" style="justify-content:center; margin-bottom:10px;"></div>');
  var btnA = NB.h('<button class="pen on" style="margin-right:10px; background:var(--p1); color:#fff;">+ 加蘋果</button>');
  var btnO = NB.h('<button class="pen on" style="margin-right:10px; background:var(--p4); color:#fff;">+ 加橘子</button>');
  var btnReset = NB.h('<button class="pen">重置</button>');
  ctl.appendChild(btnA); ctl.appendChild(btnO); ctl.appendChild(btnReset);
  b.insertBefore(ctl, st);

  var a = 2, o = 3; // 預設數量

  btnA.onclick = function(){ if(a<10) a++; draw(); };
  btnO.onclick = function(){ if(o<10) o++; draw(); };
  btnReset.onclick = function(){ a=0; o=0; draw(); };
  
  function draw(){
   v.innerHTML="";
   var cx = 30, cy = 50, gap = 40;

   /* 畫蘋果 */
   NB.t(v, cx, cy, "蘋果", {z:14, b:1});
   for(var i=0; i<a; i++){
    NB.mk("circle",{cx:cx+60+i*gap, cy:cy-5, r:15, fill:"var(--p1)", stroke:"var(--ink)"},v);
    NB.mk("path",{d:"M"+(cx+60+i*gap)+" "+(cy-20)+" Q"+(cx+65+i*gap)+" "+(cy-30)+" "+(cx+70+i*gap)+" "+(cy-25), stroke:"var(--p3)", 'stroke-width':3, fill:"none"},v); // 葉子/梗
   }

   /* 畫橘子 */
   NB.t(v, cx, cy+70, "橘子", {z:14, b:1});
   for(var j=0; j<o; j++){
    NB.mk("circle",{cx:cx+60+j*gap, cy:cy+65, r:15, fill:"var(--p4)", stroke:"var(--ink)"},v);
    NB.mk("circle",{cx:cx+60+j*gap, cy:cy+65, r:2, fill:"var(--ink)"},v); // 橘子蒂頭
   }

   if(o === 0 && a === 0) {
       eq.innerHTML="請點擊按鈕加入水果！";
   } else if (o === 0) {
       eq.innerHTML="蘋果數 : 橘子數 ＝ <b>"+a+" : 0</b><br>後項不能為 0，所以無法計算比值。";
   } else {
       var ratioValue = (a/o).toFixed(2);
       // 試著轉換為分數顯示
       var frac = a + "/" + o;
       function gcd(x,y){ return y===0 ? x : gcd(y, x%y); }
       var g = gcd(a, o);
       if(g > 1) frac = (a/g) + "/" + (o/g);

       eq.innerHTML="蘋果數 : 橘子數 ＝ <b class='ok'>"+a+" : "+o+"</b><br>比值 ＝ "+a+" ÷ "+o+" ＝ <b class='ok'>"+frac+"</b> (或 "+ratioValue+")";
  }
  }
  draw();
 }
});