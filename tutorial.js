'use strict';
window.Tutorial=(()=>{
 if(typeof document.body.insertAdjacentHTML!=='function')return {active:false,start(){}};
 document.body.insertAdjacentHTML('beforeend',`<aside id="tutorial-guide" hidden aria-label="Dave tutorial guidance"><b id="tutorial-heading"></b><p id="tutorial-line"></p><small id="tutorial-progress"></small><button id="tutorial-restart" hidden>RESTART LESSON</button><button id="tutorial-finish" hidden>RETURN TO WORKSHOP</button></aside>`);
 const guide=$('#tutorial-guide'),points=[[600,1320],[450,1170],[450,930],[240,930],[240,450],[600,400]];let active=false,step=0,point=0,fired=new Set(),equipped=new Set(),chassis=false,elapsed=0,blockedShots=0,emitter=0,shotCount=0,startTurn=0,heatSlot=0,practiceSlot=null,waitForCooldown=false;
 const steps=['power','chassis','fit0','fit3','fit1','fit2','deploy','movement','turret','weapons','lock','heat','cool','shield','recharge','repair','eject','complete'];
 function current(){return steps[step];}
 function clearFocus(){document.querySelectorAll('.tutorial-focus').forEach(e=>e.classList.remove('tutorial-focus'));}
 function show(){if(!active)return;guide.hidden=false;clearFocus();let text='',focus=null,progress='';const key=current();
 const lines={
 power:'First things first. Hit the power button above you. Let’s wake her up.',
 chassis:'That’s her awake. Now choose your chassis. Recon’s quick, Assault’s balanced, and War Tank’s built to take punishment.',
 fit0:'Good. Now let’s put some weapons on her. Select your left arm panel, then tap a weapon to fit it.',
 fit3:'That’s fitted. Same again for the right arm.',
 fit1:'Shoulder mounts next. Select the left shoulder panel, then choose a missile or rocket pod.',
 fit2:'Fit the other side. Those pods reload between volleys, so make your shots count.',
 deploy:'She’s ready. Take her outside. Let’s see if you can walk.',
 movement:'Left stick moves the mech. Walk over to the green marker.',
 turret:'Now turn the turret using the controls on your right.',
 weapons:'Weapons next. Upper buttons fire your arm weapons. Lower buttons fire your shoulder pods. Try all four on those training mechs.',
 lock:'For guided missiles, keep your aim on a training mech until the lock turns green. Then fire.',
 heat:'Now hold an arm weapon down. Watch the heat build in its button.',
 cool:'Too hot. Release it and let it cool.',
 shield:'Incoming fire. Hold your shield button.',
 recharge:'Release it. Give it time to recharge.',
 repair:'You’ve taken some damage. Stop moving and hold the spanner button to repair.',
 eject:'Last lesson. Hold eject.',
 complete:'You’re ready. Let’s get you into a real fight.'};text=lines[key];
 if(key==='power')focus='#cockpit-power';if(key==='chassis')focus='[data-ws-tab="chassis"]';if(key.startsWith('fit'))focus='[data-info-slot="'+key.slice(3)+'"]';if(key==='weapons')focus='[data-w="'+([0,3,1,2].find(i=>!fired.has(i))??0)+'"]';if(key==='deploy')focus='#ws-test';if(key==='movement')focus='#move';if(['lock','turret'].includes(key))focus='#cw';if(['heat','cool'].includes(key))focus='[data-w="'+heatSlot+'"]';if(['shield','recharge'].includes(key))focus='#shield';if(key==='repair')focus='#repair';if(key==='eject')focus='#eject';if(focus)$(focus)?.classList.add('tutorial-focus');
 if(key==='movement')progress='Marker '+(point+1)+' / '+points.length;if(key==='weapons')progress=fired.size+' / 4 hardpoints fired';if(key==='heat'||key==='cool')progress='Heat '+Math.round(slotHeat[heatSlot])+'%';if(key==='shield')progress=blockedShots+' / 3 hits blocked · Power '+Math.round(mech.energy)+'%';if(key==='recharge')progress='Power '+Math.round(mech.energy)+'%';if(key==='repair')progress='Armour '+Math.round(mech.hp)+'%';
 if(ejected&&key!=='eject'&&key!=='complete')text='You ejected early. Restart the arena lesson to continue.';$('#workshop-open').disabled=!workshopOpen;$('#tutorial-heading').textContent='DAVE / TRAINING '+Math.min(step+1,steps.length)+' / '+steps.length;$('#tutorial-line').textContent=text;$('#tutorial-progress').textContent=progress;$('#tutorial-finish').hidden=key!=='complete';$('#tutorial-restart').hidden=!(ejected&&key!=='eject'&&key!=='complete');
 }
 function next(){step=Math.min(step+1,steps.length-1);elapsed=0;shotCount=0;waitForCooldown=false;const k=current();if(k==='turret')startTurn=0;if(k==='heat'){heatSlot=[0,3].find(i=>['Ballistic','Energy'].includes(BY_ID[loadout.slots[i]].family));if(heatSlot===undefined){heatSlot=0;practiceSlot=loadout.slots[0];loadout.slots[0]='machine';resetArsenal();}slotHeat[heatSlot]=0;overheated[heatSlot]=false;mech.energy=100;}if(k==='shield'){if(typeof armTrainingMechs==='function')armTrainingMechs();mech.energy=100;shieldLocked=false;shieldRechargeDelay=0;blockedShots=0;emitter=0;mech.hp=Math.max(mech.hp,75);}if(k==='repair')mech.hp=55;if(k==='eject')clearInput();if(k==='complete'){try{localStorage.setItem('mech-tutorial-complete','true');}catch{}}show();}
 function start(){active=true;step=point=0;fired.clear();equipped.clear();chassis=false;elapsed=0;practiceSlot=null;guide.hidden=false;show();}
 function fit(tab,slot){if(!active)return;if(tab==='chassis')chassis=true;else if(loadout.slots[slot]!=='empty')equipped.add(slot);}
 function shot(i){if(!active||workshopOpen)return;if(BY_ID[loadout.slots[i]].kind==='pod')shotCount++;if(current()==='weapons')fired.add(i);if(current()==='lock'&&BY_ID[loadout.slots[i]].guided&&lockStates[i].state==='locked')shotCount++;}
 function tick(dt,previous){if(!active||document.hidden||window.StoryFlow?.active)return;elapsed+=dt;const key=current();if(workshopOpen){if(key==='power'&&document.body.classList.contains('cockpit-online'))next();else if(key==='chassis'&&chassis)next();else if(key.startsWith('fit')&&equipped.has(+key.slice(3)))next();show();return;}
 if(ejected&&key!=='eject'&&key!=='complete'){show();return;}
 if(key==='movement'){if(Math.hypot(mech.x-points[point][0],mech.y-points[point][1])<75){point++;if(point===points.length)next();}}
 else if(key==='turret'){startTurn+=Math.abs(angleDiff(mech.t,previous?.t??mech.t));if(startTurn>=Math.PI/2)next();}
 else if(key==='weapons'&&fired.size===4)next();
 else if(key==='lock'){const guided=[1,2].some(i=>BY_ID[loadout.slots[i]].guided);if(!guided||shotCount>0)next();}
 else if(key==='heat'&&overheated[heatSlot])next();
 else if(key==='cool'&&!overheated[heatSlot]&&slotHeat[heatSlot]<35&&!held[heatSlot]&&!keys[String(heatSlot+1)]){if(practiceSlot){loadout.slots[0]=practiceSlot;practiceSlot=null;resetArsenal();}next();}
 else if(key==='shield'){blockedShots=typeof trainingBlockedHits==='number'?trainingBlockedHits:0;if(blockedShots>=3)next();}
 else if(key==='recharge'&&!shieldActive&&mech.energy>=80)next();
 else if(key==='repair'&&mech.hp>=90)next();
 else if(key==='eject'&&ejected&&capsule?.safe)next();show();}
 function draw(g){if(!active||workshopOpen||current()!=='movement')return;const [x,y]=points[point];g.save();g.strokeStyle='#a9ff9b';g.fillStyle='#7aff8c25';g.lineWidth=3;g.beginPath();g.arc(x,y,46+Math.sin(clock*3)*3,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#d0ffc0';g.font='18px monospace';g.fillText(String(point+1),x-5,y+6);g.restore();}
 const equipOriginal=equipCard;equipCard=function(index){const tab=wsTab,slot=wsSlot;equipOriginal(index);fit(tab,slot);};
 const fireOriginal=arsenalFire;arsenalFire=function(i){const before=cool[i];fireOriginal(i);if(cool[i]>before)shot(i);};
 const deployOriginal=testLoadout;testLoadout=function(){if(active&&workshopOpen&&current()!=='deploy'){note('Finish Dave’s workshop instructions first.');return;}if(active&&loadout.slots.some(id=>id==='empty')){note('Fit a weapon to every hardpoint for training.');return;}deployOriginal();if(active&&current()==='deploy')next();};$('#ws-test').onclick=testLoadout;
 $('#tutorial-restart').onclick=()=>{reset();step=7;point=0;fired.clear();show();};
 $('#tutorial-finish').onclick=()=>{active=false;guide.hidden=true;$('#workshop-open').disabled=false;clearFocus();if(practiceSlot){loadout.slots[0]=practiceSlot;practiceSlot=null;}reset();enterWorkshop();};
 return {start,update:tick,draw,shot,fit,get active(){return active;},get step(){return current();},get blockedShots(){return blockedShots;}};
})();

if(window.Tutorial.active!==undefined&&typeof document.body.insertAdjacentHTML==='function'){
 const updateBeforeTutorial=update;update=function(dt){const previous={t:mech.t};updateBeforeTutorial(dt);window.Tutorial.update(dt,previous);};
 const workshopBeforeTutorial=animateWorkshop;animateWorkshop=function(dt){workshopBeforeTutorial(dt);window.Tutorial.update(dt);};
}
