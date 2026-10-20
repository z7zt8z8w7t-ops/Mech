'use strict';
window.ArenaBattle=(()=>{
 let result=null,finishedFor=0;
 document.body.insertAdjacentHTML('beforeend','<section id="battle-result" hidden role="dialog" aria-label="Arena result"><div><h2 id="battle-result-title"></h2><p id="battle-result-line"></p><button id="battle-return">RETURN TO WORKSHOP</button></div></section>');
 function select(id){result=null;finishedFor=0;document.querySelector('#battle-result').hidden=true;selectArena(id==='tutorial'?'tutorial':'breakers');}
 function update(dt){if(ARENA.id!=='breakers'||workshopOpen||result||window.StoryFlow?.active)return;
  if(ejected){if(capsule?.safe)end(false);return;}if(mech.hp<=0)return;
  if(targets.length&&targets.every(t=>t.hp<=0)){finishedFor+=dt;if(finishedFor>1.2)end(true);}else finishedFor=0;
 }
 function end(won){result=won?'won':'lost';clearInput();document.querySelector('#battle-result-title').textContent=won?'ARENA CLEARED':'PILOT RECOVERED';document.querySelector('#battle-result-line').textContent=won?'The Breakers Yard · victory':'Escape pod safe · return to the workshop';document.querySelector('#battle-result').hidden=false;}
 document.querySelector('#battle-return').onclick=()=>{document.querySelector('#battle-result').hidden=true;result=null;reset();enterWorkshop();};
 return {select,update,get active(){return ARENA.id==='breakers'&&!workshopOpen&&!result;},get result(){return result;}};
})();
const updateBeforeBattle=update;update=function(dt){if(!ArenaBattle.result)updateBeforeBattle(dt);ArenaBattle.update(dt);};
