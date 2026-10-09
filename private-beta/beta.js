import { downloads } from './downloads.js';

for (const build of downloads) {
  const slot = document.querySelector(`[data-download="${build.slug}"]`);
  if (!slot || !build.url) continue;
  const url = new URL(build.url, window.location.href);
  if (url.protocol !== 'https:' && !(url.origin === window.location.origin && url.protocol === 'http:')) continue;
  const link = document.createElement('a');
  link.className = 'button primary';
  link.href = url.href;
  link.textContent = 'Download for Windows ↓';
  link.setAttribute('aria-label', `Download ${build.slug === 'timefield' ? 'TimeField' : 'STRETCH'} for Windows`);
  if (url.origin === window.location.origin) link.setAttribute('download', '');
  slot.replaceChildren(link);
}
