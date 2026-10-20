'use strict';
// Use the same component geometry, transforms and hardpoints as the renderer.
const TRAINING_SLOTS=['machine','mini','mini','machine'];
function mechFootprint(c){const k=(c.r||21)/21,scale=MECH_SCALE,polys=[];
 const transform=(points,a)=>{const ca=Math.cos(a+Math.PI/2),sa=Math.sin(a+Math.PI/2);return points.map(([x,y])=>({x:c.x+(x*ca-y*sa)*scale,y:c.y+(x*sa+y*ca)*scale}));};
 polys.push(transform(BODY_PATH.map(([x,y])=>[(x-630)*ART.sx*k,(y-660)*ART.sy*k]),c.t));
 const rect=(x,y,w,h,a)=>polys.push(transform([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],a));
 for(let i=0;i<4;i++)if(c.slots[i]!=='empty')rect(...SLOT_RECTS[i].map(n=>n*k),c.t);
 const rr=c.r||21,legs=legPose(c.step||0);for(const [x,offset] of [[500,legs.left],[855,legs.right]]){rect((x-770)*rr/400,(120-520)*rr/400-offset,190*rr/400,129*rr/400,c.a);rect((x+22-770)*rr/400,(848-520)*rr/400-offset,146*rr/400,103*rr/400,c.a);}
 return polys;
}
function pointInHull(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function hullsOverlap(a,b){if(a.some(p=>pointInHull(p.x,p.y,b))||b.some(p=>pointInHull(p.x,p.y,a)))return true;const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];if(cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0)return true;}return false;}
function playerFootprint(x=mech.x,y=mech.y){return mechFootprint({...mech,x,y,r:stats[$('#class').value].r,slots:loadout.slots});}
function enemyFootprint(t){if(t.type==='rover'){const rect=(points,a)=>points.map(([x,y])=>({x:t.x+x*Math.cos(a+Math.PI/2)-y*Math.sin(a+Math.PI/2),y:t.y+x*Math.sin(a+Math.PI/2)+y*Math.cos(a+Math.PI/2)}));return [rect([[-32,-27],[32,-27],[35,40],[-35,40]],t.a||0),rect([[-3,-44],[3,-44],[3,0],[-3,0]],t.t||0)];}return mechFootprint({...t,r:17,a:t.a??Math.PI/2,t:t.t??Math.PI/2,slots:TRAINING_SLOTS,step:t.step||0});}

function footprintsOverlap(a,b){return a.some(p=>b.some(q=>hullsOverlap(p,q)));}
function playerPositionBlocked(x,y){const hull=playerFootprint(x,y);if(hull.some(p=>p.some(v=>v.x<0||v.y<0||v.x>world.w||v.y>world.h)))return true;return blocks.some(b=>hull.some(p=>hullsOverlap(p,[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h} ])))||targets.some(t=>t.hp>0&&footprintsOverlap(hull,enemyFootprint(t)));}
function trainingHullHit(t,x,y,padding=0){const hull=enemyFootprint(t);if(hull.some(p=>pointInHull(x,y,p)))return true;if(padding<=0)return false;return hull.some(p=>p.some((v,i)=>{const b=p[(i+1)%p.length],dx=b.x-v.x,dy=b.y-v.y,f=Math.max(0,Math.min(1,((x-v.x)*dx+(y-v.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-v.x-f*dx,y-v.y-f*dy)<=padding;}));}
