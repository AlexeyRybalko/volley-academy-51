/* Printable A4 cheat sheet: all six rotations, receive and serve starts, from the trainer's own model. */
(()=>{
 'use strict';
 const area=document.getElementById('printArea');if(!area)return;
 const ORDER=['s','o','h1','h2','m1','m2','l'];
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function court(positions,server){
  let s='<svg viewBox="-0.9 -0.9 10.8 11.3" class="ps-court" aria-hidden="true">'
   +'<rect x="0" y="0" width="9" height="9" class="ps-floor"/><rect x="0" y="0" width="9" height="3" class="ps-front"/>'
   +'<path d="M-0.5 0H9.5" class="ps-net"/><path d="M0 3H9" class="ps-line"/>';
  for(const [z,[x,y]] of Object.entries(zoneXY))s+=`<text x="${x}" y="${y+0.55}" class="ps-zone">${z}</text>`;
  for(const id of ORDER){
   const p=positions[id];if(!p)continue;
   const dark=id==='s'||id==='l';
   s+=`<g transform="translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})"${id===server?' class="ps-server"':''}><circle r="0.72" fill="${roles[id].color}"/><text y="0.24" class="ps-j" fill="${dark?'#1d222b':'#fff'}">${roles[id].short}</text></g>`;
  }
  return s+'</svg>';
 }
 function build(){
  let rows='';
  for(let r=0;r<6;r++){
   const rec=makeModel({rotation:r,mode:'receive'}),srv=makeModel({rotation:r,mode:'serve'});
   const sz=rec.zones.s,inFront=front(sz);
   const libero=rec.replaced?`Либеро вместо ${roles[rec.replaced].short}`:'';
   const server=srv.server,serverNote=server==='m1'||server==='m2'?' (либеро вне поля)':'';
   rows+=`<div class="ps-row"><div class="ps-label"><b>Расстановка ${r+1}</b><span>связующий в зоне ${sz} · впереди ${inFront?2:3} нападающих${rec.replaced?' · либеро вместо '+esc(roles[rec.replaced].short):''}</span></div>`
    +`<figure>${court(rec.initial)}<figcaption>Мы принимаем</figcaption></figure>`
    +`<figure>${court(srv.serving,server)}<figcaption>Мы подаём · подаёт ${esc(roles[server].short)}${serverNote}</figcaption></figure></div>`;
  }
  const legend=ORDER.map(id=>`<span class="ps-chip"><i style="background:${roles[id].color};color:${id==='s'||id==='l'?'#1d222b':'#fff'}">${roles[id].short}</i>${esc(roles[id].name)}</span>`).join('');
  area.innerHTML=`<div class="ps-head"><img src="LOGO_ChERNOE-1.png" alt="Academy Volley"><div><h1>Расстановка 5&#8288;–&#8288;1</h1><p>Шпаргалка Волейбольной академии · стартовые позиции во всех 6 расстановках</p></div></div>`
   +`<div class="ps-legend">${legend}</div>`
   +`<div class="ps-grid">${rows}</div>`
   +`<div class="ps-foot"><p><b>Порядок</b> проверяется в момент удара по подаче: передний ближе к сетке, чем задний за ним; в линии соседи не меняются местами слева направо.</p>`
   +`<p><b>После приёма</b> связующий выходит к сетке между зонами 2 и 3. <b>Переход</b> — только после очка на подаче соперника: 2 → 1 → 6 → 5 → 4 → 3 → 2.</p></div>`;
 }
 function print(){build();document.body.classList.add('print-sheet');window.print();}
 for(const id of ['printSheet','printSheet2'])document.getElementById(id)?.addEventListener('click',print);
 window.addEventListener('afterprint',()=>document.body.classList.remove('print-sheet'));
})();
