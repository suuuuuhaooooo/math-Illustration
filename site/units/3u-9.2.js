/* 3u-9.2 */
NB.unit(NB.kit?NB.kit.frac({"mode":"unit","shape":"pie","q":"幾分之幾：用圓形來看看。","steps":["圓平分成 d 份","塗色 n 份","n/d 表示 n 個 1/d"],"ch":{"q":"3/8 裡有幾個 1/8？","a":3,"h":"分子就是幾個。"},"S":[{"k":"d","label":"平分成","min":2,"max":12,"val":6,"unit":"份"},{"k":"n","label":"取","min":1,"max":12,"val":4,"unit":"份","maxOf":v=>v.d}],"eq":q=>`${Math.min(q.n,q.d)}/${q.d} ＝ ${Math.min(q.n,q.d)} 個 1/${q.d}`}):{});
