import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=readFileSync(new URL('../visitors.js',import.meta.url),'utf8');
test('Russian endings include 1–4, teens and compound numbers',()=>{
 const word=vm.runInNewContext('('+source.match(/function word\(n\)\{[^}]+\}/)[0]+')');
 for(const n of [2,3,4,22,24,102])assert.equal(word(n),'человека',String(n));
 for(const n of [0,1,5,10,11,12,13,14,19,20,21,25,100,101,111,112,114])assert.equal(word(n),'человек',String(n));
});
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
async function start({store=storage(),day='2026-11-10',fail=false,rollover=false}={}){
 const nodes={dailyAudience:{hidden:true},dailyAudienceCount:{},dailyAudiencePeople:{}};
 let refresh,registered=[],requests=[],count=12,moved=false;
 const data=()=>({day,count,timeZone:'Europe/Moscow'});
 const context={Intl,Map,Uint8Array,crypto:webcrypto,AbortController,Event,
  window:{localStorage:store,sessionStorage:store,dispatchEvent(){}},
  document:{hidden:false,getElementById:id=>nodes[id],addEventListener(){}},
  setTimeout:(fn,ms)=>{if(ms!==12000)refresh=fn;return 1;},clearTimeout(){},
  fetch:async(url,options)=>{
   const path=new URL(url).pathname;requests.push(path);
   if(fail)throw new Error('offline');
   if(path.endsWith('/today'))return {ok:true,json:async()=>data()};
   if(path.endsWith('/token')){const body=JSON.parse(options.body);registered.push(body.id);return {ok:true,json:async()=>({day,token:'signed-token'})};}
   if(rollover&&!moved){moved=true;day='2026-11-11';return {ok:false,status:409};}
   return {ok:true,json:async()=>data()};
  }};
 vm.runInNewContext(source,context);
 const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));};
 await settle();
 return {nodes,registered,requests,async refresh(){refresh();await settle();},setDay(value){day=value;}};
}
test('reload preserves daily ID, new server day rotates it',async()=>{
 const store=storage(),first=await start({store}),second=await start({store});
 assert.equal(first.registered[0],second.registered[0]);
 assert.equal(first.nodes.dailyAudience.hidden,false);
 assert.equal(first.nodes.dailyAudienceCount.textContent,'12');
 assert.equal(first.nodes.dailyAudiencePeople.textContent,'человек');
 await first.refresh();assert.equal(first.registered.length,1);
 first.setDay('2026-11-11');await first.refresh();
 assert.equal(first.registered.length,2);assert.notEqual(first.registered[0],first.registered[1]);
});
test('disabled storage retains one ID for page lifetime',async()=>{
 const broken={getItem(){throw Error();},setItem(){throw Error();}};
 const app=await start({store:broken});await app.refresh();
 assert.equal(app.registered.length,1);assert.equal(app.nodes.dailyAudience.hidden,false);
});
test('Moscow midnight between token and visit is retried with a new ID',async()=>{
 const app=await start({rollover:true});assert.equal(app.nodes.dailyAudience.hidden,false);
 assert.equal(app.registered.length,2);assert.notEqual(...app.registered);
});
test('network failure hides the badge instead of fabricating zero',async()=>{
 const app=await start({fail:true});assert.equal(app.nodes.dailyAudience.hidden,true);
 assert.equal(app.nodes.dailyAudienceCount.textContent,undefined);
});
