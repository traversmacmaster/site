import { products } from './data/products.js?v=basement-order-2026-10-21';
import { machineListings } from './machine-listings.js?v=basement-order-2026-10-21';

document.querySelector('#machine-listings').innerHTML=machineListings(products);
