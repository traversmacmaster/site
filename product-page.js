import { getProduct } from "./data/products.js";

const slug = document.body.dataset.product;
const product = getProduct(slug);
const root = document.querySelector("#product-root");
if (!product) throw new Error(`Unknown product: ${slug}`);
document.title = `${product.name} — Travers MacMaster`;
const base = "../../";
root.innerHTML = `
  <section class="product-hero">
    <div class="product-title"><p class="eyebrow"><span>PRODUCT</span> ${product.status}</p><h1>${product.name}</h1><h2>${product.headline}</h2><p>${product.longDescription}</p><div class="actions"><a class="button primary" href="${product.purchaseUrl}">Purchase — Coming soon</a><a class="button" href="${product.patreonUrl}">Patreon ↗</a></div></div>
    <div class="detail-image"><img src="${base}${product.heroImage}" alt="${product.name} interface or product artwork"></div>
  </section>
  <section class="spec-bar"><div><small>LICENSE</small><b>${product.pricingType}</b></div><div><small>PLATFORM</small><b>${product.platform}</b></div><div><small>STANDALONE</small><b>${product.standalone ? "YES" : "NO"}</b></div><div><small>VST3</small><b>${product.vst3 ? "YES" : "NO"}</b></div></section>
  <section class="features"><div><p class="eyebrow"><span>FIELD NOTES</span> Capabilities</p><h2>INSIDE THE<br>INSTRUMENT.</h2></div><ol>${product.features.map((feature, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${feature}</li>`).join("")}</ol></section>
  <section class="purchase-note" id="purchase-coming-soon"><p>STORE CONNECTION PENDING</p><h2>READY WHEN<br>THE RELEASE IS.</h2><p>Checkout is not active yet. Follow development and release notes through Patreon.</p><a class="button primary" href="${product.patreonUrl}">Follow on Patreon ↗</a></section>`;
