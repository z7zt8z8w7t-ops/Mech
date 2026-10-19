'use strict';
let trainingRounds=[],trainingFireClock=0,trainingBlockedHits=0,trainingMuzzleSide=0;
function resetTrainingMechs(){trainingRounds=[];trainingFireClock=0;trainingBlockedHits=0;trainingMuzzleSide=0;}
function enemyMount(t,i=0){const r=SLOT_RECTS[i],scale=17/21*MECH_SCALE,forward=-r[1]*scale,side=(r[0]+r[2]*(i===3?.52:.48))*scale,a=t.t??Math.PI/2;return {x:t.x+Math.cos(a)*forward-Math.sin(a)*side,y:t.y+Math.sin(a)*forward+Math.cos(a)*side,a};}
function trainingEnemyBlocked(x,y,r){return targets.some(t=>t.training&&t.hp>0&&footprintsOverlap(playerFootprint(x,y),enemyFootprint(t)));}
function armTrainingMechs(){trainingRounds=[];trainingFireClock=0;trainingBlockedHits=0;for(const t of targets)if(t.training){t.hp=100;t.emp=0;t.systemsDisabled=false;t.burn=0;}}
function trainingMechsFiring(){return !window.Tutorial?.active||window.Tutorial.step==='shield';}
function updateTrainingMechs(dt){if(workshopOpen||document.hidden)return;
 for(const t of targets)if(t.training&&t.hp>0&&!t.emp&&!t.systemsDisabled){const old=t.t;t.t=turn(t.t??Math.PI/2,Math.atan2(mech.y-t.y,mech.x-t.x),1.2*dt);if(footprintsOverlap(playerFootprint(),enemyFootprint(t)))t.t=old;}
 if(ejected){trainingRounds=[];return;}
 const firing=trainingMechsFiring();trainingFireClock-=dt;
 if(firing&&trainingFireClock<=0){const candidates=targets.filter(t=>t.training&&t.hp>0&&!t.emp&&!t.systemsDisabled&&Math.abs(angleDiff(t.t,Math.atan2(mech.y-t.y,mech.x-t.x)))<.2).sort((a,b)=>Math.hypot(a.x-mech.x,a.y-mech.y)-Math.hypot(b.x-mech.x,b.y-mech.y));
  for(const t of candidates){const pos=enemyMount(t,trainingMuzzleSide++%2?3:0),a=Math.atan2(mech.y-pos.y,mech.x-pos.x),range=Math.hypot(mech.x-pos.x,mech.y-pos.y);if(rayLength(pos.x,pos.y,a,range)<range-6)continue;trainingRounds.push({x:pos.x,y:pos.y,a,life:3,speed:440,source:t});weaponFx.push({type:'muzzle',x:pos.x,y:pos.y,a,colour:'#ffd27a',age:0,life:.12});GameAudio.trainingFire(pos.x,pos.y);trainingFireClock=.55;break;}
 }
 if(!firing){trainingRounds=[];return;}
 for(const p of trainingRounds){p.life-=dt;const travel=p.speed*dt,n=Math.max(1,Math.ceil(travel/5));for(let k=0;k<n&&p.life>0;k++){p.x+=Math.cos(p.a)*travel/n;p.y+=Math.sin(p.a)*travel/n;if(blocked(p.x,p.y,0)){p.life=0;break;}const dist=Math.hypot(p.x-mech.x,p.y-mech.y),r=stats[$('#class').value].r;
  if(shieldActive&&dist<(r+34)*MECH_SCALE){trainingBlockedHits++;p.life=0;burst(p.x,p.y,'#8be8ff',7);}else if(playerFootprint().some(poly=>pointInHull(p.x,p.y,poly))){mech.hp=Math.max(window.Tutorial?.active?55:0,mech.hp-4);p.life=0;burst(p.x,p.y,'#ffb56f',5);}}
 }trainingRounds=trainingRounds.filter(p=>p.life>0);
}
function drawTrainingMechs(g){for(const t of targets){g.save();g.translate(t.x,t.y);if(t.training){g.scale(MECH_SCALE,MECH_SCALE);if(t.hp<=0)g.globalAlpha=.25;drawConfiguredMech(g,{r:17,a:Math.PI/2,t:t.t??Math.PI/2,step:0,slots:['machine','mini','mini','machine'],hp:t.hp,empty:t.hp<=0,preview:true});g.rotate((t.t??Math.PI/2)+Math.PI/2);g.fillStyle='#ed9d49';g.fillRect(-27,-15,7,3);g.fillRect(20,-15,7,3);g.rotate(-((t.t??Math.PI/2)+Math.PI/2));g.scale(1/MECH_SCALE,1/MECH_SCALE);g.globalAlpha=1;g.fillStyle=t.emp>0?'#94dfff':'#f1b56b';g.font='10px monospace';g.textAlign='center';g.fillText(t.emp>0?'SYSTEMS OFFLINE':'TRAINING MECH',0,83);g.fillStyle='#202523';g.fillRect(-36,-85,72,5);g.fillStyle='#e6a66b';g.fillRect(-36,-85,72*Math.max(0,t.hp)/100,5);}else{g.strokeStyle='#d99162';g.beginPath();g.arc(0,0,t.r||24,0,Math.PI*2);g.stroke();}g.restore();}
 for(const p of trainingRounds){g.save();g.translate(p.x,p.y);g.rotate(p.a);g.fillStyle='#ffd49a';g.shadowColor='#ffae63';g.shadowBlur=6;g.fillRect(-8,-1.5,16,3);g.restore();}
}
const resetBeforeTraining=reset;reset=function(){resetBeforeTraining();resetTrainingMechs();};
const updateBeforeTraining=update;update=function(dt){updateBeforeTraining(dt);updateTrainingMechs(dt);};
