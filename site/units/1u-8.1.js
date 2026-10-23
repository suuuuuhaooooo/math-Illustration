/* 1u-8.1 */
NB.unit(NB.kit?NB.kit.dots({"mode":"take","ten":true,"q":"有 8 個，拿走 3 個，還剩幾個？","steps":["先數全部有幾個","拿走的畫上叉叉","沒有叉叉的就是剩下的"],"ch":{"q":"9 個拿走 4 個，剩幾個？","a":5,"h":"9 - 4。"},"S":[{"k":"a","label":"一開始","min":1,"max":10,"val":8,"unit":"個"},{"k":"b","label":"拿走","min":0,"max":10,"val":3,"unit":"個","maxOf":v=>v.a}],"eq":q=>`${q.a} - ${q.b} = <b>${q.a-q.b}</b>`}):{});
