import { products } from './data/products.js?v=product-cleanup-2026-10-23';
import { machineListings } from './machine-listings.js?v=moire-icon-2026-10-23';

document.querySelector('#machine-listings').innerHTML=machineListings(products);
