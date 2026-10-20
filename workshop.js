'use strict';
let wsTab='weapons',wsSlot=0,wsIndex=0,wsFilter='All',wsCandidate=null,wsMessage='';
let carouselSoundKey='',carouselSoundPosition=0;
let carouselPosition=0,carouselTarget=0,carouselVelocity=0,carouselMoving=false,swipe=null,suppressClickUntil=0;
let glitchWait=10+Math.random()*15,glitchRemaining=0;
let beamRefreshWait=3+Math.random()*4,beamRefreshRemaining=0,beamRefreshDuration=.65;
function updateBeamRefresh(dt){const body=document.body,beam=document.querySelector('#cockpit-beam'),reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!beam||reduced||document.hidden||!workshopOpen||!body.classList.contains?.('cockpit-online')){body.classList.remove('beam-refresh');beamRefreshRemaining=0;return;}
 if(beamRefreshRemaining>0){beamRefreshRemaining=Math.max(0,beamRefreshRemaining-dt);const progress=1-beamRefreshRemaining/beamRefreshDuration;beam.style.setProperty('--refresh-y',String(100-progress*120));beam.style.setProperty('--refresh-flash',String(progress<.18?.045:progress>.45&&progress<.52?.025:0));body.classList.toggle('beam-refresh',beamRefreshRemaining>0);}
 else if((beamRefreshWait-=dt)<=0){beamRefreshDuration=.5+Math.random()*.4;beamRefreshRemaining=beamRefreshDuration;beamRefreshWait=5+Math.random()*8;beam.style.setProperty('--refresh-strength',String(.45+Math.random()*.35));body.classList.add('beam-refresh');}
}
const glitchBuffer=document.createElement('canvas');
function updateMonitorGlitch(dt){const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced){glitchRemaining=0;return;}glitchRemaining=Math.max(0,glitchRemaining-dt);glitchWait-=dt;if(glitchWait<=0){glitchRemaining=.2;glitchWait=10+Math.random()*15;}}
function drawMonitorGlitch(g,W,H,d){if(glitchRemaining<=0)return;glitchBuffer.width=wsCanvas.width;glitchBuffer.height=wsCanvas.height;glitchBuffer.getContext('2d').drawImage(wsCanvas,0,0);g.save();for(let i=0;i<3;i++){const y=Math.random()*H,h=2+Math.random()*9,offset=(Math.random()-.5)*18;g.clearRect(0,y,W,h);g.globalAlpha=.72;g.drawImage(glitchBuffer,0,y*d,W*d,h*d,offset,y,W,h);}g.globalAlpha=.12;g.fillStyle='#7cfca0';g.fillRect(0,Math.random()*H,W,1);for(let i=0;i<65;i++)g.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*5,1);g.restore();}
const ws=document.querySelector('#workshop'),wsCanvas=document.querySelector('#ws-canvas'),wsContext=wsCanvas.getContext('2d');
const carousel=document.querySelector('#ws-carousel'),cards=[...document.querySelectorAll('.ws-card')];

function wsOptions(){if(wsTab==='chassis')return CHASSIS;return [...WEAPONS.filter(w=>w.kind===slotKind(wsSlot)&&(wsFilter==='All'||w.family===wsFilter)),EMPTY];}
function clampIndex(n){return Math.max(0,Math.min(wsOptions().length-1,n));}
function currentChoice(){return wsOptions()[clampIndex(wsIndex)];}
function previewLoadout(){const cfg={chassis:loadout.chassis,slots:[...loadout.slots]},choice=currentChoice();if(wsTab==='chassis')cfg.chassis=choice.id;else cfg.slots[wsSlot]=choice.id;return cfg;}
function carouselPitch(){return Math.max(145,Math.min(350,carousel.getBoundingClientRect().width*.35));}
function settleOn(index,instant=false){wsIndex=clampIndex(index);carouselTarget=wsIndex;if(instant){carouselPosition=wsIndex;carouselVelocity=0;carouselMoving=false;}else carouselMoving=true;updateWorkshop();}
function chooseSlot(i){wsSlot=i;wsTab='weapons';wsFilter='All';const a=wsOptions();wsIndex=Math.max(0,a.findIndex(w=>w.id===loadout.slots[i]));wsMessage='';settleOn(wsIndex,true);GameAudio.menu('hardpoint');}
function chooseTab(tab){wsTab=tab;wsFilter='All';const a=wsOptions(),id=tab==='chassis'?loadout.chassis:loadout.slots[wsSlot];wsIndex=Math.max(0,a.findIndex(w=>w.id===id));wsMessage='';settleOn(wsIndex,true);}
function moveCarousel(delta){const next=clampIndex(wsIndex+delta);if(next===wsIndex)return;wsMessage='';settleOn(next);}
function equipCard(index){wsIndex=clampIndex(index);carouselTarget=wsIndex;carouselMoving=true;const choice=currentChoice(),cfg={chassis:loadout.chassis,slots:[...loadout.slots]};if(wsTab==='chassis')cfg.chassis=choice.id;else cfg.slots[wsSlot]=choice.id;equipConfig(cfg);cards.forEach(b=>delete b.dataset.item);wsMessage=saveFailed?'Equipped for this session. Local saving is unavailable.':choice.name+' equipped and saved.';updateWorkshop();GameAudio.menu(wsTab==='weapons'?'weapon':'click');}
function enterWorkshop(){workshopOpen=true;clearInput();Object.keys(keys).forEach(k=>keys[k]=false);document.body.classList.add('workshop-mode');ws.hidden=false;chooseTab(wsTab);drawWorkshop();window.CockpitBoot?.open();}
function testLoadout(){window.CockpitBoot?.close();workshopOpen=false;clearInput();Object.keys(keys).forEach(k=>keys[k]=false);ws.hidden=true;document.body.classList.remove('workshop-mode');reset();last=performance.now();note('',0);}

function paintCard(canvas,item){
 const g=canvas.getContext('2d');canvas.width=400;canvas.height=260;g.clearRect(0,0,400,260);
 if(wsTab==='chassis'){
  const fit=Math.min(340/150,220/145);g.save();g.translate(200,126);g.scale(fit*MECH_SCALE,fit*MECH_SCALE);drawConfiguredMech(g,{r:item.r,slots:loadout.slots,wire:true,selected:wsTab==='weapons'?wsSlot:-1,pulse:!((typeof matchMedia==='function')&&matchMedia('(prefers-reduced-motion: reduce)').matches),preview:true,a:-Math.PI/2,t:-Math.PI/2});g.restore();return;
 }
 if(item.id==='empty'){g.strokeStyle='#4bbb76';g.lineWidth=3;g.setLineDash([10,10]);g.strokeRect(125,45,150,155);g.setLineDash([]);g.fillStyle='#82f3a5';g.font='44px monospace';g.textAlign='center';g.fillText('+',200,140);return;}
 const a=artFor(item.id);if(!a.image?.complete||!a.image.width||!a.crop)return;const line=wireFor('card-'+item.id,a.image,a.crop);if(!line)return;const sc=Math.min(285/line.width,178/line.height);g.save();g.globalAlpha=.92;g.shadowColor='#62ff9a';g.shadowBlur=2;g.drawImage(line,200-line.width*sc/2,102-line.height*sc/2,line.width*sc,line.height*sc);g.restore();
}
function renderCarousel(){

 const options=wsOptions(),base=Math.round(carouselPosition),pitch=carouselPitch();
 cards.forEach((b,j)=>{
  const index=base+j-1,valid=index>=0&&index<options.length;b.hidden=!valid;if(!valid)return;
  const item=options[index],key=wsTab+':'+item.id;b.dataset.index=String(index);
  if(b.dataset.item!==key){b.dataset.item=key;b.querySelector('b').textContent=item.name||item.id;b.querySelector('small').textContent=wsTab==='chassis'?item.tag:item.id==='empty'?'EMPTY MOUNT':'TIER '+item.tier+' · '+item.family.toUpperCase();b.setAttribute('aria-label',(item.name||item.id)+' — tap to equip');paintCard(b.querySelector('canvas'),item);}
  const offset=(index-carouselPosition)*pitch,distance=Math.min(1,Math.abs(index-carouselPosition));b.classList.toggle('center',index===wsIndex);const equipped=item.id===(wsTab==='chassis'?loadout.chassis:loadout.slots[wsSlot]);b.classList.toggle('equipped',equipped);b.querySelector('small').textContent=equipped?'✓ EQUIPPED':'';b.setAttribute('aria-pressed',String(equipped));b.style.transform=`translate3d(calc(-50% + ${offset}px),0,0) scale(${1-distance*.1})`;b.style.opacity=String(1-distance*.38);
 });
 document.querySelector('#ws-prev').disabled=wsIndex<=0;document.querySelector('#ws-next').disabled=wsIndex>=options.length-1;
}
function weaponSummary(w){
 if(w.id==='empty')return 'EMPTY MOUNT';
 if(w.kind==='pod')return `TIER ${w.tier} · ${w.guided?'GUIDED':'UNGUIDED'} · ${w.cells} CELLS`;
 return `TIER ${w.tier} · ${w.family.toUpperCase()}${w.range?' · RANGE '+w.range:''}`;
}
function updateWorkshop(){
 const options=wsOptions(),choice=currentChoice(),cfg=previewLoadout();wsCandidate=choice;
 document.querySelectorAll('[data-ws-tab]').forEach(b=>{const selected=b.dataset.wsTab===wsTab;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));});
 document.querySelectorAll('[data-info-slot]').forEach(panel=>{const i=+panel.dataset.infoSlot,w=BY_ID[cfg.slots[i]],selected=wsTab==='weapons'&&i===wsSlot;panel.classList.toggle('active',selected);panel.setAttribute('aria-pressed',String(selected));panel.setAttribute('aria-label',SLOT_NAMES[i]+': '+w.name+' — choose weapon');panel.querySelector('strong').textContent=w.name;panel.querySelector('p').textContent=w.description;panel.querySelector('small').textContent=weaponSummary(w);});
 document.querySelector('#ws-chassis-name').textContent=cfg.chassis.toUpperCase();document.querySelector('#ws-choice-heading').textContent=wsTab==='chassis'?'CHASSIS':SLOT_NAMES[wsSlot].toUpperCase();document.querySelector('#ws-equipped').textContent=wsTab==='chassis'?'Equipped: '+loadout.chassis:'Equipped: '+BY_ID[loadout.slots[wsSlot]].name;
 document.querySelector('#ws-filters').hidden=wsTab==='chassis'||slotKind(wsSlot)==='pod';document.querySelectorAll('[data-family]').forEach(b=>b.classList.toggle('active',b.dataset.family===wsFilter));
 document.querySelector('#ws-description').textContent=choice.description;document.querySelector('#ws-detail').textContent=wsTab==='chassis'?`Speed ${choice.speed} · Turn ${choice.turn} · ${wsIndex+1} / ${options.length} chassis`:`${wsIndex+1} / ${options.length} · ${choice.cells?choice.cells+' cells · '+choice.reload+'s cell reload':choice.charge?'Charge '+choice.charge+'s':choice.range?'Range '+choice.range:''}${choice.energy?' · Uses power':''}`;
 document.querySelector('#ws-save-state').textContent=wsMessage||'Tap a card to equip it';renderCarousel();drawWorkshop();
}
function updateCarouselAudio(dt){const key=wsTab+':'+wsSlot+':'+wsFilter;
 if(key!==carouselSoundKey){carouselSoundKey=key;carouselSoundPosition=carouselPosition;GameAudio.carousel(0);return;}
 const speed=dt>0?Math.abs(carouselPosition-carouselSoundPosition)/dt:0;carouselSoundPosition=carouselPosition;
 GameAudio.carousel((swipe||carouselMoving)&&speed>.015?Math.min(1,speed/3):0);
}
function animateWorkshop(dt){
 updateMonitorGlitch(dt);updateBeamRefresh(dt);GameAudio.workshop(dt);
 if(swipe||!carouselMoving){updateCarouselAudio(dt);return;}const pull=(carouselTarget-carouselPosition)*64;carouselVelocity=(carouselVelocity+pull*dt)*Math.exp(-13*dt);carouselPosition+=carouselVelocity*dt;
 const end=wsOptions().length-1;if(carouselPosition<=0){carouselPosition=0;if(carouselVelocity<0)carouselVelocity=0;}if(carouselPosition>=end){carouselPosition=end;if(carouselVelocity>0)carouselVelocity=0;}
 if(Math.abs(carouselTarget-carouselPosition)<.002&&Math.abs(carouselVelocity)<.02){carouselPosition=carouselTarget;carouselVelocity=0;carouselMoving=false;}renderCarousel();updateCarouselAudio(dt);
}
function drawWorkshop(){
 if(!workshopOpen||!spritesReady)return;const box=wsCanvas.getBoundingClientRect(),W=Math.max(1,box.width),H=Math.max(1,box.height),d=Math.min(devicePixelRatio||1,2);if(wsCanvas.width!==Math.round(W*d)||wsCanvas.height!==Math.round(H*d)){wsCanvas.width=Math.round(W*d);wsCanvas.height=Math.round(H*d);}const g=wsContext;g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,W,H);const cfg=previewLoadout(),cls=CHASSIS.find(c=>c.id===cfg.chassis),fit=Math.max(.1,Math.min(W*.52/(124*MECH_SCALE),(H-38)/(116*MECH_SCALE)));const cy=H/2+10;
 g.save();g.strokeStyle='#71fba044';g.lineWidth=.7;g.setLineDash([2,5]);g.beginPath();g.ellipse(W/2,cy,W*.245,Math.max(10,H*.40),0,0,Math.PI*2);g.stroke();g.setLineDash([]);g.strokeStyle='#9affbd99';g.lineWidth=1;
 for(const side of [-1,1])for(const lower of [false,true]){const outer=W/2+side*W*.255,elbow=W/2+side*W*.205,inner=W/2+side*W*.155,y=lower?H*.81:H*.25,tipY=lower?cy+H*.25:cy-H*.13;g.beginPath();g.moveTo(outer,y);g.lineTo(elbow,y);g.lineTo(inner,tipY);g.stroke();g.fillStyle='#baffce';g.beginPath();g.arc(outer,y,1.7,0,Math.PI*2);g.fill();}g.restore();g.save();g.translate(W/2,cy);g.scale(fit*MECH_SCALE,fit*MECH_SCALE);drawConfiguredMech(g,{r:cls.r,slots:cfg.slots,wire:true,selected:wsTab==='weapons'?wsSlot:-1,pulse:!((typeof matchMedia==='function')&&matchMedia('(prefers-reduced-motion: reduce)').matches),preview:true,a:-Math.PI/2,t:-Math.PI/2});g.restore();
 drawMonitorGlitch(g,W,H,d);
}

for(const b of document.querySelectorAll('[data-ws-tab]'))b.onclick=()=>chooseTab(b.dataset.wsTab);
for(const panel of document.querySelectorAll('[data-info-slot]')){panel.onclick=()=>chooseSlot(+panel.dataset.infoSlot);panel.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();panel.onclick();}});}
for(const b of document.querySelectorAll('[data-family]'))b.onclick=()=>{wsFilter=b.dataset.family;const a=wsOptions(),equipped=a.findIndex(w=>w.id===loadout.slots[wsSlot]);wsIndex=equipped>=0?equipped:0;wsMessage='';settleOn(wsIndex,true);};
document.querySelector('#ws-prev').onclick=()=>moveCarousel(-1);document.querySelector('#ws-next').onclick=()=>moveCarousel(1);document.querySelector('#ws-test').onclick=testLoadout;document.querySelector('#workshop-open').onclick=enterWorkshop;
for(const card of cards)card.onclick=()=>{if(Date.now()<suppressClickUntil||card.hidden)return;equipCard(+card.dataset.index);};

carousel.addEventListener('pointerdown',e=>{if(e.target.closest('.ws-arrow'))return;const card=e.target.closest('.ws-card'),now=e.timeStamp||performance.now();swipe={id:e.pointerId,startX:e.clientX,startY:e.clientY,startPosition:carouselPosition,lastX:e.clientX,lastTime:now,velocity:0,card,index:card?+card.dataset.index:null,moved:false};carouselMoving=false;carouselVelocity=0;carousel.setPointerCapture(e.pointerId);carousel.classList.add('dragging');});
carousel.addEventListener('pointermove',e=>{if(!swipe||swipe.id!==e.pointerId)return;e.preventDefault();const now=e.timeStamp||performance.now(),dx=e.clientX-swipe.startX,dt=Math.max(1,now-swipe.lastTime);swipe.velocity=Math.max(-3,Math.min(3,(e.clientX-swipe.lastX)/dt));swipe.lastX=e.clientX;swipe.lastTime=now;swipe.moved=swipe.moved||Math.abs(dx)>7||Math.abs(e.clientY-swipe.startY)>7;carouselPosition=Math.max(0,Math.min(wsOptions().length-1,swipe.startPosition-dx/carouselPitch()));wsIndex=clampIndex(Math.round(carouselPosition));carouselTarget=wsIndex;wsMessage='';updateWorkshop();});
function endSwipe(e,cancelled=false){if(!swipe||swipe.id!==e.pointerId)return;const drag=swipe;swipe=null;carousel.classList.remove('dragging');if(!cancelled&&!drag.moved&&drag.card&&drag.index!==null){suppressClickUntil=Date.now()+350;equipCard(drag.index);return;}const projected=carouselPosition-drag.velocity*1000/carouselPitch()*.16;wsIndex=clampIndex(Math.round(projected));carouselTarget=wsIndex;carouselVelocity=-drag.velocity*1000/carouselPitch();carouselMoving=true;suppressClickUntil=Date.now()+350;updateWorkshop();}
carousel.addEventListener('pointerup',e=>endSwipe(e));carousel.addEventListener('pointercancel',e=>endSwipe(e,true));carousel.addEventListener('lostpointercapture',e=>{if(swipe&&swipe.id===e.pointerId)endSwipe(e,true);});carousel.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();moveCarousel(e.key==='ArrowLeft'?-1:1);}});
window.addEventListener('resize',()=>{renderCarousel();drawWorkshop();});Promise.all([componentLoading,arsenalReady]).then(()=>{resetArsenal();cards.forEach(b=>delete b.dataset.item);updateWorkshop();}).catch(()=>{document.querySelector('#ws-save-state').textContent='Some artwork could not load. Reconnect and refresh.';});$('#class').value=loadout.chassis;resetArsenal();enterWorkshop();
