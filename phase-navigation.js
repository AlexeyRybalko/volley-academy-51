/* Keep phase navigation under the pointer without fixing the card's content height. */
(()=>{
 'use strict';
 const popup=document.getElementById('phasePopup'),footer=popup?.querySelector('.phase-footer');
 if(!popup||!footer)return;
 const slot=document.createElement('div');slot.className='phase-footer-slot';
 footer.before(slot);slot.append(footer);
 let scheduled=false;
 const mobile=window.matchMedia('(max-width:860px)');
 function update(){
  scheduled=false;
  const rect=popup.getBoundingClientRect();
  const dock=!popup.hidden&&!popup.classList.contains('choosing-phase')&&rect.width>0&&rect.bottom>140&&rect.top<window.innerHeight-180;
  if(dock){
   const transport=document.querySelector('.transport');
   const bottom=mobile.matches?12:(transport?.offsetHeight||100)+16;
   popup.style.setProperty('--phase-nav-left',rect.left+'px');
   popup.style.setProperty('--phase-nav-width',rect.width+'px');
   popup.style.setProperty('--phase-nav-bottom',bottom+'px');
   const height=footer.offsetHeight;
   if(slot.style.height!==height+'px')slot.style.height=height+'px';
   if(!popup.classList.contains('nav-docked'))popup.classList.add('nav-docked');
  }else{
   if(popup.classList.contains('nav-docked'))popup.classList.remove('nav-docked');slot.style.height='';
  }
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule);
 window.visualViewport?.addEventListener('resize',schedule);
 new ResizeObserver(schedule).observe(popup);
 new ResizeObserver(schedule).observe(footer);
 new MutationObserver(schedule).observe(popup,{attributes:true,attributeFilter:['class','hidden','aria-busy']});
 schedule();
})();
