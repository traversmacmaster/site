import { products } from './data/products.js?v=visual-filter-2026-10-22';
import { card } from './catalog.js';
const audio=document.querySelector('#audio-grid');
if(audio)audio.innerHTML=products.filter(p=>p.disciplines?.includes('audio')).sort((a,b)=>{const order=["timefield","stretch","basement","hexit","grain-alchemy","drawtable"];const rank=p=>order.includes(p.slug)?order.indexOf(p.slug):order.length;return rank(a)-rank(b);}).map((p,i)=>card(p,i)).join('');
const lab=document.querySelector('#lab-grid');
if(lab)lab.innerHTML=products.filter(p=>['BETA','COMING SOON','IN DEVELOPMENT'].includes(p.status)).map((p,i)=>card(p,i)).join('');
