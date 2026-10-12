import { products } from './data/products.js?v=circuit-memory-2026-10-12';
import { machineListings } from './machine-listings.js?v=example-carousel-2026-10-12';

document.querySelector('#machine-listings').innerHTML=machineListings(products);
