import { artwork } from './data/artwork.js?v=showcase-2026-10-11';
import { products } from './data/products.js?v=timefield-screens-2026-10-12';
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

const artworkTrigger=document.querySelector('.artwork-toggle');
if(artworkTrigger){
 const showcase=document.createElement('dialog');
 showcase.className='artwork-dialog';showcase.setAttribute('aria-labelledby','artwork-title');
 showcase.innerHTML='<div class="artwork-dialog-header"><div><p class="eyebrow">Travers MacMaster / Personal showcase</p><h2 id="artwork-title">Artwork</h2></div><button type="button" class="button artwork-close" aria-label="Close artwork showcase">Close ×</button></div><div class="artwork-gallery"></div>';
 showcase.querySelector('.artwork-gallery').innerHTML=artwork.map(item=>{
  const src=esc(new URL(item.src,base).href), title=esc(item.title);
  const content=item.type==='video'?'<video controls loop playsinline preload="none" aria-label="'+title+'"'+(item.poster?' poster="'+esc(new URL(item.poster,base).href)+'"':'')+'><source src="'+src+'" type="'+esc(item.mimeType||'video/webm')+'"></video>':'<a href="'+src+'"><img src="'+src+'" alt="'+title+'" loading="lazy"></a>';
  return '<figure>'+content+'<figcaption>'+title+'</figcaption></figure>';
 }).join('');
 document.body.append(showcase);
 artworkTrigger.addEventListener('click',()=>{closeMenu();showcase.showModal();});
 showcase.querySelector('.artwork-close').addEventListener('click',()=>showcase.close());
 showcase.addEventListener('click',e=>{if(e.target===showcase){const r=showcase.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)showcase.close();}});
 showcase.addEventListener('close',()=>{showcase.querySelectorAll('video').forEach(v=>v.pause());artworkTrigger.focus();});
}

const topMenu=document.querySelector('.top-menu');
if(topMenu){
 document.addEventListener('click',e=>{if(!e.target.closest('.top-menu'))topMenu.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&topMenu.open){topMenu.open=false;topMenu.querySelector('summary').focus();}});
 topMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{topMenu.open=false;}));
}
