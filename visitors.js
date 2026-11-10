/* Public aggregate only. No fabricated counts and no credentials in the browser. */
(()=>{
 'use strict';
 const badge=document.getElementById('dailyAudience');
 if(!badge)return;
 const number=document.getElementById('dailyAudienceCount'),people=document.getElementById('dailyAudiencePeople');
 const endpoint='https://informer.yandex.ru/informer/114161051/json';
 const format=new Intl.NumberFormat('ru-RU');
 let timer,pending=false;
 function today(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value=type=>parts.find(p=>p.type===type).value;
  return value('year')+'.'+value('month')+'.'+value('day');
 }
 function parse(text){
  const match=text.trim().match(/^var\s+yandex_metrika_json_informer\s*=\s*(\{[\s\S]*\})\s*;?$/);
  const data=JSON.parse(match?match[1]:text);
  if(typeof data.current_date!=='string'||data.current_date.slice(0,10)!==today())return null;
  const count=typeof data.uniques==='string'&&/^\d+$/.test(data.uniques)?Number(data.uniques):data.uniques;
  return Number.isSafeInteger(count)&&count>=0?count:null;
 }
 function word(n){const a=n%100,b=n%10;return a>=11&&a<=14?'человек':b>=1&&b<=4?'человека':'человек';}
 function show(count){
  const wasHidden=badge.hidden;
  badge.hidden=count===null;
  if(count!==null){number.textContent=format.format(count);people.textContent=word(count);}
  if(wasHidden!==badge.hidden)window.dispatchEvent(new Event('resize'));
 }
 async function refresh(){
  clearTimeout(timer);
  if(pending)return;
  if(document.hidden){timer=setTimeout(refresh,30000);return;}
  pending=true;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6500);
  let count=null;
  try{
   const response=await fetch(endpoint,{mode:'cors',credentials:'omit',cache:'no-store',referrerPolicy:'origin',signal:controller.signal});
   if(!response.ok)throw new Error('Informer unavailable');
   count=parse(await response.text());
  }catch(_){/* Analytics must never interfere with the trainer. */}
  finally{clearTimeout(timeout);pending=false;}
  show(count);
  timer=setTimeout(refresh,count===null?30000:180000);
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 refresh();
})();
