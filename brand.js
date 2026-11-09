/* A brief, non-blocking brand intro. The application does not depend on it. */
(()=>{
 'use strict';
 const intro=document.getElementById('academyIntro');
 if(!intro)return;
 const logo=document.getElementById('introLogo');
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const started=performance.now(),minimum=reduced?0:1900;
 let finished=false,watchdog,exitTimer;
 function dismiss(immediately=false){
 if(finished)return;
 clearTimeout(watchdog);clearTimeout(exitTimer);
 const wait=immediately?0:Math.max(0,minimum-(performance.now()-started));
 exitTimer=setTimeout(()=>{
 if(finished)return;finished=true;
 intro.classList.add('is-leaving');intro.setAttribute('aria-hidden','true');
 document.removeEventListener('keydown',onKey,true);
 setTimeout(()=>intro.remove(),reduced?0:270);
 },wait);
 }
 function onKey(event){if(event.key==='Escape'){event.preventDefault();dismiss(true);}}
 document.getElementById('skipIntro').addEventListener('click',()=>dismiss(true));
 document.addEventListener('keydown',onKey,true);
 function ready(){
 if(typeof logo?.decode==='function')logo.decode().catch(()=>{}).then(()=>dismiss());
 else dismiss();
 }
 if(logo?.complete)ready();
 else{logo?.addEventListener('load',ready,{once:true});logo?.addEventListener('error',()=>dismiss(true),{once:true});}
 // Broken or slow assets can never trap the user on the intro.
 watchdog=setTimeout(()=>dismiss(true),3200);
})();
