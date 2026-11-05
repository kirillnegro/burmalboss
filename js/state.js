const KEY = 'orbit.passport.v1';
export const planetNames = {mercury:'Меркурий',venus:'Венера',earth:'Земля',mars:'Марс',jupiter:'Юпитер',saturn:'Сатурн',uranus:'Уран',neptune:'Нептун',europa:'Европа'};
export const badges = [
  ['first-world','◎','Первый контакт','Посети любой мир в атласе или системе.'],
  ['navigator','⊙','Навигатор','Посети все восемь планет в солнечной системе.'],
  ['engineer','△','Инженер','Сохрани собственный корабль.'],
  ['pilot','↧','Мягкая посадка','Успешно приземлись на Марс.'],
  ['traveler','↗','В путь','Создай виртуальную экспедицию.'],
  ['horizon','◉','На краю','Просканируй сигнал у чёрной дыры.'],
  ['listener','⌁','Слушатель','Собери три фрагмента сигнала.'],
  ['echo','✳','Не потерян','Восстанови связь со станцией «Эхо».']
];
export const fragments = {rings:{number:'I',value:'07',text:'Кольца помнят начало. Первая пара — 07.'},gravity:{number:'II',value:'21',text:'Тяжесть исчезает. Вторая пара — 21.'},horizon:{number:'III',value:'42',text:'Свет молчит, но мы слышим. Третья пара — 42.'}};
const empty = () => ({version:1,name:'',visited:[],achievements:[],missions:[],ship:null,fragments:[],decoded:false,landings:0});
export function validShip(ship) {
  return ship && typeof ship.name==='string' && ship.name.trim().length>0 && ship.name.length<=32 && ['scout','freighter','interceptor'].includes(ship.hull) && ['ion','plasma','chemical'].includes(ship.engine) && /^#[0-9a-f]{6}$/i.test(ship.color);
}
function sanitize(raw) {
  const s=empty();if(!raw||typeof raw!=='object'||raw.version!==1)return s;
  if(typeof raw.name==='string')s.name=raw.name.slice(0,40);
  for(const [key,allowed] of [['visited',Object.keys(planetNames)],['achievements',badges.map(b=>b[0])],['fragments',Object.keys(fragments)]])if(Array.isArray(raw[key]))s[key]=[...new Set(raw[key].filter(v=>allowed.includes(v)))];
  if(validShip(raw.ship))s.ship={name:raw.ship.name,hull:raw.ship.hull,engine:raw.ship.engine,color:raw.ship.color};
  if(Array.isArray(raw.missions))s.missions=raw.missions.filter(m=>m&&typeof m.name==='string'&&typeof m.role==='string'&&Object.hasOwn(planetNames,m.destination)&&Number.isFinite(m.date)&&Math.abs(m.date)<=8640000000000000).slice(-30).map(m=>({...m,name:m.name.slice(0,40),role:m.role.slice(0,40)}));
  s.decoded=raw.decoded===true&&s.fragments.length===3;
  s.landings=Number.isSafeInteger(raw.landings)&&raw.landings>=0?raw.landings:0;return s;
}
let persistent=true,state=empty();
try {const raw=localStorage.getItem(KEY);if(raw)state=sanitize(JSON.parse(raw));localStorage.setItem(KEY,JSON.stringify(state));}catch{persistent=false;}
export const getState=()=>structuredClone(state);
export const canPersist=()=>persistent;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{if(persistent){persistent=false;window.dispatchEvent(new Event('orbit:storage-unavailable'));}}window.dispatchEvent(new Event('orbit:state'));}
export function notify(message){window.dispatchEvent(new CustomEvent('orbit:notice',{detail:message}));}
function earn(id){if(!state.achievements.includes(id)){state.achievements.push(id);notify('Достижение: '+badges.find(b=>b[0]===id)[2]);}}
export function visit(id){if(!Object.hasOwn(planetNames,id))return;if(!state.visited.includes(id)){state.visited.push(id);earn('first-world');if(Object.keys(planetNames).filter(k=>k!=='europa').every(k=>state.visited.includes(k)))earn('navigator');save();}}
export function collect(id){if(!Object.hasOwn(fragments,id))return;if(id==='horizon')earn('horizon');if(!state.fragments.includes(id)){state.fragments.push(id);notify('Фрагмент '+fragments[id].number+': '+fragments[id].value);if(state.fragments.length===3)earn('listener');}save();}
export function decode(value){if(state.fragments.length<3)return {ok:false,message:'Сначала найди все три фрагмента. Станции указаны справа.'};if(value.trim().replace(/[\s—–-]/g,'')!=='072142')return {ok:false,message:'Связь не установлена. Собери пары цифр в порядке I, II, III.'};state.decoded=true;earn('echo');save();return {ok:true,message:'Координаты приняты. Станция «Эхо» отвечает. Маршрут открыт.'};}
export function saveShip(ship){if(!validShip(ship))return false;state.ship={...ship};earn('engineer');save();return true;}
export function recordMission(name,destination,role){if(!Object.hasOwn(planetNames,destination)||!name.trim())return;state.name=name.trim().slice(0,40);state.missions.push({name:state.name,destination,role:role.slice(0,40),date:Date.now()});state.missions=state.missions.slice(-30);earn('traveler');save();}
export function recordLanding(){state.landings++;visit('mars');earn('pilot');save();}
export function resetState(){state=empty();save();}
window.addEventListener('storage',e=>{if(e.key===KEY){try{state=sanitize(JSON.parse(e.newValue));window.dispatchEvent(new Event('orbit:state'));}catch{/* Ignore invalid data from another tab. */}}});
