/* 五上 第四章 擴分、約分與通分 4.4：通分和分數的大小比較 */
NB.unit({
  title: "通分和分數的大小比較",
  ref: "五上・第四章 擴分、約分與通分・4.4 通分和分數的大小比較",
  q: "比較 <span class='hl'>2/3</span> 和 <span class='hl'>3/4</span> 的大小？",
  steps: [
    "分母不同不能直接比，要先找公倍數把分母變一樣，這叫「通分」。",
    "3 和 4 的最小公倍數是 12。",
    "2/3 上下同乘 4 變成 8/12。",
    "3/4 上下同乘 3 變成 9/12。",
    "因為 8/12 < 9/12，所以 2/3 < 3/4。"
  ],
  ch: { 
    q: "比較 1/2 和 2/5 的大小？", 
    a: "1/2 > 2/5", 
    h: "通分成 5/10 和 4/10 比較。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿換不同的分數組合，觀察「通分」與比較的動態過程：</div>');
    b.appendChild(desc);

    // 內建幾組經典的比較題 (n=分子, d=分母)
    var pairs = [
      {n1: 2, d1: 3, n2: 3, d2: 4}, // 互質
      {n1: 1, d1: 2, n2: 2, d2: 5}, // 互質
      {n1: 5, d1: 6, n2: 7, d2: 8}, // 找最小公倍數(24)
      {n1: 3, d1: 4, n2: 5, d2: 6}, // 找最小公倍數(12)
      {n1: 2, d1: 3, n2: 5, d2: 9}  // 倍數關係(9)
    ];

    var slider = NB.slider(b, "選擇題目", 1, pairs.length, 1, 1, "", function(){ draw() });

    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; font-size:24px; text-align:center;"></div>');
    b.appendChild(st);

    // 數學輔助函數：算最小公倍數
    function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
    function getLcm(x, y) { return (x * y) / gcd(x, y); }

    // 畫分數的 UI 函數
    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 5px; line-height:1.2;">' +
             '<div style="border-bottom:3px solid currentColor; padding:0 5px;">' + num + '</div>' +
             '<div style="padding:0 5px;">' + den + '</div></div>';
    }

    function expand(num, den, mul) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 5px; line-height:1.2; font-size:0.8em; color:#666;">' +
             '<div style="border-bottom:2px solid currentColor; padding:0 5px;">' + num + '<span style="color:var(--p1);">&times;'+mul+'</span></div>' +
             '<div style="padding:0 5px;">' + den + '<span style="color:var(--p1);">&times;'+mul+'</span></div></div>';
    }

    function draw() {
      var p = pairs[slider.v - 1];
      var lcm = getLcm(p.d1, p.d2);
      var m1 = lcm / p.d1;
      var m2 = lcm / p.d2;
      
      var val1 = p.n1 * m1;
      var val2 = p.n2 * m2;
      var sign = val1 > val2 ? '&gt;' : (val1 < val2 ? '&lt;' : '=');

      var html = '<div style="display:flex; justify-content:center; align-items:center; gap:20px; font-weight:bold;">';
      
      // 左邊分數區域（包含原分數 -> 通分過程 -> 新分數）
      html += '<div style="border:2px dashed #ccc; background:#fff; padding:15px; border-radius:8px; min-width:180px;">' + 
              frac(p.n1, p.d1) + 
              '<div style="font-size:14px; color:#aaa; margin:10px 0;">&darr; 擴分通分 &darr;</div>' + 
              (m1 > 1 ? expand(p.n1, p.d1, m1) + ' = ' : '') + frac(val1, lcm) +
              '</div>';
              
      // 中間比較大嘴巴
      html += '<div style="color:red; font-size:48px; width:40px;">' + sign + '</div>';
      
      // 右邊分數區域
      html += '<div style="border:2px dashed #ccc; background:#fff; padding:15px; border-radius:8px; min-width:180px;">' + 
              frac(p.n2, p.d2) + 
              '<div style="font-size:14px; color:#aaa; margin:10px 0;">&darr; 擴分通分 &darr;</div>' + 
              (m2 > 1 ? expand(p.n2, p.d2, m2) + ' = ' : '') + frac(val2, lcm) +
              '</div>';
              
      html += '</div>';
      
      st.innerHTML = html;
      eq.innerHTML = '找到分母 ' + p.d1 + ' 和 ' + p.d2 + ' 的最小公倍數 <b>' + lcm + '</b> 作為新分母。<br>通分後只要比較樓上的分子大小：<span style="color:red; font-weight:bold;">' + val1 + ' ' + sign + ' ' + val2 + '</span>，就一目了然了！';
    }
    draw();
  }
});
