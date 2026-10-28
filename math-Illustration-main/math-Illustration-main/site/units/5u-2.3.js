/* 五上 第二章 因數與公因數 2.3：公因數和最大公因數 */
NB.unit({
  title: "公因數和最大公因數",
  ref: "五上・第二章 因數與公因數・2.3 公因數和最大公因數",
  q: "找出 12 和 18 的公因數，並圈出<span class='hl'>最大公因數</span>是多少？",
  steps: [
    "先列出 12 的所有因數：1, 2, 3, 4, 6, 12",
    "再列出 18 的所有因數：1, 2, 3, 6, 9, 18",
    "找出兩者共同的因數（公因數）：1, 2, 3, 6",
    "其中最大的是 6，所以最大公因數是 6"
  ],
  ch: { 
    q: "找出 16 和 24 的最大公因數是多少？", 
    a: 8, 
    h: "16的因數有1,2,4,8,16。24的因數有1,2,3,4,6,8,12,24。公因數最大為 8。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">調整滑桿，觀察系統是如何「列舉」並找出公因數的：</div>');
    b.appendChild(desc);

    var nA = NB.slider(b, "數字甲", 1, 36, 1, 12, "", function(){ draw() });
    var nB = NB.slider(b, "數字乙", 1, 36, 1, 18, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; line-height:2;"></div>');
    b.appendChild(st);

    function draw() {
      var a = nA.v, b = nB.v;
      var fa = [], fb = [];
      
      // 分別計算因數（五年級土法煉鋼的列舉法）
      for(var i = 1; i <= a; i++) if(a % i === 0) fa.push(i);
      for(var j = 1; j <= b; j++) if(b % j === 0) fb.push(j);

      // 找出公因數與最大公因數
      var common = fa.filter(function(x) { return fb.includes(x); });
      var gcd = Math.max.apply(null, common);

      // 幫助函數：標示因數（公因數加粗標色，最大公因數加紅底）
      function highlight(factors) {
        return factors.map(function(x) {
          if (x === gcd) return '<span style="display:inline-block; width:28px; height:28px; line-height:28px; text-align:center; background:#ff4d4d; color:white; border-radius:50%; font-weight:bold; font-size:1.1em;">' + x + '</span>';
          if (common.includes(x)) return '<span style="color:var(--p1); font-weight:bold; font-size:1.1em;">' + x + '</span>';
          return '<span>' + x + '</span>';
        }).join(', ');
      }

      // 畫面呈現：兩列因數對照，下方統整
      st.innerHTML = 
        '<div><b>' + a + ' 的因數：</b> ' + highlight(fa) + '</div>' +
        '<div><b>' + b + ' 的因數：</b> ' + highlight(fb) + '</div>' +
        '<div style="margin-top:12px; padding-top:12px; border-top:2px dashed #ddd; background:#f9f9f9; padding:10px; border-radius:6px;">' +
        '<div style="color:var(--p1);"><b>共同的因數（公因數）：</b> ' + common.join(', ') + '</div>' +
        '<div style="margin-top:5px; font-size:1.1em;"><b>最大公因數：</b> <span style="color:red; font-weight:bold; font-size:1.2em;">' + gcd + '</span></div>' +
        '</div>';

      eq.innerHTML = '因為五年級還沒學短除法，所以要先<b>全部列出來</b>，再找出共同數字中<b>最大的一個</b>！';
    }
    
    draw();
  }
});