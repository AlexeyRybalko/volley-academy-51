/* Native, trainer-bounded paging. No fixed positioning or scroll-time geometry loop. */
(()=>{
 'use strict';
 const workspace=document.getElementById('workspace'),popup=document.getElementById('phasePopup');
 const nav=popup?.querySelector('.phase-nav'),board=workspace?.querySelector('.board-panel');
 if(!workspace||!popup||!nav||!board)return;
 workspace.classList.add('phase-navigation-ready');
 const toolbar=document.createElement('div');toolbar.className='phase-step-toolbar';
 toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Переключение фаз розыгрыша');
 toolbar.setAttribute('aria-busy','false');toolbar.append(nav);
 const mobile=window.matchMedia('(max-width:860px)');
 function place(){(mobile.matches?workspace:board).append(toolbar);}
 function visibility(){toolbar.hidden=popup.hidden||popup.classList.contains('choosing-phase');}
 place();visibility();
 mobile.addEventListener('change',place);
 new MutationObserver(visibility).observe(popup,{attributes:true,attributeFilter:['hidden','class']});
 let frame;
 for(const button of nav.querySelectorAll('button'))button.addEventListener('click',()=>{
  if(button.disabled)return;
  const before=button.getBoundingClientRect().top;
  toolbar.setAttribute('aria-busy','true');cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   // Keep the pressed control under the pointer after the current photo/text change.
   const delta=button.getBoundingClientRect().top-before;
   if(Math.abs(delta)>.5){
    const scroller=document.fullscreenElement===workspace?workspace:window;
    scroller.scrollBy({top:delta,left:0,behavior:'instant'});
   }
   toolbar.setAttribute('aria-busy','false');
  });
 },{capture:true});
})();
