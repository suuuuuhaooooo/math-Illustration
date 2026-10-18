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
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; font-size:24px; text-align:center;"></div>');
    b.appendChild(st);

    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 5px; line-height:1.2;">' +
             '<div style="border-bottom:3px solid currentColor; padding:0 5px;">' + num + '</div>' +
             '<div style="padding:0 5px;">' + den + '</div></div>';
    }

    function expand(num, den, mul) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 5px; line-height:1.2; font-size:0.9em; color:#666;">' +
             '<div style="border-bottom:2px solid currentColor; padding:0 5px;">' + num + '<span style="color:var(--p1);">&times;'+mul+'</span></div>' +
             '<div style="padding:0 5px;">' + den + '<span style="color:var(--p1);">&times;'+mul+'</span></div></div>';
    }

    function draw() {
      var html = '<div style="display:flex; justify-content:center; align-items:center; gap:20px; font-weight:bold;">';
      
      // 左邊分數 (2/3 -> 8/12)
      html += '<div style="border:2px dashed #ccc; padding:15px; border-radius:8px;">' + 
              frac(2, 3) + ' &rarr; ' + expand(2, 3, 4) + ' = ' + frac(8, 12) +
              '</div>';
              
      // 中間比較符號
      html += '<div style="color:red; font-size:32px;">&lt;</div>';
      
      // 右邊分數 (3/4 -> 9/12)
      html += '<div style="border:2px dashed #ccc; padding:15px; border-radius:8px;">' + 
              frac(3, 4) + ' &rarr; ' + expand(3, 4, 3) + ' = ' + frac(9, 12) +
              '</div>';
              
      html += '</div>';
      
      st.innerHTML = html;
      eq.innerHTML = '找到 3 和 4 的公倍數 <b>12</b> 作為新分母。<br>通分後只要比較樓上（分子）的大小，<span style="color:red; font-weight:bold;">8 &lt; 9</span>，就知道誰比較大了！';
    }
    draw();
  }
});