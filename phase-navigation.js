/* Fit the card to the existing desktop stage; preserve mobile paging in normal flow. */
(()=>{
 'use strict';
 const workspace=document.getElementById('workspace'),popup=document.getElementById('phasePopup');
 const footer=popup?.querySelector('.phase-footer'),nav=footer?.querySelector('.phase-nav');
 const content=document.getElementById('phaseContent'),photo=document.getElementById('phasePhoto');
 const text=document.getElementById('explainText'),player=document.getElementById('playerText'),title=document.getElementById('explainTitle');
 if(!workspace||!popup||!footer||!nav)return;
 workspace.classList.add('phase-navigation-ready');
 const mobile=window.matchMedia('(max-width:860px)');
 let frame,fitFrame,lastKey='';
 function fit(){
  fitFrame=null;if(popup.hidden||popup.classList.contains('choosing-phase'))return;
  const key=[mobile.matches,popup.clientWidth,popup.clientHeight,title.textContent,text.textContent,player.textContent,photo.style.getPropertyValue('--photo-ratio')].join('|');
  if(key===lastKey)return;lastKey=key;
  for(const el of [text,player,title])el.style.fontSize='';photo.style.minHeight='';photo.style.maxHeight='';
  if(mobile.matches)return;
  popup.style.minHeight='';
  const ratio=photo.style.getPropertyValue('--photo-ratio').split('/').map(Number);
  if(ratio[0]&&ratio[1])photo.style.maxHeight=(photo.clientWidth*ratio[1]/ratio[0])+'px';
  for(let size=15;size>=11;size-=.5){
   text.style.fontSize=size+'px';player.style.fontSize=size+'px';title.style.fontSize=(size>=13?24:20)+'px';
   if(content.scrollHeight<=content.clientHeight+1)break;
  }
  if(content.scrollHeight>content.clientHeight+1)photo.style.minHeight='0';
 }
 function schedule(){if(fitFrame==null)fitFrame=requestAnimationFrame(fit);}
 new ResizeObserver(schedule).observe(popup);
 const observer=new MutationObserver(schedule);
 for(const el of [title,text,player])observer.observe(el,{childList:true,subtree:true,characterData:true});
 mobile.addEventListener('change',()=>{popup.style.minHeight='';lastKey='';schedule();});
 new MutationObserver(()=>{if(popup.hidden||popup.classList.contains('choosing-phase'))popup.style.minHeight='';else schedule();}).observe(popup,{attributes:true,attributeFilter:['hidden','class']});
 schedule();
 for(const button of nav.querySelectorAll('button'))button.addEventListener('click',()=>{
  if(button.disabled||!mobile.matches)return;
  const before=button.getBoundingClientRect().top;popup.style.minHeight='';nav.setAttribute('aria-busy','true');cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   let delta=button.getBoundingClientRect().top-before;
   if(delta<0&&window.scrollY+delta<0){popup.style.minHeight=Math.ceil(popup.offsetHeight-delta-window.scrollY)+'px';delta=button.getBoundingClientRect().top-before;}
   if(Math.abs(delta)>.5)window.scrollBy({top:delta,left:0,behavior:'instant'});
   nav.setAttribute('aria-busy','false');
  });
 },{capture:true});
})();
