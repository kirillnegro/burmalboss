import {getState} from './state.js';
function render(){const unlocked=getState().decoded;document.querySelector('#secret-locked').hidden=unlocked;document.querySelector('#secret-found').hidden=!unlocked;}render();window.addEventListener('orbit:state',render);
