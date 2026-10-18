import { products } from './data/products.js?v=vst-downloads-2026-10-18';
import { machineListings } from './machine-listings.js?v=vst-downloads-2026-10-18';

document.querySelector('#machine-listings').innerHTML=machineListings(products);
