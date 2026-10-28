/* 1u-7.1 */
NB.unit(NB.kit?NB.kit.dots({"mode":"two","ten":true,"q":"左邊有幾個，右邊有幾個，合起來是多少？","steps":["先數左邊的","再數右邊的","用加法：3 + 4 = 7"],"ch":{"q":"5 + 3 = ？","a":8,"h":"從 5 接著往上數 3 個。"},"S":[{"k":"a","label":"左邊","min":1,"max":9,"val":3,"unit":"個"},{"k":"b","label":"右邊","min":1,"max":9,"val":4,"unit":"個","maxOf":v=>10-v.a}],"eq":q=>`${q.a} + ${q.b} = <b>${q.a+q.b}</b>`}):{});
