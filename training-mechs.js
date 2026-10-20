'use strict';
// Shared enemy simulation. Every phase allocates at most one action to each thumb.
let trainingRounds=[],trainingFireClock=0,trainingBlockedHits=0,trainingMuzzleSide=0;
const roverImage=new Image();let roverReady=false;roverImage.onload=()=>{roverReady=true;};roverImage.src='./assets/attack-rover.png';
const ROVER_TURRET=[[.46,0],[.54,0],[.56,.29],[.65,.32],[.68,.45],[.68,.56],[.61,.61],[.4,.62],[.31,.56],[.29,.42],[.35,.33],[.44,.29]];
function resetTrainingMechs(){trainingRounds=[];trainingFireClock=0;trainingBlockedHits=0;trainingMuzzleSide=0;for(const [i,t] of targets.entries()){t.a=t.a??Math.PI/2;t.t=t.t??Math.PI/2;t.step=0;t.homeX=t.x;t.homeY=t.y;t.phaseIndex=i%4;t.phaseTime=.4+i*.2;t.inputs={left:'move',right:'aim'};t.fireCooldown=[0,0,0,0];t.cells=Array.from({length:4},()=>Array(6).fill(0));t.lock=0;t.path=[];t.repath=0;}}
function enemyMount(t,i=0){if(t.type==='rover'){return {x:t.x+Math.cos(t.t)*39,y:t.y+Math.sin(t.t)*39,a:t.t};}const r=SLOT_RECTS[i],scale=17/21*MECH_SCALE,forward=-r[1]*scale,side=(r[0]+r[2]*(i===3?.52:.48))*scale,a=t.t??Math.PI/2;return {x:t.x+Math.cos(a)*forward-Math.sin(a)*side,y:t.y+Math.sin(a)*forward+Math.cos(a)*side,a};}
function trainingEnemyBlocked(x,y,r){return targets.some(t=>t.hp>0&&footprintsOverlap(playerFootprint(x,y),enemyFootprint(t)));}
function armTrainingMechs(){trainingRounds=[];trainingFireClock=0;trainingBlockedHits=0;for(const t of targets){t.hp=t.maxHp||100;t.emp=0;t.systemsDisabled=false;t.burn=0;t.phaseTime=0;t.lock=0;}}
function trainingMechsFiring(){return ARENA.id==='breakers'||!window.Tutorial?.active||window.Tutorial.step==='shield';}
function enemyBlocked(t,x=t.x,y=t.y,includeUnits=true){const hull=enemyFootprint({...t,x,y});if(hull.some(p=>p.some(v=>v.x<6||v.y<6||v.x>world.w-6||v.y>world.h-6)))return true;
 if(blocks.some(b=>hull.some(p=>hullsOverlap(p,[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]))))return true;
 if(includeUnits){if(!ejected&&footprintsOverlap(hull,playerFootprint()))return true;if(targets.some(other=>other!==t&&other.hp>0&&Math.hypot(other.x-x,other.y-y)<180&&footprintsOverlap(hull,enemyFootprint(other))))return true;}return false;}
function routeEnemy(t,goalX,goalY){const size=76,cols=Math.ceil(world.w/size),rows=Math.ceil(world.h/size),pad=t.type==='rover'?47:62;
 const free=(x,y)=>x>=0&&y>=0&&x<cols&&y<rows&&!blocked((x+.5)*size,(y+.5)*size,pad),key=(x,y)=>y*cols+x;
 const sx=Math.max(0,Math.min(cols-1,Math.floor(t.x/size))),sy=Math.max(0,Math.min(rows-1,Math.floor(t.y/size)));let gx=Math.floor(goalX/size),gy=Math.floor(goalY/size);
 if(!free(gx,gy)){let best=null;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(free(x,y)){const d=Math.hypot((x+.5)*size-goalX,(y+.5)*size-goalY);if(!best||d<best.d)best={x,y,d};}if(!best)return [];gx=best.x;gy=best.y;}
 const start=key(sx,sy),end=key(gx,gy),open=[{x:sx,y:sy,cost:0,score:0}],cost=new Map([[start,0]]),parent=new Map();let found=false;
 for(let n=0;open.length&&n<1000;n++){open.sort((a,b)=>a.score-b.score);const p=open.shift(),pk=key(p.x,p.y);if(pk===end){found=true;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(!free(x,y))continue;const c=p.cost+1;if(cost.has(k)&&cost.get(k)<=c)continue;cost.set(k,c);parent.set(k,pk);open.push({x,y,cost:c,score:c+Math.abs(gx-x)+Math.abs(gy-y)});}}
 if(!found)return [];const path=[];let k=end;while(k!==start&&parent.has(k)){path.unshift({x:(k%cols+.5)*size,y:(Math.floor(k/cols)+.5)*size});k=parent.get(k);}return path;
}
function enemyFire(t,i){if(t.fireCooldown[i]>0||t.hp<=0||t.emp>0||t.systemsDisabled)return;const pod=t.type!=='rover'&&(i===1||i===2);if(pod&&t.lock<1.1)return;
 const pos=enemyMount(t,i),distance=Math.hypot(mech.x-pos.x,mech.y-pos.y);if(distance>900||Math.abs(angleDiff(t.t,Math.atan2(mech.y-pos.y,mech.x-pos.x)))>.13||rayLength(pos.x,pos.y,t.t,distance)<distance-25)return;
 if(pod){const ready=t.cells[i].findIndex(c=>c<=0);if(ready<0)return;t.cells[i][ready]=7;t.fireCooldown[i]=1.1;}else t.fireCooldown[i]=t.type==='rover'?.34:.3;
 trainingRounds.push({x:pos.x,y:pos.y,a:t.t+(Math.random()-.5)*.065,life:4,speed:pod?235:440,source:t,age:0,pod,damage:pod?9:4});weaponFx.push({type:pod?'launch-flare':'muzzle',x:pos.x,y:pos.y,a:t.t,age:0,life:pod?.25:.12});GameAudio.trainingFire(pos.x,pos.y);
}
function updateTrainingMechs(dt){if(workshopOpen||document.hidden||window.ArenaBattle?.result)return;if(ejected){trainingRounds=[];return;}
 const tutorial=ARENA.id!=='breakers',firing=trainingMechsFiring();
 for(const [index,t] of targets.entries()){
  if(t.hp<=0||t.emp>0||t.systemsDisabled){t.inputs={left:'idle',right:'idle'};continue;}t.fireCooldown??=[0,0,0,0];t.cells??=Array.from({length:4},()=>Array(6).fill(0));t.phaseTime=(t.phaseTime||0)-dt;
  if(t.phaseTime<=0){t.phaseIndex=((t.phaseIndex||0)+1)%4;t.phaseTime=t.phaseIndex%2?.75+Math.random()*.35:1+Math.random()*.35;}
  if(!firing)t.phaseIndex=0;
  const phase=t.phaseIndex||0,rover=t.type==='rover',left=phase===1||phase===3&&!rover?'fire-left':'move',right=phase===2||phase===3?'fire-right':'aim';t.inputs={left,right};
  // Rover has only one fire control; both fire phases use the same single cannon.
  if(rover&&phase!==0)t.inputs={left:phase===1?'idle':'move',right:phase===1?'aim':'fire'};
  const aim=t.inputs.right==='aim',move=t.inputs.left==='move';
  if(aim){const old=t.t;t.t=turn(t.t,Math.atan2(mech.y-t.y,mech.x-t.x),(rover?1.7:1.25)*dt);if(enemyBlocked(t,t.x,t.y))t.t=old;}
  const facing=Math.abs(angleDiff(t.t,Math.atan2(mech.y-t.y,mech.x-t.x)))<.12,visible=rayLength(t.x,t.y,t.t,Math.hypot(mech.x-t.x,mech.y-t.y))>=Math.hypot(mech.x-t.x,mech.y-t.y)-30;t.lock=facing&&visible?Math.min(1.5,(t.lock||0)+dt):0;
  if(move){let goal;if(tutorial){goal={x:t.homeX+Math.sin(clock*.35+index)*25,y:t.homeY+Math.cos(clock*.35+index)*16};}
   else{const dist=Math.hypot(mech.x-t.x,mech.y-t.y),orbit=Math.atan2(t.y-mech.y,t.x-mech.x)+.65*(index%2?1:-1),wanted=rover?260:370,goalX=mech.x+Math.cos(orbit)*Math.min(wanted,dist),goalY=mech.y+Math.sin(orbit)*Math.min(wanted,dist);t.repath=(t.repath||0)-dt;if(t.repath<=0){t.path=routeEnemy(t,goalX,goalY);t.repath=1.1;}while(t.path?.length&&Math.hypot(t.path[0].x-t.x,t.path[0].y-t.y)<25)t.path.shift();goal=t.path?.[0]||{x:goalX,y:goalY};}
   const distance=Math.hypot(goal.x-t.x,goal.y-t.y);if(distance>4){const desired=Math.atan2(goal.y-t.y,goal.x-t.x),old=t.a;t.a=turn(t.a,desired,1.7*dt);if(enemyBlocked(t))t.a=old;const speed=(tutorial?14:rover?91:67)*dt,step=Math.min(speed,distance),dx=Math.cos(t.a)*step,dy=Math.sin(t.a)*step;let moved=0;
    if(!enemyBlocked(t,t.x+dx,t.y)){t.x+=dx;moved+=Math.abs(dx);}if(!enemyBlocked(t,t.x,t.y+dy)){t.y+=dy;moved+=Math.abs(dy);}t.step=(t.step||0)+moved*.055;if(moved<.1&&!tutorial){t.repath=0;const old=t.a;t.a+=.35*dt;if(enemyBlocked(t))t.a=old;}}
  }
  for(let i=0;i<4;i++){t.fireCooldown[i]=Math.max(0,t.fireCooldown[i]-dt);t.cells[i]=t.cells[i].map(c=>Math.max(0,c-dt));}
  if(firing){if(rover){if(t.inputs.right==='fire')enemyFire(t,0);}else{if(t.inputs.left==='fire-left')enemyFire(t,index%2&&t.lock>=1.1?1:0);if(t.inputs.right==='fire-right')enemyFire(t,index%2&&t.lock>=1.1?2:3);}}
 }
 for(const p of trainingRounds){p.life-=dt;p.age+=dt;if(p.pod&&p.age>.9)p.a=turn(p.a,Math.atan2(mech.y-p.y,mech.x-p.x),.8*dt);const travel=p.speed*dt*(p.pod?Math.min(1,.12+p.age):1),n=Math.max(1,Math.ceil(travel/5));
  for(let k=0;k<n&&p.life>0;k++){p.x+=Math.cos(p.a)*travel/n;p.y+=Math.sin(p.a)*travel/n;if(blocked(p.x,p.y,0)){p.life=0;burst(p.x,p.y,'#ffb36a',5);break;}const dist=Math.hypot(p.x-mech.x,p.y-mech.y),r=stats[$('#class').value].r;
   if(shieldActive&&dist<(r+34)*MECH_SCALE){trainingBlockedHits++;p.life=0;burst(p.x,p.y,'#8be8ff',7);}
   else if(playerFootprint().some(poly=>pointInHull(p.x,p.y,poly))){mech.hp=Math.max(tutorial&&window.Tutorial?.active?55:0,mech.hp-p.damage);p.life=0;burst(p.x,p.y,'#ffb56f',p.pod?15:5);}
  }
 }trainingRounds=trainingRounds.filter(p=>p.life>0);
}
function drawRover(g,t){const w=76,h=88;g.save();g.rotate(t.a+Math.PI/2);g.fillStyle='#29322d';g.beginPath();g.ellipse(0,0,w*.24,h*.23,0,0,Math.PI*2);g.fill();
 if(roverReady){g.save();g.beginPath();g.rect(-w/2,-h/2,w,h);g.moveTo((ROVER_TURRET[0][0]-.5)*w,(ROVER_TURRET[0][1]-.5)*h);for(const [x,y]of ROVER_TURRET.slice(1))g.lineTo((x-.5)*w,(y-.5)*h);g.closePath();g.clip('evenodd');g.drawImage(roverImage,-w/2,-h/2,w,h);g.restore();}else{g.fillStyle='#778476';g.fillRect(-w*.4,-h*.3,w*.8,h*.75);}g.restore();
 g.save();g.rotate(t.t+Math.PI/2);if(roverReady){g.beginPath();for(const [i,[x,y]]of ROVER_TURRET.entries())i?g.lineTo((x-.5)*w,(y-.5)*h):g.moveTo((x-.5)*w,(y-.5)*h);g.closePath();g.clip();g.drawImage(roverImage,-w/2,-h/2,w,h);}else{g.fillStyle='#b1bbb1';g.fillRect(-3,-h*.5,6,h*.5);}g.restore();}
function drawTrainingMechs(g){for(const t of targets){g.save();g.translate(t.x,t.y);if(t.hp<=0)g.globalAlpha=.3;
 if(t.type==='rover')drawRover(g,t);else{g.save();g.scale(MECH_SCALE,MECH_SCALE);drawConfiguredMech(g,{r:17,a:t.a??Math.PI/2,t:t.t??Math.PI/2,step:t.step||0,slots:['machine','mini','mini','machine'],hp:t.hp,empty:t.hp<=0,preview:true});g.restore();}
 g.globalAlpha=1;g.fillStyle=t.emp>0?'#94dfff':'#e9ae64';g.font='9px monospace';g.textAlign='center';g.fillText(t.emp>0?'SYSTEMS OFFLINE':t.type==='rover'?'ATTACK ROVER':ARENA.id==='breakers'?'HOSTILE MECH':'TRAINING MECH',0,t.type==='rover'?57:83);const hp=Math.max(0,Math.min(1,t.hp/(t.maxHp||100)));g.fillStyle='#15211b';g.fillRect(-30,-70,60,4);g.fillStyle='#dc975b';g.fillRect(-30,-70,60*hp,4);g.restore();}
 for(const p of trainingRounds){g.save();g.translate(p.x,p.y-(p.pod?Math.sin(Math.min(1,p.age/.9)*Math.PI)*30:0));g.rotate(p.a);g.fillStyle=p.pod?'#dfd3a6':'#ffd49a';g.shadowColor='#ffae63';g.shadowBlur=6;g.fillRect(-8,p.pod?-3:-1.5,16,p.pod?6:3);if(p.pod){g.fillStyle='#ff9f32';g.fillRect(-15,-2,8,4);}g.restore();}
}
const resetBeforeTraining=reset;reset=function(){resetBeforeTraining();resetTrainingMechs();};
const updateBeforeTraining=update;update=function(dt){updateBeforeTraining(dt);updateTrainingMechs(dt);};
