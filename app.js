import { products } from "./data/products.js";

const grid = document.querySelector("#product-grid");
grid.innerHTML = products.filter(product => product.featured).map((product, index) => `
  <article class="product-card reveal">
    <div class="product-heading"><h3>${product.name}</h3></div>
    <a class="product-image" href="${product.appUrl ? `./${product.appUrl}` : (["timefield", "avm"].includes(product.slug) ? `./products/${product.slug}/` : "#")}">
      <img src="./${product.image}" alt="${product.name} product artwork">
      <span class="index">0${index + 1}</span><span class="status">${product.status}</span>
    </a>
    <div class="product-info"><p>${product.category}</p><span class="price ${product.pricingType.toLowerCase()}">${product.pricingType}${product.appUrl ? " / OPEN APP →" : " / COMING SOON"}</span></div>
  </article>`).join("");

document.querySelector("#year").textContent = new Date().getFullYear();
const toggle = document.querySelector(".nav-toggle");
toggle.addEventListener("click", () => { const open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); document.querySelector("#nav").classList.toggle("open", !open); });

const wave = document.querySelector("#wave");
wave.innerHTML = Array.from({length: 72}, (_, i) => `<i style="height:${18 + Math.abs(Math.sin(i * .51) * 58 + Math.cos(i * .17) * 20)}%"></i>`).join("");

const heroSlides = [
  {name: "TimeField", image: "./assets/products/timefield/hero-frozen-wave.png", alt: "TimeField with a frozen six-second audio waveform", href: "./products/timefield/"},
  {name: "AuViMosh", image: "./assets/products/avm/hero-action.png", alt: "AuViMosh audio video mosh instrument processing video in realtime", href: "./products/avm/"},
  {name: "DrawTable", image: "./assets/products/drawtable/hero.png", alt: "DrawTable drawable wavetable synthesizer interface", href: "#tools"}
];
const heroImage = document.querySelector("#hero-device");
const heroLink = document.querySelector("#hero-link");
const heroProduct = document.querySelector("#hero-product");
const heroIndex = document.querySelector("#hero-index");
const heroDots = document.querySelector("#hero-dots");
let activeHero = 0;
let heroTimer;
heroDots.innerHTML = heroSlides.map((slide, index) => `<button type="button" aria-label="Show ${slide.name}" data-slide="${index}"></button>`).join("");
function showHero(index) {
  activeHero = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[activeHero];
  heroImage.classList.add("switching");
  setTimeout(() => { heroImage.src = slide.image; heroImage.alt = slide.alt; heroLink.href = slide.href; heroProduct.textContent = slide.name; heroIndex.textContent = `FEATURED / 00${activeHero + 1}`; heroDots.querySelectorAll("button").forEach((dot, i) => dot.classList.toggle("active", i === activeHero)); heroImage.classList.remove("switching"); }, 160);
}
function restartHeroTimer() { clearInterval(heroTimer); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) heroTimer = setInterval(() => showHero(activeHero + 1), 6500); }
document.querySelector("#hero-prev").addEventListener("click", () => { showHero(activeHero - 1); restartHeroTimer(); });
document.querySelector("#hero-next").addEventListener("click", () => { showHero(activeHero + 1); restartHeroTimer(); });
heroDots.addEventListener("click", event => { const dot = event.target.closest("button[data-slide]"); if (dot) { showHero(Number(dot.dataset.slide)); restartHeroTimer(); } });
heroDots.querySelector("button").classList.add("active");
restartHeroTimer();

const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("visible")), {threshold: .12});
document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
