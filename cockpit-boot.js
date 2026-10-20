'use strict';
window.CockpitBoot=(()=>{
 if(typeof document.body.insertAdjacentHTML!=='function')return {open(){},close(){}};
 document.body.insertAdjacentHTML('beforeend',`<div id="cockpit-window-tint" aria-hidden="true"></div><div id="cockpit-blackout" aria-hidden="true"></div><div id="cockpit-lightwash" aria-hidden="true"></div><button id="cockpit-power" aria-label="Power on cockpit" title="Power on cockpit"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3v12M8.5 7.5a12 12 0 1 0 15 0"/></svg></button><div id="cockpit-boot" hidden><div id="boot-hologram" hidden role="status" aria-live="polite"><div class="boot-orbit"><i></i><i></i><i></i><b>✧</b></div><p id="boot-status">SYSTEM INITIALISING</p><small>COCKPIT SYSTEMS / ONLINE</small><button id="boot-skip">SKIP STARTUP ›</button></div></div>`);
 const menu=document.querySelector('#workshop');
 const body=document.body,overlay=document.querySelector('#cockpit-boot'),power=document.querySelector('#cockpit-power'),hologram=document.querySelector('#boot-hologram'),status=document.querySelector('#boot-status');
 let powered=false,running=false,timers=[],epoch=0;
 const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
 function clear(){epoch++;timers.forEach(clearTimeout);timers=[];GameAudio?.stopBoot();}
 function finish(){clear();running=false;hologram.hidden=true;overlay.hidden=true;body.classList.remove('cockpit-awaiting','cockpit-short','cockpit-welcome-out');const token=epoch;later(()=>{if(token!==epoch)return;body.classList.remove('cockpit-booting');menu.style.visibility='';menu.inert=false;body.classList.add('cockpit-online');},200);}
 function start(short=false){
  menu.style.visibility='hidden';menu.inert=true;clear();running=true;powered=true;const token=epoch;overlay.hidden=false;power.hidden=false;power.disabled=true;power.classList.add('powered');power.setAttribute('aria-label','Cockpit power on');hologram.hidden=false;body.classList.remove('cockpit-awaiting','cockpit-online','cockpit-booting','cockpit-welcome-out');void overlay.offsetWidth;body.classList.add('cockpit-booting');body.classList.toggle('cockpit-short',short);status.textContent=short?'PROJECTOR INITIALISING':'SYSTEM INITIALISING';
  GameAudio?.workshopPower(true);GameAudio?.boot(short);
  later(()=>{if(token===epoch)status.textContent='PROJECTOR ONLINE';},short?450:1700);
  later(()=>{if(token!==epoch)return;status.textContent='WELCOME, PILOT';
   const minimum=short?700:1500,started=Date.now();let leaving=false;
   const reveal=()=>{if(leaving||token!==epoch)return;leaving=true;later(()=>{if(token!==epoch)return;body.classList.add('cockpit-welcome-out');later(finish,450);},Math.max(0,minimum-(Date.now()-started)));};
   if(short)reveal();else{GameAudio?.welcome(reveal);later(reveal,4500);}
  },short?650:2350);
 }
 power.onclick=()=>start(false);document.querySelector('#boot-skip').onclick=finish;
 function open(){menu.style.visibility='hidden';menu.inert=true;if(powered){start(true);return;}overlay.hidden=false;power.hidden=false;hologram.hidden=true;body.classList.add('cockpit-awaiting');body.classList.remove('cockpit-online');}
 function close(){GameAudio?.workshopPower(false);clear();menu.style.visibility='';menu.inert=false;running=false;overlay.hidden=true;power.hidden=true;body.classList.remove('cockpit-awaiting','cockpit-online','cockpit-booting','cockpit-short','cockpit-welcome-out','beam-refresh');}
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)finish();});window.addEventListener('pagehide',close);
 return {open,close};
})();
