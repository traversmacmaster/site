import { products } from './data/products.js?v=3field-2026-10-11';
import { card } from './catalog.js';
const audio=document.querySelector('#audio-grid');
if(audio)audio.innerHTML=products.filter(p=>p.disciplines?.includes('audio')).map((p,i)=>card(p,i)).join('');
const lab=document.querySelector('#lab-grid');
if(lab)lab.innerHTML=products.filter(p=>['BETA','COMING SOON','IN DEVELOPMENT'].includes(p.status)).map((p,i)=>card(p,i)).join('');
