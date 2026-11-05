// World coordinates: x in metres, altitude above the landing surface, velocity up is positive.
export const PAD={left:430,right:570};
export function initialFlight(){return {x:340,altitude:420,vx:0,vy:0,fuel:100,elapsed:0,status:'ready'};}
export function stepFlight(state,input,dt){
 if(state.status!=='flying')return state;
 dt=Math.max(0,Math.min(dt,.05));const next={...state};
 const direction=(input.right?1:0)-(input.left?1:0);
 const demand=(input.thrust?4:0)+(direction!==0?1.2:0);
 const fraction=demand?Math.min(1,state.fuel/(demand*dt||1)):0;
 const ay=-3.71+(input.thrust?10*fraction:0),ax=direction*4*fraction;
 next.vx+=ax*dt;next.vy+=ay*dt;
 next.x+=next.vx*dt;next.altitude+=next.vy*dt;
 next.fuel=Math.max(0,state.fuel-demand*dt*fraction);next.elapsed+=dt;
 if(next.x<12){next.x=12;next.vx=Math.max(0,next.vx);}if(next.x>988){next.x=988;next.vx=Math.min(0,next.vx);}
 if(next.altitude>650){next.altitude=650;next.vy=Math.min(0,next.vy);}
 if(next.altitude<=0){next.altitude=0;next.status=next.x>=PAD.left+12&&next.x<=PAD.right-12&&Math.abs(next.vy)<=6&&Math.abs(next.vx)<=4?'landed':'crashed';}
 return next;
}
