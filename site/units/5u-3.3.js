/* 五上 第三章 倍數與公倍數 3.3：公倍數和最小公倍數 */
NB.unit({
  title: "公倍數和最小公倍數",
  ref: "五上・第三章 倍數與公倍數・3.3 公倍數和最小公倍數",
  q: "找出 4 和 6 的公倍數，並圈出<span class='hl'>最小公倍數</span>？",
  steps: [
    "先列出 4 的倍數：4, 8, 12, 16, 20, 24, 28, ...",
    "再列出 6 的倍數：6, 12, 18, 24, 30, ...",
    "找出共同的倍數（公倍數）：12, 24, ...",
    "其中最小的是 12，所以最小公倍數是 12"
  ],
  ch: { 
    q: "找出 6 和 8 的最小公倍數？", 
    a: 24, 
    h: "6的倍數:6,12,18,24,30... 8的倍數:8,16,24... 最小公倍數為24。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">調整滑桿，觀察系統是如何「列舉」並找出最小公倍數的：</div>');
    b.appendChild(desc);

    var nA = NB.slider(b, "數字甲", 2, 12, 1, 4, "", function(){ draw() });
    var nB = NB.slider(b, "數字乙", 2, 12, 1, 6, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; line-height:2;"></div>');
    b.appendChild(st);

    function draw() {
      var a = nA.v, b = nB.v;
      var ma = [], mb = [];
      
      // 計算倍數 (為了確保能找到公倍數，我們多算一點，算到兩數的乘積 * 3)
      var maxLimit = a * b * 3; 
      for(var i = 1; (a * i) <= maxLimit; i++) ma.push(a * i);
      for(var j = 1; (b * j) <= maxLimit; j++) mb.push(b * j);

      // 找出公倍數 (取前幾個展示就好)
      var common = ma.filter(function(x) { return mb.includes(x); });
      var lcm = common[0]; // 第一個就是最小的
      
      // 為了畫面乾淨，只顯示到第二個公倍數再多一點點的範圍
      var displayLimit = common.length > 1 ? common[1] + Math.max(a, b) : lcm + Math.max(a, b);
      ma = ma.filter(function(x) { return x <= displayLimit; });
      mb = mb.filter(function(x) { return x <= displayLimit; });

      function highlight(multiples) {
        return multiples.map(function(x) {
          if (x === lcm) return '<span style="display:inline-block; width:30px; height:30px; line-height:30px; text-align:center; background:#ff4d4d; color:white; border-radius:50%; font-weight:bold; font-size:1.1em;">' + x + '</span>';
          if (common.includes(x)) return '<span style="color:var(--p1); font-weight:bold; font-size:1.1em;">' + x + '</span>';
          return '<span>' + x + '</span>';
        }).join(', ') + ', ...';
      }

      st.innerHTML = 
        '<div><b>' + a + ' 的倍數：</b> ' + highlight(ma) + '</div>' +
        '<div><b>' + b + ' 的倍數：</b> ' + highlight(mb) + '</div>' +
        '<div style="margin-top:12px; padding-top:12px; border-top:2px dashed #ddd; background:#f9f9f9; padding:10px; border-radius:6px;">' +
        '<div style="color:var(--p1);"><b>共同的倍數（公倍數）：</b> ' + common.slice(0, 3).join(', ') + ', ...</div>' +
        '<div style="margin-top:5px; font-size:1.1em;"><b>最小公倍數：</b> <span style="color:red; font-weight:bold; font-size:1.2em;">' + lcm + '</span></div>' +
        '</div>';

      eq.innerHTML = '在列出的倍數中，找出一樣的數字，<b>第一個出現（最小）的</b>就是最小公倍數喔！';
    }
    
    draw();
  }
});