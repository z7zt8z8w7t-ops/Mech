'use strict';
// All samples are local and cached. Audio is unlocked by a real user gesture.
const GameAudio=(()=>{
 const approvedSamples=['page-turn','chassis-explosion','escape-rocket','breach-approved', 'scatter-approved', 'arc-approved', 'lance-charge', 'lance-fire', 'mini-launch', 'rocket-launch', 'heavy-launch', 'emp-launch', 'emp-impact', 'cluster-whistle', 'heavy-impact', 'rocket-impact', 'cluster-burst', 'cluster-impact'];
 const ids=[...approvedSamples,'machine','autocannon','rail','siege','gatling','pulse','beam','plasma','accelerator','charge','launch','explosion','cockpit-power','step-left','step-right','turret-start','turret-turn','turret-brake','ui-click','ui-tick','ui-settle','workshop-bed'];
 const buffers={},loops=new Map(),voices=new Set(),lastFire=[-99,-99,-99,-99];
 let roomVoice=null,lastUi=-99,roomPowered=false;
 let ac=null,master=null,effects=null,systems=null,loading=null,noise=null,shieldWas=false,turretWas=false;
 let weaponFast=null,weaponHeavy=null,machineRoom=null;const reverbs=[];
 const heavySounds=new Set(['autocannon','scatter','breach','rail','siege','plasma','lance','accelerator','launch','explosion']);
 function makeWeaponBus(seconds,wetLevel,boost=true){
  const input=ac.createGain(),subCut=ac.createBiquadFilter(),bass=ac.createBiquadFilter(),weight=ac.createBiquadFilter(),headroom=ac.createGain(),reverb=ac.createConvolver(),wet=ac.createGain();
  subCut.type='highpass';subCut.frequency.value=28;subCut.Q.value=.7;
  bass.type='lowshelf';bass.frequency.value=180;bass.gain.value=boost?11:0;
  weight.type='peaking';weight.frequency.value=90;weight.Q.value=.8;weight.gain.value=boost?4:0;
  headroom.gain.value=boost?.6:1;wet.gain.value=wetLevel;
  input.connect(subCut);subCut.connect(bass);bass.connect(weight);weight.connect(headroom);headroom.connect(effects);headroom.connect(reverb);reverb.connect(wet);wet.connect(effects);
  const length=Math.ceil(ac.sampleRate*seconds),impulse=ac.createBuffer(2,length,ac.sampleRate);
  let seed=9173;for(let channel=0;channel<2;channel++){const data=impulse.getChannelData(channel);let low=0;for(let n=0;n<length;n++){seed=(seed*1664525+1013904223)>>>0;const random=seed/2147483648-1;low=.72*low+.28*random;const t=n/ac.sampleRate;data[n]=low*Math.exp(-6*t/seconds)*Math.min(1,t/.012);}for(const [time,level] of [[.037,.55],[.079,.36],[.139,.22]]){const index=Math.round((time+channel*.004)*ac.sampleRate);if(index<length)data[index]+=level;}}
  reverb.buffer=impulse;reverbs.push({node:reverb,impulse});return input;
 }
 let settings={effects:.65,systems:.4,muted:false};
 try{const stored=JSON.parse(localStorage.getItem('mech-audio-v1'));if(stored){for(const key of ['effects','systems'])if(Number.isFinite(stored[key]))settings[key]=Math.max(0,Math.min(1,stored[key]));settings.muted=stored.muted===true;}}catch{}
 const files=typeof fetch==='function'?Object.fromEntries(ids.map(id=>[id,fetch('./assets/audio/'+(approvedSamples.includes(id)?id+'.wav':id==='machine'?'machine-ak-shot.wav':id==='autocannon'?'autocannon-original.wav':id+'.mp3')).then(r=>{if(!r.ok)throw Error(id);return r.arrayBuffer();}).catch(()=>null)])):{};
 function levels(){if(!ac)return;master.gain.setTargetAtTime(settings.muted?0:1,ac.currentTime,.02);effects.gain.setTargetAtTime(settings.effects,ac.currentTime,.02);systems.gain.setTargetAtTime(settings.systems,ac.currentTime,.02);}
 function unlock(){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return Promise.resolve();
  if(!ac){ac=new Audio();master=ac.createGain();const limiter=ac.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;master.connect(limiter);limiter.connect(ac.destination);effects=ac.createGain();systems=ac.createGain();effects.connect(master);systems.connect(master);levels();noise=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=noise.getChannelData(0);for(let n=0;n<d.length;n++)d[n]=Math.random()*2-1;loading=Promise.all(ids.map(async id=>{const data=await files[id];if(data)try{buffers[id]=await ac.decodeAudioData(data.slice(0));}catch{}}));}
  if(!weaponFast){weaponFast=makeWeaponBus(.38,.2);weaponHeavy=makeWeaponBus(1.45,.34);machineRoom=makeWeaponBus(.28,.16,false);}
  return Promise.all([ac.resume().catch(()=>{}),loading]);
 }
 function voice(id,{gain=.5,rate=1,pan=0,loop=false,bus='effects',delay=0,tailFade=0}={}){
  if(!ac||ac.state!=='running'||settings.muted||!buffers[id]||voices.size>=36)return null;
  const source=ac.createBufferSource(),amp=ac.createGain(),panner=ac.createStereoPanner?ac.createStereoPanner():ac.createGain();source.buffer=buffers[id];source.loop=loop;source.playbackRate.value=rate;if(panner.pan)panner.pan.value=pan;
  source.connect(amp);amp.connect(panner);panner.connect(bus==='systems'?systems:bus==='dry'?effects:bus==='machine'?machineRoom:heavySounds.has(id)?weaponHeavy:weaponFast);amp.gain.setValueAtTime(0,ac.currentTime+delay);amp.gain.linearRampToValueAtTime(gain,ac.currentTime+delay+.012);if(!loop&&tailFade&&Number.isFinite(source.buffer.duration)){const end=ac.currentTime+delay+source.buffer.duration/rate;const fade=Math.min(tailFade,source.buffer.duration/rate/2);amp.gain.setValueAtTime(gain,end-fade);amp.gain.linearRampToValueAtTime(0,end);}source.start(ac.currentTime+delay);
  const v={source,amp,panner,gain};voices.add(v);source.onended=()=>{voices.delete(v);source.disconnect();amp.disconnect();panner.disconnect();};return v;
 }
 function stop(v,fade=.025){if(!v||!voices.has(v))return;const t=ac.currentTime;v.amp.gain.cancelScheduledValues(t);v.amp.gain.setValueAtTime(v.amp.gain.value,t);v.amp.gain.linearRampToValueAtTime(0,t+fade);try{v.source.stop(t+fade+.01);}catch{}}
 function loop(key,id,on,opts={}){if(!on){if(loops.has(key)){stop(loops.get(key));loops.delete(key);}return;}if(!loops.has(key)){const v=voice(id,{...opts,loop:true});if(v)loops.set(key,v);}}
 function synth(key,on,type,frequency,gain,pan=0){
  if(!on){if(loops.has(key)){stop(loops.get(key),.1);loops.delete(key);}return;}
  if(!ac||ac.state!=='running'||settings.muted)return;
  let v=loops.get(key);if(!v){const source=type==='noise'?ac.createBufferSource():ac.createOscillator(),amp=ac.createGain(),filter=ac.createBiquadFilter();if(type==='noise'){source.buffer=noise;source.loop=true;}else source.type=type;filter.type='lowpass';filter.frequency.value=type==='noise'?1100:450;const panner=ac.createStereoPanner?ac.createStereoPanner():ac.createGain();if(panner.pan)panner.pan.value=pan;source.connect(filter);filter.connect(amp);amp.connect(panner);panner.connect(/^(flame|hiss|motor)/.test(key)?weaponFast:systems);amp.gain.value=0;source.start();v={source,amp,panner,filter};voices.add(v);source.onended=()=>{voices.delete(v);source.disconnect();filter.disconnect();amp.disconnect();panner.disconnect();};loops.set(key,v);}
  if(v.source.frequency)v.source.frequency.setTargetAtTime(frequency,ac.currentTime,.08);v.amp.gain.setTargetAtTime(gain,ac.currentTime,.04);
 }
 function stopAll(keepRoom=false){for(const v of [...voices])if(!(keepRoom===true&&v===roomVoice))stop(v,.025);if(keepRoom!==true)roomVoice=null;for(const r of reverbs){r.node.buffer=null;r.node.buffer=r.impulse;}loops.clear();lastFire.fill(-99);shieldWas=false;turretWas=false;stopBoot();}
 function menu(kind='click'){if(!ac||settings.muted)return;const now=ac.currentTime;if(now-lastUi<(kind==='tick'?.045:.025))return;lastUi=now;voice(kind==='tick'?'ui-tick':kind==='settle'?'ui-settle':'ui-click',{gain:kind==='tick'?.24:.38,bus:'dry'});}
 function workshop(dt=0){const online=workshopOpen&&!document.hidden&&!settings.muted&&(roomPowered||document.body.classList?.contains?.('cockpit-online'))&&!document.body.classList?.contains?.('story-active');if(online){if(!roomVoice){roomVoice=voice('workshop-bed',{gain:.85,loop:true,bus:'systems'});if(roomVoice){roomVoice.amp.gain.cancelScheduledValues(ac.currentTime);roomVoice.amp.gain.setValueAtTime(0,ac.currentTime);roomVoice.amp.gain.linearRampToValueAtTime(.85,ac.currentTime+1.6);}}}else if(roomVoice){stop(roomVoice,.6);roomVoice=null;}}
 function workshopPower(on){roomPowered=on;if(on)unlock().then(()=>workshop());else workshop();}
 function pageTurn(){unlock().then(()=>voice('page-turn',{gain:.75,bus:'dry'}));}
 function detonation(){voice('chassis-explosion',{gain:1.25,bus:'dry'});}
 function escape(){voice('escape-rocket',{gain:.65,bus:'dry'});}
 function trainingFire(x,y){const distance=Math.hypot(x-mech.x,y-mech.y);voice('machine',{gain:.35/(1+distance/500),pan:Math.max(-.8,Math.min(.8,(x-mech.x)/600)),bus:'machine'});}
 function servoCue(brake){voice(brake?'turret-brake':'turret-start',{gain:brake?.32:.4,bus:'systems'});}
 function motion(previous,dt){
  workshop(dt);
  if(workshopOpen||ejected||mech.hp<=0||document.hidden)return;
  const travelled=Math.hypot(mech.x-previous.x,mech.y-previous.y),phase=mech.step;
  if(travelled>.001&&Number.isFinite(phase)&&phase>previous.step){const before=Math.floor((previous.step-Math.PI/2)/Math.PI),after=Math.floor((phase-Math.PI/2)/Math.PI);for(let contact=before+1;contact<=after;contact++){const left=contact%2===0,cls=loadout.chassis;voice(left?'step-left':'step-right',{gain:cls==='War Tank'?.65:cls==='Recon'?.38:.5,rate:cls==='War Tank'?.82:cls==='Recon'?1.12:1,pan:left?-.12:.12,bus:'systems'});}}
  const rotation=Math.abs(angleDiff(mech.t,previous.t)),turning=rotation>1e-5,speed=dt>0?Math.min(1,rotation/dt/1.8):0;
  if(turning&&!turretWas)servoCue(false);if(!turning&&turretWas)servoCue(true);
  loop('turret','turret-turn',turning,{gain:.42,rate:1,bus:'systems'});
  const motor=loops.get('turret');if(motor){motor.source.playbackRate.setTargetAtTime(.88+speed*.12,ac.currentTime,.08);motor.amp.gain.setTargetAtTime(.3+speed*.12,ac.currentTime,.04);}
  turretWas=turning;
 }
 function shot(w,i){lastFire[i]=clock;const pan=i===0||i===1?-.3:.3;
  if(w.kind==='pod'){const id={mini:'mini-launch',rockets:'rocket-launch',emp:'emp-launch',heavy:'heavy-launch',cluster:'launch'}[w.id];voice(id,{gain:w.id==='heavy'?.65:.5,rate:1,pan,bus:'dry'});return;}
  if(w.id==='machine'){voice('machine',{gain:.95,rate:1,pan,bus:'machine'});return;}
  if(w.id==='autocannon'){voice('autocannon',{gain:.18,rate:1,pan,bus:'dry',tailFade:.015});return;}
  if(w.id==='lance'){voice('lance-fire',{gain:.55,rate:1,pan,bus:'dry'});return;}
  const approved={breach:'breach-approved',scatter:'scatter-approved',arc:'arc-approved'}[w.id];if(approved){voice(approved,{gain:.55,rate:1,pan,bus:'dry'});return;}
  if(['gatling','beam','flame','thermite'].includes(w.id))return;
  voice(w.id,{gain:w.id==='siege'?.8:.5,rate:.97+Math.random()*.06,pan});
 }
 function explosion(p){if(!p.radius)return;const distance=Math.hypot(p.x-mech.x,p.y-mech.y),pan=Math.max(-.8,Math.min(.8,(p.x-mech.x)/600));const id=p.mode==='bomblet'?'cluster-impact':p.wid==='emp'?'emp-impact':p.wid==='heavy'?'heavy-impact':['mini','rockets'].includes(p.wid)?'rocket-impact':'explosion';voice(id,{gain:(p.wid==='mini'?.32:p.mode==='bomblet'?.36:.65)/(1+distance/500),rate:1,pan,bus:id==='explosion'?'effects':'dry'});}
 function split(p){const pan=Math.max(-.8,Math.min(.8,((p.x||mech.x)-mech.x)/600));voice('cluster-burst',{gain:.55,rate:1,pan,bus:'dry'});for(let n=0;n<5;n++)voice('cluster-whistle',{gain:.22,rate:1,pan:Math.max(-1,Math.min(1,pan+(n-2)*.3)),delay:.03+n*.035,bus:'dry'});}
 function sync(){
  if(workshopOpen){if(document.hidden)stopAll();return;}if(document.hidden){stopAll();return;}if(ejected||mech.hp<=0||isRepairing()||isEjectionWarning()){for(const v of loops.values())stop(v,.04);loops.clear();shieldWas=false;turretWas=false;return;}
  for(let i=0;i<4;i++){
   const w=BY_ID[loadout.slots[i]],pressed=!isRepairing()&&!isEjectionWarning()&&!!(held[i]||keys[String(i+1)]),pan=i===0||i===1?-.3:.3,active=pressed&&!overheated[i]&&clock-lastFire[i]<Math.max(.15,w.rate*1.6);
   synth('motor'+i,w.id==='gatling'&&spin[i]>.01,'sawtooth',35+spin[i]*145,.035+spin[i]*.035,pan);
   loop('gatling'+i,'gatling',w.id==='gatling'&&active&&spin[i]>=.95,{gain:.5,pan});
   loop('beam'+i,'beam',w.id==='beam'&&active,{gain:.35,pan});
   const flame=['flame','thermite'].includes(w.id)&&active,was=loops.has('flame'+i);
   synth('flame'+i,flame,'noise',100,.5,pan);
   if(flame&&!was)voice('launch',{gain:.3,rate:1.25,pan});
   if(!flame&&was){synth('hiss'+i,true,'noise',100,.12,pan);const v=loops.get('hiss'+i);loops.delete('hiss'+i);stop(v,.18);}
   if(w.id==='lance'){const key='charge'+i;if(pressed&&charging[i]){if(!loops.has(key)){const v=voice('lance-charge',{gain:.48,rate:1,pan,bus:'dry'});if(v)loops.set(key,v);}}else loop(key,'lance-charge',false);}else loop('charge'+i,'charge',pressed&&!!charging[i],{gain:.2,rate:.8,pan});
  }
  synth('shield',shieldActive,'sine',62+(100-mech.energy)*.15,.14);
  synth('shieldharmonic',shieldActive,'sine',124+(100-mech.energy)*.3,.035);
  if(shieldWas&&!shieldActive&&shieldLocked)voice('charge',{gain:.15,rate:.55,bus:'systems'});shieldWas=shieldActive;
 }
 let bootVoice=null,bootGeneration=0;
 function stopBoot(){bootGeneration++;if(bootVoice){stop(bootVoice,.08);bootVoice=null;}if(window.speechSynthesis)window.speechSynthesis.cancel();}
 function boot(short=false){stopBoot();const generation=bootGeneration;unlock().then(()=>{if(!workshopOpen||generation!==bootGeneration)return;bootVoice=voice('cockpit-power',{gain:short?.3:.6,rate:short?2:1,bus:'systems'});});}
 function welcome(onDone=()=>{}){if(settings.muted||!window.speechSynthesis||typeof window.SpeechSynthesisUtterance!=='function'){onDone();return;}const speech=window.speechSynthesis,voices=speech.getVoices(),local=voices.filter(v=>v.localService!==false&&/^en/i.test(v.lang));const chosen=local.find(v=>/Samantha|Serena|Stephanie|Susan|Karen|Moira|Tessa|Victoria|Zira|Hazel|female/i.test(v.name))||local.find(v=>/^en-GB/i.test(v.lang))||local[0];const line=new window.SpeechSynthesisUtterance('Welcome, pilot.');if(chosen)line.voice=chosen;line.lang=chosen?.lang||'en-GB';line.rate=.88;line.pitch=1;line.volume=settings.systems;let ended=false;const done=()=>{if(!ended){ended=true;onDone();}};line.onend=done;line.onerror=done;speech.cancel();speech.speak(line);}
 function configure(key,value){if(key==='muted')settings.muted=!!value;else settings[key]=Math.max(0,Math.min(1,Number(value)));try{localStorage.setItem('mech-audio-v1',JSON.stringify(settings));}catch{}levels();if(settings.muted)stopAll();}
 if(typeof document.addEventListener==='function'){
  document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('click',e=>{const b=e.target?.closest?.('button,[data-info-slot]');if(!b||b.disabled||['story-next','story-back'].includes(b.id)||b.closest?.('.ws-card')||b.closest?.('#panel')||b.closest?.('header')&&!b.closest?.('#workshop-open'))return;unlock().then(()=>menu('click'));},{capture:true});
  document.addEventListener('pointerup',()=>{if(ac)sync();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAll();if(ac)ac.suspend().catch(()=>{});}});window.addEventListener('blur',stopAll);
 }
 function mountControls(){if(typeof document.body.insertAdjacentHTML!=='function')return;
  document.body.insertAdjacentHTML('beforeend','<details id="audio-settings"><summary aria-label="Sound settings">♫</summary><div><label>Effects <input id="audio-effects" type="range" min="0" max="1" step="0.05" aria-label="Effects volume"></label><label>Hum / motors <input id="audio-systems" type="range" min="0" max="1" step="0.05" aria-label="System volume"></label><label><input id="audio-muted" type="checkbox"> Mute</label><small id="audio-ready">Tap to enable sound</small></div></details>');
  for(const key of ['effects','systems','muted']){const el=document.querySelector('#audio-'+key);if(key==='muted')el.checked=settings[key];else el.value=settings[key];el.addEventListener('input',()=>configure(key,key==='muted'?el.checked:el.value));}
  document.querySelector('#audio-settings').addEventListener('pointerdown',()=>unlock().then(()=>{document.querySelector('#audio-ready').textContent=ac?'Sound ready':'Audio unavailable';}));
 }
 mountControls();return {workshopPower,pageTurn,detonation,escape,boot,welcome,stopBoot,unlock,menu,workshop,trainingFire,clearGame:()=>stopAll(true),shot,explosion,split,sync,motion,stopAll,configure,ids};
})();

// Hook actual accepted shots, not fire-button presses or blocked attempts.
const fireWithoutAudio=arsenalFire;
arsenalFire=function(i){const before=cool[i];fireWithoutAudio(i);if(cool[i]>before)GameAudio.shot(BY_ID[loadout.slots[i]],i);};
const updateWithoutAudio=updateArsenal;
updateArsenal=function(dt){updateWithoutAudio(dt);GameAudio.sync();};
const finishWithoutAudio=finishShot;
finishShot=function(p){if(!p.done)GameAudio.explosion(p);finishWithoutAudio(p);};
const clearWithoutAudio=clearInput;
clearInput=function(){clearWithoutAudio();GameAudio.clearGame();};
const movementWithoutAudio=update;
update=function(dt){const previous={x:mech.x,y:mech.y,t:mech.t,step:mech.step};movementWithoutAudio(dt);GameAudio.motion(previous,dt);};
