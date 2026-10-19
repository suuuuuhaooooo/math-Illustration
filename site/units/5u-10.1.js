/* 五上 第十章 柱體、錐體和球 10.1：柱體和錐體的分類與命名 */
NB.unit({
  title: "柱體和錐體的分類與命名",
  ref: "五上・第十章 柱體、錐體和球・10.1 柱體和錐體的分類與命名",
  q: "立體圖形是怎麼命名的呢？",
  steps: [
    "立體圖形的命名規則是：【底面形狀】 + 【柱體或錐體】",
    "1. 先看側面：上下直直的一樣粗，是「柱體」；往上尖尖的，是「錐體」。",
    "2. 再看底面：底面是三角形叫「三角」，是四邊形叫「四角」，是圓形叫「圓」。",
    "組合起來：例如底面是圓形，又是尖的，就叫作「圓錐」。"
  ],
  ch: { 
    q: "底面是五邊形，且有上下兩個底面的圖形叫什麼？", 
    a: "五角柱", 
    h: "五邊形 -> 五角，兩個底面 -> 柱體。" 
  },
  tool: function(b, eq) {
    var row1 = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var row2 = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center; border-top:1px dashed #ccc; padding-top:10px;"></div>');
    
    var typeMode = 0; // 0: 柱, 1: 錐
    var baseMode = 0; // 0: 三角, 1: 四角, 2: 圓
    
    var tBtns = [NB.h('<button class="pen on">柱體 (上下兩底面)</button>'), NB.h('<button class="pen">錐體 (尖尖一頂點)</button>')];
    var bBtns = [NB.h('<button class="pen on">三角形底面</button>'), NB.h('<button class="pen">四邊形底面</button>'), NB.h('<button class="pen">圓形底面</button>')];
    
    tBtns.forEach(function(btn, i) {
      btn.onclick = function() { tBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); typeMode = i; draw(); };
      row1.appendChild(btn);
    });
    bBtns.forEach(function(btn, i) {
      btn.onclick = function() { bBtns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); baseMode = i; draw(); };
      row2.appendChild(btn);
    });
    b.appendChild(row1); b.appendChild(row2);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      var cx = 250, cyTop = 50, cyBot = 180, rX = 70, rY = 25;
      
      var baseName = ["三角", "四角", "圓"][baseMode];
      var typeName = ["柱", "錐"][typeMode];
      var fullName = baseName + typeName;
      
      var isCylinder = (baseMode === 2);
      
      if (typeMode === 0) { // 柱體
          if (isCylinder) {
              NB.mk("path", { d: "M "+(cx-rX)+" "+cyTop+" L "+(cx-rX)+" "+cyBot+" A "+rX+" "+rY+" 0 0 0 "+(cx+rX)+" "+cyBot+" L "+(cx+rX)+" "+cyTop, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 3 }, v, 1);
              NB.mk("path", { d: "M "+(cx-rX)+" "+cyBot+" A "+rX+" "+rY+" 0 0 1 "+(cx+rX)+" "+cyBot, fill: "none", stroke: "var(--p2)", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 1);
              NB.mk("ellipse", { cx: cx, cy: cyTop, rx: rX, ry: rY, fill: "var(--p1)", "fill-opacity": "0.6", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
              NB.mk("ellipse", { cx: cx, cy: cyBot, rx: rX, ry: rY, fill: "var(--p1)", "fill-opacity": "0.3", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
          } else {
              var sides = (baseMode === 0) ? 3 : 4;
              var ptsT = [], ptsB = [];
              var angOffset = (sides===4) ? Math.PI/4 : -Math.PI/2;
              for(var i=0; i<sides; i++){
                  var px = cx + rX * Math.cos(angOffset + i*2*Math.PI/sides);
                  var py = cyTop + rY * Math.sin(angOffset + i*2*Math.PI/sides);
                  ptsT.push({x: px, y: py}); ptsB.push({x: px, y: py+(cyBot-cyTop)});
              }
              for(var j=0; j<sides; j++){
                  var next = (j+1)%sides;
                  var isBack = Math.sin(angOffset + j*2*Math.PI/sides) < 0 && Math.sin(angOffset + next*2*Math.PI/sides) < 0;
                  if (!isBack || sides===4) NB.mk("polygon", { points: ptsT[j].x+","+ptsT[j].y+" "+ptsT[next].x+","+ptsT[next].y+" "+ptsB[next].x+","+ptsB[next].y+" "+ptsB[j].x+","+ptsB[j].y, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 2, "stroke-linejoin":"round" }, v, 1);
              }
              NB.mk("polygon", { points: ptsT.map(function(p){return p.x+","+p.y}).join(" "), fill: "var(--p1)", "fill-opacity": "0.6", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
              NB.mk("polygon", { points: ptsB.map(function(p){return p.x+","+p.y}).join(" "), fill: "var(--p1)", "fill-opacity": "0.3", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
          }
      } else { // 錐體
          if (isCylinder) {
              NB.mk("path", { d: "M "+(cx-rX)+" "+cyBot+" L "+cx+" "+cyTop+" L "+(cx+rX)+" "+cyBot+" A "+rX+" "+rY+" 0 0 1 "+(cx-rX)+" "+cyBot, fill: "#e0f2fe", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin": "round" }, v, 1);
              NB.mk("path", { d: "M "+(cx-rX)+" "+cyBot+" A "+rX+" "+rY+" 0 0 1 "+(cx+rX)+" "+cyBot, fill: "none", stroke: "var(--p2)", "stroke-width": 2, "stroke-dasharray": "4,4" }, v, 1);
              NB.mk("ellipse", { cx: cx, cy: cyBot, rx: rX, ry: rY, fill: "var(--p1)", "fill-opacity": "0.4", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
          } else {
              var sides = (baseMode === 0) ? 3 : 4;
              var ptsB = [];
              var angOffset = (sides===4) ? Math.PI/4 : -Math.PI/2;
              for(var k=0; k<sides; k++){ ptsB.push({x: cx + rX * Math.cos(angOffset + k*2*Math.PI/sides), y: cyBot + rY * Math.sin(angOffset + k*2*Math.PI/sides)}); }
              for(var l=0; l<sides; l++){
                  var next = (l+1)%sides;
                  var isBack = Math.sin(angOffset + l*2*Math.PI/sides) < 0;
                  var strStyle = isBack ? { stroke: "var(--p2)", "stroke-width": 2, "stroke-dasharray":"4,4" } : { stroke: "var(--p2)", "stroke-width": 2 };
                  NB.mk("line", { x1: cx, y1: cyTop, x2: ptsB[l].x, y2: ptsB[l].y, stroke: strStyle.stroke, "stroke-width": strStyle["stroke-width"], "stroke-dasharray": strStyle["stroke-dasharray"] || "" }, v, 1);
              }
              NB.mk("polygon", { points: ptsB.map(function(p){return p.x+","+p.y}).join(" "), fill: "var(--p1)", "fill-opacity": "0.3", stroke: "var(--p1)", "stroke-width": 3 }, v, 2);
          }
      }

      NB.t(v, 250, 225, fullName, { z: 28, c: "var(--p1)", b: 1 });
      eq.innerHTML = '底面形狀是 <b style="color:var(--p1)">' + baseName + (isCylinder?'形':'形') + '</b>，側面特徵是 <b style="color:var(--p2)">' + typeName + '體</b>。<br>組合起來就是：<b>' + fullName + '</b>！';
    }
    draw();
  }
});