import { products } from './data/products.js?v=featured-only-2026-10-22';
import { machineListings } from './machine-listings.js?v=featured-only-2026-10-22';

document.querySelector('#machine-listings').innerHTML=machineListings(products);
