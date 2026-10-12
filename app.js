import { products } from './data/products.js?v=timefield-name-2026-10-12';
import { machineListings } from './machine-listings.js?v=all-visual-2026-10-12';
document.querySelector('#tool-preview').innerHTML=products.filter(p=>p.homePreview).map((p,i)=>card(p,i,'./')).join('');
