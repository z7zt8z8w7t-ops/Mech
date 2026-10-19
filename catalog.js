'use strict';
const VERSION='0.52';
const CHASSIS=[{id:'Recon',r:17,speed:175,turn:3.2,tag:'Fast reconnaissance',description:'Quick movement and fast chassis turning.',front:[0,40,510,780]},{id:'Assault',r:21,speed:115,turn:2.3,tag:'Balanced combat chassis',description:'The locked size baseline. Balanced handling.',front:[525,40,530,780]},{id:'War Tank',r:26,speed:75,turn:1.5,tag:'Heavy battlefield platform',description:'Larger silhouette and deliberate movement.',front:[1070,40,640,780]}];
const SLOT_NAMES=['Left arm','Left shoulder','Right shoulder','Right arm'];
const WEAPONS=[
{id:'machine',name:'Machine cannon',short:'CANNON',tier:1,family:'Ballistic',kind:'arm',mode:'bullet',rate:.11,damage:7,speed:700,range:780,heat:2,colour:'#fff0a5',description:'Reliable rapid direct fire.'},
{id:'pulse',name:'Pulse laser',short:'PULSE',tier:1,family:'Energy',kind:'arm',mode:'pulse',rate:.25,damage:15,speed:1000,range:820,energy:3,heat:4,colour:'#6ffaff',description:'Accurate cyan pulses. Uses shield power.'},
{id:'scatter',name:'Scatter cannon',short:'SCATTER',tier:1,family:'Close range',kind:'arm',mode:'pellets',rate:.8,damage:4,pellets:9,spread:.3,speed:650,range:190,heat:9,colour:'#ffe4a3',description:'Nine pellets in a wide, short-range burst.'},
{id:'mini',name:'Mini missiles',short:'MINI',tier:1,family:'Special',kind:'pod',mode:'missile',rate:.45,damage:24,speed:300,range:1000,cells:6,reload:5.5,guided:true,radius:20,cap:.078,colour:'#ffc04b',description:'Six guided missiles. Each cell reloads separately.'},
{id:'gatling',name:'Gatling cannon',short:'GATLING',tier:2,family:'Ballistic',kind:'arm',mode:'bullet',rate:.045,damage:4,speed:720,range:750,heat:1.7,spread:.035,colour:'#ffeaa0',description:'Rotating six-barrel cluster. Spins up before full fire.'},
{id:'beam',name:'Beam laser',short:'BEAM',tier:2,family:'Energy',kind:'arm',mode:'beam',rate:.06,damage:2.6,range:650,energy:1.1,heat:1.8,colour:'#ff4055',description:'Continuous red beam. Track targets to sustain damage.'},
{id:'flame',name:'Flamethrower',short:'FLAME',tier:2,family:'Close range',kind:'arm',mode:'flame',rate:.07,damage:1.6,range:145,heat:1.2,colour:'#ff8d32',description:'Short cone of flame. Ignites targets.'},
{id:'rockets',name:'Rocket pod',short:'ROCKETS',tier:2,family:'Special',kind:'pod',mode:'rocket',rate:.55,damage:42,speed:340,range:1000,cells:4,reload:6.5,radius:42,cap:.125,colour:'#ffa44b',description:'Four powerful unguided rockets. Vertical launch arc.'},
{id:'autocannon',name:'Heavy autocannon',short:'AUTO',tier:3,family:'Ballistic',kind:'arm',mode:'bullet',rate:.4,damage:25,speed:650,range:800,heat:7,radius:16,colour:'#ffd08b',description:'Heavy shells with small impact bursts.'},
{id:'plasma',name:'Plasma cannon',short:'PLASMA',tier:3,family:'Energy',kind:'arm',mode:'plasma',rate:.85,damage:45,speed:300,range:720,energy:11,heat:17,radius:48,colour:'#bd73ff',description:'Slow plasma bolts explode on impact.'},
{id:'arc',name:'Arc projector',short:'ARC',tier:3,family:'Close range',kind:'arm',mode:'arc',rate:.65,damage:24,range:170,energy:6,heat:8,colour:'#80caff',description:'Close electrical strike chains to nearby targets.'},
{id:'emp',name:'EMP missiles',short:'EMP',tier:3,family:'Special',kind:'pod',mode:'emp',rate:.65,damage:10,speed:300,range:1000,cells:4,reload:8,guided:true,radius:110,cap:.125,colour:'#80baff',description:'Expanding EMP wave disables enemy systems for five seconds.'},
{id:'rail',name:'Railgun',short:'RAIL',tier:4,family:'Ballistic',kind:'arm',mode:'rail',rate:1.8,charge:.65,damage:85,range:1100,heat:22,colour:'#ffe2a3',description:'Charged penetrating shot through aligned targets.'},
{id:'lance',name:'Particle lance',short:'LANCE',tier:4,family:'Energy',kind:'arm',mode:'rail',rate:1.7,charge:1.37,damage:80,range:1000,energy:16,heat:20,colour:'#aaff57',description:'Charged green particle strike pierces targets.'},
{id:'breach',name:'Breaching shotgun',short:'BREACH',tier:4,family:'Close range',kind:'arm',mode:'pellets',rate:1.15,damage:11,pellets:8,spread:.16,speed:650,range:175,heat:17,colour:'#ffd890',description:'Tight heavy pellet burst for point-blank fighting.'},
{id:'cluster',name:'Cluster missiles',short:'CLUSTER',tier:4,family:'Special',kind:'pod',mode:'cluster',rate:.8,damage:24,speed:300,range:1100,cells:3,reload:8.5,guided:true,radius:30,cap:.125,colour:'#ffc45a',description:'Splits into five smaller explosive submunitions.'},
{id:'siege',name:'Siege cannon',short:'SIEGE',tier:5,family:'Ballistic',kind:'arm',mode:'bullet',rate:2.6,damage:110,speed:410,range:900,heat:30,radius:85,recoil:8,colour:'#ffb36d',description:'Slow heavy shell with a wide blast and recoil.'},
{id:'accelerator',name:'Heavy plasma accelerator',short:'H.PLASMA',tier:5,family:'Energy',kind:'arm',mode:'plasma',rate:2.8,charge:.5,damage:115,speed:240,range:850,energy:24,heat:32,radius:90,colour:'#df8aff',description:'Charged heavy plasma bolt. High power and heat.'},
{id:'thermite',name:'Thermite projector',short:'THERMITE',tier:5,family:'Close range',kind:'arm',mode:'thermite',rate:.12,damage:2.8,range:165,heat:2.5,colour:'#ffbd65',description:'Burning spray leaves damaging thermite patches.'},
{id:'heavy',name:'Guided heavy missiles',short:'H.MISSILE',tier:5,family:'Special',kind:'pod',mode:'missile',rate:1,damage:110,speed:250,range:1200,cells:2,reload:10,guided:true,radius:95,cap:.135,colour:'#ff514e',description:'Two large guided missiles with a heavy blast.'}
];
const EMPTY={id:'empty',name:'Empty hardpoint',short:'EMPTY',tier:0,family:'Unequipped',kind:'any',description:'Leave this mount empty.'};
const BY_ID=Object.fromEntries(WEAPONS.map(w=>[w.id,w]));BY_ID.empty=EMPTY;
function slotKind(i){return i===0||i===3?'arm':'pod';}
function compatible(i,id){return !!BY_ID[id]&&(id==='empty'||BY_ID[id].kind===slotKind(i));}
function cleanLoadout(v){const defaultSlots=['machine','mini','mini','machine'];return {chassis:CHASSIS.some(c=>c.id===v?.chassis)?v.chassis:'Assault',slots:defaultSlots.map((d,i)=>compatible(i,v?.slots?.[i])?v.slots[i]:d)};}
let loadout;try{loadout=cleanLoadout(JSON.parse(localStorage.getItem('mech-loadout-v1')));}catch{loadout=cleanLoadout(null);}
let saveFailed=false;function saveLoadout(){try{localStorage.setItem('mech-loadout-v1',JSON.stringify(loadout));saveFailed=false;}catch{saveFailed=true;}}
// Story milestones will use chapter progression. The prototype exposes the whole arsenal for testing.
function storyUnlocked(w,chapter=0){return w.tier<=chapter+1;}
let workshopOpen=true;
// The shoulder centres stay fixed; each pod grows outwards and inwards to leave a narrow centre seam.
const SLOT_RECTS=[[-41.44,-37.78,21.37,44.07],[-24,21.5,23.5,17.5],[.5,21.5,23.5,17.5],[20.07,-37.78,21.37,44.07]];
// Normalized launch points match the visible top-down round caps in the five wide pod assets.
function missileCells(w){
 if(w.id==='mini')return [
  {u:.30,v:.45,r:.072},{u:.50,v:.45,r:.072},{u:.70,v:.45,r:.072},
  {u:.30,v:.65,r:.072},{u:.50,v:.65,r:.072},{u:.70,v:.65,r:.072}];
 if(w.id==='rockets')return [{u:.36,v:.43,r:.101},{u:.64,v:.43,r:.101},{u:.36,v:.69,r:.101},{u:.64,v:.69,r:.101}];
 if(w.id==='emp')return [{u:.36,v:.43,r:.104},{u:.64,v:.43,r:.104},{u:.36,v:.68,r:.104},{u:.64,v:.68,r:.104}];
 if(w.id==='cluster')return [{u:.26,v:.53,r:.115},{u:.50,v:.53,r:.115},{u:.74,v:.53,r:.115}];
 if(w.id==='heavy')return [{u:.34,v:.53,r:.135},{u:.66,v:.53,r:.135}];
 return [];
}
