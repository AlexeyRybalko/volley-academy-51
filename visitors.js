/* Own daily aggregate. Metrica is not used by this banner. */
(()=>{
 'use strict';
 const badge=document.getElementById('dailyAudience');
 if(!badge)return;
 const number=document.getElementById('dailyAudienceCount'),people=document.getElementById('dailyAudiencePeople');
 const endpoint='https://volley-academy-daily-counter.alfisherntech.chatgpt.site/v1';
 const format=new Intl.NumberFormat('ru-RU'),ids=new Map();
 let timer,pending=false,registeredDay=null;
 function browserId(day){
  if(ids.has(day))return ids.get(day);
  const key='va.daily-visitor.'+day;
  for(const name of ['localStorage','sessionStorage']){
   try{const value=window[name].getItem(key);if(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)){ids.set(day,value);return value;}}catch(_){/* Storage can be disabled. */}
  }
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const id=hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  ids.set(day,id);
  for(const name of ['localStorage','sessionStorage'])try{window[name].setItem(key,id);}catch(_){}
  return id;
 }
 function valid(data){return data&&/^\d{4}-\d{2}-\d{2}$/.test(data.day)&&Number.isSafeInteger(data.count)&&data.count>=0&&data.timeZone==='Europe/Moscow';}
 function word(n){const a=n%100,b=n%10;return a>=11&&a<=14?'человек':b>=2&&b<=4?'человека':'человек';}
 // Show the count only once the day has a few visitors: a lonely "1" in the morning looks sad.
 const MIN_VISIBLE=7;
 function show(count){
  const wasHidden=badge.hidden;badge.hidden=count===null||count<MIN_VISIBLE;
  if(count!==null){number.textContent=format.format(count);people.textContent=word(count);}
  if(wasHidden!==badge.hidden)window.dispatchEvent(new Event('resize'));
 }
 async function request(path,signal,body){
  const response=await fetch(endpoint+path,{mode:'cors',credentials:'omit',cache:'no-store',referrerPolicy:'origin',signal,...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  if(!response.ok){const error=new Error('Counter unavailable');error.status=response.status;throw error;}
  return response.json();
 }
 async function audience(signal){
  // Server day avoids errors from phone clocks and handles Moscow midnight.
  for(let attempt=0;attempt<2;attempt++){
   const data=await request('/today',signal);
   if(!valid(data))throw new Error('Invalid count');
   if(registeredDay===data.day)return data.count;
   const token=await request('/token',signal,{id:browserId(data.day)});
   if(token.day!==data.day)continue;
   try{
    const result=await request('/visit',signal,{token:token.token});
    if(!valid(result)||result.day!==data.day)throw new Error('Invalid registration');
    registeredDay=result.day;return result.count;
   }catch(error){if(error.status===409)continue;throw error;}
  }
  throw new Error('Day changed');
 }
 async function refresh(){
  clearTimeout(timer);if(pending)return;
  if(document.hidden){timer=setTimeout(refresh,30000);return;}
  pending=true;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  let count=null;
  try{count=await audience(controller.signal);}catch(_){/* A counter must never interrupt the trainer or invent a number. */}
  finally{clearTimeout(timeout);pending=false;}
  show(count);timer=setTimeout(refresh,count===null?30000:180000);
 }
 badge.title='Посетители за сегодня · московское время · один браузер учитывается один раз в день';
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 refresh();
})();
