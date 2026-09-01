import { getProduct } from './data/products.js';
import { esc } from './catalog.js';
import { examples } from './examples.js';
const p=getProduct(document.body.dataset.product);
const root=document.querySelector('#product-root');
if(!p){root.textContent='This machine could not be found.';}else{
document.title=`${p.name} — Travers MacMaster`;
document.querySelector('meta[name="description"]').content=p.longDescription;
root.innerHTML=`<section class="product-hero"><div class="product-title"><p class="eyebrow">Machine / ${esc(p.category)}</p><h1>${esc(p.name)}</h1><h2>${esc(p.headline)}</h2><p>${esc(p.longDescription)}</p><div class="actions">${p.appUrl?`<a class="button primary" href="../../${p.appUrl}">Open application ↗</a>`:''}<a class="button" href="../../tools/">All machines</a></div></div><div class="detail-image"><img src="../../${p.heroImage}" alt="${esc(p.name)} interface"></div></section><section class="spec-bar"><div><small>CLASSIFICATION</small><b>${esc(p.category)}</b></div><div><small>PLATFORM</small><b>${esc(p.platform)}</b></div><div><small>STATUS</small><b>${esc(p.status)}</b></div><div><small>VST3</small><b>${p.vst3?'YES':'NO'}</b></div></section><section class="features"><div><p class="eyebrow">Field notes</p><h2>Inside the instrument.</h2></div><ol>${(p.features.length?p.features:p.exhibitNotes.split(' / ')).map((note,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${esc(note)}</li>`).join('')}</ol></section>`;
root.insertAdjacentHTML('beforeend',examples(p));
}
