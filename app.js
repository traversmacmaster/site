import { products } from './data/products.js?v=visual-order-2026-10-11';
import { machineListings } from './machine-listings.js?v=visual-order-2026-10-11';
document.querySelector('#tool-preview').innerHTML=products.filter(p=>p.homePreview).map((p,i)=>card(p,i,'./')).join('');
