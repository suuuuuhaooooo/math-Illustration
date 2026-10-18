/* 五上 第二章 因數與公因數 2.1：整除 */
NB.unit({
  title: "整除",
  ref: "五上・第二章 因數與公因數・2.1 整除",
  q: "把 15 個蘋果平分給 3 個人，可以「<span class='hl'>整除</span>」嗎？",
  steps: [
    "整除的意思是：被除數 ÷ 除數 = 商，而且「餘數是 0」。",
    "15 ÷ 3 = 5，餘數是 0。",
    "所以 15 可以被 3 整除。"
  ],
  ch: { 
    q: "24 可以被 5 整除嗎？", 
    a: "不行", 
    h: "24 ÷ 5 = 4 ⋯ 4，餘數不是 0。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿改變數值，觀察餘數什麼時候會變成 0：</div>');
    b.appendChild(desc);
    
    var nA = NB.slider(b, "被除數", 10, 50, 1, 15, "", function(){ draw() });
    var nB = NB.slider(b, "除數", 2, 10, 1, 3, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:20px; background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; font-size:28px;"></div>');
    b.appendChild(st);

    function draw() {
      var a = nA.v, d = nB.v;
      var q = Math.floor(a / d);
      var r = a % d;
      var isDivisible = (r === 0);
      
      var html = '<div style="font-family:monospace; letter-spacing:2px;">' + 
                 a + ' &divide; ' + d + ' = ' + q + ' ⋯ <span style="color:' + (isDivisible ? 'var(--p1)' : 'red') + '; font-weight:bold;">' + r + '</span>' +
                 '</div>';
                 
      if (isDivisible) {
        html += '<div style="margin-top:15px; display:inline-block; padding:5px 15px; background:var(--p1); color:white; border-radius:20px; font-size:20px; font-weight:bold;">可以整除</div>';
      } else {
        html += '<div style="margin-top:15px; display:inline-block; padding:5px 15px; background:#ff4d4d; color:white; border-radius:20px; font-size:20px; font-weight:bold;">不能整除</div>';
      }
      st.innerHTML = html;
      
      eq.innerHTML = '當餘數為 <b>0</b> 時，我們就說「' + a + ' 可以被 ' + d + ' <b>整除</b>」。<br>' + 
                     (isDivisible ? '現在餘數是 0，所以符合整除條件！' : '現在餘數是 <span style="color:red;font-weight:bold">' + r + '</span>，所以不能整除。');
    }
    draw();
  }
});
