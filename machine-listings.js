import { esc } from './catalog.js';

// Examples are maintained in data/products.js: examples (images), videos/video,
// and audioExamples ({ src, label, type? }). Empty arrays keep a slot ready.
function media(p, base) {
  const videos = p.videos?.length ? p.videos : (p.video ? [p.video] : []);
  const images = p.examples || [];
  const audio = p.audioExamples || [];
  if (!videos.length && !images.length && !audio.length) return '<p class="listing-empty">Examples coming soon.</p>';
  const markup = videos.map(v => `<figure><video controls loop playsinline preload="none"${v.poster ? ` poster="${base}${esc(v.poster)}"` : ''} aria-label="${esc(v.label)}"><source src="${base}${esc(v.src)}" type="${esc(v.type || 'video/webm')}"></video><figcaption>${esc(v.label)}</figcaption></figure>`).join('') +
    audio.map(a => `<figure><audio controls preload="none" aria-label="${esc(a.label)}"><source src="${base}${esc(a.src)}"${a.type ? ` type="${esc(a.type)}"` : ''}></audio><figcaption>${esc(a.label)}</figcaption></figure>`).join('') +
    images.map(i => `<figure><a href="${base}${esc(i.src)}"><img src="${base}${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy"></a><figcaption>${esc(i.caption || '')}</figcaption></figure>`).join('');
  let index = 0;
  const slides = markup.replace(/<figure>/g, () => '<figure class="example-slide"' + (index++ ? ' hidden' : '') + '>');
  const disabled = index < 2 ? ' disabled' : '';
  return '<div class="example-carousel" data-index="0"><div class="example-slides">' + slides + '</div><div class="example-controls"><button type="button" class="example-step" data-step="-1" aria-label="Previous example"' + disabled + '>&lt;</button><span class="example-count" aria-live="polite">1 / ' + index + '</span><button type="button" class="example-step" data-step="1" aria-label="Next example"' + disabled + '>&gt;</button></div></div>';
}

function listing(p, base) {
  return `<article class="machine-listing"><a class="listing-image" href="${base}products/${p.slug}/"><img src="${base}${esc(p.image)}" alt="${esc(p.name)} interface" loading="lazy"></a><div class="listing-copy"><h3><a href="${base}products/${p.slug}/">${esc(p.name)}</a></h3><p>${esc(p.listingDescription || p.shortDescription)}</p></div><details class="listing-examples"><summary><span class="listing-chevron" aria-hidden="true">&gt;</span><span>Examples</span></summary><div class="listing-media">${media(p, base)}</div></details></article>`;
}

export const primaryMachineSlugs = ['timefield', 'stretch', 'basement', 'hexit', 'grain-alchemy', 'drawtable', 'avm', 'moshpaint', 'recursive-symbol-machine', '3field', 'moirefield', 'kaleidofield', 'guillochefield', 'spirofield', 'interferencefield', 'tunnelfield'];

export function secondaryListings(products, base = '../') {
  return products.filter(p => p.collection !== 'other' && !primaryMachineSlugs.includes(p.slug)).map(p => listing(p, base)).join('');
}

function comingSoon(items) {
  if (!items.length) return '';
  return '<section class="upcoming-machines"><h3>Coming soon</h3><ul>' + items.map(p => '<li>' + esc(p.name) + '</li>').join('') + '</ul></section>';
}

export function machineListings(products, base = './') {
  const audioSlugs = ['timefield', 'stretch', 'basement'];
  const visualSlugs = ['moshpaint', 'avm', 'moirefield'];
  const audio = audioSlugs.map(slug => products.find(p => p.slug === slug)).filter(Boolean);
  const visual = visualSlugs.map(slug => products.find(p => p.slug === slug)).filter(Boolean);
  const otherAudio = products.filter(p => p.collection !== 'other' && p.disciplines.includes('audio') && !p.disciplines.includes('visual') && !audioSlugs.includes(p.slug));
  const otherVisual = products.filter(p => p.collection !== 'other' && p.slug !== 'video-mosaic' && p.disciplines.includes('visual') && !visualSlugs.includes(p.slug));
  return '<div class="machine-columns featured-machine-columns"><section class="machine-column" aria-labelledby="audio-list-title"><h2 id="audio-list-title">Audio</h2>' + audio.map(p => listing(p, base)).join('') + comingSoon(otherAudio) + '</section><section class="machine-column" aria-labelledby="visual-list-title"><h2 id="visual-list-title">Visual</h2>' + visual.map(p => listing(p, base)).join('') + comingSoon(otherVisual) + '</section></div>';
}
