import { products } from './data/products.js?v=mosaic-videos-2026-10-10';
import { examples } from './examples.js?v=mosaic-videos-2026-10-10';
document.querySelector('#tunnelfield-work').innerHTML=products.filter(p=>p.video||p.videos?.length||p.examples?.length).map(p=>`<div class="section-heading"><h2>${p.name}</h2><a class="text-link" href="../products/${p.slug}/">Explore the machine ⟶</a></div>${examples(p,'../')}`).join('');
