import {THREE,createScene,starfield,disposeGroup,reducedMotion} from './scene.js';
import {getState,saveShip,canPersist} from './state.js';
const hullNames={scout:'Разведчик',freighter:'Грузовой',interceptor:'Перехватчик'};
const engines={ion:0x6ce2ff,plasma:0xc887ff,chemical:0xffb251};
const form=document.querySelector('#ship-form'),fields={name:document.querySelector('#ship-name'),hull:document.querySelector('#hull'),engine:document.querySelector('#engine'),color:document.querySelector('#paint')};
const saved=getState().ship;if(saved)for(const key in fields)fields[key].value=saved[key];
const spin=document.querySelector('#ship-spin');spin.checked=!reducedMotion();const space=createScene('ship-view',{distance:7});let ship;
if(space){space.scene.add(new THREE.AmbientLight(0xcbdfe8,2));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,5,5);space.scene.add(key);const rim=new THREE.DirectionalLight(0x72b5ff,2);rim.position.set(-3,-1,-2);space.scene.add(rim);starfield(space.scene,700,100);space.focus(new THREE.Vector3(),7);}
function build(){const hull=fields.hull.value,engine=fields.engine.value;document.querySelector('#ship-spec').textContent=`${hullNames[hull]} / ${hull==='scout'?'2':hull==='freighter'?'4':'3'} двигателя · ${hull==='freighter'?'ГРУЗ 40 т':hull==='scout'?'ЭКИПАЖ 2':'ЭКИПАЖ 1'}`;
 if(!space)return;if(ship){space.scene.remove(ship);disposeGroup(ship);}ship=new THREE.Group();
 const metal=()=>new THREE.MeshStandardMaterial({color:fields.color.value,metalness:.5,roughness:.35});
 const mesh=(geometry,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);ship.add(m);return m;};
 const width=hull==='freighter'?.7:hull==='interceptor'?.28:.42;
 mesh(new THREE.CylinderGeometry(width*.7,width,2,8),metal());
 mesh(new THREE.ConeGeometry(width*.72,hull==='interceptor'?1.2:.75,8),metal(),0,1.35,0);
 mesh(new THREE.SphereGeometry(width*.65,24,16),new THREE.MeshStandardMaterial({color:0x68badd,metalness:.65,roughness:.15}),0,.65,width*.63).scale.set(1,1.4,.55);
 const finMat=()=>new THREE.MeshStandardMaterial({color:0x283944,metalness:.65,roughness:.35});
 for(const side of [-1,1]){const fin=mesh(new THREE.BoxGeometry(hull==='interceptor'?1.3:.8,.1,.7),finMat(),side*(width+.25),-.5,0);fin.rotation.z=side*.45;}
 const count=hull==='freighter'?4:hull==='interceptor'?3:2;for(let i=0;i<count;i++){const x=(i-(count-1)/2)*.42;mesh(new THREE.CylinderGeometry(.17,.23,.45,16),finMat(),x,-1.15,0);const flame=mesh(new THREE.ConeGeometry(.16,.7,24),new THREE.MeshBasicMaterial({color:engines[engine],transparent:true,opacity:.85}),x,-1.7,0);flame.rotation.z=Math.PI;}
 if(hull==='freighter')for(const side of [-1,1])mesh(new THREE.BoxGeometry(.6,1.45,.8),metal(),side*.85,-.1,0);
 ship.rotation.z=-.22;ship.rotation.y=.5;space.scene.add(ship);
}
build();for(const field of [fields.hull,fields.engine,fields.color])field.addEventListener('input',()=>{build();document.querySelector('#ship-status').textContent='Есть изменения. Сохрани корабль для следующих экспедиций.';});
fields.name.oninput=()=>fields.name.setCustomValidity('');
form.onsubmit=e=>{e.preventDefault();const name=fields.name.value.trim();if(!name){fields.name.setCustomValidity('Дай кораблю имя');fields.name.reportValidity();return;}if(saveShip({name,hull:fields.hull.value,engine:fields.engine.value,color:fields.color.value}))document.querySelector('#ship-status').textContent=canPersist()?'Корабль сохранён. Он ждёт тебя в паспорте и симуляторе посадки.':'Корабль создан, но хранилище недоступно. При уходе со страницы он может потеряться.';};
space?.start(dt=>{if(ship&&spin.checked)ship.rotation.y+=dt*.25;});
