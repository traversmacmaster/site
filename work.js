import { products } from './data/products.js';
import { examples } from './examples.js';
document.querySelector('#tunnelfield-work').innerHTML=products.filter(p=>p.video||p.examples?.length).map(p=>`<div class="section-heading"><h2>${p.name}</h2><a class="text-link" href="../products/${p.slug}/">Explore the machine ⟶</a></div>${examples(p,'../')}`).join('');
