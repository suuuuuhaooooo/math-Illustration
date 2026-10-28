/* 五上 第一章 多位小數與加減 1.3：多位小數的加減 */
NB.unit({
  title: "多位小數的加減",
  ref: "五上・第一章 多位小數與加減・1.3 多位小數的加減",
  q: "計算 <span class='hl'>2.5 + 1.345</span> = ？",
  steps: [
    "寫成直式時，最重要的原則是「小數點要對齊」！",
    "空下來的位數可以補 0（2.5 寫成 2.500）。",
    "像整數加減一樣，由右向左計算，最後補上小數點。"
  ],
  ch: {
    q: "5 - 2.138 = ？",
    a: 2.862,
    h: "5 寫作 5.000，小數點對齊後再相減。"
  },
  tool: function(b, eq) {
    var opRow = NB.h('<div style="margin-bottom:10px;"></div>');
    var op = 1;
    var btnAdd = NB.h('<button class="pen on">加法 (+)</button>');
    var btnSub = NB.h('<button class="pen">減法 (-)</button>');
    btnAdd.onclick = function() { op = 1; btnAdd.classList.add('on'); btnSub.classList.remove('on'); draw(); };
    btnSub.onclick = function() { op = -1; btnSub.classList.add('on'); btnAdd.classList.remove('on'); draw(); };
    opRow.appendChild(btnAdd); opRow.appendChild(btnSub);
    b.appendChild(opRow);
    
    var nA = NB.slider(b, "數字甲", 1000, 9999, 1, 2500, "", function(){ draw() });
    var nB = NB.slider(b, "數字乙", 1000, 9999, 1, 1345, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; font-family:monospace; font-size:24px; text-align:center; width:220px; margin-left:auto; margin-right:auto;"></div>');
    b.appendChild(st);

    function draw() {
      var vA = (nA.v / 1000);
      var vB = (nB.v / 1000);
      // 確保減法時上面大於下面
      if (op === -1 && vA < vB) { var temp = vA; vA = vB; vB = temp; }
      
      var strA = vA.toFixed(3);
      var strB = vB.toFixed(3);
      var ans = op === 1 ? (vA + vB) : (vA - vB);
      var strAns = ans.toFixed(3);
      var sign = op === 1 ? "+" : "−";
      
      // 使用 CSS 字距 (letter-spacing) 讓直式完美對齊
      st.innerHTML = 
        '<div style="text-align:right; letter-spacing:8px; margin-right:10px;">' + strA + '</div>' + 
        '<div style="text-align:right; letter-spacing:8px; border-bottom:2px solid #000; margin-right:10px; padding-bottom:5px;">' + 
        '<span style="float:left;">' + sign + '</span>' + strB + '</div>' + 
        '<div style="text-align:right; letter-spacing:8px; color:var(--p1); font-weight:bold; margin-right:10px; padding-top:5px;">' + strAns + '</div>';
        
      eq.innerHTML = '直式計算的重點：<b>小數點必須垂直對齊</b>！<br>右方空位視為補 0 後計算：' + strA + ' ' + sign + ' ' + strB + ' = <b>' + strAns + '</b>';
    }
    draw();
  }
});