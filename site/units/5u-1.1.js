/* 五上 第一章 多位小數與加減 1.1：認識多位小數 */
NB.unit({
  title: "認識多位小數",
  ref: "五上・第一章 多位小數與加減・1.1 認識多位小數",
  q: "觀察定位板，在 <span class='hl'>3.1415</span> 中，數字 4 位在哪一個位置？代表多少？",
  steps: [
    "小數點右邊第一位是「十分位」",
    "小數點右邊第二位是「百分位」",
    "小數點右邊第三位是「千分位」",
    "小數點右邊第四位是「萬分位」",
    "4 在小數點右邊第二位，所以是「百分位」，代表 4 個 0.01（或 0.04）"
  ],
  ch: {
    q: "數字 8.0762 中的 6 位在哪一個位置？",
    a: "千分位",
    h: "小數點右邊第三位是千分位。"
  },
  tool: function(b, eq) {
    // 建立提示文字
    var desc = NB.h('<div style="margin-bottom:10px; color:var(--text-gray)">拖曳滑桿改變數值，觀察數字在定位板上的位置：</div>');
    b.appendChild(desc);

    // 建立數值滑桿（從 0.0001 變化到 9.9999 的放大整數版，方便滑動）
    var numSlider = NB.slider(b, "數值", 1000, 99999, 1, 31415, "", function(){ draw() });
    
    // 建立展示舞台（定位板容器）
    var st = NB.h('<div class="stage" style="padding:15px; background:var(--paper); border-radius:8px; margin-top:10px; overflow-x:auto;"></div>');
    b.appendChild(st);

    function draw() {
      // 將滑桿數值轉換為帶有 4 位小數的字串 (例如: 31415 -> "3.1415")
      var val = (numSlider.v / 10000).toFixed(4);
      var digits = val.replace('.', '').split(''); // 拆成陣列 ["3", "1", "4", "1", "5"]
      
      // 繪製 HTML 定位板
      var html = '<table style="width:100%; text-align:center; border-collapse:collapse; font-size:16px;">';
      
      // 表頭：位名
      html += '<tr style="background:var(--p2); color:white;">' +
              '<th style="border:1px solid #ccc; padding:8px;">個位</th>' +
              '<th style="border:1px solid #ccc; padding:8px; background:var(--p1);">十分位</th>' +
              '<th style="border:1px solid #ccc; padding:8px; background:var(--p1);">百分位</th>' +
              '<th style="border:1px solid #ccc; padding:8px; background:var(--p1);">千分位</th>' +
              '<th style="border:1px solid #ccc; padding:8px; background:var(--p1);">萬分位</th>' +
              '</tr>';
              
      // 表身：數字
      html += '<tr>' +
              '<td style="border:1px solid #ccc; padding:12px; font-weight:bold; font-size:1.4em;">' + digits[0] + '.</td>' +
              '<td style="border:1px solid #ccc; padding:12px; font-weight:bold; font-size:1.4em;">' + digits[1] + '</td>' +
              '<td style="border:1px solid #ccc; padding:12px; font-weight:bold; font-size:1.4em; color:var(--p1);">' + digits[2] + '</td>' +
              '<td style="border:1px solid #ccc; padding:12px; font-weight:bold; font-size:1.4em;">' + digits[3] + '</td>' +
              '<td style="border:1px solid #ccc; padding:12px; font-weight:bold; font-size:1.4em;">' + digits[4] + '</td>' +
              '</tr>';
      html += '</table>';
      
      // 更新舞台內容
      st.innerHTML = html;
      
      // 更新下方公式與說明列
      eq.innerHTML = '這個數字讀作：<b>' + val + '</b><br>其中 <b>' + digits[2] + '</b> 位在<span style="color:var(--p1)">百分位</span>，表示 <b>' + digits[2] + ' 個 0.01</b>。';
    }
    
    // 初始化執行一次繪圖
    draw();
  }
});