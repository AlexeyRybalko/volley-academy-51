/* Reorder existing controls on phones; the same elements keep their handlers. */
(()=>{
 'use strict';
 const workspace=document.getElementById('workspace');
 const popup=document.getElementById('phasePopup');
 const roster=document.querySelector('.roster-bar');
 const transport=document.querySelector('.transport');
 const popupToggle=document.getElementById('togglePopup');
 const coach=document.querySelector('.coach-panel');
 if(!workspace||!popup||!roster||!transport)return;
 const originals=[popup,roster,transport,popupToggle].map(element=>{
 const anchor=document.createComment('desktop position: '+(element.id||element.className));
 element.parentNode.insertBefore(anchor,element);return{element,anchor};
 });
 const mobile=window.matchMedia('(max-width: 860px)');
 const coachSummary=coach.querySelector('summary');
 // Handle the whole summary row explicitly on touch browsers as well.
 coachSummary.addEventListener('click',event=>{
  if(!mobile.matches)return;
  event.preventDefault();coach.open=!coach.open;
 });
 document.body.classList.toggle('no-element-fullscreen',!workspace.requestFullscreen);
 let savedOrientation=null;
 function apply(){
 if(mobile.matches){
 transport.parentNode.insertBefore(transport,roster);
 workspace.append(popup);
 coach.after(popupToggle);
 if(savedOrientation===null)savedOrientation=state.orientation;
 if(state.rosterTeam!=='home'||state.selectedTeam==='away'){updateControls();render();}
 if(state.orientation!=='vertical'){state.orientation='vertical';drawLayout();render();}
 }else{
 for(const {element,anchor}of originals)anchor.parentNode.insertBefore(element,anchor.nextSibling);
 if(savedOrientation!==null){state.orientation=savedOrientation;savedOrientation=null;drawLayout();render();}
 }
 window.dispatchEvent(new Event('resize'));
 }
 if(mobile.addEventListener)mobile.addEventListener('change',apply);else mobile.addListener(apply);
 apply();
})();
