import { esc } from './catalog.js';

// Examples are maintained in data/products.js: examples (images), videos/video,
// and audioExamples ({ src, label, type? }). Empty arrays keep a slot ready.
function media(p, base) {
  const videos = p.videos?.length ? p.videos : (p.video ? [p.video] : []);
  const images = p.examples || [];
  const audio = p.audioExamples || [];
  if (!videos.length && !images.length && !audio.length) return '<p class="listing-empty">Examples coming soon.</p>';
  return videos.map(v => `<figure><video controls loop playsinline preload="none"${v.poster ? ` poster="${base}${esc(v.poster)}"` : ''} aria-label="${esc(v.label)}"><source src="${base}${esc(v.src)}" type="${esc(v.type || 'video/webm')}"></video><figcaption>${esc(v.label)}</figcaption></figure>`).join('') +
    audio.map(a => `<figure><audio controls preload="none" aria-label="${esc(a.label)}"><source src="${base}${esc(a.src)}"${a.type ? ` type="${esc(a.type)}"` : ''}></audio><figcaption>${esc(a.label)}</figcaption></figure>`).join('') +
    images.map(i => `<figure><a href="${base}${esc(i.src)}"><img src="${base}${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy"></a><figcaption>${esc(i.caption || '')}</figcaption></figure>`).join('');
}

function listing(p, base) {
  return `<article class="machine-listing"><a class="listing-image" href="${base}products/${p.slug}/"><img src="${base}${esc(p.image)}" alt="${esc(p.name)} interface" loading="lazy"></a><div class="listing-copy"><h3><a href="${base}products/${p.slug}/">${esc(p.name)}</a></h3><p>${esc(p.listingDescription || p.shortDescription)}</p></div><details class="listing-examples"><summary><span class="listing-chevron" aria-hidden="true">&gt;</span><span>Examples</span></summary><div class="listing-media">${media(p, base)}</div></details></article>`;
}

export const primaryMachineSlugs = ['timefield', 'stretch', 'bottomfeeder', 'hexit', 'grain-alchemy', 'avm', 'moshpaint', 'recursive-symbol-machine', '3field', 'moirefield', 'kaleidofield'];

export function secondaryListings(products, base = '../') {
  return products.filter(p => p.collection !== 'other' && !primaryMachineSlugs.includes(p.slug)).map(p => listing(p, base)).join('');
}

export function machineListings(products, base = './') {
  const audioSlugs = ['timefield', 'stretch', 'bottomfeeder', 'hexit', 'grain-alchemy'];
  const audio = audioSlugs.map(slug => products.find(p => p.slug === slug)).filter(Boolean);
  const visual = products.filter(p => p.collection !== 'other' && p.disciplines.includes('visual') && primaryMachineSlugs.includes(p.slug));
  return `<div class="machine-columns"><section class="machine-column" aria-labelledby="audio-list-title"><h2 id="audio-list-title">Audio</h2>${audio.map(p => listing(p, base)).join('')}</section><section class="machine-column" aria-labelledby="visual-list-title"><h2 id="visual-list-title">Visual</h2>${visual.map(p => listing(p, base)).join('')}</section></div>`;
}
