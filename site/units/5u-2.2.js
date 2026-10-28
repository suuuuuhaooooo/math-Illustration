/* 五上 第二章 因數與公因數 2.2：因數 */
NB.unit({
  title: "因數",
  ref: "五上・第二章 因數與公因數・2.2 因數",
  q: "找出 12 的<span class='hl'>所有因數</span>有哪些？",
  steps: [
    "因數就是能把這個數字「整除」的數。",
    "我們可以利用乘法，由小到大一對一對找出來：",
    "1 × 12 = 12",
    "2 × 6 = 12",
    "3 × 4 = 12",
    "所以 12 的因數有：1, 2, 3, 4, 6, 12"
  ],
  ch: { 
    q: "找出 15 的所有因數？", 
    a: "1, 3, 5, 15", 
    h: "1×15=15，3×5=15" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿選擇數字，看看它是怎麼被分解成乘法配對的：</div>');
    b.appendChild(desc);
    
    var n = NB.slider(b, "數字", 2, 40, 1, 12, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; font-size:20px; text-align:center;"></div>');
    b.appendChild(st);

    function draw() {
      var val = n.v;
      var pairs = [];
      var factors = [];
      
      // 找出所有因數與乘法配對
      for (var i = 1; i <= Math.sqrt(val); i++) {
        if (val % i === 0) {
          var pair2 = val / i;
          pairs.push(i + ' &times; ' + pair2 + ' = ' + val);
          factors.push(i);
          if (i !== pair2) factors.push(pair2);
        }
      }
      
      // 將因數由小到大排序
      factors.sort(function(a, b) { return a - b; });
      
      var pairsHtml = '<div style="display:inline-block; text-align:left; background:#fff; padding:10px 30px; border-radius:6px; border:1px solid #ddd; margin-bottom:15px;">';
      pairs.forEach(function(p) {
          pairsHtml += '<div style="font-family:monospace; margin:8px 0; font-size:1.1em;">' + p + '</div>';
      });
      pairsHtml += '</div>';
      
      var factorsHtml = '<div><b>' + val + ' 的因數有：</b><br><span style="color:var(--p1); font-weight:bold; font-size:26px; line-height:1.5;">' + factors.join(', ') + '</span></div>';
      
      st.innerHTML = pairsHtml + factorsHtml;
      eq.innerHTML = '尋找因數最快的方法，就是像這樣<b>一對一對找</b>（乘法配對），才不會漏掉數字喔！';
    }
    draw();
  }
});