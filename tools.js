import { products } from './data/products.js';
import { card } from './catalog.js';
let filter='all';
const query=document.querySelector('#catalog-query');
function render(){const term=query.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const shown=products.filter(p=>(filter==='all'||p.disciplines?.includes(filter)||filter==='web'&&p.appUrl||filter==='vst'&&p.vst3||filter==='windows'&&p.platform.includes('Windows'))&&`${p.name} ${p.category} ${p.longDescription} ${p.features.join(' ')}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));document.querySelector('#product-grid').innerHTML=shown.map((p,i)=>card(p,i)).join('');document.querySelector('#catalog-count').textContent=shown.length?`${shown.length} machine${shown.length===1?'':'s'} in view`:'No machines match. Try another search or filter.';}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});render()}));
query.addEventListener('input',render);render();
