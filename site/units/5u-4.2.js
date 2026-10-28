/* 五上 第四章 擴分、約分與通分 4.2：擴分 */
NB.unit({
  title: "擴分",
  ref: "五上・第四章 擴分、約分與通分・4.2 擴分",
  q: "把 3/4 進行<span class='hl'>擴分</span>，讓分母變成 12？",
  steps: [
    "擴分就是把分子和分母「同乘以一個相同的整數」。",
    "觀察分母：要從 4 變成 12，必須乘以 3。",
    "所以分子也要跟著乘以 3：3 × 3 = 9。",
    "得到新分數 9/12。大小和原本的 3/4 完全一樣！"
  ],
  ch: { 
    q: "把 2/5 擴分，同乘 4 會變成多少？", 
    a: "8/20", 
    h: "分子2×4=8，分母5×4=20。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿選擇擴分的倍數，觀察分子與分母的變化：</div>');
    b.appendChild(desc);
    
    var m = NB.slider(b, "擴分倍數 (同乘)", 2, 8, 1, 3, "倍", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:20px; background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; font-size:26px;"></div>');
    b.appendChild(st);

    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 8px; line-height:1.2;">' +
             '<div style="border-bottom:3px solid currentColor; padding:0 8px;">' + num + '</div>' +
             '<div style="padding:0 8px;">' + den + '</div></div>';
    }

    function draw() {
      var mul = m.v;
      var n = 3, d = 4; // 基礎分數 3/4
      
      var expandedHTML = '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 8px; line-height:1.2;">' +
                         '<div style="border-bottom:3px solid currentColor; padding:0 8px;">' + n + ' <span style="color:var(--p1);">&times; ' + mul + '</span></div>' +
                         '<div style="padding:0 8px;">' + d + ' <span style="color:var(--p1);">&times; ' + mul + '</span></div></div>';
                         
      st.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; font-weight:bold;">' +
                     frac(n, d) + ' &nbsp;=&nbsp; ' + expandedHTML + ' &nbsp;=&nbsp; ' + frac(n * mul, d * mul) +
                     '</div>';
                     
      eq.innerHTML = '擴分時，分子和分母必須<b><span style="color:var(--p1)">同乘以 ' + mul + '</span></b>。兩個分數雖然長得不一樣，但代表的數值大小是相同的！';
    }
    draw();
  }
});