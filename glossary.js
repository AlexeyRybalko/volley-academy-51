/* Glossary: volleyball terms get a dotted underline and a one-line explanation on hover, focus or tap. */
(()=>{
 'use strict';
 const terms=[
  ['tempo',/перв(?:ый|ым|ого|ому) темп(?:ом|а|е|у)?/i,'Быстрая атака центрального: он уже в прыжке, когда связующий отдаёт ему короткую низкую передачу.'],
  ['dovodka',/доводк(?:а|и|у|ой|е)/i,'Приём, после которого мяч прилетает точно к связующему у сетки.'],
  ['sbity',/(?:выбит|сбит|плох)(?:ый|ого|ом|ым) при[её]м(?:а|е|ом)?/i,'Приём, после которого мяч ушёл далеко от сетки. Быструю передачу уже не сделать, играют высоко на край.'],
  ['perekrest',/перекр[её]ст(?:а|ом|е)?/i,'Крайние нападающие сразу меняются местами, чтобы встать на свои привычные стороны.'],
  ['shortexit',/коротк(?:ий|ого|ом|им) выход(?:а|ом|е)?/i,'В расстановке 1 диагональный не бежит через всю площадку, а атакует первый мяч слева.'],
  ['cover',/страх(?:овк(?:а|и|у|ой|е)|ую(?:т)?|ует|уем|овать)/i,'Игроки окружают атакующего, чтобы поднять мяч, если он отскочит от блока.'],
  ['perimeter',/периметральн(?:ая|ой|ую) защит(?:а|ы|у|ой|е)/i,'Защитники стоят ближе к краям площадки, а середину закрывают движением. Частая схема против сильной атаки.'],
  ['zastup',/заступ(?:ом|а|у)?(?![а-яё])/i,'Нарушение ногой: наступил на линию или за неё, когда правила это запрещают.'],
  ['rotation',/переход(?:ит|ят|им)? (?:на одну (?:позицию|зону) )?по часовой стрелке/i,'После выигранного очка на чужой подаче все игроки сдвигаются на одну зону: 2 → 1 → 6 → 5 → 4 → 3 → 2.'],
  ['line3',/(?:лини(?:я|и|ю|ей) 3 м|тр[её]хметров(?:ой|ая|ую) лини(?:ей|я|и|ю))/i,'Линия в 3 метрах от сетки. Делит площадку на переднюю и заднюю зоны.'],
  ['frontline',/передн(?:яя|ей|юю) лини(?:я|и|ю|ей)/i,'Игроки в зонах 4, 3, 2 у сетки. Только они могут блокировать и атаковать мяч выше сетки откуда угодно.'],
  ['backline',/задн(?:яя|ей|юю) лини(?:я|и|ю|ей)/i,'Игроки в зонах 5, 6, 1. Блокировать не могут, атаковать выше сетки — только из-за линии 3 м.'],
  ['shadow',/тен(?:ь|и) блока/i,'Участок площадки за блоком, куда прямой удар почти не проходит.'],
  ['counter',/контратак(?:а|и|у|ой|е)/i,'Атака сразу после того, как команда отбила удар соперника.'],
  ['skidka',/скидк(?:а|и|у|ой|е)/i,'Мягкий обманный удар за блок вместо сильного.'],
  ['endline',/лицев(?:ой|ая|ую) лини(?:и|я|ю|ей)/i,'Задняя граница площадки. Из-за неё подают.'],
  ['razbeg',/разбег(?:а|е|ом)?(?![а-яё])/i,'Несколько шагов перед прыжком, чтобы выпрыгнуть выше и сильнее ударить.']
 ];
 const tips=Object.fromEntries(terms.map(([key,,tip])=>[key,tip]));
 /* Wraps the first occurrence of each term; only touches text, never markup. */
 function decorateTerms(html){
  const used=new Set();
  return String(html).split(/(<[^>]+>)/).map((part,i,parts)=>{
   if(part.startsWith('<'))return part;
   const inside=parts.slice(0,i).join('');
   if((inside.match(/<span class="term"/g)||[]).length>(inside.match(/<\/span>/g)||[]).length&&/<span class="term"[^>]*>$/.test(inside))return part;
   if(/<a\b[^>]*>$/.test(inside))return part;
   const hits=[];
   for(const [key,re] of terms){
    if(used.has(key))continue;
    const m=part.match(re);if(!m)continue;
    const a=m.index,b=a+m[0].length;
    if(hits.some(h=>a<h.b&&b>h.a))continue;
    used.add(key);hits.push({a,b,key});
   }
   hits.sort((x,y)=>y.a-x.a);
   let out=part;
   for(const h of hits)out=out.slice(0,h.a)+'<span class="term" tabindex="0" data-term="'+h.key+'">'+out.slice(h.a,h.b)+'</span>'+out.slice(h.b);
   return out;
  }).join('');
 }
 window.decorateTerms=decorateTerms;
 window.glossaryTips=tips;

 let tip;
 function show(el){
  const text=tips[el.dataset.term];if(!text)return;
  if(!tip){tip=document.createElement('div');tip.className='term-tip';tip.setAttribute('role','tooltip');document.body.append(tip);}
  tip.textContent=window.volleyTypography?.(text)||text;tip.classList.add('show');
  const r=el.getBoundingClientRect(),w=Math.min(320,window.innerWidth-24);
  tip.style.maxWidth=w+'px';
  const tw=tip.offsetWidth,th=tip.offsetHeight;
  let left=Math.max(12,Math.min(window.innerWidth-tw-12,r.left+r.width/2-tw/2));
  let top=r.top-th-10;if(top<8)top=r.bottom+10;
  tip.style.left=left+'px';tip.style.top=top+'px';
 }
 function hide(){tip?.classList.remove('show');}
 document.addEventListener('mouseover',e=>{const t=e.target.closest?.('.term');if(t)show(t);});
 document.addEventListener('mouseout',e=>{if(e.target.closest?.('.term'))hide();});
 document.addEventListener('focusin',e=>{const t=e.target.closest?.('.term');if(t)show(t);});
 document.addEventListener('focusout',e=>{if(e.target.closest?.('.term'))hide();});
 window.addEventListener('scroll',hide,{passive:true,capture:true});

 /* Static texts on the page. Each block gets each term underlined once. */
 function decorateStatic(){
  document.querySelectorAll('.notes p,.rule p,.method-content p,aside .micro,dialog ol li').forEach(el=>{
   if(el.id==='attackNote'||el.id==='cycleInfo')return;
   el.innerHTML=decorateTerms(el.innerHTML);
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateStatic);else decorateStatic();
})();
