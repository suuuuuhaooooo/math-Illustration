/* 五上 第三章 倍數與公倍數 3.2：判別2、5、10的倍數 */
NB.unit({
  title: "判別2、5、10的倍數",
  ref: "五上・第三章 倍數與公倍數・3.2 判別2、5、10的倍數",
  q: "在 345、290、128 中，哪些是 <span class='hl'>5 的倍數</span>？",
  steps: [
    "判別 2、5、10 的倍數，祕訣是「只看個位數字」。",
    "2 的倍數：個位數是 0, 2, 4, 6, 8（偶數）。",
    "5 的倍數：個位數是 0 或 5。",
    "10 的倍數：個位數一定是 0。",
    "345 的個位是 5，290 的個位是 0，所以它們都是 5 的倍數。"
  ],
  ch: { 
    q: "672 是 2 的倍數、5 的倍數，還是 10 的倍數？", 
    a: "2 的倍數", 
    h: "個位數是 2，所以是 2 的倍數（偶數）。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳產生一個三位數，注意觀察它的「個位數字」：</div>');
    b.appendChild(desc);
    
    var numSlider = NB.slider(b, "觀察數字", 100, 999, 1, 340, "", function(){ draw() });
    
    var st = NB.h('<div class="stage" style="padding:20px; background:var(--paper); border-radius:8px; margin-top:10px; text-align:center;"></div>');
    b.appendChild(st);

    function draw() {
      var val = numSlider.v.toString();
      var lastDigit = parseInt(val.charAt(val.length - 1));
      
      var is2 = (lastDigit % 2 === 0);
      var is5 = (lastDigit === 0 || lastDigit === 5);
      var is10 = (lastDigit === 0);
      
      // 視覺突顯個位數
      var numHtml = '<div style="font-size:48px; font-weight:bold; font-family:monospace; margin-bottom:20px;">' +
                    '<span style="color:#aaa;">' + val.substring(0, val.length - 1) + '</span>' + 
                    '<span style="color:red; border:3px solid red; border-radius:8px; padding:0 8px;">' + lastDigit + '</span>' + 
                    '</div>';
                    
      var tagsHtml = '<div style="display:flex; justify-content:center; gap:15px;">';
      tagsHtml += '<div style="padding:8px 16px; border-radius:20px; font-size:18px; color:white; font-weight:bold; background:' + (is2 ? 'var(--p1)' : '#ccc') + ';">2 的倍數 ' + '</div>';
      tagsHtml += '<div style="padding:8px 16px; border-radius:20px; font-size:18px; color:white; font-weight:bold; background:' + (is5 ? '#ff9800' : '#ccc') + ';">5 的倍數 ' + '</div>';
      tagsHtml += '<div style="padding:8px 16px; border-radius:20px; font-size:18px; color:white; font-weight:bold; background:' + (is10 ? '#e91e63' : '#ccc') + ';">10 的倍數 ' + '</div>';
      tagsHtml += '</div>';
      
      st.innerHTML = numHtml + tagsHtml;
      
      var reason = '個位數字是 <b>' + lastDigit + '</b>。';
      if (is10) reason += ' 因為是 0，所以它同時是 2、5、10 的倍數！';
      else if (is5) reason += ' 因為是 5，所以它是 5 的倍數。';
      else if (is2) reason += ' 因為是偶數，所以它是 2 的倍數。';
      else reason += ' 都不符合，所以都不是。';
      
      eq.innerHTML = reason;
    }
    draw();
  }
});
