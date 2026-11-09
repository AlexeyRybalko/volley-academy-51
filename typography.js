/* Keep volleyball notation and short Russian words together without changing markup. */
(()=>{
 'use strict';
 function text(value){
  return String(value)
   .replace(/(\d)[–-](?=\d)/g,'$1\u2060–\u2060')
   .replace(/(\d)[ \t]+(м|см|мм|секунд[а-яё]*|минут[а-яё]*)(?=[\s.,;:!?)]|$)/gi,'$1\u00a0$2')
   .replace(/(зон[аеуы]|зонами|расстановк[аеуи])[ \t]+(?=\d)/gi,'$1\u00a0')
   .replace(/(^|[\s(«])([вксуояаи])[ \t]+(?=\S|$)/gi,'$1$2\u00a0')
   .replace(/[ \t]+([—–])(?=[ \t])/g,'\u00a0$1');
 }
 function apply(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
   return node.parentElement?.closest('svg,script,style,select,textarea,code,pre,[contenteditable]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
  }});
  let node;while((node=walker.nextNode())){const next=text(node.data);if(next!==node.data)node.data=next;}
 }
 window.volleyTypography=text;
 window.applyVolleyTypography=apply;
 const init=()=>document.querySelectorAll('main,dialog,.intro-brand-detail').forEach(apply);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
