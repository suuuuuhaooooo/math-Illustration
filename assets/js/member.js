/* 班級專區（核心）：登入、個人紀錄、題庫產生器、積分／貼紙。畫面在 member-ui.js
   注意：登入與資料都在瀏覽器端，只能擋「不是這個班的人」，不是銀行等級的安全。 */
(function(){
"use strict";
var CFG=window.NB_CONFIG||{},CL=window.CLASSES||[],SK="nb-sess",PRE="nb-u:",M=NB.member={};
function pad(n){return("0"+n).slice(-2)}
function ymd(d){d=d||new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
M.today=ymd;
function sha(t){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return pad(x.toString(16))}).join("")})}

/* ---- 登入 ---- */
M.cur=function(){try{var s=JSON.parse(localStorage.getItem(SK)||"null"),c=s&&CL.filter(function(x){return x.code===s.c})[0],t=c&&c.s.filter(function(x){return x.no===s.no})[0];return t?{cls:c,st:t,grade:c.grade||6}:null}catch(e){return null}};
M.login=function(code,no,pin){
 var c=CL.filter(function(x){return x.code===String(code).trim()})[0],t=c&&c.s.filter(function(x){return String(x.no)===String(no).trim()})[0];
 if(!t)return Promise.resolve(false);
 if(!(window.crypto&&crypto.subtle))return Promise.reject(new Error("nosubtle"));
 return sha(c.code+"|"+t.no+"|"+String(pin).trim()).then(function(h){if(h!==t.h)return false;localStorage.setItem(SK,JSON.stringify({c:c.code,no:t.no}));M.D=null;return true})};
M.logout=function(){localStorage.removeItem(SK);M.D=null};

/* ---- 個人資料（localStorage；有設定 cloud 時同步積分到雲端） ---- */
function key(u){return PRE+u.cls.code+":"+u.st.no}
function blank(){return{pts:0,u:{},day:{},wr:[],stk:{},dq:{},mk:[],sk:{last:"",n:0},pf:0,fx:0}}
M.data=function(){if(M.D)return M.D;var u=M.cur();if(!u)return null;var d;try{d=JSON.parse(localStorage.getItem(key(u)))}catch(e){}return M.D=Object.assign(blank(),d||{})};
M.read=function(c,no){try{return Object.assign(blank(),JSON.parse(localStorage.getItem(PRE+c+":"+no)))}catch(e){return blank()}};
M.save=function(){var u=M.cur(),D=M.D;if(!u||!D)return;try{localStorage.setItem(key(u),JSON.stringify(D))}catch(e){}push(u,D)};
M.tot=function(D){var n=0,c=0,k;for(k in D.u){n+=D.u[k].n;c+=D.u[k].c}return{n:n,c:c}};
M.lv=function(D){return Math.floor(D.pts/150)+1};
M.seen=function(D){return Object.keys(D.u).filter(function(k){return D.u[k].seen}).length};
function push(u,D){if(!CFG.cloud)return;clearTimeout(push.t);push.t=setTimeout(function(){var t=M.tot(D);
 fetch(CFG.cloud,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({act:"put",c:u.cls.code,no:u.st.no,n:u.st.n,pts:D.pts,lv:M.lv(D),stk:Object.keys(D.stk).length,ok:t.c,tot:t.n})}).catch(function(){})},900)}
M.board=function(){var u=M.cur();
 if(CFG.cloud)return fetch(CFG.cloud+"?act=board&c="+encodeURIComponent(u.cls.code)).then(function(r){return r.json()}).then(function(a){return{rows:a,cloud:true}});
 var rows=[];u.cls.s.forEach(function(s){var D=M.read(u.cls.code,s.no),t=M.tot(D);if(t.n)rows.push({no:s.no,n:s.n,pts:D.pts,lv:M.lv(D),stk:Object.keys(D.stk).length,ok:t.c,tot:t.n})});
 return Promise.resolve({rows:rows,cloud:false})};

/* ---- 作答紀錄／錯題本／連續天數 ---- */
M.rec=function(id,q,ok,wrongMode){
 var D=M.data(),t=ymd(),u=D.u[id]=D.u[id]||{n:0,c:0},d=D.day[t]=D.day[t]||{n:0,c:0},k=id+"|"+q.q,w=D.wr.filter(function(x){return x.k===k})[0];
 u.n++;d.n++;
 if(ok){u.c++;d.c++;D.pts+=10;
  if(w&&wrongMode){w.ok=(w.ok||0)+1;if(w.ok>=2){D.wr.splice(D.wr.indexOf(w),1);D.fx++;D.pts+=15}}}
 else if(w){w.ok=0;w.n++}
 else{D.wr.push({k:k,id:id,q:q.q,a:q.a,o:q.o,h:q.h,n:1,ok:0,at:t});if(D.wr.length>200)D.wr.shift()}};
M.touchDay=function(){var D=M.data(),t=ymd(),y=ymd(new Date(Date.now()-864e5));if(D.sk.last===t)return;D.sk.n=D.sk.last===y?D.sk.n+1:1;D.sk.last=t;if(D.sk.n>1)D.pts+=Math.min(D.sk.n,7)*2};

/* ---- 貼紙 ---- */
function dqOk(D){return Object.keys(D.dq).filter(function(k){return D.dq[k].ok}).length}
M.STK=[
{id:"first",n:"初試啼聲",d:"完成第一次練習",g:"M4 20l1-4L16 5l3 3L8 19zM13.5 7.5l3 3",ok:function(D){return M.tot(D).n>=1}},
{id:"c10",n:"十題達人",d:"累積答對 10 題",g:"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",ok:function(D){return M.tot(D).c>=10}},
{id:"c50",n:"五十題勇士",d:"累積答對 50 題",g:"M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13.5L7 21l5-3 5 3-1.5-7.5",ok:function(D){return M.tot(D).c>=50}},
{id:"c100",n:"百題王者",d:"累積答對 100 題",g:"M3 8l4 4 5-7 5 7 4-4-2 11H5z",ok:function(D){return M.tot(D).c>=100}},
{id:"perfect",n:"百發百中",d:"一份小測驗全對",g:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",ok:function(D){return D.pf>=1}},
{id:"s3",n:"小火苗",d:"連續 3 天練習",g:"M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z",ok:function(D){return D.sk.n>=3}},
{id:"s7",n:"持之以恆",d:"連續 7 天練習",g:"M4 6h16v14H4zM4 11h16M8 3v5M16 3v5M8 15l2.5 2.5L16 14",ok:function(D){return D.sk.n>=7}},
{id:"dq5",n:"每日小太陽",d:"每日一題答對 5 次",g:"M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",ok:function(D){return dqOk(D)>=5}},
{id:"mock80",n:"模擬卷高手",d:"模擬卷 80 分以上",g:"M5 21V3M5 4h12l-2 4 2 4H5",ok:function(D){return D.mk.some(function(m){return m.sc>=80})}},
{id:"fix5",n:"錯題終結者",d:"訂正畢業 5 題錯題",g:"M12 20S4 15 4 9.5A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 8 1.5C20 15 12 20 12 20z",ok:function(D){return D.fx>=5}},
{id:"explore",n:"單元探險家",d:"逛過 5 個單元",g:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z",ok:function(D){return M.seen(D)>=5}},
{id:"lv5",n:"閃亮新星",d:"升到 Lv.5",g:"M6 4h12l4 6-10 11L2 10zM2 10h20",ok:function(D){return M.lv(D)>=5}}
];
M.award=function(){var D=M.data(),got=[];M.STK.forEach(function(s){if(!D.stk[s.id]&&s.ok(D)){D.stk[s.id]=ymd();D.pts+=20;got.push(s)}});return got};

/* ---- 題庫：每個單元一個「產生器」，可無限出新題（也用於每日一題、模擬卷、練習卷） ---- */
function ri(r,a,b){return a+Math.floor(r()*(b-a+1))}
function pick(r,a){return a[Math.floor(r()*a.length)]}
M.rng=function(s){var a=typeof s==="number"?s:0,i;if(typeof s==="string"){a=2166136261;for(i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)}}
 return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
M.G=[
{id:"3u-9.4",f:function(r){var d=ri(r,5,12),a=ri(r,1,d-2),b=ri(r,a+1,d-1),o=[a+"/"+d,b+"/"+d];if(r()<.5)o.reverse();return{q:"哪一個分數比較大？",o:o,a:b+"/"+d,h:"分母相同，分子大的分數比較大。"}}},
{id:"3d-3.3",f:function(r){var d=pick(r,[3,4,5,6,8,10]),n=ri(r,4,12);return{q:"一條路長 "+d*n+" 公尺，每隔 "+d+" 公尺種一棵樹，兩端都要種，共需幾棵樹？",a:n+1,h:"間隔數 "+d*n+" ÷ "+d+" = "+n+"，棵數 = 間隔數 + 1。"}}},
{id:"4d-6.3",f:function(r){var l=ri(r,5,20),w=ri(r,2,l-1);return r()<.5?{q:"長方形的長 "+l+" 公分、寬 "+w+" 公分，面積是幾平方公分？",a:l*w,h:"長方形面積 = 長 × 寬 = "+l+" × "+w+"。"}:{q:"長方形的長 "+l+" 公分、寬 "+w+" 公分，周長是幾公分？",a:2*(l+w),h:"周長 = (長 + 寬) × 2 = ("+l+" + "+w+") × 2。"}}},
{id:"5u-9.2",f:function(r){var b=pick(r,[6,8,10,12,14,16]),t=ri(r,3,12);return{q:"三角形的底 "+b+" 公分、高 "+t+" 公分，面積是幾平方公分？",a:b*t/2,h:"三角形面積 = 底 × 高 ÷ 2 = "+b+" × "+t+" ÷ 2。"}}},
{id:"5d-1.1",f:function(r){var a=ri(r,3,12),b=ri(r,2,9),c=ri(r,2,8);return{q:"長方體的長 "+a+" 公分、寬 "+b+" 公分、高 "+c+" 公分，體積是幾立方公分？",a:a*b*c,h:"體積 = 長 × 寬 × 高 = "+a+" × "+b+" × "+c+"。"}}},
{id:"5d-3.3",f:function(r){var l=pick(r,[10,12,15,20,25]),w=pick(r,[8,10,12,15]),t=ri(r,1,5);return{q:"長 "+l+" 公分、寬 "+w+" 公分的長方體水槽，放入一塊石頭後水面升高 "+t+" 公分，石頭的體積是幾立方公分？",a:l*w*t,h:"石頭體積 = 水槽底面積 × 水面升高 = "+l+" × "+w+" × "+t+"。"}}},
{id:"5d-7.2",f:function(r){var a=ri(r,2,9),b=ri(r,2,9),c=ri(r,2,9);return{q:"長方體的長 "+a+" 公分、寬 "+b+" 公分、高 "+c+" 公分，表面積是幾平方公分？",a:2*(a*b+b*c+a*c),h:"表面積 = 2 × (長×寬 + 寬×高 + 長×高) = 2 × ("+a*b+" + "+b*c+" + "+a*c+")。"}}},
{id:"6u-7.1",f:function(r){var x=ri(r,2,12);return{q:"圓周率用 3.14，半徑 "+x+" 公分的圓，面積是幾平方公分？",a:+(3.14*x*x).toFixed(2),h:"圓面積 = 半徑 × 半徑 × 3.14 = "+x+" × "+x+" × 3.14。"}}},
{id:"6d-2.2",f:function(r){var a=ri(r,40,80),b=ri(r,40,80),t=ri(r,3,15);return{q:"甲乙兩人相距 "+(a+b)*t+" 公尺，同時出發相向而行，甲每分鐘走 "+a+" 公尺，乙每分鐘走 "+b+" 公尺，幾分鐘後相遇？",a:t,h:"相遇時間 = 距離 ÷ 速度和 = "+(a+b)*t+" ÷ ("+a+" + "+b+")。"}}},
{id:"6d-3.1",f:function(r){var b=pick(r,[4,6,8,10]),t=ri(r,3,9),H=ri(r,4,12);return{q:"三角柱的底面是底 "+b+" 公分、高 "+t+" 公分的三角形，柱高 "+H+" 公分，體積是幾立方公分？",a:b*t/2*H,h:"柱體體積 = 底面積 × 高 = ("+b+" × "+t+" ÷ 2) × "+H+"。"}}},
{id:"6d-5.1",f:function(r){var d=ri(r,2,20),s=ri(r,5,40);return{q:"兩數的和是 "+(2*s+d)+"，差是 "+d+"，較大的數是多少？",a:s+d,h:"較大數 = (和 + 差) ÷ 2 = ("+(2*s+d)+" + "+d+") ÷ 2。"}}},
{id:"6d-5.3",f:function(r){var n=ri(r,6,15),k=ri(r,1,n-1);return{q:"雞兔共 "+n+" 隻，共 "+(2*n+2*k)+" 隻腳，兔有幾隻？",a:k,h:"假設全是雞：2 × "+n+" = "+2*n+" 隻腳，少了 "+2*k+" 隻，每換一隻兔多 2 隻腳，所以 "+2*k+" ÷ 2。"}}}
];
M.G.forEach(function(x){x.g=+x.id[0]});
M.gen=function(id,r){var g=M.G.filter(function(x){return x.id===id})[0];if(!g)return null;var q=g.f(r||Math.random);q.id=id;return q};
M.has=function(id){return M.G.some(function(x){return x.id===id})};
/* 年級題池：優先本年級與前一年級，不足 3 個單元就放寬到所有 ≤ 本年級 */
M.pool=function(g){var p=M.G.filter(function(x){return x.g<=g&&x.g>=g-1});return p.length>=3?p:M.G.filter(function(x){return x.g<=g})};
M.set=function(id,n,r){var out=[],seen={},i=0,q;r=r||Math.random;while(out.length<n&&i++<n*8){q=M.gen(id,r);if(q&&!seen[q.q]){seen[q.q]=1;out.push(q)}}return out};
M.mix=function(g,n,r){var p=M.pool(g).slice(),out=[],seen={},i=0,q,j,t;r=r||Math.random;
 for(j=p.length-1;j>0;j--){t=Math.floor(r()*(j+1));q=p[j];p[j]=p[t];p[t]=q}
 while(out.length<n&&i<n*10){q=M.gen(p[i++%p.length].id,r);if(!seen[q.q]){seen[q.q]=1;out.push(q)}}return out};

/* ---- 與單元頁、首頁的接點 ---- */
M.chip=function(){var u=M.cur(),a=NB.h('<a class="chip" href="'+NB.root+'member.html"></a>');if(u){var D=M.data();a.textContent=u.st.n+"・Lv."+M.lv(D)+"・"+D.pts+" 分"}else a.textContent="班級專區・登入";return a};
M.onUnit=function(app,id){var u=M.cur(),el,R=NB.root;
 if(u){var D=M.data(),x=D.u[id]=D.u[id]||{n:0,c:0};if(!x.seen){x.seen=1;M.save()}
  el=NB.h('<section class="sheet"><h2><span class="tag">班級專區</span>學完了，來考考自己</h2><div class="ctl"><a class="pen go" href="'+R+'member.html#quiz/'+id+'">這一節的小測驗</a><a class="pen" href="'+R+'member.html#wrong">錯題本</a><a class="pen" href="'+R+'member.html#daily">每日一題</a></div></section>')}
 else el=NB.h('<section class="sheet"><h2><span class="tag">班級專區</span>小測驗・錯題本・貼紙・排行榜</h2><p>這些功能只開放給班上同學使用。</p><a class="pen go" href="'+R+'member.html#login">同學登入</a></section>');
 app.insertBefore(el,app.lastElementChild)};
})();
