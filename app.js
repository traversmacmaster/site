import { products } from "./data/products.js";

const grid = document.querySelector("#product-grid");
grid.innerHTML = products.filter(product => product.featured).map((product, index) => `
  <article class="product-card reveal">
    <a class="product-image" href="${product.appUrl ? `./${product.appUrl}` : (["timefield", "avm"].includes(product.slug) ? `./products/${product.slug}/` : "#")}">
      <img src="./${product.image}" alt="${product.name} product artwork">
      <span class="index">0${index + 1}</span><span class="status">${product.status}</span>
    </a>
    <div class="product-info"><div><p>${product.category}</p><h3>${product.name}</h3></div><span class="price ${product.pricingType.toLowerCase()}">${product.pricingType}${product.appUrl ? " / OPEN APP →" : " / COMING SOON"}</span></div>
  </article>`).join("");

document.querySelector("#year").textContent = new Date().getFullYear();
const toggle = document.querySelector(".nav-toggle");
toggle.addEventListener("click", () => { const open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); document.querySelector("#nav").classList.toggle("open", !open); });

const wave = document.querySelector("#wave");
wave.innerHTML = Array.from({length: 72}, (_, i) => `<i style="height:${18 + Math.abs(Math.sin(i * .51) * 58 + Math.cos(i * .17) * 20)}%"></i>`).join("");

const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("visible")), {threshold: .12});
document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
