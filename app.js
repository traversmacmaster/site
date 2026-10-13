import { products } from './data/products.js?v=kfield-example-2026-10-13';
import { machineListings } from './machine-listings.js?v=example-carousel-2026-10-12';

document.querySelector('#machine-listings').innerHTML=machineListings(products);
