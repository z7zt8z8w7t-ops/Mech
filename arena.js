'use strict';
// Assault mech scale stays locked: 30ft tall, approximately 6m armed footprint.
// Expanded yard: same units per metre, with clearance for the complete armed silhouette.
const ARENA={
 id:'junkyard',name:'Junkyard tutorial',hint:'JUNKYARD TUTORIAL · movement and target practice',width:1200,height:1800,
 artwork:{width:2400,height:3600,pixelsPerUnit:2,origin:'top-left',view:'orthographic-overhead',floor:'./assets/junkyard-tutorial-open.png',sourceWidth:1024,sourceHeight:1536,layers:['floor','passable-flat-scrap']},
 spawn:{x:600,y:1500,angle:-Math.PI/2},
 cover:[],
 hazard:{x:0,y:0,w:0,h:0,enabled:false},
 targets:[{x:444,y:198},{x:600,y:198},{x:756,y:198}]
};
let arenaFloor,arenaFloorReady=false;
function loadArenaFloor(){
 arenaFloorReady=false;const image=new Image();arenaFloor=image;
 return new Promise(resolve=>{image.onload=()=>{if(image===arenaFloor)arenaFloorReady=true;resolve(true);};image.onerror=()=>resolve(false);image.src=ARENA.artwork.floor;});
}
const arenaFloorLoading=loadArenaFloor();
function drawArenaGround(g){
 if(arenaFloorReady){g.drawImage(arenaFloor,0,0,ARENA.width,ARENA.height);g.save();g.fillStyle='rgba(5,9,12,0.42)';g.fillRect(0,0,ARENA.width,ARENA.height);g.restore();return;}
 g.fillStyle='#17292d';g.fillRect(0,0,ARENA.width,ARENA.height);g.strokeStyle='#284047';g.lineWidth=1;g.beginPath();for(let x=0;x<=ARENA.width;x+=50){g.moveTo(x,0);g.lineTo(x,ARENA.height);}for(let y=0;y<=ARENA.height;y+=50){g.moveTo(0,y);g.lineTo(ARENA.width,y);}g.stroke();
}

// Temporary collision diagnostics, independent of baked obstacle artwork.
let showCollisionBarriers=true;
function drawCollisionBarriers(g){if(!showCollisionBarriers)return;g.save();g.lineWidth=6;g.strokeStyle='#101414';for(const b of ARENA.cover)g.strokeRect(b.x,b.y,b.w,b.h);g.strokeStyle='#ffce44';g.lineWidth=4;g.setLineDash([12,10]);for(const b of ARENA.cover)g.strokeRect(b.x,b.y,b.w,b.h);g.setLineDash([]);g.restore();}

const TUTORIAL_ARENA=JSON.parse(JSON.stringify(ARENA));
const BREAKERS_ARENA={id:'breakers',name:'The Breakers Yard',hint:'THE BREAKERS YARD · clear the arena',width:1340,height:2015,artwork:{...TUTORIAL_ARENA.artwork},spawn:{x:670,y:1815,angle:-Math.PI/2},hazard:{enabled:false,x:0,y:0,w:0,h:0},
 gantries:[{x1:260,x2:1080,y:600,clearanceFeet:45},{x1:190,x2:1110,y:1300,clearanceFeet:45}],
 cover:[
 {x:210,y:530,w:100,h:140,kind:'crane-base',baked:true},{x:1030,y:530,w:100,h:140,kind:'crane-base',baked:true},
 {x:140,y:1230,w:100,h:140,kind:'crane-base',baked:true},{x:1060,y:1230,w:100,h:140,kind:'crane-base',baked:true},
 {x:50,y:150,w:160,h:250,kind:'scrap',baked:true},{x:1150,y:140,w:140,h:260,kind:'scrap',baked:true},
 {x:560,y:940,w:220,h:135,kind:'scrap',baked:true},{x:45,y:1510,w:160,h:220,kind:'scrap',baked:true},
 {x:1060,y:1600,w:200,h:100,kind:'container',baked:true},{x:380,y:65,w:220,h:95,kind:'container',baked:true},{x:780,y:65,w:200,h:95,kind:'container',baked:true}],
 targets:[{x:440,y:340,type:'mech',maxHp:150,r:50},{x:925,y:430,type:'rover',maxHp:50,r:32},{x:330,y:850,type:'rover',maxHp:50,r:32},{x:970,y:1430,type:'rover',maxHp:50,r:32}]
};
function selectArena(id){const selected=id==='breakers'?BREAKERS_ARENA:TUTORIAL_ARENA;Object.assign(ARENA,JSON.parse(JSON.stringify(selected)));world.w=ARENA.width;world.h=ARENA.height;blocks=ARENA.cover;haz=ARENA.hazard;const hint=document.querySelector('.hint');if(hint)hint.textContent=ARENA.hint;loadArenaFloor();}
function drawArenaScenery(g){if(ARENA.id!=='breakers')return;
 g.save();g.fillStyle='rgba(32,20,12,.24)';g.fillRect(0,0,ARENA.width,ARENA.height);g.strokeStyle='#9087740d';g.lineWidth=2;
 for(let y=0;y<ARENA.height;y+=135){g.beginPath();g.moveTo(0,y);g.lineTo(ARENA.width,y);g.stroke();}for(let x=0;x<ARENA.width;x+=150){g.beginPath();g.moveTo(x,0);g.lineTo(x,ARENA.height);g.stroke();}
 for(const a of ARENA.gantries){g.save();g.translate(48,72);g.strokeStyle='#03070650';g.lineWidth=55;g.beginPath();g.moveTo(a.x1,a.y);g.lineTo(a.x2,a.y);g.stroke();g.lineWidth=10;for(let x=a.x1;x<a.x2;x+=90){g.beginPath();g.moveTo(x,a.y-35);g.lineTo(Math.min(x+90,a.x2),a.y+35);g.stroke();}g.restore();}
 for(const b of ARENA.cover){g.fillStyle='#02050677';g.fillRect(b.x+10,b.y+12,b.w,b.h);const grad=g.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);grad.addColorStop(0,b.kind==='crane-base'?'#6d6451':b.kind==='container'?'#554d40':'#46433b');grad.addColorStop(1,'#222725');g.fillStyle=grad;g.fillRect(b.x,b.y,b.w,b.h);g.strokeStyle='#1b2420';g.lineWidth=4;g.strokeRect(b.x+2,b.y+2,b.w-4,b.h-4);
  if(b.kind==='container'){g.strokeStyle='#8c7e5338';g.lineWidth=3;for(let x=b.x+12;x<b.x+b.w;x+=12){g.beginPath();g.moveTo(x,b.y+6);g.lineTo(x,b.y+b.h-6);g.stroke();}}
  else if(b.kind==='crane-base'){g.fillStyle='#262d29';g.fillRect(b.x+22,b.y+16,b.w-44,b.h-32);g.strokeStyle='#ad9251';g.lineWidth=5;g.strokeRect(b.x+24,b.y+18,b.w-48,b.h-36);g.fillStyle='#a39165';for(const x of [b.x+9,b.x+b.w-9])for(const y of [b.y+9,b.y+b.h-9]){g.beginPath();g.arc(x,y,3,0,Math.PI*2);g.fill();}}
  else{if(typeof spritesReady!=='undefined'&&spritesReady){g.save();g.beginPath();g.rect(b.x+5,b.y+5,b.w-10,b.h-10);g.clip();g.filter='saturate(.3) brightness(.55)';for(let k=0;k<6;k++){g.save();g.translate(b.x+b.w*.5+(k%2?22:-22),b.y+30+k*(b.h-45)/6);g.rotate(k*1.43);g.drawImage(componentImages.weathered,180+(k%3)*220,240+(k%2)*290,380,390,-42,-42,84,84);g.restore();}g.restore();}for(let j=0;j<18;j++){const x=b.x+10+(j*43%(b.w-28)),y=b.y+10+(j*31%(b.h-28));g.save();g.translate(x,y);g.rotate(j*1.72);g.fillStyle=j%3?'#51544a':'#736049';g.fillRect(-9,-5,18,10);g.strokeStyle='#171e1a';g.lineWidth=2;g.strokeRect(-9,-5,18,10);g.restore();}}
 }
 g.restore();
}
function drawArenaOverhead(g){if(ARENA.id!=='breakers')return;g.save();
 for(const a of ARENA.gantries){const grad=g.createLinearGradient(0,a.y-33,0,a.y+33);grad.addColorStop(0,'#9c8345');grad.addColorStop(.4,'#615024');grad.addColorStop(1,'#3b3423');g.fillStyle='#111b17';g.fillRect(a.x1-22,a.y-39,a.x2-a.x1+44,78);g.fillStyle=grad;g.fillRect(a.x1-18,a.y-34,a.x2-a.x1+36,68);
  g.fillStyle='#17231f';g.fillRect(a.x1+4,a.y-20,a.x2-a.x1-8,40);g.strokeStyle='#a78c43';g.lineWidth=7;
  for(let x=a.x1;x<a.x2;x+=90){g.beginPath();g.moveTo(x,a.y-25);g.lineTo(Math.min(x+90,a.x2),a.y+25);g.lineTo(Math.min(x+90,a.x2),a.y-25);g.stroke();}g.strokeStyle='#c0a25a';g.lineWidth=4;g.strokeRect(a.x1-16,a.y-32,a.x2-a.x1+32,64);
  for(const x of [a.x1,a.x2]){g.fillStyle='#70613e';g.fillRect(x-36,a.y-47,72,94);g.strokeStyle='#c8ac65';g.lineWidth=2;g.strokeRect(x-32,a.y-43,64,86);g.fillStyle='#142623';g.fillRect(x-22,a.y-29,44,25);for(let k=0;k<4;k++){g.fillStyle='#342e21';g.fillRect(x-22,a.y+6+k*7,44,3);}}
  const trolley=a.x1+(a.x2-a.x1)*.4;g.fillStyle='#a18a4c';g.fillRect(trolley-27,a.y-43,54,86);g.fillStyle='#263736';g.fillRect(trolley-18,a.y-32,36,20);g.strokeStyle='#28271e';g.lineWidth=2;g.strokeRect(trolley-23,a.y-39,46,78);
  for(let k=0;k<120;k++){const x=a.x1+(k*71%(a.x2-a.x1)),y=a.y-30+(k*17%60);g.fillStyle=k%3?'#171b173b':'#e6d2a321';g.fillRect(x,y,2+(k%6),1);}for(let x=a.x1+60;x<a.x2;x+=140){g.fillStyle='#d3aa52';g.fillRect(x,a.y-33,4,5);g.fillStyle='#271d13';g.fillRect(x+8,a.y-32,12,2);}
 }g.restore();
}
showCollisionBarriers=false;
