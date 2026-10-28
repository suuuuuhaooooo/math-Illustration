/* 五上 第四章 擴分、約分與通分 4.1：用分數表示整數相除的結果 */
NB.unit({
  title: "用分數表示整數相除的結果",
  ref: "五上・第四章 擴分、約分與通分・4.1 用分數表示整數相除的結果",
  q: "把 <span class='hl'>3</span> 個披薩平分給 <span class='hl'>4</span> 個人，每個人可以分到幾個披薩？",
  steps: [
    "這是一個平分的除法問題：3 ÷ 4",
    "當無法整除時，我們可以用「分數」來表示結果。",
    "被除數 (3) 放在上面當「分子」。",
    "除數 (4) 放在下面當「分母」。",
    "所以 3 ÷ 4 = 3/4（四分之三）個。"
  ],
  ch: { 
    q: "把 5 條緞帶平分給 8 個人，每個人分到幾條？", 
    a: "5/8 條", 
    h: "5 ÷ 8 = 5/8" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿，觀察除法算式如何變成數學分數：</div>');
    b.appendChild(desc);
    
    var nA = NB.slider(b, "被除數 (平分物品)", 1, 10, 1, 3, "", function(){ draw() });
    var nB = NB.slider(b, "除數 (分給幾人)", 2, 10, 1, 4, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:20px; background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; font-size:32px;"></div>');
    b.appendChild(st);

    // 畫出漂亮分數的函數
    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 8px; line-height:1.2;">' +
             '<div style="border-bottom:3px solid currentColor; padding:0 8px;">' + num + '</div>' +
             '<div style="padding:0 8px;">' + den + '</div>' +
             '</div>';
    }

    function draw() {
      var a = nA.v, b = nB.v;
      
      st.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; gap:10px; font-weight:bold;">' +
                     '<span style="color:var(--p1);">' + a + '</span> &divide; <span style="color:var(--p2);">' + b + '</span>' +
                     ' &nbsp;=&nbsp; ' +
                     frac('<span style="color:var(--p1);">' + a + '</span>', '<span style="color:var(--p2);">' + b + '</span>') +
                     '</div>';
                     
      eq.innerHTML = '記憶口訣：<b>除號</b>可以想像成<b>分數線</b>，<span style="color:var(--p1)">前面的數字在樓上</span>，<span style="color:var(--p2)">後面的數字在樓下</span>！';
    }
    draw();
  }
});