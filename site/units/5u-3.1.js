/* 五上 第三章 倍數與公倍數 3.1：倍數 */
NB.unit({
  title: "倍數",
  ref: "五上・第三章 倍數與公倍數・3.1 倍數",
  q: "找出 4 的<span class='hl'>前 5 個倍數</span>有哪些？",
  steps: [
    "倍數就是把一個數字乘以 1倍、2倍、3倍...",
    "4 × 1 = 4",
    "4 × 2 = 8",
    "4 × 3 = 12",
    "4 × 4 = 16",
    "4 × 5 = 20",
    "所以 4 的前 5 個倍數是：4, 8, 12, 16, 20"
  ],
  ch: { 
    q: "找出 7 的第 3 個倍數是多少？", 
    a: 21, 
    h: "7 × 3 = 21" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿選擇數字，看看它的前 10 個倍數是怎麼產生的：</div>');
    b.appendChild(desc);
    
    var n = NB.slider(b, "數字", 2, 15, 1, 4, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; font-size:18px; text-align:center;"></div>');
    b.appendChild(st);

    function draw() {
      var val = n.v;
      var multiples = [];
      var formulas = [];
      
      // 產生前 10 個倍數
      for (var i = 1; i <= 10; i++) {
        multiples.push(val * i);
        formulas.push(val + ' &times; ' + i + ' = <b>' + (val * i) + '</b>');
      }
      
      var formulasHtml = '<div style="display:inline-block; text-align:left; background:#fff; padding:10px 20px; border-radius:6px; border:1px solid #ddd; margin-bottom:15px; column-count:2; column-gap:30px;">';
      formulas.forEach(function(f) {
          formulasHtml += '<div style="font-family:monospace; margin:6px 0;">' + f + '</div>';
      });
      formulasHtml += '</div>';
      
      var resultHtml = '<div><b>' + val + ' 的前 10 個倍數：</b><br><span style="color:var(--p1); font-weight:bold; font-size:24px; line-height:1.5;">' + multiples.join(', ') + ', ...</span></div>';
      
      st.innerHTML = formulasHtml + resultHtml;
      eq.innerHTML = '倍數可以無限延伸下去，所以我們通常會在後面加上「...」代表還沒結束喔！';
    }
    draw();
  }
});