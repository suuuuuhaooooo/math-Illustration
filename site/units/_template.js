/* 新單元範本：複製這個檔案，改名成「年級+u上/d下-章.節.js」，例如 五下 7.1 → 5d-7.1.js
   不需要改任何其他檔案：首頁會自動偵測並打勾，標題與章節資訊自動從 catalog.js 帶入。
   注意：互動程式請全部寫在 tool 裡面（首頁偵測時只會登記，不會執行 tool）。 */
NB.unit({
 q:"在這裡寫例題。",
 steps:["第一步","第二步","答案"],
 ch:{q:"在這裡寫挑戰題（答案是數字）",a:0,h:"提示"},
 tool:function(b,eq){
  /* b：互動區容器；eq：底下會顯示算式的黃色框 */
  var v=NB.svg(b,560,240);                                   // 2D 手繪畫布
  var x=NB.slider(b,"數值",1,10,1,5,"個",draw);               // 拉桿：(容器,名稱,最小,最大,間隔,初值,單位,回呼)
  function draw(){v.innerHTML="";NB.tree(v,280,150,1.5);NB.t(v,280,40,"x = "+x.v,{b:1,z:20});eq.innerHTML="算式：<b>"+x.v+"</b>"}
  draw()
  /* 3D 立體：var S=NB.solid(b); S.draw(NB.solid.grid(0,0,0,4,3,2,{f:"var(--p2)"}),[2,1.5,1],30);
     可用 NB.solid.cuboid / grid / prism 組合；NB.chicken / rabbit / tree / person 是現成的手繪角色 */
 }});
