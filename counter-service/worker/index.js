const encoder=new TextEncoder();
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function dayKey(now=Date.now()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
 const part=type=>parts.find(p=>p.type===type).value;
 return part('year')+'-'+part('month')+'-'+part('day');
}
function base64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unbase64(text){const raw=atob(text.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function key(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function sign(secret,text){return base64(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(text)));}
export async function issueToken(secret,day,id,origin){
 const payload=base64(encoder.encode(JSON.stringify({day,id,origin})));
 return payload+'.'+await sign(secret,payload);
}
async function verifyToken(secret,token,origin){
 if(typeof token!=='string'||token.length>700)return null;
 const parts=token.split('.');if(parts.length!==2)return null;
 try{
  const valid=await crypto.subtle.verify('HMAC',await key(secret),unbase64(parts[1]),encoder.encode(parts[0]));
  if(!valid)return null;
  const claim=JSON.parse(new TextDecoder().decode(unbase64(parts[0])));
  return UUID.test(claim.id)&&claim.origin===origin&&/^\d{4}-\d{2}-\d{2}$/.test(claim.day)?claim:null;
 }catch{return null;}
}
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw new Error('body');
 let size=0,text='';const decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw new Error('body');}text+=decoder.decode(value,{stream:true});}
 return JSON.parse(text+decoder.decode());
}
async function total(bucket,day){
 let count=0,cursor;
 do{const page=await bucket.list({prefix:'visitors/'+day+'/',limit:1000,...(cursor?{cursor}:{})});count+=page.objects.length;cursor=page.truncated?page.cursor:undefined;}while(cursor);
 return count;
}
function reply(data,status,origin,allowed){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(origin===allowed){headers['Access-Control-Allow-Origin']=allowed;headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type';headers['Access-Control-Max-Age']='86400';}
 return new Response(status===204?null:JSON.stringify(data),{status,headers});
}
export default {async fetch(request,env){
 const allowed=env.ALLOWED_ORIGIN||'https://volley-academy-51.s3-website.cloud.ru';
 const origin=request.headers.get('Origin')||'';
 const response=(data,status=200)=>reply(data,status,origin,allowed);
 const path=new URL(request.url).pathname;
 if(request.method==='OPTIONS')return response(null,origin===allowed?204:403);
 if(request.method==='GET'&&(path==='/'||path==='/health'))return response({service:'Volley Academy daily counter',ok:true});
 if(!['/v1/today','/v1/token','/v1/visit'].includes(path))return response({error:'not_found'},404);
 if(!env.BUCKET||!env.COUNTER_SIGNING_KEY)return response({error:'not_ready'},503);
 try{
  const day=dayKey();
  if(path==='/v1/today'&&request.method==='GET')return response({day,count:await total(env.BUCKET,day),timeZone:'Europe/Moscow'});
  if(request.method!=='POST')return response({error:'method_not_allowed'},405);
  if(origin!==allowed)return response({error:'origin_not_allowed'},403);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))return response({error:'json_required'},415);
  let body;try{body=await readBody(request);}catch{return response({error:'invalid_body'},400);}
  if(path==='/v1/token'){
   if(!UUID.test(body?.id||''))return response({error:'invalid_id'},400);
   return response({day,token:await issueToken(env.COUNTER_SIGNING_KEY,day,body.id,allowed)});
  }
  if(path!=='/v1/visit')return response({error:'method_not_allowed'},405);
  const claim=await verifyToken(env.COUNTER_SIGNING_KEY,body?.token,allowed);
  if(!claim)return response({error:'invalid_token'},403);
  if(claim.day!==day)return response({error:'day_changed',day},409);
  const visitor=await sign(env.COUNTER_SIGNING_KEY,'visitor:'+day+':'+claim.id);
  // One deterministic object per anonymous browser/day; overwriting never adds a visitor.
  await env.BUCKET.put('visitors/'+day+'/'+visitor, '',{httpMetadata:{contentType:'application/octet-stream'}});
  return response({day,count:await total(env.BUCKET,day),timeZone:'Europe/Moscow'});
 }catch{return response({error:'temporarily_unavailable'},503);}
}};
