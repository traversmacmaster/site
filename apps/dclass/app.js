import { config } from './config.js';
const $ = selector => document.querySelector(selector);
const form = $('#search-form'), input = $('#query'), results = $('#results'), notice = $('#notice'), more = $('#load-more'), dialog = $('#detail');
let controller, records = [], currentQuery = '', nextPage = null, nextCursor = null, nextPositions = null, generation = 0;
const source = $('#source');
const providerNames = { combined: 'All research sources', documentcloud: 'DocumentCloud', govinfo: 'GovInfo', cia: 'CIA · Internet Archive sample', fbi: 'FBI Vault · sample', nara: 'National Archives' };
const element = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text != null) el.textContent = text; return el; };
const date = value => { if (!value) return 'Date unavailable'; if (!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return String(value); const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' }); };
const display = value => value == null || value === '' ? 'Not provided' : String(value);
const safeURL = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
function openDetail(record) {
  const content = $('#detail-content'); content.replaceChildren();
  content.append(element('h2', '', record.title), element('p', 'description', record.description || 'No description supplied by the source.'));
  const dl = element('dl');
  const fields = { ID: record.id, Source: record.source, Publisher: record.publisher, Agency: record.agency, 'Agency ID': record.agency_id, 'Record date': record.date, Updated: record.updated, Completed: record.completed, Status: record.status, 'Tracking ID': record.tracking_id, Tags: record.tags?.join(', '), Pages: record.page_count, 'Source URL': record.source_url, 'PDF URL': record.pdf_url, 'Document text': record.document_text };
  for (const [key, value] of Object.entries(fields)) dl.append(element('dt', '', key), element('dd', '', display(value)));
  content.append(dl);
  for (const [label, url] of [['OPEN ORIGINAL SOURCE ↗', record.source_url], ['OPEN PDF ↗', record.pdf_url], ['OPEN FULL TEXT ↗', record.text_url], ['OPEN PAGE 1 TEXT ↗', record.page_count > 0 ? record.page_text_url_template?.replace('{page}', '1') : null]]) {
    const href = safeURL(url); if (!href) continue;
    const link = element('a', 'source-link', label); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; content.append(link);
  }
  const raw = element('details'); raw.append(element('summary', '', 'Original provider metadata'), element('pre', '', JSON.stringify(record.raw, null, 2))); content.append(raw);
  dialog.showModal();
}
function card(record) {
  const article = element('article', 'record');
  const meta = element('div', 'record-meta'); meta.append(element('span', 'source-tag', String(record.source).toUpperCase()), element('span', '', '/'), element('time', '', date(record.date)));
  article.append(meta, element('h3', '', record.title), element('p', 'description', record.description ? record.description.slice(0, 260) + (record.description.length > 260 ? '…' : '') : 'No description supplied by the source.'));
  const foot = element('div', 'record-foot'); foot.append(element('span', 'status', (record.status || 'Status unavailable').replaceAll('_', ' ')));
  if (record.agency || record.agency_id != null) foot.append(element('span', 'agency', record.agency || `Agency ID ${record.agency_id}`));
  const button = element('button', 'detail-button', 'OPEN RECORD ↗'); button.addEventListener('click', () => openDetail(record)); foot.append(button); article.append(foot);
  if (record.tags?.length) { const tags = element('div', 'tags'); record.tags.forEach(tag => tags.append(element('span', '', tag))); article.append(tags); }
  return article;
}
async function search(query, page = 1, append = false, cursor = null) {
  controller?.abort(); controller = new AbortController(); const signal = controller.signal, run = ++generation;
  const provider = source.value;
  currentQuery = query; notice.className = ''; notice.textContent = `Searching ${providerNames[provider]} public documents…`; results.setAttribute('aria-busy', 'true'); $('#search-button').disabled = true; more.hidden = true;
  if (!append) { records = []; nextPage = null; nextCursor = null; nextPositions = null; results.replaceChildren(); $('#results-heading').textContent = `Results for “${query}”`; $('#result-count').textContent = 'SEARCHING'; }
  try {
    const url = new URL(`${config.apiBase.replace(/\/$/, '')}/api/${provider === 'combined' ? 'search' : provider + '/search'}`); url.searchParams.set('q', query);
    if (provider === 'combined') { if (append && nextPositions) url.searchParams.set('positions', JSON.stringify(nextPositions)); } else if (provider === 'govinfo') { if (cursor) url.searchParams.set('cursor', cursor); } else { url.searchParams.set('page', page); if (cursor) url.searchParams.set('cursor', cursor); }
    const response = await fetch(url, { signal });
    let data; try { data = await response.json(); } catch { throw new Error('The search service returned an unreadable response.'); }
    if (!response.ok) { const retry = response.headers.get('Retry-After'); throw new Error((data.error?.message || 'Search service unavailable.') + (retry ? ` Retry after ${retry} seconds.` : '')); }
    if (data.state) { notice.textContent = data.message || 'This provider is unavailable.'; $('#result-count').textContent = data.state === 'configuration_required' ? 'CONFIGURATION REQUIRED' : 'PROVIDER PENDING'; return; }
    if (!Array.isArray(data.results) || !Number.isInteger(data.count) || data.results.some(r => !r || typeof r.title !== 'string' || typeof r.source !== 'string' || typeof r.id !== 'string')) throw new Error('The search service returned malformed records.');
    const ids = new Set(records.map(r => r.source + ':' + r.id)); const fresh = data.results.filter(r => { const key = r.source + ':' + r.id; if (ids.has(key)) return false; ids.add(key); return true; }); records.push(...fresh); fresh.forEach(r => results.append(card(r)));
    nextPage = data.next_page; nextCursor = data.next_cursor; nextPositions = data.next_positions; more.hidden = !nextPage && !nextCursor && !nextPositions; $('#result-count').textContent = provider === 'combined' ? `${records.length} RECORDS LOADED` : `${records.length} OF ${data.count.toLocaleString()}${data.count_is_lower_bound ? '+' : ''} RECORDS`;
    notice.textContent = data.count === 0 ? 'No public documents matched this search. Try a broader term or a different spelling.' : `${providerNames[provider]} · ${records.length} record${records.length === 1 ? '' : 's'} loaded`;
    if (data.coverage?.state === 'sample') notice.textContent += ` · Limited ${data.coverage.records}-record sample; not the full corpus.`;
    if (provider === 'combined') { notice.textContent = Object.entries(data.providers).map(([name, status]) => providerNames[name] + ': ' + (status.state === 'live' ? status.count + ' matches' + (status.coverage?.state === 'sample' ? ` (${status.coverage.records}-record sample)` : '') : status.state.replaceAll('_', ' '))).join(' · '); if (data.partial) notice.className = 'error'; }
    if (data.count === 0 && records.length === 0 && !data.partial) results.append(element('div', 'empty-state', 'No matching records.'));
  } catch (error) {
    if (error.name === 'AbortError') return;
    notice.className = 'error'; notice.textContent = error instanceof TypeError ? 'Could not connect to the DClass API. Check your connection and the configured Worker URL.' : error.message;
    $('#result-count').textContent = append ? `${records.length} RECORDS / LOAD FAILED` : 'SEARCH UNAVAILABLE';
    if (append) more.hidden = false;
  } finally { if (run === generation) { results.setAttribute('aria-busy', 'false'); $('#search-button').disabled = false; } }
}
form.addEventListener('submit', event => { event.preventDefault(); const q = input.value.trim(); if (q && q.length <= 200) search(q); });
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.query; search(input.value); }));
more.addEventListener('click', () => { if (nextPage || nextCursor || nextPositions) search(currentQuery, nextPage || 1, true, nextCursor); });
source.addEventListener('change', () => {
  controller?.abort(); generation++; $('#search-button').disabled = false; results.setAttribute('aria-busy', 'false'); records = []; nextPage = null; nextCursor = null; nextPositions = null; more.hidden = true;
  results.replaceChildren(); $('#results-heading').textContent = 'Research index'; $('#result-count').textContent = 'AWAITING QUERY'; notice.className = ''; notice.textContent = `${providerNames[source.value]} selected. Enter a query to search this source.`;
});
// Health exposes provider configuration only; no secret values reach the browser.
fetch(`${config.apiBase.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null).then(data => {
  if (data?.providers?.govinfo === 'live') { $('#govinfo-state').textContent = 'LIVE'; $('#govinfo-state').classList.add('live'); }
}).catch(() => {});
$('#foia-link').href = config.muckrockWebsite;
$('#close-detail').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });


