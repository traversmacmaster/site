import { products } from './data/products.js?v=auvimosh-screens-2026-10-11';
import { card, esc } from './catalog.js';
document.querySelector('#tool-preview').innerHTML=products.filter(p=>p.homePreview).map((p,i)=>card(p,i,'./')).join('');
const updates=[['bottomfeeder','New instrument'],['timefield','New beta release'],['tunnelfield','New examples'],['moirefield','New canvas study']];
document.querySelector('#updates').innerHTML=updates.map(([slug,label])=>{const p=products.find(p=>p.slug===slug);return `<article class="update-card"><div class="update-meta"><span>${label}</span><span>${esc(p.status)}</span></div><a href="./products/${p.slug}/"><img src="./${p.image}" alt="${esc(p.name)} interface" loading="lazy"></a><h3>${esc(p.name)}</h3><p>${esc(p.whatsNew||p.shortDescription)}</p><a class="text-link" href="./products/${p.slug}/">Explore machine ⟶</a></article>`}).join('');
