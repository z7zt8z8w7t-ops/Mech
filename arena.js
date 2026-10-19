'use strict';
// Assault mech scale stays locked: 30ft tall, approximately 6m armed footprint.
// Expanded yard: same units per metre, with clearance for the complete armed silhouette.
const ARENA={
 id:'junkyard',name:'Junkyard tutorial',hint:'JUNKYARD TUTORIAL · movement and target practice',width:1200,height:1800,
 artwork:{width:2400,height:3600,pixelsPerUnit:2,origin:'top-left',view:'orthographic-overhead',floor:'./assets/junkyard-tutorial-v2.png',sourceWidth:1024,sourceHeight:1536,layers:['floor','baked-scrap-cover']},
 spawn:{x:600,y:1500,angle:-Math.PI/2},
 cover:[
  {x:0,y:0,w:120,h:1800,baked:true},{x:1080,y:0,w:120,h:1800,baked:true},
  {x:144,y:0,w:912,h:48,baked:true},{x:144,y:1752,w:300,h:48,baked:true},
  {x:756,y:1752,w:300,h:48,baked:true},
  {x:120,y:48,w:180,h:250,baked:true},{x:900,y:48,w:180,h:210,baked:true},
  {x:120,y:1480,w:170,h:272,baked:true},{x:900,y:1460,w:180,h:292,baked:true},
  {x:346,y:558,w:180,h:228,baked:true},{x:633,y:904,w:219,h:226,baked:true}
 ],
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
 if(arenaFloorReady){g.drawImage(arenaFloor,0,0,ARENA.width,ARENA.height);return;}
 g.fillStyle='#17292d';g.fillRect(0,0,ARENA.width,ARENA.height);g.strokeStyle='#284047';g.lineWidth=1;g.beginPath();for(let x=0;x<=ARENA.width;x+=50){g.moveTo(x,0);g.lineTo(x,ARENA.height);}for(let y=0;y<=ARENA.height;y+=50){g.moveTo(0,y);g.lineTo(ARENA.width,y);}g.stroke();
}

// Temporary collision diagnostics, independent of baked obstacle artwork.
let showCollisionBarriers=true;
function drawCollisionBarriers(g){if(!showCollisionBarriers)return;g.save();g.lineWidth=6;g.strokeStyle='#101414';for(const b of ARENA.cover)g.strokeRect(b.x,b.y,b.w,b.h);g.strokeStyle='#ffce44';g.lineWidth=4;g.setLineDash([12,10]);for(const b of ARENA.cover)g.strokeRect(b.x,b.y,b.w,b.h);g.setLineDash([]);g.restore();}
