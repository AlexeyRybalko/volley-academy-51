/* Quiz: 8 short questions built from the same rotation model the trainer uses. */
(()=>{
 'use strict';
 const dlg=document.getElementById('quizDialog');if(!dlg)return;
 const body=document.getElementById('quizBody'),progress=document.getElementById('quizProgress'),bar=document.getElementById('quizBar');
 const ROUND=8;
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
 const name=id=>roles[id].name;
 const lower=id=>roles[id].name.toLowerCase();
 const zoneCenter={4:[33,33],3:[100,33],2:[167,33],5:[33,133],6:[100,133],1:[167,133]};
 const ROT_ORDER='2 → 1 → 6 → 5 → 4 → 3 → 2';

 /* ---------- question generators ---------- */
 const gens={
  setterZone(){
   const r=Math.floor(Math.random()*6),z=zone('s',r);
   return{kind:'zone',text:`Расстановка ${r+1}. В какой зоне стоит связующий?`,correct:z,showRotation:r,open:[r,'receive'],
    explain:`Связующий в зоне ${z}. В расстановке 1 он в зоне 1, а с каждым переходом сдвигается: 1 → 6 → 5 → 4 → 3 → 2.`};
  },
  afterRotation(){
   const r=Math.floor(Math.random()*6),id=pick(['s','o','h1','h2','m1','m2']),before=zone(id,r),after=zone(id,(r+1)%6);
   return{kind:'zone',text:`Расстановка ${r+1}: ${lower(id)} стоит в зоне ${before}. Команда выиграла очко на подаче соперника. В какой зоне он окажется?`,
    correct:after,showRotation:(r+1)%6,highlight:id,open:[(r+1)%6,'serve'],
    explain:`После перехода — зона ${after}. Все сдвигаются на одну зону по часовой стрелке: ${ROT_ORDER}.`};
  },
  server(){
   const r=Math.floor(Math.random()*6),m=makeModel({rotation:r,mode:'serve'}),srv=m.server;
   const pool=['s','o','h1','h2','m1','m2'].filter(id=>id!==srv);
   const options=shuffle([srv,...shuffle(pool).slice(0,3)]).map(id=>({label:name(id),ok:id===srv}));
   const extra=srv==='m1'||srv==='m2'?' Центральный подаёт сам, либеро выйдет вместо него, когда мяч перейдёт к сопернику.':'';
   return{kind:'choice',text:`Расстановка ${r+1}, мы подаём. Кто подаёт?`,options,showRotation:r,open:[r,'serve'],
    explain:`Подаёт тот, кто стоит в зоне 1, — ${lower(srv)}.${extra}`};
  },
  frontCount(){
   const r=Math.floor(Math.random()*6),z=zone('s',r),inFront=front(z);
   return{kind:'choice',text:`Расстановка ${r+1}. Сколько нападающих в передней линии?`,showRotation:r,open:[r,'receive'],
    options:shuffle([{label:'Двое — связующий тоже впереди',ok:inFront},{label:'Трое — связующий сзади',ok:!inFront}]),
    explain:inFront?`Связующий в зоне ${z}, это передняя линия. Впереди с ним только двое нападающих.`:`Связующий в зоне ${z}, это задняя линия. Впереди сразу трое нападающих — удобно для атаки.`};
  },
  libero(){
   const r=Math.floor(Math.random()*6),m=makeModel({rotation:r,mode:'receive'}),rep=m.replaced;
   const options=shuffle(['m1','m2','h1','o'].map(id=>({label:name(id),ok:id===rep})));
   return{kind:'choice',text:`Расстановка ${r+1}, мы принимаем. Кого на задней линии заменяет либеро?`,options,showRotation:r,open:[r,'receive'],
    explain:`${name(rep)} — он сейчас в задней линии (зона ${zone(rep,r)}). Либеро всегда меняет центрального, который ушёл назад.`};
  },
  setterAfterReception:()=>({kind:'choice',text:'Мы приняли подачу. Куда бежит связующий?',open:[0,'receive'],
   options:shuffle([{label:'К сетке, между зонами 2 и 3',ok:true},{label:'В зону 6, в центр площадки',ok:false},{label:'В зону 4, к левому краю',ok:false},{label:'Остаётся на своём месте',ok:false}]),
   explain:'Связующий всегда выходит к сетке между зонами 2 и 3 — оттуда удобно отдать передачу любому нападающему.'}),
  middleAfterReception:()=>({kind:'choice',text:'Мы приняли подачу. Что делает передний центральный?',open:[0,'receive'],
   options:shuffle([{label:'Бежит на разбег в центр, к зоне 3',ok:true},{label:'Уходит в защиту в зону 6',ok:false},{label:'Принимает следующий мяч',ok:false},{label:'Идёт страховать связующего',ok:false}]),
   explain:'Центральный готовит быструю атаку в центре. Поэтому на приёме он стоит так, чтобы не мешать принимающим.'}),
  receivers:()=>({kind:'choice',text:'Кто принимает подачу в нашей схеме 5–1?',open:[0,'receive'],
   options:shuffle([{label:'Два доигровщика и либеро',ok:true},{label:'Связующий и диагональный',ok:false},{label:'Все шесть игроков',ok:false},{label:'Только либеро',ok:false}]),
   explain:'Принимают двое доигровщиков и либеро. Связующий бежит к сетке, а центральный и диагональный готовятся атаковать.'}),
  lostServe:()=>({kind:'choice',text:'Мы подавали и проиграли очко. Что дальше?',
   options:shuffle([{label:'Подаёт соперник, а мы стоим в той же расстановке',ok:true},{label:'Мы переходим по часовой стрелке',ok:false},{label:'Мы подаём ещё раз',ok:false},{label:'Команды меняются сторонами',ok:false}]),
   explain:'Переход бывает только после выигранного очка на подаче соперника. Проиграли на своей подаче — просто принимаем в той же расстановке.'}),
  backAttack:()=>({kind:'choice',text:'Диагональный в задней линии хочет ударить выше сетки. Откуда ему отталкиваться?',
   options:shuffle([{label:'Из-за линии 3 м, не наступая на неё',ok:true},{label:'Можно с самой линии 3 м',ok:false},{label:'Из передней зоны, у сетки',ok:false},{label:'Откуда угодно',ok:false}]),
   explain:'Задний игрок атакует выше сетки только с толчком из-за линии 3 м. Наступил на линию — заступ. Приземляться в передней зоне можно.'}),
  setterBlock:()=>({kind:'choice',text:'Связующий из зоны 1 вышел к сетке. Можно ли ему блокировать?',
   options:shuffle([{label:'Нет — он игрок задней линии',ok:true},{label:'Да, раз он стоит у сетки',ok:false},{label:'Да, но только вместе с центральным',ok:false}]),
   explain:'Линию игрока определяет расстановка, а не то, где он сейчас стоит. Связующий из зоны 1 — задний, блокировать ему нельзя.'}),
  tempo:()=>({kind:'choice',text:'Когда центральный может атаковать первым темпом?',
   options:shuffle([{label:'После точного приёма к сетке',ok:true},{label:'После выбитого приёма',ok:false},{label:'Только на своей подаче',ok:false},{label:'В любой момент',ok:false}]),
   explain:'Первый темп — очень быстрая атака. Нужна точная доводка, иначе связующий не успеет отдать короткую передачу.'}),
  liberoServe:()=>({kind:'choice',text:'Что из этого либеро делать нельзя?',
   options:shuffle([{label:'Блокировать',ok:true},{label:'Принимать подачу',ok:false},{label:'Защищаться в зоне 6',ok:false},{label:'Страховать нападающего',ok:false}]),
   explain:'Либеро не подаёт, не блокирует и не бьёт мяч выше сетки. Приём, защита и страховка — как раз его работа.'})
 };
 function buildRound(){
  const zoneQs=[gens.setterZone(),gens.setterZone(),gens.afterRotation()];
  const modelQs=[gens.server(),gens.frontCount(),gens.libero()];
  const staticKeys=shuffle(['setterAfterReception','middleAfterReception','receivers','lostServe','backAttack','setterBlock','tempo','liberoServe']).slice(0,ROUND-zoneQs.length-modelQs.length);
  const all=[...zoneQs,...modelQs,...staticKeys.map(k=>gens[k]())];
  // Avoid asking the same setter zone twice in a row.
  if(all[0].text===all[1].text)all[1]=gens.afterRotation();
  return shuffle(all);
 }

 /* ---------- court used for zone questions ---------- */
 const SVGNS='http://www.w3.org/2000/svg';
 function courtSvg(q,answered,chosen){
  const svg=document.createElementNS(SVGNS,'svg');svg.setAttribute('viewBox','-6 -10 212 216');svg.setAttribute('class','quiz-court');
  let html='<rect x="0" y="0" width="200" height="200" class="qc-floor"/><path d="M-4 0H204" class="qc-net"/><path d="M0 66.7H200" class="qc-line"/>';
  for(const [z,[cx,cy]] of Object.entries(zoneCenter)){
   const x=cx-33,y=cy-33,state=answered?(+z===q.correct?'ok':+z===chosen?'bad':''):'';
   html+=`<g class="qc-zone ${state}" data-zone="${z}" tabindex="${answered?-1:0}" role="button" aria-label="Зона ${z}"><rect x="${x+2}" y="${y+2}" width="62" height="62" rx="6"/><text x="${cx}" y="${cy+12}">${z}</text></g>`;
  }
  if(answered&&q.showRotation!==undefined){
   for(const id of ['s','o','h1','h2','m1','m2']){
    const [cx,cy]=zoneCenter[zone(id,q.showRotation)],dark=id==='s';
    const hi=q.highlight===id?' qc-hi':'';
    html+=`<g class="qc-player${hi}" transform="translate(${cx+18} ${cy-16})"><circle r="11" fill="${roles[id].color}"/><text y="4" fill="${dark?'#1d222b':'#fff'}">${roles[id].short}</text></g>`;
   }
  }
  svg.innerHTML=html;return svg;
 }

 /* ---------- flow ---------- */
 let round=[],index=0,score=0;
 function start(){round=buildRound();index=0;score=0;render();if(!dlg.open)dlg.showModal();}
 function setProgress(){progress.textContent=index<round.length?`Вопрос ${index+1} из ${round.length}`:'Готово';bar.style.width=(index/round.length*100)+'%';}
 function decorate(el,text){if(window.decorateTerms)el.innerHTML=window.decorateTerms(text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])));else el.textContent=text;window.applyVolleyTypography(el);}
 function render(){
  setProgress();body.replaceChildren();
  if(index>=round.length)return finish();
  const q=round[index];
  const question=document.createElement('p');question.className='quiz-question';decorate(question,q.text);body.append(question);
  const answerArea=document.createElement('div');answerArea.className='quiz-answers';body.append(answerArea);
  const feedback=document.createElement('div');feedback.className='quiz-feedback';feedback.setAttribute('aria-live','polite');body.append(feedback);
  const answer=(ok,chosen)=>{
   if(q.done)return;q.done=true;if(ok)score++;
   if(q.kind==='zone'){answerArea.replaceChildren(courtSvg(q,true,chosen));}
   else answerArea.querySelectorAll('button').forEach((b,i)=>{b.disabled=true;if(q.options[i].ok)b.classList.add('ok');else if(b.dataset.chosen)b.classList.add('bad');});
   feedback.innerHTML='';
   const verdict=document.createElement('p');verdict.className='quiz-verdict '+(ok?'ok':'bad');verdict.textContent=ok?'Верно!':'Не совсем.';
   const expl=document.createElement('p');decorate(expl,q.explain);
   const actions=document.createElement('div');actions.className='quiz-actions';
   if(q.open&&window.openMoment){const look=document.createElement('button');look.className='secondary';look.textContent='Посмотреть в тренажёре';look.onclick=()=>{dlg.close();window.openMoment(q.open[0],q.open[1]);};actions.append(look);}
   const next=document.createElement('button');next.className='primary';next.textContent=index===round.length-1?'Результат →':'Дальше →';next.onclick=()=>{index++;render();};actions.append(next);
   feedback.append(verdict,expl,actions);next.focus();
  };
  if(q.kind==='zone'){
   const svg=courtSvg(q,false);answerArea.append(svg);
   svg.querySelectorAll('.qc-zone').forEach(g=>{
    const choose=()=>answer(+g.dataset.zone===q.correct,+g.dataset.zone);
    g.addEventListener('click',choose);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
   });
   const hint=document.createElement('p');hint.className='quiz-hint';hint.textContent='Нажми на зону. Сетка сверху.';answerArea.append(hint);
  }else{
   q.options.forEach(o=>{const b=document.createElement('button');b.className='quiz-option';b.textContent=window.volleyTypography(o.label);b.onclick=()=>{b.dataset.chosen='1';answer(o.ok);};answerArea.append(b);});
  }
 }
 function finish(){
  const pct=score/round.length;
  const msg=pct===1?'Идеально! Расстановку 5–1 ты знаешь.':pct>=.75?'Отлично! Осталось чуть-чуть.':pct>=.5?'Неплохо. Загляни в тренажёр на ошибочные вопросы.':'Стоит ещё раз пройти расстановки в тренажёре — и попробовать снова.';
  body.innerHTML=`<div class="quiz-result"><p class="quiz-score">${score} из ${round.length}</p><p>${msg}</p></div>`;
  window.applyVolleyTypography(body);
  const scoreEl=body.querySelector('.quiz-score');
  if(score>0&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   const t0=performance.now(),dur=650+score*90;
   const step=now=>{const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);scoreEl.textContent=Math.round(score*e)+' из '+round.length;if(k<1)requestAnimationFrame(step);else scoreEl.classList.add('landed');};
   scoreEl.textContent='0 из '+round.length;requestAnimationFrame(step);
   setTimeout(()=>{scoreEl.textContent=score+' из '+round.length;scoreEl.classList.add('landed');},dur+120);
  }
  const actions=document.createElement('div');actions.className='quiz-actions';
  const again=document.createElement('button');again.className='primary';again.textContent='Ещё раз';again.onclick=start;
  const back=document.createElement('button');back.className='secondary';back.textContent='К тренажёру';back.onclick=()=>dlg.close();
  actions.append(back,again);body.append(actions);again.focus();
 }
 for(const id of ['openQuiz','openQuiz2'])document.getElementById(id)?.addEventListener('click',start);
 document.getElementById('closeQuiz')?.addEventListener('click',()=>dlg.close());
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
})();
