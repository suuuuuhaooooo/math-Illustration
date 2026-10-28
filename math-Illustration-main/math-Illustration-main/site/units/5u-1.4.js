/* 五上 第一章 多位小數與加減 1.4：小數取概數 */
NB.unit({
  title: "小數取概數",
  ref: "五上・第一章 多位小數與加減・1.4 小數取概數",
  q: "將 <span class='hl'>4.736</span> 用四捨五入法取概數到百分位？",
  steps: [
    "「取概數到百分位」代表要保留到小數點後第二位。",
    "看下一位（也就是「千分位」）的數字。",
    "千分位是 6，滿 5 要進位（四捨五入）。",
    "所以 4.736 變成 4.74。"
  ],
  ch: {
    q: "把 3.1415 用四捨五入取概數到十分位？",
    a: 3.1,
    h: "看百分位數字，是 4，小於 5 捨去，得到 3.1。"
  },
  tool: function(b, eq) {
    var modeRow = NB.h('<div style="margin-bottom:10px;"></div>');
    var mode = 2; // 0: 個位, 1: 十分位, 2: 百分位
    var btns = ["取到個位", "取到十分位", "取到百分位"].map(function(t, i) {
        var btn = NB.h('<button class="pen ' + (i===2 ? 'on' : '') + '">' + t + '</button>');
        btn.onclick = function() { mode = i; updateBtns(); draw(); };
        modeRow.appendChild(btn);
        return btn;
    });
    function updateBtns() { btns.forEach(function(btn, i) { btn.classList.toggle('on', i === mode); }); }
    b.appendChild(modeRow);
    
    var numSlider = NB.slider(b, "原始小數", 1000, 9999, 1, 4736, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; font-size:28px; text-align:center; font-family:monospace;"></div>');
    b.appendChild(st);

    function draw() {
      var val = (numSlider.v / 1000).toFixed(3); // 例如 "4.736"
      var digits = val.split(''); 
      
      // 判斷該檢查哪一個索引 (4 . 7 3 6 -> idx: 0 1 2 3 4)
      var targetIdx = mode === 0 ? 0 : mode + 1; 
      var checkIdx = mode === 0 ? 2 : mode + 2; 
      var checkDigit = parseInt(digits[checkIdx]);
      var isUp = checkDigit >= 5;
      
      // 計算四捨五入的結果
      var factor = Math.pow(10, mode);
      var rounded = (Math.round((numSlider.v / 1000) * factor) / factor).toFixed(mode);
      
      var html = '<div>';
      for(var i=0; i<digits.length; i++) {
          if (i === checkIdx) {
              // 標示要檢查的下一位
              html += '<span style="color:red; border-bottom:3px solid red; padding:0 2px;">' + digits[i] + '</span>';
          } else if (i <= targetIdx || digits[i] === '.') {
              html += '<span>' + digits[i] + '</span>';
          } else {
              // 被捨去的位數變淡
              html += '<span style="color:#ccc;">' + digits[i] + '</span>';
          }
      }
      html += ' &nbsp;&rarr;&nbsp; <span style="color:var(--p1); font-weight:bold;">' + rounded + '</span></div>';
      st.innerHTML = html;
      
      var placeName = ["十分位", "百分位", "千分位"][mode];
      eq.innerHTML = '要取概數到' + (mode===0?'個位':(mode===1?'十分位':'百分位')) + 
                     '，必須觀察下一位（<b>' + placeName + '</b>）的數字。<br>' +
                     '下一位數字是 <span style="color:red;font-weight:bold;">' + checkDigit + '</span>，' + 
                     (isUp ? '大於等於 5，所以要<b>進位</b>！' : '小於 5，所以要<b>捨去</b>！');
    }
    draw();
  }
});