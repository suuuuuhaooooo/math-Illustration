/* 五上 第六章 異分母分數的加減 6.3：分數的應用 */
NB.unit({
  title: "分數的應用",
  ref: "五上・第六章 異分母分數的加減・6.3 分數的應用",
  q: "水缸裡原本有 <span class='hl'>1/2</span> 公升的水，再倒入 <span class='hl'>1/5</span> 公升後，現在共有多少公升？",
  steps: [
    "「再倒入」代表要把原來的水加上新加的水，使用加法。",
    "列式：1/2 + 1/5",
    "找出 2 和 5 的最小公倍數 10 進行通分。",
    "1/2 = 5/10，1/5 = 2/10。",
    "5/10 + 2/10 = 7/10。所以共有 7/10 公升。"
  ],
  ch: { 
    q: "一條繩子長 4/5 公尺，剪去 1/2 公尺後，還剩下幾公尺？", 
    a: "3/10 公尺", 
    h: "用減法：4/5 - 1/2 = 8/10 - 5/10 = 3/10" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">這是一個容量為 1 公升的水槽，點擊按鈕執行動作：</div>');
    b.appendChild(desc);

    var btnRow = NB.h('<div style="margin-bottom:10px; display:flex; gap:10px; justify-content:center;"></div>');
    var state = 0; // 0: 原本 1/2, 1: 倒入 1/5
    
    var btn1 = NB.h('<button class="pen on">原本有 1/2 公升</button>');
    var btn2 = NB.h('<button class="pen">再倒入 1/5 公升</button>');
    btn1.onclick = function() { state = 0; btn1.classList.add('on'); btn2.classList.remove('on'); draw(); };
    btn2.onclick = function() { state = 1; btn2.classList.add('on'); btn1.classList.remove('on'); draw(); };
    btnRow.appendChild(btn1); btnRow.appendChild(btn2);
    b.appendChild(btnRow);
    
    var st = NB.h('<div class="stage" style="background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);
    
    var v = NB.svg(st, 500, 280);
    v.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 5px; line-height:1.2; font-family:monospace; font-size:20px; font-weight:bold;">' +
             '<div style="border-bottom:2px solid currentColor; padding:0 5px;">' + num + '</div>' +
             '<div style="padding:0 5px;">' + den + '</div></div>';
    }

    function draw() {
      v.innerHTML = ""; 
      var cx = 250, bottomY = 240, w = 120, h = 180;
      var leftX = cx - w/2;
      
      // 畫水槽背板與刻度
      NB.mk("rect", { x: leftX, y: bottomY - h, width: w, height: h, fill: "rgba(255,255,255,0.1)" }, v, 1);
      for(var i = 1; i <= 10; i++) {
          var yPos = bottomY - (h/10)*i;
          NB.mk("line", { x1: leftX, y1: yPos, x2: leftX + 15, y2: yPos, stroke: "#666", "stroke-width": 2 }, v, 2);
          if (i === 5) NB.t(v, leftX - 25, yPos + 5, "1/2", { z: 14, c: "#aaa", b: 1 });
          if (i === 10) NB.t(v, leftX - 25, yPos + 5, "1L", { z: 14, c: "#aaa", b: 1 });
      }

      // 畫出原來的水位
      var waterH1 = (h / 10) * 5;
      NB.mk("rect", { x: leftX, y: bottomY - waterH1, width: w, height: waterH1, fill: "var(--p2)", "fill-opacity": "0.7" }, v, 3);
      
      if (state === 0) {
          NB.t(v, cx, bottomY - waterH1/2 + 5, "原來的水 1/2 公升", { z: 16, c: "#fff", b: 1 });
          eq.innerHTML = '水槽裡現在有 ' + frac(1, 2) + ' 公升的水。';
      } else {
          // 畫出新加入的水位
          var waterH2 = (h / 10) * 2;
          NB.mk("rect", { x: leftX, y: bottomY - waterH1 - waterH2, width: w, height: waterH2, fill: "var(--p1)", "fill-opacity": "0.85" }, v, 4);
          
          NB.t(v, cx, bottomY - waterH1/2 + 5, "原來的水 1/2", { z: 16, c: "#fff", b: 1 });
          NB.t(v, cx, bottomY - waterH1 - waterH2/2 + 5, "新加入 1/5", { z: 16, c: "#fff", b: 1 });
          
          // 在右側畫大括號標示總和
          var rightX = leftX + w + 10;
          var topY = bottomY - waterH1 - waterH2;
          NB.mk("path", { d: "M" + rightX + " " + topY + " Q" + (rightX+15) + " " + topY + " " + (rightX+15) + " " + (topY + (waterH1+waterH2)/2 - 10) + " T" + (rightX+30) + " " + (topY + (waterH1+waterH2)/2) + " T" + (rightX+15) + " " + (topY + (waterH1+waterH2)/2 + 10) + " T" + rightX + " " + bottomY, fill: "none", stroke: "var(--p1)", "stroke-width": 2 }, v, 5);
          
          // 將文字往右推，避免和括弧重疊
          NB.t(v, rightX + 65, topY + (waterH1+waterH2)/2 + 6, "7/10", { z: 20, c: "var(--p1)", b: 1 });
          
          eq.innerHTML = '應用題就是要找出算式！<br>倒入代表相加：' + frac(1, 2) + ' + ' + frac(1, 5) + ' = ' + frac(5, 10) + ' + ' + frac(2, 10) + ' = ' + frac(7, 10);
      }
      
      // 畫水槽玻璃外框
      NB.mk("polyline", { points: leftX+","+(bottomY-h)+" "+leftX+","+bottomY+" "+(leftX+w)+","+bottomY+" "+(leftX+w)+","+(bottomY-h), fill: "none", stroke: "#94a3b8", "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, v, 6);
    }
    draw();
  }
});
