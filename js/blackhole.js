import {THREE,createScene,reducedMotion} from './scene.js';
import {collect,fragments} from './state.js';
const space=createScene('hole-view',{distance:4});let paused=reducedMotion(),time=0;
const pause=document.querySelector('#hole-pause');function sync(){pause.textContent=paused?'Продолжить':'Пауза';pause.setAttribute('aria-pressed',paused);}sync();pause.onclick=()=>{paused=!paused;sync();};
if(space){const uniforms={uTime:{value:0},uAspect:{value:1},uMass:{value:1},uTilt:{value:.35},uLens:{value:.65}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
 precision highp float;
 varying vec2 vUv;uniform float uTime;uniform float uAspect;uniform float uMass;uniform float uTilt;uniform float uLens;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec3 stars(vec2 p){vec2 grid=p*100.;vec2 cell=floor(grid);vec2 f=fract(grid)-.5;float n=hash(cell);float star=exp(-dot(f,f)*220.)*step(.975,n);return vec3(.65,.79,1.)*star*(.6+n);}
 void main(){vec2 p=(vUv-.5)*2.;p.x*=uAspect;float r=length(p);float radius=.235*uMass;vec2 bent=p*(1.+uLens*.12/(r*r+.04));vec3 col=vec3(.013,.022,.033)+stars(bent);col+=vec3(.025,.015,.04)*exp(-r*1.4);
 float er=length(vec2(p.x,p.y/uTilt));float angle=atan(p.y/uTilt,p.x);float band=smoothstep(radius*1.12,radius*1.5,er)*(1.-smoothstep(radius*2.6,radius*3.4,er));float strands=.65+.35*sin(er*170.+sin(angle*5.-uTime*.6)*2.);float swirl=.75+.25*sin(angle*12.-uTime*1.3+er*60.);float beaming=.55+.45*smoothstep(-.7,.6,p.x);vec3 fire=mix(vec3(.85,.22,.07),vec3(1.,.85,.5),clamp(1.-(er-radius)*1.7,0.,1.));col+=fire*band*strands*swirl*beaming*1.8;
 float ring=exp(-pow((r-radius*1.13)*60.,2.));col+=vec3(1.,.67,.32)*ring*1.15;float halo=exp(-abs(r-radius*1.16)*10.);col+=vec3(.22,.08,.03)*halo;
 float arc=exp(-pow((length(vec2(p.x,p.y*1.35))-radius*1.65)*42.,2.));col+=vec3(.8,.42,.16)*arc*smoothstep(.0,.18,abs(p.y))*.55;
 float shadow=smoothstep(radius*.94,radius*1.02,r);col*=shadow;col*=1.-.22*length(vUv-.5);gl_FragColor=vec4(col,1.);
 }`});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);plane.frustumCulled=false;space.scene.add(plane);space.canvas.setAttribute('aria-label','Художественная визуализация чёрной дыры. Настройки тени, наклона и линзирования справа.');space.start(dt=>{if(!paused)time+=dt;uniforms.uTime.value=time;uniforms.uAspect.value=space.host.clientWidth/space.host.clientHeight;uniforms.uMass.value=Number(document.querySelector('#hole-mass').value);uniforms.uTilt.value=Number(document.querySelector('#hole-tilt').value);uniforms.uLens.value=Number(document.querySelector('#hole-lens').value);});
}
document.querySelector('#hole-scan').onclick=()=>{collect('horizon');document.querySelector('#hole-message').textContent='III / '+fragments.horizon.text+' Запись добавлена в раздел «Потерянный сигнал».';};
