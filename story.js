'use strict';
window.StoryFlow=(()=>{
 if(typeof document.body.insertAdjacentHTML!=='function')return {active:false};
 document.body.insertAdjacentHTML('beforeend',`<section id="story-screen" class="splash" aria-label="MECH story"><div id="story-art"><img id="story-image" src="./assets/story/splash.jpg" alt="MECH — Voss in shadow"><button id="story-start">STORY MODE</button><div id="story-error" hidden>Page could not load. Check your connection and retry.<br><button id="story-retry">RETRY PAGE</button></div></div><nav id="story-nav" aria-label="Comic navigation" hidden><button id="story-back">← BACK</button><span id="story-page-label"></span><button id="story-skip">SKIP</button><button id="story-next">TURN PAGE →</button></nav><div id="story-fade"></div></section>`);
 const screen=$('#story-screen'),image=$('#story-image'),start=$('#story-start'),nav=$('#story-nav'),error=$('#story-error');const pages=['cover','page1','page2','page3'];let page=-1,busy=false,epoch=0;
 const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 function showPage(n){page=n;screen.classList.toggle('splash',n<0);screen.classList.toggle('cover',n===0);start.hidden=n>=0;nav.hidden=n<0;image.src='./assets/story/'+(n<0?'splash':pages[n])+'.jpg';image.alt=n<0?'MECH — Voss in shadow':n===0?'MECH Season 1 — Fresh Meat cover':'MECH opening comic, page '+n;$('#story-page-label').textContent=n===0?'FRONT COVER':n>0?'PAGE '+n+' / 3':'';$('#story-next').textContent=n===3?'TUTORIAL →':'TURN PAGE →';error.hidden=true;}
 function splash(){cancelCurl();epoch++;busy=false;screen.hidden=false;screen.classList.remove('fading','revealing');document.body.classList.add('story-active');clearInput();window.CockpitBoot?.close();showPage(-1);}
 function begin(){if(busy)return;GameAudio.unlock();busy=true;start.disabled=true;screen.classList.add('fading');const token=++epoch;setTimeout(()=>{if(token!==epoch)return;showPage(0);screen.classList.add('revealing');requestAnimationFrame(()=>{screen.classList.remove('fading');});setTimeout(()=>{if(token!==epoch)return;busy=false;start.disabled=false;screen.classList.remove('revealing');},reduced()?100:1000);},reduced()?100:2500);}
 // A textured mesh bends around a moving cylindrical fold, showing the paper back.
 const curl=document.createElement('canvas');curl.id='story-curl';curl.hidden=true;screen.appendChild(curl);
 let curlFrame=0;
 function cancelCurl(){cancelAnimationFrame(curlFrame);curl.hidden=true;}
 function curlPoint(x,y,w,h,p,back){const radius=w*.13,fold=w*(1.04-p*1.55)+w*.28*(1-y/h)*Math.sin(Math.PI*p);const d=x-fold;let xx=x,z=0,theta=0;
  if(d>0){theta=Math.min(Math.PI,d/radius);xx=fold+radius*Math.sin(theta)-Math.max(0,d-Math.PI*radius);z=radius*(1-Math.cos(theta));}
  return {x:back?w-xx:xx,y:y+(y-h*.48)*z/w*.16,z,back:d>radius*Math.PI/2,shade:.90-.40*Math.sin(theta)};
 }
 function texturedTriangle(g,im,s,d){const [a,b,c]=s,[u,v,w]=d,det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);if(Math.abs(det)<.001)return;
  g.save();g.beginPath();g.moveTo(u.x,u.y);g.lineTo(v.x,v.y);g.lineTo(w.x,w.y);g.closePath();g.clip();
  const A=((v.x-u.x)*(c.y-a.y)-(w.x-u.x)*(b.y-a.y))/det,B=((v.y-u.y)*(c.y-a.y)-(w.y-u.y)*(b.y-a.y))/det,C=((w.x-u.x)*(b.x-a.x)-(v.x-u.x)*(c.x-a.x))/det,D=((w.y-u.y)*(b.x-a.x)-(v.y-u.y)*(c.x-a.x))/det;
  g.transform(A,B,C,D,u.x-A*a.x-C*a.y,u.y-B*a.x-D*a.y);g.drawImage(im,0,0);g.restore();
 }
 function paintCurl(old,p,back){const g=curl.getContext('2d'),w=curl.width,h=curl.height;g.clearRect(0,0,w,h);
  const shadowX=w*(1.04-p*1.55);g.save();if(back){g.translate(w,0);g.scale(-1,1);}const shadow=g.createLinearGradient(shadowX-20,0,shadowX+w*.3,0);shadow.addColorStop(0,'#0000');shadow.addColorStop(.45,'#0008');shadow.addColorStop(1,'#0000');g.fillStyle=shadow;g.fillRect(shadowX-20,0,w*.32,h);g.restore();
  const nx=24,ny=6;for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++){
   const sx=ix*w/nx,sy=iy*h/ny,sw=w/nx,sh=h/ny,uv=[{x:sx,y:sy},{x:sx+sw,y:sy},{x:sx+sw,y:sy+sh},{x:sx,y:sy+sh}],pts=uv.map(v=>curlPoint(v.x,v.y,w,h,p,back));
   if(pts.every(v=>v.x<-w*.05||v.x>w*1.05))continue;
   const backside=pts.filter(v=>v.back).length>=2;
   if(backside){g.beginPath();pts.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();const tone=v=>`rgb(${Math.round(244*v)},${Math.round(232*v)},${Math.round(207*v)})`,grad=g.createLinearGradient(pts[0].x,pts[0].y,pts[1].x+.01,pts[1].y);grad.addColorStop(0,tone((pts[0].shade+pts[3].shade)/2));grad.addColorStop(1,tone((pts[1].shade+pts[2].shade)/2));g.fillStyle=grad;g.fill();g.strokeStyle=grad;g.lineWidth=.7;g.stroke();}
   else{const tex=uv.map(v=>({x:(back?w-v.x:v.x)*old.naturalWidth/w,y:v.y*old.naturalHeight/h}));texturedTriangle(g,old,[tex[0],tex[1],tex[2]],[pts[0],pts[1],pts[2]]);texturedTriangle(g,old,[tex[0],tex[2],tex[3]],[pts[0],pts[2],pts[3]]);}
  }
 }
 async function turnPage(n){if(busy)return;busy=true;const backwards=n<page,token=++epoch,old=new Image(),incoming=new Image();old.src=image.src;incoming.src='./assets/story/'+pages[n]+'.jpg';
  try{await Promise.all([old.decode(),incoming.decode()]);}catch{if(token===epoch){busy=false;error.hidden=false;}return;}
  if(token!==epoch)return;GameAudio.pageTurn?.();showPage(n);if(reduced()){busy=false;return;}
  curl.width=Math.min(1000,Math.round(screen.clientWidth));curl.height=Math.round(curl.width*screen.clientHeight/screen.clientWidth);curl.hidden=false;let began;
  const animate=now=>{if(token!==epoch)return;if(began===undefined)began=now;const p=Math.min(1,(now-began)/950);paintCurl(old,p*p*(3-2*p),backwards);if(p<1)curlFrame=requestAnimationFrame(animate);else{cancelCurl();busy=false;}};curlFrame=requestAnimationFrame(animate);
 }
 function tutorial(){if(busy)return;cancelCurl();epoch++;screen.hidden=true;document.body.classList.remove('story-active');clearInput();window.Tutorial.start();enterWorkshop();}
 start.onclick=begin;$('#story-back').onclick=()=>{if(busy)return;if(page<=0)splash();else turnPage(page-1);};$('#story-next').onclick=()=>{if(busy)return;if(page===3)tutorial();else turnPage(page+1);};$('#story-skip').onclick=tutorial;
 image.onerror=()=>{error.hidden=false;};image.onload=()=>{error.hidden=true;};$('#story-retry').onclick=()=>{const src=image.src;image.src='';image.src=src;};
 splash();return {splash,showPage,get active(){return !screen.hidden;},get page(){return page;},begin,tutorial};
})();
