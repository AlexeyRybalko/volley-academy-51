/* Rule cards: the diagram animates while the card is hovered (or tapped on touch screens). */
(()=>{
 'use strict';
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const touch=()=>window.matchMedia?.('(hover: none)').matches;
 const start=card=>{card.classList.remove('is-animating');void card.getBoundingClientRect();card.classList.add('is-animating');};
 const stop=card=>card.classList.remove('is-animating');
 document.querySelectorAll('.rule').forEach(card=>{
  card.addEventListener('mouseenter',()=>{if(!touch())start(card);});
  card.addEventListener('mouseleave',()=>{if(!touch())stop(card);});
  card.addEventListener('focus',()=>{if(!touch())start(card);});
  card.addEventListener('blur',()=>stop(card));
  card.addEventListener('click',event=>{
   if(!touch()||event.target.closest('a'))return;
   card.classList.contains('is-animating')?stop(card):start(card);
  });
 });
})();
