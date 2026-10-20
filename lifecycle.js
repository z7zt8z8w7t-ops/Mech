'use strict';
// Shared interlocks apply to joystick, keyboard, charged shots and continuous weapons.
function isRepairing(){return !ejected&&mech.hp>0&&!ejectHeld&&!!(repair||keys.r);}
function isEjectionWarning(){return !ejected&&(ejectHeld||window.MechLifecycle?.automatic);}
const ESCAPE_HULL=[[506,339],[600,295],[655,295],[756,339],[822,330],[862,396],[868,450],[868,610],[800,742],[460,742],[397,610],[397,450],[397,396],[435,330]];
window.MechLifecycle=(()=>{
 let wreck=null,automatic=false,warning=0,smoke=[],smokeClock=0,podArt=null;
 const canopy=new Image();let canopyReady=false;canopy.onload=()=>{canopyReady=true;};canopy.src='./assets/escape-parachute.png';
 const TAU=Math.PI*2,BLAST_RADIUS=340,WAVE_SPEED=360;
 function resetEffects(){wreck=null;automatic=false;warning=0;smoke=[];smokeClock=0;podArt=null;}
 function requestAutomatic(){if(ejected||automatic)return;automatic=true;warning=0;held.fill(false);charging.fill(null);}
 function snapshot(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.translate(128,128);g.scale(2,2);drawConfiguredMech(g,{r:stats[$('#class').value].r,a:mech.a,t:mech.t,step:mech.step,slots:loadout.slots.slice(),hp:mech.hp,preview:true});return c;}
 function capturePod(){const c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d');g.translate(96,96);g.scale(2.6,2.6);const ratio=stats[$('#class').value].r/21;g.scale(ART.sx*ratio,ART.sy*ratio);g.translate(-630,-660);pathOn(g,ESCAPE_HULL);g.clip();g.drawImage(componentImages.weathered,0,274,1272,666,0,295,1272,675);return c;}
 function launch(){if(ejected)return;automatic=false;warning=0;const r=stats[$('#class').value].r;
  podArt=spritesReady?capturePod():null;const art=spritesReady?snapshot():null;
  capsule={x:mech.x,y:mech.y,originX:mech.x,originY:mech.y,a:mech.t,age:0,safe:false,r};
  wreck={x:mech.x,y:mech.y,age:0,exploded:false,hit:new Set(),debris:[],fire:[],art,scorch:makeScorch()};
  ejected=true;shieldActive=false;clearInput();charging.fill(null);GameAudio.escape?.();
 }
 // Cache an irregular translucent soot decal once per wreck; never animate its noise.
 function makeScorch(){const size=320,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),pixels=g.createImageData(size,size);let seed=12657;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const grid=Array.from({length:25},()=>Array.from({length:25},random));
  const noise=(x,y,scale)=>{const xx=x/size*scale,yy=y/size*scale,i=Math.floor(xx),j=Math.floor(yy),u=xx-i,v=yy-j;const a=grid[j%25][i%25],b=grid[j%25][(i+1)%25],c=grid[(j+1)%25][i%25],d=grid[(j+1)%25][(i+1)%25];return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+d*u*v;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const nx=(x-size/2)/(size*.36),ny=(y-size/2)/(size*.31),a=Math.atan2(ny,nx),r=Math.hypot(nx,ny)/(1+.10*Math.sin(a*5+.4)+.07*Math.sin(a*9)),n=noise(x,y,9)*.65+noise(x,y,23)*.35,falloff=Math.max(0,1-r/1.18),alpha=falloff**.65*(.23+.34*n)*(1-.38*Math.max(0,noise(x,y,4)-.55));const i=(y*size+x)*4;pixels.data[i]=25;pixels.data[i+1]=22;pixels.data[i+2]=18;pixels.data[i+3]=Math.round(Math.min(.54,alpha)*255);}
  g.putImageData(pixels,0,0);return c;
 }
 function drawGround(g){if(!wreck?.exploded)return;g.save();g.drawImage(wreck.scorch,wreck.x-112,wreck.y-112,224,224);g.restore();}
 function detonate(){if(!wreck||wreck.exploded)return;wreck.exploded=true;GameAudio.detonation?.();
  for(let i=0;i<64;i++){const a=Math.random()*TAU,v=70+Math.random()*210;wreck.debris.push({x:wreck.x,y:wreck.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,z:0,vz:80+Math.random()*170,rot:Math.random()*TAU,spin:(Math.random()-.5)*9,tile:i,age:0});}
  for(let i=0;i<38;i++)wreck.fire.push({a:Math.random()*TAU,v:Math.random()*110,r:35+Math.random()*65,delay:Math.random()*.22});
  burst(wreck.x,wreck.y,'#ffd485',100);
 }
 function update(dt){
  if(automatic&&!ejected){warning+=dt;eject=warning;if(warning>=5)launch();}
  GameAudio.ejectionWarning?.(isEjectionWarning());
  if(!wreck)return;wreck.age+=dt;
  const c=capsule;if(c){c.age+=dt;const t=c.age;
   if(t<2.1){c.x=c.originX+26*t;c.y=c.originY-165*t+34*t*t;}
   else if(t<2.7){c.x=c.originX+54.6;c.y=c.originY-196.56+(t-2.1)*65;}
   else{c.x+=145*dt;c.y-=18*dt;}
   const viewWidth=cv.getBoundingClientRect().width/camera.scale;
   if(t>3&&c.x>camera.x+viewWidth+150)c.safe=true;
  }
  if(wreck.age>=.8)detonate();if(!wreck.exploded)return;const age=wreck.age-.8,radius=Math.min(BLAST_RADIUS,age*WAVE_SPEED);
  for(const t of targets){const distance=Math.hypot(t.x-wreck.x,t.y-wreck.y);if(t.hp>0&&!wreck.hit.has(t)&&distance<=radius+(t.r||24)&&distance<BLAST_RADIUS+(t.r||24)){wreck.hit.add(t);damageTarget(t,220*Math.max(.25,1-distance/(BLAST_RADIUS+50)),'chassis');}}
  for(const p of wreck.debris){p.age+=dt;if(p.z>0||p.age<.1){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-.9*dt);p.vy*=Math.exp(-.9*dt);p.z=Math.max(0,p.z+p.vz*dt);p.vz-=180*dt;p.rot+=p.spin*dt;}}
  // Continuous emitter with bounded live particles; older smoke fades downwind.
  smokeClock+=dt;while(smokeClock>=.08){smokeClock-=.08;smoke.push({x:wreck.x+(Math.random()-.5)*45,y:wreck.y+(Math.random()-.5)*45,age:0,life:10+Math.random()*4,r:16+Math.random()*20,seed:Math.random()*TAU});}
  const windX=24+Math.sin(clock*.13)*6,windY=-13+Math.sin(clock*.17)*4;
  for(const s of smoke){s.age+=dt;s.x+=(windX+Math.sin(s.seed+s.age*.5)*4)*dt;s.y+=(windY-5+Math.cos(s.seed+s.age*.3)*3)*dt;}
  smoke=smoke.filter(s=>s.age<s.life).slice(-180);
 }
 function lights(){if(ejected)return {on:false,colour:'#050807',rgb:'5,8,7'};
  if(isEjectionWarning()){const t=automatic?warning:eject,on=Math.sin(TAU*(.6*t+.4*t*t))>-.1;return {on,colour:on?'#ff3530':'#210807',rgb:on?'255,45,30':'5,2,1'};}
  if(isRepairing()){const on=Math.sin(clock*TAU*2)>0;return {on,colour:on?'#ffd735':'#28210a',rgb:on?'255,210,40':'5,4,1'};}
  return {on:true,colour:'#e8ffdf',rgb:'220,244,218'};
 }
 function drawLights(g){if(ejected||(!isRepairing()&&!isEjectionWarning()))return;const l=lights();g.save();g.fillStyle=l.colour;g.shadowColor=l.colour;g.shadowBlur=l.on?14:0;for(const p of [...floodlightPositions(),turretPoint(-18,-10),turretPoint(-18,0),turretPoint(-18,10)]){g.beginPath();g.arc(p.x,p.y,3.3*MECH_SCALE,0,TAU);g.fill();}g.restore();}
 function draw(g){if(!wreck||!wreck.exploded)return;const t=wreck.age-.8;g.save();
  for(const p of wreck.debris){g.save();g.translate(p.x,p.y-p.z);g.rotate(p.rot);if(wreck.art){const sx=(p.tile%8)*32,sy=Math.floor(p.tile/8)*32;g.drawImage(wreck.art,sx,sy,32,32,-9,-9,18,18);}else{g.fillStyle='#58605d';g.fillRect(-5,-3,10,6);}g.restore();}
  if(t<1.5){const radius=Math.min(BLAST_RADIUS,t*WAVE_SPEED);g.globalAlpha=Math.max(0,1-t/1.5);g.strokeStyle='#ffda9c';g.lineWidth=7;g.beginPath();g.arc(wreck.x,wreck.y,radius,0,TAU);g.stroke();g.lineWidth=24;g.strokeStyle='#ffc57233';g.stroke();g.globalAlpha=1;}
  if(t<2.5){g.globalCompositeOperation='screen';for(const f of wreck.fire){const a=t-f.delay;if(a<0||a>2)continue;const k=1-a/2,r=f.r*Math.min(1,a/.08)*k;if(r<=0)continue;const x=wreck.x+Math.cos(f.a)*f.v*a,y=wreck.y+Math.sin(f.a)*f.v*a,grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,`rgba(255,251,203,${k})`);grad.addColorStop(.3,`rgba(255,194,49,${k})`);grad.addColorStop(.65,`rgba(255,69,8,${k*.9})`);grad.addColorStop(1,'rgba(80,12,0,0)');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);}g.globalCompositeOperation='source-over';}
  for(const s of smoke){const k=s.age/s.life,r=s.r+s.age*5,alpha=Math.min(1,s.age/.6)*(1-k)*.44,grad=g.createRadialGradient(s.x,s.y,0,s.x,s.y,r);grad.addColorStop(0,`rgba(40,43,43,${alpha})`);grad.addColorStop(.55,`rgba(48,51,50,${alpha*.8})`);grad.addColorStop(1,'rgba(55,58,57,0)');g.fillStyle=grad;g.fillRect(s.x-r,s.y-r,r*2,r*2);}
  g.restore();
 }
 function drawPod(g){const c=capsule;if(!c||c.safe)return;const t=c.age,scale=MECH_SCALE*(c.r/21)*(1+Math.min(t,2)*.2);g.save();g.translate(c.x,c.y);
  if(t<2.7){if(t<1.9){g.save();g.rotate(c.a+Math.PI/2);for(const x of [-12,12]){const len=25+Math.sin(clock*75)*7;g.fillStyle='#ff8b24';g.beginPath();g.moveTo(x-4,12);g.lineTo(x+4,12);g.lineTo(x,12+len);g.fill();g.fillStyle='#fff3c4';g.fillRect(x-1.5,12,3,12);}g.restore();}
   g.rotate(c.a+Math.PI/2);g.scale(scale,scale);if(podArt)g.drawImage(podArt,-37,-37,74,74);else{g.fillStyle='#84938a';g.fillRect(-14,-20,28,40);g.fillStyle='#73d7ad';g.fillRect(-8,-10,16,14);}
  }else{const opened=Math.min(1,(t-2.7)/.45),r=50*scale*opened,sway=Math.sin(t*1.6)*.035;
   // Opaque cloth canopy, seen from above; no visible hanging pod or lines.
   if(r>0){g.rotate(sway);g.scale(1+Math.sin(t*2.1)*.012,1+Math.cos(t*1.8)*.012);g.shadowColor='#0006';g.shadowBlur=20;g.shadowOffsetX=11;g.shadowOffsetY=17;
    if(canopyReady)g.drawImage(canopy,-r,-r,r*2,r*2);
    else{const cloth=g.createRadialGradient(-r*.25,-r*.3,0,0,0,r);cloth.addColorStop(0,'#eee2bf');cloth.addColorStop(.7,'#cbb78e');cloth.addColorStop(1,'#897758');g.fillStyle=cloth;g.beginPath();g.arc(0,0,r,0,TAU);g.fill();}
   }
  }g.restore();
 }
 return {reset:resetEffects,requestAutomatic,launch,update,draw,drawGround,drawPod,drawLights,lights,get automatic(){return automatic;},get exploded(){return !!wreck?.exploded;},get smokeCount(){return smoke.length;},get blastHits(){return wreck?.hit.size||0;}};
})();
const resetBeforeLifecycle=reset;reset=function(){resetBeforeLifecycle();MechLifecycle.reset();};
