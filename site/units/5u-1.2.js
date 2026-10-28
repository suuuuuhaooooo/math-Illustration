/* 五上 第一章 多位小數與加減 1.2：小數的大小比較 */
NB.unit({
  title: "小數的大小比較",
  ref: "五上・第一章 多位小數與加減・1.2 小數的大小比較",
  q: "比較 <span class='hl'>3.1415</span> 和 <span class='hl'>3.1451</span> 的大小？",
  steps: [
    "從最高位（個位）開始由左向右比較。",
    "個位、十分位、百分位都相同（3.14）。",
    "比較千分位：1 < 5，所以 3.1415 < 3.1451"
  ],
  ch: {
    q: "比較 0.087 和 0.0807 的大小？",
    a: "0.087 > 0.0807",
    h: "千分位 7 大於 0。"
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿，觀察系統是如何從左到右比較兩個數字：</div>');
    b.appendChild(desc);
    
    var nA = NB.slider(b, "數字甲", 31000, 31999, 1, 31415, "", function(){ draw() });
    var nB = NB.slider(b, "數字乙", 31000, 31999, 1, 31451, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; font-family:monospace; font-size:28px;"></div>');
    b.appendChild(st);

    function draw() {
      var strA = (nA.v / 10000).toFixed(4);
      var strB = (nB.v / 10000).toFixed(4);
      var diffIdx = -1;
      
      // 找出從左到右第一個不同的數字
      for (var i = 0; i < strA.length; i++) {
        if (strA[i] !== strB[i]) { diffIdx = i; break; }
      }
      
      function renderNum(str) {
        var res = "";
        for (var i = 0; i < str.length; i++) {
          if (i === diffIdx) res += '<span style="color:var(--p1); font-weight:bold; background:#ffe0e0; border-radius:4px; padding:2px;">' + str[i] + '</span>';
          else res += '<span style="padding:2px;">' + str[i] + '</span>';
        }
        return res;
      }
      
      var sign = strA === strB ? "=" : (parseFloat(strA) > parseFloat(strB) ? "&gt;" : "&lt;");
      
      st.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; gap:20px;">' + 
                     '<div>' + renderNum(strA) + '</div>' + 
                     '<div style="color:var(--p2); font-weight:bold; font-size:1.2em;">' + sign + '</div>' + 
                     '<div>' + renderNum(strB) + '</div>' + 
                     '</div>';
                     
      if (diffIdx !== -1) {
          eq.innerHTML = '從左邊數來，第一個不同的數字在小數點後第 <b>' + (diffIdx - 1) + '</b> 位。<br>' + strA[diffIdx] + ' 和 ' + strB[diffIdx] + ' 相比，決定了大小！';
      } else {
          eq.innerHTML = '兩個數字完全一樣大！';
      }
    }
    draw();
  }
});
