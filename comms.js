'use strict';
window.Comms=(()=>{
 let last='',timer=0;const original=new Image();let ready=false;
 function paint(){const c=document.querySelector('#comms-portrait');if(!ready||!c)return;c.width=600;c.height=460;c.getContext('2d').drawImage(original,470,225,300,230,0,0,600,460);}
 original.onload=()=>{ready=true;paint();};original.src='./assets/story/page3.jpg';
 function show(key){const guide=document.querySelector('#tutorial-guide');if(!guide||key===last)return;last=key;paint();clearTimeout(timer);guide.classList.remove('comms-quiet','comms-connecting');void guide.offsetWidth;guide.classList.add('comms-connecting');timer=setTimeout(()=>{guide.classList.remove('comms-connecting');guide.classList.add('comms-quiet');},12000);}
 function close(){last='';clearTimeout(timer);const guide=document.querySelector('#tutorial-guide');guide?.classList.remove('comms-connecting','comms-quiet');}
 return {show,close};
})();
