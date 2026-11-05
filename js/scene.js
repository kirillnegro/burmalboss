import * as THREE from '../vendor/three.module.js';
export {THREE};
export const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function createScene(id,{distance=8,far=1500}={}){
  const host=document.getElementById(id);let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{const p=document.createElement('p');p.className='fallback';p.setAttribute('role','status');p.textContent='3D недоступно. Попробуй браузер с WebGL и включённым аппаратным ускорением. Навигация, паспорт и остальные разделы продолжают работать.';host.append(p);return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.05,far);camera.position.set(0,distance*.45,distance);
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Интерактивная 3D-сцена. Перетаскивай для обзора, плюс и минус для масштаба.');
  const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();});observer.observe(host);
  const target=new THREE.Vector3(),keys=new Set();let radius=camera.position.length(),theta=0,phi=1.15,free=false,drag=null,animation=null,previous=0;
  function orbit(){camera.position.set(target.x+radius*Math.sin(phi)*Math.sin(theta),target.y+radius*Math.cos(phi),target.z+radius*Math.sin(phi)*Math.cos(theta));camera.lookAt(target);}
  orbit();
  const zoom=d=>{radius=THREE.MathUtils.clamp(radius+d,2.5,500);if(!free)orbit();else camera.translateZ(d);};
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=(e.clientX-drag.x)*.006,dy=(e.clientY-drag.y)*.006;drag={x:e.clientX,y:e.clientY};if(free){camera.rotation.order='YXZ';camera.rotation.y-=dx;camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-dy,-1.5,1.5);}else{theta-=dx;phi=THREE.MathUtils.clamp(phi+dy,.08,Math.PI-.08);orbit();}});
  canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY*.02*Math.max(1,radius/25));},{passive:false});
  const allowed=['w','a','s','d','r','f','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','='];
  canvas.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(!allowed.includes(key))return;e.preventDefault();keys.add(key);if(key==='+'||key==='=')zoom(-Math.max(.5,radius*.08));if(key==='-')zoom(Math.max(.5,radius*.08));if(!free&&key.startsWith('Arrow')){theta+=(key==='ArrowLeft'?-.1:key==='ArrowRight'?.1:0);phi=THREE.MathUtils.clamp(phi+(key==='ArrowUp'?-.1:key==='ArrowDown'?.1:0),.08,Math.PI-.08);orbit();}});
  canvas.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));canvas.addEventListener('blur',()=>keys.clear());window.addEventListener('blur',()=>{keys.clear();drag=null;});document.addEventListener('visibilitychange',()=>keys.clear());
  const api={host,renderer,scene,camera,canvas,target,keys,
    setFree(value){free=value;keys.clear();if(!free){const offset=camera.position.clone().sub(target);const spherical=new THREE.Spherical().setFromVector3(offset);radius=Math.max(2.5,spherical.radius);theta=spherical.theta;phi=spherical.phi;orbit();}},
    focus(position,distance){target.copy(position);radius=distance;theta=.4;phi=1.05;orbit();},
    track(position){if(free)return;const delta=position.clone().sub(target);target.copy(position);camera.position.add(delta);camera.lookAt(target);},
    start(callback){animation=callback;renderer.setAnimationLoop(t=>{const dt=Math.min((t-previous)/1000,.05);previous=t;if(document.hidden)return;if(free){const speed=dt*18;const dir=new THREE.Vector3();camera.getWorldDirection(dir);const right=new THREE.Vector3().crossVectors(dir,camera.up).normalize();if(keys.has('w'))camera.position.addScaledVector(dir,speed);if(keys.has('s'))camera.position.addScaledVector(dir,-speed);if(keys.has('a'))camera.position.addScaledVector(right,-speed);if(keys.has('d'))camera.position.addScaledVector(right,speed);if(keys.has('r'))camera.position.y+=speed;if(keys.has('f'))camera.position.y-=speed;camera.position.clampLength(0,700);}animation?.(dt,t/1000);renderer.render(scene,camera);});}
  };return api;
}
export function starfield(scene,count=1800,radius=400){const positions=new Float32Array(count*3);let seed=93;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<count;i++){const u=rand()*2-1,a=rand()*Math.PI*2,r=radius*(.7+.3*rand());positions[i*3]=r*Math.sqrt(1-u*u)*Math.cos(a);positions[i*3+1]=r*u;positions[i*3+2]=r*Math.sqrt(1-u*u)*Math.sin(a);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const points=new THREE.Points(geo,new THREE.PointsMaterial({color:0xa9c4d7,size:.7,sizeAttenuation:true}));scene.add(points);return points;}
export function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m.map?.dispose();m.dispose();});}});}
