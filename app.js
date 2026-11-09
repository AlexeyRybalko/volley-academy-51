'use strict';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const roles={s:{short:'С',name:'Связующий',color:'#d8a84e',start:1},o:{short:'Д',name:'Диагональный',color:'#c97b62',start:4},h1:{short:'Д1',name:'Доигровщик 1',color:'#5fa58c',start:2},h2:{short:'Д2',name:'Доигровщик 2',color:'#5fa58c',start:5},m1:{short:'Ц1',name:'Центральный 1',color:'#9a8bc9',start:3},m2:{short:'Ц2',name:'Центральный 2',color:'#9a8bc9',start:6},l:{short:'Л',name:'Либеро',color:'#ece6d8',start:0}};
const darkText=new Set(['l','s']);
const kitFor=(id,team)=>team==='away'?{fill:'#2b3546',stroke:'#c9d1de',text:'#e4e9f1',route:'#c9d1de'}:{fill:roles[id].color,stroke:'#f4f1ea',text:darkText.has(id)?'#1d222b':'#ffffff',route:roles[id].color};
const zoneXY={1:[7.4,6.7],2:[7.4,2.1],3:[4.5,2.1],4:[1.6,2.1],5:[1.6,6.7],6:[4.5,6.7]};
const state={rotation:0,mode:'receive',time:0,cycleTime:0,playing:false,selected:null,solo:false,paths:true,auto:false,speed:1,quality:'good',attack:4,opponentRotation:0,selectedTeam:'home',rosterTeam:'home',orientation:'horizontal',firstBall:'short',serveGroup:true,opponentAttack:4,popupOpen:true,showCones:false};
let model,opponent,frames,last=0,lastPhaseKey='';
let cycleStart={rotation:0,opponentRotation:0};
const rallyDuration=20,cycleDuration=240;
const clone=a=>JSON.parse(JSON.stringify(a));
const xy=p=>state.orientation==='vertical'?[110+p[0]*600/9,760+p[1]*600/9]:[720+p[1]*600/9,710-p[0]*600/9];
const mirror=p=>[9-p[0],-p[1]];
const teamXY=(p,team)=>xy(team==='away'?mirror(p):p);
const node=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.append(n);return n;};
const zone=(id,rotation=state.rotation)=>((roles[id].start-1-rotation+6)%6)+1;
const front=z=>z>=2&&z<=4;
function makeModel({rotation=state.rotation,mode=state.mode,quality=state.quality,attack:attackZone=state.attack,firstBall=state.firstBall}={}){
 const zones=Object.fromEntries(Object.keys(roles).filter(id=>id!=='l').map(id=>[id,zone(id,rotation)]));
 const backMiddle=['m1','m2'].find(id=>!front(zones[id]));
 const server=Object.keys(zones).find(id=>zones[id]===1);
 const replaced=mode==='serve'&&server===backMiddle?null:backMiddle;
 if(replaced)zones.l=zones[replaced];
 const ids=Object.keys(zones).filter(id=>id!==replaced);
 const frontOH=['h1','h2'].find(id=>front(zones[id])), backOH=['h1','h2'].find(id=>!front(zones[id]));
 const middle=['m1','m2'].find(id=>front(zones[id]));
 const shortFirst=rotation===0&&firstBall==='short';
 const backDef=replaced?'l':backMiddle;
 const baseInitial=Object.fromEntries(ids.map(id=>[id,clone(zoneXY[zones[id]])]));
 // Legal three-passer starts: two outsides + libero. Coordinates are authored
 // training examples, not a claim that all professional teams use one layout.
 const starts=[
 {s:[8.4,6.3],o:[.65,1.6],m1:[1.9,.8],h1:[7.4,5.1],h2:[1.6,6.1],l:[4.6,6.4]},
 {s:[6.3,1.9],o:[6.2,.65],m1:[7.7,.65],h1:[7.6,6.2],h2:[1.5,5.1],l:[4.4,6.4]},
 {s:[.9,1.9],o:[8,.8],m2:[.6,.65],h1:[4.5,6.3],h2:[1.8,5.1],l:[7.5,6.2]},
 {s:[.55,.8],o:[8.5,7.4],m2:[1.8,.65],h1:[1.5,6.2],h2:[7.4,5.1],l:[4.5,6.3]},
 {s:[6.2,.9],o:[6.4,7.7],m2:[7.6,.65],h1:[1.5,5.1],h2:[7.6,6.2],l:[4.4,6.2]},
 {s:[6.4,.8],o:[.8,7.6],m1:[.6,.7],h1:[1.8,5.1],h2:[4.5,6.2],l:[7.5,6.2]}
 ];
 const initial=mode==='receive'?clone(starts[rotation]):clone(baseInitial);
 const defense={};
 for(const id of ids){if(front(zones[id]))defense[id]=[id===middle?4.5:id===frontOH?1.4:7.6,1.1];else defense[id]=[id===backDef?1.7:id===backOH?4.5:7.4,id===backOH?7.1:6.1];}
 const setup=clone(defense);setup.s=quality==='good'?[6.2,1.15]:[5.3,3.8];setup[frontOH]=[.9,2.6];setup[middle]=[4.1,1.8];setup.o=front(zones.o)?[8.1,2.4]:[7.9,4.8];
 const receiving=clone(setup);
 const passers=[frontOH,backOH,backDef].sort((a,b)=>initial[a][0]-initial[b][0]);
 passers.forEach((id,i)=>receiving[id]=[[1.5,5.2],[4.5,6.2],[7.5,5.2]][i]);
 const receiver=passers[1];
 const attacker=attackZone===3?middle:attackZone===2?'o':frontOH;
 const attack=clone(setup);
 attack[attacker]=attackZone===3?[4.1,.65]:attackZone===2?[8,front(zones.o)?1:3.5]:[.8,1];
 const cover=clone(setup);
 cover[attacker]=[attackZone===2?8:attackZone===3?4.1:.9,1.4];
 cover[frontOH]=attacker===frontOH?cover[attacker]:[2.3,2.7];
 cover[middle]=attacker===middle?cover[attacker]:[attackZone===2?6.1:2.7,2.1];
 cover[backOH]=[4.5,6];cover[backDef]=[attackZone===2?6.3:2.3,4.8];cover.s=[5.9,2.7];
 // Supporting players complete their coverage movement before the hit.
 for(const id of ids)if(id!==attacker)attack[id]=clone(cover[id]);
 const block=clone(defense);block[middle]=[6.8,.65];
 const right=ids.find(id=>front(zones[id])&&id!==middle&&id!==frontOH);if(right)block[right]=[8,.65];
 const openingDefense=clone(defense);
 if(shortFirst){openingDefense.o=[1.4,1.1];openingDefense[frontOH]=[7.6,1.1];}
 const openingBlock=clone(openingDefense);openingBlock[middle]=[6.8,.65];
 const openingRight=ids.find(id=>front(zones[id])&&id!==middle&&openingDefense[id][0]>4.5);
 if(openingRight)openingBlock[openingRight]=[8,.65];
 const serving=clone(openingDefense);if(ids.includes(server))serving[server]=[8,9.45];
 const frontIds=ids.filter(id=>front(zones[id])).sort((a,b)=>zones[b]-zones[a]);
 if(state.serveGroup)frontIds.forEach((id,i)=>serving[id]=[[3.1,.85],[4.5,.85],[5.9,.85]][i]);
 // Diagrams allow markers to cross. All serving releases follow a straight
 // path to the selected opening defense, without collision-avoidance detours.
 const serveRelease=blendPose(serving,openingDefense,.5);
 const serveMoves=frontIds.map(id=>roles[id].name+' → '+(id===middle?'центр, зона 3':openingDefense[id][0]<4.5?'левый край, зона 4':'правый край, зона 2')).join('; ');
 const firstSetup=clone(setup);if(shortFirst){firstSetup.o=[.8,2.5];firstSetup[frontOH]=[8.1,2.6];}
 const firstReceiving=clone(firstSetup);
 if(mode==='receive')for(const id of [frontOH,backOH,backDef])firstReceiving[id]=clone(initial[id]);
 const firstAttacker=shortFirst?(attackZone===4?'o':attackZone===2?frontOH:middle):attacker;
 const firstAttack=clone(firstSetup);firstAttack[firstAttacker]=clone(attack[attacker]);
 const firstCover=clone(cover);
 if(shortFirst){firstCover.o=clone(cover[frontOH]);firstCover[frontOH]=clone(cover.o);}
 for(const id of ids)if(id!==firstAttacker)firstAttack[id]=clone(firstCover[id]);
 return{zones,ids,replaced,backMiddle,server,frontOH,backOH,middle,backDef,initial,setup,receiving,receiver,attacker,attack,cover,defense,block,openingDefense,openingBlock,serving,serveRelease,serveMoves,shortFirst,firstSetup,firstReceiving,firstAttacker,firstAttack,firstCover};
}
function build(){
 model=makeModel();opponent=makeModel({rotation:state.opponentRotation,mode:state.mode==='receive'?'serve':'receive',quality:'good',attack:state.opponentAttack,firstBall:state.opponentFirstBall??'short'});const m=model, target=m.setup.s;
 const frame=(t,p,b,title,explain)=>({t,p:clone(p),b,title,explain});
 const startText='Принимают два доигровщика и либеро, центральный и связующий стоят так, чтобы им не мешать. До удара по подаче важен только порядок относительно соседей. '+(state.rotation===0?'Центральный стоит у зоны 4 и после подачи бежит в центр.':'Связующий стоит ближе к месту передачи.');
 const passText='Идёт приём. Связующий выходит к месту передачи, центральный уходит из зоны приёма и готовит разбег в центре. '+(m.shortFirst?'На первый мяч диагональный остаётся слева, доигровщик — справа, чтобы не бежать через всю площадку.':'Крайние нападающие выходят к своим точкам атаки.');
 const setText=state.quality==='good'?'Приём хороший: связующий передаёт между зонами 2 и 3. Варианты атаки — передний доигровщик, центральный или диагональный. Остальные готовятся страховать.':'Приём ушёл от сетки. Связующий бежит к мячу и даёт высокую передачу на край: быструю атаку в центре с такого приёма не разыгрываем.';
 const attackText=state.attack===2&&!front(m.zones.o)?'Диагональный — игрок задней линии. Он отталкивается за трёхметровой линией и атакует справа; приземляться внутри трёхметровой зоны можно. Связующий и остальные страхуют.':state.attack===3?'Центральный атакует первым темпом — быстро, прямо у сетки. Это возможно только после точного приёма. Остальные готовятся подбирать отскок от блока.':'Передача '+(state.attack===4?'доигровщику в зону 4':'диагональному в зону 2')+'. Атакующий идёт на удар, ближайшие партнёры закрывают короткий отскок от блока, задние — дальний.';
 const defenseText='Мяч у соперника — встаём в защиту. Передний центральный смещается к блоку справа, задние закрывают площадку. Так обычно защищаются против атаки из зоны 4 соперника.';
 const digText='Мяч поднят — связующий снова выходит к сетке, нападающие отходят для разбега. Если связующий был в задней линии, то и у сетки он остаётся игроком задней линии.';
 if(state.mode==='receive')frames=[
 frame(0,m.initial,[7,-2.35],'До подачи',startText),
 frame(1,m.initial,[7,-2.35],'Удар по подаче','Соперник подал — теперь можно уходить со стартовых мест. Пунктир показывает, куда игрок побежит дальше.'),
 frame(3,m.firstReceiving,m.firstReceiving[m.receiver],'Приём',passText),
 frame(5,m.firstSetup,m.firstSetup.s,'Передача',setText+(m.shortFirst?' На первом мяче слева атакует диагональный, справа — доигровщик.':'')),
 frame(7,m.firstAttack,m.firstAttack[m.firstAttacker],'Первая атака',m.shortFirst&&state.attack!==3?'Первый мяч: '+roles[m.firstAttacker].name.toLowerCase()+' атакует '+(state.attack===4?'из зоны 4 слева':'из зоны 2 справа')+'. После этой атаки крайние меняются и дальше играют на своих обычных сторонах.':attackText),
 frame(9,m.firstCover,[2,-1.6],'Страховка','Пока партнёр атакует, остальные страхуют отскок от блока. Если соперник поднял мяч — переходим в защиту.'),
 frame(11,m.defense,[6,-.8],'Соперник готовит атаку',defenseText+(m.shortFirst?' Первая атака позади, поэтому диагональный уходит направо, доигровщик — налево.':'')),
 frame(13,m.block,[8,-.25],'Блок и защита',defenseText),
 frame(15,m.block,m.block[m.backDef],'Касание в защите','Защитники заняли свои места до удара и не двигаются, пока кто-то не коснётся мяча. После касания связующий выходит к сетке, команда готовит контратаку.'),
 frame(17,m.setup,target,'Повторная передача',setText),
 frame(19,m.attack,m.attack[m.attacker],'Контратака',attackText),
 frame(20,m.cover,[1,-2.2],'Очко нашей команды','Допустим, розыгрыш наш. Мы выиграли очко на чужой подаче, поэтому подаём теперь мы и переходим на одну позицию по часовой стрелке. В полном круге дальше начнётся розыгрыш с нашей подачи.')];
 else frames=[
 frame(0,m.serving,m.serving[m.server],state.serveGroup?'Сбор у сетки':'Перед своей подачей','Подаёт '+roles[m.server].name.toLowerCase()+'. '+(state.serveGroup?'Три игрока передней линии собрались у сетки. После удара они выйдут в защиту: '+m.serveMoves+'. ':'Игроки заранее стоят на местах в защите. ')+''),
 frame(2,m.serving,m.serving[m.server],'Наша подача','Подающий бьёт из-за лицевой линии и сразу заходит в площадку. Передняя линия готовится к блоку.'),
 frame(3,m.serveRelease,interpolate(m.serving[m.server],[2,-1.6],.5),'Выход в защиту','После подачи каждый идёт прямо на своё место: '+m.serveMoves+'. На схеме кружки могут пересекаться — это упрощение.'),
 frame(4,m.openingDefense,[2,-1.6],'Приём соперника','Соперник принимает. Наш подающий уже на площадке; команда следит, куда пойдёт передача, и готовится к блоку.'),
 frame(6,m.openingDefense,[6,-.8],'Передача соперника',defenseText),
 frame(8,m.openingBlock,[8,-.25],'Блок и защита',defenseText),
 frame(10,m.openingBlock,m.openingBlock[m.backDef],'Касание в защите','Защитник поднимает мяч. Только после этого касания команда начинает готовить контратаку.'),
 frame(12,m.firstSetup,m.firstSetup.s,'Наша передача',setText+(m.shortFirst?' Первый выход: диагональный слева, доигровщик справа.':'')),
 frame(14,m.firstAttack,m.firstAttack[m.firstAttacker],'Наша атака',m.shortFirst&&state.attack!==3?'Первая атака после нашей подачи: '+roles[m.firstAttacker].name.toLowerCase()+' играет '+(state.attack===4?'слева в зоне 4':'справа в зоне 2')+'. Когда вернёмся в защиту, крайние поменяются сторонами.':attackText),
 frame(16,m.firstCover,[2,-1.6],'Страховка','Пока партнёр атакует, остальные страхуют. Соперник поднял мяч — возвращаемся в защиту.'),
 frame(18,m.defense,[6,-.8],'Возврат в защиту',defenseText+(m.shortFirst?' Первая атака позади, и только теперь диагональный переходит слева направо.':'')),
 frame(20,m.block,[8,7.8],'Очко соперника','Допустим, розыгрыш выиграл соперник. Подавать теперь ему, а мы принимаем в той же расстановке: переход не нужен.')];
 addOpponentFrames();applyDirectionalDefense();updateControls();render();
}
function blendPose(a,b,u){return Object.fromEntries(Object.keys(a).map(id=>[id,interpolate(a[id],b[id],u)]));}
function blockAgainst(tm,base,hitX){
 const block=clone(base),attackX=9-hitX;
 block[tm.middle]=[Math.max(.8,Math.min(8.2,attackX+(attackX<4.5?1.25:-1.25))),.65];
 const wing=tm.ids.filter(id=>front(tm.zones[id])&&id!==tm.middle).sort((a,b)=>Math.abs(base[a][0]-attackX)-Math.abs(base[b][0]-attackX))[0];
 block[wing]=[Math.max(.8,Math.min(8.2,attackX)),.65];return block;
}
function addOpponentFrames(){
 const o=opponent,r=o.backDef;
 const firstBlock=blockAgainst(o,o.openingDefense,model.firstAttack[model.firstAttacker][0]);
 const normalBlock=blockAgainst(o,o.defense,model.attack[model.attacker][0]);
 if(state.mode==='receive'){
 const serverBall=mirror(o.serving[o.server]),passBall=model.firstReceiving[model.receiver];
 frames.push({t:2,p:blendPose(model.initial,model.firstReceiving,.5),op:clone(o.serveRelease),b:interpolate(serverBall,passBall,.5),title:'Соперник выходит в защиту',explain:'После своей подачи соперник идёт прямо на игровые позиции: '+o.serveMoves+'. Наша команда в это время принимает.'});
 frames.sort((a,b)=>a.t-b.t);
 const poses={0:o.serving,1:o.serving,2:o.serveRelease,3:o.openingDefense,5:o.openingDefense,7:firstBlock,9:firstBlock,11:o.firstSetup,13:o.firstAttack,15:o.firstCover,17:o.defense,19:normalBlock,20:normalBlock};
 const balls={0:serverBall,1:serverBall,9:mirror(firstBlock[r]),11:mirror(o.firstSetup.s),13:mirror(o.firstAttack[o.firstAttacker]),20:mirror([1.4,7.8])};
 for(const f of frames){f.op=clone(poses[f.t]);if(balls[f.t])f.b=balls[f.t];}
 if(state.serveGroup)frames[0].explain+=' Трое передних соперника стоят у сетки.';
 }else{
 // The receiving opponent has completed its first attack before our attack,
 // so it uses normal defensive sides for the rest of this rally.
 const poses={0:o.initial,2:o.initial,3:blendPose(o.initial,o.firstReceiving,.5),4:o.firstReceiving,6:o.firstSetup,8:o.firstAttack,10:o.firstCover,12:o.defense,14:normalBlock,16:normalBlock,18:o.setup,20:o.attack};
 const contact=mirror(o.firstReceiving[o.receiver]);
 const balls={3:interpolate(model.serving[model.server],contact,.5),4:contact,6:mirror(o.firstSetup.s),8:mirror(o.firstAttack[o.firstAttacker]),16:mirror(normalBlock[r]),18:mirror(o.setup.s)};
 for(const f of frames){f.op=clone(poses[f.t]);if(balls[f.t])f.b=balls[f.t];}
 }
}
// Perimeter-style teaching example: back-row lanes stay assigned by role.
// The pin block channels the attack; its off-blocker covers the short ball.
// These coordinates are an authored model, not the only correct team system.
function attackGeometry(hit){
 const source=[9-hit[0],-Math.max(.4,hit[1])],x=source[0],blockY=.65;
 // Effective hand screen: a closed pin block leaves the line open and
 // channels the ball around its inner edge. Heights are not simulated.
 const band=x>6?[x-1.2,x-.2]:x<3?[x+.2,x+1.2]:[x-.35,x+.35];
 const edge=(bx,y)=>x+(bx-x)*(y-source[1])/(blockY-source[1]);
 return{source,blockY,band,leftAt:y=>edge(band[0],y),rightAt:y=>edge(band[1],y)};
}
function clipCourt(polygon){
 let points=polygon;
 for(const [axis,bound,sign]of [[0,0,1],[0,9,-1],[1,0,1],[1,9,-1]]){
 const output=[];if(!points.length)break;
 const inside=p=>(p[axis]-bound)*sign>=-1e-8;
 for(let i=0;i<points.length;i++){
 const a=points[i],b=points[(i+1)%points.length],ia=inside(a),ib=inside(b);
 if(ia)output.push(a);
 if(ia!==ib){const t=(bound-a[axis])/(b[axis]-a[axis]);output.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
 }
 points=output;
 }
 return points;
}
function conePolygons(g){
 const [x,y]=g.source,far=12,spreadY=2.8;
 const ray=targetX=>[x+(targetX-x)*(far-y)/(spreadY-y),far];
 const fan=clipCourt([g.source,ray(0),ray(9)]);
 const shadow=clipCourt([[g.band[0],g.blockY],[g.band[1],g.blockY],[g.rightAt(far),far],[g.leftAt(far),far]]);
 return{fan,shadow};
}
function drawAttackCones(frame){
 $('attackCones').replaceChildren();const context=frame.cone,active=!!context&&state.time<=context.end+1e-8;
 $('coneLegend').hidden=!state.showCones;
 if(active)$('coneLegend').innerHTML='<i class="sw sw-fan"></i>сектор удара<i class="sw sw-shadow"></i>тень блока<i class="sw sw-ray"></i>коридоры';else $('coneLegend').textContent='Секторы появятся перед атакой';
 if(state.orientation==='vertical'&&active&&context.team==='away'){
 $('coneLegend').textContent='Секторы соперника — в горизонтальном виде';return;
 }
 if(!state.showCones||!active)return;
 const {team,d}=context,g=d.geometry,shapes=conePolygons(g);
 const project=poly=>poly.map(p=>teamXY(p,team).join(',')).join(' ');
 node('polygon',{points:project(shapes.fan),class:'attack-fan'},$('attackCones'));
 node('polygon',{points:project(shapes.shadow),class:'block-shadow'},$('attackCones'));
 const [sx,sy]=teamXY(g.source,team);
 for(const [id,job]of Object.entries(d.jobs))if(/Линия|Диагональ|коридор/.test(job)&&!front((team==='home'?model:opponent).zones[id])){
 const [x,y]=teamXY(d.p[id],team);node('path',{d:`M${sx} ${sy}L${x} ${y}`,class:'attack-ray','marker-end':'url(#arrow)'},$('attackCones'));
 }
 const [lx,ly]=teamXY([g.band[0],g.blockY],team),[rx,ry]=teamXY([g.band[1],g.blockY],team);
 node('path',{d:`M${lx} ${ly}L${rx} ${ry}`,class:'block-screen'},$('attackCones'));
}
function defenseForHit(tm,base,hit){
 const p=clone(base),jobs={},geometry=attackGeometry(hit);
 const back=tm.ids.filter(id=>!front(tm.zones[id])).sort((a,b)=>base[a][0]-base[b][0]);
 const wings=tm.ids.filter(id=>front(tm.zones[id])&&id!==tm.middle).sort((a,b)=>base[a][0]-base[b][0]);
 const [left,deep,right]=back,[leftWing,rightWing]=wings;
 const lane=geometry.source[0];
 if(lane>6){
 p[left]=[Math.max(.85,Math.min(2.7,geometry.leftAt(5.7)-.65)),5.7];p[deep]=[4.9,7.8];p[right]=[Math.max(8.1,Math.min(8.5,geometry.rightAt(6.1)+.55)),6.1];
 p[tm.middle]=[6.65,.65];p[rightWing]=[7.9,.65];p[leftWing]=[1.5,3.0];
 jobs[left]='Диагональ · край блока';jobs[deep]='Глубина · зона 6';jobs[right]='Линия · зона 1';
 jobs[tm.middle]='Блок · закрыть стык';jobs[rightWing]='Блок · край';jobs[leftWing]='Короткая диагональ';
 }else if(lane<3){
 p[left]=[Math.min(.9,Math.max(.5,geometry.leftAt(6.1)-.55)),6.1];p[deep]=[4.1,7.8];p[right]=[Math.min(8.15,Math.max(6.3,geometry.rightAt(5.7)+.65)),5.7];
 p[tm.middle]=[2.35,.65];p[leftWing]=[1.1,.65];p[rightWing]=[7.5,3.0];
 jobs[left]='Линия · зона 5';jobs[deep]='Глубина · зона 6';jobs[right]='Диагональ · край блока';
 jobs[tm.middle]='Блок · закрыть стык';jobs[leftWing]='Блок · край';jobs[rightWing]='Короткая диагональ';
 }else{
 p[left]=[1.35,6.1];p[deep]=[4.5,7.9];p[right]=[7.65,6.1];
 p[tm.middle]=[lane,.65];p[leftWing]=[1.7,2.8];p[rightWing]=[7.3,2.8];
 jobs[left]='Левый коридор';jobs[deep]='Глубина · зона 6';jobs[right]='Правый коридор';
 jobs[tm.middle]='Блок · центр';jobs[leftWing]='Скидка слева';jobs[rightWing]='Скидка справа';
 }
 const description=lane>6?'Атака соперника из зоны 4: ':lane<3?'Атака соперника из зоны 2: ':'Атака соперника из центра: ';
 const duties=back.map(id=>roles[id].name+' — '+jobs[id].toLowerCase()).join('; ');
 return{p,jobs,geometry,description:description+duties+'. Передний, который не блокирует, закрывает короткий мяч. Это периметральная защита — один из нескольких вариантов.'};
}
function applyDirectionalDefense(){
 const get=t=>frames.find(f=>f.t===t);
 const ready=(team,times,tm,base,hit)=>{
 const d=defenseForHit(tm,base,hit),field=team==='home'?'p':'op',key=team==='home'?'homeJobs':'awayJobs';
 // Blockers wait in their base spots until the setter has released the ball: nobody knows where the set goes before that.
 const waiting=clone(d.p);for(const id of Object.keys(d.jobs||{}))if(/^Блок/.test(d.jobs[id])&&base[id])waiting[id]=clone(base[id]);
 times.forEach((t,i)=>{const f=get(t);f[field]=clone(i===0?waiting:d.p);f[key]=d.jobs;f.cone={team,d,end:times[times.length-1]};});
 d.waiting=waiting;
 return d;
 };
 if(state.mode==='receive'){
 const first=ready('away',[5,7,9],opponent,opponent.openingDefense,model.firstAttack[model.firstAttacker]);
 get(9).b=mirror(first.p[opponent.backDef]);
 const ours=ready('home',[11,13,15],model,model.defense,opponent.firstAttack[opponent.firstAttacker]);
 get(11).explain=ours.description+' Блокирующие ждут в центре, пока соперник не отдал передачу.';get(13).explain=ours.description+' Удар. Пока мяч никто не коснулся, защитники стоят на местах.';
 get(15).b=ours.p[model.backDef];
 ready('away',[17,19,20],opponent,opponent.defense,model.attack[model.attacker]);
 }else{
 const ours=ready('home',[6,8,10],model,model.openingDefense,opponent.firstAttack[opponent.firstAttacker]);
 get(6).explain=ours.description+' Блокирующие ждут в центре и стартуют к блоку, только когда связующий соперника отдал передачу.';get(8).explain=ours.description+' Удар. Пока мяч никто не коснулся, защитники стоят на местах.';get(10).b=ours.p[model.backDef];
 const theirs=ready('away',[12,14,16],opponent,opponent.defense,model.firstAttack[model.firstAttacker]);get(16).b=mirror(theirs.p[opponent.backDef]);
 const last=ready('home',[18,20],model,model.defense,opponent.attack[opponent.attacker]);
 get(18).explain=last.description+' Блокирующие ждут передачу соперника, а потом смещаются к месту атаки.';
 frames.push({t:19,p:clone(last.p),op:clone(opponent.attack),b:mirror(opponent.attack[opponent.attacker]),title:'Атака соперника',explain:last.description+' Удар. Защитники уже на местах и не двигаются, пока мяч летит.',homeJobs:last.jobs,cone:get(18).cone});
 get(20).op=clone(opponent.cover);frames.sort((a,b)=>a.t-b.t);
 }
}
function updateControls(){
 $('receive').classList.toggle('active',state.mode==='receive');$('serve').classList.toggle('active',state.mode==='serve');
 $('receive').setAttribute('aria-pressed',state.mode==='receive');$('serve').setAttribute('aria-pressed',state.mode==='serve');
 $('rotations').replaceChildren();for(let r=0;r<6;r++){const b=document.createElement('button');b.textContent=r+1;b.className=r===state.rotation?'active':'';b.setAttribute('aria-label','Расстановка '+(r+1));b.setAttribute('aria-pressed',r===state.rotation);b.onclick=()=>{if(state.auto){const chapter=(r-cycleStart.rotation+6)%6;seek(chapter*40+(state.mode==='receive'?20:0));}else{state.rotation=r;restart();}};$('rotations').append(b);}
 $('rotationTitle').textContent='Связующий в зоне '+model.zones.s;
 $('openingChoice').hidden=state.rotation!==0;
 $('firstBall').checked=state.firstBall==='short';
 $('opponentOpeningChoice').hidden=state.opponentRotation!==0;$('openingGroup').hidden=state.rotation!==0&&state.opponentRotation!==0;
 $('opponentFirstBall').checked=(state.opponentFirstBall??'short')==='short';
 $('rotationNote').textContent=(front(model.zones.s)?'Передняя линия · 2 нападающих впереди':'Задняя линия · 3 нападающих впереди')+(model.replaced?' · либеро вместо Ц'+model.replaced.slice(1):' · центральный подаёт, либеро вне поля');
 $('rowInfo').textContent='Связующий на '+(front(model.zones.s)?'передней':'задней')+' линии';
 $('attackNote').textContent=model.shortFirst?'На первую атаку диагональный остаётся слева, доигровщик — справа. Потом, при возврате в защиту, они меняются.':state.quality==='bad'?'С выбитого приёма — высокая передача на край.':state.attack===2&&!front(model.zones.o)?'Диагональный сзади: отталкивание за линией 3 м.':'На приёме — два доигровщика и либеро.';
 $('attack').querySelector('[value="3"]').disabled=state.quality==='bad';
 $('opponentRotation').value=state.opponentRotation;
 $('teamHome').classList.toggle('active',state.rosterTeam==='home');$('teamAway').classList.toggle('active',state.rosterTeam==='away');
 $('teamHome').setAttribute('aria-pressed',state.rosterTeam==='home');$('teamAway').setAttribute('aria-pressed',state.rosterTeam==='away');
 const rosterModel=state.rosterTeam==='away'?opponent:model;
 $('roster').replaceChildren();for(const [id,r]of Object.entries(roles)){
 const b=document.createElement('button');b.dataset.player=id;b.className=state.selected===id&&state.selectedTeam===state.rosterTeam?'selected':'';b.setAttribute('aria-pressed',state.selected===id&&state.selectedTeam===state.rosterTeam);
 const sw=document.createElement('span');sw.className='role-swatch';{const k=kitFor(id,state.rosterTeam);sw.style.background=k.fill;sw.style.color=k.text;sw.style.boxShadow='inset 0 0 0 2px '+k.stroke;}sw.textContent=r.short;
 const title=document.createElement('span');title.textContent=r.name;
 const row=document.createElement('span');row.className='row';row.textContent=rosterModel.ids.includes(id)?(front(rosterModel.zones[id])?'ПЕРЕДНЯЯ':'ЗАДНЯЯ'):'ВНЕ ПОЛЯ';
 b.title=r.name;b.setAttribute('aria-label',r.name);b.append(sw,title,row);b.onclick=()=>selectPlayer(id,state.rosterTeam);const team=state.rosterTeam;const on=()=>{hoverPlayer={id,team};render();},off=()=>{if(hoverPlayer&&hoverPlayer.id===id){hoverPlayer=null;render();}};b.addEventListener('mouseenter',on);b.addEventListener('mouseleave',off);b.addEventListener('focus',on);b.addEventListener('blur',off);$('roster').append(b);
 }
 $('phaseButtons').replaceChildren();frames.forEach((f,i)=>{if(i===frames.length-1||i===1)return;const b=document.createElement('button');b.textContent=f.title;b.dataset.t=f.t;b.onclick=()=>{pause();seek((state.auto?Math.min(11,Math.floor(state.cycleTime/20))*20:0)+f.t);};$('phaseButtons').append(b);});
 const labels=$('timelineLabels');labels.replaceChildren();labels.classList.toggle('full-cycle',state.auto);
 const names=state.auto?Array.from({length:6},(_,i)=>'Р'+((cycleStart.rotation+i)%6+1)+' · '+formatTime(i*40)):(state.mode==='receive'?['Расстановка','Наша атака','Защита','Контратака']:['Подача','Защита','Наша атака','Соперник']);
 names.forEach((name,i)=>{const n=document.createElement('span');n.textContent=name;n.dataset.chapter=i;labels.append(n);});
 $('cycleInfo').hidden=!state.auto;
 $('timeline').max=state.auto?cycleDuration:rallyDuration;
}
function selectPlayer(id,team='home'){state.selected=state.selected===id&&state.selectedTeam===team?null:id;state.selectedTeam=team;state.rosterTeam=team;if(!state.selected){state.solo=false;$('solo').checked=false;}updateControls();render();}
function formatTime(t){const s=Math.floor(t);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function restart(){state.time=0;state.cycleTime=0;if(state.auto){cycleStart={rotation:state.rotation,opponentRotation:state.opponentRotation};state.mode='serve';}build();}
function seek(value){
 if(!state.auto){state.time=Math.max(0,Math.min(rallyDuration,value));render();return;}
 const t=Math.max(0,Math.min(cycleDuration,value)),segment=Math.min(11,Math.floor(t/rallyDuration)),chapter=Math.floor(segment/2);
 const rotation=(cycleStart.rotation+chapter)%6,opponentRotation=(cycleStart.opponentRotation+Math.floor((segment+1)/2))%6,mode=segment%2?'receive':'serve';
 const changed=state.rotation!==rotation||state.opponentRotation!==opponentRotation||state.mode!==mode;
 state.cycleTime=t;state.time=t-segment*rallyDuration;state.rotation=rotation;state.opponentRotation=opponentRotation;state.mode=mode;
 if(changed)build();else render();
}
function pause(){state.playing=false;$('play').textContent='▶';$('play').setAttribute('aria-label','Воспроизвести');}
function toggle(){if((state.auto?state.cycleTime:state.time)>=(state.auto?cycleDuration:rallyDuration))seek(0);state.playing=!state.playing;$('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Пауза':'Воспроизвести');}
function interpolate(a,b,u){const e=u*u*(3-2*u);return[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e];}
const labelMemory=new Map();
/* Labels keep their side unless it collides; when they must switch they fade out and back in instead of jumping. */
function placeLabel(x,y,name,markers,placed,key){
 const prev=labelMemory.get(key);
 const width=name.length*10.5;
 const candidates=[53,-46,80,-73,107,-100].map((dy,i)=>{
 const box={left:x-width/2,right:x+width/2,top:y+dy-19,bottom:y+dy+5};let cost=i*.2;
 for(const [cx,cy]of markers){const dx=Math.max(box.left-cx,0,cx-box.right),dy=Math.max(box.top-cy,0,cy-box.bottom);if(dx*dx+dy*dy<34*34)cost+=100;}
 for(const b of placed)if(box.left<b.right+5&&box.right>b.left-5&&box.top<b.bottom+4&&box.bottom>b.top-4)cost+=100;
 const vert=state.orientation==='vertical';if(vert?(box.top<768&&box.bottom>752):(box.left<726&&box.right>714))cost+=40;
 if(prev&&dy===prev.side)cost-=1.5;
 return{dy,box,cost};
 });
 candidates.sort((a,b)=>a.cost-b.cost);const best=candidates[0];placed.push(best.box);
 let side=prev?prev.side:best.dy,opacity=prev?prev.opacity:1;
 if(!state.playing){side=best.dy;opacity=1;}
 else if(best.dy!==side){opacity-=.2;if(opacity<=0){side=best.dy;opacity=0;}}
 else opacity=Math.min(1,opacity+.14);
 labelMemory.set(key,{side,opacity});
 return{y:side,opacity};
}
function render(){
 let index=frames.findLastIndex(f=>f.t<=state.time);if(index<0)index=0;
 const a=frames[index],b=frames[Math.min(index+1,frames.length-1)],u=b.t===a.t?0:(state.time-a.t)/(b.t-a.t);
 $('players').replaceChildren();$('routes').replaceChildren();$('ball').replaceChildren();$('opponents').replaceChildren();$('target').replaceChildren();drawAttackCones(a);
 const markerPositions=[],placedLabels=[],visibleTeams=state.orientation==='vertical'?['home']:['away','home'];
 for(const team of visibleTeams){const tm=team==='away'?opponent:model,pa=team==='away'?a.op:a.p,pb=team==='away'?b.op:b.p;for(const id of tm.ids){if(state.solo&&state.selected&&!(state.selected===id&&state.selectedTeam===team))continue;markerPositions.push(teamXY(livePos(team,id,interpolate(pa[id],pb[id],u)),team));}}
 for(const team of visibleTeams){
 const tm=team==='away'?opponent:model,pa=team==='away'?a.op:a.p,pb=team==='away'?b.op:b.p;
 const[tx,ty]=teamXY(tm.setup.s,team);node('circle',{cx:tx,cy:ty,r:34,fill:'none',stroke:'#ffffff','stroke-dasharray':'5 7',opacity:.55},$('target'));
 for(const id of tm.ids){
 const selected=state.selected===id&&state.selectedTeam===team;
 if(state.solo&&state.selected&&!selected)continue;
 const r=roles[id],p=livePos(team,id,interpolate(pa[id],pb[id],u)),[x,y]=teamXY(p,team),dim=state.selected&&!selected;
 const kit=kitFor(id,team),color=kit.route||kit.stroke;
 if(state.paths&&(!state.selected||selected)){
 const[startX,startY]=teamXY(pa[id],team),[endX,endY]=teamXY(pb[id],team);
 if(Math.hypot(endX-startX,endY-startY)>5)node('path',{d:`M${startX} ${startY}L${endX} ${endY}`,class:'route',stroke:color,'marker-end':'url(#arrow)'},$('routes'));
 }
 const g=node('g',{transform:`translate(${x},${y})`,class:'player-node '+team,tabindex:0,role:'button','aria-label':(team==='away'?'Соперник: ':'Наша команда: ')+r.name+', '+(front(tm.zones[id])?'передняя':'задняя')+' линия','aria-pressed':selected,opacity:dim?.18:1},$(team==='away'?'opponents':'players'));
 if(selected)node('circle',{r:36,fill:'none',stroke:color,'stroke-width':3},g);
 if(hoverPlayer&&hoverPlayer.id===id&&hoverPlayer.team===team){const k=(Math.sin(performance.now()/170)+1)/2;node('circle',{r:38+k*7,fill:'none',stroke:'#f4f1ea','stroke-width':3,opacity:.9-k*.55,class:'hover-ring'},g);}
 node('circle',{r:31,fill:'#0b1220',opacity:.3,cy:3},g);node('circle',{r:28,fill:kit.fill,stroke:kit.stroke,'stroke-width':3,class:'jersey'},g);
 const t=node('text',{'text-anchor':'middle',y:7,class:'player-letter',style:'fill:'+kit.text},g);t.textContent=r.short;
 const spot=placeLabel(x,y,r.name,markerPositions,placedLabels,team+':'+id);const label=node('text',{'text-anchor':'middle',y:spot.y,opacity:spot.opacity,class:'player-name'},g);label.textContent=r.name;
 const job=(!a.cone||state.time<=a.cone.end+1e-8)?(team==='home'?a.homeJobs:a.awayJobs)?.[id]:null;
 if(job){const badge=node('text',{'text-anchor':'middle',y:-40,class:'defense-label'},g);badge.textContent=job;}
 g.onclick=()=>selectPlayer(id,team);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPlayer(id,team);}};
 }
 }
 const bp=interpolate(a.b,b.b,u),[bx,by]=xy(bp);node('ellipse',{cx:bx+3,cy:by+16,rx:13,ry:5,fill:'#0b1220',opacity:.35},$('ball'));node('circle',{cx:bx,cy:by,r:21,class:'ball-halo'},$('ball'));node('use',{href:'#vball',x:bx-16,y:by-16,width:32,height:32,class:'ball-icon'},$('ball'));
 $('timeline').value=state.auto?state.cycleTime:state.time;$('timeline').style.setProperty?.('--progress',(100*Number($('timeline').value)/Number($('timeline').max||20))+'%');$('timeLabel').textContent=formatTime(state.auto?state.cycleTime:state.time)+' / '+formatTime(state.auto?cycleDuration:rallyDuration);$('phaseTitle').textContent=(state.auto?'Р'+(state.rotation+1)+' · ':'')+a.title;$('explainTitle').textContent=a.title;setRoleText($('explainText'),a.explain);
 let info='';if(state.selected){const id=state.selected,r=roles[id],tm=state.selectedTeam==='away'?opponent:model,prefix=state.selectedTeam==='away'?'Соперник · ':'Наша команда · ';if(!tm.ids.includes(id))info=prefix+r.name+': вне площадки. '+(id==='l'?'Центральный сейчас подаёт сам, либеро выйдет вместо него на следующем приёме.':'На задней линии вместо него играет либеро.');else info=prefix+r.name+' · зона '+tm.zones[id]+' · '+(front(tm.zones[id])?'передняя':'задняя')+' линия. '+(id==='s'?'Выходит на вторую передачу.':id==='l'?'Приём, защита и страховка.':id===tm.attacker?'Завершает атаку этой команды.':front(tm.zones[id])?'Атака, блок и страховка.':'Приём, защита и страховка.');}
 const selectedJob=(!a.cone||state.time<=a.cone.end+1e-8)?(state.selectedTeam==='home'?a.homeJobs:a.awayJobs)?.[state.selected]:null;
 if(selectedJob)info+=' Задача в защите: '+selectedJob.toLowerCase()+'.';
 if(state.orientation==='vertical'&&state.selectedTeam==='away'&&state.selected)info+=' Чтобы увидеть этого игрока, переключись на горизонтальный вид: сейчас показана только наша половина.';
 setRoleText($('playerText'),info);
 $('phaseCount').textContent=(index+1)+' / '+frames.length;
 for(const chapter of $('timelineLabels').children)chapter.classList.toggle('current',state.auto&&Number(chapter.dataset.chapter)===Math.min(5,Math.floor(state.cycleTime/40)));
 const phaseKey=state.rotation+':'+state.mode+':'+index;
 if(phaseKey!==lastPhaseKey){touchRipple(a);
 lastPhaseKey=phaseKey;showPhasePhoto(a.title);
 animatePhaseCard();
 }
 $('previousPhase').disabled=!state.auto&&state.time===0;
 $('nextPhase').disabled=!state.auto&&state.time>=20;
 document.querySelectorAll('#phaseButtons button').forEach(n=>n.classList.toggle('active',Number(n.dataset.t)===a.t));
}
function tick(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.1);last=now;if(state.playing){if(state.auto)seek((state.cycleTime+dt*state.speed)%cycleDuration);else{state.time=Math.min(rallyDuration,state.time+dt*state.speed);if(state.time>=rallyDuration)pause();render();}}else if(blend||hoverPlayer)render();requestAnimationFrame(tick);}
$('play').onclick=toggle;$('reset').onclick=()=>{pause();seek(0);};$('timeline').oninput=e=>{pause();seek(+e.target.value);};$('speed').onchange=e=>state.speed=+e.target.value;
for(const mode of ['receive','serve'])$(mode).onclick=()=>{if(state.auto)seek(Math.min(5,Math.floor(state.cycleTime/40))*40+(mode==='receive'?20:0));else{state.mode=mode;restart();}};
$('quality').onchange=e=>{state.quality=e.target.value;if(state.quality==='bad'&&state.attack===3){state.attack=4;$('attack').value='4';}build();};$('attack').onchange=e=>{state.attack=+e.target.value;build();};
$('paths').onchange=e=>{state.paths=e.target.checked;render();};
$('labels').onchange=e=>{document.body.classList.toggle('no-labels',!e.target.checked);};$('auto').onchange=e=>{state.auto=e.target.checked;if(state.auto)restart();else{state.cycleTime=state.time;updateControls();render();}};
$('solo').onchange=e=>{state.solo=e.target.checked;if(state.solo&&!state.selected)state.selected='s';updateControls();render();};
$('clear').onclick=()=>{state.selected=null;state.solo=false;$('solo').checked=false;updateControls();render();};
$('help').onclick=()=>$('helpDialog').showModal();for(const id of ['closeHelp','startHelp'])$(id).onclick=()=>$('helpDialog').close();
document.addEventListener('keydown',e=>{if($('helpDialog').open||['INPUT','SELECT','BUTTON','A'].includes(document.activeElement.tagName)||document.activeElement.closest('.player-node'))return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();pause();seek((state.auto?state.cycleTime:state.time)+(e.key==='ArrowRight'?.5:-.5));}});
$('opponentRotation').onchange=e=>{state.opponentRotation=+e.target.value;restart();};
$('teamHome').onclick=()=>{state.rosterTeam='home';updateControls();};$('teamAway').onclick=()=>{state.rosterTeam='away';updateControls();};
$('fullscreen').onclick=()=>{const workspace=$('workspace');if(document.fullscreenElement)document.exitFullscreen();else if(workspace.requestFullscreen)workspace.requestFullscreen({navigationUI:'hide'}).catch(()=>{});};
document.addEventListener('fullscreenchange',()=>{const fs=!!document.fullscreenElement;$('fullscreen').textContent=fs?'✕':'⛶';$('fullscreen').title=fs?'Выйти из полного экрана':'На весь экран';$('fullscreen').setAttribute('aria-label',$('fullscreen').title);});
function fitWorkspace(){
 const top=$('workspace').getBoundingClientRect().top+window.scrollY;
 document.documentElement.style.setProperty('--workspace-top',Math.ceil(top)+'px');
}
if(typeof window!=='undefined'){
 window.addEventListener('resize',fitWorkspace);
 if(typeof ResizeObserver!=='undefined'){
 const headerObserver=new ResizeObserver(fitWorkspace);
 headerObserver.observe(document.querySelector('header'));headerObserver.observe(document.querySelector('.intro'));
 }
 fitWorkspace();
}
function drawLayout(){
 if(window.matchMedia?.('(max-width: 860px)').matches)state.orientation='vertical';
 const vertical=state.orientation==='vertical',g=$('courtBase');g.replaceChildren();
 $('court').setAttribute('viewBox',vertical?'0 600 820 860':'0 0 1440 820');
 $('court').setAttribute('aria-label',vertical?'Наша половина площадки крупно: сетка сверху, команда снизу.':'Полная площадка: наша команда справа, соперник слева.');
 $('court').classList.toggle('vertical',vertical);document.body.classList.toggle('vertical-court',vertical);
 const rect=(x,y,w,h,fill,extra={})=>node('rect',{x,y,width:w,height:h,fill,...extra},g);
 const path=(d,attrs={})=>node('path',{d,fill:'none',stroke:'#dfe5ee','stroke-width':4,...attrs},g);
 const text=(x,y,value,cls)=>{const t=node('text',{x,y,'text-anchor':'middle',class:cls},g);t.textContent=value;};
 const floor='#3b4f66',front='#42576f',free='#2a2f37';
 if(vertical){
 rect(40,96,740,1340,free,{rx:18});rect(110,160,600,1200,floor);rect(110,560,600,400,front);
 node('rect',{x:110,y:160,width:600,height:1200,fill:'none',stroke:'#dfe5ee','stroke-width':4},g);
 path('M110 560H710M110 960H710',{'stroke-width':3});
 path('M84 760H736',{stroke:'#10151f','stroke-width':12,'stroke-linecap':'round'});path('M90 760H730',{stroke:'#f2f4f8','stroke-width':3,'stroke-dasharray':'2 5'});
 node('circle',{cx:84,cy:760,r:9,fill:'#10151f',stroke:'#fff','stroke-width':2},g);node('circle',{cx:736,cy:760,r:9,fill:'#10151f',stroke:'#fff','stroke-width':2},g);
 text(410,640,'СТОРОНА СОПЕРНИКА','court-caption away-caption');text(410,1404,'НАША КОМАНДА · 5–1','court-caption home-caption');
 text(410,548,'ЛИНИЯ 3 М','side-label');text(410,992,'ЛИНИЯ 3 М','side-label');
 }else{
 rect(40,22,1360,776,free,{rx:18});rect(120,110,1200,600,floor);rect(520,110,400,600,front);
 node('rect',{x:120,y:110,width:1200,height:600,fill:'none',stroke:'#dfe5ee','stroke-width':4},g);
 path('M520 110V710M920 110V710',{'stroke-width':3});
 path('M720 92V728',{stroke:'#10151f','stroke-width':12,'stroke-linecap':'round'});path('M720 98V722',{stroke:'#f2f4f8','stroke-width':3,'stroke-dasharray':'2 5'});
 node('circle',{cx:720,cy:92,r:9,fill:'#10151f',stroke:'#fff','stroke-width':2},g);node('circle',{cx:720,cy:728,r:9,fill:'#10151f',stroke:'#fff','stroke-width':2},g);
 text(420,70,'СОПЕРНИК · 5–1','court-caption away-caption');text(1020,70,'НАША КОМАНДА · 5–1','court-caption home-caption');
 text(720,62,'СЕТКА','side-label');text(520,760,'ЛИНИЯ 3 М','side-label');text(920,760,'ЛИНИЯ 3 М','side-label');
 }
 $('zoneLabels').replaceChildren();for(const team of (vertical?['home']:['home','away']))for(const [z,p]of Object.entries(zoneXY)){const point=teamXY(p,team);const t=node('text',{x:point[0],y:point[1]+22},$('zoneLabels'));t.textContent=z;}
 $('courtLegend').textContent=vertical?'Наша половина крупно · обе команды — в горизонтальном виде':'Соперник слева · наша команда справа';
 $('horizontal').classList.toggle('active',!vertical);$('vertical').classList.toggle('active',vertical);
 $('horizontal').setAttribute('aria-pressed',!vertical);$('vertical').setAttribute('aria-pressed',vertical);
}
for(const orientation of ['horizontal','vertical'])$(orientation).onclick=()=>{state.orientation=orientation;drawLayout();render();};
$('firstBall').onchange=e=>{state.firstBall=e.target.checked?'short':'cross';build();};
$('opponentFirstBall').onchange=e=>{state.opponentFirstBall=e.target.checked?'short':'cross';build();};
$('serveGroup').onchange=e=>{state.serveGroup=e.target.checked;restart();};
$('opponentAttack').onchange=e=>{state.opponentAttack=+e.target.value;build();};
$('showCones').onchange=e=>{state.showCones=e.target.checked;render();};
/* Phase card: a soft lift of the card, then title, photo and text arrive one after another. */
const calmMotion=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const easeOut='cubic-bezier(.2,.75,.25,1)';
function animatePhaseCard(){
 if(!calmMotion||!$('phasePopup').animate||$('phasePopup').hidden)return;
 $('phasePopup').animate([{transform:'translateY(6px) scale(.985)',boxShadow:'0 8px 20px #0004'},{transform:'none',boxShadow:'0 18px 40px #0007'}],{duration:420,easing:easeOut});
 [[$('explainTitle'),0],[$('phasePhoto'),70],[$('explainText'),110],[$('playerText'),160]].forEach(([el,delay])=>{
  if(!el||el.hidden)return;
  el.animate([{opacity:0,transform:'translateY(10px)',filter:'blur(3px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:460,delay,easing:easeOut,fill:'backwards'});
 });
}
function setPopup(open){
 state.popupOpen=open;$('phasePopup').hidden=!open;
 if(open&&calmMotion&&$('phasePopup').animate){$('phasePopup').animate([{opacity:0,transform:'translateX(-14px) scale(.97)'},{opacity:1,transform:'none'}],{duration:420,easing:easeOut});animatePhaseCard();}document.body.classList.toggle('popup-hidden',!open);
 $('togglePopup').textContent=open?'Скрыть пояснения':'Показать пояснения';$('togglePopup').setAttribute('aria-expanded',open);
}
$('togglePopup').onclick=()=>setPopup(!state.popupOpen);$('closePopup').onclick=()=>setPopup(false);
function stepPhase(direction){
 pause();const index=frames.findLastIndex(f=>f.t<=state.time),base=state.auto?Math.min(11,Math.floor(state.cycleTime/20))*20:0;
 if(direction<0){if(state.time>frames[index].t+.001)seek(base+frames[index].t);else if(index>0)seek(base+frames[index-1].t);else if(state.auto&&base>0)seek(base-1);}
 else if(index<frames.length-1)seek(base+frames[index+1].t);
 else if(state.auto)seek(base+20>=cycleDuration?0:base+20);
}
$('previousPhase').onclick=()=>stepPhase(-1);$('nextPhase').onclick=()=>stepPhase(1);
/* Photos for phases: list files in photos/photos.js. */
const phasePhotos=[[/^Приём$|До подачи/,'receive'],[/подач|Сбор у сетки/,'serve'],[/Касание|Приём соперника/,'dig'],[/передача/i,'set'],[/Блок|защит|готовит/i,'block'],[/Страховка/,'cover'],[/атак/i,'attack'],[/Очко/,'point']];
function showPhasePhoto(title){
 const fig=$('phasePhoto'),img=$('phasePhotoImg');if(!fig||!img)return;
 const match=phasePhotos.find(([re])=>re.test(title)),name=match?match[1]:null;
 const entry=name&&(window.academyPhotos||{})[name],file=typeof entry==='string'?entry:entry&&entry.file;
 if(!file){fig.hidden=true;return;}
 const src='photos/'+file,cap=$('phasePhotoCredit');
 if(cap){cap.replaceChildren();if(entry.credit){const l=document.createElement(entry.source?'a':'span');l.textContent='Фото: '+entry.credit;if(entry.source){l.href=entry.source;l.target='_blank';l.rel='noreferrer';}cap.append(l);}}
 img.title=entry&&entry.credit?'Фото: '+entry.credit:'';
 if(img.dataset.src===src){fig.hidden=img.dataset.ok!=='1';return;}
 img.dataset.src=src;img.dataset.ok='0';fig.hidden=true;
 img.onload=()=>{img.dataset.ok='1';fig.hidden=false;};img.onerror=()=>{img.dataset.ok='0';fig.hidden=true;};
 img.src=src;
}
/* Role names in text get a small dot in that role's colour. */
const roleWords=[[/^связующ/i,'s'],[/^диагональн/i,'o'],[/^доигровщик/i,'h1'],[/^центральн/i,'m1'],[/^либеро/i,'l']];
const roleRe=/(связующ[а-яё]*|диагональн(?:ый|ого|ому|ым|ом)|доигровщик[а-яё]*(?: [12])?|центральн(?:ый|ого|ому|ым|ом|ые|ых)(?: [12])?|либеро)/gi;
const escapeHtml=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function setRoleText(el,text){
 el.innerHTML=escapeHtml(text||'').replace(roleRe,w=>{const hit=roleWords.find(([re])=>re.test(w));if(!hit)return w;const id=hit[1],num=(w.match(/ ([12])$/)||[])[1],letter=id==='h1'?(num?'Д'+num:'Д'):id==='m1'?(num?'Ц'+num:'Ц'):roles[id].short,dark=id==='l'||id==='s';return '<span class="role-ref"><span class="role-dot" aria-hidden="true" style="background:'+roles[id].color+';color:'+(dark?'#1d222b':'#fff')+'">'+letter+'</span>'+w+'</span>';});
 if(window.decorateTerms)el.innerHTML=window.decorateTerms(el.innerHTML);
}
/* Link to the current moment: everything needed to reopen the same frame lives in the address. */
function stateToHash(){
 const p=new URLSearchParams();
 p.set('r',state.rotation+1);p.set('m',state.mode==='serve'?'s':'r');p.set('t',(+state.time).toFixed(1));
 if(state.orientation==='vertical')p.set('v','1');
 if(state.quality!=='good')p.set('q','bad');if(state.attack!==4)p.set('a',state.attack);
 if(state.opponentRotation)p.set('or',state.opponentRotation+1);if(state.opponentAttack!==4)p.set('oa',state.opponentAttack);
 if(state.firstBall!=='short')p.set('fb','x');if((state.opponentFirstBall??'short')!=='short')p.set('ofb','x');
 if(!state.serveGroup)p.set('sg','0');
 if(state.selected)p.set('p',(state.selectedTeam==='away'?'a.':'')+state.selected);
 return p.toString();
}
function applyHash(){
 const raw=location.hash.slice(1);if(!raw)return null;
 const p=new URLSearchParams(raw);if(!p.has('r'))return null;
 const r=+p.get('r');if(r>=1&&r<=6)state.rotation=r-1;
 state.mode=p.get('m')==='s'?'serve':'receive';
 state.orientation=p.get('v')==='1'?'vertical':'horizontal';
 state.quality=p.get('q')==='bad'?'bad':'good';
 const a=+p.get('a');state.attack=[2,3,4].includes(a)?a:4;if(state.quality==='bad'&&state.attack===3)state.attack=4;
 const or=+p.get('or');state.opponentRotation=or>=1&&or<=6?or-1:0;
 const oa=+p.get('oa');state.opponentAttack=[2,3,4].includes(oa)?oa:4;
 state.firstBall=p.get('fb')==='x'?'cross':'short';state.opponentFirstBall=p.get('ofb')==='x'?'cross':'short';
 state.serveGroup=p.get('sg')!=='0';
 const pl=p.get('p');state.selected=null;
 if(pl){const away=pl.startsWith('a.'),id=away?pl.slice(2):pl;if(roles[id]){state.selected=id;state.selectedTeam=away?'away':'home';state.rosterTeam=state.selectedTeam;}}
 state.auto=false;$('auto').checked=false;
 $('quality').value=state.quality;$('attack').value=String(state.attack);$('opponentRotation').value=String(state.opponentRotation);$('opponentAttack').value=String(state.opponentAttack);
 $('firstBall').checked=state.firstBall==='short';$('opponentFirstBall').checked=state.opponentFirstBall==='short';$('serveGroup').checked=state.serveGroup;
 const t=parseFloat(p.get('t'));return Number.isFinite(t)?Math.max(0,Math.min(rallyDuration,t)):0;
}
function showToast(text){
 let t=$('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.append(t);}
 t.textContent=text;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2600);
}
async function copyMoment(){
 const url=location.href.split('#')[0]+'#'+stateToHash();
 try{history.replaceState(null,'',url);}catch(e){}
 let ok=false;
 try{await navigator.clipboard.writeText(url);ok=true;}catch(e){}
 if(!ok){const ta=document.createElement('textarea');ta.value=url;ta.style.cssText='position:fixed;opacity:0';document.body.append(ta);ta.select();try{ok=document.execCommand('copy');}catch(e){}ta.remove();}
 showToast(ok?'Ссылка на этот момент скопирована':'Скопируй ссылку из адресной строки');
}
for(const id of ['shareMoment','shareMoment2'])if($(id))$(id).onclick=()=>{pause();copyMoment();};
function openMoment(rotation,mode){
 pause();if(state.auto){state.auto=false;$('auto').checked=false;}
 state.rotation=rotation;state.mode=mode;restart();
 $('workspace').scrollIntoView({behavior:'smooth',block:'start'});
}
window.openMoment=openMoment;
window.addEventListener('hashchange',()=>{const t=applyHash();if(t===null)return;pause();drawLayout();build();seek(t);updateControls();});

/* ---- Motion helpers ---- */
let hoverPlayer=null,blend=null;
const motionOK=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function poseNow(){
 const out={home:{},away:{}};if(!frames||!frames.length)return out;
 let index=frames.findLastIndex(f=>f.t<=state.time);if(index<0)index=0;
 const a=frames[index],b=frames[Math.min(index+1,frames.length-1)],u=b.t===a.t?0:(state.time-a.t)/(b.t-a.t);
 for(const team of ['home','away']){const pa=team==='away'?a.op:a.p,pb=team==='away'?b.op:b.p;if(!pa||!pb)continue;for(const id of Object.keys(pa))if(pb[id])out[team][id]=livePos(team,id,interpolate(pa[id],pb[id],u));}
 return out;
}
function livePos(team,id,target){
 if(!blend)return target;
 const k=Math.min(1,(performance.now()-blend.start)/blend.duration);
 if(k>=1){blend=null;return target;}
 const from=blend.from[team]?.[id];if(!from)return target;
 const e=1-Math.pow(1-k,3);
 return[from[0]+(target[0]-from[0])*e,from[1]+(target[1]-from[1])*e];
}
const restartPlain=restart;
restart=function(){
 const from=motionOK&&frames?poseNow():null;
 restartPlain();
 if(from){blend={from,start:performance.now(),duration:560};render();}
};
function touchRipple(frame){
 // Only a real contact: the ball is placed exactly on a player in this phase.
 // A ball that merely flies past someone, or rests in the server's hands at the start, gets no ripple.
 if(!motionOK||!frame||!frame.b||frame.t===0)return;
 const near=(p,q)=>p&&q&&Math.hypot(p[0]-q[0],p[1]-q[1])<0.2;
 let hit=false;
 for(const id of Object.keys(frame.p||{}))if(near(frame.p[id],frame.b))hit=true;
 for(const id of Object.keys(frame.op||{}))if(near(mirror(frame.op[id]),frame.b))hit=true;
 if(!hit)return;
 let layer=$('ripples');
 if(!layer){layer=node('g',{id:'ripples'});$('court').insertBefore(layer,$('ball'));}
 const [x,y]=xy(frame.b);
 const c=node('circle',{cx:x,cy:y,r:16,class:'touch-ripple'},layer);
 setTimeout(()=>c.remove(),900);
}
const linkTime=applyHash();
if(linkTime===null&&window.matchMedia?.('(max-width: 700px)').matches)state.orientation='vertical';
drawLayout();
build();if(linkTime)seek(linkTime);requestAnimationFrame(tick);

