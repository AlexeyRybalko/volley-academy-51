/* Preserve paging position while the controls stay inside their own card. */
(()=>{
 'use strict';
 const workspace=document.getElementById('workspace'),popup=document.getElementById('phasePopup');
 const footer=popup?.querySelector('.phase-footer'),nav=footer?.querySelector('.phase-nav');
 if(!workspace||!popup||!footer||!nav)return;
 workspace.classList.add('phase-navigation-ready');
 let frame,lastWidth=window.innerWidth;
 function clear(){popup.style.minHeight='';popup.style.removeProperty('--pager-bottom');}
 window.addEventListener('resize',()=>{if(window.innerWidth!==lastWidth){lastWidth=window.innerWidth;clear();}});
 new MutationObserver(()=>{if(popup.hidden||popup.classList.contains('choosing-phase'))clear();}).observe(popup,{attributes:true,attributeFilter:['hidden','class']});
 for(const button of nav.querySelectorAll('button'))button.addEventListener('click',()=>{
  if(button.disabled)return;
  const before=button.getBoundingClientRect().top;
  popup.style.minHeight='';nav.setAttribute('aria-busy','true');cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   let delta=button.getBoundingClientRect().top-before;
   const fullscreen=document.fullscreenElement===workspace;
   const offset=fullscreen?workspace.scrollTop:window.scrollY;
   // At the top of the page there is no upward scroll room: retain just the needed space.
   if(delta<0&&offset+delta<0){
    popup.style.minHeight=Math.ceil(popup.offsetHeight-delta-offset)+'px';
    delta=button.getBoundingClientRect().top-before;
   }
   if(Math.abs(delta)>.5)(fullscreen?workspace:window).scrollBy({top:delta,left:0,behavior:'instant'});
   nav.setAttribute('aria-busy','false');
  });
 },{capture:true});
})();
