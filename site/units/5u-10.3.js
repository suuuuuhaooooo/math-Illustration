/* 五上 第十章 柱體、錐體和球 10.3：面與面的關係 */
NB.unit({
  title: "面與面的關係",
  ref: "五上・第十章 柱體、錐體和球・10.3 面與面的關係",
  q: "在長方體中，相鄰的面和相對的面有什麼關係？",
  steps: [
    "在柱體中，面與面有兩種常見的關係：",
    "1. 【互相平行】：像天花板和地板一樣，永遠不會相交。例如：上下兩個底面。",
    "2. 【互相垂直】：像牆壁和地板一樣，夾角剛好是 90 度。例如：底面與側面。"
  ],
  ch: { 
    q: "長方體的「上面」和「前面」是什麼關係？", 
    a: "互相垂直", 
    h: "它們相鄰並交於一條邊，夾角是 90 度直角。" 
  },
  tool: function(b, eq) {
    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var btns = [NB.h('<button class="pen on">互相平行的面 (相對)</button>'), NB.h('<button class="pen">互相垂直的面 (相鄰)</button>')];
    var currentMode = 0; 
    
    btns.forEach(function(btn, i) {
      btn.onclick = function() { btns.forEach(function(el){ el.classList.remove('on'); }); btn.classList.add('on'); currentMode = i; draw(); };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    var v = NB.svg(st, 500, 240);
    v.style.fontFamily = "system-ui, -apple-system, sans-serif";

    function draw() {
      v.innerHTML = ""; 
      // 繪製透視長方體
      var pTop = [{x: 160, y: 50}, {x: 300, y: 50}, {x: 340, y: 90}, {x: 200, y: 90}];
      var pBot = [{x: 160, y: 150}, {x: 300, y: 150}, {x: 340, y: 190}, {x: 200, y: 190}];
      
      var topStr = pTop.map(function(p){return p.x+","+p.y}).join(" ");
      var botStr = pBot.map(function(p){return p.x+","+p.y}).join(" ");
      var frontStr = pTop[3].x+","+pTop[3].y+" "+pTop[2].x+","+pTop[2].y+" "+pBot[2].x+","+pBot[2].y+" "+pBot[3].x+","+pBot[3].y;
      
      // 畫背面透視線
      NB.mk("line", { x1: pTop[0].x, y1: pTop[0].y, x2: pBot[0].x, y2: pBot[0].y, stroke: "#cbd5e1", "stroke-width": 2, "stroke-dasharray":"4,4" }, v, 1);
      NB.mk("line", { x1: pBot[0].x, y1: pBot[0].y, x2: pBot[1].x, y2: pBot[1].y, stroke: "#cbd5e1", "stroke-width": 2, "stroke-dasharray":"4,4" }, v, 1);
      NB.mk("line", { x1: pBot[0].x, y1: pBot[0].y, x2: pBot[3].x, y2: pBot[3].y, stroke: "#cbd5e1", "stroke-width": 2, "stroke-dasharray":"4,4" }, v, 1);

      if (currentMode === 0) {
          // 平行：高亮上底面和下底面
          NB.mk("polygon", { points: topStr, fill: "var(--p1)", "fill-opacity": "0.7", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin":"round" }, v, 2);
          NB.mk("polygon", { points: botStr, fill: "var(--p2)", "fill-opacity": "0.7", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin":"round" }, v, 2);
          
          NB.t(v, 150, 70, "上面", { z: 18, c: "var(--p1)", b: 1 });
          NB.t(v, 150, 180, "下面", { z: 18, c: "var(--p2)", b: 1 });
          eq.innerHTML = '長方體的「上面」與「下面」永遠不會相交，它們是<b style="color:var(--p1)">互相平行</b>的面！';
          
      } else {
          // 垂直：高亮底面與前面
          NB.mk("polygon", { points: botStr, fill: "var(--p2)", "fill-opacity": "0.7", stroke: "var(--p2)", "stroke-width": 3, "stroke-linejoin":"round" }, v, 2);
          NB.mk("polygon", { points: frontStr, fill: "var(--p1)", "fill-opacity": "0.6", stroke: "var(--p1)", "stroke-width": 3, "stroke-linejoin":"round" }, v, 3);
          
          NB.mk("path", { d: "M 200 170 L 220 170 L 220 190", fill:"none", stroke:"#e91e63", "stroke-width": 3 }, v, 4); // 直角標示
          
          NB.t(v, 270, 140, "前面", { z: 18, c: "#fff", b: 1 });
          NB.t(v, 360, 180, "下面", { z: 18, c: "var(--p2)", b: 1 });
          eq.innerHTML = '長方體的「前面」與「下面」相鄰，夾角剛好是直角，它們是<b style="color:var(--p1)">互相垂直</b>的面！';
      }
      
      // 畫前面骨架
      NB.mk("polygon", { points: frontStr, fill: "none", stroke: "#333", "stroke-width": 2, "stroke-linejoin":"round" }, v, 5);
      NB.mk("polygon", { points: topStr, fill: "none", stroke: "#333", "stroke-width": 2, "stroke-linejoin":"round" }, v, 5);
      NB.mk("line", { x1: pTop[1].x, y1: pTop[1].y, x2: pBot[1].x, y2: pBot[1].y, stroke: "#333", "stroke-width": 2 }, v, 5);
    }
    draw();
  }
});