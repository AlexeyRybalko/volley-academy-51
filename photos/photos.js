/* Photos from Academy training and games. Position chooses the action inside a fixed portrait frame.
   Originals remain in the user's Фото folder; no credit overlay is needed. */
window.academyPhotos = {
  repeatSet: {file:'repeat-set.abaa77d810.webp', width:640, height:960, position:'50% 0%', alt:'Связующий выполняет повторную передачу после защиты'},
  opponentDefense: {file:'opponent-defense.9dc1ca7550.webp', width:646, height:960, position:'50% 70%', alt:'Игроки соперника занимают позиции в защите'},
  counterattack: {file:'counterattack.675978cf1e.webp', width:640, height:960, position:'50% 15%', alt:'Атакующий удар в прыжке при контратаке'},
  opponentPrepare: {file:'opponent-attack.1305d82238.webp', width:640, height:960, position:'50% 35%', alt:'Соперник готовит атакующий удар у сетки'},
  ready: {file:'ready.a1627ea85a.webp', width:777, height:960, position:'50% 75%', alt:'Игроки команды в стойке перед подачей соперника'},
  receive: {file:'receive.e897f0d963.webp', width:640, height:960, position:'50% 0%', alt:'Приём мяча снизу на тренировке'},
  serve: {file:'serve.e2b181b785.webp', width:640, height:960, position:'50% 53%', alt:'Игрок готовится выполнить подачу'},
  set: {file:'set.e188147aac.webp', width:640, height:960, position:'50% 20%', alt:'Передача мяча двумя руками сверху'},
  attack: {file:'attack.061c500938.webp', width:640, height:960, position:'50% 43%', alt:'Нападающий атакует в прыжке у сетки'},
  cover: {file:'cover.e03d169939.webp', width:640, height:960, position:'50% 20%', alt:'Игрок поднимает мяч в падении при страховке'},
  block: {file:'block.43411cee06.webp', width:640, height:960, position:'50% 44%', alt:'Два игрока ставят организованный блок у сетки'},
  dig: {file:'dig.5bf811ad76.webp', width:652, height:960, position:'50% 50%', alt:'Защитник принимает мяч снизу во время игры в защите'},
  point: {file:'point.e896c43cb8.webp', width:640, height:960, position:'50% 62%', alt:'Команда собирается вместе после розыгрыша'},
};

/* Exact phase overrides for the rally that starts with our serve. */
window.academyServePhotos = {
  'Сбор у сетки': {file:'serve-net.a60b1a1760.webp', width:960, height:949, position:'50% 70%', alt:'Игроки собираются у сетки перед подачей'},
  'Выход в защиту': {file:'serve-defense-out.a8e57452fc.webp', width:777, height:960, position:'50% 65%', alt:'Команда выходит на позиции в защите после подачи'},
  'Касание в защите': {...window.academyPhotos.receive, alt:'Защитник касается мяча снизу'},
  'Наша передача': {file:'serve-set.5cc2d6d02b.webp', width:640, height:960, position:'50% 45%', alt:'Связующий выполняет нашу передачу после защиты'},
  'Возврат в защиту': {...window.academyPhotos.ready, alt:'Команда возвращается на позиции в защите'},
  'Атака соперника': {...window.academyPhotos.counterattack, alt:'Соперник атакует в прыжке'},
};

window.academyServePhotos['Перед своей подачей'] = window.academyServePhotos['Сбор у сетки'];
