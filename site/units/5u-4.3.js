/* 五上 第四章 擴分、約分與通分 4.3：約分 */
NB.unit({
  title: "約分",
  ref: "五上・第四章 擴分、約分與通分・4.3 約分",
  q: "把 12/18 進行<span class='hl'>約分</span>，並找出它的最簡分數？",
  steps: [
    "約分就是把分子和分母「同除以一個大於 1 的公因數」。",
    "12 和 18 的公因數有 2, 3, 6。",
    "如果同除以 6 (最大公因數)：分子 12÷6=2，分母 18÷6=3。",
    "得到 2/3。因為 2 和 3 不能再約分了，這就是「最簡分數」。"
  ],
  ch: { 
    q: "把 8/12 約分化為最簡分數？", 
    a: "2/3", 
    h: "上下同除以 4。" 
  },
  tool: function(b, eq) {
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">點擊選擇你要除以哪一個公因數，觀察約分的結果：</div>');
    b.appendChild(desc);
    
    var btnRow = NB.h('<div style="margin-bottom:10px;"></div>');
    var currentDiv = 2;
    var factors = [2, 3, 6];
    
    factors.forEach(function(f) {
      var btn = NB.h('<button class="pen ' + (f===2?'on':'') + '">同除以 ' + f + '</button>');
      btn.onclick = function() {
        Array.from(btnRow.children).forEach(function(c){ c.classList.remove('on'); });
        btn.classList.add('on');
        currentDiv = f;
        draw();
      };
      btnRow.appendChild(btn);
    });
    b.appendChild(btnRow);
    
    var st = NB.h('<div class="stage" style="padding:20px; background:var(--paper); border-radius:8px; margin-top:10px; text-align:center; font-size:26px;"></div>');
    b.appendChild(st);

    function frac(num, den) {
      return '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 8px; line-height:1.2;">' +
             '<div style="border-bottom:3px solid currentColor; padding:0 8px;">' + num + '</div>' +
             '<div style="padding:0 8px;">' + den + '</div></div>';
    }

    function draw() {
      var n = 12, d = 18;
      var div = currentDiv;
      var newN = n / div, newD = d / div;
      
      var reducedHTML = '<div style="display:inline-block; vertical-align:middle; text-align:center; margin:0 8px; line-height:1.2;">' +
                        '<div style="border-bottom:3px solid currentColor; padding:0 8px;">' + n + ' <span style="color:#e91e63;">&divide; ' + div + '</span></div>' +
                        '<div style="padding:0 8px;">' + d + ' <span style="color:#e91e63;">&divide; ' + div + '</span></div></div>';
      
      var isSimplest = (div === 6);
      
      st.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; font-weight:bold;">' +
                     frac(n, d) + ' &nbsp;=&nbsp; ' + reducedHTML + ' &nbsp;=&nbsp; ' + frac(newN, newD) +
                     (isSimplest ? '<span style="margin-left:15px; background:var(--p1); color:white; font-size:16px; padding:4px 8px; border-radius:4px;">✨ 最簡分數</span>' : '') +
                     '</div>';
                     
      eq.innerHTML = isSimplest ? '同除以最大公因數 <b>6</b>，得到的 2/3 不能再約分了，稱為<b>最簡分數</b>！' : '約分成功！但是 ' + newN + ' 和 ' + newD + ' 還能繼續約分，所以還不是最簡分數喔。';
    }
    draw();
  }
});