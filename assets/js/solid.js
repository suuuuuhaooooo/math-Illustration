/* 立體引擎：純 SVG 的簡易 3D（可拖曳旋轉），用來做體積、容積、表面積等互動。
   座標：x 向右、y 向上、z 朝向觀看者。
   用法：var S=NB.solid(box); S.draw(faces,[中心x,y,z],縮放);
   面的來源：NB.solid.cuboid / grid / prism，各回傳 faces 陣列，可用 concat 組合。 */
(function(){
var NB=window.NB,W=560,H=340;
function Solid(box,o){
 o=o||{};var st=NB.h('<div class="stage"></div>'),v=NB.svg(st,W,H),S={yaw:o.yaw==null?-.65:o.yaw,pitch:o.pitch==null?.52:o.pitch,sc:18,c:[0,0,0],faces:[]},drag=null;
 v.setAttribute("class","sk flat");v.style.cursor="grab";v.style.touchAction="none";
 box.appendChild(st);box.appendChild(NB.h('<p class="meta" style="text-align:center;margin:0">拖曳立體圖，可以轉轉看</p>'));
 v.addEventListener("pointerdown",function(e){drag=[e.clientX,e.clientY];v.setPointerCapture(e.pointerId);v.style.cursor="grabbing"});
 v.addEventListener("pointermove",function(e){if(!drag)return;S.yaw+=(e.clientX-drag[0])*.01;S.pitch=Math.max(-.25,Math.min(1.35,S.pitch+(e.clientY-drag[1])*.008));drag=[e.clientX,e.clientY];render()});
 function end(){drag=null;v.style.cursor="grab"}v.addEventListener("pointerup",end);v.addEventListener("pointercancel",end);
 S.draw=function(faces,c,sc){if(faces)S.faces=faces;if(c)S.c=c;if(sc)S.sc=sc;render()};
 function render(){
  v.innerHTML="";var cy=Math.cos(S.yaw),sy=Math.sin(S.yaw),cp=Math.cos(S.pitch),sp=Math.sin(S.pitch),out=[];
  function R(p){var x=p[0]-S.c[0],y=p[1]-S.c[1],z=p[2]-S.c[2],x1=x*cy+z*sy,z1=-x*sy+z*cy;return[x1,y*cp-z1*sp,y*sp+z1*cp]}
  S.faces.forEach(function(f){var q=f.p.map(R),a=q[0],b=q[1],c=q[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],
   nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,L=Math.sqrt(nx*nx+ny*ny+nz*nz)||1,d=0;
   if(nz<=0&&!f.both)return;if(nz<0){nx=-nx;ny=-ny;nz=-nz}
   q.forEach(function(r){d+=r[2]});out.push({f:f,q:q,d:d/q.length,b:.6+.4*Math.max(0,(nx*.35+ny*.8+nz*.5)/L/1.2)})});
  out.sort(function(a,b){return a.d-b.d});
  out.forEach(function(o){var f=o.f,e=NB.s("polygon",{points:o.q.map(function(r){return(W/2+r[0]*S.sc).toFixed(1)+","+(H/2-r[1]*S.sc+8).toFixed(1)}).join(" "),"stroke-linejoin":"round"},v);
   e.style.fill="color-mix(in srgb,"+(f.f||"var(--p2)")+" "+Math.round(o.b*100)+"%,#000)";e.style.fillOpacity=f.o==null?1:f.o;e.style.stroke=f.s===null?"none":(f.s||"var(--ink)");e.style.strokeWidth=f.sw||1;if(f.dash)e.style.strokeDasharray=f.dash})}
 return S}
function mkAdd(F,o){var c=o.col||{};return function(k,p){F.push({p:p,f:c[k]||o.f,o:o.o,s:o.s,sw:o.sw,both:o.both,dash:o.dash})}}
/* 單一長方體（每面一塊）。o:{f 顏色, col:{front,back,left,right,top,bottom}, o 透明度, s 邊線色, sw 線寬, both 背面也畫} */
Solid.cuboid=function(x0,y0,z0,x1,y1,z1,o){o=o||{};var F=[],a=mkAdd(F,o);
 a("front",[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]);a("back",[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]]);
 a("right",[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]]);a("left",[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]]);
 a("top",[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]);a("bottom",[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]);return F};
/* 切成 1×1 小方格的長方體（座標需為整數），可以數方格 */
Solid.grid=function(x0,y0,z0,x1,y1,z1,o){o=o||{};var F=[],a=mkAdd(F,o),i,j;
 for(i=x0;i<x1;i++)for(j=y0;j<y1;j++){a("front",[[i,j,z1],[i+1,j,z1],[i+1,j+1,z1],[i,j+1,z1]]);a("back",[[i+1,j,z0],[i,j,z0],[i,j+1,z0],[i+1,j+1,z0]])}
 for(i=z0;i<z1;i++)for(j=y0;j<y1;j++){a("right",[[x1,j,i+1],[x1,j,i],[x1,j+1,i],[x1,j+1,i+1]]);a("left",[[x0,j,i],[x0,j,i+1],[x0,j+1,i+1],[x0,j+1,i]])}
 for(i=x0;i<x1;i++)for(j=z0;j<z1;j++){a("top",[[i,y1,j+1],[i+1,y1,j+1],[i+1,y1,j],[i,y1,j]]);a("bottom",[[i,y0,j],[i+1,y0,j],[i+1,y0,j+1],[i,y0,j+1]])}
 return F};
/* 柱體：P 是底面多邊形（逆時針的 [x,y] 點），從高度 y0 到 y1 */
Solid.prism=function(P,y0,y1,o){o=o||{};var F=[],a=mkAdd(F,o),n=P.length,i;function w(p,y){return[p[0],y,-p[1]]}
 a("top",P.map(function(p){return w(p,y1)}));a("bottom",P.slice().reverse().map(function(p){return w(p,y0)}));
 for(i=0;i<n;i++){var A=P[i],B=P[(i+1)%n];a("side",[w(A,y0),w(B,y0),w(B,y1),w(A,y1)])}return F};
Solid.area=function(P){var s=0,i;for(i=0;i<P.length;i++){var A=P[i],B=P[(i+1)%P.length];s+=A[0]*B[1]-B[0]*A[1]}return Math.abs(s)/2};
NB.solid=Solid;
})();
