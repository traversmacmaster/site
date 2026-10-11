import { downloads } from './downloads.js?v=reckd-2026-10-11';

for (const build of downloads) {
  const slot = document.querySelector(`[data-download="${build.slug}"]`);
  if (!slot || !build.url) continue;
  const url = new URL(build.url, window.location.href);
  if (url.protocol !== 'https:' && !(url.origin === window.location.origin && url.protocol === 'http:')) continue;
  const link = document.createElement('a');
  link.className = 'button primary';
  link.href = url.href;
  link.textContent = build.label || 'Download for Windows ↓';
  link.setAttribute('aria-label', `Download ${build.name || (build.slug === 'timefield' ? 'RECkd' : 'STRETCH')} for Windows`);
  if (url.origin === window.location.origin) link.setAttribute('download', '');
  slot.replaceChildren(link);
  if (build.checksumUrl) {
    const checksumUrl = new URL(build.checksumUrl, window.location.href);
    if (checksumUrl.protocol !== 'https:' && !(checksumUrl.origin === window.location.origin && checksumUrl.protocol === 'http:')) continue;
    const checksum = document.createElement('a');
    checksum.className = 'text-link';
    checksum.href = checksumUrl.href;
    checksum.textContent = 'Download SHA-256 checksum ↓';
    if (checksumUrl.origin === window.location.origin) checksum.setAttribute('download', '');
    slot.append(checksum);
  }
}
