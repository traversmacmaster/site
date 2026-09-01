import { products } from './data/products.js';
import { esc } from './catalog.js';
const base=new URL('./',import.meta.url);
document.querySelector('#year').textContent=new Date().getFullYear();
const nav=document.querySelector('#nav'),toggle=document.querySelector('.nav-toggle');
const closeMenu=()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')};
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();toggle.focus()}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu()});
nav.querySelectorAll('a').forEach(a=>{if(a.pathname===location.pathname)a.setAttribute('aria-current','page')});
const dialog=document.createElement('dialog');dialog.className='search-dialog';dialog.setAttribute('aria-labelledby','search-title');
dialog.innerHTML='<header><h2 id="search-title">Find a machine</h2><button type="button" aria-label="Close search">Close ×</button></header><label for="site-search">Search by name, category, or feature</label><input type="search" id="site-search" placeholder="Try audio, motion, or TimeField"><p class="technical" id="search-count" aria-live="polite"></p><ul class="search-results"></ul>';
document.body.append(dialog);
const input=dialog.querySelector('input');
function search(){const term=input.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const found=products.filter(p=>`${p.name} ${p.category} ${p.longDescription} ${p.features.join(' ')}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));dialog.querySelector('#search-count').textContent=found.length?`${found.length} machines`:'No machines found. Try another term.';dialog.querySelector('ul').innerHTML=found.map(p=>`<li><a href="${new URL(`products/${p.slug}/`,base).href}">${esc(p.name)}<small>${esc(p.category)}</small></a></li>`).join('')}
document.querySelector('.search-toggle').addEventListener('click',()=>{closeMenu();dialog.showModal();search();input.focus()});
dialog.querySelector('button').addEventListener('click',()=>dialog.close());input.addEventListener('input',search);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
