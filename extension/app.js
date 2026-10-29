(() => {
'use strict';

/* ================= Utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'b') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const raf = () => new Promise(r => requestAnimationFrame(() => r()));
const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); fn(...a); }; d.cancel = () => clearTimeout(t); return d; };
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = () => window.matchMedia && matchMedia('(pointer: coarse)').matches;
const todayKey = (d = new Date()) => { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${dd}`; };
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};
const ago = t => {
  if (!t) return 'Not started';
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  const d = Math.round(s / 86400);
  return d === 1 ? 'Yesterday' : d + ' days ago';
};
const fmtMin = sec => { const m = Math.round(sec / 60); if (m < 60) return m + ' min'; const h = Math.floor(m / 60); return h + ' h ' + (m % 60) + ' min'; };
const normWs = s => String(s || '').replace(/\s+/g, ' ').trim();
const baseName = n => String(n || 'Untitled').replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim() || 'Untitled';
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) >>> 3; };

const ICON = {
  play: '<svg class="i" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z"/></svg>',
  pause: '<svg class="i" viewBox="0 0 24 24"><path d="M8.5 5v14M15.5 5v14" style="stroke-width:2.4"/></svg>',
  note: '<svg class="i" viewBox="0 0 24 24"><path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/></svg>',
  copy: '<svg class="i" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  trash: '<svg class="i" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  spark: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/></svg>',
  bolt: '<svg class="i" viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',
  book: '<svg class="i" viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/></svg>',
  more: '<svg class="i" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  minus: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  plus: '<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  expand: '<svg class="i" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  search: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>'
};

/* ================= Settings & stats ================= */
const DEF = {
  rt: 'auto', font: 'literata', size: 19, lh: 1.65, width: 'medium', align: 'left', para: 'spaced', mode: 'scroll',
  warmth: 0, dim: 0, bionic: false, ruler: false, spot: false, autoHide: true, pdfTint: true, pdfZoom: 1, pdfFit: 'page',
  wpm: 300, scrollSpeed: 36, sound: 'off', vol: 0.35, sessionMin: 25, goal: 20, eyeBreaks: false, sortBy: 'recent', shelfView: 'covers', libTab: 'home', libFilter: 'all', sessionDeep: true,
  turnAnim: 'curl', turnSound: true, customSounds: [], pageMode: 'scroll', lampShow: true, lampSize: 100, lampScale: 100, magShape: 'circle', magSize: 220, magZoom: 2, vidSide: 'right', vidSplit: 44, vidSplitV: 42, vidFollow: 'off', vidDock: 'closed', vidRate: 1, vidMuted: false,
  ttsRate: 1, ttsVoice: '', rtPrivate: 'velvet', pdfColor: 'original', vaultBlur: false, vaultLockAway: true, vaultVelvet: true, vaultHideBtn: false
};
const S = Object.assign({}, DEF, ls.get('sp.settings', {}));
if (S.pdfTint === false && !ls.get('sp.settings', {}).pdfColor) S.pdfColor = 'original';
const saveSettings = debounce(() => ls.set('sp.settings', S), 200);
if (!ls.get('sp.mig.origColors', false)) { S.pdfColor = 'original'; ls.set('sp.mig.origColors', true); try { saveSettings(); } catch (e) { /* saved later */ } }
/* On phones the hanging lamp crowds the reading bar, so it starts put away (the lamp button brings it back) */
if (!ls.get('sp.mig.phoneLamp', false)) { if (Math.min(screen.width || 9999, innerWidth || 9999) <= 640) S.lampShow = false; ls.set('sp.mig.phoneLamp', true); try { saveSettings(); } catch (e) { /* saved later */ } }
if (!ls.get('sp.mig.coversShown', false)) { S.vaultBlur = false; ls.set('sp.mig.coversShown', true); try { saveSettings(); } catch (e) { /* saved later */ } }
const stats = Object.assign({ days: {} }, ls.get('sp.stats', {}));
const saveStats = () => {
  const keys = Object.keys(stats.days).sort();
  while (keys.length > 400) delete stats.days[keys.shift()];
  ls.set('sp.stats', stats);
};

const FONTS = {
  literata: { name: 'Literata', css: '"Literata", Georgia, serif', note: 'Made for long reading' },
  newsreader: { name: 'Newsreader', css: '"Newsreader", Georgia, serif', note: 'Elegant, bookish' },
  source: { name: 'Source Serif', css: '"Source Serif 4", Georgia, serif', note: 'Crisp on screens' },
  atkinson: { name: 'Atkinson Hyperlegible', css: '"Atkinson Hyperlegible", Verdana, sans-serif', note: 'Clear letterforms' },
  lexend: { name: 'Lexend', css: '"Lexend", system-ui, sans-serif', note: 'Wide, easy tracking' },
  system: { name: 'System', css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', note: 'Your device font' }
};
const WIDTHS = { narrow: 28, medium: 34, wide: 42 };
const THEMES = [
  ['auto', 'Auto', 'linear-gradient(135deg,#F7F5EF 50%,#23201C 50%)', '#6f6a62'],
  ['paper', 'Paper', '#F7F5EF', '#27241F'], ['sepia', 'Sepia', '#F1E5CD', '#3A2E20'], ['sage', 'Sage', '#E3EBE0', '#1E2A23'],
  ['mist', 'Mist', '#E8ECF0', '#1D2530'], ['dusk', 'Dusk', '#23201C', '#D9CEBC'], ['velvet', 'Velvet', '#1E1418', '#E7D4CE'], ['night', 'Night', '#000000', '#A9AEAA']
];
const DARK_RT = new Set(['dusk', 'night', 'velvet']);
const HL_COLORS = [['honey', 'Honey'], ['mint', 'Mint'], ['sky', 'Sky'], ['rose', 'Rose']];

/* ================= Storage (IndexedDB with memory fallback) ================= */
const DB = {
  db: null, mem: null,
  async open() {
    try {
      if (!window.indexedDB) throw new Error('no idb');
      this.db = await Promise.race([
        new Promise((res, rej) => {
          const r = indexedDB.open('stillpage', 1);
          r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('books')) d.createObjectStore('books', { keyPath: 'id' }); if (!d.objectStoreNames.contains('files')) d.createObjectStore('files'); };
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
          r.onblocked = () => rej(new Error('blocked'));
        }),
        sleep(4000).then(() => { throw new Error('timeout'); })
      ]);
    } catch (e) { this.db = null; this.mem = { books: new Map(), files: new Map() }; }
    return !!this.db;
  },
  req(store, mode, fn) {
    return new Promise((res, rej) => {
      try {
        const tx = this.db.transaction(store, mode);
        const st = tx.objectStore(store);
        const r = fn(st);
        tx.oncomplete = () => res(r && 'result' in r ? r.result : undefined);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error || new Error('aborted'));
      } catch (e) { rej(e); }
    });
  },
  async allBooks() { if (!this.db) return [...this.mem.books.values()]; return (await this.req('books', 'readonly', s => s.getAll())) || []; },
  async putBook(b) { let c = JSON.parse(JSON.stringify(b)); if (c.private) { if (!Vault.key) return; c = await Vault.seal(c); } if (!this.db) { this.mem.books.set(c.id, c); return; } try { await this.req('books', 'readwrite', s => s.put(c)); } catch (e) { this.mem = this.mem || { books: new Map(), files: new Map() }; } },
  async getFile(id) {
    const v = !this.db ? this.mem.files.get(id) : await this.req('files', 'readonly', s => s.get(id));
    if (v && v.iv && v.data && !(v instanceof Blob)) return new Blob([await Vault.dec(v)], { type: v.type || '' });
    return v;
  },
  async putFile(id, blob, priv) {
    let val = blob;
    if (priv) { if (!Vault.key) return false; const e = await Vault.enc(await blob.arrayBuffer()); val = { iv: e.iv, data: e.data, type: blob.type || '' }; }
    if (!this.db) { this.mem.files.set(id, val); return true; }
    try { await this.req('files', 'readwrite', s => s.put(val, id)); return true; } catch (e) { return false; }
  },
  async fileKeys() { if (!this.db) return [...this.mem.files.keys()]; return (await this.req('files', 'readonly', s => s.getAllKeys())) || []; },
  async delFile(key) { if (!this.db) { this.mem.files.delete(key); return; } try { await this.req('files', 'readwrite', s => s.delete(key)); } catch (e) { /* gone */ } },
  async del(id) { if (!this.db) { this.mem.books.delete(id); this.mem.files.delete(id); return; } await this.req('books', 'readwrite', s => s.delete(id)); await this.req('files', 'readwrite', s => s.delete(id)); }
};
const memFiles = new Map(); // files that could not be stored persistently

/* ================= Library loader (CDN, lazy) ================= */
const LIBS = {
  pdf: { g: 'pdfjsLib', urls: [new URL('lib/pdf.min.js', document.baseURI).href] },
  pdfWorker: { g: 'pdfjsWorker', urls: [new URL('lib/pdf.worker.min.js', document.baseURI).href] },
  jszip: { g: 'JSZip', urls: [new URL('lib/jszip.min.js', document.baseURI).href] },
  mammoth: { g: 'mammoth', urls: [new URL('lib/mammoth.browser.min.js', document.baseURI).href] },
  marked: { g: 'marked', urls: [new URL('lib/marked.min.js', document.baseURI).href] },
  asmcrypto: { g: 'asmCrypto', urls: [new URL('lib/asmcrypto.min.js', document.baseURI).href] }
};
const libPromises = {};
function loadScript(url) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => res(); s.onerror = () => { s.remove(); rej(new Error('load ' + url)); };
    document.head.appendChild(s);
  });
}
function loadLib(name) {
  const L = LIBS[name];
  if (window[L.g]) return Promise.resolve(window[L.g]);
  if (!libPromises[name]) {
    libPromises[name] = (async () => {
      for (const u of L.urls) { try { await loadScript(u); if (window[L.g]) return window[L.g]; } catch (e) { /* try next mirror */ } }
      delete libPromises[name];
      throw new Error('The reader component for this format could not load. Check your connection and try again.');
    })();
  }
  return libPromises[name];
}
let pdfReady = null;
function ensurePdf() {
  if (pdfReady) return pdfReady;
  pdfReady = (async () => {
    const lib = await loadLib('pdf');
    lib.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker.urls[0];
    let ok = false;
    try {
      const code = `importScripts(${JSON.stringify(LIBS.pdfWorker.urls[0])});`;
      const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      const w = new Worker(url);
      ok = await new Promise(res => {
        const t = setTimeout(() => res(false), 8000);
        w.onmessage = () => { clearTimeout(t); res(true); };
        w.onerror = () => { clearTimeout(t); res(false); };
      });
      if (ok) { w.onmessage = null; w.onerror = null; lib.GlobalWorkerOptions.workerPort = w; }
      else w.terminate();
    } catch (e) { ok = false; }
    if (!ok) await loadLib('pdfWorker'); // parse on the main thread instead
    return lib;
  })().catch(e => { pdfReady = null; throw e; });
  return pdfReady;
}

/* ================= Optional Claude capabilities ================= */
const Cap = { sample: null, downloads: null, sampleBlocked: false };
(async () => {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const [s, d] = await Promise.all([window.claude.use('sample').catch(() => null), window.claude.use('downloads').catch(() => null)]);
      Cap.sample = s || null; Cap.downloads = d || null;
    }
  } catch (e) { /* capabilities unavailable */ }
})();

/* ================= Parsing: shared ================= */
const IDOC = document.implementation.createHTMLDocument('stillpage'); // inert document: nothing in it loads or runs
const DROP_TAGS = new Set(['script', 'style', 'head', 'title', 'meta', 'link', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'noscript', 'template', 'audio', 'video', 'canvas', 'base', 'frame', 'frameset', 'applet', 'param', 'source', 'track', 'map', 'area', 'option', 'datalist', 'dialog', 'slot']);
const ALLOW_TAGS = new Set(['p', 'div', 'span', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'em', 'i', 'strong', 'b', 'u', 's', 'sub', 'sup', 'small', 'blockquote', 'q', 'cite', 'code', 'pre', 'kbd', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'figure', 'figcaption', 'section', 'article', 'aside', 'header', 'footer', 'abbr', 'time', 'ruby', 'rt', 'rp', 'del', 'ins', 'var', 'samp', 'wbr', 'mark', 'big', 'center', 'tt', 'font', 'nav', 'main', 'strike', 'address', 'hgroup', 'details', 'summary', 'dfn', 'bdi', 'bdo']);
const RENAME = { center: 'div', font: 'span', tt: 'code', big: 'span', strike: 's', nav: 'div', main: 'div', mark: 'span', details: 'div', summary: 'p', hgroup: 'div', address: 'div' };
const XLINK = 'http://www.w3.org/1999/xlink';

function parseXml(text, type = 'application/xml') {
  try {
    const d = new DOMParser().parseFromString(text, type);
    if (d.getElementsByTagName('parsererror').length) return null;
    return d;
  } catch (e) { return null; }
}
const byLocal = (root, name) => Array.from(root.getElementsByTagName('*')).filter(e => e.localName === name);
const firstByLocal = (root, name) => { const all = root.getElementsByTagName('*'); for (let i = 0; i < all.length; i++) if (all[i].localName === name) return all[i]; return null; };
const childByLocal = (el, name) => Array.from(el.children).filter(e => e.localName === name);
const safeDecode = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
const dirOf = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
function resolvePath(base, rel) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(rel)) return rel;
  const joined = rel.startsWith('/') ? rel.slice(1) : base + rel;
  const out = [];
  for (const p of joined.split('/')) { if (p === '..') out.pop(); else if (p !== '.' && p !== '') out.push(p); }
  return out.join('/');
}
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp' };
const mimeOf = p => MIME[(p.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';
const isDataImg = s => /^data:image\/(png|jpe?g|gif|webp|svg\+xml|avif|bmp)[;,]/i.test(s);

function addImg(dst, src, alt, ctx) {
  const s = src ? ctx.img(String(src).trim()) : null;
  if (!s) { const a = normWs(alt); if (a && a.length < 140) dst.appendChild(IDOC.createTextNode(' [' + a + '] ')); return; }
  const im = IDOC.createElement('img');
  if (s.startsWith('res:')) im.setAttribute('data-res', s.slice(4)); else im.setAttribute('src', s);
  im.setAttribute('alt', normWs(alt));
  dst.appendChild(im);
}

/* Rebuilds untrusted markup as clean HTML using an allowlist. Unknown tags are unwrapped, dangerous ones dropped, and only safe attributes survive. */
function cleanInto(src, dst, ctx, depth) {
  if (depth > 150) return;
  for (let n = src.firstChild; n; n = n.nextSibling) {
    const t = n.nodeType;
    if (t === 3 || t === 4) { dst.appendChild(IDOC.createTextNode(n.nodeValue)); continue; }
    if (t !== 1) continue;
    const tag = String(n.localName || n.nodeName || '').toLowerCase();
    if (DROP_TAGS.has(tag) || (ctx.dropNav && tag === 'nav')) continue;
    if (tag === 'svg') {
      const im = n.getElementsByTagName('image')[0] || firstByLocal(n, 'image');
      if (im) addImg(dst, im.getAttribute('href') || im.getAttributeNS(XLINK, 'href') || im.getAttribute('xlink:href'), n.getAttribute('aria-label') || '', ctx);
      continue;
    }
    if (tag === 'img' || tag === 'image') { addImg(dst, n.getAttribute('src') || n.getAttribute('href') || n.getAttributeNS(XLINK, 'href'), n.getAttribute('alt'), ctx); continue; }
    if (tag === 'picture') { const im = n.getElementsByTagName('img')[0]; if (im) addImg(dst, im.getAttribute('src'), im.getAttribute('alt'), ctx); continue; }
    if (!ALLOW_TAGS.has(tag)) { cleanInto(n, dst, ctx, depth + 1); continue; }
    const el = IDOC.createElement(RENAME[tag] || tag);
    const id = n.getAttribute('id') || (tag === 'a' ? n.getAttribute('name') : null);
    if (id && /^[^\s"'<>]{1,200}$/.test(id)) el.setAttribute('id', id);
    const lang = n.getAttribute('lang') || n.getAttribute('xml:lang');
    if (lang && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/.test(lang)) el.setAttribute('lang', lang);
    const dir = n.getAttribute('dir'); if (dir === 'rtl' || dir === 'ltr') el.setAttribute('dir', dir);
    const et = (n.getAttribute('epub:type') || '') + ' ' + (n.getAttribute('role') || '');
    const m = /(noteref|footnote|endnote|rearnote)/.exec(et);
    if (m) el.setAttribute('data-epub', m[1] === 'rearnote' ? 'endnote' : m[1]);
    if (tag === 'td' || tag === 'th') for (const a of ['colspan', 'rowspan']) { const v = n.getAttribute(a); if (v && /^\d{1,3}$/.test(v)) el.setAttribute(a, v); }
    if (tag === 'ol') { const v = n.getAttribute('start'); if (v && /^-?\d{1,6}$/.test(v)) el.setAttribute('start', v); }
    if (tag === 'a') {
      const h = n.getAttribute('href') || n.getAttributeNS(XLINK, 'href');
      const r = h ? ctx.link(h.trim()) : null;
      if (r && r.ext) { el.setAttribute('href', r.ext); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
      else if (r) { el.setAttribute('href', '#'); if (r.ch != null) el.setAttribute('data-ch', String(r.ch)); if (r.anchor) el.setAttribute('data-anchor', r.anchor); }
    }
    const cls = n.getAttribute('class');
    if (cls && /\b(poem|stanza|attrib|epigraph)\b/.test(cls)) el.setAttribute('class', cls.match(/\b(poem|stanza|attrib|epigraph)\b/g).join(' '));
    cleanInto(n, el, ctx, depth + 1);
    dst.appendChild(el);
  }
}
const webCtx = {
  link: h => {
    if (/^https?:\/\//i.test(h)) return { ext: h };
    if (h.startsWith('#') && h.length > 1) return { anchor: safeDecode(h.slice(1)) };
    return null;
  },
  img: s => isDataImg(s) ? s : null
};

function emptyish(n) { return !normWs(n.textContent) && !(n.nodeType === 1 && (n.nodeName === 'IMG' || n.querySelector('img'))); }

/* Splits one long document into chapters at its headings, and long chapters into readable parts. */
function splitChapters(wrap, fallbackTitle) {
  let r = wrap;
  while (r.childElementCount === 1 && /^(DIV|SECTION|ARTICLE|ASIDE|HEADER|FOOTER)$/.test(r.firstElementChild.tagName) && !Array.from(r.childNodes).some(n => n.nodeType === 3 && n.nodeValue.trim())) r = r.firstElementChild;
  const nodes = Array.from(r.childNodes);
  const count = tag => nodes.filter(n => n.nodeName === tag).length;
  let split = null, secMode = false;
  if (count('SECTION') >= 2) secMode = true;
  else if (count('H1') >= 2) split = new Set(['H1']);
  else if (count('H2') >= 2) split = new Set(['H1', 'H2']);
  else if (count('H3') >= 3) split = new Set(['H1', 'H2', 'H3']);
  const groups = []; let cur = { title: '', nodes: [] };
  for (const n of nodes) {
    const isSplit = n.nodeType === 1 && ((split && split.has(n.nodeName)) || (secMode && n.nodeName === 'SECTION'));
    if (isSplit && cur.nodes.some(x => !emptyish(x))) { groups.push(cur); cur = { title: '', nodes: [] }; }
    if (isSplit && !cur.title) {
      const h = n.nodeName === 'SECTION' ? n.querySelector('h1,h2,h3,h4') : n;
      cur.title = normWs(h ? h.textContent : '').slice(0, 140);
    }
    cur.nodes.push(n);
  }
  groups.push(cur);
  if (groups.length > 1) {
    const g0 = groups[0], len0 = g0.nodes.reduce((a, n) => a + normWs(n.textContent).length, 0);
    if (len0 < 400 && !g0.nodes.some(n => n.nodeType === 1 && (n.nodeName === 'IMG' || n.querySelector('img')))) { groups[1].nodes = g0.nodes.concat(groups[1].nodes); if (g0.title) groups[1].title = g0.title; groups.shift(); }
  }
  const parts = [];
  for (const g of groups) {
    const total = g.nodes.reduce((a, n) => a + (n.textContent || '').length, 0);
    if (total <= 60000) { parts.push(g); continue; }
    let part = { title: g.title, nodes: [] }, acc = 0, k = 1;
    for (const n of g.nodes) {
      const l = (n.textContent || '').length;
      if (acc > 0 && acc + l > 36000) { parts.push(part); k++; part = { title: (g.title || fallbackTitle) + ' · part ' + k, nodes: [] }; acc = 0; }
      part.nodes.push(n); acc += l;
    }
    parts.push(part);
  }
  const usable = parts.filter(g => g.nodes.some(x => !emptyish(x)));
  const chapters = [], toc = [];
  usable.forEach((g, i) => {
    const d = IDOC.createElement('div');
    g.nodes.forEach(n => d.appendChild(n));
    let title = g.title || (usable.length === 1 ? fallbackTitle : (i === 0 ? 'Opening' : 'Section ' + (i + 1)));
    const heads = Array.from(d.querySelectorAll('h1,h2,h3'));
    heads.forEach((h, k) => { if (!h.id) h.id = `sp-${i}-${k}`; });
    chapters.push({ title, html: d.innerHTML, len: d.textContent.length });
    toc.push({ title, ch: i, level: 0 });
    let added = 0;
    heads.forEach((h, k) => {
      const t = normWs(h.textContent).slice(0, 120);
      if (!t || (k === 0 && t === title) || added >= 80 || toc.length > 500) return;
      if (split && split.has(h.tagName) && k === 0) return;
      toc.push({ title: t, ch: i, anchor: h.id, level: h.tagName === 'H1' ? 1 : h.tagName === 'H2' ? 1 : 2 });
      added++;
    });
  });
  if (!chapters.length) chapters.push({ title: fallbackTitle, html: '<p>This document has no readable text.</p>', len: 0 });
  if (!toc.length) toc.push({ title: chapters[0].title, ch: 0, level: 0 });
  return { chapters, toc };
}

function flowDoc(o) {
  const doc = Object.assign({ kind: 'flow', title: 'Untitled', author: '', lang: '', chapters: [], toc: [], res: () => Promise.resolve(null), cleanup() {} }, o);
  let acc = 0;
  doc.weights = doc.chapters.map(c => Math.max(c.len, 300));
  doc.total = doc.weights.reduce((a, b) => a + b, 0);
  doc.cum = doc.weights.map(w => { const s = acc; acc += w; return s; });
  doc.texts = null;
  return doc;
}

async function makeThumb(blob, maxH = 1000) {
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const h = Math.min(maxH, img.naturalHeight || maxH), w = Math.max(1, Math.round((img.naturalWidth || 280) * h / (img.naturalHeight || 420)));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
    x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.92);
  } catch (e) { return null; } finally { URL.revokeObjectURL(url); }
}

/* ================= Plain text ================= */
function decodeText(buf) {
  const u8 = new Uint8Array(buf);
  if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
  if (u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf);
  let t = new TextDecoder('utf-8').decode(buf);
  const bad = (t.match(/\uFFFD/g) || []).length;
  if (bad > 3 && bad > t.length / 4000) { try { t = new TextDecoder('windows-1252').decode(buf); } catch (e) { /* keep utf-8 */ } }
  return t.replace(/^\uFEFF/, '');
}
const HEAD_RE = /^(chapter|book|part|section|prologue|epilogue|preface|introduction|foreword|afterword|act|scene|letter|appendix|volume|canto|interlude)\b[\s\S]{0,70}$/i;
function isTxtHeading(t) {
  if (t.includes('\n') || t.length > 80) return false;
  if (HEAD_RE.test(t)) return true;
  if (/^[IVXLC]{1,7}\.?$/.test(t) || /^\d{1,3}\.?$/.test(t)) return true;
  return t.length <= 50 && t === t.toUpperCase() && /[A-Z]{2}/.test(t) && !/[,;]$/.test(t) && t.split(/\s+/).length <= 8;
}
function txtToHtml(text, opts = {}) {
  text = text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  const s = text.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG[^\n]*/i);
  if (s >= 0) { const nl = text.indexOf('\n', s); text = nl > 0 ? text.slice(nl + 1) : text; }
  const e = text.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i);
  if (e > 0) text = text.slice(0, e);
  const lines = text.split('\n');
  const nonEmpty = lines.filter(l => l.trim()).length;
  const blanks = lines.length - nonEmpty;
  let paras;
  if (opts.lines || (nonEmpty > 12 && blanks < nonEmpty * 0.04)) paras = lines.filter(l => l.trim());
  else paras = text.split(/\n[ \t]*\n+/);
  const out = [];
  for (const p of paras) {
    const t = p.replace(/^\n+|\n+$/g, '');
    const tt = t.trim();
    if (!tt) continue;
    if (/^[-*_=~#\s]{3,}$/.test(tt)) { out.push('<hr>'); continue; }
    if (isTxtHeading(tt)) { out.push(`<h2>${esc(tt)}</h2>`); continue; }
    const ls = t.split('\n');
    if (ls.length > 1 && ls.every(l => l.trim().length < 48)) { out.push(`<p>${ls.map(l => esc(l.trim())).join('<br>')}</p>`); continue; }
    out.push(`<p>${esc(tt.replace(/\s*\n\s*/g, ' '))}</p>`);
  }
  return out.join('\n');
}
function htmlStringToWrap(html, ctx) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const wrap = IDOC.createElement('div');
  cleanInto(d.body || d.documentElement, wrap, ctx, 0);
  return { wrap, d };
}
function firstHeadingTitle(wrap) { const h = wrap.querySelector('h1') || wrap.querySelector('h2'); const t = h ? normWs(h.textContent) : ''; return t && t.length < 140 ? t : ''; }

async function parseTxt(buf, name) {
  const text = decodeText(buf);
  const wrap = IDOC.createElement('div'); wrap.innerHTML = txtToHtml(text);
  const firstLine = normWs((text.trim().split('\n')[0] || ''));
  const title = name ? baseName(name) : (firstLine.slice(0, 80) || 'Pasted text');
  return flowDoc(Object.assign({ title, author: '' }, splitChapters(wrap, title)));
}
async function parseMd(buf, name, ctx = webCtx) {
  const text = decodeText(buf);
  let html;
  try { const marked = await loadLib('marked'); html = marked.parse(text, { gfm: true, breaks: false }); }
  catch (e) { html = txtToHtml(text); }
  const { wrap } = htmlStringToWrap(html, ctx);
  const title = firstHeadingTitle(wrap) || baseName(name);
  return flowDoc(Object.assign({ title, author: '' }, splitChapters(wrap, title)));
}
async function parseHtml(buf, name, ctx = webCtx) {
  const text = decodeText(buf);
  const { wrap, d } = htmlStringToWrap(text, Object.assign({ dropNav: true }, ctx));
  const title = normWs(d.title) || firstHeadingTitle(wrap) || baseName(name);
  const am = d.querySelector('meta[name="author" i]');
  return flowDoc(Object.assign({ title: title.slice(0, 160), author: am ? normWs(am.getAttribute('content')).slice(0, 120) : '', lang: (d.documentElement.getAttribute('lang') || '') }, splitChapters(wrap, title)));
}
async function parseDocx(buf, name) {
  const mammoth = await loadLib('mammoth');
  const res = await mammoth.convertToHtml({ arrayBuffer: buf });
  const { wrap } = htmlStringToWrap(res.value || '', webCtx);
  const title = baseName(name);
  return flowDoc(Object.assign({ title, author: '' }, splitChapters(wrap, title)));
}

/* ================= RTF ================= */
const CP1252 = (() => { try { const d = new TextDecoder('windows-1252'); const a = []; for (let i = 0; i < 256; i++) a.push(d.decode(new Uint8Array([i]))); return a; } catch (e) { return null; } })();
function rtfToText(rtf) {
  const SKIP = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer', 'headerl', 'headerr', 'headerf', 'footerl', 'footerr', 'footerf', 'listtable', 'listoverridetable', 'rsidtbl', 'generator', 'themedata', 'colorschememapping', 'latentstyles', 'datastore', 'xmlnstbl', 'mmathPr', 'fldinst', 'object', 'filetbl', 'revtbl', 'pgdsctbl', 'operator', 'author', 'company', 'title']);
  const MAP = { emdash: '—', endash: '–', lquote: '‘', rquote: '’', ldblquote: '“', rdblquote: '”', bullet: '•', tab: '\t', line: '\n', par: '\n', sect: '\n\n', page: '\n\n', cell: ' ', row: '\n' };
  let out = '', i = 0, skip = false; const stack = [];
  const n = rtf.length;
  while (i < n) {
    const c = rtf[i];
    if (c === '{') { stack.push(skip); i++; continue; }
    if (c === '}') { skip = stack.length ? stack.pop() : false; i++; continue; }
    if (c === '\\') {
      const m = /^\\([a-zA-Z]{1,32})(-?\d{1,10})? ?/.exec(rtf.slice(i, i + 48));
      if (m) {
        i += m[0].length;
        const w = m[1];
        if (SKIP.has(w)) { skip = true; continue; }
        if (skip) continue;
        if (w === 'u') {
          let code = parseInt(m[2] || '0', 10); if (code < 0) code += 65536;
          out += String.fromCharCode(code);
          if (rtf[i] === '\\' && rtf[i + 1] === "'") i += 4; else if (rtf[i] && rtf[i] !== '\\' && rtf[i] !== '{' && rtf[i] !== '}') i += 1;
          continue;
        }
        if (MAP[w] != null) out += MAP[w];
        continue;
      }
      const nx = rtf[i + 1];
      if (nx === "'") { if (!skip) { const b = parseInt(rtf.substr(i + 2, 2), 16); if (!isNaN(b)) out += CP1252 ? CP1252[b] : String.fromCharCode(b); } i += 4; continue; }
      if (nx === '*') { skip = true; i += 2; continue; }
      if (nx === '\\' || nx === '{' || nx === '}') { if (!skip) out += nx; i += 2; continue; }
      if (nx === '\n' || nx === '\r') { if (!skip) out += '\n'; i += 2; continue; }
      if (nx === '~') { if (!skip) out += '\u00A0'; i += 2; continue; }
      i += 2; continue;
    }
    if (c === '\r' || c === '\n') { i++; continue; }
    if (!skip) out += c;
    i++;
  }
  return out;
}
async function parseRtf(buf, name) {
  const raw = new TextDecoder('latin1').decode(buf);
  if (!/^\s*\{\\rtf/.test(raw)) throw new Error('This file does not look like RTF.');
  const wrap = IDOC.createElement('div'); wrap.innerHTML = txtToHtml(rtfToText(raw), { lines: true });
  const title = baseName(name);
  return flowDoc(Object.assign({ title, author: '' }, splitChapters(wrap, title)));
}

/* ================= FictionBook ================= */
async function parseFb2(buf, name) {
  let text = new TextDecoder('utf-8').decode(buf);
  const enc = /<\?xml[^>]*encoding=["']([^"']+)["']/i.exec(text.slice(0, 200));
  if (enc && !/utf-?8/i.test(enc[1])) { try { text = new TextDecoder(enc[1]).decode(buf); } catch (e) { /* fall back to utf-8 */ } }
  const x = parseXml(text);
  if (!x) throw new Error('This FB2 file is not valid XML.');
  const ti = firstByLocal(x, 'title-info');
  const bt = ti && firstByLocal(ti, 'book-title');
  const title = normWs(bt ? bt.textContent : '') || baseName(name);
  const authors = ti ? byLocal(ti, 'author').map(a => ['first-name', 'middle-name', 'last-name'].map(k => { const e = firstByLocal(a, k); return e ? normWs(e.textContent) : ''; }).filter(Boolean).join(' ')).filter(Boolean) : [];
  const bins = {};
  byLocal(x, 'binary').forEach(b => { const id = b.getAttribute('id'); const ct = b.getAttribute('content-type') || 'image/jpeg'; if (id && /^image\//.test(ct)) bins[id] = `data:${ct};base64,${b.textContent.replace(/\s+/g, '')}`; });
  const imgHref = el => { const h = el.getAttribute('l:href') || el.getAttributeNS(XLINK, 'href') || el.getAttribute('xlink:href') || el.getAttribute('href') || ''; return h.startsWith('#') ? bins[h.slice(1)] || null : null; };
  const MAPT = { p: 'p', emphasis: 'em', strong: 'strong', strikethrough: 's', sup: 'sup', sub: 'sub', code: 'code', cite: 'blockquote', epigraph: 'blockquote', subtitle: 'h4', 'text-author': 'p', poem: 'div', stanza: 'div', v: 'p', table: 'table', tr: 'tr', td: 'td', th: 'th', a: 'a', section: 'section', annotation: 'div' };
  function conv(src, dst, depth) {
    for (let n = src.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 || n.nodeType === 4) { dst.appendChild(IDOC.createTextNode(n.nodeValue)); continue; }
      if (n.nodeType !== 1) continue;
      const ln = n.localName;
      if (ln === 'image') { const s = imgHref(n); if (s) { const im = IDOC.createElement('img'); im.setAttribute('src', s); im.setAttribute('alt', ''); dst.appendChild(im); } continue; }
      if (ln === 'empty-line') { dst.appendChild(IDOC.createElement('br')); continue; }
      if (ln === 'title') { const h = IDOC.createElement(depth <= 1 ? 'h2' : 'h3'); h.textContent = Array.from(n.children).map(c => normWs(c.textContent)).filter(Boolean).join(' · ') || normWs(n.textContent); dst.appendChild(h); continue; }
      const tag = MAPT[ln];
      if (!tag) { conv(n, dst, depth); continue; }
      const el = IDOC.createElement(tag);
      if (ln === 'poem') el.setAttribute('class', 'poem');
      if (ln === 'stanza') el.setAttribute('class', 'stanza');
      if (ln === 'text-author') el.setAttribute('class', 'attrib');
      if (ln === 'epigraph') el.setAttribute('class', 'epigraph');
      const id = n.getAttribute('id'); if (id && /^[^\s"'<>]{1,200}$/.test(id)) el.setAttribute('id', id);
      if (ln === 'a') { const h = n.getAttribute('l:href') || n.getAttributeNS(XLINK, 'href') || n.getAttribute('xlink:href') || ''; if (/^https?:\/\//i.test(h)) { el.setAttribute('href', h); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); } else if (h.startsWith('#')) { el.setAttribute('href', '#'); el.setAttribute('data-anchor', h.slice(1)); } }
      conv(n, el, ln === 'section' ? depth + 1 : depth);
      dst.appendChild(el);
    }
  }
  const wrap = IDOC.createElement('div');
  const bodies = byLocal(x, 'body');
  bodies.forEach((b, bi) => {
    const isNotes = bi > 0 || /notes|comments/i.test(b.getAttribute('name') || '');
    if (isNotes) { const sec = IDOC.createElement('section'); const h = IDOC.createElement('h2'); h.textContent = 'Notes'; sec.appendChild(h); conv(b, sec, 2); wrap.appendChild(sec); }
    else conv(b, wrap, 0);
  });
  let cover = null;
  const cp = ti && firstByLocal(ti, 'coverpage');
  if (cp) { const im = firstByLocal(cp, 'image'); if (im) cover = imgHref(im); }
  const doc = flowDoc(Object.assign({ title, author: authors.join(', ') }, splitChapters(wrap, title)));
  doc.coverData = cover;
  return doc;
}

/* ================= EPUB ================= */
async function parseEpub(buf, opts = {}) {
  const JSZip = await loadLib('jszip');
  let zip;
  try { zip = await JSZip.loadAsync(buf); } catch (e) { throw new Error('This EPUB file is damaged and could not be unzipped.'); }
  const files = {}; zip.forEach((p, f) => { if (!f.dir) files[p] = f; });
  const lower = {}; Object.keys(files).forEach(p => { lower[p.toLowerCase()] = p; });
  const realPath = p => files[p] ? p : (lower[String(p).toLowerCase()] || null);
  const readText = async p => { const r = realPath(p); return r ? files[r].async('string') : null; };
  const container = await readText('META-INF/container.xml');
  let opfPath = null;
  if (container) { const cx = parseXml(container); const rf = cx && firstByLocal(cx, 'rootfile'); opfPath = rf && realPath(safeDecode(rf.getAttribute('full-path') || '')); }
  if (!opfPath) opfPath = Object.keys(files).find(p => /\.opf$/i.test(p)) || null;
  if (!opfPath) throw new Error('This EPUB is missing its package file, so it cannot be opened.');
  const opf = parseXml(await readText(opfPath));
  if (!opf) throw new Error('This EPUB has a damaged package file.');
  const opfDir = dirOf(opfPath);
  const md = firstByLocal(opf, 'metadata') || opf;
  const tEl = byLocal(md, 'title')[0];
  const title = normWs(tEl ? tEl.textContent : '') || baseName(opts.name);
  const author = byLocal(md, 'creator').map(e => normWs(e.textContent)).filter(Boolean).slice(0, 3).join(', ');
  const langEl = byLocal(md, 'language')[0];
  const lang = langEl ? normWs(langEl.textContent) : '';
  const manifest = {};
  byLocal(opf, 'item').forEach(it => {
    const id = it.getAttribute('id'); const href = it.getAttribute('href');
    if (!id || !href) return;
    const full = resolvePath(opfDir, safeDecode(href));
    manifest[id] = { id, href: realPath(full) || full, type: it.getAttribute('media-type') || '', props: it.getAttribute('properties') || '' };
  });
  const items = Object.values(manifest);
  let coverItem = items.find(i => /\bcover-image\b/.test(i.props));
  if (!coverItem) { const cm = byLocal(md, 'meta').find(m => m.getAttribute('name') === 'cover'); if (cm && manifest[cm.getAttribute('content')]) coverItem = manifest[cm.getAttribute('content')]; }
  if (!coverItem) coverItem = items.find(i => /^image\//.test(i.type) && /cover/i.test(i.id + ' ' + i.href));
  if (coverItem && !/^image\//.test(coverItem.type) && !/\.(jpe?g|png|gif|webp)$/i.test(coverItem.href)) coverItem = null;
  const fileBlob = async p => { const r = realPath(p); if (!r) return null; const ab = await files[r].async('arraybuffer'); return new Blob([ab], { type: mimeOf(r) }); };
  if (opts.metaOnly) {
    const cover = coverItem ? await makeThumb(await fileBlob(coverItem.href)) : null;
    return { title, author, cover };
  }
  const spineEl = firstByLocal(opf, 'spine');
  const spine = (spineEl ? childByLocal(spineEl, 'itemref') : []).map(r => manifest[r.getAttribute('idref')]).filter(it => it && realPath(it.href) && !/^image\//.test(it.type) && !/css|font|javascript/.test(it.type));
  if (!spine.length) throw new Error('This EPUB has no readable chapters.');
  const spineIdx = {}; spine.forEach((it, i) => { spineIdx[it.href] = i; spineIdx[it.href.toLowerCase()] = i; });
  const chapters = [];
  for (let i = 0; i < spine.length; i++) {
    const path = spine[i].href, dir = dirOf(path);
    const text = await readText(path);
    let xd = text ? parseXml(text, 'application/xhtml+xml') : null;
    if (!xd && text) xd = new DOMParser().parseFromString(text, 'text/html');
    const wrap = IDOC.createElement('div');
    if (xd) {
      const body = firstByLocal(xd, 'body') || xd.documentElement;
      const ctx = {
        link: h => {
          if (/^https?:\/\//i.test(h)) return { ext: h };
          if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return null;
          const hashAt = h.indexOf('#');
          const p = hashAt >= 0 ? h.slice(0, hashAt) : h; const f = hashAt >= 0 ? safeDecode(h.slice(hashAt + 1)) : null;
          if (!p) return { ch: i, anchor: f };
          const full = resolvePath(dir, safeDecode(p));
          const idx = spineIdx[full] != null ? spineIdx[full] : spineIdx[full.toLowerCase()];
          return idx == null ? null : { ch: idx, anchor: f };
        },
        img: s => {
          if (isDataImg(s)) return s;
          if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
          const full = realPath(resolvePath(dir, safeDecode(s.split('#')[0])));
          return full ? 'res:' + full : null;
        }
      };
      cleanInto(body, wrap, ctx, 0);
    }
    const h = wrap.querySelector('h1,h2,h3');
    chapters.push({ title: '', html: wrap.innerHTML, len: wrap.textContent.length, head: h ? normWs(h.textContent).slice(0, 140) : '', hasImg: !!wrap.querySelector('img') });
  }
  // Table of contents: EPUB 3 nav first, then EPUB 2 NCX
  const toc = [];
  const addEntry = (titleT, href, base, level) => {
    const t = normWs(titleT); if (!t) return;
    let ch = null, anchor = null;
    if (href) {
      const hashAt = href.indexOf('#');
      const p = hashAt >= 0 ? href.slice(0, hashAt) : href; anchor = hashAt >= 0 ? safeDecode(href.slice(hashAt + 1)) : null;
      const full = resolvePath(base, safeDecode(p));
      ch = spineIdx[full] != null ? spineIdx[full] : spineIdx[full.toLowerCase()];
    }
    if (ch == null) return;
    toc.push({ title: t.slice(0, 160), ch, anchor, level: Math.min(level, 3) });
  };
  const navItem = items.find(i => /\bnav\b/.test(i.props));
  if (navItem) {
    const nt = await readText(navItem.href);
    const nd = nt && (parseXml(nt, 'application/xhtml+xml') || new DOMParser().parseFromString(nt, 'text/html'));
    if (nd) {
      const navs = byLocal(nd, 'nav');
      const nav = navs.find(n => /toc/.test((n.getAttribute('epub:type') || '') + (n.getAttributeNS('http://www.idpf.org/2007/ops', 'type') || ''))) || navs[0];
      const walk = (ol, level) => {
        childByLocal(ol, 'li').forEach(li => {
          const a = childByLocal(li, 'a')[0] || childByLocal(li, 'span')[0];
          if (a) addEntry(a.textContent, a.getAttribute('href'), dirOf(navItem.href), level);
          childByLocal(li, 'ol').forEach(sub => walk(sub, level + 1));
        });
      };
      const ol = nav && byLocal(nav, 'ol')[0];
      if (ol) walk(ol, 0);
    }
  }
  if (!toc.length) {
    const tocId = spineEl && spineEl.getAttribute('toc');
    const ncx = (tocId && manifest[tocId]) || items.find(i => /dtbncx/.test(i.type) || /\.ncx$/i.test(i.href));
    if (ncx) {
      const xt = await readText(ncx.href);
      const nx = xt && parseXml(xt);
      if (nx) {
        const navMap = firstByLocal(nx, 'navMap');
        const walk = (el, level) => childByLocal(el, 'navPoint').forEach(np => {
          const lab = firstByLocal(np, 'navLabel'); const ct = childByLocal(np, 'content')[0];
          addEntry(lab ? lab.textContent : '', ct ? ct.getAttribute('src') : '', dirOf(ncx.href), level);
          walk(np, level + 1);
        });
        if (navMap) walk(navMap, 0);
      }
    }
  }
  chapters.forEach((c, i) => {
    const te = toc.find(t => t.ch === i && !t.anchor) || toc.find(t => t.ch === i);
    c.title = (te && te.title) || c.head || (i === 0 && !c.len ? 'Cover' : 'Section ' + (i + 1));
  });
  if (!toc.length) chapters.forEach((c, i) => { if (c.len > 0 || c.hasImg) toc.push({ title: c.title, ch: i, level: 0 }); });
  const resCache = new Map();
  const res = p => {
    if (!resCache.has(p)) resCache.set(p, fileBlob(p).then(b => b ? URL.createObjectURL(b) : null).catch(() => null));
    return resCache.get(p);
  };
  const cleanup = () => { resCache.forEach(pr => pr.then(u => u && URL.revokeObjectURL(u))); resCache.clear(); };
  return flowDoc({ title, author, lang, chapters, toc, res, cleanup });
}

/* ================= Comic archives ================= */
async function parseCbz(buf, opts = {}) {
  const JSZip = await loadLib('jszip');
  const zip = await JSZip.loadAsync(buf);
  const names = [];
  zip.forEach((p, f) => { if (!f.dir && /\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(p) && !/(^|\/)(__MACOSX|\.)/.test(p)) names.push(p); });
  names.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  if (!names.length) throw new Error('No images were found in this comic archive.');
  const blobOf = async p => new Blob([await zip.file(p).async('arraybuffer')], { type: mimeOf(p) });
  if (opts.metaOnly) return { title: baseName(opts.name), author: '', cover: await makeThumb(await blobOf(names[0])) };
  const cache = new Map();
  return {
    kind: 'images', title: baseName(opts.name), author: '', numPages: names.length, names,
    url(i) { if (!cache.has(i)) cache.set(i, blobOf(names[i]).then(b => URL.createObjectURL(b))); return cache.get(i); },
    cleanup() { cache.forEach(p => p.then(u => URL.revokeObjectURL(u))); cache.clear(); }
  };
}

/* ================= Zip folders: pictures, documents and books together ================= */
const ZIP_IMG = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;
const ZIP_DOC = /\.(txt|text|md|markdown|mdown|mkd|html?|xhtml|xht|docx|rtf|fb2)$/i;
const ZIP_BOOK = /\.(epub|kepub|pdf|cbz|zip)$/i;
const zipJunk = p => /(^|\/)(__MACOSX|\.)/.test(p) || /(^|\/)(thumbs\.db|desktop\.ini)$/i.test(p);
const natSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
function zipEntries(zip) {
  const out = { img: [], doc: [], book: [] };
  zip.forEach((p, f) => {
    if (f.dir || zipJunk(p)) return;
    if (ZIP_IMG.test(p)) out.img.push(p); else if (ZIP_DOC.test(p)) out.doc.push(p); else if (ZIP_BOOK.test(p)) out.book.push(p);
  });
  out.img.sort(natSort); out.doc.sort(natSort); out.book.sort(natSort);
  return out;
}
const zipSize = (zip, p) => { const f = zip.file(p); return f && f._data && f._data.uncompressedSize != null ? f._data.uncompressedSize : Infinity; };
/* A small readme or credits file beside a folder of pages does not turn a comic into a document. */
function zipRealDocs(zip, e) {
  if (e.img.length < 2) return e.doc;
  return e.doc.filter(p => !(zipSize(zip, p) < 4096 && /(^|\/)(read[ _-]?me|info|credits?|licen[cs]e|about|source|scanned[^/]*|comicinfo)[^/]*\.(txt|text|md|nfo)$/i.test(p)));
}
async function parseZip(buf, opts = {}) {
  const JSZip = await loadLib('jszip');
  let zip;
  try { zip = await JSZip.loadAsync(buf); } catch (e) { throw new Error('This zip file is damaged and could not be opened.'); }
  const e = zipEntries(zip), title = baseName(opts.name) || 'Zip folder';
  const blobOf = async p => new Blob([await zip.file(p).async('arraybuffer')], { type: mimeOf(p) });
  const coverPath = e.img.find(p => /(^|\/)(cover|folder|front)\.[a-z]+$/i.test(p)) || e.img[0];
  if (opts.metaOnly) return { title, author: '', cover: coverPath ? await makeThumb(await blobOf(coverPath)) : null };
  const lower = {}; e.img.forEach(p => { lower[p.toLowerCase()] = p; });
  const used = new Set();
  const zctx = base => Object.assign({}, webCtx, {
    img: s => {
      if (isDataImg(s)) return s;
      if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
      const real = lower[resolvePath(base, safeDecode(s.split(/[?#]/)[0])).toLowerCase()];
      if (!real) return null;
      used.add(real); return 'res:' + real;
    }
  });
  const docs = new Map();
  for (const p of zipRealDocs(zip, e).slice(0, 400)) {
    try {
      const b = await zip.file(p).async('arraybuffer'), name = p.split('/').pop(), ext = name.split('.').pop().toLowerCase();
      let d;
      if (/^(md|markdown|mdown|mkd)$/.test(ext)) d = await parseMd(b, name, zctx(dirOf(p)));
      else if (/^(html?|xhtml|xht)$/.test(ext)) d = await parseHtml(b, name, zctx(dirOf(p)));
      else if (ext === 'docx') d = await parseDocx(b, name);
      else if (ext === 'rtf') d = await parseRtf(b, name);
      else if (ext === 'fb2') d = await parseFb2(b, name);
      else d = await parseTxt(b, name);
      if (d && d.chapters.some(c => c.len > 0 || /<img/i.test(c.html))) docs.set(p, d);
    } catch (err) { /* one unreadable file should not stop the rest */ }
  }
  const chapters = [], toc = [], nested = docs.size > 1;
  let run = [];
  const flush = () => {
    if (!run.length) return;
    const dir = dirOf(run[0]), folder = dir ? dir.replace(/\/$/, '').split('/').pop() : '';
    const base = folder || (chapters.length || docs.size ? 'Pictures' : title), per = 24;
    for (let i = 0; i < run.length; i += per) {
      const part = run.slice(i, i + per), t = run.length > per ? `${base} · ${i / per + 1}` : base;
      chapters.push({ title: t, html: part.map(p => `<figure class="zpic"><img data-res="${esc(p)}" alt=""></figure>`).join(''), len: 0, pics: part.length });
      toc.push({ title: t, ch: chapters.length - 1, level: 0 });
    }
    run = [];
  };
  const items = Array.from(docs.keys()).concat(e.img.filter(p => !used.has(p))).sort(natSort);
  for (const p of items) {
    if (ZIP_IMG.test(p)) { if (run.length && dirOf(run[0]) !== dirOf(p)) flush(); run.push(p); continue; }
    flush();
    const d = docs.get(p), off = chapters.length, multi = d.chapters.length > 1 && nested;
    if (multi) toc.push({ title: d.title, ch: off, level: 0 });
    d.chapters.forEach(c => chapters.push(c));
    d.toc.forEach(t => toc.push(Object.assign({}, t, { ch: t.ch + off, level: Math.min(3, (t.level || 0) + (multi ? 1 : 0)) })));
  }
  flush();
  if (!chapters.length) throw new Error('Nothing readable was found in this zip file.');
  const one = docs.size === 1 ? docs.values().next().value : null;
  const resCache = new Map();
  const res = p => {
    const real = lower[String(p).toLowerCase()];
    if (!real) return Promise.resolve(null);
    if (!resCache.has(real)) resCache.set(real, blobOf(real).then(b => URL.createObjectURL(b)).catch(() => null));
    return resCache.get(real);
  };
  const cleanup = () => { resCache.forEach(pr => pr.then(u => u && URL.revokeObjectURL(u))); resCache.clear(); };
  chapters.forEach(c => { if (c.pics) { c.len = c.pics * 250; delete c.pics; } });
  return flowDoc({ title: one && !e.img.length && docs.size === 1 ? one.title : title, author: one ? one.author : '', lang: one ? one.lang : '', chapters, toc, res, cleanup });
}
/* Loose pictures picked together become one picture book, kept as a comic archive. */
/* Videos are recognised by type, by name, or by their first bytes (Android sometimes hands over files with no name ending) */
const VIDEO_EXT = /\.(mp4|m4v|webm|mov|mkv|ogv|3gp|avi)$/i;
async function isVideoFile(f) {
  if (!f) return false;
  if (/^video\//.test(f.type) || VIDEO_EXT.test(f.name || '')) return true;
  if (/^(image|text)\//.test(f.type) || /\.(epub|kepub|pdf|docx|txt|md|html?|fb2|cbz|zip|rtf|jpe?g|png|gif|webp)$/i.test(f.name || '')) return false;
  try {
    const h = new Uint8Array(await f.slice(0, 12).arrayBuffer());
    const s4 = String.fromCharCode(h[4], h[5], h[6], h[7]), s0 = String.fromCharCode(h[0], h[1], h[2], h[3]), s8 = String.fromCharCode(h[8], h[9], h[10], h[11]);
    return s4 === 'ftyp' || (h[0] === 0x1A && h[1] === 0x45 && h[2] === 0xDF && h[3] === 0xA3) || (s0 === 'RIFF' && s8 === 'AVI ') || s0 === 'OggS';
  } catch (e) { return false; }
}
const isImageFile = f => /^image\/(jpeg|png|gif|webp|avif|bmp)$/.test(f.type) || ZIP_IMG.test(f.name || '');
async function imagesToCbz(files) {
  const JSZip = await loadLib('jszip');
  const z = new JSZip(), list = files.slice().sort((a, b) => natSort(a.name, b.name)), pad = String(list.length).length;
  list.forEach((f, i) => z.file(String(i + 1).padStart(pad, '0') + '-' + (f.name || 'picture').replace(/[\\/]/g, '_'), f));
  const blob = await z.generateAsync({ type: 'blob', compression: 'STORE' });
  const name = list.length === 1 ? baseName(list[0].name) : `Pictures, ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} (${list.length})`;
  return new File([blob], name + '.cbz', { type: 'application/vnd.comicbook+zip' });
}

/* ================= PDF ================= */
function cleanPdfTitle(t) {
  t = normWs(t);
  if (!t || t.length < 2 || /^(untitled|document\d*|microsoft word|slide \d+|\(?anonymous\)?|title)$/i.test(t) || /^microsoft (word|powerpoint) - /i.test(t) || /\.(docx?|pdf|pptx?|indd|tex)$/i.test(t)) return '';
  return t.slice(0, 160);
}
async function parsePdf(buf, opts = {}) {
  const lib = await ensurePdf();
  let pdf;
  try { pdf = await lib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, useSystemFonts: true }).promise; }
  catch (e) {
    if (e && e.name === 'PasswordException') throw new Error('This PDF is password-protected. Remove the password and add it again.');
    throw new Error('This PDF is damaged or not a real PDF.');
  }
  let title = '', author = '';
  try { const m = await pdf.getMetadata(); title = cleanPdfTitle(m && m.info && m.info.Title); author = normWs(m && m.info && m.info.Author).slice(0, 120); } catch (e) { /* no metadata */ }
  if (!title) title = baseName(opts.name);
  if (opts.metaOnly) {
    let cover = null;
    try {
      const page = await pdf.getPage(1);
      const v1 = page.getViewport({ scale: 1 });
      const sc = 1000 / v1.height; const vp = page.getViewport({ scale: sc });
      const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: x, viewport: vp }).promise;
      cover = c.toDataURL('image/jpeg', 0.8);
    } catch (e) { cover = null; }
    const pages = pdf.numPages;
    pdf.destroy();
    return { title, author, cover, pages };
  }
  return { kind: 'pdf', pdf, numPages: pdf.numPages, title, author, cleanup() { try { pdf.destroy(); } catch (e) { /* already closed */ } } };
}

/* ================= Format detection & entry points ================= */
const UNSUPPORTED = {
  mobi: 'MOBI and Kindle files are locked to Kindle apps. Convert them to EPUB with the free Calibre app, then add the EPUB.',
  azw: 'Kindle files (AZW) are locked to Kindle apps. Convert them to EPUB with Calibre, then add the EPUB.',
  azw3: 'Kindle files (AZW3) are locked to Kindle apps. Convert them to EPUB with Calibre, then add the EPUB.',
  kfx: 'Kindle files (KFX) are locked to Kindle apps. Convert them to EPUB with Calibre, then add the EPUB.',
  doc: 'Old Word files (.doc) are not supported. Save the file as .docx or PDF in Word, then add it.',
  odt: 'OpenDocument files are not supported yet. Export the file as .docx or PDF, then add it.',
  pages: 'Apple Pages files are not supported. Export the file as PDF or EPUB from Pages, then add it.',
  djvu: 'DjVu files are not supported. Convert the file to PDF, then add it.',
  cbr: 'CBR comics use the RAR format, which browsers cannot open. Convert the file to CBZ, then add it.',
  zip: 'This zip has nothing Readflix can read. It opens zips of pictures, text, Markdown, HTML, Word (.docx), RTF, FB2, EPUB, PDF and CBZ files.',
  rar: 'RAR archives cannot be opened in a browser. Re-save the folder as a .zip, then add it.',
  '7z': '7z archives cannot be opened in a browser. Re-save the folder as a .zip, then add it.'
};
async function detectFormat(file) {
  const name = file.name || '';
  const ext = (name.includes('.') ? name.split('.').pop() : '').toLowerCase();
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  const isZip = head[0] === 0x50 && head[1] === 0x4B;
  if (isPdf || ext === 'pdf') return isPdf ? { fmt: 'pdf' } : { err: 'This file is named .pdf but is not a PDF.' };
  if (ext === 'epub' || ext === 'kepub') return { fmt: 'epub' };
  if (ext === 'docx') return { fmt: 'docx' };
  if (ext === 'cbz') return { fmt: 'cbz' };
  if (['txt', 'text', 'log', 'nfo'].includes(ext)) return { fmt: 'txt' };
  if (['md', 'markdown', 'mdown', 'mkd'].includes(ext)) return { fmt: 'md' };
  if (['html', 'htm', 'xhtml', 'xht'].includes(ext)) return { fmt: 'html' };
  if (ext === 'fb2') return { fmt: 'fb2' };
  if (ext === 'rtf') return { fmt: 'rtf' };
  if (UNSUPPORTED[ext] && !isZip) return { err: UNSUPPORTED[ext] };
  if (isZip) {
    try {
      const JSZip = await loadLib('jszip'); const z = await JSZip.loadAsync(file);
      const mt = z.file('mimetype'); if (mt && /epub/.test(await mt.async('string'))) return { fmt: 'epub' };
      if (z.file('word/document.xml')) return { fmt: 'docx' };
      const e = zipEntries(z), docs = zipRealDocs(z, e);
      if (e.book.length) return { expand: z, books: e.book, fmt: docs.length ? 'zip' : e.img.length >= 3 ? 'cbz' : null };
      if (docs.length) return { fmt: 'zip' };
      if (e.img.length) return { fmt: 'cbz' };
    } catch (e) { /* not a readable zip */ }
    return { err: UNSUPPORTED.zip };
  }
  if (UNSUPPORTED[ext]) return { err: UNSUPPORTED[ext] };
  if (/^text\//.test(file.type) || !ext) return { fmt: 'txt' };
  return { err: `“${name}” is not a format Readflix can open yet.` };
}
async function parseBook(blob, fmt, name, metaOnly) {
  const buf = await blob.arrayBuffer();
  const o = { name, metaOnly };
  switch (fmt) {
    case 'epub': return parseEpub(buf, o);
    case 'pdf': return parsePdf(buf, o);
    case 'cbz': return parseCbz(buf, o);
    case 'zip': return parseZip(buf, o);
    case 'docx': return parseDocx(buf, name);
    case 'md': return parseMd(buf, name);
    case 'html': return parseHtml(buf, name);
    case 'fb2': return parseFb2(buf, name);
    case 'rtf': return parseRtf(buf, name);
    default: return parseTxt(buf, name);
  }
}

/* ================= Sample book ================= */
const SAMPLE_ID = 'sample-quiet-hour';
const SAMPLE = [
['Start here', `<h1>Start here</h1>
<p>This is a sample book. Read a little of it, mark it up, try the tools, then remove it from your shelf whenever you like. Everything you do here works the same way in your own books.</p>
<h2>Bring your books</h2>
<p>Choose <strong>Open books</strong> on the shelf, or drop files anywhere on the window. Readflix reads EPUB, PDF, Word (.docx), Markdown, plain text, HTML, FictionBook (.fb2), comic archives (.cbz), RTF, pictures, and zip folders of any of these. You can also paste text you want to read later.</p>
<p>Your books stay in this browser, on this device. Nothing is uploaded, and your place in every book is saved as you read.</p>
<h2>Mark what matters</h2>
<p>Select any passage and a small toolbar appears. Pick one of four inks to highlight it, add a note, copy it, or start the speed reader from that point. Tap a highlight later to change its ink, edit its note, or remove it. Every highlight and note collects in <strong>Notes</strong>, where you can copy them all as Markdown.</p>
<p>Try it on this sentence: the best time to underline is the moment a line makes you pause.</p>
<h2>Stay with the page</h2>
<p>The focus tools live behind the target icon at the top of the reader. Each one does a single job.</p>
<dl>
<dt><strong>Reading ruler</strong></dt><dd>Dims everything except a narrow band of lines that follows your pointer. On a phone it rests a third of the way down the screen and the text scrolls through it.</dd>
<dt><strong>Paragraph spotlight</strong></dt><dd>Fades every paragraph except the one you are in. Press J and K to step forward and back.</dd>
<dt><strong>Bionic emphasis</strong></dt><dd>Sets the first letters of each word in bold so your eye can glide along the line.</dd>
<dt><strong>Speed reader</strong></dt><dd>Shows one word at a time at a steady pace, with the point where your eye lands marked in color.</dd>
<dt><strong>Auto-scroll</strong></dt><dd>Moves the text up slowly and steadily, so you never reach for the scrollbar.</dd>
<dt><strong>Focus session</strong></dt><dd>A timer that hides the controls, keeps the screen awake, counts the times you left the page, and ends with a soft chime and a short summary.</dd>
<dt><strong>Soundscape</strong></dt><dd>Rain, brown noise, ocean, a low fan or a crackling bonfire, generated on your device to cover the room around you. You can also add an audio file of your own and it will play on repeat.</dd>
<dt><strong>Eye breaks</strong></dt><dd>Every twenty minutes of reading, a quiet reminder to look at something far away for twenty seconds.</dd>
</dl>
<h2>Make it easy on your eyes</h2>
<p>Open <strong>Text and display</strong> (the Aa icon) to choose among seven reading surfaces, from warm paper to a true-black night page. Six typefaces are included. Atkinson Hyperlegible was drawn to keep similar letters distinct, and the wider spacing of Lexend helps many readers keep their place on the line. Warmth takes the blue edge off the screen, and Dim lowers brightness further than most screens allow.</p>
<p>Read by scrolling, one page at a time, or as an open book with two pages side by side on a wide screen. Pages turn with a curl animation and a soft paper sound, and you can switch either off. On a phone, tap the right or left edge to turn the page, and tap the middle to show the controls.</p>
<h2>Keys</h2>
<table><tbody>
<tr><td>Space or →</td><td>Next page or screen</td></tr>
<tr><td>←</td><td>Previous page or screen</td></tr>
<tr><td>J and K</td><td>Next and previous paragraph</td></tr>
<tr><td>T, /, N</td><td>Contents, search, notes</td></tr>
<tr><td>B</td><td>Bookmark this page</td></tr>
<tr><td>F</td><td>Deep focus</td></tr>
<tr><td>L, S, R, A</td><td>Ruler, spotlight, speed reader, auto-scroll</td></tr>
<tr><td>+ and −</td><td>Text size</td></tr>
<tr><td>Esc</td><td>Close or exit</td></tr>
</tbody></table>
<p>Press ? at any time to see every shortcut.</p>`],
['The Narrow Window', `<h1>The Narrow Window</h1>
<p>Attention is not a floodlight. It behaves more like a window in a thick wall: narrow, bright inside, and easy to block. When you read, a few words at a time pass through that window, and your mind stitches them into scenes and arguments. Everything you understand from a book arrives this way, one small opening at a time.</p>
<p>The difficulty is that the window has many claimants. A notification, a half-remembered errand, the sound of a conversation in the next room: each one asks to be let through, and each request costs something even when you refuse it. Researchers call what lingers after a switch attention residue. You return to the page, but part of you is still standing at the place you left.</p>
<p>This is why twenty minutes of unbroken reading can feel longer and richer than an hour of reading in fragments. The fragments add up to the same number of pages, but not to the same book. A story needs its threads held in mind at once. An argument needs its premises still present when the conclusion arrives. Interruptions do not just slow reading down. They quietly remove the parts that made the reading worth doing.</p>
<p>You cannot widen the window. You can decide what stands in front of it. Close what you do not need. Choose a length of time you can honestly protect. Let the page be the brightest thing in the room.</p>
<p>None of this calls for heroic discipline. It calls for arrangement. Most of the contest for your attention is settled before the first sentence, in small decisions about where you sit, what is open, and what you have agreed to ignore for a while. Arrange things well and the reading mostly takes care of itself.</p>`],
['Slow on Purpose', `<h1>Slow on Purpose</h1>
<p>There is a popular idea that the good reader is the fast reader. Speed has its uses. Skimming a report for the one number you need is a real skill, and the speed reader in this app exists for exactly that kind of material. But most books worth keeping were not written to be consumed at the highest possible rate. They were written to be lived inside for a while.</p>
<p>Slow reading is not reading with strain. It is reading at the pace of understanding. You let a sentence finish before you move to the next. When a paragraph surprises you, you stay with the surprise instead of hurrying past it. Sometimes you read a line twice, the first time for its meaning and the second for its sound.</p>
<p>Here is a useful test. At the end of a page, can you say in one sentence what just happened? If you can, your pace is fine, whatever the number. If you cannot, no count of words per minute has helped you.</p>
<p>Slowness also leaves room for your own thoughts. A good book starts a conversation it cannot finish alone. The gaps between sentences are where you answer back, where you notice that a character reminds you of someone, or that an argument fails in a case you know well. Rush, and the gaps close.</p>
<p>So fit the tools to the book in front of you. For a dense chapter, turn on the paragraph spotlight and give each paragraph the whole stage. For light material, let auto-scroll carry you along. The aim is not a particular speed. It is to be fully present at whatever speed the book deserves.</p>`],
['A Room With One Door', `<h1>A Room With One Door</h1>
<p>Every reading space has doors. Some are real: the door to the hallway, the window onto the street. Most are not. The browser tab with unread mail is a door. So is the phone lying face down on the table, which is still a phone even when you cannot see its screen. A room with many doors is a hard room to stay in.</p>
<p>The simplest focus technique is to close doors before you need to. Put the phone in another room rather than in your pocket. Close the tabs you will not need for the next half hour. Decide in advance how long you will read, and let a timer hold that promise so you do not have to keep checking the clock.</p>
<p>A focus session here does several of those things for you. It takes the page full screen and hides the controls. It keeps the screen from sleeping. And it quietly counts each time you leave the page, not to scold you, but so you can see the pattern. Most people are surprised by the number the first time. By the third or fourth session it usually falls.</p>
<p>Sound is another door, and you can close it with more sound. Steady, featureless noise softens the sharp edges of a room: a conversation, a television, traffic. That is the idea behind the soundscapes. They carry no melody and no words, so there is nothing in them to follow.</p>
<p>Leave one door open, the one you came through to read. When the session ends, walk out through it. Stretch, look out of a window, drink some water. Attention recovers with rest, and the next session will be better for the break.</p>`],
['Notes in the Margin', `<h1>Notes in the Margin</h1>
<p>For most of the history of books, readers wrote in them. Medieval scholars filled margins with commentary. Later readers underlined, argued, and drew small hands pointing at the lines they wanted to find again. A well-read copy was a record of a conversation between a book and a person.</p>
<p>Marking a book is a way of reading more slowly and more actively at once. To decide what to highlight, you have to decide what matters. To write a note, you have to put a thought into words, and putting a thought into words is often how you find out what the thought was.</p>
<p>A few habits make highlights more useful later. Let the inks mean something. One simple scheme: honey for key ideas, mint for evidence and examples, sky for questions, rose for lines you simply love. Highlight less than you think you should, because a page covered in color is as hard to scan as a page with none. And when a passage sets off a thought, write the thought down while you still have it. A highlight remembers what the author said. A note remembers what you made of it.</p>
<p>When you finish a book, open Notes and read through everything you marked. It takes a few minutes and returns most of the book to you. Copy it all as Markdown and keep it with your other writing, where it can feed whatever you make next.</p>
<p>That is the end of this small book. Remove it from your shelf when you are ready, and bring in one of your own.</p>`]
];
function buildSampleDoc() {
  const chapters = SAMPLE.map(([title, html]) => { const t = IDOC.createElement('div'); t.innerHTML = html; return { title, html, len: t.textContent.length }; });
  const toc = [];
  chapters.forEach((c, i) => {
    toc.push({ title: c.title, ch: i, level: 0 });
    if (i === 0) {
      const t = IDOC.createElement('div'); t.innerHTML = c.html;
      Array.from(t.querySelectorAll('h2')).forEach((h, k) => { toc.push({ title: h.textContent, ch: 0, anchor: 'sp-g' + k, level: 1 }); h.id = 'sp-g' + k; });
      c.html = t.innerHTML;
    }
  });
  return flowDoc({ title: 'The Quiet Hour', author: 'A Readflix sample', lang: 'en', chapters, toc });
}
const sampleMeta = () => ({ id: SAMPLE_ID, name: 'The Quiet Hour', size: 0, format: 'sample', title: 'The Quiet Hour', author: 'A short sample book', cover: null, added: Date.now(), opened: 0, progress: 0, pos: null, highlights: [], bookmarks: [], readSec: 0 });

/* ================= Library ================= */
let books = [];
const PALETTES = [['#2F5D50', '#EAF2EC'], ['#3B4D6B', '#E8EEF7'], ['#7A4B3A', '#F6EAE3'], ['#57455F', '#F1E9F4'], ['#80662C', '#FBF3DF'], ['#2C5A62', '#E3F2F3'], ['#3A403E', '#ECEFED'], ['#6A3A46', '#F7E7EB']];
const fmtLabel = f => ({ sample: 'Sample', epub: 'EPUB', pdf: 'PDF', docx: 'DOCX', md: 'MD', html: 'HTML', txt: 'TXT', fb2: 'FB2', cbz: 'CBZ', rtf: 'RTF', zip: 'ZIP' }[f] || String(f || '').toUpperCase());
function coverHtml(b) {
  if (b.private && S.vaultBlur) return `<div class="blurred">${coverInner(b)}</div>`;
  return coverInner(b);
}
function coverInner(b) {
  if (b.cover && /^data:image\//.test(b.cover)) return `<div class="cover"><img src="${b.cover}" alt="" loading="lazy" decoding="async"><span class="fmt">${fmtLabel(b.format)}</span></div>`;
  const pal = PALETTES[hash(b.title || '') % PALETTES.length];
  return `<div class="cover" style="background:${pal[0]};color:${pal[1]}"><div class="gen"><b>${esc(b.title)}</b><span>${esc(b.author || '')}</span></div><span class="fmt">${fmtLabel(b.format)}</span></div>`;
}
const progLabel = b => b.progress >= 0.995 ? 'Finished' : b.progress > 0 ? Math.max(1, Math.round(b.progress * 100)) + '%' : 'New';

const EYE = '<svg class="i" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
/* ---- Book colour: every book lends its own tint to its spine, its shelf glow and the room around it ---- */
const tintCache = new Map();
function fallbackTint(b) { return PALETTES[hash(b.title || '') % PALETTES.length][0]; }
function bookTint(b) { return tintCache.get(b.id) || fallbackTint(b); }
function hexRgb(h) { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [60, 90, 80]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
const rgbHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const lum = h => { const [r, g, b] = hexRgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
function measureTint(b) {
  if (tintCache.has(b.id) || !b.cover || !/^data:image\//.test(b.cover)) return Promise.resolve(null);
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = 12; c.height = 18;
        const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 12, 18);
        const d = x.getImageData(0, 0, 12, 18).data;
        let r = 0, g = 0, bl = 0, w = 0;
        for (let k = 0; k < d.length; k += 4) {
          const R = d[k], G = d[k + 1], B = d[k + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B);
          const sat = mx ? (mx - mn) / mx : 0, wt = 0.25 + sat * 2 + (mx > 30 && mx < 235 ? 0.5 : 0);
          r += R * wt; g += G * wt; bl += B * wt; w += wt;
        }
        r /= w; g /= w; bl /= w;
        const l = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255, f = l > 0.62 ? 0.62 / l : l < 0.16 ? 0.16 / Math.max(l, 0.02) : 1;
        const hex = rgbHex(r * f, g * f, bl * f);
        tintCache.set(b.id, hex); res(hex);
      } catch (e) { res(null); }
    };
    im.onerror = () => res(null); im.src = b.cover;
  });
}
function paintRoom(b) {
  const lib = $('#library'); if (!lib) return;
  const t = b ? bookTint(b) : getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#2E6A5C';
  const [r, g, bl] = hexRgb(t);
  lib.style.setProperty('--tint', t); lib.style.setProperty('--tint-rgb', `${r},${g},${bl}`);
}

/* ---- A real 3D book: cover, spine, page block, page tops and back ---- */
function thickness(b) { const kb = Math.max(1, (b.size || 200000) / 1024); return clamp(5 + Math.log2(kb) * 0.9, 7, 17).toFixed(1); }
function book3d(b, cls = '') {
  const t = bookTint(b);
  return `<div class="b3d ${cls}" style="--tint:${t};--thk:${thickness(b)}"><div class="b3d-rot">
    <div class="b3d-back"></div><div class="b3d-pages"></div><div class="b3d-top"></div><div class="b3d-spine"><span>${esc((b.title || '').slice(0, 60))}</span></div>
    <div class="b3d-leaf"></div><div class="b3d-front">${coverHtml(b)}<i class="sheen"></i></div>
  </div><i class="b3d-shadow"></i></div>`;
}

async function loadBooks() {
  books = (await DB.allBooks()).filter(b => !b.private);
  if (!ls.get('sp.sampleRemoved', false) && !books.some(b => b.id === SAMPLE_ID)) { const m = sampleMeta(); books.push(m); await DB.putBook(m); }
  books.forEach(b => { b.highlights = b.highlights || []; b.bookmarks = b.bookmarks || []; });
}

function streak() {
  let n = 0; const d = new Date();
  if ((stats.days[todayKey(d)] || 0) < 60) d.setDate(d.getDate() - 1);
  while ((stats.days[todayKey(d)] || 0) >= 60) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
/* ---- Reading numbers shared by the side panel, the home stats and the hero ---- */
function weekDays() {
  const days = [], d = new Date(); d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) { days.push({ k: todayKey(d), l: d.toLocaleDateString(undefined, { weekday: 'narrow' }), now: i === 6 }); d.setDate(d.getDate() + 1); }
  return days;
}
function ringSvg(frac, r, sw, cls) {
  const C = 2 * Math.PI * r, s = r * 2 + sw * 2;
  return `<svg class="${cls}" viewBox="0 0 ${s} ${s}" aria-hidden="true"><circle class="trk" cx="${s / 2}" cy="${s / 2}" r="${r}" stroke-width="${sw}"/><circle class="val" cx="${s / 2}" cy="${s / 2}" r="${r}" stroke-width="${sw}" stroke-dasharray="${Math.max(0.01, C * frac).toFixed(1)} ${C.toFixed(1)}"/></svg>`;
}
/* ================= Home =================
   A cinema-style front page: the book you are reading fills the top with its own art,
   then quiet rows of covers. Colour comes from the books, not from decoration. */
function coverURL(b) { return b.cover && /^data:image\//.test(b.cover) ? b.cover : null; }
function artHtml(b, cls = '') {
  const u = coverURL(b), veil = b.private && S.vaultBlur ? ' veiled' : '';
  if (u) return `<img class="art${veil} ${cls}" src="${u}" alt="" loading="lazy" decoding="async">`;
  const pal = PALETTES[hash(b.title || '') % PALETTES.length];
  return `<span class="art gen ${cls}" style="--c1:${pal[0]};--c2:${pal[1]}"><b>${esc(b.title)}</b>${b.author ? `<small>${esc(b.author)}</small>` : ''}</span>`;
}
function renderSideGoal() { /* goal shows in the strip under the hero */ }
function renderToday() {
  const sec = stats.days[todayKey()] || 0, goal = S.goal * 60, frac = Math.min(1, sec / goal);
  const days = weekDays(), weekSec = days.reduce((a, x) => a + (stats.days[x.k] || 0), 0), st = streak();
  const shelf = shelfBooks(), done = shelf.filter(b => b.progress >= 0.995).length;
  const max = Math.max(goal, ...days.map(x => stats.days[x.k] || 0));
  $('#today').innerHTML = `
    <div class="st-i"><span class="st-ring">${ringSvg(frac, 9, 3, 'gring')}</span><span><b>${Math.floor(sec / 60)} of ${S.goal} min</b><small>today</small></span></div>
    <div class="st-i"><span class="st-spark">${days.map(x => { const v = stats.days[x.k] || 0; return `<i class="${v >= goal ? 'met' : v ? 'some' : ''}" style="--h:${v ? Math.max(18, Math.round(v / max * 100)) : 10}%"></i>`; }).join('')}</span><span><b>${fmtMin(weekSec)}</b><small>this week</small></span></div>
    <div class="st-i"><span><b>${st} ${st === 1 ? 'day' : 'days'}</b><small>streak</small></span></div>
    <div class="st-i"><span><b>${done} of ${shelf.length}</b><small>finished</small></span></div>`;
}
const shelfBooks = () => books.filter(b => !!b.private === Vault.view);
let shelfQuery = '';
const FILTERS = [['all', 'All'], ['reading', 'Reading'], ['new', 'Not started'], ['done', 'Finished']];
const inFilter = (b, f) => f === 'reading' ? b.progress > 0 && b.progress < 0.995 : f === 'new' ? !(b.progress > 0) : f === 'done' ? b.progress >= 0.995 : true;
function sortedBooks() {
  let arr = shelfBooks().filter(b => inFilter(b, S.libFilter));
  const q = normWs(shelfQuery).toLowerCase();
  if (q) arr = arr.filter(b => ((b.title || '') + ' ' + (b.author || '') + ' ' + (b.name || '')).toLowerCase().includes(q));
  if (S.sortBy === 'title') arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
  else if (S.sortBy === 'progress') arr.sort((a, b) => (b.progress || 0) - (a.progress || 0) || (b.opened || 0) - (a.opened || 0));
  else arr.sort((a, b) => Math.max(b.opened || 0, b.added || 0) - Math.max(a.opened || 0, a.added || 0));
  return arr;
}
function timeLeft(b) {
  const p = b.progress || 0;
  if (p < 0.03 || p >= 0.995 || !(b.readSec > 120)) return '';
  const left = b.readSec * (1 - p) / p;
  return left < 3600 ? `${Math.max(1, Math.round(left / 60))} min left` : `${(left / 3600).toFixed(left < 36000 ? 1 : 0)} h left`;
}
function whereLabel(b) { const p = b.pos; return p && p.page != null && (b.format === 'pdf' || b.format === 'cbz') ? `Page ${p.page + 1}` : ''; }
function greet() { const h = new Date().getHours(); return h < 5 ? 'Reading late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
const IC_WATCH = '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.5v5l4.5-2.5z"/></svg>';
function renderHero(shelf) {
  const cEl = $('#continue');
  const opened = shelf.filter(b => b.opened).sort((a, b) => b.opened - a.opened);
  const cont = opened[0] || shelf.find(b => b.id === SAMPLE_ID) || shelf[0];
  document.body.classList.toggle('no-hero', !cont);
  if (!cont) { cEl.hidden = true; cEl.innerHTML = ''; paintRoom(null); $('#roomArt').style.backgroundImage = ''; return null; }
  const p = Math.round((cont.progress || 0) * 100), tl = timeLeft(cont), where = whereLabel(cont), u = coverURL(cont) && !(cont.private && S.vaultBlur) ? coverURL(cont) : null;
  const hasVid = !!(cont.video && (cont.video.name || (cont.video.marks || []).length));
  const kind = cont.format === 'cbz' || cont.format === 'zip' ? 'Comic' : cont.format === 'pdf' ? 'Document' : 'Book';
  const ad = Vault.view;
  const meta = [where, tl, hasVid ? 'Video linked' : ''].filter(Boolean);
  const status = cont.progress >= 0.995 ? 'Finished' : p ? `${p}% read` : 'New';
  cEl.hidden = false;
  cEl.innerHTML = `<div class="hx-wash"${u ? ` style="background-image:url('${u}')"` : ''}></div>
    <div class="hx-art"${u ? ` style="background-image:url('${u}')"` : ''}>${u ? '' : artHtml(cont)}</div>
    <i class="hx-vig" aria-hidden="true"></i>
    <div class="hx-in">
      <div class="hx-copy">
        <p class="hx-k"><b>R</b><span>${ad ? 'Private · ' : ''}${kind}</span></p>
        <h1 class="hx-title">${esc(cont.title)}</h1>
        <p class="hx-meta"><span class="hx-status">${status}</span>${meta.map(m => `<span>${esc(m)}</span>`).join('')}<span class="hx-fmtb">${fmtLabel(cont.format)}</span></p>
        ${cont.author ? `<p class="hx-by">${cont.opened ? 'Pick up where you left off.' : 'Start reading now.'} By ${esc(cont.author)}.</p>` : `<p class="hx-by">${cont.opened ? 'Pick up where you left off.' : 'Start reading now.'}</p>`}
        <div class="hx-actions">
          <button class="hbtn solid" data-act="openBook" data-id="${esc(cont.id)}">${ICON.play}${cont.opened ? 'Resume' : 'Read'}</button>
          <button class="hbtn ghost" data-act="peek" data-id="${esc(cont.id)}"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1" stroke-width="2.2"/></svg>More info</button>
          <button class="hbtn ghost" data-act="watchBook" data-id="${esc(cont.id)}" title="Open with a video beside it">${IC_WATCH}Read with video</button>
          <span class="hero-more card" data-id="${esc(cont.id)}"><button class="hbtn round card-menu-h" data-act="cardMenu" data-id="${esc(cont.id)}" aria-label="More options for ${esc(cont.title)}" title="More">${ICON.more}</button></span>
        </div>
      </div>
    </div>
    <span class="hx-rating">${ad ? '18+' : fmtLabel(cont.format)}</span>
    <button class="hx-poster" data-act="openBook" data-id="${esc(cont.id)}" aria-label="${cont.opened ? 'Resume' : 'Open'} ${esc(cont.title)}">${artHtml(cont)}${p > 0 && p < 100 ? `<i class="cv-bar"><i style="width:${p}%"></i></i>` : ''}</button>`;
  $('#roomArt').style.backgroundImage = '';
  paintRoom(cont);
  return cont;
}
const IC_PLAYC = '<svg class="i" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z"/></svg>';
function rowCard(b, rank) {
  const p = Math.round((b.progress || 0) * 100), done = b.progress >= 0.995;
  const sub = [done ? 'Finished' : p ? p + '%' : 'New', fmtLabel(b.format)].join(' · ');
  return `<div class="rc cv${rank ? ' ranked' : ''}" data-id="${esc(b.id)}">${rank ? `<span class="cv-rank" aria-hidden="true">${rank}</span>` : ''}<div class="bk">
      <button class="cv-open" data-act="openBook" data-id="${esc(b.id)}" aria-label="Open ${esc(b.title)}">${artHtml(b)}
        <span class="cv-hover" aria-hidden="true"><span class="cv-play">${IC_PLAYC}</span><b>${esc(b.title)}</b><small>${esc(sub)}</small></span>
      </button>
      ${p > 0 && !done ? `<i class="cv-line"><i style="width:${p}%"></i></i>` : ''}
      <button class="card-menu" data-act="cardMenu" data-id="${esc(b.id)}" aria-label="More options for ${esc(b.title)}" title="More">${ICON.more}</button>
    </div>
    ${rank ? '' : `<div class="cv-meta"><div class="cv-tx"><div class="cv-t">${esc(b.title)}</div><div class="cv-s">${esc(b.author || fmtLabel(b.format))}</div></div><button class="cv-more" data-act="cardMenu" data-id="${esc(b.id)}" aria-label="More options for ${esc(b.title)}">${ICON.more}</button></div>`}</div>`;
}
const addCard = () => `<label class="cv cv-add" for="fileInput" tabindex="0"><span class="cv-addin"><i><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></i><b>Add books</b><small>Comics, manga, PDF, EPUB, zip</small></span></label>`;
function renderRows(shelf, hero) {
  const ad = Vault.view, notHero = b => !hero || b.id !== hero.id;
  const reading = shelf.filter(b => b.progress > 0 && b.progress < 0.995 && notHero(b)).sort((a, b) => (b.opened || 0) - (a.opened || 0));
  const recent = shelf.filter(notHero).sort((a, b) => (b.added || 0) - (a.added || 0));
  const done = shelf.filter(b => b.progress >= 0.995).sort((a, b) => (b.opened || 0) - (a.opened || 0));
  const comics = shelf.filter(b => (b.format === 'cbz' || b.format === 'zip') && notHero(b));
  const top = shelf.filter(b => (b.readSec || 0) > 0).sort((a, b) => (b.readSec || 0) - (a.readSec || 0)).slice(0, 10);
  const EDGE = d => `<button class="cr-edge ${d < 0 ? 'prev' : 'next'}" data-act="rowScroll" data-d="${d}" aria-label="Scroll ${d < 0 ? 'left' : 'right'}"><svg class="i" viewBox="0 0 24 24"><path d="${d < 0 ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'}"/></svg></button>`;
  const row = (title, list, filter, extra = '', cls = '', ranked = false) => `<section class="cr ${cls}" aria-label="${esc(title)}"><header class="cr-h"><h2>${filter ? `<button class="cr-link" data-act="seeAll" data-f="${filter}">${esc(title)}<span>Explore all<svg class="i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span></button>` : esc(title)}</h2></header><div class="cr-wrap">${EDGE(-1)}<div class="cr-s">${list.map((b, k) => rowCard(b, ranked ? k + 1 : 0)).join('')}${extra}</div>${EDGE(1)}</div></section>`;
  const out = [];
  if (reading.length) out.push(row('Continue Reading', reading.slice(0, 20), 'reading'));
  if (top.length >= 3) out.push(row(ad ? 'Top picks in Private' : 'Top 10 on your shelf', top, '', '', 'top', true));
  out.push(row(ad ? 'Your private shelf' : 'Recently Added', recent.slice(0, 20), shelf.length > 1 ? 'all' : '', addCard()));
  if (comics.length >= 2) out.push(row('Comics & Manga', comics.slice(0, 20), ''));
  if (done.length) out.push(row('Read It Again', done.slice(0, 20), 'done'));
  $('#rows').innerHTML = out.join('');
}
/* Library: a calm grid of covers, or a bookshelf of spines */
let shelfW = 0;
function spineSize(b) { const h = hash((b.id || '') + 'sp'); return { w: 30 + (h % 22) + Math.round((+thickness(b) - 7) * 1.4), h: 172 + ((h >> 5) % 44) }; }
function bookCard(b) {
  const p = Math.round((b.progress || 0) * 100), done = b.progress >= 0.995;
  return `<div class="card cv" data-id="${esc(b.id)}">
    <div class="bk">
      <button class="cv-open card-open" data-act="openBook" data-id="${esc(b.id)}" aria-label="Open ${esc(b.title)}">${artHtml(b)}${p > 0 && !done ? `<i class="cv-bar"><i style="width:${p}%"></i></i>` : ''}${done ? '<i class="cv-done">Finished</i>' : ''}<i class="cv-fmt">${fmtLabel(b.format)}</i></button>
      <button class="card-menu" data-act="cardMenu" data-id="${esc(b.id)}" aria-label="More options for ${esc(b.title)}" title="More">${ICON.more}</button>
      <button class="card-peek" data-act="peek" data-id="${esc(b.id)}" aria-label="Preview ${esc(b.title)}" title="Preview pages">${EYE}</button>
    </div>
    <div class="cv-meta"><div class="cv-tx"><div class="cv-t card-title">${esc(b.title)}</div><div class="cv-s">${esc(b.author || fmtLabel(b.format))}${p > 0 && !done ? ` · ${p}%` : ''}</div></div><button class="cv-more" data-act="cardMenu" data-id="${esc(b.id)}" aria-label="More options for ${esc(b.title)}">${ICON.more}</button></div>
  </div>`;
}
function spineCard(b) {
  const { w, h } = spineSize(b), t = bookTint(b), light = lum(t) > 0.55;
  const p = Math.round((b.progress || 0) * 100);
  const blur = b.private && S.vaultBlur;
  return `<div class="card sp" data-id="${esc(b.id)}" style="--sw:${w}px;--sh:${h}px;--tint:${t}">
    <button class="card-open spine${light ? ' ink' : ''}${blur ? ' veiled' : ''}" data-act="openBook" data-id="${esc(b.id)}" aria-label="Open ${esc(b.title)}">
      <i class="band b1"></i><span class="card-title">${blur ? 'Private' : esc(b.title)}</span><i class="band b2"></i><span class="sp-fmt">${fmtLabel(b.format)}</span>${p && p < 100 ? `<i class="sp-prog"></i>` : ''}
    </button>
    <div class="sp-tip" role="presentation"><b>${blur ? 'Private book' : esc(b.title)}</b>${b.author && !blur ? `<span>${esc(b.author)}</span>` : ''}<span>${progLabel(b)}</span></div>
    <button class="card-menu" data-act="cardMenu" data-id="${esc(b.id)}" aria-label="More options for ${esc(b.title)}">${ICON.more}</button>
  </div>`;
}
function renderShelf() {
  const grid = $('#grid'), ad = Vault.view, shelf = shelfBooks();
  closeCardMenus();
  $('#filterChips').innerHTML = FILTERS.map(([v, l]) => { const n = shelf.filter(b => inFilter(b, v)).length; return `<button type="button" class="chip" data-set="libFilter" data-val="${v}" aria-pressed="${S.libFilter === v}">${l}<b>${n}</b></button>`; }).join('');
  $$('#viewSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === S.shelfView)));
  $$('#sortSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sort === S.sortBy)));
  segThumbs();
  if (!shelf.length) {
    grid.className = 'bookcase empty-case';
    grid.innerHTML = `<div class="empty"><div class="empty-art" aria-hidden="true"><i></i><i></i><i></i></div><h3>${ad ? 'Your private shelf is empty' : 'Your library is empty'}</h3><p>${ad ? 'Add EPUB, PDF, CBZ manga and comics, pictures, zip folders or any other book. Everything you add here is encrypted with your PIN.' : 'Add an EPUB, PDF, Word file, pictures, a zip folder or any text you want to read with your full attention.'}</p><label class="btn primary lg" for="fileInput">${ad ? 'Add private books' : 'Open books'}</label></div>`;
    return;
  }
  const list = sortedBooks();
  if (!list.length) { grid.className = 'bookcase'; grid.innerHTML = `<div class="nomatch">${shelfQuery ? `No books match “${esc(normWs(shelfQuery))}”.` : 'No books here yet.'}</div>`; return; }
  if (S.shelfView === 'spines') {
    const W = grid.clientWidth || Math.min(1100, innerWidth) - 48; shelfW = W;
    grid.className = 'bookcase spines';
    const rows = []; let row = [], acc = 0; const gap = 4, pad = 40;
    for (const b of list) { const w = spineSize(b).w; if (row.length && acc + gap + w > W - pad) { rows.push(row); row = []; acc = 0; } row.push(b); acc += (row.length > 1 ? gap : 0) + w; }
    if (row.length) rows.push(row);
    grid.innerHTML = rows.map((r, i) => `<div class="shelf-row" style="--ri:${i}"><div class="spine-row">${r.map(spineCard).join('')}<span class="bookend" aria-hidden="true"></span></div><i class="plank" aria-hidden="true"></i></div>`).join('');
  } else {
    shelfW = grid.clientWidth;
    grid.className = 'bookcase covers';
    grid.innerHTML = list.map(bookCard).join('');
  }
  list.forEach(b => { if (!tintCache.has(b.id) && b.cover && !(b.private && S.vaultBlur)) measureTint(b).then(h => { if (!h) return; $$(`[data-id="${CSS.escape(b.id)}"]`, $('#library')).forEach(c => { const x = c.classList.contains('card') ? c : null; if (x) x.style.setProperty('--tint', h); const bb = $('.b3d', c.closest('.card,.rc') || c); if (bb) bb.style.setProperty('--tint', h); const sp = $('.spine', c); if (sp) sp.classList.toggle('ink', lum(h) > 0.55); }); }); });
}
function segThumbs() {
  $$('#library .seg').forEach(seg => {
    const th = $('.thumb', seg), on = $('button[aria-pressed="true"]', seg);
    if (!th || !on || !seg.offsetWidth) return;
    th.style.width = on.offsetWidth + 'px'; th.style.transform = `translateX(${on.offsetLeft - 3}px)`;
  });
}
function renderLibrary() {
  const warn = $('#storeWarn');
  warn.hidden = !!DB.db;
  if (!DB.db) warn.textContent = 'This browser is not letting Readflix keep your library, so added books will close when you leave. A regular (non-private) window usually fixes this.';
  const ad = Vault.view, tab = S.libTab === 'library' ? 'library' : 'home';
  document.body.classList.toggle('afterdark', ad);
  document.body.classList.toggle('tab-lib', tab === 'library'); document.body.classList.toggle('tab-home', tab === 'home');
  $$('[data-set="libTab"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === tab)));
  $('#wordmark').textContent = 'Readflix'; $('#wordmark').dataset.tag = ad ? 'Private' : '';
  $('#brandMark').toggleAttribute('hidden', ad); $('#brandMoon').toggleAttribute('hidden', !ad);
  $('#adBtn').hidden = ad || S.vaultHideBtn; $('#adLock').hidden = !ad; $('#adSet').hidden = false; $('#adSet').title = ad ? 'Private settings' : 'Settings'; $('#adSet').setAttribute('aria-label', ad ? 'Private settings' : 'Settings');
  $('.formats').textContent = ad ? 'Private books are encrypted on this device with your PIN and never appear on your main shelf. Press Esc twice at any time to lock Private instantly.' : 'Opens EPUB, PDF, Word (.docx), Markdown, plain text, HTML, FictionBook (.fb2), comic archives (.cbz), RTF, pictures, and zip folders of any of these. Drop files anywhere on this page. Your books stay in this browser on this device and are never uploaded.';
  const shelf = shelfBooks();
  $('#shelfCount').textContent = shelf.length ? String(shelf.length) : '';
  $('#libEyebrow').textContent = ad ? 'Private · encrypted with your PIN' : shelf.length === 1 ? '1 book' : `${shelf.length} books`;
  renderSideGoal();
  $('#today').hidden = ad;
  if (!ad) renderToday();
  const hero = renderHero(shelf);
  renderRows(shelf, hero);
  if (shelf.length < 2 && shelfQuery) { shelfQuery = ''; $('#shelfSearch').value = ''; }
  renderShelf();
  setTimeout(() => CoverFix.run(), 600);
}
function closeCardMenus() {
  const had = !!$('.card-pop.act-sheet');
  $$('.card-pop').forEach(p => { if (p.classList.contains('act-sheet')) { p.classList.add('out'); setTimeout(() => p.remove(), 220); p.classList.remove('card-pop'); } else p.remove(); });
  $$('.act-scrim').forEach(x => { x.classList.add('out'); setTimeout(() => x.remove(), 220); });
  $$('.card.menu-open, .rc.menu-open').forEach(c => c.classList.remove('menu-open'));
  document.body.classList.remove('sheet-open');
  if (had && typeof OV !== 'undefined') OV.close('sheet');
}
/* Phones get a bottom action sheet (like a native app); larger screens get a small menu that always stays on screen */
const useSheet = () => window.matchMedia('(max-width: 760px), (hover: none) and (pointer: coarse)').matches;
const MI = {
  play: '<svg class="i" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  eye: '<svg class="i" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  restart: '<svg class="i" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>'
};
function openCardMenu(id, btn) {
  const card = btn.closest('.card, .rc');
  const was = card && card.classList.contains('menu-open');
  closeCardMenus();
  if (was) return;
  const b = books.find(x => x.id === id); if (!b) return;
  if (card) card.classList.add('menu-open');
  const p = Math.round((b.progress || 0) * 100), done = b.progress >= 0.995;
  const items = `<button data-act="openBook" data-id="${esc(id)}">${MI.play}${p > 0 && !done ? 'Resume reading' : 'Read'}</button>
    <button data-act="peek" data-id="${esc(id)}">${MI.eye}Preview pages</button>
    <button data-act="watchBook" data-id="${esc(id)}">${IC_WATCH}Read with video</button>
    ${b.progress > 0 ? `<button data-act="resetBook">${MI.restart}Start from the beginning</button>` : ''}
    <button class="danger" data-act="removeBook">${ICON.trash}Remove from shelf</button>`;
  const pop = document.createElement('div');
  pop.dataset.id = id;
  if (useSheet()) {
    const u = coverURL(b) && !(b.private && S.vaultBlur) ? coverURL(b) : null;
    const sub = [b.author, fmtLabel(b.format), done ? 'Finished' : p ? p + '% read' : 'Not started'].filter(Boolean).join(' · ');
    const scrim = document.createElement('div'); scrim.className = 'act-scrim'; scrim.addEventListener('click', () => closeCardMenus());
    pop.className = 'card-pop act-sheet'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Options for ' + b.title);
    pop.innerHTML = `<i class="as-grab" aria-hidden="true"></i>
      <div class="as-head"><span class="as-cv" style="--tint:${bookTint(b)}">${u ? `<img src="${u}" alt="">` : `<b>${esc((b.title || '?').trim().charAt(0).toUpperCase())}</b>`}</span><div class="as-tx"><b>${esc(b.title)}</b><small>${esc(sub)}</small></div></div>
      <div class="as-list">${items}</div>
      <button class="as-cancel" type="button" data-act="closeMenus">Cancel</button>`;
    document.body.append(scrim, pop);
    document.body.classList.add('sheet-open');
    requestAnimationFrame(() => { scrim.classList.add('in'); pop.classList.add('in'); });
    sheetDrag(pop);
    if (typeof OV !== 'undefined') OV.open('sheet');
    return;
  }
  pop.className = 'card-pop glass floating';
  pop.innerHTML = items;
  document.body.appendChild(pop);
  pop._btn = btn; placePop(pop);
  const r0 = btn.getBoundingClientRect(); pop._x0 = r0.left; pop._y0 = r0.top;
}
function placePop(pop) {
  const r = pop._btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, vw = innerWidth, vh = innerHeight;
  let x = Math.min(vw - w - 8, Math.max(8, r.right - w)), y = r.bottom + 6;
  if (y + h > vh - 8) y = Math.max(8, r.top - h - 6);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
function showSheet(headHtml, itemsHtml, id, label) {
  closeCardMenus();
  const scrim = document.createElement('div'); scrim.className = 'act-scrim'; scrim.addEventListener('click', () => closeCardMenus());
  const pop = document.createElement('div'); pop.className = 'card-pop act-sheet'; pop.dataset.id = id || '';
  pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', label || 'Options');
  pop.innerHTML = `<i class="as-grab" aria-hidden="true"></i><div class="as-head">${headHtml}</div><div class="as-list">${itemsHtml}</div><button class="as-cancel" type="button" data-act="closeMenus">Cancel</button>`;
  document.body.append(scrim, pop); document.body.classList.add('sheet-open');
  requestAnimationFrame(() => { scrim.classList.add('in'); pop.classList.add('in'); });
  sheetDrag(pop);
  if (typeof OV !== 'undefined') OV.open('sheet');
  return pop;
}
let pendingVideo = null;
function chooseBookForVideo(file) {
  const list = shelfBooks().filter(b => b.format !== 'sample' || shelfBooks().length === 1).sort((a, b) => (b.opened || b.added || 0) - (a.opened || a.added || 0)).slice(0, 8);
  if (!list.length) { toast('Add the book or comic first, then add the video to watch them side by side.', 5200); return; }
  pendingVideo = file;
  const thumb = b => { const u = coverURL(b) && !(b.private && S.vaultBlur) ? coverURL(b) : null; return `<span class="as-th" style="--tint:${bookTint(b)}">${u ? `<img src="${u}" alt="">` : ''}</span>`; };
  showSheet(`<span class="as-cv as-vid">${IC_WATCH}</span><div class="as-tx"><b>Watch with which book?</b><small>${esc(file.name || 'Video')}</small></div>`,
    list.map(b => `<button data-act="videoPair" data-id="${esc(b.id)}">${thumb(b)}<span class="as-bk"><b>${esc(b.title)}</b><small>${esc([b.author, fmtLabel(b.format)].filter(Boolean).join(' · '))}</small></span></button>`).join(''),
    '', 'Choose a book for this video');
}
/* drag the sheet down to dismiss it */
function sheetDrag(sh) {
  let y0 = null, dy = 0;
  sh.addEventListener('pointerdown', e => { if (e.target.closest('button') && !e.target.closest('.as-head')) return; y0 = e.clientY; dy = 0; sh.style.transition = 'none'; }, { passive: true });
  sh.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  const end = () => { if (y0 == null) return; y0 = null; sh.style.transition = ''; sh.style.transform = ''; if (dy > 70) closeCardMenus(); };
  sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
}
addEventListener('scroll', () => {
  const pop = $('.card-pop.floating'); if (!pop || !pop._btn) return;
  const r = pop._btn.getBoundingClientRect();
  /* small nudges (snapping rows, scrolling the card into view) move the menu with its button; a real scroll closes it */
  if (!pop._btn.isConnected || Math.abs(r.top - pop._y0) > 120 || Math.abs(r.left - pop._x0) > 120 || r.bottom < 0 || r.top > innerHeight) closeCardMenus(); else placePop(pop);
}, true);
addEventListener('resize', () => { if ($('.card-pop.floating')) closeCardMenus(); });
async function removeBook(id, btn) {
  if (!btn.dataset.armed) { btn.dataset.armed = '1'; btn.classList.add('armed'); btn.innerHTML = `${ICON.trash}Tap again to remove`; return; }
  closeCardMenus(); if (Peek.on && Peek.meta && Peek.meta.id === id) Peek.close();
  if (R.open && R.meta && R.meta.id === id) closeReader();
  books = books.filter(b => b.id !== id);
  if (id === SAMPLE_ID) ls.set('sp.sampleRemoved', true);
  memFiles.delete(id);
  try { await DB.del(id); } catch (e) { /* already gone */ }
  renderLibrary();
  toast('Removed from your shelf');
}
async function resetBook(id) {
  closeCardMenus();
  const b = books.find(x => x.id === id); if (!b) return;
  b.pos = null; b.progress = 0; await DB.putBook(b); renderLibrary();
}

/* ================= Import ================= */
function dataUrlToBlob(u) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/.exec(u || ''); if (!m) return null;
  const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
  const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: m[1] });
}
let importing = false;
async function importFiles(fileList, { openAfter = true } = {}) {
  let files = Array.from(fileList || []).filter(f => f && f.size !== undefined);
  if (!files.length) return;
  /* a video added from Add plays beside a book: with the open book, or with one the reader picks */
  const vids = [];
  for (const f of files) if (await isVideoFile(f)) vids.push(f);
  if (vids.length) {
    files = files.filter(f => !vids.includes(f));
    if (!files.length) { if (R.open && R.doc) Watch.load(vids[0]); else chooseBookForVideo(vids[0]); return; }
    setTimeout(() => chooseBookForVideo(vids[0]), 400);
  }
  if (importing) { toast('Still adding the last files. Try again in a moment.'); return; }
  importing = true;
  let lastId = null, firstNew = null, added = 0, fromZip = 0; const errors = [];
  let sources = files.length;
  try {
    const pics = files.filter(isImageFile);
    if (pics.length) {
      toast(pics.length > 1 ? `Making a picture book from ${pics.length} pictures…` : 'Adding your picture…', 60000);
      try { files = files.filter(f => !pics.includes(f)).concat([await imagesToCbz(pics)]); }
      catch (e) { errors.push('Those pictures could not be combined into a book.'); files = files.filter(f => !pics.includes(f)); }
    }
    sources = files.length;
    const queue = files.map(file => ({ file, depth: 0 }));
    while (queue.length) {
      const { file, depth } = queue.shift();
      const priv = !!(Vault.view && Vault.key);
      const dup = books.find(b => !!b.private === priv && b.name === file.name && b.size === file.size && b.format !== 'sample');
      if (dup) { lastId = dup.id; continue; }
      if (file.size > 400 * 1024 * 1024) { errors.push(`${file.name} is larger than 400 MB.`); continue; }
      toast(`Adding ${file.name}…`, 60000);
      const det = await detectFormat(file);
      if (det.err) { errors.push(det.err); continue; }
      if (det.expand) {
        if (depth < 3) {
          for (const p of det.books.slice(0, 200)) {
            try { const blob = await det.expand.file(p).async('blob'); queue.push({ file: new File([blob], p.split('/').pop(), { type: '' }), depth: depth + 1 }); fromZip++; }
            catch (e) { errors.push(`${p.split('/').pop()} inside ${file.name} could not be unpacked.`); }
          }
        }
        if (!det.fmt) continue;
      }
      let info;
      try {
        const r = await parseBook(file, det.fmt, file.name, true);
        info = { title: r.title, author: r.author, cover: r.cover || null };
        if (!info.cover && r.coverData) info.cover = await makeThumb(dataUrlToBlob(r.coverData));
        if (r.cleanup && r.kind) r.cleanup();
      } catch (e) { errors.push(`${file.name}: ${e && e.message ? e.message : 'could not be read.'}`); continue; }
      const meta = { coverV: 2, id: uid(), name: file.name, size: file.size, format: det.fmt, title: normWs(info.title) || baseName(file.name), author: normWs(info.author || ''), cover: info.cover, added: Date.now(), opened: 0, progress: 0, pos: null, highlights: [], bookmarks: [], readSec: 0 };
      if (priv) meta.private = true;
      const ok = await DB.putFile(meta.id, file, priv);
      if (!ok) memFiles.set(meta.id, file);
      await DB.putBook(meta);
      books.push(meta); lastId = meta.id; if (!firstNew) firstNew = meta.id; added++;
    }
  } finally { importing = false; }
  renderLibrary();
  if (errors.length) toast(errors[0] + (errors.length > 1 ? ` (and ${errors.length - 1} more)` : ''), 7000);
  else if (added > 1) toast(fromZip ? `Added ${added} books from your zip` : `Added ${added} books to your shelf`);
  else hideToast();
  const openId = added === 1 ? firstNew : (added === 0 && !fromZip ? lastId : null);
  if (openAfter && sources === 1 && openId && !errors.length) {
    lastId = openId;
    if (R.open) { if (R.meta && R.meta.id !== lastId) toast('Added to your shelf'); }
    else openBook(lastId);
  }
}

/* ---- Room interactions: books tilt toward the pointer, glass catches the light, the shelf reflows on resize ---- */
(function () {
  const fine = () => matchMedia('(hover:hover) and (pointer:fine)').matches;
  let hot = null, glass = null, raf = 0, last = null;
  const release = () => { if (!hot) return; hot.classList.remove('hot'); const b = $('.b3d', hot); if (b) { b.style.removeProperty('--rx'); b.style.removeProperty('--ry'); b.style.removeProperty('--shx'); } hot = null; };
  const frame = () => {
    raf = 0; const e = last; if (!e) return;
    const t = e.target.closest && e.target.closest('#library .tilt');
    if (t !== hot) { release(); hot = t; if (hot) hot.classList.add('hot'); }
    if (hot) {
      const r = hot.getBoundingClientRect(), b = $('.b3d', hot);
      const px = clamp((e.clientX - r.left) / r.width - 0.5, -0.6, 0.6), py = clamp((e.clientY - r.top) / r.height - 0.5, -0.6, 0.6);
      const big = hot.classList.contains('hero-book');
      if (b) { b.style.setProperty('--ry', ((big ? 18 : 6) + px * (big ? 34 : 30)).toFixed(2) + 'deg'); b.style.setProperty('--rx', (-4 - py * (big ? 18 : 16)).toFixed(2) + 'deg'); b.style.setProperty('--shx', (-px * 60).toFixed(1)); }
    }
    const g = e.target.closest && e.target.closest('#library .glass');
    if (g !== glass) { if (glass) { glass.style.removeProperty('--mx'); glass.style.removeProperty('--my'); } glass = g; }
    if (glass) { const r = glass.getBoundingClientRect(); glass.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); glass.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px'); }
  };
  document.addEventListener('pointermove', e => { if (R.open || e.pointerType === 'touch' || !fine() || reduceMotion()) return; last = e; if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
  document.addEventListener('pointerleave', () => { release(); }, { passive: true });
  document.addEventListener('scroll', () => { if (hot) release(); }, { passive: true });
  // Long-press or right-click a book for its options
  let lp = null, swallow = false, sx = 0, sy = 0;
  const menuFor = c => { if (!c || c.classList.contains('menu-open')) return; const m = $('.card-menu', c); if (m) { openCardMenu(c.dataset.id, m); swallow = true; } };
  document.addEventListener('contextmenu', e => { const c = e.target.closest('#library .card, #library .rc'); if (!c || R.open || !c.dataset.id) return; e.preventDefault(); menuFor(c); });
  document.addEventListener('pointerdown', e => { swallow = false; if (e.pointerType !== 'touch') return; const c = e.target.closest('#library .card, #library .rc'); if (!c || !c.dataset.id || e.target.closest('.card-pop')) return; sx = e.clientX; sy = e.clientY; clearTimeout(lp); lp = setTimeout(() => { menuFor(c); if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) { /* none */ } }, 520); }, { passive: true });
  document.addEventListener('pointermove', e => { if (lp && e.pointerType === 'touch' && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) clearTimeout(lp); }, { passive: true });
  ['pointerup', 'pointercancel'].forEach(k => document.addEventListener(k, () => clearTimeout(lp), { passive: true }));
  document.addEventListener('click', e => { if (swallow && !e.target.closest('.card-pop')) { swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // Re-lay the shelves when the window width changes
  const ro = new ResizeObserver(debounce(() => { const g = $('#grid'); if (!g || R.open) return; segThumbs(); if (S.shelfView === 'spines' && S.libTab === 'library' && Math.abs(g.clientWidth - shelfW) > 4) renderShelf(); }, 120));
  addEventListener('DOMContentLoaded', () => { const g = $('#grid'); if (g) ro.observe(g); });
  if (document.readyState !== 'loading') { const g = $('#grid'); if (g) ro.observe(g); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => segThumbs());
})();

/* ---- Preview: look inside a book from the shelf — its cover, details, contents and pages — without opening the reader ---- */
const fmtBytes = n => !n ? '' : n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
const Peek = {
  on: false, meta: null, doc: null, token: 0, shown: 0, lb: -1, io: null, queue: [], busy: 0, urls: [],
  async open(id) {
    const meta = books.find(b => b.id === id); if (!meta) return;
    this.close(true);
    const tk = ++this.token;
    this.on = true; this.meta = meta; this.shown = 0; this.lb = -1;
    const root = $('#peek'), sheet = $('#peekSheet');
    root.hidden = false; document.body.classList.add('peek-open');
    if (!R.open && typeof OV !== 'undefined') OV.open('peek');
    const p = Math.round((meta.progress || 0) * 100);
    const facts = [fmtLabel(meta.format), fmtBytes(meta.size), meta.added ? 'Added ' + new Date(meta.added).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''].filter(Boolean);
    sheet.innerHTML = `<button class="pk-x" data-act="peekClose" aria-label="Close preview"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="pk-top">
        <div class="pk-cover">${book3d(meta, 'pk-b')}</div>
        <div class="pk-info">
          <div class="eyebrow">Preview</div>
          <h2 id="peekTitle">${esc(meta.title)}</h2>${meta.author ? `<p class="author">${esc(meta.author)}</p>` : ''}
          <div class="pk-facts" id="pkFacts">${facts.map(f => `<span>${esc(f)}</span>`).join('')}</div>
          <div class="pk-prog"><div class="bar"><i style="width:${p}%"></i></div><span>${meta.progress >= 0.995 ? 'Finished' : p ? p + '% read' : 'Not started'}${meta.readSec ? ' · ' + fmtMin(meta.readSec) + ' spent' : ''}</span></div>
        </div>
  <div class="pk-actions"><button class="btn primary lg" data-act="peekRead">${p ? 'Resume' : 'Start reading'}</button>${p ? '<button class="btn quiet lg" data-act="peekRead" data-restart="1">From the beginning</button>' : ''}<button class="btn quiet lg danger pk-rm" data-act="peekRemove" data-id="${esc(meta.id)}">${ICON.trash}Remove</button></div>
      </div>
      <div class="pk-body" id="pkBody"><div class="pk-loading"><i></i><i></i><i></i><span>Opening the book…</span></div></div>`;
    sheet.scrollTop = 0;
    requestAnimationFrame(() => root.classList.add('in'));
    setTimeout(() => { const x = $('.pk-x', sheet); if (x) x.focus({ preventScroll: true }); }, 60);
    if (!tintCache.has(meta.id)) measureTint(meta).then(h => { const b = $('.pk-b'); if (h && b) b.style.setProperty('--tint', h); });
    let doc;
    try {
      if (meta.format === 'sample') doc = buildSampleDoc();
      else {
        const blob = memFiles.get(meta.id) || await DB.getFile(meta.id);
        if (!blob) throw new Error('This book’s file is no longer stored in this browser.');
        doc = await parseBook(blob, meta.format, meta.name, false);
      }
    } catch (e) {
      if (tk !== this.token) return;
      $('#pkBody').innerHTML = `<p class="pk-note">${esc(e && e.message ? e.message : 'This book could not be previewed.')}</p>`; return;
    }
    if (tk !== this.token || !this.on) { try { doc.cleanup && doc.cleanup(); } catch (e) { /* closed */ } return; }
    this.doc = doc;
    if (doc.numPages) { const f = $('#pkFacts'); if (f) f.insertAdjacentHTML('beforeend', `<span>${doc.numPages} ${doc.numPages === 1 ? 'page' : 'pages'}</span>`); }
    if (doc.kind === 'flow') this.renderFlow(doc); else this.renderPages(doc);
  },
  renderFlow(doc) {
    const body = $('#pkBody'); if (!body) return;
    const words = doc.chapters.reduce((a, c) => a + (c.len || 0), 0) / 5.7;
    const f = $('#pkFacts'); if (f && words > 50) f.insertAdjacentHTML('beforeend', `<span>About ${Math.max(1, Math.round(words / 230))} min read</span>`);
    const top = doc.toc.filter(t => (t.level || 0) === 0 && !t.anchor).slice(0, 60);
    const firstCh = doc.chapters.findIndex(c => (c.len || 0) > 400);
    let excerpt = '';
    if (firstCh >= 0) { const d = IDOC.createElement('div'); d.innerHTML = doc.chapters[firstCh].html; d.querySelectorAll('h1,h2,h3,h4,figure,img,table').forEach(n => n.remove()); excerpt = normWs(d.textContent).slice(0, 900); }
    const pics = [];
    doc.chapters.forEach((c, i) => { const m = /data-res="([^"]+)"/.exec(c.html || ''); if (m && pics.length < 12) pics.push({ i, res: m[1] }); });
    body.innerHTML = `${excerpt ? `<section class="pk-sec"><h3>First lines</h3><blockquote class="pk-excerpt">${esc(excerpt)}…</blockquote><button class="btn quiet" data-act="peekRead" data-ch="${firstCh}">Read from here</button></section>` : ''}
      ${pics.length ? `<section class="pk-sec"><h3>Pictures</h3><div class="pk-grid">${pics.map(x => `<button class="pk-th" data-act="peekRead" data-ch="${x.i}" data-res="${esc(x.res)}"><span class="pk-img"></span><small>${esc(doc.chapters[x.i].title || '')}</small></button>`).join('')}</div></section>` : ''}
      ${top.length > 1 ? `<section class="pk-sec"><h3>Contents<span>${top.length} ${top.length === 1 ? 'section' : 'sections'}</span></h3><ol class="pk-toc">${top.map(t => `<li><button data-act="peekRead" data-ch="${t.ch}"><span>${esc(t.title)}</span><small>${Math.round(doc.cum[t.ch] / doc.total * 100)}%</small></button></li>`).join('')}</ol></section>` : ''}
      ${!excerpt && top.length <= 1 && !pics.length ? '<p class="pk-note">This book has no text to preview.</p>' : ''}`;
    $$('.pk-th[data-res]', body).forEach(b => doc.res(b.dataset.res).then(u => { if (u && this.doc === doc) $('.pk-img', b).innerHTML = `<img src="${u}" alt="">`; }));
  },
  renderPages(doc) {
    const body = $('#pkBody'); if (!body) return;
    body.innerHTML = `<section class="pk-sec"><h3>Pages<span>${doc.numPages}</span></h3><div class="pk-grid pages" id="pkGrid"></div><div class="pk-more-wrap"></div></section>`;
    this.io = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) { this.io.unobserve(en.target); this.enqueue(+en.target.dataset.i, en.target); } }), { root: $('#peekSheet'), rootMargin: '300px' });
    this.more();
  },
  more() {
    const d = this.doc, g = $('#pkGrid'); if (!d || !g) return;
    const from = this.shown, to = Math.min(d.numPages, from + 48);
    const ar = d.kind === 'pdf' ? '3/4' : '2/3';
    g.insertAdjacentHTML('beforeend', Array.from({ length: to - from }, (_, k) => { const i = from + k; return `<button class="pk-th" data-act="peekPage" data-i="${i}" aria-label="Page ${i + 1}"><span class="pk-img" style="aspect-ratio:${ar}"></span><small>${i + 1}</small></button>`; }).join(''));
    this.shown = to;
    $$('.pk-th', g).slice(from).forEach(b => this.io.observe(b));
    const w = $('.pk-more-wrap'); if (w) w.innerHTML = to < d.numPages ? `<button class="btn quiet" data-act="peekMore">Show more pages · ${d.numPages - to} left</button>` : '';
  },
  enqueue(i, btn) { this.queue.push([i, btn]); this.pump(); },
  async pump() {
    while (this.busy < 2 && this.queue.length) {
      const [i, btn] = this.queue.shift(), tk = this.token, d = this.doc; this.busy++;
      this.pageImage(d, i, 220).then(node => { if (tk === this.token && node) { const s = $('.pk-img', btn); s.innerHTML = ''; s.style.aspectRatio = ''; s.appendChild(node); } }).catch(() => {}).finally(() => { this.busy--; if (tk === this.token) this.pump(); });
    }
  },
  async pageImage(d, i, width) {
    if (!d) return null;
    if (d.kind === 'pdf') {
      const page = await d.pdf.getPage(i + 1), v1 = page.getViewport({ scale: 1 });
      const dpr = Math.min(2, devicePixelRatio || 1), sc = width * dpr / v1.width, vp = page.getViewport({ scale: sc });
      const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: x, viewport: vp }).promise;
      return c;
    }
    const u = await d.url(i); const im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = u;
    try { await im.decode(); } catch (e) { /* shown when ready */ }
    return im;
  },
  async show(i) {
    const d = this.doc; if (!d || !d.numPages) return;
    i = clamp(i, 0, d.numPages - 1); this.lb = i;
    const lb = $('#peekLb'); lb.hidden = false;
    $('#lbNum').textContent = `Page ${i + 1} of ${d.numPages}`;
    $('#lbRead').dataset.page = i;
    $('.lb-nav.prev', lb).disabled = i === 0; $('.lb-nav.next', lb).disabled = i === d.numPages - 1;
    const st = $('#lbStage'); st.classList.add('loading');
    const w = Math.min(1400, Math.max(320, Math.min(innerWidth - 40, (innerHeight - 120) * 0.75)));
    const node = await this.pageImage(d, i, w).catch(() => null);
    if (this.lb !== i || !node) return;
    st.innerHTML = ''; st.appendChild(node); st.classList.remove('loading');
  },
  step(dir) { if (this.lb >= 0) this.show(this.lb + dir); },
  hideLb() { this.lb = -1; const lb = $('#peekLb'); lb.hidden = true; $('#lbStage').innerHTML = ''; },
  read(at, restart) {
    const m = this.meta; if (!m) return;
    if (restart) { m.pos = null; m.progress = 0; }
    this.close();
    openBook(m.id, at || (restart ? (m.format === 'pdf' || m.format === 'cbz' ? { page: 0 } : { ch: 0 }) : undefined));
  },
  escape() { if (this.lb >= 0) this.hideLb(); else this.close(); },
  close(quick) {
    if (!this.on) return;
    this.token++; this.on = false;
    if (this.io) { this.io.disconnect(); this.io = null; }
    this.queue = []; this.hideLb();
    const d = this.doc; this.doc = null; this.meta = null;
    if (d && d !== R.doc) setTimeout(() => { try { d.cleanup && d.cleanup(); } catch (e) { /* closed */ } }, 50);
    const root = $('#peek'); root.classList.remove('in'); document.body.classList.remove('peek-open');
    if (typeof OV !== 'undefined') OV.close('peek');
    if (quick || reduceMotion()) { root.hidden = true; $('#peekSheet').innerHTML = ''; }
    else setTimeout(() => { if (!this.on) { root.hidden = true; $('#peekSheet').innerHTML = ''; } }, 260);
  }
};
document.addEventListener('keydown', e => {
  if (!Peek.on || Peek.lb < 0) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); Peek.step(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); Peek.step(-1); }
}, true);
(function () { // swipe between pages in the page viewer
  let sx = null;
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('#lbStage')) sx = e.clientX; }, { passive: true });
  document.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) Peek.step(dx < 0 ? 1 : -1); }, { passive: true });
})();

/* ---- Sharper covers for books added before covers were saved at full quality: rebuilt once, quietly, from the book itself ---- */
const CoverFix = {
  busy: false, tried: new Set(),
  run() {
    if (this.busy || R.open) return;
    const b = shelfBooks().find(x => x.coverV !== 2 && x.format !== 'sample' && !this.tried.has(x.id) && ['pdf', 'cbz', 'epub', 'zip'].includes(x.format));
    if (!b) return;
    this.busy = true; this.tried.add(b.id);
    (async () => {
      try {
        const blob = memFiles.get(b.id) || await DB.getFile(b.id);
        if (!blob) return;
        const r = await parseBook(blob, b.format, b.name, true);
        if (r && r.cleanup && r.kind) r.cleanup();
        if (r && r.cover) { b.cover = r.cover; tintCache.delete(b.id); }
        b.coverV = 2; await DB.putBook(b);
        if (r && r.cover && !R.open) this.repaint();
      } catch (e) { /* keep the old cover */ }
    })().finally(() => { this.busy = false; setTimeout(() => this.run(), 150); });
  },
  repaint: debounce(() => { if (!R.open) { const y = scrollY; renderLibrary(); scrollTo(0, y); } }, 500)
};

/* ================= Reader core ================= */
const el = {
  library: $('#library'), reader: $('#reader'), stage: $('#stage'), flow: $('#flow'), page: $('#page'), content: $('#content'), chEnd: $('#chEnd'),
  pdfview: $('#pdfview'), pdfpages: $('#pdfpages'), topbar: $('#topbar'), botbar: $('#botbar'), bkTitle: $('#bkTitle'), chTitle: $('#chTitle'),
  locL: $('#locL'), locR: $('#locR'), scrub: $('#scrub'), ribbon: $('#ribbon'), tool: $('#seltool'), loading: $('#loading'), backPill: $('#backPill')
};
const R = { perView: 1, unit: 0, cols: 1, open: false, meta: null, doc: null, kind: null, ch: 0, page: 0, pages: 1, colStep: 0, blocks: [], active: -1, backStack: [], deep: false, opening: 0 };
let lastActivity = Date.now();
let ignoreScrollUntil = 0;
const progScroll = () => { ignoreScrollUntil = Date.now() + 350; };
const touch = () => { lastActivity = Date.now(); };
const BLOCK_SEL = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,pre,figure,table,dt,dd,div,section,article,aside,header,footer,figcaption';
const BLOCK_PARENTS = new Set(['DIV', 'SECTION', 'ARTICLE', 'UL', 'OL', 'DL', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR', 'BLOCKQUOTE', 'FIGURE', 'ASIDE', 'HEADER', 'FOOTER']);

const saveMetaSoon = debounce(() => { if (R.meta) DB.putBook(R.meta); }, 700);
function isDarkHost() { const t = document.documentElement.getAttribute('data-theme'); if (t === 'dark') return true; if (t === 'light') return false; return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
const rtKey = () => (R.open && R.meta && R.meta.private && S.vaultVelvet) ? 'rtPrivate' : 'rt';
function effectiveRt() { const v = S[rtKey()] || 'auto'; return v === 'auto' ? (isDarkHost() ? 'dusk' : 'paper') : v; }

/* ---- Settings → reader ---- */
function applyTheme() {
  const rt = effectiveRt();
  document.body.dataset.rt = rt;
  document.body.classList.toggle('rt-dark', DARK_RT.has(rt));
  el.reader.classList.toggle('rt-dark', DARK_RT.has(rt));
  ['paper', 'sepia', 'sage', 'mist', 'dusk', 'velvet', 'night'].forEach(t => el.reader.classList.toggle('tint-' + t, S.pdfColor !== 'original' && t === rt && t !== 'paper'));
  el.reader.classList.toggle('pinv', S.pdfColor === 'invert' && DARK_RT.has(rt));
  el.reader.classList.toggle('img-tint', S.pdfColor !== 'original');
}
function applyReaderSettings() {
  const rs = el.reader.style;
  rs.setProperty('--rd-font', (FONTS[S.font] || FONTS.literata).css);
  rs.setProperty('--rd-size', S.size + 'px');
  rs.setProperty('--rd-lh', String(S.lh));
  rs.setProperty('--rd-measure', WIDTHS[S.width] + 'em');
  rs.setProperty('--rd-align', S.align === 'justify' ? 'justify' : 'left');
  rs.setProperty('--rd-hyph', S.align === 'justify' ? 'auto' : 'manual');
  el.reader.classList.toggle('indent', S.para === 'indent');
  el.reader.classList.toggle('paged', isPaged() && R.kind === 'flow');
  el.reader.classList.toggle('spread', spreadActive() && R.kind === 'flow');
  if (R.kind !== 'pdf' && R.kind !== 'images') el.reader.classList.remove('pbook', 'pspread');
  el.reader.classList.toggle('bionic', !!S.bionic);
  el.reader.classList.toggle('nolamp', !S.lampShow);
  el.reader.classList.toggle('spot', !!S.spot && R.kind === 'flow');
  $('#warm').style.opacity = String(S.warmth / 100 * 0.42);
  $('#dim').style.opacity = String(S.dim / 100 * 0.62);
  applyTheme();
  Ruler.sync();
}

/* ---- Text offsets & highlight wrapping ---- */
function rangeOffsets(root, range) {
  try {
    const r = range.cloneRange();
    const full = document.createRange(); full.selectNodeContents(root);
    if (r.compareBoundaryPoints(Range.START_TO_START, full) < 0) r.setStart(full.startContainer, full.startOffset);
    if (r.compareBoundaryPoints(Range.END_TO_END, full) > 0) r.setEnd(full.endContainer, full.endOffset);
    if (r.collapsed) return null;
    const pre = document.createRange(); pre.selectNodeContents(root); pre.setEnd(r.startContainer, r.startOffset);
    const s = pre.toString().length;
    return { s, e: s + r.toString().length };
  } catch (e) { return null; }
}
function offsetsToRange(root, s, e) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let pos = 0, n, r = document.createRange(), started = false;
  while ((n = tw.nextNode())) {
    const len = n.nodeValue.length;
    if (!started && pos + len > s) { r.setStart(n, s - pos); started = true; }
    if (started && pos + len >= e) { r.setEnd(n, e - pos); return r; }
    pos += len;
  }
  return started ? r : null;
}
function wrapRange(root, s, e, make) {
  const parts = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let pos = 0, n;
  while ((n = tw.nextNode())) {
    const len = n.nodeValue.length, ns = pos, ne = pos + len; pos = ne;
    if (ne <= s) continue; if (ns >= e) break;
    parts.push([n, Math.max(s, ns) - ns, Math.min(e, ne) - ns]);
  }
  const out = [];
  for (const [node, a, b] of parts) {
    if (b <= a) continue;
    const parent = node.parentNode; if (!parent) continue;
    if (!node.nodeValue.slice(a, b).trim() && BLOCK_PARENTS.has(parent.nodeName)) continue;
    let mid = node;
    if (a > 0) mid = node.splitText(a);
    if (b - a < mid.nodeValue.length) mid.splitText(b - a);
    const m = make(); parent.insertBefore(m, mid); m.appendChild(mid); out.push(m);
  }
  return out;
}
function unwrapMarks(sel) {
  const parents = new Set();
  $$(sel, el.content).forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); parents.add(p); });
  parents.forEach(p => p.normalize());
}
function wrapHl(h) {
  const marks = wrapRange(el.content, h.s, h.e, () => { const m = document.createElement('mark'); m.className = 'hl ' + h.color; m.dataset.hid = h.id; return m; });
  if (marks.length && h.note) marks[marks.length - 1].classList.add('note-end');
  return marks;
}
function applyHighlights() { R.meta.highlights.filter(h => h.ch === R.ch && h.s != null).sort((a, b) => a.s - b.s).forEach(wrapHl); }

const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}’'\-]*/gu;
function applyBionic(root) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (!n.nodeValue.trim() || n.parentNode.closest('pre,code')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; let n; while ((n = tw.nextNode())) nodes.push(n);
  for (const t of nodes) {
    const s = t.nodeValue; WORD_RE.lastIndex = 0; let m, last = 0, any = false; const frag = document.createDocumentFragment();
    while ((m = WORD_RE.exec(s))) {
      const w = m[0], k = w.length <= 3 ? 1 : Math.ceil(w.length * 0.45);
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      const b = document.createElement('b'); b.className = 'bx'; b.textContent = w.slice(0, k); frag.appendChild(b);
      if (k < w.length) frag.appendChild(document.createTextNode(w.slice(k)));
      last = m.index + w.length; any = true;
    }
    if (!any) continue;
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    t.parentNode.replaceChild(frag, t);
  }
}
function markBlocks() {
  const cands = Array.from(el.content.querySelectorAll(BLOCK_SEL));
  R.blocks = cands.filter(b => !b.querySelector(BLOCK_SEL) && (b.textContent.trim() || b.querySelector('img')));
  R.blocks.forEach(b => b.classList.add('rb'));
  R.active = -1;
}

/* ---- Flow layout & position ---- */
function topInset() { return 64; }
const isPaged = () => S.mode !== 'scroll';
const spreadActive = () => S.mode === 'spread' && window.innerWidth >= 960;
function layoutFlow() {
  const f = el.flow, p = el.page;
  el.reader.classList.toggle('spread', spreadActive() && R.kind === 'flow');
  if (isPaged()) {
    const W = f.clientWidth, H = f.clientHeight;
    const n = spreadActive() && W >= 900 ? 2 : 1;
    const unit = W / n;
    const pad = n === 2 ? 64 : (W < 600 ? 20 : 56);
    const colW = Math.floor(Math.max(180, Math.min(WIDTHS[S.width] * S.size, unit - 2 * pad)));
    const gap = unit - colW;
    p.style.width = ''; p.style.paddingLeft = p.style.paddingRight = (gap / 2) + 'px';
    p.style.columnWidth = colW + 'px'; p.style.columnGap = gap + 'px'; p.style.height = H + 'px';
    el.reader.style.setProperty('--page-h', H + 'px');
    R.perView = n; R.unit = unit; R.colStep = W;
    R.cols = countCols();
    R.pages = Math.max(1, Math.ceil(R.cols / n));
    p.style.width = (R.pages * W) + 'px';
    R.cols = countCols();
    R.pages = Math.max(1, Math.ceil(R.cols / n));
    R.page = clamp(R.page, 0, R.pages - 1);
    f.scrollLeft = R.page * W;
  } else {
    p.style.cssText = ''; R.pages = 1; R.cols = 1; R.perView = 1; R.colStep = 0; R.page = 0; f.scrollLeft = 0;
  }
  updatePageNums();
}
function countCols() {
  const s = el.chEnd.querySelector('.sentinel') || el.chEnd;
  const fr = el.flow.getBoundingClientRect(), r = s.getBoundingClientRect();
  const x = r.left - fr.left + el.flow.scrollLeft;
  return Math.max(1, Math.floor((x - 1) / R.unit) + 1);
}
function updatePageNums() {
  const box = $('#pnums'); if (!box) return;
  const on = R.open && R.kind === 'flow' && isPaged();
  box.hidden = !on; if (!on) return;
  const a = R.page * R.perView + 1;
  box.innerHTML = R.perView === 2 ? `<span>${a}</span><span>${a + 1 <= R.cols ? a + 1 : ''}</span>` : `<span>${a}</span>`;
  box.classList.toggle('two', R.perView === 2);
}
function firstVisibleBlock() {
  const B = R.blocks; if (!B.length) return -1;
  const fr = el.flow.getBoundingClientRect();
  let lo = 0, hi = B.length - 1, ans = B.length - 1;
  if (isPaged()) { const left = fr.left + 2; while (lo <= hi) { const mid = (lo + hi) >> 1; const r = B[mid].getBoundingClientRect(); if (r.right > left) { ans = mid; hi = mid - 1; } else lo = mid + 1; } }
  else { const top = fr.top + topInset(); while (lo <= hi) { const mid = (lo + hi) >> 1; const r = B[mid].getBoundingClientRect(); if (r.bottom > top) { ans = mid; hi = mid - 1; } else lo = mid + 1; } }
  return ans;
}
function lastVisibleBlock() {
  const B = R.blocks; if (!B.length) return -1;
  const fr = el.flow.getBoundingClientRect();
  let lo = 0, hi = B.length - 1, ans = 0;
  if (isPaged()) { const right = fr.right - 2; while (lo <= hi) { const mid = (lo + hi) >> 1; const r = B[mid].getBoundingClientRect(); if (r.left < right) { ans = mid; lo = mid + 1; } else hi = mid - 1; } }
  else { const bottom = fr.bottom - 40; while (lo <= hi) { const mid = (lo + hi) >> 1; const r = B[mid].getBoundingClientRect(); if (r.top < bottom) { ans = mid; lo = mid + 1; } else hi = mid - 1; } }
  return ans;
}
function scrollToEl(node, offset = 72) {
  if (!node) return;
  const fr = el.flow.getBoundingClientRect(), r = node.getBoundingClientRect();
  progScroll();
  if (isPaged()) { const x = r.left - fr.left + el.flow.scrollLeft; goPage(Math.floor((x + 4) / R.colStep)); }
  else el.flow.scrollTop += r.top - fr.top - offset;
}
const goToBlock = i => scrollToEl(R.blocks[i]);
function chapterR() {
  if (isPaged()) return R.pages > 1 ? R.page / (R.pages - 1) : 0;
  const f = el.flow, max = f.scrollHeight - f.clientHeight;
  return max > 0 ? clamp(f.scrollTop / max, 0, 1) : 0;
}
function atChapterEnd() {
  if (isPaged()) return R.page >= R.pages - 1;
  const f = el.flow; return f.scrollTop + f.clientHeight >= f.scrollHeight - 4;
}
function goPage(p) {
  R.page = clamp(p, 0, R.pages - 1);
  el.flow.scrollLeft = R.page * R.colStep;
  updatePageNums(); hideTool(); onPos();
}

/* ---- Page turns: 3D curl, fade or instant, with an optional paper sound ---- */
const Turn = {
  layer: null, anims: [],
  finish() { this.anims.forEach(a => { try { a.cancel(); } catch (e) { /* done */ } }); this.anims = []; if (this.layer) { this.layer.remove(); this.layer = null; } },
  snap() {
    if (R.kind === 'flow') return { node: el.page.cloneNode(true), left: el.flow.scrollLeft, top: 0 };
    const c = el.pdfpages.cloneNode(true);
    c.querySelectorAll('.textLayer').forEach(x => x.remove());
    const src = el.pdfpages.querySelectorAll('.pg.vis canvas'), dst = c.querySelectorAll('.pg.vis canvas');
    src.forEach((s, k) => { const d = dst[k]; if (d) try { d.getContext('2d').drawImage(s, 0, 0); } catch (e) { /* tainted or empty */ } });
    return { node: c, left: el.pdfview.scrollLeft, top: el.pdfview.scrollTop };
  },
  face(snap, srcX, w, posX, cls) {
    const f = document.createElement('div'); f.className = 'tface' + (cls ? ' ' + cls : '');
    f.style.left = posX + 'px'; f.style.width = w + 'px';
    const c = snap.node.cloneNode(true); c.classList.add('tclone'); c.style.left = (-snap.left - srcX) + 'px'; c.style.top = (-snap.top) + 'px';
    if (R.kind !== 'flow') { const sc = snap.node.querySelectorAll('.pg.vis canvas'), dc = c.querySelectorAll('.pg.vis canvas'); sc.forEach((s, k) => { const d = dc[k]; if (d) try { d.getContext('2d').drawImage(s, 0, 0); } catch (e) { /* empty */ } }); }
    f.appendChild(c);
    const sh = document.createElement('div'); sh.className = 'tshade'; f.appendChild(sh);
    return f;
  },
  async run(dir, change) {
    this.finish();
    if (S.turnSound) PageSound.play(dir);
    const style = reduceMotion() ? 'none' : S.turnAnim;
    if (style !== 'curl') {
      await change();
      if (style === 'fade') { el.page.classList.remove('turn'); void el.page.offsetWidth; el.page.classList.add('turn'); }
      return;
    }
    const key = () => R.kind === 'flow' ? R.ch + ':' + R.page : 'p' + PV.cur;
    const before = this.snap(), k0 = key();
    await change();
    if (k0 === key()) return;
    const after = this.snap();
    const box = R.kind === 'flow' ? el.flow : el.pdfview;
    const W = box.clientWidth, H = box.clientHeight, two = R.kind === 'flow' ? R.perView === 2 : PV.per === 2, half = W / 2;
    const layer = document.createElement('div'); layer.id = 'turn'; layer.setAttribute('aria-hidden', 'true');
    const leaf = document.createElement('div'); leaf.className = 'leaf';
    let from, to, origin;
    if (two) {
      if (dir > 0) { layer.appendChild(this.face(before, 0, half, 0)); leaf.style.left = half + 'px'; leaf.style.width = half + 'px'; origin = 'left center'; leaf.appendChild(this.face(before, half, half, 0, 'front')); leaf.appendChild(this.face(after, 0, half, 0, 'back')); from = 0; to = -180; }
      else { layer.appendChild(this.face(before, half, half, half)); leaf.style.left = '0px'; leaf.style.width = half + 'px'; origin = 'right center'; leaf.appendChild(this.face(before, 0, half, 0, 'front')); leaf.appendChild(this.face(after, half, half, 0, 'back')); from = 0; to = 180; }
    } else {
      leaf.style.left = '0px'; leaf.style.width = W + 'px'; origin = 'left center';
      if (dir > 0) { leaf.appendChild(this.face(before, 0, W, 0, 'front')); const b = document.createElement('div'); b.className = 'tface back blank'; b.style.left = '0px'; b.style.width = W + 'px'; leaf.appendChild(b); from = 0; to = -180; }
      else { layer.appendChild(this.face(before, 0, W, 0)); leaf.appendChild(this.face(after, 0, W, 0, 'front')); from = -180; to = 0; }
    }
    leaf.style.transformOrigin = origin; leaf.style.height = H + 'px';
    layer.appendChild(leaf);
    el.stage.appendChild(layer); this.layer = layer;
    const dur = two ? 760 : 620;
    const a = leaf.animate([{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }], { duration: dur, easing: 'cubic-bezier(.42,.05,.26,1)', fill: 'forwards' });
    this.anims.push(a);
    leaf.querySelectorAll('.tshade').forEach(sh => this.anims.push(sh.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: dur, easing: 'ease-in-out' })));
    try { await a.finished; } catch (e) { return; }
    if (this.layer === layer) { layer.remove(); this.layer = null; this.anims = []; }
  }
};
function bookProgress() {
  const d = R.doc; if (!d) return 0;
  if (d.kind !== 'flow') { const n = d.numPages; if (!n) return 0; if (PV.book) { const vp = PV.viewPages(PV.cur); return vp[vp.length - 1] >= n - 1 ? 1 : clamp(PV.cur / n, 0, 1); } return clamp((PV.cur + pvR()) / n, 0, 1); }
  if (R.ch === d.chapters.length - 1 && atChapterEnd() && (d.chapters.length > 1 || R.pages > 1 || el.flow.scrollHeight > el.flow.clientHeight + 4)) return 1;
  return clamp((d.cum[R.ch] + chapterR() * d.weights[R.ch]) / d.total, 0, 1);
}
function currentLoc() {
  if (R.kind === 'flow') return { ch: R.ch, b: firstVisibleBlock(), r: chapterR() };
  return { page: PV.cur, r: pvR() };
}

const onPos = () => { touch(); updateProgressUI(); updateBookmarkUI(); savePosSoon(); if (typeof Lamp !== 'undefined') Lamp.measureSoon(); };
const savePosSoon = debounce(() => {
  if (!R.open || !R.meta || !R.doc) return;
  R.meta.pos = currentLoc(); R.meta.progress = bookProgress(); R.meta.opened = Date.now();
  saveMetaSoon();
}, 400);

let scrubbing = false;
function updateProgressUI() {
  if (!R.doc || scrubbing) return;
  const p = bookProgress();
  el.scrub.value = String(Math.round(p * 1000));
  el.scrub.style.setProperty('--pp', (p * 100).toFixed(2) + '%');
  el.scrub.setAttribute('aria-valuetext', Math.round(p * 100) + ' percent');
  el.locL.textContent = Math.floor(p * 100) + '%';
  if (R.kind === 'flow') {
    const c = R.doc.chapters[R.ch];
    const left = Math.max(0, Math.ceil((1 - chapterR()) * c.len / 5.7 / 230));
    const leftTxt = atChapterEnd() ? 'End of chapter' : left <= 1 ? 'Under a minute left' : `${left} min left in chapter`;
    const pg = R.perView === 2 ? `Pages ${R.page * 2 + 1}–${Math.min(R.cols, R.page * 2 + 2)} of ${R.cols}` : `${R.page + 1} of ${R.pages}`;
    el.locR.textContent = isPaged() ? `${pg} · ${atChapterEnd() ? 'end' : left <= 1 ? '<1 min' : left + ' min'}` : leftTxt;
  } else { const vp = PV.book ? PV.viewPages(PV.cur) : [PV.cur]; el.locR.textContent = vp.length === 2 ? `Pages ${vp[0] + 1}–${vp[1] + 1} of ${R.doc.numPages}` : `Page ${vp[0] + 1} of ${R.doc.numPages}`; }
}
function updateTitles() {
  el.bkTitle.textContent = R.meta.title;
  el.chTitle.textContent = R.kind === 'flow' ? (R.doc.chapters[R.ch].title || '') : (R.meta.author || fmtLabel(R.meta.format));
}

async function renderChapter(ch, opts = {}) {
  const d = R.doc; if (!d || d.kind !== 'flow') return;
  ch = clamp(ch | 0, 0, d.chapters.length - 1);
  hideTool(); clearFlash();
  R.ch = ch; R.page = 0;
  const c = d.chapters[ch];
  el.content.innerHTML = c.html;
  el.content.querySelectorAll('img').forEach(img => {
    img.decoding = 'async';
    const p = img.getAttribute('data-res');
    if (p) d.res(p).then(u => { if (u && img.isConnected) img.src = u; });
    if (!img.complete || p) img.addEventListener('load', scheduleRelayout, { once: true });
  });
  if (S.bionic) applyBionic(el.content);
  applyHighlights();
  markBlocks();
  renderChapterEnd();
  updateTitles();
  progScroll(); el.flow.scrollTop = 0; el.flow.scrollLeft = 0;
  layoutFlow();
  if (opts.anchor) { const t = findAnchor(opts.anchor); if (t) scrollToEl(t); }
  else if (opts.end) { if (isPaged()) goPage(R.pages - 1); else el.flow.scrollTop = el.flow.scrollHeight; }
  else if (opts.block != null && opts.block >= 0 && R.blocks[opts.block]) goToBlock(opts.block);
  else if (opts.r) { if (isPaged()) goPage(Math.round(opts.r * (R.pages - 1))); else el.flow.scrollTop = opts.r * (el.flow.scrollHeight - el.flow.clientHeight); }
  if (S.spot) Spot.update(true);
  Ruler.sync();
  onPos();
}
function findAnchor(a) {
  if (!a) return null;
  try { return el.content.querySelector('#' + CSS.escape(a)) || el.content.querySelector(`[name="${CSS.escape(a)}"]`); } catch (e) { return null; }
}
function renderChapterEnd() {
  const d = R.doc, i = R.ch;
  if (i < d.chapters.length - 1) el.chEnd.innerHTML = `<div class="ch-end"><span>End of “${esc(d.chapters[i].title)}”</span><button class="next" data-act="nextChapter"><small>Next</small><b>${esc(d.chapters[i + 1].title)}</b></button></div><span class="sentinel"></span>`;
  else el.chEnd.innerHTML = `<div class="ch-end"><span class="fin">The end</span><span>You reached the end of ${esc(d.title)}.</span><button class="btn quiet sm" data-act="library">Back to your shelf</button></div><span class="sentinel"></span>`;
}
const scheduleRelayout = debounce(() => relayout(), 160);
function relayout() {
  if (!R.open || !R.doc) return;
  if (R.kind !== 'flow') { PV.relayout(); return; }
  const b = firstVisibleBlock();
  const atEnd = atChapterEnd() && R.page > 0;
  progScroll(); layoutFlow();
  if (b >= 0) goToBlock(b);
  if (atEnd && isPaged() && b < 0) goPage(R.pages - 1);
  if (S.spot) Spot.update(true);
  Ruler.sync();
  onPos();
}
async function rerenderKeep() {
  if (R.kind !== 'flow') return;
  const b = firstVisibleBlock();
  await renderChapter(R.ch, { block: b });
}

function next() {
  touch();
  if (R.kind !== 'flow') return PV.step(1);
  const last = R.doc.chapters.length - 1;
  if (isPaged()) {
    if (R.page < R.pages - 1) Turn.run(1, () => goPage(R.page + 1));
    else if (R.ch < last) Turn.run(1, () => renderChapter(R.ch + 1));
  } else {
    const f = el.flow;
    if (f.scrollTop + f.clientHeight >= f.scrollHeight - 4) { if (R.ch < last) renderChapter(R.ch + 1); }
    else f.scrollBy({ top: f.clientHeight * 0.86, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
}
function prev() {
  touch();
  if (R.kind !== 'flow') return PV.step(-1);
  if (isPaged()) {
    if (R.page > 0) Turn.run(-1, () => goPage(R.page - 1));
    else if (R.ch > 0) Turn.run(-1, () => renderChapter(R.ch - 1, { end: true }));
  } else {
    const f = el.flow;
    if (f.scrollTop <= 4) { if (R.ch > 0) renderChapter(R.ch - 1, { end: true }); }
    else f.scrollBy({ top: -f.clientHeight * 0.86, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
}
function seekBook(p) {
  const d = R.doc; if (!d) return;
  if (d.kind !== 'flow') { PV.goto(Math.min(d.numPages - 1, Math.floor(p * d.numPages)), (p * d.numPages) % 1); return; }
  const target = p * d.total;
  let i = 0; while (i < d.chapters.length - 1 && d.cum[i + 1] <= target) i++;
  const r = clamp((target - d.cum[i]) / d.weights[i], 0, 1);
  if (i === R.ch) { if (isPaged()) goPage(Math.round(r * (R.pages - 1))); else { el.flow.scrollTop = r * (el.flow.scrollHeight - el.flow.clientHeight); onPos(); } }
  else renderChapter(i, { r });
}
function navigateTo(loc) {
  if (!loc) return;
  if (R.kind === 'flow') { if (loc.ch === R.ch) { if (loc.b != null && loc.b >= 0 && R.blocks[loc.b]) goToBlock(loc.b); else seekBook((R.doc.cum[R.ch] + (loc.r || 0) * R.doc.weights[R.ch]) / R.doc.total); onPos(); } else renderChapter(loc.ch, { block: loc.b, r: loc.r }); }
  else PV.goto(loc.page || 0, loc.r || 0);
}
function pushBack() {
  R.backStack.push(currentLoc()); if (R.backStack.length > 20) R.backStack.shift();
  el.backPill.hidden = false;
  clearTimeout(pushBack.t); pushBack.t = setTimeout(() => { el.backPill.hidden = true; }, 15000);
}
function goBack() { const loc = R.backStack.pop(); el.backPill.hidden = !R.backStack.length; if (loc) navigateTo(loc); }

/* ---- Flashing a search result ---- */
let flashT = null;
function clearFlash() { clearTimeout(flashT); if ($('mark.flash', el.content)) unwrapMarks('mark.flash'); }
function flashRange(s, e) {
  clearFlash();
  const marks = wrapRange(el.content, s, e, () => { const m = document.createElement('mark'); m.className = 'flash'; return m; });
  if (marks[0]) scrollToEl(marks[0], el.flow.clientHeight * 0.35);
  flashT = setTimeout(() => { marks.forEach(m => m.classList.add('fade')); flashT = setTimeout(clearFlash, 1100); }, 2200);
}

/* ================= Pages view (PDF and comics) ================= */
const PV = {
  els: [], sizes: [], base: { w: 600, h: 800 }, rendered: new Set(), rendering: new Set(), tasks: new Map(), token: 0, cur: 0, searchQ: '', book: false, per: 1,
  /* Every page is fitted on its own: in page and spread layouts the whole page fits the screen, in scroll layout each page fills the same width — so mixed page sizes in one comic or zip all read well */
  scale(i) {
    const W = Math.max(200, el.pdfview.clientWidth), H = Math.max(200, el.pdfview.clientHeight);
    const s = (i != null && this.sizes[i]) || this.base;
    if (this.book) {
      const availH = H - topInset() - 52, availW = (W - (this.per === 2 ? 56 : 28)) / this.per;
      const wide = s.w > s.h * 1.15; // a two-page scan stays across the full width in a spread
      const aw = wide && this.per === 2 ? availW * 2 : availW;
      const fit = S.pdfFit === 'width' ? aw / s.w : Math.min(availH / s.h, aw / s.w);
      return Math.max(0.05, fit) * S.pdfZoom;
    }
    const fitW = Math.min(W - 24, R.doc && R.doc.kind === 'images' ? 1000 : 940);
    return fitW / s.w * S.pdfZoom;
  },
  setMode() {
    this.book = S.pageMode !== 'scroll';
    this.per = this.book && S.pageMode === 'spread' && window.innerWidth >= 960 ? 2 : 1;
    const on = R.kind && R.kind !== 'flow';
    el.reader.classList.toggle('pbook', !!(this.book && on));
    el.reader.classList.toggle('pspread', !!(this.book && this.per === 2 && on));
    if (!this.book) { this.els.forEach(e => { e.classList.remove('vis'); e.style.left = ''; e.style.top = ''; }); el.pdfpages.style.width = ''; el.pdfpages.style.height = ''; }
  },
  rtl() { return !!(R.meta && R.meta.rtl); },
  /* Two-page view: the cover stands alone, then pages pair up — except a wide two-page scan, which always gets the whole spread */
  isWide(i) { const z = this.sizes[i]; return !!(z && z.w > z.h * 1.15); },
  groups() {
    const n = this.els.length, g = [];
    if (!n) return g;
    g.push([0]);
    for (let i = 1; i < n;) {
      if (this.isWide(i) || i + 1 >= n || this.isWide(i + 1)) { g.push([i]); i++; }
      else { g.push([i, i + 1]); i += 2; }
    }
    return g;
  },
  groupOf(i) { const g = this.groups(); for (let k = 0; k < g.length; k++) if (g[k].includes(i)) return k; return 0; },
  viewStart(i) { if (this.per === 1) return i; const g = this.groups(); return (g[this.groupOf(i)] || [i])[0]; },
  viewPages(s) { if (this.per === 1) return [s]; const g = this.groups(); return g[this.groupOf(s)] || [s]; },
  nextStart(s, dir) { if (this.per === 1) return s + dir; const g = this.groups(), k = this.groupOf(s) + dir; return k < 0 ? -1 : k >= g.length ? this.els.length : g[k][0]; },
  placeBook() {
    if (!this.book || !this.els.length) return;
    const W = el.pdfview.clientWidth, H = el.pdfview.clientHeight;
    const pages = this.viewPages(this.cur);
    this.els.forEach(e => e.classList.remove('vis'));
    const dims = pages.map(i => ({ i, w: parseFloat(this.els[i].style.width) || 0, h: parseFloat(this.els[i].style.height) || 0 }));
    const top0 = topInset(), bot0 = 52;
    const maxH = Math.max(...dims.map(d => d.h)), maxW = Math.max(...dims.map(d => d.w));
    const needW = this.per === 2 ? 2 * maxW + 56 : maxW + 28;
    const contW = Math.max(W, needW), contH = Math.max(H, maxH + top0 + bot0);
    el.pdfpages.style.width = contW + 'px'; el.pdfpages.style.height = contH + 'px';
    const cx = contW / 2, cy = top0 + (contH - top0 - bot0) / 2;
    dims.forEach((d, k) => {
      const e = this.els[d.i]; e.classList.add('vis');
      let left;
      if (this.per === 1) left = cx - d.w / 2;
      else if (pages.length === 1) left = this.isWide(d.i) ? cx - d.w / 2 : (d.i === 0) !== this.rtl() ? cx : cx - d.w;
      else left = (k === 0) !== this.rtl() ? cx - d.w : cx;
      e.style.left = Math.round(left) + 'px'; e.style.top = Math.round(cy - d.h / 2) + 'px';
    });
  },
  turn(dir) {
    const n = this.els.length; const s = this.nextStart(this.cur, dir);
    if (s < 0 || s >= n || s === this.cur) return;
    Turn.run(this.rtl() && this.per === 2 ? -dir : dir, () => this.goto(s));
  },
  sizeEl(i) { const s = this.sizes[i] || this.base; const sc = this.scale(i); const e = this.els[i]; e.style.width = Math.round(s.w * sc) + 'px'; e.style.height = Math.round(s.h * sc) + 'px'; },
  async open(pos) {
    const d = R.doc;
    this.token++; this.rendered.clear(); this.rendering.clear(); this.tasks.clear(); this.cur = 0; this.sizes = new Array(d.numPages).fill(null); this.searchQ = '';
    if (d.kind === 'pdf') { const p1 = await d.pdf.getPage(1); const v = p1.getViewport({ scale: 1 }); this.base = { w: v.width, h: v.height }; this.sizes[0] = { ...this.base }; }
    else { try { const u = await d.url(0); const im = await loadImage(u); this.base = { w: im.naturalWidth || 800, h: im.naturalHeight || 1200 }; this.sizes[0] = { ...this.base }; } catch (e) { this.base = { w: 800, h: 1200 }; } }
    this.setMode();
    const frag = document.createDocumentFragment(); this.els = [];
    for (let i = 0; i < d.numPages; i++) { const e = document.createElement('div'); e.className = 'pg'; e.dataset.i = i; e.innerHTML = `<span class="num">${i + 1}</span>`; this.els.push(e); frag.appendChild(e); }
    el.pdfpages.innerHTML = ''; el.pdfpages.appendChild(frag); this.fresh = true; el.pdfview.scrollTop = 0; el.pdfview.scrollLeft = 0;
    this.els.forEach((_, i) => this.sizeEl(i));
    const p = pos && pos.page != null ? pos : { page: 0, r: 0 };
    this.goto(clamp(p.page, 0, d.numPages - 1), p.r || 0, true);
  },
  pageTop(i) { return this.els[i].offsetTop; },
  goto(i, r = 0, instant) {
    i = clamp(i, 0, this.els.length - 1);
    const e = this.els[i]; if (!e) return;
    if (this.book) {
      /* turning the page keeps your zoom and your place on the page: if you were looking at the lower right, the next page opens there too */
      const v = el.pdfview, my0 = v.scrollHeight - v.clientHeight, mx0 = v.scrollWidth - v.clientWidth;
      const fy = this.fresh || my0 < 3 ? 0 : v.scrollTop / my0, fx = this.fresh || mx0 < 3 ? 0.5 : v.scrollLeft / mx0;
      this.fresh = false;
      this.cur = this.viewStart(i); this.placeBook();
      progScroll(); v.scrollTop = Math.round(fy * Math.max(0, v.scrollHeight - v.clientHeight)); v.scrollLeft = Math.round(fx * Math.max(0, v.scrollWidth - v.clientWidth));
      this.update(); onPos(); return;
    }
    progScroll(); el.pdfview.scrollTop = e.offsetTop + r * e.offsetHeight - topInset();
    this.cur = i; this.update(); onPos();
  },
  findCur() {
    if (this.book) return this.cur;
    const y = el.pdfview.scrollTop + topInset() + 1;
    let lo = 0, hi = this.els.length - 1, ans = 0;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (this.els[mid].offsetTop <= y) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
    return ans;
  },
  update() {
    if (!this.els.length) return;
    this.cur = this.findCur();
    if (this.book) {
      const n = this.els.length, ns = this.nextStart(this.cur, 1), ps = this.nextStart(this.cur, -1);
      const want = this.viewPages(this.cur).concat(ns < n ? this.viewPages(ns) : [], this.cur > 0 ? this.viewPages(Math.max(0, ps)) : []);
      want.forEach(i => this.render(i));
      for (const i of Array.from(this.rendered)) if (Math.abs(i - this.cur) > 6) { this.els[i].innerHTML = `<span class="num">${i + 1}</span>`; this.rendered.delete(i); }
      return;
    }
    const vh = el.pdfview.clientHeight, st = el.pdfview.scrollTop;
    for (let i = Math.max(0, this.cur - 1); i < Math.min(this.els.length, this.cur + 4); i++) {
      const e = this.els[i]; if (e.offsetTop > st + vh * 2.2) break;
      this.render(i);
    }
    for (const i of Array.from(this.rendered)) if (Math.abs(i - this.cur) > 6) { this.els[i].innerHTML = `<span class="num">${i + 1}</span>`; this.rendered.delete(i); }
  },
  async render(i) {
    if (this.rendered.has(i) || this.rendering.has(i)) return;
    this.rendering.add(i); const token = this.token; const e = this.els[i]; const d = R.doc;
    try {
      if (d.kind === 'pdf') {
        const page = await d.pdf.getPage(i + 1);
        if (token !== this.token) return;
        const v1 = page.getViewport({ scale: 1 });
        if (!this.sizes[i] || this.sizes[i].w !== v1.width || this.sizes[i].h !== v1.height) { this.sizes[i] = { w: v1.width, h: v1.height }; this.sizeEl(i); if (this.book) this.placeBook(); }
        const sc = this.scale(i); const vp = page.getViewport({ scale: sc });
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.floor(vp.width * dpr)); canvas.height = Math.max(1, Math.floor(vp.height * dpr));
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const task = page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
        this.tasks.set(i, task);
        await task.promise;
        if (token !== this.token) return;
        e.innerHTML = ''; e.appendChild(canvas);
        const hl = document.createElement('div'); hl.className = 'hls'; e.appendChild(hl);
        const tl = document.createElement('div'); tl.className = 'textLayer'; e.appendChild(tl);
        e.style.setProperty('--scale-factor', String(sc));
        this.rendered.add(i);
        drawPdfHls(i);
        try { await window.pdfjsLib.renderTextLayer({ textContentSource: page.streamTextContent(), container: tl, viewport: vp }).promise; } catch (err) { /* text layer optional */ }
        if (token === this.token) this.markHits(i);
      } else {
        const u = await d.url(i); if (token !== this.token) return;
        const im = new Image(); im.alt = 'Page ' + (i + 1); im.src = u;
        try { await im.decode(); } catch (err) { /* draw anyway */ }
        if (token !== this.token) return;
        if (im.naturalWidth) { this.sizes[i] = { w: im.naturalWidth, h: im.naturalHeight }; this.sizeEl(i); if (this.book) this.placeBook(); }
        e.innerHTML = ''; e.appendChild(im); this.rendered.add(i);
      }
    } catch (err) {
      if (!err || err.name !== 'RenderingCancelledException') { const n = e.querySelector('.num'); if (n) n.textContent = `Page ${i + 1} could not be drawn`; }
    } finally { this.rendering.delete(i); this.tasks.delete(i); }
  },
  relayout() {
    if (!this.els.length) return;
    const i = this.cur, r = pvR();
    this.setMode();
    this.token++; this.tasks.forEach(t => { try { t.cancel(); } catch (e) { /* done */ } }); this.tasks.clear(); this.rendering.clear();
    this.rendered.clear();
    this.els.forEach((e, k) => { e.innerHTML = `<span class="num">${k + 1}</span>`; this.sizeEl(k); });
    this.goto(i, r);
  },
  step(dir) { if (this.book) return this.turn(dir); const v = el.pdfview; v.scrollBy({ top: dir * v.clientHeight * 0.86, behavior: reduceMotion() ? 'auto' : 'smooth' }); },
  jump(dir) { if (this.book) return this.turn(dir); this.goto(this.cur + dir, 0); },
  markHits(i) {
    const q = this.searchQ; const e = this.els[i]; if (!e) return;
    e.querySelectorAll('.textLayer span.hit').forEach(s => s.classList.remove('hit'));
    if (!q) return;
    e.querySelectorAll('.textLayer span').forEach(s => { if (!s.children.length && s.textContent.toLowerCase().includes(q)) s.classList.add('hit'); });
  },
  clear() { this.token++; this.tasks.forEach(t => { try { t.cancel(); } catch (e) { /* done */ } }); this.tasks.clear(); this.rendered.clear(); this.rendering.clear(); this.els = []; el.pdfpages.innerHTML = ''; }
};
function pvR() { const e = PV.els[PV.cur]; if (!e || PV.book) return 0; return clamp((el.pdfview.scrollTop + topInset() - e.offsetTop) / Math.max(1, e.offsetHeight), 0, 0.999); }
function loadImage(u) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; }); }
function drawPdfHls(i) {
  const e = PV.els[i]; const layer = e && e.querySelector('.hls'); if (!layer || !R.meta) return;
  layer.innerHTML = '';
  for (const h of R.meta.highlights) if (h.rects) for (const r of h.rects) if (r.p === i) {
    const d = document.createElement('div'); d.className = 'hlr ' + h.color;
    d.style.cssText = `left:${(r.x * 100).toFixed(3)}%;top:${(r.y * 100).toFixed(3)}%;width:${(r.w * 100).toFixed(3)}%;height:${(r.h * 100).toFixed(3)}%`;
    layer.appendChild(d);
  }
}
function textRects(range) {
  const out = []; let root = range.commonAncestorContainer; if (root.nodeType !== 1) root = root.parentNode;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    if (!range.intersectsNode(n)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    if (n === range.startContainer) r.setStart(n, range.startOffset);
    if (n === range.endContainer) r.setEnd(n, range.endOffset);
    for (const x of r.getClientRects()) if (x.width > 0.5 && x.height > 0.5) out.push(x);
  }
  return out;
}
function pdfRects(range) {
  const rects = textRects(range); const out = [];
  const boxes = Array.from(PV.rendered).map(i => [i, PV.els[i].getBoundingClientRect()]);
  for (const r of rects) {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const hit = boxes.find(([, b]) => cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom);
    if (!hit) continue; const [p, b] = hit;
    out.push({ p, x: (r.left - b.left) / b.width, y: (r.top - b.top) / b.height, w: r.width / b.width, h: r.height / b.height });
  }
  out.sort((a, b) => a.p - b.p || a.y - b.y || a.x - b.x);
  const merged = [];
  for (const r of out) {
    const m = merged[merged.length - 1];
    if (m && m.p === r.p && Math.abs((m.y + m.h / 2) - (r.y + r.h / 2)) < Math.min(m.h, r.h) * 0.5 && r.x <= m.x + m.w + 0.015) {
      const x2 = Math.max(m.x + m.w, r.x + r.w), y1 = Math.min(m.y, r.y), y2 = Math.max(m.y + m.h, r.y + r.h);
      m.x = Math.min(m.x, r.x); m.w = x2 - m.x; m.y = y1; m.h = y2 - y1;
    } else merged.push({ ...r });
  }
  return merged.slice(0, 400).map(r => ({ p: r.p, x: +r.x.toFixed(5), y: +r.y.toFixed(5), w: +r.w.toFixed(5), h: +r.h.toFixed(5) }));
}

/* ================= Bookmarks ================= */
function visibleBookmark() {
  if (!R.meta || !R.doc) return null;
  const bms = R.meta.bookmarks || [];
  if (R.kind === 'flow') {
    const a = firstVisibleBlock(), z = lastVisibleBlock();
    return bms.find(b => b.ch === R.ch && ((b.b >= 0 && b.b >= a && b.b <= z) || (b.b < 0 && Math.abs((b.r || 0) - chapterR()) < 0.02))) || null;
  }
  return bms.find(b => b.page === PV.cur) || null;
}
function updateBookmarkUI() {
  const on = !!visibleBookmark();
  el.ribbon.hidden = !on;
  $$('[data-act="bookmark"]').forEach(b => { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark this page'); });
}
function toggleBookmark() {
  if (!R.meta) return;
  const vb = visibleBookmark();
  if (vb) { R.meta.bookmarks = R.meta.bookmarks.filter(b => b !== vb); toast('Bookmark removed'); }
  else {
    const loc = currentLoc();
    let label = '';
    if (R.kind === 'flow') { const b = R.blocks[loc.b]; label = b ? normWs(b.textContent).slice(0, 110) : ''; }
    R.meta.bookmarks.push(Object.assign({ id: uid('k'), at: Date.now(), label, progress: bookProgress() }, loc));
    toast('Page bookmarked');
  }
  updateBookmarkUI(); saveMetaSoon();
}

/* ================= Selection toolbar ================= */
let selState = null, curHl = null, pointerDown = false;
function selectionInReader() {
  const sel = window.getSelection(); if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0); const text = sel.toString();
  if (!text.trim()) return null;
  if (R.kind === 'flow' && (el.content.contains(range.startContainer) || el.content.contains(range.endContainer))) return { kind: 'flow', range: range.cloneRange(), text };
  if (R.kind === 'pdf' && el.pdfpages.contains(range.commonAncestorContainer)) return { kind: 'pdf', range: range.cloneRange(), text };
  return null;
}
function checkSelection() {
  if (!R.open || pointerDown) return;
  const s = selectionInReader();
  if (!s) { if (el.tool.dataset.mode === 'sel') hideTool(); return; }
  selState = s; curHl = null;
  showTool('sel', s.range.getBoundingClientRect());
}
function toolHtml(mode, hl) {
  const dots = HL_COLORS.map(([c, n]) => `<button class="dot ${c}" data-act="hlColor" data-color="${c}" aria-label="${n} highlight" aria-pressed="${!!(hl && hl.color === c)}"></button>`).join('');
  const items = [];
  items.push(`<button class="tb" data-act="hlNote" aria-label="Note">${ICON.note}<span class="tl">${hl && hl.note ? 'Edit note' : 'Note'}</span></button>`);
  items.push(`<button class="tb" data-act="hlCopy" aria-label="Copy">${ICON.copy}<span class="tl">Copy</span></button>`);
  if (Cap.sample && !Cap.sampleBlocked) items.push(`<button class="tb" data-act="hlExplain" aria-label="Explain">${ICON.spark}<span class="tl">Explain</span></button>`);
  if (mode === 'sel') {
    const w = normWs(selState && selState.text);
    if (w && w.split(' ').length <= 2 && w.length <= 40) items.push(`<a class="tb" href="https://en.wiktionary.org/wiki/${encodeURIComponent(w.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, '').replace(/ /g, '_'))}" target="_blank" rel="noopener noreferrer" aria-label="Define">${ICON.book}<span class="tl">Define</span></a>`);
    items.push(`<button class="tb" data-act="selSpeed" aria-label="Speed-read from here">${ICON.bolt}<span class="tl">Speed-read</span></button>`);
  } else items.push(`<button class="tb" data-act="hlRemove" aria-label="Remove highlight">${ICON.trash}<span class="tl">Remove</span></button>`);
  return dots + '<span class="sep"></span>' + items.join('');
}
function showTool(mode, rect) {
  const t = el.tool;
  t.innerHTML = toolHtml(mode, mode === 'hl' ? getHl(curHl) : null);
  t.dataset.mode = mode; t.hidden = false;
  if (isCoarse() || window.innerWidth < 720) { t.classList.add('dock'); t.style.left = ''; t.style.top = ''; return; }
  t.classList.remove('dock');
  const tw = t.offsetWidth, th = t.offsetHeight;
  const x = clamp(rect.left + rect.width / 2 - tw / 2, 10, window.innerWidth - tw - 10);
  let y = rect.top - th - 10; if (y < 70) y = rect.bottom + 10; if (y + th > window.innerHeight - 10) y = window.innerHeight - th - 10;
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTool() { el.tool.hidden = true; el.tool.dataset.mode = ''; }
const getHl = id => R.meta && R.meta.highlights.find(h => h.id === id);
function createHighlight(color) {
  const st = selState; if (!st || !R.meta) return null;
  let h = null;
  if (st.kind === 'flow') {
    const off = rangeOffsets(el.content, st.range); if (!off || off.e <= off.s) return null;
    h = { id: uid('h'), ch: R.ch, s: off.s, e: off.e, text: normWs(st.text).slice(0, 4000), color, note: '', at: Date.now() };
    R.meta.highlights.push(h); wrapHl(h);
  } else {
    const rects = pdfRects(st.range); if (!rects.length) return null;
    h = { id: uid('h'), page: rects[0].p, rects, text: normWs(st.text).slice(0, 4000), color, note: '', at: Date.now() };
    R.meta.highlights.push(h); new Set(rects.map(r => r.p)).forEach(drawPdfHls);
  }
  try { window.getSelection().removeAllRanges(); } catch (e) { /* none */ }
  selState = null; hideTool(); saveMetaSoon();
  return h;
}
function setHlColor(h, color) {
  h.color = color;
  if (h.rects) new Set(h.rects.map(r => r.p)).forEach(drawPdfHls);
  else $$(`mark.hl[data-hid="${h.id}"]`, el.content).forEach(m => { m.className = 'hl ' + color + (m.classList.contains('note-end') ? ' note-end' : ''); });
  saveMetaSoon();
}
function removeHl(id) {
  const h = getHl(id); if (!h) return;
  R.meta.highlights = R.meta.highlights.filter(x => x.id !== id);
  if (h.rects) new Set(h.rects.map(r => r.p)).forEach(drawPdfHls);
  else if (h.ch === R.ch) unwrapMarks(`mark.hl[data-hid="${id}"]`);
  saveMetaSoon(); hideTool();
}
function refreshNoteMark(h) {
  if (h.rects || h.ch !== R.ch) return;
  const ms = $$(`mark.hl[data-hid="${h.id}"]`, el.content);
  ms.forEach(m => m.classList.remove('note-end'));
  if (h.note && ms.length) ms[ms.length - 1].classList.add('note-end');
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('Copied'); return true; }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove(); toast(ok ? 'Copied' : 'Copy was blocked here. Select the text and copy it yourself.'); return ok;
  }
}

/* ================= Chrome (auto-hiding bars) ================= */
let barHover = false;
const Chrome = {
  hidden: false, t: null,
  show() { el.reader.classList.remove('chrome-off'); this.hidden = false; this.arm(); },
  hide() { if (Panel.kind || !el.tool.hidden) return; el.reader.classList.add('chrome-off'); this.hidden = true; clearTimeout(this.t); },
  arm() { clearTimeout(this.t); if (!S.autoHide || !R.open) return; this.t = setTimeout(() => { if (!barHover && !Panel.kind && el.tool.hidden && R.open) this.hide(); }, 3200); },
  toggle() { this.hidden ? this.show() : this.hide(); }
};
[el.topbar, el.botbar].forEach(b => { b.addEventListener('pointerenter', () => { barHover = true; }); b.addEventListener('pointerleave', () => { barHover = false; Chrome.arm(); }); });

/* ================= Panel ================= */
const panelEl = $('#panel'), panelBody = $('#panelBody'), scrim = $('#scrim');
const Panel = {
  kind: null, data: null,
  open(kind, data) {
    if (this.kind === 'explain' && this.data && this.data.ctrl) try { this.data.ctrl.abort(); } catch (e) { /* done */ }
    this.kind = kind; this.data = data || {};
    $('#panelTitle').textContent = PANELS[kind].title;
    PANELS[kind].render();
    panelBody.scrollTop = 0;
    panelEl.classList.add('open'); panelEl.inert = false;
    if (!R.open && typeof OV !== 'undefined') OV.open('panel');
    scrim.classList.add('on'); scrim.classList.toggle('clear', kind === 'type' && window.innerWidth >= 720);
    hideTool(); if (typeof SndUI !== 'undefined') SndUI.closePop();
    if (R.open) { el.reader.classList.remove('chrome-off'); Chrome.hidden = false; clearTimeout(Chrome.t); }
    const f = PANELS[kind].focus && $(PANELS[kind].focus, panelBody);
    setTimeout(() => { if (f && !isCoarse()) f.focus(); else $('.p-head .ib', panelEl).focus({ preventScroll: true }); }, 60);
  },
  close() {
    if (!this.kind) return;
    if (this.kind === 'explain' && this.data && this.data.ctrl) try { this.data.ctrl.abort(); } catch (e) { /* done */ }
    if (this.kind === 'search') { PV.searchQ = ''; PV.rendered.forEach(i => PV.markHits(i)); }
    this.kind = null; this.data = null;
    panelEl.classList.remove('open'); panelEl.inert = true; scrim.classList.remove('on');
    if (typeof OV !== 'undefined') OV.close('panel');
    if (R.open) { Chrome.arm(); (R.kind === 'flow' ? el.flow : el.pdfview).focus({ preventScroll: true }); }
  },
  refresh() { if (!this.kind) return; const st = panelBody.scrollTop; PANELS[this.kind].render(); panelBody.scrollTop = st; }
};
scrim.addEventListener('click', () => Panel.close());

const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-set="${key}" data-val="${v}" aria-pressed="${String(S[key]) === String(v)}">${l}</button>`).join('')}</div>`;
const toggle = (key, label, hint, kbd) => `<div class="tool-row"><div class="tx"><b>${label}${kbd ? `<span class="key">${kbd}</span>` : ''}</b>${hint ? `<span class="hint">${hint}</span>` : ''}</div><span class="sw-toggle"><input type="checkbox" id="tg-${key}" data-toggle="${key}" ${S[key] ? 'checked' : ''} aria-label="${label}"><span></span></span></div>`;
const rng = (key, label, min, max, step, fmt) => `<div class="rng-row"><label for="rg-${key}">${label}</label><input class="rng" type="range" id="rg-${key}" data-range="${key}" min="${min}" max="${max}" step="${step}" value="${S[key]}"><output id="out-${key}">${fmt(S[key])}</output></div>`;
const RNG_FMT = { ttsRate: v => (+v).toFixed(2).replace(/0$/, '') + '×', lampSize: v => Math.round(v) + '%', lh: v => (+v).toFixed(2), warmth: v => Math.round(v) + '%', dim: v => Math.round(v) + '%', vol: v => Math.round(v * 100) + '%', wpm: v => v + ' wpm', scrollSpeed: v => 'Speed ' + speedLevel(v) };
const SPEEDS = [12, 18, 24, 30, 36, 44, 52, 62, 74, 88, 104, 120];
const speedLevel = v => { let k = 0; SPEEDS.forEach((s, i) => { if (Math.abs(s - v) < Math.abs(SPEEDS[k] - v)) k = i; }); return k + 1; };

const PANELS = {
  contents: { title: 'Contents', render() {
    const d = R.doc;
    if (d.kind === 'flow') {
      let cur = -1; for (let k = 0; k < d.toc.length; k++) { const t = d.toc[k]; if (t.ch < R.ch) cur = k; else if (t.ch === R.ch) { cur = k; break; } }
      panelBody.innerHTML = `<ul class="toc">${d.toc.map((t, k) => `<li class="l${t.level}"><button data-act="tocGo" data-k="${k}" class="${k === cur ? 'cur' : ''}"><span>${esc(t.title)}</span>${t.level === 0 && !t.anchor ? `<small>${Math.round(d.cum[t.ch] / d.total * 100)}%</small>` : ''}</button></li>`).join('')}</ul>`;
      const c = $('.toc .cur', panelBody); if (c) setTimeout(() => c.scrollIntoView({ block: 'center' }), 30);
    } else {
      panelBody.innerHTML = `<form class="search-box" data-form="gotoPage"><label class="sr" for="gotoPage">Page number</label><input class="field" id="gotoPage" type="number" inputmode="numeric" min="1" max="${d.numPages}" placeholder="Go to page (1–${d.numPages})"><button class="btn primary" type="submit">Go</button></form><div id="pdfToc"><p class="hint">${d.kind === 'pdf' ? 'Loading contents…' : ''}</p></div>`;
      if (d.kind === 'pdf') pdfOutline().then(o => {
        const box = $('#pdfToc'); if (!box || Panel.kind !== 'contents') return;
        box.innerHTML = o.length ? `<ul class="toc">${o.map((t, k) => `<li class="l${t.level}"><button data-act="pdfTocGo" data-k="${k}"><span>${esc(t.title)}</span></button></li>`).join('')}</ul>` : '<p class="hint">This PDF has no table of contents. Use the page number box to jump.</p>';
      });
    }
  } },
  search: { title: 'Search', focus: '#searchQ', render() {
    const q = (this.q || '');
    panelBody.innerHTML = R.doc.kind === 'images' ? '<p class="hint">Comic pages are pictures, so there is no text to search.</p>' :
      `<div class="search-box"><label class="sr" for="searchQ">Search this book</label><input class="field" id="searchQ" type="search" placeholder="Search this book" autocomplete="off" value="${esc(q)}"></div><p class="hint" id="searchMeta"></p><ul class="results" id="searchRes"></ul>`;
    if (q) runSearch(q);
  } },
  notes: { title: 'Notes', render() {
    const tab = Panel.data.tab || 'hl';
    const m = R.meta, d = R.doc;
    let html = `<div class="seg" role="group" style="margin-bottom:14px"><button type="button" data-act="notesTab" data-tab="hl" aria-pressed="${tab === 'hl'}">Highlights · ${m.highlights.length}</button><button type="button" data-act="notesTab" data-tab="bm" aria-pressed="${tab === 'bm'}">Bookmarks · ${m.bookmarks.length}</button></div>`;
    if (tab === 'hl') {
      const hs = sortedHls();
      if (!hs.length) html += '<p class="hint">Select any passage in the book and pick an ink to highlight it. Highlights and notes gather here.</p>';
      else {
        let lastG = null; html += '<div class="notes-list">';
        for (const h of hs) {
          const g = groupLabel(h);
          if (g !== lastG) { html += `<div class="group-t">${esc(g)}</div>`; lastG = g; }
          html += `<button class="note-item hl-${h.color}" style="--hlc:var(--hl-${h.color})" data-act="noteGo" data-id="${h.id}"><span class="q">${esc(h.text)}</span>${h.note ? `<span class="n">${esc(h.note)}</span>` : ''}<small>${new Date(h.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</small></button>`;
        }
        html += `</div><div class="pbtns"><button class="btn quiet sm" data-act="copyNotes">${ICON.copy}Copy all as Markdown</button>${Cap.downloads ? '<button class="btn quiet sm" data-act="saveNotes">Save as .md file</button>' : ''}</div>`;
      }
    } else {
      const bms = m.bookmarks.slice().sort((a, b) => (a.progress || 0) - (b.progress || 0));
      if (!bms.length) html += '<p class="hint">Press B or tap the bookmark icon to mark the page you are on.</p>';
      else html += '<div class="notes-list">' + bms.map(b => `<div class="note-item" style="cursor:default"><button data-act="bmGo" data-id="${b.id}" style="text-align:left;display:flex;flex-direction:column;gap:4px"><span class="n">${esc(b.label || (d.kind === 'flow' ? d.chapters[b.ch] && d.chapters[b.ch].title : 'Page ' + (b.page + 1)))}</span><small>${esc(d.kind === 'flow' ? (d.chapters[b.ch] ? d.chapters[b.ch].title : '') : 'Page ' + (b.page + 1))} · ${Math.round((b.progress || 0) * 100)}%</small></button><button class="btn quiet sm" data-act="bmDel" data-id="${b.id}" style="align-self:flex-start">Remove</button></div>`).join('') + '</div>';
    }
    panelBody.innerHTML = html;
  } },
  note: { title: 'Note', focus: '#noteText', render() {
    const h = getHl(Panel.data.id); if (!h) { panelBody.innerHTML = '<p class="hint">This highlight no longer exists.</p>'; return; }
    panelBody.innerHTML = `<blockquote class="quote">${esc(h.text)}</blockquote><label class="sr" for="noteText">Your note</label><textarea class="field" id="noteText" placeholder="What does this make you think?">${esc(h.note || '')}</textarea><div class="pbtns"><button class="btn primary" data-act="noteSave">Save note</button>${h.note ? '<button class="btn quiet" data-act="noteDelete">Delete note</button>' : ''}</div>`;
  } },
  explain: { title: 'Explain', render() {
    panelBody.innerHTML = `<blockquote class="quote">${esc(Panel.data.text)}</blockquote><div class="answer" id="exAns" aria-live="polite">Thinking…</div><div class="pbtns"><button class="btn quiet sm" data-act="exStop" id="exStop">Stop</button><button class="btn quiet sm" data-act="exCopy" hidden id="exCopy">${ICON.copy}Copy</button></div><p class="hint" style="margin-top:14px">Answers come from Claude using your Claude account.</p>`;
  } },
  type: { title: 'Text & display', render() {
    const flow = R.doc && R.doc.kind === 'flow';
    const rk = rtKey();
    let h = `<div class="sec"><h3>Reading surface${rk === 'rtPrivate' ? ' <span class="key">Private books</span>' : ''}</h3><div class="themes">${THEMES.map(([k, n, bg, fg]) => `<button type="button" class="sw" data-set="${rk}" data-val="${k}" aria-pressed="${S[rk] === k}"><i style="background:${bg};color:${fg}">${k === 'auto' ? '' : 'Aa'}</i>${n}</button>`).join('')}</div></div>`;
    if (flow) {
      h += `<div class="sec"><h3>Typeface</h3><div class="fonts">${Object.entries(FONTS).map(([k, f]) => `<button type="button" class="fontb" data-set="font" data-val="${k}" aria-pressed="${S.font === k}"><b style="font-family:${esc(f.css)}">${f.name}</b><span>${f.note}</span></button>`).join('')}</div></div>
      <div class="sec"><h3>Size and spacing</h3>
        <div class="row"><span class="lbl">Text size</span><div class="stepper"><button type="button" data-act="sizeDn" aria-label="Smaller text">${ICON.minus}</button><output>${S.size}px</output><button type="button" data-act="sizeUp" aria-label="Larger text">${ICON.plus}</button></div></div>
        ${rng('lh', 'Line spacing', 1.3, 2.2, 0.05, RNG_FMT.lh)}
        <div class="row"><span class="lbl">Line length</span>${seg('width', [['narrow', 'Narrow'], ['medium', 'Medium'], ['wide', 'Wide']])}</div>
        <div class="row"><span class="lbl">Alignment</span>${seg('align', [['left', 'Left'], ['justify', 'Justified']])}</div>
        <div class="row"><span class="lbl">Paragraphs</span>${seg('para', [['spaced', 'Spaced'], ['indent', 'Indented']])}</div>
      </div>
      <div class="sec"><h3>Layout</h3><div class="row"><span class="lbl">Layout</span>${seg('mode', [['scroll', 'Scroll'], ['paged', 'One page'], ['spread', 'Two pages']])}</div>
        ${S.mode === 'spread' && window.innerWidth < 960 ? '<p class="hint">Two pages needs a wider window, so one page is shown until the window is at least 960 pixels wide.</p>' : ''}
        ${S.mode !== 'scroll' ? `<div class="row"><span class="lbl">Page turn</span>${seg('turnAnim', [['curl', 'Curl'], ['fade', 'Fade'], ['none', 'Instant']])}</div>${toggle('turnSound', 'Page-turn sound', 'A soft paper sound each time you turn.')}` : ''}</div>`;
    } else {
      h += `<div class="sec"><h3>Pages</h3>
        ${S.pageMode !== 'scroll' ? `<div class="row"><span class="lbl">Fit pages</span>${seg('pdfFit', [['page', 'Whole page'], ['width', 'Full width']])}</div>` : ''}
        <div class="row"><span class="lbl">Zoom</span><div class="stepper"><button type="button" data-act="zoomDn" aria-label="Zoom out">${ICON.minus}</button><output id="zoomOut">${Math.round(S.pdfZoom * 100)}%</output><button type="button" data-act="zoomUp" aria-label="Zoom in">${ICON.plus}</button></div></div>
        <div class="row"><span class="lbl">Layout</span>${seg('pageMode', [['scroll', 'Scroll'], ['single', 'One page'], ['spread', 'Two pages']])}</div>
        <div class="row"><span class="lbl">Page order</span><div class="seg" role="group"><button type="button" data-act="setRtl" data-val="0" aria-pressed="${!(R.meta && R.meta.rtl)}">Left to right</button><button type="button" data-act="setRtl" data-val="1" aria-pressed="${!!(R.meta && R.meta.rtl)}">Right to left</button></div></div>
        <p class="hint" style="margin:-4px 0 8px">Right to left is for manga. It is saved for this book only.</p>
        ${S.pageMode === 'spread' && window.innerWidth < 960 ? '<p class="hint">Two pages needs a wider window, so one page is shown until the window is at least 960 pixels wide.</p>' : ''}
        ${S.pageMode !== 'scroll' ? `<div class="row"><span class="lbl">Page turn</span>${seg('turnAnim', [['curl', 'Curl'], ['fade', 'Fade'], ['none', 'Instant']])}</div>${toggle('turnSound', 'Page-turn sound', 'A soft paper sound each time you turn.')}` : ''}
        <div class="row"><span class="lbl">${S.pageMode === 'scroll' ? 'Fit to width' : 'Fit to screen'}</span><button class="btn quiet sm" data-act="zoomFit">Reset</button></div>
        <div class="row"><span class="lbl">Page colors</span>${seg('pdfColor', [['original', 'Original'], ['tint', 'Tinted'], ['invert', 'Dark text']])}</div>
        <p class="hint" style="margin:-2px 0 4px">Tinted keeps artwork true and softens it to match the surface. Dark text flips white pages to dark on Dusk, Velvet and Night, which suits text PDFs but turns color pictures into negatives.</p></div>`;
    }
    h += `<div class="sec"><h3>Eye comfort</h3>${R.kind === 'flow' ? `<div class="row"><span class="lbl">Picture colors</span>${seg('pdfColor', [['original', 'Original'], ['tint', 'Match surface']])}</div>` : ''}${rng('warmth', 'Warmth', 0, 100, 1, RNG_FMT.warmth)}${rng('dim', 'Dim', 0, 100, 1, RNG_FMT.dim)}<p class="hint">Warmth filters blue light. Dim goes below your screen’s lowest brightness for reading in the dark.</p></div>`;
    panelBody.innerHTML = h;
  } },
  focus: { title: 'Focus', render() {
    const flow = R.doc && R.doc.kind === 'flow';
    let h = '<div class="sec"><h3>Focus session</h3>';
    if (Session.active) {
      h += `<div class="session-card"><div class="session-time" id="sessTime">${fmtClock(Session.end - Date.now())}</div><div class="hint">left in this session · left the page ${Session.leaves} time${Session.leaves === 1 ? '' : 's'}</div><div class="pbtns" style="margin:0"><button class="btn quiet sm" data-act="deep">Deep focus</button><button class="btn quiet sm" data-act="sessEnd">End session</button></div></div>`;
    } else {
      h += `<div class="session-card"><div class="chips">${[15, 25, 45, 60].map(m => `<button type="button" class="chip" data-set="sessionMin" data-val="${m}" data-num="1" aria-pressed="${S.sessionMin === m}">${m} min</button>`).join('')}</div>
        ${toggle('sessionDeep', 'Go full screen and hide controls', '')}
        <button class="btn primary" data-act="sessStart" style="align-self:flex-start">Start ${S.sessionMin}-minute session</button></div>`;
    }
    h += `<div class="row" style="margin-top:10px"><span class="lbl">Daily reading goal</span><div class="stepper"><button type="button" data-act="goalDn" aria-label="Lower goal">${ICON.minus}</button><output>${S.goal} min</output><button type="button" data-act="goalUp" aria-label="Raise goal">${ICON.plus}</button></div></div></div>`;
    h += '<div class="sec"><h3>Reading aids</h3>';
    h += toggle('ruler', 'Reading ruler', 'Dims all but a band of lines.', 'L');
    if (flow) h += toggle('spot', 'Paragraph spotlight', 'Fades every paragraph but the current one.', 'S') + toggle('bionic', 'Bionic emphasis', 'Bolds the start of each word to guide your eye.');
    h += toggle('autoHide', 'Hide controls while reading', 'They return when you move to the top or bottom, or tap the middle.') + toggle('eyeBreaks', 'Eye breaks', 'Every 20 minutes, look about 6 m (20 ft) away for 20 seconds.') + '</div>';
    if (R.doc && R.doc.kind !== 'images') {
      const vs = Speak.supported() ? Speak.voices() : [];
      const cur = Speak.voice();
      h += `<div class="sec"><h3>Read aloud <span class="key">V</span></h3>`;
      if (!Speak.supported()) h += '<p class="hint">This browser has no built-in voices, so read aloud is not available here.</p></div>';
      else {
        h += `<div class="row"><label class="lbl" for="ttsVoiceSel">Voice</label><select class="field" id="ttsVoiceSel" data-sel="ttsVoice" style="max-width:220px;height:36px">${vs.length ? vs.map(v => `<option value="${esc(v.voiceURI)}" ${cur && cur.voiceURI === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('') : '<option value="">Default voice</option>'}</select></div>
        ${rng('ttsRate', 'Speed', 0.6, 2, 0.05, RNG_FMT.ttsRate)}
        <p class="hint" style="margin:2px 0 10px">Reads from the paragraph you are on, highlights each sentence and turns pages for you. Voices come from your device.</p>
        <button class="btn quiet sm" data-act="ttsStart">${Speak.on ? 'Stop reading aloud' : 'Read aloud from here'}</button></div>`;
      }
    }
    if (R.doc && R.doc.kind !== 'images') h += `<div class="sec"><h3>Speed reader <span class="key">R</span></h3>${rng('wpm', 'Pace', 150, 800, 25, RNG_FMT.wpm)}<button class="btn quiet sm" data-act="rsvpStart">${ICON.bolt}Speed-read from here</button></div>`;
    h += `<div class="sec"><h3>Auto-scroll <span class="key">A</span></h3>${rng('scrollSpeed', 'Speed', 12, 120, 1, RNG_FMT.scrollSpeed)}<button class="btn quiet sm" data-act="autoStart">${Auto.on ? 'Stop auto-scroll' : 'Start auto-scroll'}</button></div>`;
    const cs = allCustomSounds();
    const curCustom = cs.find(x => S.sound === 'custom:' + x.id);
    h += `<div class="sec"><h3>Soundscape</h3><div class="chips">${SOUNDS.map(([k, l]) => `<button type="button" class="chip" data-act="sound" data-val="${k}" aria-pressed="${S.sound === k}">${l}</button>`).join('')}${cs.map(x => `<button type="button" class="chip" data-act="sound" data-val="custom:${x.id}" aria-pressed="${S.sound === 'custom:' + x.id}">♪ ${esc(x.name)}</button>`).join('')}<label class="chip add-sound" for="soundInput" tabindex="0">+ Your own sound</label></div>
      ${rng('vol', 'Volume', 0, 1, 0.01, RNG_FMT.vol)}
      ${curCustom ? `<div class="row"><span class="hint">“${esc(curCustom.name)}” plays on repeat.</span><button class="btn quiet sm" data-act="removeSound" data-id="${curCustom.id}">Remove</button></div>` : '<p class="hint">Add an MP3, M4A, WAV or OGG file from your device. It loops while you read and stays saved in this browser.</p>'}</div>`;
    h += `<div class="sec"><h3>Hyperfocus lamp <span class="key">H</span></h3>
      ${toggle('lampShow', 'Show the lamp', 'Hang it above the page. Pull its cord to darken the room around your text.')}
      ${rng('lampScale', 'Lamp size', 60, 160, 5, v => Math.round(v) + '%')}
      ${rng('lampSize', 'Light size', 40, 220, 5, v => Math.round(v) + '%')}
      <p class="hint" style="margin:2px 0 10px">Lamp size changes the lamp itself. Light size changes the circle of light on the page. While reading, press { and } for the lamp, [ and ] for the light.</p>
      <button class="btn quiet sm" data-act="lampToggle">${Lamp.on ? 'Switch the light off' : 'Switch the light on'}</button></div>`;
    h += `<div class="sec"><h3>Magnifier <span class="key">M</span></h3>
      <p class="hint" style="margin:0 0 10px">A glass that enlarges whatever is beneath it. On a computer it follows the pointer; on a phone, drag it.</p>
      <div class="row"><span class="lbl">Shape</span><div class="seg" role="group"><button type="button" data-set="magShape" data-val="circle" aria-pressed="${S.magShape !== 'rect'}">Round</button><button type="button" data-set="magShape" data-val="rect" aria-pressed="${S.magShape === 'rect'}">Rectangle</button></div></div>
      ${rng('magSize', 'Glass size', 120, 480, 10, v => Math.round(v) + 'px')}
      ${rng('magZoom', 'Zoom', 1.25, 5, 0.25, v => (+v).toFixed(2).replace(/\.?0+$/, '') + '×')}
      <button class="btn quiet sm" data-act="magnifier">${Mag.on ? 'Put the magnifier away' : 'Show the magnifier'}</button></div>`;
    h += `<div class="sec"><h3>Deep focus <span class="key">F</span></h3><p class="hint" style="margin:0 0 10px">Full screen, no controls, screen kept awake. Press Esc to come back.</p><button class="btn primary" data-act="deep">${ICON.expand}Enter deep focus</button></div>`;
    panelBody.innerHTML = h;
  } },
  keys: { title: 'Keyboard shortcuts', render() {
    const rows = [['→ Space', 'Next page or screen'], ['← Shift+Space', 'Previous page or screen'], ['J K', 'Next or previous paragraph'], ['T', 'Contents'], ['/', 'Search'], ['N', 'Notes'], ['B', 'Bookmark'], ['F', 'Deep focus'], ['L', 'Reading ruler'], ['S', 'Paragraph spotlight'], ['R', 'Speed reader'], ['A', 'Auto-scroll'], ['W', 'Video beside the book'], ['M', 'Magnifier'], ['H', 'Lamp light'], ['+ −', 'Text size or zoom'], ['Esc', 'Close or exit'], ['?', 'This list']];
    panelBody.innerHTML = `<table class="keys"><tbody>${rows.map(([k, v]) => `<tr><td>${k.split(' ').map(x => `<kbd>${esc(x)}</kbd>`).join('')}</td><td>${v}</td></tr>`).join('')}</tbody></table><p class="hint" style="margin-top:14px">In the speed reader: Space plays and pauses, ← and → jump a sentence, ↑ and ↓ change the pace.</p>`;
  } },
  app: { title: 'Settings', render() {
    panelBody.innerHTML = `<div class="sec"><h3>Private <small class="age">18+</small></h3>
      <p class="hint" style="margin:0 0 12px">A separate shelf, locked with a PIN and encrypted on this device. Its books never show on your main shelf.</p>
      <button class="btn primary" data-act="afterDark" style="margin-bottom:12px"><svg class="i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Open Private</button>
      <div class="tool-row"><div class="tx"><b>Show the Private button</b><span class="hint">Turn this off to keep the home screen clean. You can still get in here, by holding the Readflix logo, or with Shift and D.</span></div><span class="sw-toggle"><input type="checkbox" id="tg-vaultShow" data-act="vaultShowBtn" ${S.vaultHideBtn ? '' : 'checked'} aria-label="Show the Private button"><span></span></span></div></div>
      <div class="sec"><h3>Add books</h3><div class="pbtns" style="justify-content:flex-start"><label class="btn quiet sm" for="fileInput">Open files</label><button class="btn quiet sm" data-act="pastePanel">Paste text</button></div></div>
      <div class="sec"><h3>Help</h3><button class="btn quiet sm" data-act="keys">Keyboard shortcuts</button></div>`;
  } },
  vault: { title: 'Private (18+)', render() {
    panelBody.innerHTML = `<div class="sec"><h3>Privacy</h3>
      ${toggle('vaultBlur', 'Blur covers', 'Hide cover images on the private shelf until you open a book.')}
      ${toggle('vaultLockAway', 'Lock when I switch away', 'Locks after 30 seconds in another tab or app. It also locks after 15 minutes without activity.')}
      ${toggle('vaultHideBtn', 'Hide the Private button', 'Keep the main shelf clean. You can always get back in from Settings (the gear on the home screen), by holding the Readflix logo, or with Shift and D.')}
      ${toggle('vaultVelvet', 'Separate surface for private books', 'Private books start on Velvet. Choose any surface in Aa while reading one, and it applies to private books only.')}
      <p class="hint">Press Esc twice at any time to lock Private instantly and return to your main shelf.</p></div>
      <div class="sec"><h3>Change PIN</h3><form data-form="vaultPin" class="gate-form" autocomplete="off" novalidate>
        <label for="vNew1">New PIN</label><input class="field" id="vNew1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12">
        <label for="vNew2">Type it again</label><input class="field" id="vNew2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12">
        <p class="hint" id="vPinErr" role="status"></p><button class="btn quiet sm" type="submit">Change PIN</button></form></div>
      <div class="sec"><h3>Erase</h3><p class="hint" style="margin:0 0 10px">Delete every private book, highlight and note from this device.</p><button class="btn quiet sm danger" data-act="vaultEraseAsk">Erase the Private shelf…</button></div>`;
  } },
  paste: { title: 'Paste text', focus: '#pasteText', render() {
    panelBody.innerHTML = `<p class="hint" style="margin-top:0">Paste an article, notes or any text, and read it here with every tool.</p><label class="sr" for="pasteTitle">Title</label><input class="field" id="pasteTitle" placeholder="Title (optional)" style="margin-bottom:10px"><label class="sr" for="pasteText">Text</label><textarea class="field" id="pasteText" style="min-height:240px" placeholder="Paste text here">${esc(Panel.data.text || '')}</textarea><div class="pbtns"><button class="btn primary" data-act="pasteAdd">Add to shelf and read</button></div>`;
  } }
};
const fmtClock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function sortedHls() {
  const hs = R.meta.highlights.slice();
  return hs.sort((a, b) => a.rects ? (a.page - b.page || a.rects[0].y - b.rects[0].y) : (a.ch - b.ch || a.s - b.s));
}
function groupLabel(h) { if (h.rects) return 'Page ' + (h.page + 1); const c = R.doc.chapters[h.ch]; return c ? c.title : 'Section ' + (h.ch + 1); }
function notesMarkdown() {
  const m = R.meta; let out = `# ${m.title}\n` + (m.author ? `\n_${m.author}_\n` : '') + '\n';
  let lastG = null;
  for (const h of sortedHls()) {
    const g = groupLabel(h); if (g !== lastG) { out += `## ${g}\n\n`; lastG = g; }
    out += `> ${h.text.replace(/\n/g, '\n> ')}\n\n`;
    if (h.note) out += `${h.note}\n\n`;
  }
  return out.trim() + '\n';
}
async function pdfOutline() {
  if (R.doc._outline) return R.doc._outline;
  let o = null; try { o = await R.doc.pdf.getOutline(); } catch (e) { o = null; }
  const out = [];
  const walk = (items, l) => { for (const it of items || []) { if (out.length > 1000) return; out.push({ title: normWs(it.title) || 'Untitled', dest: it.dest, level: Math.min(l, 3) }); walk(it.items, l + 1); } };
  walk(o, 0); R.doc._outline = out; return out;
}
async function resolveDest(dest) {
  const pdf = R.doc.pdf; let d = dest;
  try { if (typeof d === 'string') d = await pdf.getDestination(d); if (!Array.isArray(d)) return null; const ref = d[0]; if (typeof ref === 'number') return ref; if (ref && typeof ref === 'object') return await pdf.getPageIndex(ref); } catch (e) { return null; }
  return null;
}

/* ---- Search ---- */
let searchToken = 0;
const runSearchSoon = debounce(q => runSearch(q), 280);
function chapterTexts() {
  const d = R.doc;
  if (!d.texts) { d.texts = d.chapters.map(c => { const t = document.createElement('template'); t.innerHTML = c.html; return t.content.textContent; }); d.textsLower = d.texts.map(x => x.toLowerCase()); }
  return d.texts;
}
function snippet(text, idx, len) {
  const a = Math.max(0, idx - 70), b = Math.min(text.length, idx + len + 90);
  return (a > 0 ? '…' : '') + esc(normWs(text.slice(a, idx)) + ' ').replace(/ $/, idx > 0 && /\s/.test(text[idx - 1]) ? ' ' : '') + '<b>' + esc(text.slice(idx, idx + len)) + '</b>' + esc(text.slice(idx + len, b).replace(/\s+/g, ' ')) + (b < text.length ? '…' : '');
}
async function runSearch(q) {
  PANELS.search.q = q;
  const ql = q.toLowerCase().trim(); const token = ++searchToken;
  const res = $('#searchRes'), meta = $('#searchMeta'); if (!res) return;
  if (ql.length < 2) { res.innerHTML = ''; meta.textContent = ql ? 'Type at least two letters.' : ''; PV.searchQ = ''; return; }
  const d = R.doc; const items = []; const LIMIT = 300;
  if (d.kind === 'flow') {
    const texts = chapterTexts();
    for (let ch = 0; ch < texts.length && items.length < LIMIT; ch++) {
      const low = d.textsLower[ch]; let idx = low.indexOf(ql), n = 0;
      while (idx >= 0 && items.length < LIMIT) { items.push({ ch, n, idx }); n++; idx = low.indexOf(ql, idx + ql.length); }
    }
    meta.textContent = items.length ? `${items.length >= LIMIT ? 'First ' + LIMIT : items.length} result${items.length === 1 ? '' : 's'}` : 'No matches in this book.';
    res.innerHTML = items.map(it => `<li><button data-act="searchGo" data-ch="${it.ch}" data-n="${it.n}"><small>${esc(d.chapters[it.ch].title)}</small><span class="snip">${snippet(d.texts[it.ch], it.idx, ql.length)}</span></button></li>`).join('');
  } else if (d.kind === 'pdf') {
    PV.searchQ = ql;
    d._texts = d._texts || [];
    res.innerHTML = ''; let found = 0;
    for (let p = 0; p < d.numPages && found < LIMIT; p++) {
      if (token !== searchToken || Panel.kind !== 'search') return;
      meta.textContent = `Searching page ${p + 1} of ${d.numPages}…`;
      if (d._texts[p] == null) { try { const pg = await d.pdf.getPage(p + 1); const tc = await pg.getTextContent(); d._texts[p] = tc.items.map(it => (it.str || '') + (it.hasEOL ? ' ' : '')).join(''); } catch (e) { d._texts[p] = ''; } }
      const t = d._texts[p], low = t.toLowerCase(); let idx = low.indexOf(ql); let html = '';
      while (idx >= 0 && found < LIMIT) { html += `<li><button data-act="pdfSearchGo" data-page="${p}"><small>Page ${p + 1}</small><span class="snip">${snippet(t, idx, ql.length)}</span></button></li>`; found++; idx = low.indexOf(ql, idx + ql.length); }
      if (html) res.insertAdjacentHTML('beforeend', html);
    }
    if (token === searchToken) meta.textContent = found ? `${found >= LIMIT ? 'First ' + LIMIT : found} result${found === 1 ? '' : 's'}` : 'No matches in this PDF. Scanned pages have no searchable text.';
    PV.rendered.forEach(i => PV.markHits(i));
  }
}
async function searchGo(ch, n) {
  const q = (PANELS.search.q || '').toLowerCase().trim(); if (!q) return;
  if (window.innerWidth < 1100) Panel.close();
  if (ch !== R.ch) await renderChapter(ch);
  const low = el.content.textContent.toLowerCase();
  let idx = -1; for (let k = 0; k <= n; k++) { idx = low.indexOf(q, idx + (k ? q.length : 0)); if (idx < 0) break; }
  if (idx >= 0) flashRange(idx, idx + q.length);
  onPos();
}

/* ================= Explain with Claude ================= */
async function explain(text) {
  if (!Cap.sample) return;
  text = normWs(text).slice(0, 3000);
  const ctrl = new AbortController();
  Panel.open('explain', { text, ctrl });
  const out = $('#exAns');
  const where = R.kind === 'flow' && R.doc.chapters[R.ch] ? `, in the part titled "${R.doc.chapters[R.ch].title}"` : '';
  const prompt = `You are a quiet reading companion inside an e-reader. The reader is reading "${R.meta.title}"${R.meta.author ? ' by ' + R.meta.author : ''}${where}.\n\nThey selected this passage:\n"""\n${text}\n"""\n\nExplain it in plain language in at most 120 words. If the selection is a single word or a short phrase, start with its meaning in this context. Point out any reference, allusion or term a modern reader might miss. Write plain text with no markdown, lists or headings.`;
  try {
    const r = await Cap.sample(prompt, { onText: ({ text: t }) => { if (out.isConnected) out.textContent = t; }, signal: ctrl.signal, modelTier: 'quick' });
    if (out.isConnected) { out.textContent = r.text; $('#exStop').hidden = true; $('#exCopy').hidden = false; }
  } catch (e) {
    if (!out.isConnected) return;
    const code = e && e.code;
    $('#exStop').hidden = true;
    if (code === 'cancelled') out.textContent = (e.text || out.textContent.replace(/^Thinking…$/, '')) + '\n\nStopped.';
    else if (code === 'not_granted' || code === 'sampling_disabled' || code === 'capability_disabled' || code === 'capability_removed') { Cap.sampleBlocked = true; out.textContent = 'Explanations are not allowed on this page right now, so the Explain button is hidden until you reopen it.'; }
    else if (code === 'rate_limited' || code === 'queue_overflow') out.textContent = 'Too many questions at once. Wait a moment, then try again.';
    else out.textContent = (e && e.text ? e.text + '\n\n' : '') + 'The explanation could not be finished. Try again in a moment.';
  }
}

/* ================= Reading aids ================= */
const Ruler = {
  y: null,
  sync() {
    const on = R.open && S.ruler && !Rsvp.on;
    $('#ruler').hidden = !on;
    if (on) this.place(this.y == null || isCoarse() ? window.innerHeight * 0.36 : this.y);
  },
  place(y) {
    const H = window.innerHeight;
    const lineH = R.kind === 'flow' ? S.size * S.lh : 30;
    const band = Math.round(lineH * 2 + 8);
    this.y = clamp(y, 70, H - 70);
    const top = Math.max(0, Math.round(this.y - band / 2));
    $('#ruler .top').style.height = top + 'px';
    $('#ruler .bot').style.top = (top + band) + 'px';
  },
  nudge(dir) { this.place((this.y || window.innerHeight * 0.36) + dir * (R.kind === 'flow' ? S.size * S.lh : 30)); }
};
function blockAtY(y) {
  const B = R.blocks; let lo = 0, hi = B.length - 1, ans = B.length - 1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (B[mid].getBoundingClientRect().bottom >= y) { ans = mid; hi = mid - 1; } else lo = mid + 1; }
  return ans;
}
const Spot = {
  lockUntil: 0,
  update(force) {
    if (R.kind !== 'flow' || !R.blocks.length) return;
    if (!force && Date.now() < this.lockUntil) return;
    let i;
    if (isPaged()) { const a = firstVisibleBlock(), z = lastVisibleBlock(); i = (!force && R.active >= a && R.active <= z) ? R.active : a; }
    else { const fr = el.flow.getBoundingClientRect(); i = blockAtY(fr.top + fr.height * 0.38); }
    this.set(i);
  },
  set(i) {
    if (R.blocks[R.active] && i !== R.active) R.blocks[R.active].classList.remove('on');
    R.active = i; if (R.blocks[i]) R.blocks[i].classList.add('on');
  },
  step(dir) {
    if (R.kind !== 'flow' || !R.blocks.length) return dir > 0 ? next() : prev();
    const start = R.active >= 0 ? R.active : firstVisibleBlock();
    const i = start + dir;
    if (i < 0) return prev();
    if (i >= R.blocks.length) return next();
    this.set(i); this.lockUntil = Date.now() + 500;
    const b = R.blocks[i];
    if (isPaged()) { if (i < firstVisibleBlock() || i > lastVisibleBlock()) scrollToEl(b); }
    else { const fr = el.flow.getBoundingClientRect(), r = b.getBoundingClientRect(); el.flow.scrollTo({ top: el.flow.scrollTop + r.top - (fr.top + fr.height * 0.38) + 6, behavior: reduceMotion() ? 'auto' : 'smooth' }); }
  }
};

/* ---- Speed reader (one word at a time) ---- */
const rsEl = { box: $('#rsvp'), l: $('#rsL'), p: $('#rsP'), r: $('#rsR'), prog: $('#rsProg'), ctx: $('#rsCtx'), title: $('#rsTitle'), wpm: $('#rsWpm'), play: $('#rsPlay') };
const Rsvp = {
  on: false, playing: false, words: [], i: 0, t: null, pdfNext: 0, loadingMore: false,
  async start(fromSel) {
    if (!R.open || !R.doc) return;
    if (R.kind === 'images') { toast('Comic pages have no text to speed-read.'); return; }
    Auto.stop(); Panel.close(); hideTool(); Speak.stop(true);
    this.words = []; this.i = 0;
    if (R.kind === 'flow') {
      let b = S.spot && R.active >= 0 ? R.active : firstVisibleBlock();
      if (fromSel && fromSel.kind === 'flow') { const n = fromSel.range.startContainer; const blk = (n.nodeType === 1 ? n : n.parentNode).closest('.rb'); const k = blk ? R.blocks.indexOf(blk) : -1; if (k >= 0) b = k; }
      this.loadFlow(Math.max(0, b));
    } else { this.pdfNext = PV.cur; await this.loadPdf(); }
    if (!this.words.length) { toast('There is no text here to speed-read.'); return; }
    this.on = true; rsEl.box.hidden = false; Ruler.sync(); Wake.on();
    this.show(); this.play();
  },
  loadFlow(from) {
    R.blocks.slice(from).forEach((blk, k) => { const ws = blk.textContent.split(/\s+/).filter(Boolean); ws.forEach((w, j) => this.words.push({ w, b: from + k, end: j === ws.length - 1 })); });
  },
  async loadPdf() {
    const n = R.doc.numPages; let added = 0;
    while (this.pdfNext < n && added < 500) {
      const p = this.pdfNext++;
      let t = R.doc._texts && R.doc._texts[p];
      if (t == null) { try { const pg = await R.doc.pdf.getPage(p + 1); const tc = await pg.getTextContent(); t = tc.items.map(it => (it.str || '') + (it.hasEOL ? ' ' : '')).join(''); } catch (e) { t = ''; } R.doc._texts = R.doc._texts || []; R.doc._texts[p] = t; }
      const ws = normWs(t).split(' ').filter(Boolean);
      ws.forEach((w, j) => this.words.push({ w, page: p, end: j === ws.length - 1 }));
      added += ws.length;
    }
  },
  delay(wd) {
    let k = 1; const w = wd.w;
    if (w.length > 8) k += 0.25; if (w.length > 12) k += 0.3;
    if (/[,;:—–]["”’')\]]*$/.test(w)) k += 0.7;
    if (/[.!?…]["”’')\]]*$/.test(w)) k += 1.3;
    if (wd.end) k += 0.9;
    return 60000 / S.wpm * k;
  },
  show() {
    const wd = this.words[this.i]; if (!wd) return;
    const w = wd.w;
    const m = /[\p{L}\p{N}]/u.exec(w); const s0 = m ? m.index : 0;
    const core = w.slice(s0).replace(/[^\p{L}\p{N}]+$/u, '').length || 1;
    const piv = s0 + (core <= 1 ? 0 : core <= 5 ? 1 : core <= 9 ? 2 : core <= 13 ? 3 : 4);
    rsEl.l.textContent = w.slice(0, piv); rsEl.p.textContent = w.charAt(piv); rsEl.r.textContent = w.slice(piv + 1);
    rsEl.prog.style.width = (this.i / Math.max(1, this.words.length - 1) * 100) + '%';
    const left = Math.max(0, this.words.length - this.i);
    rsEl.title.textContent = (R.kind === 'flow' ? R.doc.chapters[R.ch].title : 'Page ' + (wd.page + 1)) + ' · ' + R.meta.title;
    rsEl.ctx.textContent = this.playing ? '' : `${left} words left ${R.kind === 'flow' ? 'in this chapter' : 'loaded'} · about ${Math.max(1, Math.round(left / S.wpm))} min at this pace. Tap the word or press Space to ${this.i ? 'resume' : 'start'}.`;
    rsEl.wpm.textContent = S.wpm + ' wpm';
    rsEl.play.innerHTML = this.playing ? ICON.pause : ICON.play;
    rsEl.play.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
  },
  play() { if (!this.on) return; this.playing = true; this.show(); clearTimeout(this.t); this.t = setTimeout(() => this.tick(), this.delay(this.words[this.i])); },
  pause() { this.playing = false; clearTimeout(this.t); this.show(); },
  toggle() { this.playing ? this.pause() : this.play(); },
  async tick() {
    if (!this.on || !this.playing) return;
    touch();
    if (R.kind === 'pdf' && !this.loadingMore && this.i > this.words.length - 80 && this.pdfNext < R.doc.numPages) { this.loadingMore = true; this.loadPdf().finally(() => { this.loadingMore = false; }); }
    if (this.i >= this.words.length - 1) {
      if (R.kind === 'flow' && R.ch < R.doc.chapters.length - 1) {
        await renderChapter(R.ch + 1); this.words = []; this.i = 0; this.loadFlow(0);
        if (!this.words.length) { this.pause(); return; }
      } else if (R.kind === 'pdf' && this.loadingMore) { this.t = setTimeout(() => this.tick(), 300); return; }
      else { this.pause(); rsEl.ctx.textContent = 'You reached the end.'; return; }
    } else this.i++;
    this.show();
    this.t = setTimeout(() => this.tick(), this.delay(this.words[this.i]));
  },
  jumpSentence(dir) {
    const W = this.words; let i = this.i;
    const endRe = /[.!?…]["”’')\]]*$/;
    if (dir < 0) { i = Math.max(0, i - 2); while (i > 0 && !endRe.test(W[i - 1].w)) i--; }
    else { while (i < W.length - 1 && !endRe.test(W[i].w)) i++; i = Math.min(W.length - 1, i + 1); }
    this.i = i; this.show();
  },
  speed(d) { setS('wpm', clamp(S.wpm + d, 150, 800)); this.show(); },
  close(silent) {
    if (!this.on) return;
    clearTimeout(this.t); this.on = false; this.playing = false; rsEl.box.hidden = true;
    const wd = this.words[this.i];
    if (!silent && wd) {
      if (R.kind === 'flow' && wd.b != null) { goToBlock(wd.b); if (S.spot) { Spot.set(wd.b); Spot.lockUntil = Date.now() + 600; } }
      else if (wd.page != null) PV.goto(wd.page, 0);
    }
    if (!Session.active && !R.deep) Wake.off();
    Ruler.sync();
    (R.kind === 'flow' ? el.flow : el.pdfview).focus({ preventScroll: true });
  }
};

/* ---- Auto-scroll ---- */
const Auto = {
  on: false, paused: false, raf: 0, last: 0, acc: 0, turning: false,
  target() { return R.kind === 'flow' ? el.flow : el.pdfview; },
  start() {
    if (!R.open) return;
    if (R.kind === 'flow' && isPaged()) { setS('mode', 'scroll'); toast('Switched to scrolling for auto-scroll'); }
    if (typeof Speak !== 'undefined') Speak.stop(true);
    this.on = true; this.paused = false; this.acc = 0; this.last = performance.now();
    $('#autoPill').hidden = false; this.label();
    cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(this.loop);
    if (Panel.kind) Panel.close();
    Chrome.hide();
  },
  loop: t => {
    const A = Auto; if (!A.on) return;
    const dt = Math.min(0.1, (t - A.last) / 1000); A.last = t;
    if (!A.paused && !A.turning && !Panel.kind) {
      const tg = A.target();
      A.acc += S.scrollSpeed * dt; const px = Math.floor(A.acc);
      if (px >= 1) { tg.scrollTop += px; A.acc -= px; touch(); }
      if (tg.scrollTop + tg.clientHeight >= tg.scrollHeight - 2) {
        if (R.kind === 'flow' && R.ch < R.doc.chapters.length - 1) { A.turning = true; setTimeout(async () => { if (A.on) await renderChapter(R.ch + 1); A.turning = false; }, 1400); }
        else { A.stop(); toast('Auto-scroll reached the end'); return; }
      }
    }
    A.raf = requestAnimationFrame(A.loop);
  },
  toggle() { this.paused = !this.paused; this.label(); },
  label() { $('#autoLbl').textContent = (this.paused ? 'Paused · ' : 'Auto-scroll · ') + 'speed ' + speedLevel(S.scrollSpeed); const b = $('#autoPlayBtn'); b.innerHTML = this.paused ? ICON.play : ICON.pause; b.setAttribute('aria-label', this.paused ? 'Resume' : 'Pause'); },
  faster(d) { const k = clamp(speedLevel(S.scrollSpeed) - 1 + d, 0, SPEEDS.length - 1); setS('scrollSpeed', SPEEDS[k]); this.label(); },
  stop() { if (!this.on) return; this.on = false; cancelAnimationFrame(this.raf); $('#autoPill').hidden = true; if (Panel.kind === 'focus') Panel.refresh(); }
};

/* ---- Screen wake lock ---- */
const Wake = {
  lock: null, want: false,
  async on() { this.want = true; try { if ('wakeLock' in navigator && !this.lock) { this.lock = await navigator.wakeLock.request('screen'); this.lock.addEventListener('release', () => { this.lock = null; }); } } catch (e) { this.lock = null; } },
  off() { this.want = false; try { if (this.lock) this.lock.release(); } catch (e) { /* released */ } this.lock = null; }
};

/* ---- Deep focus ---- */
const Deep = {
  ct: null, leaving: false,
  enter() {
    if (!R.open || R.deep) return;
    R.deep = true; Panel.close(); hideTool();
    el.reader.classList.add('deep'); $('#deepExit').hidden = false;
    try { const de = document.documentElement; if (!document.fullscreenElement && de.requestFullscreen) { const p = de.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* fullscreen not allowed here */ }
    Wake.on(); this.arm();
    toast(isCoarse() ? 'Deep focus. Tap “Exit deep focus” to come back.' : 'Deep focus. Press Esc to come back.', 2600);
  },
  exit() {
    if (!R.deep) return;
    R.deep = false; this.leaving = true;
    el.reader.classList.remove('deep', 'cursor-off'); $('#deepExit').hidden = true; clearTimeout(this.ct);
    try { if (document.fullscreenElement && document.exitFullscreen) { const p = document.exitFullscreen(); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* not in fullscreen */ }
    setTimeout(() => { this.leaving = false; }, 300);
    if (!Session.active && !Rsvp.on) Wake.off();
    Chrome.show();
  },
  arm() { clearTimeout(this.ct); el.reader.classList.remove('cursor-off'); if (R.deep) this.ct = setTimeout(() => el.reader.classList.add('cursor-off'), 1800); }
};
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && R.deep && !Deep.leaving) Deep.exit(); });

/* ---- Soundscapes: generated on the device, or the reader's own audio files ---- */
const SOUNDS = [['off', 'Off'], ['jazz', 'Late-night trumpet'], ['piano', 'Slow piano'], ['guitar', 'Nylon guitar'], ['rain', 'Rain'], ['brown', 'Brown noise'], ['ocean', 'Ocean'], ['fan', 'Fan'], ['fire', 'Bonfire'], ['candle', 'Candlelight'], ['heart', 'Heartbeat'], ['velvet', 'Velvet']];
const Sound = {
  ctx: null, gain: null, an: null, nodes: [], srcs: [], audio: null, audioUrl: null, fadeT: null, token: 0,
  out() { const ctx = this.ctx; if (!this.an || this.an.context !== ctx) { this.an = ctx.createAnalyser(); this.an.fftSize = 512; this.an.smoothingTimeConstant = 0.6; this.an.connect(ctx.destination); } return this.an; },
  ensureCtx() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { this.ctx = this.ctx || new AC(); if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { return null; }
    return this.ctx;
  },
  loopBuffer(ctx, secs, fill) {
    const sr = ctx.sampleRate, len = Math.floor(sr * secs), X = Math.floor(sr * 0.6);
    const buf = ctx.createBuffer(2, len - X, sr);
    for (let c = 0; c < 2; c++) {
      const a = new Float32Array(len); fill(a, sr);
      const out = buf.getChannelData(c), L = len - X;
      for (let i = 0; i < L; i++) out[i] = i < X ? a[i] * (i / X) + a[L + i] * (1 - i / X) : a[i];
    }
    return buf;
  },
  brown(a) { let last = 0; for (let i = 0; i < a.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; a[i] = last * 3.5; } },
  pink(a) { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < a.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; a[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; } },
  crackle(a, sr, rate = 9) {
    // Sparse pops and snaps with fast decays, like burning wood
    const pops = [];
    for (let i = 0; i < a.length; i++) {
      if (Math.random() < rate / sr) { const big = Math.random() < 0.12; pops.push({ amp: (big ? 0.55 : 0.12) + Math.random() * (big ? 0.4 : 0.3), tau: (big ? 0.004 : 0.0012) + Math.random() * (big ? 0.012 : 0.004), t: 0 }); if (Math.random() < 0.3) pops.push({ amp: 0.08 + Math.random() * 0.15, tau: 0.001 + Math.random() * 0.003, t: -Math.floor(sr * (0.01 + Math.random() * 0.05)) }); }
      let v = 0;
      for (let k = pops.length - 1; k >= 0; k--) { const p = pops[k]; p.t++; if (p.t <= 0) continue; const env = p.amp * Math.exp(-(p.t / sr) / p.tau); if (env < 0.001) { pops.splice(k, 1); continue; } v += env * (Math.random() * 2 - 1); }
      a[i] = v;
    }
  },
  layer(buf, chainFn, gainV) {
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    let node = src; const add = n => { node.connect(n); node = n; this.nodes.push(n); };
    chainFn(add, ctx);
    const g = ctx.createGain(); g.gain.value = gainV; node.connect(g); g.connect(this.gain); this.nodes.push(g);
    src.start(); this.srcs.push(src);
  },
  lp(f) { return (add, ctx) => { const n = ctx.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = f; add(n); }; },
  async play(kind) {
    this.stop();
    if (!kind || kind === 'off') return;
    const token = ++this.token;
    if (kind.startsWith('custom:')) return this.playCustom(kind.slice(7), token);
    const ctx = this.ensureCtx();
    if (!ctx) { toast('This browser cannot play generated sound.'); return; }
    try {
      this.gain = ctx.createGain(); this.gain.gain.value = 0; this.gain.connect(this.out());
      if (kind === 'rain') this.layer(this.loopBuffer(ctx, 9, a => this.pink(a)), (add, c) => { const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400; add(hp); this.lp(7000)(add, c); }, 1);
      else if (kind === 'brown') this.layer(this.loopBuffer(ctx, 9, a => this.brown(a)), this.lp(900), 1);
      else if (kind === 'fan') this.layer(this.loopBuffer(ctx, 9, a => { for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * 0.5; }), (add, c) => { this.lp(650)(add, c); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70; add(hp); }, 0.7);
      else if (kind === 'ocean') this.layer(this.loopBuffer(ctx, 9, a => this.brown(a)), (add, c) => {
        this.lp(1100)(add, c); const sw = c.createGain(); sw.gain.value = 0.55; add(sw);
        const lfo = c.createOscillator(); lfo.frequency.value = 0.085; const lg = c.createGain(); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(sw.gain); lfo.start(); this.nodes.push(lfo, lg);
      }, 1);
      else if (kind === 'fire') {
        this.layer(this.loopBuffer(ctx, 11, a => this.brown(a)), (add, c) => {
          this.lp(380)(add, c); const sw = c.createGain(); sw.gain.value = 0.8; add(sw);
          const lfo = c.createOscillator(); lfo.frequency.value = 0.23; const lg = c.createGain(); lg.gain.value = 0.2; lfo.connect(lg); lg.connect(sw.gain); lfo.start(); this.nodes.push(lfo, lg);
        }, 0.9);
        this.layer(this.loopBuffer(ctx, 13, (a, sr) => this.crackle(a, sr)), (add, c) => { const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; add(hp); this.lp(9000)(add, c); }, 0.9);
        this.layer(this.loopBuffer(ctx, 9, a => this.pink(a)), (add, c) => { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.6; add(bp); }, 0.12);
      }
      else if (kind === 'jazz' || kind === 'piano' || kind === 'guitar') Music.start(kind, ctx, this.gain);
      else if (kind === 'candle') {
        this.layer(this.loopBuffer(ctx, 11, a => this.brown(a)), (add, c) => {
          this.lp(320)(add, c); const sw = c.createGain(); sw.gain.value = 0.7; add(sw);
          const lfo = c.createOscillator(); lfo.frequency.value = 0.17; const lg = c.createGain(); lg.gain.value = 0.18; lfo.connect(lg); lg.connect(sw.gain); lfo.start(); this.nodes.push(lfo, lg);
        }, 0.8);
        this.layer(this.loopBuffer(ctx, 13, (a, sr) => this.crackle(a, sr, 2.4)), (add, c) => { const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400; add(hp); this.lp(7000)(add, c); }, 0.45);
      }
      else if (kind === 'heart') {
        const bpm = 62, per = 60 / bpm, sr = ctx.sampleRate, len = Math.round(per * 4 * sr);
        const buf = ctx.createBuffer(1, len, sr), a = buf.getChannelData(0);
        const thump = (t0, f0, f1, dur, amp) => { const s0 = Math.round(t0 * sr), n = Math.round(dur * sr); let ph = 0; for (let i = 0; i < n && s0 + i < len; i++) { const k = i / n, f = f0 + (f1 - f0) * k; ph += 2 * Math.PI * f / sr; const env = Math.min(1, i / (0.006 * sr)) * Math.exp(-k * 5); a[s0 + i] += Math.sin(ph) * env * amp; } };
        for (let b = 0; b < 4; b++) { const t0 = b * per + 0.02; thump(t0, 62, 40, 0.16, 0.95); thump(t0 + 0.3, 74, 50, 0.12, 0.6); }
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; const g = ctx.createGain(); g.gain.value = 1.4;
        src.connect(lp); lp.connect(g); g.connect(this.gain); this.nodes.push(lp, g); this.srcs.push(src);
        this.heartT0 = ctx.currentTime + 0.05; this.heartPer = per; src.start(this.heartT0);
        this.layer(this.loopBuffer(ctx, 9, a2 => this.pink(a2)), this.lp(500), 0.12);
      }
      else if (kind === 'velvet') {
        // A slow, warm pad: four soft chords through a filter and a generated room reverb
        const rev = ctx.createConvolver(); const ir = ctx.createBuffer(2, Math.round(ctx.sampleRate * 3), ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6); }
        rev.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.5; rev.connect(wet); wet.connect(this.gain); this.nodes.push(rev, wet);
        const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 900; flt.Q.value = 0.6;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06; const lg = ctx.createGain(); lg.gain.value = 320; lfo.connect(lg); lg.connect(flt.frequency); lfo.start();
        const dry = ctx.createGain(); dry.gain.value = 0.75; flt.connect(dry); dry.connect(this.gain); flt.connect(rev); this.nodes.push(flt, lfo, lg, dry);
        const chords = [[110, 164.81, 196, 246.94], [87.31, 130.81, 220, 329.63], [130.81, 196, 246.94, 329.63], [82.41, 164.81, 196, 293.66]];
        const voices = chords[0].map((f, i) => [-6, 6].map(det => { const o = ctx.createOscillator(); o.type = i === 0 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = det; const vg = ctx.createGain(); vg.gain.value = i === 0 ? 0.11 : 0.035; o.connect(vg); vg.connect(flt); o.start(); this.nodes.push(o, vg); return o; }));
        let ci = 0;
        this.chordT = setInterval(() => { if (!this.ctx) return; ci = (ci + 1) % chords.length; const t = this.ctx.currentTime; voices.forEach((pair, i) => pair.forEach(o => o.frequency.setTargetAtTime(chords[ci][i], t, 1.2))); }, 8000);
      }
      if (token !== this.token) return;
      this.gain.gain.linearRampToValueAtTime(this.level(), ctx.currentTime + 1.5);
    } catch (e) { toast('Sound could not start here.'); }
  },
  async playCustom(id, token) {
    const meta = allCustomSounds().find(x => x.id === id);
    if (!meta) { setS('sound', 'off'); return; }
    let blob = memFiles.get('snd:' + id);
    if (!blob) { try { blob = await DB.getFile('snd:' + id); } catch (e) { blob = null; } }
    if (token !== this.token) return;
    if (!blob) { toast('That sound is no longer saved in this browser. Add it again.'); return; }
    const url = URL.createObjectURL(blob);
    const au = new Audio(); au.loop = true; au.preload = 'auto'; au.volume = 0; au.src = url;
    this.audio = au; this.audioUrl = url;
    try { await au.play(); }
    catch (e) {
      if (token !== this.token) return;
      URL.revokeObjectURL(url); this.audio = null; this.audioUrl = null;
      if (blob.size <= 60 * 1024 * 1024) return this.playDecoded(blob, token);
      toast('This browser could not play that file. Try an MP3 or M4A version.', 5000); return;
    }
    if (token !== this.token) { au.pause(); return; }
    this.fadeTo(this.level());
  },
  async playDecoded(blob, token) {
    const ctx = this.ensureCtx(); if (!ctx) return;
    try {
      const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
      if (token !== this.token) return;
      this.gain = ctx.createGain(); this.gain.gain.value = 0; this.gain.connect(this.out());
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(this.gain); src.start(); this.srcs.push(src);
      this.gain.gain.linearRampToValueAtTime(this.level(), ctx.currentTime + 1.2);
    } catch (e) { toast('This browser could not play that file. Try an MP3 or M4A version.', 5000); }
  },
  fadeTo(v) {
    const au = this.audio; if (!au) return; clearInterval(this.fadeT);
    const step = (v - au.volume) / 12; let n = 0;
    this.fadeT = setInterval(() => { n++; try { au.volume = clamp(au.volume + step, 0, 1); } catch (e) { /* fixed volume device */ } if (n >= 12) { clearInterval(this.fadeT); try { au.volume = clamp(v, 0, 1); } catch (e) { /* fixed */ } } }, 60);
  },
  level() { return clamp(Math.pow(S.vol, 1.6), 0, 1); },
  setVol() {
    if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.1);
    if (this.audio) { clearInterval(this.fadeT); try { this.audio.volume = this.level(); } catch (e) { /* fixed */ } }
  },
  stop() {
    this.token++; clearInterval(this.chordT); this.heartT0 = null; if (typeof Music !== 'undefined' && Music.on) Music.stop();
    const srcs = this.srcs, nodes = this.nodes, g = this.gain, au = this.audio, url = this.audioUrl;
    this.srcs = []; this.nodes = []; this.gain = null; this.audio = null; this.audioUrl = null; clearInterval(this.fadeT);
    if (g && this.ctx) { try { g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25); } catch (e) { /* closed */ } setTimeout(() => { srcs.concat(nodes).forEach(n => { try { n.stop && n.stop(); } catch (e) { /* stopped */ } }); try { g.disconnect(); } catch (e) { /* gone */ } }, 900); }
    if (au) { let v = au.volume; const t = setInterval(() => { v -= 0.08; if (v <= 0) { clearInterval(t); au.pause(); au.removeAttribute('src'); try { au.load(); } catch (e) { /* gone */ } if (url) URL.revokeObjectURL(url); } else { try { au.volume = v; } catch (e) { clearInterval(t); au.pause(); } } }, 50); }
  },
  chime() {
    const ctx = this.ensureCtx(); if (!ctx) return;
    try {
      [[659.25, 0], [987.77, 0.18]].forEach(([f, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + d; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 2.3);
      });
    } catch (e) { /* sound unavailable */ }
  }
};
const privateSoundsOn = () => !!(typeof Vault !== 'undefined' && Vault.key);
const allCustomSounds = () => (S.customSounds || []).concat(privateSoundsOn() ? Vault.sounds : []);
async function addCustomSound(file) {
  if (!file) return;
  const okType = /^audio\//.test(file.type) || /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|weba)$/i.test(file.name);
  if (!okType) { toast('Choose an audio file, such as MP3, M4A, WAV or OGG.'); return; }
  if (file.size > 300 * 1024 * 1024) { toast('That file is larger than 300 MB. Choose a shorter or smaller file.'); return; }
  const priv = privateSoundsOn() && (Vault.view || !!(R.meta && R.meta.private));
  const list = priv ? Vault.sounds : (S.customSounds || []);
  if (list.length >= 8) { toast('You can keep up to 8 of your own sounds here. Remove one first.'); return; }
  const id = uid(priv ? 'p' : 's');
  const ok = await DB.putFile('snd:' + id, file, priv);
  if (!ok || !DB.db) memFiles.set('snd:' + id, file);
  const name = baseName(file.name).slice(0, 40) || 'My sound';
  if (priv) { Vault.sounds = Vault.sounds.concat([{ id, name, size: file.size, private: true }]); await Vault.saveSounds(); }
  else { S.customSounds = (S.customSounds || []).concat([{ id, name, size: file.size }]); saveSettings(); }
  setS('sound', 'custom:' + id); Sound.play('custom:' + id);
  if (Panel.kind === 'focus') Panel.refresh();
  toast(priv ? `Playing “${name}” on repeat. It is saved in Private.` : `Playing “${name}” on repeat`);
}
async function removeCustomSound(id) {
  if (S.sound === 'custom:' + id) { setS('sound', 'off'); Sound.stop(); }
  if (privateSoundsOn() && Vault.sounds.some(x => x.id === id)) { Vault.sounds = Vault.sounds.filter(x => x.id !== id); await Vault.saveSounds(); }
  else { S.customSounds = (S.customSounds || []).filter(x => x.id !== id); saveSettings(); }
  memFiles.delete('snd:' + id); await DB.delFile('snd:' + id);
  if (Panel.kind === 'focus') Panel.refresh();
  if (typeof SndUI !== 'undefined') SndUI.update();
}

/* ---- Paper sound for page turns (synthesized) ---- */
const PageSound = {
  buf: null,
  play(dir) {
    const ctx = Sound.ensureCtx(); if (!ctx) return;
    try {
      if (!this.buf || this.buf.sampleRate !== ctx.sampleRate) {
        const sr = ctx.sampleRate, len = Math.floor(sr * 0.7), b = ctx.createBuffer(1, len, sr), a = b.getChannelData(0);
        let hold = 0, next = 0;
        for (let i = 0; i < len; i++) {
          if (i >= next) { hold = 0.35 + Math.random() * 0.65; next = i + Math.floor(sr * (0.004 + Math.random() * 0.012)); }
          a[i] = (Math.random() * 2 - 1) * hold;
        }
        this.buf = b;
      }
      const t = ctx.currentTime, v = 0.55;
      const src = ctx.createBufferSource(); src.buffer = this.buf; src.playbackRate.value = 0.9 + Math.random() * 0.2;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
      bp.frequency.setValueAtTime(dir > 0 ? 3600 : 3000, t); bp.frequency.exponentialRampToValueAtTime(900, t + 0.42);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.24); g.gain.exponentialRampToValueAtTime(0.42 * v, t + 0.36); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
      src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ctx.destination);
      src.start(t); src.stop(t + 0.66);
    } catch (e) { /* sound unavailable */ }
  }
};

/* ---- Focus session ---- */
const Session = {
  active: false, end: 0, start: 0, dur: 0, startProg: 0, leaves: 0, iv: null, title: '',
  begin(min) {
    if (!R.open) return;
    this.active = true; this.dur = min * 60000; this.start = Date.now(); this.end = this.start + this.dur;
    this.startProg = bookProgress(); this.leaves = 0; this.title = R.meta.title;
    $('#sessionLine').hidden = false;
    clearInterval(this.iv); this.iv = setInterval(() => this.tick(), 1000); this.tick();
    Panel.close(); Wake.on();
    if (S.sessionDeep) Deep.enter(); else toast(`Focus session started · ${min} min`);
  },
  tick() {
    const left = this.end - Date.now();
    $('#sessionLine i').style.width = (clamp(1 - left / this.dur, 0, 1) * 100) + '%';
    const st = $('#sessTime'); if (st) st.textContent = fmtClock(left);
    if (left <= 0) this.finish();
  },
  cancel() { clearInterval(this.iv); this.active = false; $('#sessionLine').hidden = true; if (!R.deep && !Rsvp.on) Wake.off(); },
  finish() {
    const mins = Math.max(1, Math.round((Math.min(Date.now(), this.end) - this.start) / 60000));
    const gained = R.open ? Math.max(0, Math.round((bookProgress() - this.startProg) * 1000) / 10) : 0;
    const leaves = this.leaves;
    this.cancel(); Deep.exit(); Rsvp.pause && Rsvp.on && Rsvp.pause(); Auto.stop();
    Sound.chime();
    showModal(`<h2>Session complete</h2><p>${leaves === 0 ? 'You stayed with the page the whole time.' : leaves === 1 ? 'You left the page once.' : `You left the page ${leaves} times.`}</p>
      <div class="stat-row"><div><b>${mins}</b><span>minutes</span></div><div><b>${gained}%</b><span>of the book</span></div><div><b>${leaves}</b><span>times away</span></div></div>
      <div class="pbtns"><button class="btn primary" data-act="breakStart">Take a 5-minute break</button><button class="btn quiet" data-act="modalClose">Keep reading</button></div>`);
  }
};
let breakIv = null;
function startBreak() {
  let left = 300;
  const draw = () => showModal(`<h2>Break</h2><p>Stand up, look at something far away, and let your eyes rest.</p><div class="session-time" style="font-size:48px;margin:6px 0">${fmtClock(left * 1000)}</div><div class="pbtns"><button class="btn quiet" data-act="breakSkip">End break</button></div>`);
  draw(); clearInterval(breakIv);
  breakIv = setInterval(() => { left--; if (left <= 0) { clearInterval(breakIv); Sound.chime(); showModal(`<h2>Break is over</h2><p>Ready for another session?</p><div class="pbtns"><button class="btn primary" data-act="newSession">Start ${S.sessionMin}-minute session</button><button class="btn quiet" data-act="modalClose">Not now</button></div>`); } else { const t = $('#modal .session-time'); if (t) t.textContent = fmtClock(left * 1000); } }, 1000);
}
function showModal(html) { const m = $('#modal'); m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; setTimeout(() => { const b = $('#modal button'); if (b) b.focus(); }, 30); }
function closeModal() { clearInterval(breakIv); $('#modal').hidden = true; $('#modal').innerHTML = ''; }

/* ---- Eye breaks ---- */
const EyeBreak = {
  acc: 0, iv: null,
  count() { if (!S.eyeBreaks || $('#eyeBreak').hidden === false) return; this.acc++; if (this.acc >= 1200) { this.acc = 0; this.show(); } },
  show() {
    const box = $('#eyeBreak'); let left = 20;
    const draw = () => { box.innerHTML = `<div class="cnt">${left}</div><p>Eye break. Look at something about 6 m (20 ft) away until the count ends.</p><button class="btn quiet sm" data-act="eyeSkip">Skip</button>`; };
    draw(); box.hidden = false; clearInterval(this.iv);
    this.iv = setInterval(() => { left--; if (left <= 0) this.hide(); else { const c = $('#eyeBreak .cnt'); if (c) c.textContent = left; } }, 1000);
  },
  hide() { clearInterval(this.iv); $('#eyeBreak').hidden = true; }
};

/* ---- Toast ---- */
let toastT = null;
function toast(msg, ms = 2400) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(hideToast, ms); }
function hideToast() { $('#toast').classList.remove('on'); }

/* ================= Generative mood music: trumpet, piano, guitar =================
   A small lookahead scheduler plays endless, never-repeating music made of synthesized
   instruments: an FM electric piano, a Karplus-Strong nylon guitar, a muted trumpet,
   upright bass and brushed drums. Everything goes into Sound.gain, so volume, fades and
   the widget's level meter work the same way as the other soundscapes. */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const pick = a => a[Math.floor(Math.random() * a.length)];
const Music = {
  on: false, kind: null, ctx: null, dest: null, timer: null, next: 0, step: 0, events: [], ks: new Map(), bus: null, rev: null,
  start(kind, ctx, dest) {
    this.stop();
    this.on = true; this.kind = kind; this.ctx = ctx; this.dest = dest; this.step = 0; this.events = []; this.phrase = null;
    const trim = ctx.createGain(); trim.gain.value = kind === 'jazz' ? 1 : 3.4; trim.connect(dest); dest = trim; this.trim = trim;
    const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(dest);
    const rev = ctx.createConvolver(), secs = kind === 'guitar' ? 2.2 : 2.8, len = Math.round(ctx.sampleRate * secs);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (i < 200 ? i / 200 : 1); }
    rev.buffer = ir; const wet = ctx.createGain(); wet.gain.value = kind === 'jazz' ? 0.32 : 0.28; rev.connect(wet); wet.connect(dest);
    this.bus = bus; this.rev = rev; this.wet = wet;
    this.bpm = kind === 'jazz' ? 64 : kind === 'piano' ? 58 : 76;
    this.next = ctx.currentTime + 0.2;
    this.timer = setInterval(() => this.schedule(), 80);
    this.schedule();
  },
  stop() {
    clearInterval(this.timer); this.timer = null; this.on = false;
    const b = this.bus, w = this.wet, tr = this.trim; this.bus = null; this.rev = null; this.wet = null; this.trim = null;
    setTimeout(() => { try { b && b.disconnect(); w && w.disconnect(); tr && tr.disconnect(); } catch (e) { /* gone */ } }, 1500);
  },
  schedule() {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx, spb = 60 / this.bpm, eighth = spb / 2;
    if (this.next < ctx.currentTime - 0.05) this.next = ctx.currentTime + 0.05; // tab was asleep: rejoin, don't burst
    const ahead = document.hidden ? 2.2 : 0.4; // background tabs tick about once a second
    while (this.next < ctx.currentTime + ahead) {
      const st = this.step, odd = st % 2 === 1;
      const t = this.next + (odd ? eighth * 0.32 : 0); // swing the off-beats
      try { this[this.kind](st, t, spb); } catch (e) { /* skip a beat rather than stop */ }
      this.next += eighth; this.step++;
    }
    const now = ctx.currentTime; this.events = this.events.filter(e => e.t + e.d > now - 0.5);
  },
  log(t, m, d, inst, v) { this.events.push({ t, m, d, inst, v: v == null ? 1 : v }); },
  send(node, rv) { node.connect(this.bus); if (rv) { const s = this.ctx.createGain(); s.gain.value = rv; node.connect(s); s.connect(this.rev); } },

  /* ---- instruments ---- */
  ep(t, m, d, vel = 0.7, pan = 0) { // FM electric piano
    const ctx = this.ctx, f = mtof(m), dec = clamp(2.6 - (m - 48) * 0.035, 0.8, 2.8);
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), amp = ctx.createGain();
    car.frequency.value = f; mod.frequency.value = f; car.detune.value = rnd(-4, 4);
    mg.gain.setValueAtTime(f * 2.2 * vel, t); mg.gain.exponentialRampToValueAtTime(f * 0.25, t + 0.9);
    mod.connect(mg); mg.connect(car.frequency);
    amp.gain.setValueAtTime(0.0001, t); amp.gain.exponentialRampToValueAtTime(0.11 * vel, t + 0.006); amp.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(d, 0.4) + dec);
    const bell = ctx.createOscillator(), bg = ctx.createGain(); bell.frequency.value = f * 4.01; bg.gain.setValueAtTime(0.018 * vel, t); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    bell.connect(bg); bg.connect(amp);
    let out = amp; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; amp.connect(p); out = p; }
    car.connect(amp); this.send(out, 0.55);
    const end = t + Math.max(d, 0.4) + dec + 0.1;
    [car, mod, bell].forEach(o => { o.start(t); o.stop(end); });
    this.log(t, m, Math.max(d, 0.5), 'ep', vel);
  },
  bass(t, m, d, vel = 0.8) { // upright bass: soft sine/triangle pluck
    const ctx = this.ctx, f = mtof(m);
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 3;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(260, t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * vel, t + 0.012); g.gain.exponentialRampToValueAtTime(0.12 * vel, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.25);
    o.connect(lp); o2.connect(lp); lp.connect(g); this.send(g, 0.08);
    [o, o2].forEach(x => { x.start(t); x.stop(t + d + 0.3); });
    this.log(t, m, d, 'bass', vel);
  },
  brush(t, len, vel) { // brushed snare swish or tap
    const ctx = this.ctx, n = Math.round(ctx.sampleRate * len), b = ctx.createBuffer(1, n, ctx.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) { const k = i / n; a[i] = (Math.random() * 2 - 1) * (len > 0.1 ? Math.sin(Math.PI * k) * (1 - k * 0.5) : Math.pow(1 - k, 4)); }
    const s = ctx.createBufferSource(); s.buffer = b; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = len > 0.1 ? 2600 : 4200; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = vel; s.connect(bp); bp.connect(g); this.send(g, 0.15); s.start(t);
  },
  trumpet(t, m, d, vel = 0.8) { // muted trumpet: bright saw through a harmon-mute style filter
    const ctx = this.ctx, f = mtof(m);
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(); o.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = 5;
    o.frequency.setValueAtTime(f * 0.982, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    o2.frequency.setValueAtTime(f * 0.982, t); o2.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.3; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0, t + Math.min(0.35, d * 0.5)); vg.gain.linearRampToValueAtTime(f * 0.009, t + Math.min(0.8, d)); vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const og = ctx.createGain(); og.gain.value = 0.25; o2.connect(og);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2; lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(2300 * vel + 500, t + 0.09); lp.frequency.linearRampToValueAtTime(1700, t + d);
    const pk1 = ctx.createBiquadFilter(); pk1.type = 'peaking'; pk1.frequency.value = 1350; pk1.Q.value = 2.2; pk1.gain.value = 9;
    const pk2 = ctx.createBiquadFilter(); pk2.type = 'peaking'; pk2.frequency.value = 2700; pk2.Q.value = 3; pk2.gain.value = 6;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
    const amp = ctx.createGain(); const rel = 0.22;
    amp.gain.setValueAtTime(0.0001, t); amp.gain.exponentialRampToValueAtTime(0.06 * vel, t + 0.09); amp.gain.setValueAtTime(0.06 * vel, t + Math.max(0.1, d - rel)); amp.gain.exponentialRampToValueAtTime(0.0001, t + d + rel);
    o.connect(lp); og.connect(lp); lp.connect(pk1); pk1.connect(pk2); pk2.connect(hp); hp.connect(amp);
    const n = Math.round(ctx.sampleRate * 0.25), nb = ctx.createBuffer(1, n, ctx.sampleRate), na = nb.getChannelData(0); for (let i = 0; i < n; i++) na[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const ns = ctx.createBufferSource(); ns.buffer = nb; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1700; nf.Q.value = 1; const ng = ctx.createGain(); ng.gain.value = 0.012 * vel; ns.connect(nf); nf.connect(ng); ng.connect(amp); ns.start(t);
    let out = amp; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = 0.12; amp.connect(p); out = p; }
    this.send(out, 0.6);
    [o, o2, vib].forEach(x => { x.start(t); x.stop(t + d + rel + 0.05); });
    this.log(t, m, d, 'trumpet', vel);
  },
  ksBuf(m) { // Karplus-Strong plucked nylon string, cached per note
    if (this.ks.has(m)) return this.ks.get(m);
    const ctx = this.ctx, sr = ctx.sampleRate, f = mtof(m), N = Math.max(2, Math.round(sr / f)), len = Math.round(sr * 3.2);
    const buf = ctx.createBuffer(1, len, sr), a = buf.getChannelData(0), ring = new Float32Array(N);
    let prev = 0; for (let i = 0; i < N; i++) { const w = Math.random() * 2 - 1; prev = prev * 0.55 + w * 0.45; ring[i] = prev; }
    const decay = 0.9965 - Math.max(0, (m - 60)) * 0.00012;
    let idx = 0;
    for (let i = 0; i < len; i++) { const nxt = (idx + 1) % N; const v = (ring[idx] + ring[nxt]) * 0.5 * decay; a[i] = ring[idx]; ring[idx] = v; idx = nxt; }
    let peak = 0; for (let i = 0; i < 2000; i++) peak = Math.max(peak, Math.abs(a[i]));
    if (peak > 0) for (let i = 0; i < len; i++) a[i] /= peak;
    for (let i = len - 2000; i < len; i++) a[i] *= (len - i) / 2000;
    this.ks.set(m, buf); return buf;
  },
  pluck(t, m, vel = 0.7, pan = 0) {
    const ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = this.ksBuf(m);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400 + vel * 1600;
    const g = ctx.createGain(); g.gain.value = 0.16 * vel;
    s.connect(lp); lp.connect(g);
    let out = g; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    this.send(out, 0.35); s.start(t);
    this.log(t, m, 1.2, 'guitar', vel);
  },

  /* ---- arrangements (called once per swung eighth note) ---- */
  jazz(st, t, spb) {
    const bar = Math.floor(st / 8), e = st % 8;
    const prog = [{ r: 38, v: [53, 57, 60, 64], tones: [62, 65, 69, 72, 74] }, { r: 43, v: [53, 57, 59, 64], tones: [62, 65, 67, 71, 74] }, { r: 36, v: [52, 55, 59, 62], tones: [64, 67, 71, 72, 74] }, { r: 45, v: [55, 58, 61, 64], tones: [61, 64, 67, 69, 70] }];
    const ch = prog[bar % 4];
    // bass: two-feel with an approach note
    if (e === 0) this.bass(t, ch.r, spb * 1.8, 0.85);
    if (e === 4) this.bass(t, ch.r + 7, spb * 1.4, 0.7);
    if (e === 7 && Math.random() < 0.55) { const nr = prog[(bar + 1) % 4].r; this.bass(t, nr + (Math.random() < 0.5 ? 1 : -1), spb * 0.45, 0.5); }
    // brushes
    if (e === 2 || e === 6) this.brush(t, 0.22, 0.05);
    if (e % 2 === 1 && Math.random() < 0.7) this.brush(t, 0.04, 0.02);
    // electric piano comping, sparse and late
    if (e === 1 || (e === 5 && Math.random() < 0.5)) ch.v.forEach((m, i) => this.ep(t + i * 0.012, m, spb * (e === 1 ? 1.6 : 0.9), e === 1 ? 0.45 : 0.32, -0.25));
    // trumpet: phrases in alternating two-bar windows, answered by the piano
    if (e === 0 && bar % 4 === 0) this.phrase = this.makePhrase(ch);
    if (e === 0 && bar % 4 === 2) this.phrase = null;
    if (this.phrase) { const pos = (bar % 4) * 8 + e; const n = this.phrase.find(x => x.at === pos); if (n) this.trumpet(t, n.m, n.len * spb / 2, n.v); }
    else if (e === 3 && bar % 4 === 3 && Math.random() < 0.6) this.ep(t, pick(ch.tones) + 12, spb, 0.35, 0.25);
  },
  makePhrase(ch) {
    const scale = [60, 62, 64, 65, 67, 68, 69, 71, 72, 74, 76];
    const out = []; let pos = pick([0, 1, 2]), last = pick(ch.tones);
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count && pos < 15; i++) {
      const isLast = i === count - 1;
      const len = isLast ? Math.min(16 - pos, pick([4, 5, 6, 7])) : pick([1, 1, 2, 2, 3]);
      let m;
      if (pos % 4 === 0 || isLast) m = ch.tones.reduce((b, x) => Math.abs(x - last) < Math.abs(b - last) ? x : b, ch.tones[0]);
      else { const i0 = scale.findIndex(x => x >= last); m = scale[clamp(i0 + pick([-2, -1, 1, 1, 2]), 0, scale.length - 1)]; }
      out.push({ at: pos, m, len, v: 0.65 + Math.random() * 0.3 }); last = m; pos += len + (Math.random() < 0.25 ? 1 : 0);
    }
    return out;
  },
  piano(st, t, spb) {
    const bar = Math.floor(st / 8), e = st % 8;
    const prog = [{ r: 41, v: [52, 55, 57, 60], mel: [64, 67, 69, 72, 76] }, { r: 40, v: [50, 55, 59, 62], mel: [62, 64, 67, 71, 74] }, { r: 38, v: [53, 57, 60, 64], mel: [62, 65, 69, 72, 74] }, { r: 43, v: [53, 57, 60, 65], mel: [62, 65, 67, 69, 72] }];
    const ch = prog[bar % 4];
    if (e === 0) { this.ep(t, ch.r, spb * 3.5, 0.5, -0.3); ch.v.forEach((m, i) => this.ep(t + 0.03 + i * 0.045, m, spb * 3.2, 0.36, -0.1)); }
    if (e === 4 && Math.random() < 0.5) this.ep(t, ch.r + 7, spb * 1.5, 0.35, -0.3);
    const melAt = this.melPlan && this.melPlan[bar % 2] || [];
    if (e === 0 && bar % 2 === 0) this.melPlan = [this.melBar(), this.melBar()];
    if (melAt.includes(e)) this.ep(t, pick(ch.mel) + (Math.random() < 0.2 ? 12 : 0), spb * (e % 2 ? 0.8 : 1.6), 0.42 + Math.random() * 0.2, 0.25);
  },
  melBar() { const opts = [[2, 3, 6], [1, 4, 6], [2, 6], [3, 4, 5], [0, 2, 5, 7], [4, 6]]; return pick(opts); },
  guitar(st, t, spb) {
    const bar = Math.floor(st / 8), e = st % 8;
    const prog = [{ b: 45, c: [55, 60, 64, 71] }, { b: 50, c: [57, 60, 65, 69] }, { b: 43, c: [53, 59, 64, 69] }, { b: 48, c: [55, 59, 64, 67] }, { b: 41, c: [57, 60, 64, 69] }, { b: 47, c: [57, 62, 65, 69] }, { b: 40, c: [56, 62, 65, 68] }, { b: 45, c: [54, 60, 64, 69] }];
    const ch = prog[bar % 8];
    // bossa-style thumb and finger pattern
    if (e === 0) this.pluck(t, ch.b, 0.8, -0.2);
    if (e === 3) this.pluck(t, ch.b + 7, 0.6, -0.2);
    if (e === 4) this.pluck(t, ch.b + (Math.random() < 0.5 ? 7 : 12), 0.6, -0.2);
    const fingers = [2, 5, 7];
    if (fingers.includes(e) || (e === 6 && Math.random() < 0.3)) ch.c.forEach((m, i) => this.pluck(t + i * 0.014 + rnd(0, 0.006), m, 0.42 + Math.random() * 0.12, 0.1 + i * 0.06));
    if (bar % 2 === 1 && e === 6 && Math.random() < 0.7) { const top = ch.c[ch.c.length - 1] + pick([2, 3, 5, 7]); this.pluck(t, top, 0.55, 0.35); this.pluck(t + spb * 0.5, top - pick([1, 2, 3]), 0.5, 0.35); }
  }
};

/* ================= Ambience: the sound widget and the hyperfocus lamp ================= */
const SOUND_NAMES = { jazz: 'Late-night trumpet', piano: 'Slow piano', guitar: 'Nylon guitar', off: 'Sound off', rain: 'Rain', brown: 'Brown noise', ocean: 'Ocean', fan: 'Fan', fire: 'Bonfire', candle: 'Candlelight', heart: 'Heartbeat', velvet: 'Velvet' };
const SOUND_ICONS = {
  off: '<svg class="i" viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="7" rx="1.5"/><rect x="17" y="13" width="4" height="7" rx="1.5"/></svg>',
  rain: '<svg class="i" viewBox="0 0 24 24"><path d="M7 14a4.5 4.5 0 1 1 1.2-8.8A5.5 5.5 0 0 1 18.5 8 3.5 3.5 0 0 1 17.5 15H7"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5"/></svg>',
  brown: '<svg class="i" viewBox="0 0 24 24"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0 2 2 2 2"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity=".55"/></svg>',
  ocean: '<svg class="i" viewBox="0 0 24 24"><path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M8 10c1-4 6-6 9-3-3 0-4 2-4 4"/></svg>',
  fan: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.6"/><path d="M12 10.4C11 6 13 3 16 4s1 5-2.6 7M13.4 12.9c4.3 1.3 6 4.4 4 6.6s-5-1.4-5.2-5.2M10.6 12.4C6.4 14 3.4 12.3 4 9.4s5.4-1.6 6.6 1.4"/></svg>',
  fire: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-6 1-8.5z"/><path d="M5 21l14-3M5 18l14 3"/></svg>',
  jazz: '<svg class="i" viewBox="0 0 24 24"><path d="M3 15h9l6-5v10l-6-5"/><path d="M6 15v-3M8.5 15v-3M11 15v-3"/><path d="M18 10a3 5 0 0 1 0 10"/></svg>',
  piano: '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 5v14M12 5v14M16.5 5v14"/><path d="M6 5v7M10 5v7M14 5v7M18.5 5v7" stroke-width="2.6"/></svg>',
  guitar: '<svg class="i" viewBox="0 0 24 24"><path d="M14 10l6-6M18 3l3 3"/><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0c-.7.7-.6 1.9-1.6 2.3-1.5.6-3.2.9-3.4 2.7-.3 2.3 2.1 5 4.4 4.6 1.8-.3 2.1-2 2.6-3.4.4-1 1.6-.9 2.3-1.6a3.5 3.5 0 0 0 .7-4.6z"/><circle cx="9.8" cy="14.2" r="1.2"/></svg>',
  candle: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3c1.6 2 2.4 3.3 2.4 4.6a2.4 2.4 0 0 1-4.8 0C9.6 6.3 10.4 5 12 3z"/><path d="M12 10v2M8.5 12h7v9h-7z"/></svg>',
  heart: '<svg class="i" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/><path d="M4 13h4l1.5-2.5 2 5 1.5-2.5H20" opacity=".6"/></svg>',
  velvet: '<svg class="i" viewBox="0 0 24 24"><path d="M3 7c3-2 5 2 9 0s6-2 9 0M3 12c3-2 5 2 9 0s6-2 9 0M3 17c3-2 5 2 9 0s6-2 9 0"/></svg>',
  custom: '<svg class="i" viewBox="0 0 24 24"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>'
};

/* ---- Scene painters for the sound widget. Drawn in a 44-unit square, scaled to fit.
   p.bare = no background or frame (compact widget); p.dark = dark reading surface. ---- */
const rnd = (a, b) => a + Math.random() * (b - a);
function musicNow(inst) {
  if (typeof Music === 'undefined' || !Music.on || !Music.ctx) return null;
  const now = Music.ctx.currentTime; let best = null;
  for (const ev of Music.events) if (ev.inst === inst && ev.t <= now && now < ev.t + ev.d) if (!best || ev.t > best.t) best = ev;
  return best;
}
function musicNotes(c, arr, dt, col, w, h) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const n = arr[i]; n.life += dt; n.x += n.vx * dt; n.y += n.vy * dt; n.vy *= 0.99;
    if (n.life > 2.4 || n.x > w + 4) { arr.splice(i, 1); continue; }
    const a = Math.min(1, n.life * 5) * (1 - n.life / 2.4);
    c.fillStyle = c.strokeStyle = col + a + ')'; c.lineWidth = 0.8;
    c.beginPath(); c.ellipse(n.x, n.y, 1.5, 1.1, -0.4, 0, 7); c.fill();
    c.beginPath(); c.moveTo(n.x + 1.3, n.y); c.lineTo(n.x + 1.3, n.y - 5); if (n.kind) c.quadraticCurveTo(n.x + 3.5, n.y - 4, n.x + 3, n.y - 2); c.stroke();
  }
  if (arr.length > 14) arr.splice(0, arr.length - 14);
}

const Scenes = {
  rain(c, w, h, t, dt, st, e, p) {
    if (!st.drops) {
      st.drops = Array.from({ length: p.bare ? 26 : 34 }, () => ({ x: rnd(-6, w + 6), y: rnd(-h, h), z: rnd(0.35, 1) }));
      st.splash = []; st.clouds = [0, 1, 2].map(k => ({ x: rnd(0, w), r: rnd(8, 13), s: rnd(1.5, 4), k }));
    }
    const dropRGB = p.bare && !p.dark ? '58,98,150' : '200,222,245';
    if (!p.bare) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a2633'); g.addColorStop(0.6, '#2a3c50'); g.addColorStop(1, '#344a60'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    c.fillStyle = p.bare ? (p.dark ? 'rgba(170,190,215,.32)' : 'rgba(95,120,150,.32)') : 'rgba(160,185,210,.18)';
    st.clouds.forEach(cl => { cl.x += cl.s * dt; if (cl.x - cl.r * 2 > w) cl.x = -cl.r * 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(cl.x + i * cl.r * 0.9, 7 + Math.abs(i) * 3, cl.r * (i ? 0.75 : 1), 0, 7); c.fill(); } });
    const speed = 1 + e * 0.6;
    c.lineCap = 'round';
    for (const d of st.drops) {
      const v = (90 + 120 * d.z) * speed; d.y += v * dt; d.x -= v * 0.16 * dt;
      const len = 4 + 7 * d.z;
      if (d.y > h - 5) { if (d.z > 0.55) st.splash.push({ x: d.x, y: h - 5 + rnd(-1, 1), r: 0.5, a: 0.8 }); d.y = rnd(-20, 6); d.x = rnd(0, w + 12); }
      c.strokeStyle = `rgba(${dropRGB},${0.3 + 0.55 * d.z})`; c.lineWidth = 0.55 + 0.8 * d.z;
      c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + len * 0.16, d.y - len); c.stroke();
    }
    if (!p.bare) { c.fillStyle = 'rgba(120,150,185,.35)'; c.fillRect(0, h - 4, w, 4); }
    for (let i = st.splash.length - 1; i >= 0; i--) {
      const s = st.splash[i]; s.r += 14 * dt; s.a -= 1.9 * dt;
      if (s.a <= 0) { st.splash.splice(i, 1); continue; }
      c.strokeStyle = `rgba(${dropRGB},${s.a})`; c.lineWidth = 0.6;
      c.beginPath(); c.ellipse(s.x, s.y, s.r, s.r * 0.32, 0, 0, 7); c.stroke();
    }
  },
  fire(c, w, h, t, dt, st, e, p) {
    if (!st.p) { st.p = []; st.sparks = []; st.acc = 0; }
    const flick = 0.78 + 0.22 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1) + e * 0.2;
    if (!p.bare) {
      c.fillStyle = '#120a06'; c.fillRect(0, 0, w, h);
      const bg = c.createRadialGradient(w / 2, h * 0.78, 2, w / 2, h * 0.78, w * 0.8);
      bg.addColorStop(0, `rgba(255,120,40,${0.45 * flick})`); bg.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
    }
    const base = h * 0.8;
    c.save(); c.translate(w / 2, h * 0.86);
    [[-0.3, '#4a2e1b'], [0.3, '#36210f']].forEach(([a, col]) => { c.save(); c.rotate(a); c.fillStyle = col; c.beginPath(); if (c.roundRect) c.roundRect(-15, -3, 30, 6, 3); else c.rect(-15, -3, 30, 6); c.fill(); c.fillStyle = `rgba(255,120,45,${0.5 * flick})`; c.fillRect(-8, -3, 16, 1.3); c.restore(); });
    c.restore();
    // On light pages additive blending washes out, so flames are painted normally there.
    c.globalCompositeOperation = p.bare && !p.dark ? 'source-over' : 'lighter';
    const tongues = [[-6.5, 0.78, 0], [0, 1.18, 1.7], [6, 0.86, 3.1], [-2.8, 0.66, 4.4], [3.4, 0.7, 5.2]];
    for (const [dx, hk, ph] of tongues) {
      const n = Math.sin(t * 7.3 + ph) * 0.5 + Math.sin(t * 11.7 + ph * 1.7) * 0.3 + Math.sin(t * 3.1 + ph * 0.5) * 0.2;
      const fh = h * 0.42 * hk * (0.84 + 0.16 * n + 0.12 * e);
      const sway = Math.sin(t * 4.2 + ph) * 2.6 + Math.sin(t * 9 + ph) * 0.8;
      const wB = 5.4 * hk, x0 = w / 2 + dx, tipX = x0 + sway, tipY = base - fh;
      const g = c.createLinearGradient(0, base, 0, tipY);
      if (p.bare && !p.dark) { g.addColorStop(0, 'rgba(255,200,70,.95)'); g.addColorStop(0.3, 'rgba(250,130,20,.9)'); g.addColorStop(0.7, 'rgba(215,60,15,.6)'); g.addColorStop(1, 'rgba(180,35,10,0)'); }
      else { g.addColorStop(0, 'rgba(255,248,215,.95)'); g.addColorStop(0.22, 'rgba(255,205,95,.85)'); g.addColorStop(0.6, 'rgba(255,122,40,.55)'); g.addColorStop(1, 'rgba(200,50,20,0)'); }
      c.fillStyle = g; c.globalAlpha = p.bare && !p.dark ? 0.72 : 0.5;
      c.beginPath(); c.moveTo(x0 - wB, base);
      c.bezierCurveTo(x0 - wB * 1.15, base - fh * 0.42, tipX - wB * 0.35 + sway * 0.4, base - fh * 0.78, tipX, tipY);
      c.bezierCurveTo(tipX + wB * 0.35 + sway * 0.4, base - fh * 0.78, x0 + wB * 1.15, base - fh * 0.42, x0 + wB, base);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
    const core = c.createRadialGradient(w / 2, base - 3, 0, w / 2, base - 3, 9);
    core.addColorStop(0, p.bare && !p.dark ? `rgba(255,236,170,${0.85 * flick})` : `rgba(255,252,230,${0.75 * flick})`); core.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = core; c.beginPath(); c.arc(w / 2, base - 3, 9, 0, 7); c.fill();
    st.acc += dt * (26 + 30 * e);
    while (st.acc > 1) { st.acc--; st.p.push({ x: w / 2 + rnd(-6, 6), y: base - rnd(4, 10), vx: rnd(-3, 3), vy: -rnd(18, 32), r: rnd(1.6, 3.4), life: 0, max: rnd(0.35, 0.7) }); }
    if (Math.random() < dt * (4 + 6 * e)) st.sparks.push({ x: w / 2 + rnd(-6, 6), y: base - 10, vy: -rnd(14, 26), ph: rnd(0, 6), life: 0, max: rnd(0.9, 1.6) });
    for (let i = st.p.length - 1; i >= 0; i--) {
      const q = st.p[i]; q.life += dt; const k = q.life / q.max; if (k >= 1) { st.p.splice(i, 1); continue; }
      q.x += (q.vx + Math.sin(t * 6 + q.y * 0.3) * 5) * dt; q.y += q.vy * dt;
      c.fillStyle = `rgba(255,${190 - 90 * k | 0},70,${(1 - k) * 0.5})`; c.beginPath(); c.arc(q.x, q.y, q.r * (1 - k * 0.7), 0, 7); c.fill();
    }
    for (let i = st.sparks.length - 1; i >= 0; i--) {
      const s = st.sparks[i]; s.life += dt; const k = s.life / s.max; if (k >= 1 || s.y < -2) { st.sparks.splice(i, 1); continue; }
      s.y += s.vy * dt; const x = s.x + Math.sin(s.ph + s.life * 7) * 3;
      c.fillStyle = p.bare && !p.dark ? `rgba(230,${120 - 50 * k | 0},30,${1 - k})` : `rgba(255,${200 - 90 * k | 0},90,${1 - k})`; c.fillRect(x, s.y, 1.3, 1.3);
    }
    c.globalCompositeOperation = 'source-over';
  },
  ocean(c, w, h, t, dt, st, e, p) {
    if (!p.bare) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0e2333'); g.addColorStop(0.55, '#1b4357'); g.addColorStop(1, '#16394a');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    const mx = w * 0.7, my = h * 0.22;
    if (!p.bare || p.dark) {
      const mg = c.createRadialGradient(mx, my, 1, mx, my, 12); mg.addColorStop(0, 'rgba(250,240,210,.45)'); mg.addColorStop(1, 'rgba(250,240,210,0)');
      c.fillStyle = mg; c.beginPath(); c.arc(mx, my, 12, 0, 7); c.fill();
      c.fillStyle = '#f3ead0'; c.beginPath(); c.arc(mx, my, 4.2, 0, 7); c.fill();
    } else {
      c.fillStyle = 'rgba(214,170,60,.9)'; c.beginPath(); c.arc(mx, my, 4.4, 0, 7); c.fill();
      c.strokeStyle = 'rgba(214,170,60,.35)'; c.lineWidth = 0.8; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.3; c.beginPath(); c.moveTo(mx + Math.cos(a) * 6.2, my + Math.sin(a) * 6.2); c.lineTo(mx + Math.cos(a) * 8.4, my + Math.sin(a) * 8.4); c.stroke(); }
    }
    const swell = 1 + 0.5 * Math.sin(t * 0.55) + e * 0.4;
    const waves = p.bare && !p.dark
      ? [[0.5, 2.2, 0.16, 0.9, 'rgba(60,140,165,.45)'], [0.62, 2.8, 0.13, -1.2, 'rgba(40,120,150,.6)'], [0.76, 3.4, 0.11, 1.6, 'rgba(30,100,130,.8)']]
      : [[0.52, 2.2, 0.16, 0.9, '#1e5468'], [0.64, 2.8, 0.13, -1.2, '#236479'], [0.78, 3.4, 0.11, 1.6, '#2c7a8e']];
    const yAt = (x, base, amp, freq, sp) => h * base + Math.sin(x * freq + t * sp) * amp * swell + Math.sin(x * freq * 2.3 - t * sp * 0.7) * amp * 0.35;
    waves.forEach(([base, amp, freq, sp, col], k) => {
      c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 1.5) c.lineTo(x, yAt(x, base, amp, freq, sp));
      c.lineTo(w, h); c.closePath(); c.fillStyle = col; c.fill();
      if (k === 2) {
        c.strokeStyle = p.bare && !p.dark ? 'rgba(255,255,255,.85)' : 'rgba(235,248,250,.55)'; c.lineWidth = 0.9; c.beginPath();
        for (let x = 0; x <= w; x += 1.5) { const y = yAt(x, base, amp, freq, sp); x ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
      }
    });
  },
  fan(c, w, h, t, dt, st, e, p) {
    st.a = (st.a || 0) + dt * (11 + e * 3);
    const light = p.bare && !p.dark;
    if (!p.bare) { const bg = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.7); bg.addColorStop(0, '#2f383d'); bg.addColorStop(1, '#1a1f22'); c.fillStyle = bg; c.fillRect(0, 0, w, h); }
    const blade = light ? '70,92,104' : '190,212,220';
    c.save(); c.translate(w / 2, h / 2);
    for (let k = 5; k >= 0; k--) {
      c.save(); c.rotate(st.a - k * 0.09);
      c.fillStyle = `rgba(${blade},${k ? 0.1 : 0.85})`;
      for (let b = 0; b < 3; b++) { c.rotate(Math.PI * 2 / 3); c.beginPath(); c.ellipse(0, -9.5, 4.6, 9, 0.35, 0, 7); c.fill(); }
      c.restore();
    }
    c.fillStyle = light ? '#3d4a50' : '#56656c'; c.beginPath(); c.arc(0, 0, 3.4, 0, 7); c.fill();
    c.fillStyle = light ? '#9fb2ba' : '#9fb2ba'; c.beginPath(); c.arc(-0.8, -0.8, 1.2, 0, 7); c.fill();
    c.strokeStyle = light ? 'rgba(50,65,72,.35)' : 'rgba(255,255,255,.16)'; c.lineWidth = 0.7;
    [8, 13, 18, 21].forEach(r => { c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); });
    for (let s = 0; s < 12; s++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(4, 0); c.lineTo(21, 0); c.stroke(); }
    c.restore();
  },
  brown(c, w, h, t, dt, st, e, p) {
    const light = p.bare && !p.dark;
    if (!p.bare) { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2b1d14'); g.addColorStop(1, '#3d2a1c'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    const breathe = 0.75 + 0.25 * Math.sin(t * 0.9) + e * 0.3;
    c.globalCompositeOperation = light ? 'source-over' : 'lighter';
    const cols = light ? ['rgba(150,85,35,.85)', 'rgba(185,115,55,.6)', 'rgba(120,70,30,.45)', 'rgba(205,145,80,.4)'] : ['rgba(232,170,105,.6)', 'rgba(214,140,80,.45)', 'rgba(190,120,70,.36)', 'rgba(250,205,150,.28)'];
    cols.forEach((col, k) => {
      c.strokeStyle = col; c.lineWidth = 1.5 - k * 0.15; c.beginPath();
      for (let x = -2; x <= w + 2; x += 1.5) {
        const y = h / 2 + (Math.sin(x * 0.17 + t * (1.1 + k * 0.35) + k) * 6 + Math.sin(x * 0.41 - t * (0.8 + k * 0.2)) * 2.4 + Math.sin(x * 0.07 + t * 0.4 + k * 2) * 4) * breathe * (1 - Math.abs(x - w / 2) / (w * 0.75));
        x < 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    });
    c.globalCompositeOperation = 'source-over';
  },
  custom(c, w, h, t, dt, st, e, p) {
    if (!st.b) st.b = Array.from({ length: 9 }, () => ({ v: rnd(0.2, 0.6), tg: rnd(0.2, 1) }));
    const light = p.bare && !p.dark;
    if (!p.bare) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#16222b'); g.addColorStop(1, '#203540'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
    c.strokeStyle = light ? `rgba(40,120,100,${0.18 + 0.12 * pulse})` : `rgba(130,205,185,${0.14 + 0.1 * pulse})`; c.lineWidth = 1;
    c.beginPath(); c.arc(w / 2, h / 2, w * 0.38 + pulse * 2, 0, 7); c.stroke();
    const bw = 2.8, gap = 1.6, total = st.b.length * (bw + gap) - gap, x0 = (w - total) / 2;
    st.b.forEach((b, i) => {
      if (Math.random() < dt * 5) b.tg = rnd(0.15, 1) * (1 - Math.abs(i - 4) * 0.07);
      b.v += (b.tg - b.v) * Math.min(1, dt * 9);
      const bh = 4 + b.v * h * 0.55, x = x0 + i * (bw + gap);
      const gg = c.createLinearGradient(0, h / 2 - bh / 2, 0, h / 2 + bh / 2);
      if (light) { gg.addColorStop(0, '#3fa58c'); gg.addColorStop(1, '#1f6d5c'); } else { gg.addColorStop(0, '#b6eadb'); gg.addColorStop(1, '#4aa391'); }
      c.fillStyle = gg; c.beginPath(); if (c.roundRect) c.roundRect(x, h / 2 - bh / 2, bw, bh, 1.4); else c.rect(x, h / 2 - bh / 2, bw, bh); c.fill();
    });
  },
  candle(c, w, h, t, dt, st, e, p) {
    const light = p.bare && !p.dark;
    if (!p.bare) { c.fillStyle = '#160e0c'; c.fillRect(0, 0, w, h); }
    const n = Math.sin(t * 6.1) * 0.5 + Math.sin(t * 13.7 + 1) * 0.3 + Math.sin(t * 2.3) * 0.2;
    const fx = w / 2 + Math.sin(t * 3.3) * 0.9 + Math.sin(t * 8.1) * 0.35, fy = h * 0.47;
    const fh = 11 * (0.9 + 0.12 * n + 0.08 * e), fw = 3.4;
    if (!light) { const gl = c.createRadialGradient(fx, fy, 1, fx, fy, 20); gl.addColorStop(0, `rgba(255,190,110,${0.32 + 0.08 * n})`); gl.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = gl; c.fillRect(0, 0, w, h); }
    // candle body with a soft wax drip
    const bx = w / 2 - 5.5, by = h * 0.55, bw = 11, bh = h * 0.36;
    const bg = c.createLinearGradient(bx, 0, bx + bw, 0); bg.addColorStop(0, light ? '#d9c6a6' : '#cdb894'); bg.addColorStop(0.45, light ? '#f3e7d0' : '#f2e3c6'); bg.addColorStop(1, light ? '#c7b18c' : '#a8916d');
    c.fillStyle = bg; c.beginPath(); if (c.roundRect) c.roundRect(bx, by, bw, bh, 2); else c.rect(bx, by, bw, bh); c.fill();
    c.fillStyle = light ? '#f6ecd9' : '#f6e9cf'; c.beginPath(); c.ellipse(w / 2, by, bw / 2, 1.6, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(bx + 2, by); c.quadraticCurveTo(bx + 2.3, by + 5, bx + 1.6, by + 6.5); c.quadraticCurveTo(bx + 1, by + 5, bx + 1.2, by); c.fill();
    if (light) { c.strokeStyle = 'rgba(120,95,60,.35)'; c.lineWidth = 0.6; c.strokeRect(bx, by, bw, bh); }
    c.strokeStyle = '#3a2a20'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(w / 2, by - 0.5); c.lineTo(w / 2 + 0.3, by - 3); c.stroke();
    // flame
    const tipX = fx + Math.sin(t * 5.2) * 1.2, tipY = by - 3 - fh;
    const fg = c.createLinearGradient(0, by - 2, 0, tipY);
    fg.addColorStop(0, 'rgba(90,120,255,.55)'); fg.addColorStop(0.12, light ? 'rgba(255,170,60,.95)' : 'rgba(255,245,215,.98)'); fg.addColorStop(0.5, light ? 'rgba(250,135,30,.9)' : 'rgba(255,200,95,.92)'); fg.addColorStop(1, 'rgba(240,110,30,0)');
    c.fillStyle = fg; c.beginPath(); c.moveTo(w / 2, by - 1.5);
    c.bezierCurveTo(w / 2 - fw * 1.3, by - 4, tipX - fw * 0.6, by - fh * 0.75, tipX, tipY);
    c.bezierCurveTo(tipX + fw * 0.6, by - fh * 0.75, w / 2 + fw * 1.3, by - 4, w / 2, by - 1.5); c.fill();
    const core = c.createRadialGradient(w / 2, by - 4.5, 0, w / 2, by - 4.5, 3.2); core.addColorStop(0, light ? 'rgba(255,240,190,.95)' : 'rgba(255,255,245,.95)'); core.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = core; c.beginPath(); c.arc(w / 2, by - 4.5, 3.2, 0, 7); c.fill();
  },
  heart(c, w, h, t, dt, st, e, p) {
    const light = p.bare && !p.dark;
    if (!p.bare) { const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.7); g.addColorStop(0, '#2a1218'); g.addColorStop(1, '#140a0d'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    const per = Sound.heartPer || 60 / 62;
    let ph; if (Sound.ctx && Sound.heartT0 != null) ph = ((Sound.ctx.currentTime - Sound.heartT0) % per + per) % per; else ph = t % per;
    const beat = x => x < 0 ? 0 : Math.exp(-x * 14) * Math.min(1, x * 60);
    const pulse = beat(ph - 0.02) * 0.16 + beat(ph - 0.32) * 0.09;
    if (!st.rings) st.rings = []; if (st.lastPh != null && ph < st.lastPh) st.rings.push({ r: 9, a: 0.55 }); st.lastPh = ph;
    for (let i = st.rings.length - 1; i >= 0; i--) { const r = st.rings[i]; r.r += 16 * dt; r.a -= 0.7 * dt; if (r.a <= 0) { st.rings.splice(i, 1); continue; } c.strokeStyle = light ? `rgba(190,40,70,${r.a})` : `rgba(240,110,130,${r.a})`; c.lineWidth = 1; c.beginPath(); c.arc(w / 2, h / 2 + 1, r.r, 0, 7); c.stroke(); }
    c.save(); c.translate(w / 2, h / 2 + 1); const s = 0.62 * (1 + pulse); c.scale(s, s);
    const g = c.createLinearGradient(0, -14, 0, 16); g.addColorStop(0, light ? '#e2475f' : '#ff7088'); g.addColorStop(1, light ? '#a5182f' : '#c4223f');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 14);
    c.bezierCurveTo(-4, 9, -16, 2, -16, -6); c.bezierCurveTo(-16, -13, -8, -16, 0, -9); c.bezierCurveTo(8, -16, 16, -13, 16, -6); c.bezierCurveTo(16, 2, 4, 9, 0, 14); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(-8, -8, 3.6, 2.2, -0.6, 0, 7); c.fill();
    c.restore();
  },
  velvet(c, w, h, t, dt, st, e, p) {
    const light = p.bare && !p.dark;
    if (!p.bare) { c.fillStyle = '#170d13'; c.fillRect(0, 0, w, h); }
    c.globalCompositeOperation = light ? 'source-over' : 'lighter';
    const blobs = [[0.13, 0.17, 0, '122,42,69'], [0.09, 0.21, 1.7, '196,92,122'], [0.16, 0.11, 3.1, '86,44,102'], [0.07, 0.15, 4.4, '201,138,90']];
    blobs.forEach(([fxq, fyq, ph, col], k) => {
      const x = w / 2 + Math.sin(t * fxq * 6 + ph) * 10, y = h / 2 + Math.cos(t * fyq * 6 + ph * 1.3) * 9, r = 13 + 3 * Math.sin(t * 0.7 + k) + e * 3;
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${light ? 0.55 : 0.6})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    });
    c.strokeStyle = light ? 'rgba(120,40,70,.35)' : 'rgba(255,200,215,.22)'; c.lineWidth = 0.7;
    for (let k = 0; k < 3; k++) { c.beginPath(); for (let x = 4; x <= w - 4; x += 1.5) { const y = h * (0.35 + k * 0.15) + Math.sin(x * 0.15 + t * (0.6 + k * 0.2) + k) * 3; x === 4 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    c.globalCompositeOperation = 'source-over';
  },
  jazz(c, w, h, t, dt, st, e, p) {
    const light = p.bare && !p.dark;
    if (!p.bare) { const g = c.createRadialGradient(w * 0.7, h * 0.45, 2, w / 2, h / 2, w * 0.75); g.addColorStop(0, '#2c1a14'); g.addColorStop(1, '#120b0c'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    const live = musicNow('trumpet'), blow = live ? live.v : 0;
    st.blow = (st.blow || 0) + ((blow ? 1 : 0) - (st.blow || 0)) * Math.min(1, dt * (blow ? 14 : 4));
    // smoke wisps
    if (!st.smoke) st.smoke = [];
    if (Math.random() < dt * 1.6) st.smoke.push({ x: w * (0.18 + Math.random() * 0.15), y: h * 0.9, a: 0, life: 0, ph: Math.random() * 6 });
    c.lineCap = 'round';
    for (let i = st.smoke.length - 1; i >= 0; i--) {
      const m = st.smoke[i]; m.life += dt; m.y -= 6 * dt; if (m.life > 5 || m.y < 2) { st.smoke.splice(i, 1); continue; }
      const a = Math.sin(Math.min(1, m.life / 5) * Math.PI) * (light ? 0.22 : 0.18);
      c.strokeStyle = light ? `rgba(90,70,60,${a})` : `rgba(220,200,190,${a})`; c.lineWidth = 1.2 + m.life * 0.5;
      c.beginPath(); for (let k = 0; k < 5; k++) { const yy = m.y - k * 2, xx = m.x + Math.sin(m.ph + yy * 0.25 + t * 0.9) * (1.2 + m.life * 0.6); k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
    }
    // trumpet, bell to the right, a gentle sway with the phrase
    c.save(); c.translate(w * 0.45, h * 0.54); c.scale(0.86, 0.86); c.rotate(-0.16 + Math.sin(t * 0.8) * 0.03 - st.blow * 0.05);
    const brass = c.createLinearGradient(0, -8, 0, 8); brass.addColorStop(0, light ? '#d9a441' : '#ffd88a'); brass.addColorStop(0.5, light ? '#a8741c' : '#e1a84a'); brass.addColorStop(1, light ? '#6e4810' : '#9a6a24');
    c.fillStyle = brass; c.strokeStyle = brass;
    c.lineWidth = 2.2; c.beginPath(); c.moveTo(-18, 0); c.lineTo(8, 0); c.stroke();          // lead pipe
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(-12, 0); c.bezierCurveTo(-12, 5.5, 4, 5.5, 4, 0); c.stroke(); // tuning loop
    c.beginPath(); c.moveTo(8, -1.4); c.quadraticCurveTo(14, -1.8, 18, -7.5); c.lineTo(18, 7.5); c.quadraticCurveTo(14, 1.8, 8, 1.4); c.closePath(); c.fill(); // bell
    c.beginPath(); c.ellipse(18, 0, 1.4, 7.5, 0, 0, 7); c.fill();
    c.fillRect(-21, -1.4, 3, 2.8);                                                              // mouthpiece
    for (let k = 0; k < 3; k++) { const down = live && ((live.m + k) % 3 === 0) ? 1.4 : 0; c.fillRect(-6 + k * 3.4, -5 + down, 1.6, 4.4 - down); c.beginPath(); c.arc(-5.2 + k * 3.4, -5.4 + down, 1.3, 0, 7); c.fill(); } // valves
    if (st.blow > 0.02) { const g = c.createRadialGradient(19, 0, 0, 19, 0, 12); g.addColorStop(0, `rgba(255,214,140,${0.5 * st.blow})`); g.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(19, 0, 12, 0, 7); c.fill(); }
    c.restore();
    // notes released from the bell
    if (!st.notes) st.notes = [];
    if (live && live !== st.lastEv) { st.lastEv = live; st.notes.push({ x: w * 0.68, y: h * 0.36 - (live.m % 4), vx: 2 + Math.random() * 2.5, vy: -3.5 - Math.random() * 2.5, life: 0, kind: live.m % 2 }); }
    musicNotes(c, st.notes, dt, light ? 'rgba(120,70,20,' : 'rgba(255,220,160,', w, h);
  },
  piano(c, w, h, t, dt, st, e, p) {
    const light = p.bare && !p.dark;
    if (!p.bare) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1420'); g.addColorStop(1, '#0d0a10'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    const ctx = Music.ctx, now = ctx ? ctx.currentTime : 0, evs = Music.on && Music.kind === 'piano' ? Music.events : [];
    if (!st.lit) st.lit = new Array(12).fill(0);
    const WK = [0, 2, 4, 5, 7, 9, 11], BK = [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5]];
    const on = new Array(12).fill(0);
    evs.forEach(ev => { if (ev.inst === 'ep' && ev.t <= now && now < ev.t + Math.min(ev.d, 1.4)) on[ev.m % 12] = Math.max(on[ev.m % 12], ev.v); });
    if (!evs.length) { const k = WK[Math.floor(t * 1.2) % 7]; on[k] = 0.6; }
    for (let i = 0; i < 12; i++) st.lit[i] += (on[i] - st.lit[i]) * Math.min(1, dt * (on[i] > st.lit[i] ? 18 : 3));
    const kx = w * 0.12, kw = (w * 0.76) / 7, ky = h * 0.5, kh = h * 0.34, warm = light ? '196,118,58' : '255,196,130';
    // glow rising from lit keys
    if (!st.motes) st.motes = [];
    WK.forEach((n, i) => { if (on[n] && Math.random() < dt * 6) st.motes.push({ x: kx + kw * (i + 0.5), y: ky, life: 0, dx: (Math.random() - 0.5) * 3 }); });
    BK.forEach(([n, i]) => { if (on[n] && Math.random() < dt * 6) st.motes.push({ x: kx + kw * (i + 1), y: ky, life: 0, dx: (Math.random() - 0.5) * 3 }); });
    if (!light) c.globalCompositeOperation = 'lighter';
    for (let i = st.motes.length - 1; i >= 0; i--) { const m = st.motes[i]; m.life += dt; m.y -= 9 * dt; m.x += m.dx * dt; if (m.life > 1.8) { st.motes.splice(i, 1); continue; } c.fillStyle = `rgba(${warm},${0.7 * (1 - m.life / 1.8)})`; c.beginPath(); c.arc(m.x, m.y, 0.9, 0, 7); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    // body edge
    c.fillStyle = light ? 'rgba(40,28,30,.85)' : 'rgba(10,8,12,.9)'; c.fillRect(kx - 1.5, ky - 3, kw * 7 + 3, 3);
    WK.forEach((n, i) => {
      const x = kx + kw * i, d = st.lit[n] * 0.9;
      const g = c.createLinearGradient(0, ky, 0, ky + kh); g.addColorStop(0, light ? '#fbf6ee' : '#efe6da'); g.addColorStop(1, light ? '#e5dccf' : '#cbbfae');
      c.fillStyle = g; c.fillRect(x + 0.35, ky + d, kw - 0.7, kh - d);
      if (st.lit[n] > 0.02) { c.fillStyle = `rgba(${warm},${0.55 * st.lit[n]})`; c.fillRect(x + 0.35, ky + d, kw - 0.7, kh - d); }
    });
    BK.forEach(([n, i]) => {
      const x = kx + kw * (i + 1) - kw * 0.3, d = st.lit[n] * 0.8;
      c.fillStyle = light ? '#211a1c' : '#120e12'; c.fillRect(x, ky, kw * 0.6, kh * 0.6 + d);
      if (st.lit[n] > 0.02) { c.fillStyle = `rgba(${warm},${0.6 * st.lit[n]})`; c.fillRect(x, ky, kw * 0.6, kh * 0.6 + d); }
    });
  },
  guitar(c, w, h, t, dt, st, e, p) {
    const light = p.bare && !p.dark;
    if (!p.bare) { const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.7); g.addColorStop(0, '#3a2414'); g.addColorStop(1, '#170e09'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    const ctx = Music.ctx, now = ctx ? ctx.currentTime : 0, evs = Music.on && Music.kind === 'guitar' ? Music.events : [];
    if (!st.amp) st.amp = new Array(6).fill(0);
    evs.forEach(ev => { if (ev.inst === 'guitar' && ev.t <= now && !ev.seen) { ev.seen = 1; const s = clamp(Math.round((ev.m - 40) / 6), 0, 5); st.amp[s] = Math.max(st.amp[s], 0.6 + ev.v * 0.6); } });
    if (!evs.length && Math.random() < dt * 1.5) st.amp[Math.floor(Math.random() * 6)] = 0.8;
    const cx = w / 2, cy = h / 2, R = w * 0.25;
    // rosette and sound hole
    c.strokeStyle = light ? 'rgba(140,90,40,.6)' : 'rgba(230,180,120,.5)'; c.lineWidth = 1.3; c.beginPath(); c.arc(cx, cy, R + 2.4, 0, 7); c.stroke();
    c.setLineDash([1, 1.4]); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R + 4.4, 0, 7); c.stroke(); c.setLineDash([]);
    c.lineWidth = 0.6; c.beginPath(); c.arc(cx, cy, R + 6, 0, 7); c.stroke();
    const hole = c.createRadialGradient(cx, cy, 0, cx, cy, R); hole.addColorStop(0, light ? 'rgba(30,18,10,.85)' : 'rgba(0,0,0,.7)'); hole.addColorStop(1, light ? 'rgba(60,36,18,.7)' : 'rgba(20,10,6,.55)');
    c.fillStyle = hole; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    const glow = st.amp.reduce((a, b) => a + b, 0) / 6;
    if (glow > 0.02) { const g = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6); g.addColorStop(0, `rgba(255,190,120,${0.25 * glow})`); g.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 1.6, 0, 7); c.fill(); }
    // strings across the hole, each vibrating as it is plucked
    for (let s = 0; s < 6; s++) {
      st.amp[s] *= Math.exp(-dt * 2.4);
      const y = cy - 7 + s * 2.8, a = st.amp[s] * 1.6;
      c.strokeStyle = light ? `rgba(${s < 3 ? '120,90,60' : '160,150,140'},.95)` : `rgba(${s < 3 ? '240,215,170' : '235,232,226'},${0.75 + a * 0.15})`;
      c.lineWidth = s < 3 ? 0.95 : 0.6; c.beginPath();
      for (let x = 3; x <= w - 3; x += 1) { const u = (x - 3) / (w - 6); const yy = y + Math.sin(u * Math.PI) * Math.sin(t * (60 + s * 9)) * a; x === 3 ? c.moveTo(x, yy) : c.lineTo(x, yy); }
      c.stroke();
    }
  },
  off(c, w, h, t, dt, st, e, p) {
    if (!p.bare) { c.fillStyle = p.soft; c.fillRect(0, 0, w, h); }
    c.strokeStyle = p.muted; c.fillStyle = p.muted; c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath(); c.arc(w / 2, h * 0.56, w * 0.22, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
    const rr = (x, y, ww, hh) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, ww, hh, 2.5); else c.rect(x, y, ww, hh); c.fill(); };
    rr(w / 2 - w * 0.25, h * 0.5, w * 0.11, h * 0.21); rr(w / 2 + w * 0.14, h * 0.5, w * 0.11, h * 0.21);
  }
};

const SndUI = {
  bare: null,
  w: $('#sndw'), cv: $('#sndc'), pop: $('#sndPop'), kind: null, st: {}, raf: 0, last: 0, t: 0, energy: 0, buf: null,
  current() { const k = S.sound || 'off'; return k.startsWith('custom:') ? 'custom' : (Scenes[k] ? k : 'off'); },
  label() { const k = S.sound || 'off'; if (k.startsWith('custom:')) { const m = allCustomSounds().find(x => 'custom:' + x.id === k); return m ? m.name : 'Your sound'; } return SOUND_NAMES[k] || 'Sound off'; },
  update() {
    const kind = this.current();
    if (kind !== this.kind) { this.kind = kind; this.st = {}; }
    $('#sndName').textContent = this.label();
    $('#sndSub').textContent = kind === 'off' ? 'Tap to choose a sound' : 'Playing · tap to change';
    this.w.setAttribute('aria-label', kind === 'off' ? 'Choose a soundscape' : `Soundscape: ${this.label()}. Change sound`);
    this.w.classList.toggle('on', kind !== 'off');
    if (!this.pop.hidden) this.renderPop();
    this.start();
  },
  compact() { return el.reader.classList.contains('chrome-off') || el.reader.classList.contains('deep') || window.innerWidth <= 720; },
  size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), css = this.cv.clientWidth || 44;
    if (this.cv.width !== Math.round(css * dpr)) { this.cv.width = Math.round(css * dpr); this.cv.height = Math.round(css * dpr); }
    return { dpr, css };
  },
  start() { cancelAnimationFrame(this.raf); this.last = 0; this.raf = requestAnimationFrame(ts => this.frame(ts)); },
  frame(ts) {
    if (!R.open || el.reader.hidden) return;
    const moving = this.kind !== 'off' && !document.hidden && !reduceMotion();
    if (this.last && ts - this.last < 32 && moving) { this.raf = requestAnimationFrame(x => this.frame(x)); return; }
    const dt = this.last ? Math.min(0.1, (ts - this.last) / 1000) : 0.016; this.last = ts; this.t += dt;
    const bare = this.compact();
    if (bare !== this.bare) { this.bare = bare; this.w.classList.toggle('bare', bare); this.st = {}; }
    const { dpr, css } = this.size();
    const U = 44, k = css / U;
    const c = this.cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height);
    c.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    this.energy += (this.readEnergy() - this.energy) * Math.min(1, dt * 6);
    const cs = getComputedStyle(el.reader);
    const pal = { bare, dark: el.reader.classList.contains('rt-dark'), soft: cs.getPropertyValue('--r-soft').trim() || '#ddd', muted: cs.getPropertyValue('--r-muted').trim() || '#888' };
    c.save();
    if (!bare) { c.beginPath(); c.arc(U / 2, U / 2, U / 2, 0, 7); c.clip(); }
    try { Scenes[this.kind](c, U, U, this.t, dt, this.st, this.energy, pal); } catch (e) { /* keep the widget alive */ }
    c.restore();
    if (bare) {
      // Soft edges instead of a frame: fade everything out toward the borders.
      c.globalCompositeOperation = 'destination-in';
      const m = c.createRadialGradient(U / 2, U / 2, U * 0.3, U / 2, U / 2, U * 0.5);
      m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = m; c.fillRect(0, 0, U, U);
      c.globalCompositeOperation = 'source-over';
    }
    if (moving) this.raf = requestAnimationFrame(x => this.frame(x));
  },
  readEnergy() {
    const an = Sound.an; if (!an || !Sound.gain) return 0.3;
    try {
      if (!this.buf || this.buf.length !== an.fftSize) this.buf = new Float32Array(an.fftSize);
      an.getFloatTimeDomainData(this.buf);
      let s = 0; for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i];
      return clamp(Math.sqrt(s / this.buf.length) * 3 / (Sound.level() + 0.05), 0, 1);
    } catch (e) { return 0.3; }
  },
  togglePop() { this.pop.hidden ? this.openPop() : this.closePop(); },
  openPop() { this.renderPop(); this.pop.hidden = false; this.w.setAttribute('aria-expanded', 'true'); Chrome.show(); const f = this.pop.querySelector('[aria-pressed="true"]') || this.pop.querySelector('button'); if (f && !isCoarse()) f.focus({ preventScroll: true }); },
  closePop() { if (this.pop.hidden) return; this.pop.hidden = true; this.w.setAttribute('aria-expanded', 'false'); },
  renderPop() {
    const cs = allCustomSounds();
    const opt = (val, name, icon) => `<button type="button" class="sopt" data-act="sound" data-val="${esc(val)}" aria-pressed="${S.sound === val}">${icon}<span>${esc(name)}</span></button>`;
    this.pop.innerHTML = `<div class="sp-head"><b>Soundscape</b><span class="muted">${S.sound === 'off' ? 'Nothing playing' : 'Now playing: ' + esc(this.label())}</span></div>
      <div class="sopts">${[['jazz', 'Trumpet'], ['piano', 'Piano'], ['guitar', 'Guitar'], ['rain'], ['fire'], ['ocean'], ['candle', 'Candle'], ['heart'], ['velvet'], ['brown', 'Brown'], ['fan']].map(([k, short]) => opt(k, short || SOUND_NAMES[k], SOUND_ICONS[k])).join('')}${cs.map(x => opt('custom:' + x.id, x.name, SOUND_ICONS.custom)).join('')}<label class="sopt add add-sound" for="soundInput" tabindex="0" title="${privateSoundsOn() && (Vault.view || (R.meta && R.meta.private)) ? 'Saved in Private' : 'Add an audio file from your device'}">${ICON.plus}<span>Your own</span></label></div>
      <div class="sp-vol"><label for="rg-vol-pop">Volume</label><input class="rng" type="range" id="rg-vol-pop" data-range="vol" min="0" max="1" step="0.01" value="${S.vol}"></div>
      <button type="button" class="btn quiet sm sp-off" data-act="sound" data-val="off" ${S.sound === 'off' ? 'disabled' : ''}>Turn sound off</button>`;
  }
};
SndUI.w.addEventListener('click', e => { e.stopPropagation(); SndUI.togglePop(); });
document.addEventListener('click', e => { if (!SndUI.pop.hidden && !e.target.closest('#sndPop') && !e.target.closest('#sndw')) SndUI.closePop(); });

/* ---- Pull-switch sound ---- */
const SwitchSound = {
  play(on) {
    const ctx = Sound.ensureCtx(); if (!ctx) return;
    try {
      const t = ctx.currentTime + 0.01;
      const burst = (at, freq, dur, vol, q) => {
        const len = Math.max(1, Math.floor(ctx.sampleRate * dur)), b = ctx.createBuffer(1, len, ctx.sampleRate), a = b.getChannelData(0);
        for (let i = 0; i < len; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
        const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
        const g = ctx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(at);
      };
      burst(t, 700, 0.045, 0.55, 0.7);
      burst(t + 0.085, on ? 3400 : 2700, 0.02, 1.1, 2.2);
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = on ? 1750 : 1350;
      g.gain.setValueAtTime(0.0001, t + 0.085); g.gain.exponentialRampToValueAtTime(0.06, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(ctx.destination); o.start(t + 0.08); o.stop(t + 0.2);
      if (on) { const hum = ctx.createOscillator(), hg = ctx.createGain(); hum.frequency.value = 100; hg.gain.setValueAtTime(0.0001, t + 0.12); hg.gain.exponentialRampToValueAtTime(0.012, t + 0.25); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); hum.connect(hg); hg.connect(ctx.destination); hum.start(t + 0.12); hum.stop(t + 0.95); }
    } catch (e) { /* sound unavailable */ }
  }
};

/* ---- Hyperfocus lamp ---- */
const Lamp = {
  box: $('#lamp'), swing: $('#lampSwing'), pull: $('#lampPull'), cord: $('#lampCord'), bead: $('#lampBead'),
  room: $('#room'), pool: $('#pool'), cone: $('#cone'), motes: $('#motes'),
  on: false, anims: [], mraf: 0, mp: [], geo: null, idle: null,
  measure() {
    if (!R.open || el.reader.hidden) return;
    const W = window.innerWidth, H = window.innerHeight;
    let L = W * 0.3, Rr = W * 0.7;
    if (R.kind === 'flow') {
      const r = el.content.getBoundingClientRect();
      if (r.width > 40) { L = r.left; Rr = r.right; }
      if (isPaged() && R.perView === 2) { L = W * 0.06; Rr = W * 0.94; }
      else if (isPaged()) { const p = el.page.getBoundingClientRect(); const pl = parseFloat(el.page.style.paddingLeft) || 0; L = Math.max(0, pl); Rr = Math.min(W, W - pl); }
    } else if (PV.els.length) {
      const vis = PV.book ? $$('.pg.vis', el.pdfpages) : [PV.els[PV.cur]].filter(Boolean);
      if (vis.length) { const rs = vis.map(v => v.getBoundingClientRect()); L = Math.max(0, Math.min(...rs.map(r => r.left))); Rr = Math.min(W, Math.max(...rs.map(r => r.right))); }
    }
    const k = clamp((S.lampSize || 100) / 100, 0.4, 2.5);
    const cx = (L + Rr) / 2, rx = Math.max(140, (Math.max(220, (Rr - L) / 2 + 80)) * k), ry = Math.max(120, H * 0.66 * k), cy = H * 0.56;
    const desk = W >= 720;
    let lx = desk ? clamp(cx, 300, W - 330) : W * 0.62;
    if (desk) { const tb = $('#topbar .tools.desk'); const tl = tb && tb.offsetParent ? tb.getBoundingClientRect().left : 0; if (tl > 0) lx = Math.max(230, Math.min(lx, tl - 58 * clamp((S.lampScale || 100) / 100, 0.6, 1.6))); }
    const ls = clamp((S.lampScale || 100) / 100, 0.6, 1.6);
    this.geo = { W, H, cx, cy, rx, ry, lx, s: (desk ? 1 : 0.8) * ls };
    const rs = el.reader.style;
    rs.setProperty('--lamp-k', ls);
    rs.setProperty('--lx', lx + 'px'); rs.setProperty('--pcx', cx + 'px'); rs.setProperty('--pcy', cy + 'px'); rs.setProperty('--prx', rx + 'px'); rs.setProperty('--pry', ry + 'px');
    const s = this.geo.s, topY = 60 * s + 2, topHalf = 33 * s, botHalf = Math.min(W * 0.48, rx * 0.95);
    $('#coneIn').style.clipPath = `polygon(${lx - topHalf}px ${topY}px, ${lx + topHalf}px ${topY}px, ${cx + botHalf}px ${H}px, ${cx - botHalf}px ${H}px)`;
    if (this.on) this.sizeMotes();
  },
  measureSoon: debounce(() => Lamp.measure(), 60),
  async toggle() { this.on ? this.off() : this.enable(); },
  enable() {
    if (!R.open || this.on) return;
    this.on = true; this.measure();
    SwitchSound.play(true);
    el.reader.classList.add('hyper'); this.pull.setAttribute('aria-pressed', 'true'); this.pull.setAttribute('aria-label', 'Turn off hyperfocus light'); this.syncBtn();
    Chrome.hide(); hideTool(); SndUI.closePop(); Wake.on();
    if (!reduceMotion()) {
      const fl = [{ opacity: 0 }, { opacity: 0.75, offset: 0.1 }, { opacity: 0.12, offset: 0.18 }, { opacity: 0.9, offset: 0.32 }, { opacity: 0.45, offset: 0.42 }, { opacity: 1, offset: 0.62 }, { opacity: 1 }];
      [this.room, this.pool, this.cone, $('#lampGlow')].forEach(n => this.anims.push(n.animate(fl, { duration: 900, delay: 90, easing: 'linear', fill: 'backwards' })));
      this.swingOnce(1);
      this.startMotes();
    }
    toast('Hyperfocus on. Pull the cord again or press H to switch it off.', 2600);
  },
  off() {
    if (!this.on) return;
    this.on = false; SwitchSound.play(false);
    if (!reduceMotion()) {
      [this.room, this.pool, this.cone].forEach(n => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' }));
      $('#lampGlow').animate([{ opacity: 1 }, { opacity: 0.35, offset: 0.25 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' });
      this.swingOnce(-1);
    }
    el.reader.classList.remove('hyper'); this.pull.setAttribute('aria-pressed', 'false'); this.pull.setAttribute('aria-label', 'Turn on hyperfocus light'); this.syncBtn();
    this.stopMotes();
    if (!Session.active && !R.deep && !Rsvp.on) Wake.off();
    Chrome.show();
  },
  preview() {
    if (this.on || !R.open) return;
    this.measure(); el.reader.classList.add('hyper-preview');
    clearTimeout(this.pt); this.pt = setTimeout(() => el.reader.classList.remove('hyper-preview'), 1300);
  },
  rescale(d) {
    setS('lampScale', clamp((S.lampScale || 100) + d, 60, 160));
    const o = $('#lampScaleOut'); if (o) o.textContent = S.lampScale + '%';
    toast(`Lamp size ${S.lampScale}%`, 1200);
  },
  resize(d) {
    setS('lampSize', clamp((S.lampSize || 100) + d, 40, 220));
    const o = $('#lampSizeOut'); if (o) o.textContent = S.lampSize + '%';
    toast(`Light size ${S.lampSize}%`, 1200);
  },
  syncBtn() {
    const b = $('#lampBtn'); if (!b) return;
    b.setAttribute('aria-pressed', String(!!this.on));
    b.classList.toggle('away', !S.lampShow);
    const t = !S.lampShow ? 'Bring the lamp back' : this.on ? 'Switch the light off (H)' : 'Switch the light on (H)';
    b.title = t; b.setAttribute('aria-label', t);
  },
  bringBack() {
    setS('lampShow', true);
    const l = $('#lamp');
    if (l && !reduceMotion()) l.animate([{ transform: 'translateY(-140%)' }, { transform: 'translateY(8%)', offset: 0.62 }, { transform: 'translateY(-3%)', offset: 0.82 }, { transform: 'translateY(0)' }], { duration: 760, easing: 'cubic-bezier(.3,.7,.3,1)', composite: 'add' });
    setTimeout(() => this.swingOnce(1), 500);
    toast(this.on ? 'The lamp is back.' : 'The lamp is back. Tap the light button again, or pull the cord, to switch it on.', 3200);
  },
  hide() {
    setS('lampShow', false);
    toast(this.on ? 'Lamp hidden. The light stays on. Use the lamp button at the top right to bring it back.' : 'Lamp hidden. Use the lamp button at the top right to bring it back.', 4200);
  },
  reset() { if (this.on) { this.on = false; el.reader.classList.remove('hyper'); this.pull.setAttribute('aria-pressed', 'false'); this.stopMotes(); } this.syncBtn(); },
  swingOnce(dir) {
    const a = 4.2 * dir;
    this.swing.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${a}deg)`, offset: 0.16 }, { transform: `rotate(${-a * 0.7}deg)`, offset: 0.36 }, { transform: `rotate(${a * 0.42}deg)`, offset: 0.56 }, { transform: `rotate(${-a * 0.2}deg)`, offset: 0.74 }, { transform: `rotate(${a * 0.07}deg)`, offset: 0.88 }, { transform: 'rotate(0deg)' }], { duration: 2100, easing: 'cubic-bezier(.3,.1,.3,1)' });
  },
  setPull(dy) { this.cord.style.transform = `scaleY(${(26 + dy) / 26})`; this.bead.style.transform = `translateY(${dy}px)`; },
  springBack(dy) {
    const k = [dy, -dy * 0.32, dy * 0.14, -dy * 0.05, 0], off = [0, 0.32, 0.56, 0.78, 1];
    const dur = reduceMotion() ? 1 : 620;
    this.bead.animate(k.map((v, i) => ({ transform: `translateY(${v}px)`, offset: off[i] })), { duration: dur, easing: 'ease-out' });
    this.cord.animate(k.map((v, i) => ({ transform: `scaleY(${Math.max(0.7, (26 + v) / 26)})`, offset: off[i] })), { duration: dur, easing: 'ease-out' });
    this.setPull(0);
  },
  tug() { // keyboard or plain click: a full pull without dragging
    const d = 22, dur = reduceMotion() ? 1 : 160;
    this.bead.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${d}px)` }], { duration: dur, easing: 'ease-in' });
    const a = this.cord.animate([{ transform: 'scaleY(1)' }, { transform: `scaleY(${(26 + d) / 26})` }], { duration: dur, easing: 'ease-in' });
    a.onfinish = () => { this.springBack(d); this.toggle(); };
  },
  sizeMotes() {
    const g = this.geo; if (!g) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.motes.width = Math.round(g.W * dpr); this.motes.height = Math.round(g.H * dpr);
  },
  startMotes() {
    this.sizeMotes(); const g = this.geo; if (!g) return;
    this.mp = Array.from({ length: 26 }, () => this.newMote(true));
    cancelAnimationFrame(this.mraf); let last = 0;
    const step = ts => {
      if (!this.on || !R.open) return;
      if (last && ts - last < 33) { this.mraf = requestAnimationFrame(step); return; }
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0.03; last = ts;
      const c = this.motes.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, g.W, g.H);
      for (const m of this.mp) {
        m.y += m.vy * dt; m.x += (m.vx + Math.sin(ts / 1000 * m.f + m.ph) * 4) * dt; m.life += dt;
        const k = (m.y - 60) / (g.H - 60), half = 33 * g.s + k * (Math.min(g.W * 0.48, g.rx * 0.95) - 33 * g.s), cxk = g.lx + (g.cx - g.lx) * k;
        if (m.y > g.H * 0.8 || m.y < 60 || Math.abs(m.x - cxk) > half) Object.assign(m, this.newMote(false));
        const a = m.a * (0.55 + 0.45 * Math.sin(ts / 1000 * 1.7 + m.ph)) * Math.min(1, m.life * 1.5);
        c.fillStyle = `rgba(255,236,200,${a})`; c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill();
      }
      this.mraf = requestAnimationFrame(step);
    };
    this.mraf = requestAnimationFrame(step);
  },
  newMote(anywhere) {
    const g = this.geo, y = anywhere ? rnd(80, g.H * 0.75) : rnd(90, g.H * 0.4);
    const k = (y - 60) / (g.H - 60), half = 33 * g.s + k * (Math.min(g.W * 0.48, g.rx * 0.95) - 33 * g.s), cxk = g.lx + (g.cx - g.lx) * k;
    return { x: cxk + rnd(-half * 0.8, half * 0.8), y, vy: rnd(-4, 6), vx: rnd(-3, 3), r: rnd(0.5, 1.5), a: rnd(0.15, 0.5), f: rnd(0.3, 1.1), ph: rnd(0, 6), life: 0 };
  },
  stopMotes() { cancelAnimationFrame(this.mraf); const c = this.motes.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.motes.width, this.motes.height); }
};
(() => {
  let drag = null;
  Lamp.pull.addEventListener('pointerdown', e => {
    e.preventDefault(); Lamp.pull.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, t: Date.now(), dy: 0 };
  });
  Lamp.pull.addEventListener('pointermove', e => {
    if (!drag) return;
    const raw = Math.max(0, e.clientY - drag.y);
    drag.dy = raw < 40 ? raw : 40 + (raw - 40) * 0.25; // resists like a real cord
    Lamp.setPull(Math.min(drag.dy, 56));
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.dy > 12) { Lamp.springBack(Math.min(d.dy, 56)); Lamp.toggle(); }
    else if (Date.now() - d.t < 500) { Lamp.setPull(0); Lamp.tug(); }
    else Lamp.springBack(d.dy);
  };
  Lamp.pull.addEventListener('pointerup', end);
  Lamp.pull.addEventListener('pointercancel', () => { if (drag) { Lamp.springBack(drag.dy); drag = null; } });
  Lamp.pull.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); Lamp.tug(); } });
})();
window.addEventListener('resize', debounce(() => { if (R.open) { Lamp.measure(); SndUI.start(); } }, 200));
new MutationObserver(() => { if (R.open && SndUI.compact() !== SndUI.bare) SndUI.start(); }).observe(el.reader, { attributes: true, attributeFilter: ['class'] });

/* ---- Lamp settings: the gear beside the lamp opens its size and light controls right where you are looking ---- */
const LampPop = {
  toggle() { $('#lampPop').hidden ? this.open() : this.close(); },
  open() {
    const p = $('#lampPop'); if (!p) return;
    p.innerHTML = `<div class="lp-h"><b>Lamp</b><button class="ib" data-act="lampSettings" aria-label="Close lamp settings"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      ${rng('lampScale', 'Lamp size', 60, 160, 5, v => Math.round(v) + '%')}
      ${rng('lampSize', 'Light size', 40, 220, 5, v => Math.round(v) + '%')}
      <div class="lp-row"><button class="btn quiet sm" data-act="lampToggle">${Lamp.on ? 'Light off' : 'Light on'}</button><button class="btn quiet sm" data-act="magnifier">${ICON.search}Magnifier</button></div>`;
    p.hidden = false; $('#lampSet').setAttribute('aria-expanded', 'true');
    SndUI.closePop(); Chrome.show();
  },
  close() { const p = $('#lampPop'); if (!p || p.hidden) return; p.hidden = true; const b = $('#lampSet'); if (b) b.setAttribute('aria-expanded', 'false'); }
};
document.addEventListener('click', e => { const p = $('#lampPop'); if (p && !p.hidden && !e.target.closest('#lampPop') && !e.target.closest('#lampSet')) LampPop.close(); });
/* ================= Magnifier: a glass lens, round or rounded-square, that enlarges the page beneath it =================
   Text pages are magnified from a live copy of the page laid out exactly like the original, so the lens shows
   real, sharp text at any zoom. PDF and comic pages are magnified straight from their rendered pixels. */
function lensStyles() {
  if ($('#lensCss')) return;
  const out = [];
  const conv = sel => sel.replace(/#page\b/g, '.lz-page').replace(/#content\b/g, '.lz-content').replace(/#chEnd\b/g, '.lz-chEnd');
  const walk = (rules, wrap) => {
    for (const r of rules) {
      if (r.type === 1 && /#(page|content|chEnd)\b/.test(r.selectorText)) { const t = `${conv(r.selectorText)}{${r.style.cssText}}`; out.push(wrap ? `${wrap}{${t}}` : t); }
      else if (r.type === 4 && r.cssRules) walk(r.cssRules, '@media ' + r.conditionText);
    }
  };
  for (const sh of Array.from(document.styleSheets)) { try { walk(sh.cssRules, ''); } catch (e) { /* font sheets from other sites cannot be read */ } }
  const st = document.createElement('style'); st.id = 'lensCss'; st.textContent = out.join('\n'); document.head.appendChild(st);
}
const LOUPE_ICON = '<svg class="i" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20.5 20.5"/></svg>';
const Mag = {
  on: false, adjust: false, saved: null, x: 0, y: 0, clone: null, hi: new Map(), hiBusy: new Set(), dirty: true, raf: 0, drag: null, mo: null, cw: 0, ch: 0,
  get el() { return $('#lens'); },
  toggle() { this.on ? this.off() : this.start(); },
  start() {
    if (!R.open || !R.doc) return;
    lensStyles();
    this.on = true; el.reader.classList.add('mag-on'); document.body.classList.add('mag-on');
    this.el.hidden = false; $('#lensPill').hidden = false;
    if (!this.x) { this.x = innerWidth / 2; this.y = innerHeight * 0.42; }
    this.dirty = true; this.shape(); this.pill(); this.draw(true);
    $$('[data-act="magnifier"]').forEach(b => b.setAttribute('aria-pressed', 'true'));
    if (!this.mo) { this.mo = new MutationObserver(() => { this.dirty = true; this.draw(); }); }
    this.mo.observe(el.content, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src'] });
    toast(isCoarse() ? 'Drag the glass over the page. Use the bar on the left to change its shape, size and zoom.' : 'Move the pointer over the page. Press M to put the glass away.', 3200);
  },
  off() {
    if (!this.on) return;
    this.on = false; this.adjust = false; this.el.classList.remove('parked'); el.reader.classList.remove('mag-on');
    this.el.hidden = true; $('#lensPill').hidden = true; $('#lensView').innerHTML = ''; this.clone = null; this.hi.clear(); document.body.classList.remove('mag-on');
    if (this.mo) this.mo.disconnect();
    $$('[data-act="magnifier"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  },
  dims() {
    const s = clamp(S.magSize || 220, 120, 480), room = this.adjust ? this.parkSpot().maxW : innerWidth - 24;
    return S.magShape === 'rect' ? { w: Math.round(Math.min(s * 1.7, room)), h: Math.round(s * 0.7) } : { w: Math.min(s, room), h: Math.min(s, room) };
  },
  shape() {
    const l = this.el, { w, h } = this.dims();
    l.classList.toggle('rect', S.magShape === 'rect');
    l.style.width = w + 'px'; l.style.height = h + 'px';
    const cv = $('#lensCanvas'), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    this.draw(true);
  },
  pill() {
    const p = $('#lensPill'), z = (+S.magZoom).toFixed(2).replace(/\.?0+$/, '');
    p.innerHTML = `<span class="lbl" aria-hidden="true">${LOUPE_ICON}</span>
      <button class="ib" data-act="magShape" data-val="circle" aria-pressed="${S.magShape !== 'rect'}" aria-label="Round glass" title="Round"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/></svg></button>
      <button class="ib" data-act="magShape" data-val="rect" aria-pressed="${S.magShape === 'rect'}" aria-label="Rectangular glass" title="Rectangle"><svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="7" width="17" height="10" rx="3.5"/></svg></button>
      <i class="sep"></i><span class="cap">Size</span>
      <button class="ib" data-act="magSize" data-d="30" aria-label="Larger glass" title="Larger glass">${ICON.plus}</button><span class="val" title="Glass size in pixels">${S.magSize}</span><button class="ib" data-act="magSize" data-d="-30" aria-label="Smaller glass" title="Smaller glass">${ICON.minus}</button>
      <i class="sep"></i><span class="cap">Zoom</span>
      <button class="ib" data-act="magZoom" data-d="0.25" aria-label="More zoom" title="More zoom">${ICON.plus}</button><span class="val" title="Zoom">${z}×</span><button class="ib" data-act="magZoom" data-d="-0.25" aria-label="Less zoom" title="Less zoom">${ICON.minus}</button>
      <i class="sep"></i>
      <button class="ib" data-act="magnifier" aria-label="Put the magnifier away" title="Close (M)"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  },
  /* While the controls are in use the glass waits in the middle of the free area, clear of the controls, so changes can be seen as they are made */
  park(on) {
    if (on === this.adjust) { if (on) this.draw(); return; }
    this.adjust = on;
    this.el.classList.toggle('parked', on);
    this.shape();
    if (on) { this.saved = { x: this.x, y: this.y }; }
    else if (this.saved && !isCoarse()) { this.x = this.saved.x; this.y = this.saved.y; }
    this.draw();
  },
  parkSpot() {
    const pr = $('#lensPill').getBoundingClientRect(), left = pr.right + 12;
    return { x: left + (innerWidth - left) / 2, y: innerHeight / 2, maxW: innerWidth - left - 12 };
  },
  rebuild() {
    this.dirty = false;
    const v = $('#lensView'); v.innerHTML = ''; this.clone = null;
    if (R.kind !== 'flow') return;
    const c = el.page.cloneNode(true);
    c.removeAttribute('id'); c.classList.add('lz-page');
    c.querySelectorAll('[id]').forEach(n => { const id = n.id; if (id === 'content' || id === 'chEnd') n.classList.add('lz-' + id); n.removeAttribute('id'); });
    c.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable'));
    c.style.cssText = el.page.style.cssText;
    Object.assign(c.style, { position: 'absolute', left: '0', top: '0', margin: '0', width: el.page.offsetWidth + 'px', height: el.page.offsetHeight + 'px', maxWidth: 'none', transformOrigin: '0 0', pointerEvents: 'none' });
    v.appendChild(c); this.clone = c; this.cw = el.page.offsetWidth; this.ch = el.page.offsetHeight;
  },
  draw(now) {
    if (!this.on) return;
    if (!now) { if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(true); }); return; }
    const { w, h } = this.dims(), z = clamp(+S.magZoom || 2, 1.25, 5);
    let x = clamp(this.x, 8, innerWidth - 8), y = clamp(this.y, 8, innerHeight - 8);
    if (this.adjust) { const p = this.parkSpot(); x = p.x; y = p.y; }
    this.el.style.transform = `translate(${Math.round(x - w / 2)}px, ${Math.round(y - h / 2)}px)`;
    const cv = $('#lensCanvas'), view = $('#lensView');
    if (R.kind === 'flow') {
      cv.hidden = true; view.hidden = false;
      if (this.dirty || !this.clone || el.page.offsetWidth !== this.cw || el.page.offsetHeight !== this.ch) this.rebuild();
      const r = el.page.getBoundingClientRect();
      this.clone.style.transform = `translate(${w / 2 - (x - r.left) * z}px, ${h / 2 - (y - r.top) * z}px) scale(${z})`;
      return;
    }
    cv.hidden = false; view.hidden = true;
    const dpr = cv.width / w, g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.fillStyle = getComputedStyle(el.reader).getPropertyValue('--r-bg') || '#000'; g.fillRect(0, 0, cv.width, cv.height);
    const sx0 = x - w / (2 * z), sy0 = y - h / (2 * z), sx1 = x + w / (2 * z), sy1 = y + h / (2 * z);
    let filt = 'none';
    for (const pg of PV.els) {
      const shown = pg.querySelector('canvas, img'); if (!shown) continue;
      const rr = shown.getBoundingClientRect();
      if (rr.right < sx0 || rr.left > sx1 || rr.bottom < sy0 || rr.top > sy1 || !rr.width) continue;
      const src = this.sharp(+pg.dataset.i, shown) || shown;
      const nw = src.naturalWidth || src.width, nh = src.naturalHeight || src.height; if (!nw || !nh) continue;
      const ix0 = Math.max(rr.left, sx0), iy0 = Math.max(rr.top, sy0), ix1 = Math.min(rr.right, sx1), iy1 = Math.min(rr.bottom, sy1);
      const kx = nw / rr.width, ky = nh / rr.height;
      try { g.drawImage(src, (ix0 - rr.left) * kx, (iy0 - rr.top) * ky, (ix1 - ix0) * kx, (iy1 - iy0) * ky, ((ix0 - x) * z + w / 2) * dpr, ((iy0 - y) * z + h / 2) * dpr, (ix1 - ix0) * z * dpr, (iy1 - iy0) * z * dpr); } catch (e) { /* page still rendering */ }
      filt = getComputedStyle(shown).filter;
    }
    cv.style.filter = filt && filt !== 'none' ? filt : '';
  },
  /* PDF pages are re-rendered at the lens zoom so magnified text stays crisp */
  sharp(i, shown) {
    if (R.kind !== 'pdf' || !R.doc || !R.doc.pdf) return null;
    const dpr = Math.min(2, devicePixelRatio || 1), want = Math.min(4096, Math.round(shown.getBoundingClientRect().width * clamp(+S.magZoom || 2, 1.25, 5) * dpr));
    const have = this.hi.get(i);
    if (have && have.width >= want * 0.9) return have;
    if (!this.hiBusy.has(i)) {
      this.hiBusy.add(i); const doc = R.doc;
      doc.pdf.getPage(i + 1).then(async page => {
        const v1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: want / v1.width });
        const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: g, viewport: vp }).promise;
        if (R.doc === doc) { this.hi.set(i, c); if (this.hi.size > 4) this.hi.delete(this.hi.keys().next().value); this.draw(); }
      }).catch(() => {}).finally(() => this.hiBusy.delete(i));
    }
    return have || null;
  },
  move(x, y) { this.x = x; this.y = y; this.draw(); }
};
(function () {
  const pill = () => $('#lensPill');
  document.addEventListener('pointerover', e => { if (Mag.on && e.target.closest && e.target.closest('#lensPill')) Mag.park(true); });
  document.addEventListener('pointerdown', e => { if (Mag.on && e.target.closest && e.target.closest('#lensPill')) Mag.park(true); }, true);
  document.addEventListener('pointerout', e => { if (!Mag.on || e.pointerType !== 'mouse') return; const p = pill(); if (p && p.contains(e.target) && !(e.relatedTarget && p.contains(e.relatedTarget))) Mag.park(false); });
  document.addEventListener('focusin', e => { if (Mag.on && e.target.closest && e.target.closest('#lensPill')) Mag.park(true); });
  document.addEventListener('pointermove', e => {
    if (!Mag.on || e.pointerType !== 'mouse' || Mag.drag || Mag.adjust) return;
    if (!e.target.closest || !e.target.closest('#stage')) return;
    Mag.move(e.clientX, e.clientY);
  }, { passive: true });
  const lens = () => $('#lens');
  document.addEventListener('pointerdown', e => {
    if (!Mag.on || !e.target.closest || !e.target.closest('#lens')) return;
    e.stopPropagation(); e.preventDefault();
    if (Mag.adjust) { const r = lens().getBoundingClientRect(); Mag.x = r.left + r.width / 2; Mag.y = r.top + r.height / 2; Mag.saved = null; Mag.park(false); }
    Mag.drag = { id: e.pointerId, dx: e.clientX - Mag.x, dy: e.clientY - Mag.y };
    try { lens().setPointerCapture(e.pointerId); } catch (x) { /* fine */ }
    lens().classList.add('lift');
  }, true);
  document.addEventListener('pointermove', e => { if (Mag.drag && e.pointerId === Mag.drag.id) { e.preventDefault(); Mag.move(e.clientX - Mag.drag.dx, e.clientY - Mag.drag.dy); } }, { passive: false });
  const end = e => { if (Mag.drag && e.pointerId === Mag.drag.id) { Mag.drag = null; lens().classList.remove('lift'); } };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  ['scroll'].forEach(k => { el.flow.addEventListener(k, () => Mag.draw(), { passive: true }); el.pdfview.addEventListener(k, () => Mag.draw(), { passive: true }); });
  addEventListener('resize', debounce(() => { if (Mag.on) { Mag.dirty = true; Mag.shape(); } }, 120));
})();
/* ================= Watch & compare: a video beside the book =================
   Split the reader in two: the comic or book on one side, its film or animated adaptation on the other.
   Link pages to moments in the video so either one can lead the other, and mark each page as matching,
   changed or missing in the video to build an accuracy report. Links and notes are saved with the book
   (encrypted for Private books). The video itself stays on the device and is never uploaded. */
const VICON = {
  film: '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9h18M3 15h18M8 5v4M16 5v4M8 15v4M16 15v4"/></svg>',
  play: '<svg class="i" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z"/></svg>',
  pause: '<svg class="i" viewBox="0 0 24 24"><path d="M8.5 5v14M15.5 5v14" style="stroke-width:2.6"/></svg>',
  back5: '<svg class="i" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/><text x="12.3" y="15.6" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">5</text></svg>',
  fwd5: '<svg class="i" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/><text x="11.7" y="15.6" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">5</text></svg>',
  fprev: '<svg class="i" viewBox="0 0 24 24"><path d="M6 5v14"/><path d="M18 6l-8 6 8 6z"/></svg>',
  fnext: '<svg class="i" viewBox="0 0 24 24"><path d="M18 5v14"/><path d="M6 6l8 6-8 6z"/></svg>',
  vol: '<svg class="i" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  mute: '<svg class="i" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  full: '<svg class="i" viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
  swap: '<svg class="i" viewBox="0 0 24 24"><path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/></svg>',
  link: '<svg class="i" viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>',
  report: '<svg class="i" viewBox="0 0 24 24"><path d="M5 20V10M10 20V4M15 20v-7M20 20v-11"/></svg>',
  close: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  open: '<svg class="i" viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>'
};
const RATES = [['match', '✓', 'Matches'], ['changed', '≈', 'Changed'], ['missing', '✕', 'Missing']];
const fmtT = s => { if (!isFinite(s) || s < 0) s = 0; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.floor(s % 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const Watch = {
  on: false, url: null, file: null, view: 'watch', lastKey: null, userNavAt: 0, lastMark: null, tick: null, noteT: null,
  get v() { return $('#vidEl'); },
  data() { const m = R.meta; if (!m) return null; if (!m.video) m.video = { name: '', size: 0, marks: [], ratings: {} }; m.video.marks = m.video.marks || []; m.video.ratings = m.video.ratings || {}; return m.video; },
  save() { if (R.meta) saveMetaSoon(); },
  /* where the reader is: a page for PDFs and comics, a section for text books */
  here() {
    if (!R.doc) return null;
    if (R.kind === 'flow') { const r = typeof chapterR === 'function' ? chapterR() : 0; return { key: 'c' + R.ch, ch: R.ch, r, label: (R.doc.chapters[R.ch] && R.doc.chapters[R.ch].title) || 'Section ' + (R.ch + 1), ord: R.ch + Math.min(0.999, r || 0) }; }
    return { key: 'p' + PV.cur, page: PV.cur, label: 'Page ' + (PV.cur + 1), ord: PV.cur };
  },
  units() { return R.kind === 'flow' ? R.doc.chapters.length : (R.doc.numPages || 0); },
  go(loc) {
    if (!loc) return;
    this.userNavAt = 0;
    if (R.kind === 'flow') { if (loc.ch === R.ch && isPaged && !isPaged()) { el.flow.scrollTop = (loc.r || 0) * (el.flow.scrollHeight - el.flow.clientHeight); onPos(); } else renderChapter(loc.ch, { r: loc.r || 0 }); }
    else PV.goto(loc.page, 0);
    this.lastKey = loc.key;
  },
  toggle() { this.on ? this.close() : this.open(); },
  open() {
    if (!R.open || !R.doc) return;
    this.on = true; Mag.off(); Panel.close();
    el.reader.classList.add('split'); $('#vid').hidden = false;
    this.layout(); this.render();
    $$('[data-act="watch"]').forEach(b => b.setAttribute('aria-pressed', 'true'));
    clearInterval(this.tick); this.tick = setInterval(() => this.poll(), 400);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
    if (!this.url) { const d = this.data(); toast(d && d.name ? `Choose “${d.name}” again to continue where you left off. Videos stay on your device.` : 'Choose a video from your device to watch beside the book.', 4200); }
  },
  theater(on) {
    const want = on == null ? !el.reader.classList.contains('vid-full') : on;
    el.reader.classList.toggle('vid-full', want);
    const pane = $('#vid');
    if (want) { try { const r = (pane.requestFullscreen || pane.webkitRequestFullscreen); if (r && !document.fullscreenElement) { const p = r.call(pane); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* stays full window */ } }
    else if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { /* none */ } }
    $('#vidTheaterBtn').setAttribute('aria-label', want ? 'Back to split view' : 'Video only, full screen');
    this.wake();
  },
  wake() {
    const st = $('#vidStage'); if (!st) return;
    st.classList.remove('idle'); clearTimeout(this.idleT);
    const hide = () => {
      if (!this.url || this.v.paused) return;
      /* never hide while the pointer rests on the controls, or while a control has keyboard focus */
      if (st.querySelector('.vid-ctl:hover, .vid-top:hover') || (document.activeElement && document.activeElement !== this.v && st.contains(document.activeElement) && document.activeElement.matches(':focus-visible'))) { this.idleT = setTimeout(hide, 1200); return; }
      st.classList.add('idle');
    };
    this.idleT = setTimeout(hide, 2600);
  },
  flash(icon) { const f = $('#vidFlash'); if (!f) return; f.innerHTML = icon; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); },
  close(quiet) {
    if (!this.on) return;
    this.theater(false);
    this.on = false; clearInterval(this.tick);
    try { this.v.pause(); } catch (e) { /* none */ }
    el.reader.classList.remove('split', 'split-left', 'split-stack'); document.body.classList.remove('vstack'); $('#vid').hidden = true;
    $$('[data-act="watch"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (!quiet) setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
  },
  unload() { this.close(true); try { this.v.removeAttribute('src'); this.v.load(); } catch (e) { /* none */ } if (this.url) URL.revokeObjectURL(this.url); this.url = null; this.file = null; this.lastKey = null; },
  async load(file) {
    if (!file) return;
    if (!(await isVideoFile(file))) { toast('Choose a video file, such as MP4 or WebM.'); return; }
    if (this.url) URL.revokeObjectURL(this.url);
    this.file = file; this.url = URL.createObjectURL(file);
    const v = this.v; v.src = this.url; v.playbackRate = S.vidRate || 1; v.muted = !!S.vidMuted;
    const d = this.data(), same = d.name === file.name && d.size === file.size;
    if (d.marks.length && !same && d.name) toast(`Your links were made with “${d.name}”. They are kept; remove them in the report if this is a different video.`, 6000);
    d.name = file.name; d.size = file.size; this.save();
    if (!this.on) this.open(); else this.render();
  },
  layout() {
    const stack = innerWidth < 760 && innerHeight > innerWidth;
    el.reader.classList.toggle('split-stack', stack); document.body.classList.toggle('vstack', stack && this.on);
    el.reader.classList.toggle('split-left', !stack && S.vidSide === 'left');
    el.reader.style.setProperty('--vw', clamp(S.vidSplit || 44, 26, 72) + 'vw');
    el.reader.style.setProperty('--vh', clamp(S.vidSplitV || 42, 26, 66) + 'vh');
    $('#vidSplit').setAttribute('aria-orientation', stack ? 'horizontal' : 'vertical');
  },
  render() {
    const d = this.data(), v = this.v, has = !!this.url, h = this.here();
    $('#vidName').textContent = has ? (this.file && this.file.name) : 'Video';
    $('#vidEmpty').hidden = has; v.hidden = !has;
    $('#vidEmpty').innerHTML = `<div class="ve-ic">${VICON.film}</div><b>Watch beside the book</b><p>${d.name ? `Last time you watched <strong>${esc(d.name)}</strong>. Choose it again to continue with your ${d.marks.length} ${d.marks.length === 1 ? 'link' : 'links'}.` : 'Choose the film or animated version of this book. It plays here while you read, and you can link pages to moments.'}</p><label class="btn primary" for="videoInput">${VICON.open}Choose video</label><small>MP4 and WebM work on every device. Nothing is uploaded.</small>`;
    $('#vidCtl').hidden = !has; $('#vidSync').hidden = !has; $('#vidStage').classList.toggle('has', has);
    const dock = has && S.vidDock === 'open';
    $('#dockBody').hidden = !dock; $('#vidDock').classList.toggle('open', dock);
    const tg = $('#vidDockTg'); tg.setAttribute('aria-expanded', String(dock)); tg.setAttribute('aria-label', dock ? 'Hide compare tools' : 'Show compare tools');
    this.ctl(); this.sync(); this.marksBar();
    $('#vidReport').hidden = this.view !== 'report'; $('#vidCompare').hidden = this.view === 'report';
    if (this.view === 'report') this.report(); else this.compare(h);
  },
  ctl() {
    /* Only touch the DOM when something actually changed. Rebuilding the buttons on every
       timeupdate swapped the icon under the pointer and made mouse clicks get lost. */
    const v = this.v, c = this._c || (this._c = {}), set = (k, val, fn) => { if (c[k] !== val) { c[k] = val; fn(val); } };
    set('play', v.paused, p => { const b = $('#vidPlay'); b.innerHTML = p ? VICON.play : VICON.pause; b.setAttribute('aria-label', p ? 'Play' : 'Pause'); b.title = (p ? 'Play' : 'Pause') + ' (Space)'; });
    set('mute', v.muted, m => { $('#vidMute').innerHTML = m ? VICON.mute : VICON.vol; });
    set('rate', (S.vidRate || 1) + '×', t => { $('#vidSpeed').textContent = t; });
    set('time', `${fmtT(v.currentTime)} / ${fmtT(v.duration)}`, t => { $('#vidTime').textContent = t; });
    const sc = $('#vidScrub'); if (!this.scrubbing) { const val = v.duration ? Math.round(v.currentTime / v.duration * 1000) : 0; set('scrub', val, x => { sc.value = x; sc.style.setProperty('--p', (x / 10) + '%'); }); }
  },
  marksBar() {
    const d = this.data(), v = this.v, box = $('#vidMarks'); if (!box) return;
    box.innerHTML = v.duration ? d.marks.map(m => `<button class="vmk" data-act="vidSeekMark" data-id="${m.id}" style="left:${(m.t / v.duration * 100).toFixed(2)}%" title="${esc(m.label)} · ${fmtT(m.t)}" aria-label="Go to ${esc(m.label)} at ${fmtT(m.t)}"></button>`).join('') : '';
  },
  sync() {
    const h = this.here(); if (!h) return;
    const b = $('#vidLink'), t = fmtT(this.v.currentTime);
    if (!b.querySelector('.vl-p')) b.innerHTML = `${VICON.link}<span>Link <b class="vl-p"></b> to <b class="vl-t"></b></span>`;
    const p = b.querySelector('.vl-p'), q = b.querySelector('.vl-t');
    if (p.textContent !== h.label) p.textContent = h.label;
    if (q.textContent !== t) q.textContent = t;
    const f = S.vidFollow || 'off';
    if (this._f !== f) { this._f = f; $$('#vidFollow button').forEach(x => x.setAttribute('aria-pressed', String(f === x.dataset.val))); }
  },
  compare(h) {
    const d = this.data(), box = $('#vidCompare'); if (!box || !h) return;
    const r = d.ratings[h.key] || {};
    const linked = d.marks.filter(m => m.key === h.key);
    box.innerHTML = `<div class="vc-h"><span>How does <b>${esc(h.label)}</b> look in the video?</span><button class="vbtn ghost" data-act="vidView" data-val="report">${VICON.report}Report</button></div>
      <div class="vc-rates" role="group" aria-label="Rate this ${R.kind === 'flow' ? 'section' : 'page'}">${RATES.map(([k, s, l]) => `<button class="vrate r-${k}" data-act="vidRate" data-val="${k}" aria-pressed="${r.s === k}"><i>${s}</i>${l}</button>`).join('')}</div>
      <textarea id="vidNote" rows="2" placeholder="What is different? (optional)">${esc(r.note || '')}</textarea>
      ${linked.length ? `<div class="vc-links">${linked.map(m => `<button class="vchip" data-act="vidSeekMark" data-id="${m.id}">${VICON.play}${fmtT(m.t)}</button>`).join('')}</div>` : ''}`;
  },
  report() {
    const d = this.data(), box = $('#vidReport'), n = this.units();
    const keys = Object.keys(d.ratings).filter(k => d.ratings[k] && d.ratings[k].s);
    const c = { match: 0, changed: 0, missing: 0 }; keys.forEach(k => c[d.ratings[k].s]++);
    const rated = keys.length, acc = rated ? Math.round((c.match + c.changed * 0.5) / rated * 100) : 0, cov = n ? Math.round(rated / n * 100) : 0;
    const lab = k => k[0] === 'p' ? 'Page ' + (+k.slice(1) + 1) : ((R.doc.chapters[+k.slice(1)] || {}).title || 'Section ' + (+k.slice(1) + 1));
    const ord = k => +k.slice(1);
    const diffs = keys.filter(k => d.ratings[k].s !== 'match').sort((a, b) => ord(a) - ord(b));
    const marks = d.marks.slice().sort((a, b) => a.t - b.t);
    const C = 2 * Math.PI * 34;
    box.innerHTML = `<div class="vc-h"><span><b>Accuracy report</b></span><button class="vbtn ghost" data-act="vidView" data-val="watch">${VICON.close}Close</button></div>
      <div class="vr-top"><div class="vr-ring"><svg viewBox="0 0 80 80"><circle class="trk" cx="40" cy="40" r="34"/><circle class="val" cx="40" cy="40" r="34" stroke-dasharray="${(C * acc / 100).toFixed(1)} ${C.toFixed(1)}"/></svg><b>${rated ? acc + '%' : '–'}</b></div>
        <div class="vr-nums"><span><i class="dot match"></i>${c.match} match</span><span><i class="dot changed"></i>${c.changed} changed</span><span><i class="dot missing"></i>${c.missing} missing</span><small>${rated} of ${n} ${R.kind === 'flow' ? 'sections' : 'pages'} rated (${cov}%)</small></div></div>
      <p class="vr-how">Accuracy counts a match as 1, a change as ½ and a missing ${R.kind === 'flow' ? 'section' : 'page'} as 0.</p>
      ${diffs.length ? `<h4>Differences</h4><ul class="vr-list">${diffs.map(k => { const r = d.ratings[k], m = d.marks.find(x => x.key === k); return `<li><button data-act="vidGoKey" data-key="${k}"><i class="dot ${r.s}"></i><b>${esc(lab(k))}</b>${m ? `<span class="t">${fmtT(m.t)}</span>` : ''}<span class="n">${esc(r.note || (r.s === 'missing' ? 'Not in the video' : 'Changed in the video'))}</span></button></li>`; }).join('')}</ul>` : '<p class="vr-how">No differences marked yet.</p>'}
      ${marks.length ? `<h4>Links <span>${marks.length}</span></h4><ul class="vr-list links">${marks.map(m => `<li><button data-act="vidSeekMark" data-id="${m.id}"><b>${esc(m.label)}</b><span class="t">${fmtT(m.t)}</span></button><button class="x" data-act="vidDelMark" data-id="${m.id}" aria-label="Remove link">${VICON.close}</button></li>`).join('')}</ul>` : ''}
      <div class="vr-act"><button class="vbtn" data-act="vidCopy">Copy report</button>${rated || marks.length ? '<button class="vbtn danger" data-act="vidClear">Clear all</button>' : ''}</div>`;
  },
  rate(k) {
    const h = this.here(), d = this.data(); if (!h) return;
    const cur = d.ratings[h.key] || {};
    d.ratings[h.key] = { s: cur.s === k ? null : k, note: cur.note || '' };
    if (!d.ratings[h.key].s && !d.ratings[h.key].note) delete d.ratings[h.key];
    this.save(); this.compare(h);
  },
  note(txt) { const h = this.here(), d = this.data(); if (!h) return; const cur = d.ratings[h.key] || {}; d.ratings[h.key] = { s: cur.s || null, note: txt }; if (!d.ratings[h.key].s && !txt) delete d.ratings[h.key]; clearTimeout(this.noteT); this.noteT = setTimeout(() => this.save(), 400); },
  link() {
    const h = this.here(), d = this.data(); if (!h || !this.url) return;
    const t = Math.round(this.v.currentTime * 10) / 10;
    const ex = d.marks.find(m => m.key === h.key && Math.abs(m.t - t) < 1);
    if (ex) { toast(`${h.label} is already linked at ${fmtT(ex.t)}.`); return; }
    d.marks.push({ id: uid('m'), key: h.key, t, label: h.label, loc: R.kind === 'flow' ? { ch: h.ch, r: h.r } : { page: h.page }, ord: h.ord });
    d.marks.sort((a, b) => a.t - b.t);
    this.lastMark = d.marks.find(m => m.key === h.key && m.t === t).id;
    this.save(); this.marksBar(); this.compare(h);
    toast(`Linked ${h.label} to ${fmtT(t)}`, 1600);
  },
  seekMark(id, alsoBook = true) {
    const m = this.data().marks.find(x => x.id === id); if (!m) return;
    if (this.url) this.v.currentTime = m.t;
    if (alsoBook) { this.lastMark = m.id; this.go(Object.assign({ key: m.key }, m.loc)); }
  },
  /* keep book and video together */
  poll() {
    if (!this.on || !R.doc) return;
    const h = this.here(); if (!h) return;
    const f = S.vidFollow || 'off', d = this.data();
    if (h.key !== this.lastKey) {
      const userMoved = this.lastKey !== null;
      this.lastKey = h.key;
      if (userMoved) this.userNavAt = Date.now();
      if (f === 'page' && this.url && d.marks.length) {
        const exact = d.marks.filter(m => m.key === h.key)[0];
        const before = exact || d.marks.filter(m => (m.ord != null ? m.ord : 0) <= h.ord).sort((a, b) => (b.ord || 0) - (a.ord || 0) || a.t - b.t)[0];
        if (before && Math.abs(this.v.currentTime - before.t) > 1.5) { this.v.currentTime = before.t; this.lastMark = before.id; }
      }
      this.sync(); if (this.view !== 'report') this.compare(h);
    }
    if (f === 'video' && this.url && !this.v.paused && d.marks.length && Date.now() - this.userNavAt > 2500) {
      const t = this.v.currentTime, m = d.marks.filter(x => x.t <= t + 0.05).pop();
      if (m && m.id !== this.lastMark && m.key !== h.key) { this.lastMark = m.id; this.go(Object.assign({ key: m.key }, m.loc)); }
      else if (m) this.lastMark = m.id;
    }
  },
  copy() {
    const d = this.data(), n = this.units();
    const keys = Object.keys(d.ratings).filter(k => d.ratings[k] && d.ratings[k].s);
    const c = { match: 0, changed: 0, missing: 0 }; keys.forEach(k => c[d.ratings[k].s]++);
    const acc = keys.length ? Math.round((c.match + c.changed * 0.5) / keys.length * 100) : 0;
    const lab = k => k[0] === 'p' ? 'Page ' + (+k.slice(1) + 1) : ((R.doc.chapters[+k.slice(1)] || {}).title || 'Section ' + (+k.slice(1) + 1));
    const lines = [`${R.meta.title} vs ${d.name || 'video'}`, `Accuracy: ${keys.length ? acc + '%' : 'not rated yet'} (${c.match} match, ${c.changed} changed, ${c.missing} missing; ${keys.length} of ${n} rated)`, ''];
    keys.filter(k => d.ratings[k].s !== 'match').sort((a, b) => +a.slice(1) - +b.slice(1)).forEach(k => { const m = d.marks.find(x => x.key === k); lines.push(`- ${lab(k)}${m ? ' @ ' + fmtT(m.t) : ''}: ${d.ratings[k].s}${d.ratings[k].note ? ' — ' + d.ratings[k].note : ''}`); });
    const text = lines.join('\n');
    const done = () => toast('Report copied');
    try { navigator.clipboard.writeText(text).then(done, () => { this.copyFallback(text); }); } catch (e) { this.copyFallback(text); }
  },
  copyFallback(text) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); toast('Report copied'); } catch (e) { toast('Copy was blocked. Select the report text instead.'); } t.remove(); },
  clear(btn) {
    if (!btn.dataset.armed) { btn.dataset.armed = '1'; btn.textContent = 'Tap again to clear'; return; }
    const d = this.data(); d.marks = []; d.ratings = {}; this.save(); this.marksBar(); this.report(); toast('Links and ratings cleared');
  }
};
/* ---- controls ---- */
(function () {
  const v = () => Watch.v;
  const A = {
    watch: () => Watch.toggle(),
    vidClose: () => Watch.close(),
    vidPlay: () => { const x = v(); if (!Watch.url) return; if (x.paused) { x.play().catch(() => {}); Watch.flash(VICON.play); } else { x.pause(); Watch.flash(VICON.pause); } Watch.wake(); },
    vidTheater: () => Watch.theater(),
    vidDock: () => { S.vidDock = S.vidDock === 'open' ? 'closed' : 'open'; saveSettings(); Watch.render(); },
    vidBack: () => { v().currentTime = Math.max(0, v().currentTime - 5); },
    vidFwd: () => { v().currentTime = Math.min(v().duration || 0, v().currentTime + 5); },
    vidFrame: t => { const x = v(); x.pause(); x.currentTime = clamp(x.currentTime + (+t.dataset.d) / 30, 0, x.duration || 0); },
    vidSpeed: () => { const L = [0.5, 0.75, 1, 1.25, 1.5, 2]; const i = L.indexOf(S.vidRate || 1); S.vidRate = L[(i + 1) % L.length]; saveSettings(); v().playbackRate = S.vidRate; Watch.ctl(); },
    vidMute: () => { v().muted = !v().muted; S.vidMuted = v().muted; saveSettings(); Watch.ctl(); },
    vidSwap: () => { S.vidSide = S.vidSide === 'left' ? 'right' : 'left'; saveSettings(); Watch.layout(); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); },
    vidLink: () => Watch.link(),
    vidFollowSet: t => { S.vidFollow = t.dataset.val; saveSettings(); Watch.sync(); Watch.lastMark = null; toast(S.vidFollow === 'video' ? 'Pages now turn with the video at each link.' : S.vidFollow === 'page' ? 'The video now jumps to the linked moment when you turn the page.' : 'Book and video move on their own.', 2600); },
    vidRate: t => Watch.rate(t.dataset.val),
    vidView: t => { Watch.view = t.dataset.val; S.vidDock = 'open'; Watch.render(); },
    vidSeekMark: t => Watch.seekMark(t.dataset.id),
    vidGoKey: t => { const k = t.dataset.key, m = Watch.data().marks.find(x => x.key === k); if (m) Watch.seekMark(m.id); else Watch.go(k[0] === 'p' ? { key: k, page: +k.slice(1) } : { key: k, ch: +k.slice(1), r: 0 }); },
    vidDelMark: t => { const d = Watch.data(); d.marks = d.marks.filter(m => m.id !== t.dataset.id); Watch.save(); Watch.marksBar(); Watch.report(); },
    vidCopy: () => Watch.copy(),
    vidClear: t => Watch.clear(t)
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t || !A[t.dataset.act]) return;
    e.preventDefault(); e.stopPropagation(); A[t.dataset.act](t);
  }, true);
  document.addEventListener('change', e => { if (e.target.id === 'videoInput') { const f = e.target.files && e.target.files[0]; e.target.value = ''; Watch.load(f); } });
  document.addEventListener('input', e => {
    if (e.target.id === 'vidNote') Watch.note(e.target.value);
    if (e.target.id === 'vidScrub') { const x = v(); Watch.scrubbing = true; if (x.duration) x.currentTime = e.target.value / 1000 * x.duration; e.target.style.setProperty('--p', (e.target.value / 10) + '%'); }
  });
  document.addEventListener('change', e => { if (e.target.id === 'vidScrub') Watch.scrubbing = false; });
  const vid = $('#vidEl');
  ['play', 'pause', 'ratechange', 'volumechange'].forEach(k => vid.addEventListener(k, () => Watch.ctl()));
  vid.addEventListener('timeupdate', () => { Watch.ctl(); Watch.sync(); });
  vid.addEventListener('loadedmetadata', () => { Watch.ctl(); Watch.marksBar(); });
  let tapWake = false;
  vid.addEventListener('pointerdown', e => { tapWake = e.pointerType !== 'mouse' && $('#vidStage').classList.contains('idle'); }, true);
  vid.addEventListener('click', () => { if (tapWake) { tapWake = false; Watch.wake(); return; } A.vidPlay(); });
  vid.addEventListener('dblclick', () => Watch.theater());
  const stg = $('#vidStage');
  ['pointermove', 'pointerdown'].forEach(k => stg.addEventListener(k, () => Watch.wake(), { passive: true }));
  vid.addEventListener('pause', () => { stg.classList.remove('idle'); clearTimeout(Watch.idleT); });
  vid.addEventListener('play', () => Watch.wake());
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && el.reader.classList.contains('vid-full')) { el.reader.classList.remove('vid-full'); $('#vidTheaterBtn').setAttribute('aria-label', 'Video only, full screen'); } });
  vid.addEventListener('error', () => { if (Watch.url) toast('This video could not be played in this browser. MP4 (H.264) and WebM work everywhere; some MKV and AVI files do not.', 6500); });
  /* keys while the video side has focus: space plays, arrows seek, comma and full stop step one frame */
  document.addEventListener('keydown', e => {
    if (!Watch.on || !e.target.closest || !e.target.closest('#vid')) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName) && e.target.id !== 'vidScrub') return;
    const k = e.key;
    if (k === ' ' || k === 'k') A.vidPlay(); else if (k === 'ArrowLeft') A.vidBack(); else if (k === 'ArrowRight') A.vidFwd();
    else if (k === 'f' || k === 'F') Watch.theater(); else if (k === 'Escape' && el.reader.classList.contains('vid-full')) Watch.theater(false);
    else if (k === ',') A.vidFrame({ dataset: { d: -1 } }); else if (k === '.') A.vidFrame({ dataset: { d: 1 } }); else if (k === 'l' || k === 'L') Watch.link(); else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  /* drag the divider to share the screen */
  const sp = $('#vidSplit'); let drag = null;
  sp.addEventListener('pointerdown', e => { drag = { id: e.pointerId }; sp.setPointerCapture(e.pointerId); el.reader.classList.add('split-drag'); e.preventDefault(); });
  sp.addEventListener('pointermove', e => {
    if (!drag) return;
    if (el.reader.classList.contains('split-stack')) { S.vidSplitV = clamp(Math.round((1 - e.clientY / innerHeight) * 100), 26, 66); }
    else S.vidSplit = clamp(Math.round((S.vidSide === 'left' ? e.clientX / innerWidth : 1 - e.clientX / innerWidth) * 100), 26, 72);
    Watch.layout();
  });
  const end = () => { if (!drag) return; drag = null; el.reader.classList.remove('split-drag'); saveSettings(); window.dispatchEvent(new Event('resize')); };
  sp.addEventListener('pointerup', end); sp.addEventListener('pointercancel', end);
  sp.addEventListener('keydown', e => { const d = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? 2 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? -2 : 0; if (!d) return; e.preventDefault(); if (el.reader.classList.contains('split-stack')) S.vidSplitV = clamp((S.vidSplitV || 42) + d, 26, 66); else S.vidSplit = clamp((S.vidSplit || 44) + (S.vidSide === 'left' ? -d : d), 26, 72); Watch.layout(); saveSettings(); window.dispatchEvent(new Event('resize')); });
  addEventListener('resize', debounce(() => { if (Watch.on) Watch.layout(); }, 100));
})();

/* ================= Private: an encrypted shelf for adult reading =================
   A random data key encrypts every private book (file and details). That key is stored only
   wrapped by a key derived from the reader's PIN (PBKDF2, 250k rounds), so the PIN can change
   without re-encrypting books, and nothing private is readable without it. */
const b64 = u8 => { let s = ''; const a = new Uint8Array(u8); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
const unb64 = s => { const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; };
const Vault = {
  sounds: [],
  key: null, view: false, fails: 0, waitUntil: 0, awayT: null, lastAct: Date.now(), escAt: 0,
  /* Encryption runs on the browser's built-in crypto when the page is on https (or localhost). When it is
     not — a book app opened straight from a phone's file manager, or a plain-http address — the same
     AES-256-GCM and PBKDF2-SHA-256 run in a small audited JavaScript library instead, and the two are
     interchangeable: a shelf made one way opens the other way. */
  native() { return !!(window.crypto && crypto.subtle && window.isSecureContext !== false); },
  supported() { return !!(window.crypto && crypto.getRandomValues); },
  async lib() { return loadLib('asmcrypto'); },
  info() { return ls.get('sp.vault', null); },
  async kek(pin, salt) {
    if (this.native()) {
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
    }
    const A = await this.lib(); await sleep(30);
    return A.PBKDF2_HMAC_SHA256.bytes(new TextEncoder().encode(pin), salt, 250000, 32);
  },
  async wrap(dek, pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const kek = await this.kek(pin, salt);
    let wrapped;
    if (kek instanceof Uint8Array) { const A = await this.lib(); const raw = dek instanceof Uint8Array ? dek : new Uint8Array(await crypto.subtle.exportKey('raw', dek)); wrapped = A.AES_GCM.encrypt(raw, kek, iv); }
    else { const k = dek instanceof Uint8Array ? await crypto.subtle.importKey('raw', dek, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']) : dek; wrapped = await crypto.subtle.wrapKey('raw', k, kek, { name: 'AES-GCM', iv }); }
    ls.set('sp.vault', { v: 1, salt: b64(salt), iv: b64(iv), wrapped: b64(wrapped), at: Date.now() });
    return !!this.info();
  },
  async create(pin) {
    const dek = this.native() ? await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']) : crypto.getRandomValues(new Uint8Array(32));
    if (!(await this.wrap(dek, pin))) throw new Error('storage');
    this.key = dek;
  },
  async unlock(pin) {
    const m = this.info(); if (!m) return false;
    try {
      const kek = await this.kek(pin, unb64(m.salt));
      if (kek instanceof Uint8Array) { const A = await this.lib(); this.key = A.AES_GCM.decrypt(unb64(m.wrapped), kek, unb64(m.iv)); }
      else this.key = await crypto.subtle.unwrapKey('raw', unb64(m.wrapped), kek, { name: 'AES-GCM', iv: unb64(m.iv) }, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    } catch (e) { return false; }
    await this.loadPrivate();
    return true;
  },
  async changePin(pin) { if (!this.key) return false; return this.wrap(this.key, pin); },
  async enc(bytes) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    if (this.key instanceof Uint8Array) { const A = await this.lib(); const out = A.AES_GCM.encrypt(new Uint8Array(bytes instanceof ArrayBuffer ? bytes : bytes.buffer ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) : bytes), this.key, iv); return { iv, data: out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) }; }
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, bytes); return { iv, data };
  },
  async dec(o) {
    if (!this.key) throw new Error('This private book is locked. Unlock Private first.');
    if (this.key instanceof Uint8Array) { const A = await this.lib(); const out = A.AES_GCM.decrypt(new Uint8Array(o.data), this.key, new Uint8Array(o.iv)); return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength); }
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: o.iv }, this.key, o.data);
  },
  async seal(meta) { const s = await this.enc(new TextEncoder().encode(JSON.stringify(meta))); return { id: meta.id, private: true, sealed: s }; },
  async saveSounds() { await DB.putBook({ id: 'vault-sounds', private: true, sounds: this.sounds }); },
  async loadPrivate() {
    books = books.filter(b => !b.private); this.sounds = [];
    const recs = (await DB.allBooks()).filter(r => r.private && r.sealed);
    for (const r of recs) {
      try { const m = JSON.parse(new TextDecoder().decode(await this.dec(r.sealed))); if (r.id === 'vault-sounds') { this.sounds = Array.isArray(m.sounds) ? m.sounds : []; continue; } m.id = r.id; m.private = true; m.highlights = m.highlights || []; m.bookmarks = m.bookmarks || []; books.push(m); }
      catch (e) { /* unreadable record: leave it sealed */ }
    }
  },
  /* ---- entering and leaving ---- */
  enter() {
    if (!this.supported()) { toast('This browser cannot encrypt files here, so Private is not available in it.', 5000); return; }
    if (!this.native()) this.lib().catch(() => toast('Private needs a one-time download of its encryption part. Connect to the internet once and try again.', 6000));
    if (this.key) { this.show(); return; }
    this.gate(this.info() ? 'unlock' : 'setup');
  },
  show() { this.view = true; this.lastAct = Date.now(); closeCardMenus(); renderLibrary(); window.scrollTo(0, 0); },
  lock(silent) {
    const wasOpen = !!this.key || this.view;
    if (R.open && R.meta && R.meta.private) closeReader();
    if (Peek.on && Peek.meta && Peek.meta.private) Peek.close();
    if (String(S.sound).startsWith('custom:p')) { Sound.stop(); setS('sound', 'off'); }
    this.key = null; this.view = false; clearTimeout(this.awayT); this.sounds = [];
    books = books.filter(b => !b.private);
    memFiles.forEach((v, k) => { if (!String(k).startsWith('snd:') && !books.some(b => b.id === k)) memFiles.delete(k); });
    Panel.close(); this.closeGate();
    if (!R.open) renderLibrary();
    if (wasOpen && !silent) toast('Private is locked');
  },
  panic() { this.lock(true); window.scrollTo(0, 0); },
  async erase() {
    const recs = (await DB.allBooks()).filter(r => r.private);
    for (const r of recs) { try { await DB.del(r.id); } catch (e) { /* gone */ } }
    try { for (const k of await DB.fileKeys()) if (String(k).startsWith('snd:p')) await DB.delFile(k); } catch (e) { /* none */ }
    if (String(S.sound).startsWith('custom:p')) { Sound.stop(); setS('sound', 'off'); }
    this.sounds = [];
    try { localStorage.removeItem('sp.vault'); } catch (e) { /* storage blocked */ }
    this.key = null; this.view = false; books = books.filter(b => !b.private);
    this.closeGate(); Panel.close(); renderLibrary();
    toast('The Private shelf was erased from this device');
  },
  /* ---- gate screens ---- */
  gate(mode, msg) {
    const g = $('#vaultGate'); g.hidden = false; document.body.classList.add('gate-open');
    const moon = '<svg class="gate-icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="currentColor" opacity=".16"/><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="2"/><text x="24" y="30" text-anchor="middle" font-size="16" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="800" fill="currentColor" letter-spacing="-.5">18+</text></svg>';
    let h = '';
    if (mode === 'setup') h = `${moon}<h2>Private <small class="age">18+</small></h2>
      <p>A private, locked shelf for adult reading: romance, erotica, adult manga and comics, and books like the Kama Sutra. It is only for people aged 18 or over.</p>
      <form data-form="vaultSetup" class="gate-form" autocomplete="off" novalidate>
        <label class="gate-check"><input type="checkbox" id="vAge" required> <span>I confirm I am 18 or older</span></label>
        <label for="vPin1">Choose a PIN (4 to 12 digits)</label><input class="field pin" id="vPin1" type="password" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="12" required>
        <label for="vPin2">Type it again</label><input class="field pin" id="vPin2" type="password" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="12" required>
        <p class="gate-note">Books you add here are encrypted on this device with your PIN and never appear on your main shelf. If you forget the PIN, the private books cannot be recovered.</p>
        <p class="gate-err" id="vErr" role="alert">${msg || ''}</p>
        <div class="pbtns"><button class="btn primary" type="submit">Create private shelf</button><button class="btn quiet" type="button" data-act="vaultCancel">Not now</button></div>
      </form>`;
    else if (mode === 'unlock') h = `${moon}<h2>Private <small class="age">18+</small></h2><p>Enter your PIN to open your private shelf.</p>
      <form data-form="vaultUnlock" class="gate-form" autocomplete="off" novalidate>
        <label class="sr" for="vPin">PIN</label><input class="field pin big" id="vPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" required placeholder="PIN">
        <p class="gate-err" id="vErr" role="alert">${msg || ''}</p>
        <div class="pbtns"><button class="btn primary" type="submit">Unlock</button><button class="btn quiet" type="button" data-act="vaultCancel">Cancel</button></div>
        <button class="gate-link" type="button" data-act="vaultForgot">Forgot your PIN?</button>
      </form>`;
    else if (mode === 'erase') h = `${moon}<h2>Erase the Private shelf?</h2><p>Without the PIN the private books cannot be opened. Erasing deletes every private book, highlight and note from this device so you can start again. Your main shelf is not touched.</p>
      <form data-form="vaultErase" class="gate-form" autocomplete="off" novalidate>
        <label for="vErase">Type ERASE to confirm</label><input class="field" id="vErase" autocapitalize="characters" required>
        <p class="gate-err" id="vErr" role="alert">${msg || ''}</p>
        <div class="pbtns"><button class="btn danger-fill" type="submit">Erase private shelf</button><button class="btn quiet" type="button" data-act="vaultCancel">Cancel</button></div>
      </form>`;
    g.innerHTML = `<div class="gate-card" role="dialog" aria-modal="true" aria-label="Private 18+">${h}</div>`;
    setTimeout(() => { const f = g.querySelector('input:not([type=checkbox])') || g.querySelector('input'); if (f) f.focus(); }, 40);
  },
  closeGate() { const g = $('#vaultGate'); g.hidden = true; g.innerHTML = ''; document.body.classList.remove('gate-open'); },
  err(t) { const e = $('#vErr'); if (e) e.textContent = t; const c = $('.gate-card'); if (c && !reduceMotion()) c.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 320 }); },
  busy(on) { $$('#vaultGate button[type=submit]').forEach(b => { if (!b.dataset.label) b.dataset.label = b.textContent; b.disabled = on; b.textContent = on ? 'Working…' : b.dataset.label; }); },
  async submit(kind) {
    if (kind === 'vaultSetup') {
      const a = $('#vPin1').value.trim(), b = $('#vPin2').value.trim();
      if (!$('#vAge').checked) return this.err('Please confirm you are 18 or older.');
      if (!/^\d{4,12}$/.test(a)) return this.err('Use 4 to 12 digits for the PIN.');
      if (a !== b) return this.err('The two PINs do not match.');
      this.busy(true);
      try { await this.create(a); } catch (e) { this.busy(false); return this.err(e && /could not load/.test(e.message || '') ? 'Private needs a one-time download of its encryption part. Connect to the internet and try again.' : 'This browser would not save the private shelf. A regular (non-private) window usually fixes this.'); }
      this.closeGate(); this.show(); toast('Your private shelf is ready. Press Esc twice at any time to lock it instantly.', 5000);
    } else if (kind === 'vaultUnlock') {
      const now = Date.now();
      if (now < this.waitUntil) return this.err(`Too many tries. Wait ${Math.ceil((this.waitUntil - now) / 1000)} seconds.`);
      const pin = $('#vPin').value.trim();
      if (!pin) return;
      this.busy(true);
      const ok = await this.unlock(pin);
      this.busy(false);
      if (!ok) {
        this.fails++; const pinEl = $('#vPin'); if (pinEl) pinEl.value = '';
        if (this.fails >= 5) { this.waitUntil = Date.now() + 30000 * Math.pow(2, this.fails - 5); return this.err(`That PIN is not right. Wait ${Math.round((this.waitUntil - Date.now()) / 1000)} seconds before trying again.`); }
        return this.err('That PIN is not right.');
      }
      this.fails = 0; this.closeGate(); this.show();
    } else if (kind === 'vaultErase') {
      if ($('#vErase').value.trim().toUpperCase() !== 'ERASE') return this.err('Type ERASE in capital letters to confirm.');
      await this.erase();
    } else if (kind === 'vaultPin') {
      const a = $('#vNew1').value.trim(), b = $('#vNew2').value.trim();
      const e = $('#vPinErr');
      if (!/^\d{4,12}$/.test(a)) { e.textContent = 'Use 4 to 12 digits for the PIN.'; return; }
      if (a !== b) { e.textContent = 'The two PINs do not match.'; return; }
      e.textContent = 'Saving…';
      const ok = await this.changePin(a).catch(() => false);
      e.textContent = ok ? 'PIN changed.' : 'The PIN could not be changed here.';
      if (ok) { $('#vNew1').value = ''; $('#vNew2').value = ''; }
    }
  },
  touch() { this.lastAct = Date.now(); }
};
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => document.addEventListener(ev, () => Vault.touch(), { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => {
  clearTimeout(Vault.awayT);
  if (document.hidden && Vault.key && S.vaultLockAway) Vault.awayT = setTimeout(() => Vault.lock(true), 30000);
});
setInterval(() => { if (Vault.key && Date.now() - Vault.lastAct > 15 * 60000) Vault.lock(true); }, 30000);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !(Vault.key || Vault.view)) return;
  const now = Date.now();
  if (now - Vault.escAt < 650) { Vault.escAt = 0; Vault.panic(); e.stopImmediatePropagation(); }
  else Vault.escAt = now;
}, true);

/* ================= Read aloud (speech synthesis) ================= */
const Speak = {
  on: false, paused: false, b: 0, page: 0, q: [], qi: 0, u: null,
  supported() { return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'; },
  voices() { try { return speechSynthesis.getVoices() || []; } catch (e) { return []; } },
  voice() {
    const vs = this.voices(); if (!vs.length) return null;
    const v = vs.find(x => x.voiceURI === S.ttsVoice); if (v) return v;
    const lang = (R.doc && R.doc.lang) || navigator.language || 'en';
    const same = vs.filter(x => x.lang && x.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    return same.find(x => /natural|neural|google|premium|enhanced/i.test(x.name)) || same.find(x => x.default) || same[0] || vs.find(x => x.default) || vs[0];
  },
  chunks(text) {
    const out = []; const re = /[^.!?…]+(?:[.!?…]+["'”’)\]]*)?\s*/g; let m;
    while ((m = re.exec(text))) {
      let s = m.index, str = m[0];
      while (str.length > 220) { let cut = str.lastIndexOf(', ', 200); if (cut < 60) cut = str.lastIndexOf(' ', 200); if (cut < 40) cut = 200; out.push({ t: str.slice(0, cut + 1), s, e: s + cut + 1 }); s += cut + 1; str = str.slice(cut + 1); }
      if (str.trim()) out.push({ t: str, s, e: s + str.length });
      if (m[0] === '') re.lastIndex++;
    }
    return out.filter(c => /[\p{L}\p{N}]/u.test(c.t));
  },
  async start(fromBlock) {
    if (!R.open || !R.doc) return;
    if (!this.supported()) { toast('Read aloud is not available in this browser.'); return; }
    if (R.kind === 'images') { toast('Comic pages are pictures, so there is no text to read aloud.'); return; }
    this.stop(true); Auto.stop(); if (Rsvp.on) Rsvp.close();
    this.on = true; this.paused = false; this.fails = 0;
    if (R.kind === 'flow') { this.b = fromBlock != null ? fromBlock : (S.spot && R.active >= 0 ? R.active : Math.max(0, firstVisibleBlock())); this.loadBlock(); }
    else { this.page = PV.cur; await this.loadPage(); }
    $('#ttsPill').hidden = false; this.label(); Wake.on(); Panel.close();
    this.speak();
  },
  loadBlock() { const blk = R.blocks[this.b]; this.q = blk ? this.chunks(blk.textContent) : []; this.qi = 0; },
  async loadPage() {
    const p = this.page; let t = R.doc._texts && R.doc._texts[p];
    if (t == null) { try { const pg = await R.doc.pdf.getPage(p + 1); const tc = await pg.getTextContent(); t = tc.items.map(it => (it.str || '') + (it.hasEOL ? ' ' : '')).join(''); } catch (e) { t = ''; } R.doc._texts = R.doc._texts || []; R.doc._texts[p] = t; }
    this.q = this.chunks(normWs(t)); this.qi = 0;
  },
  async advance() {
    if (R.kind === 'flow') {
      this.b++;
      if (this.b >= R.blocks.length) {
        if (R.ch < R.doc.chapters.length - 1) { await renderChapter(R.ch + 1); this.b = 0; }
        else { this.stop(); toast('Finished reading aloud'); return false; }
      }
      this.loadBlock(); return true;
    }
    this.page++;
    if (this.page >= R.doc.numPages) { this.stop(); toast('Finished reading aloud'); return false; }
    if (PV.book) { if (!PV.viewPages(PV.cur).includes(this.page)) PV.turn(1); } else PV.goto(this.page, 0);
    await this.loadPage(); return true;
  },
  async speak() {
    if (!this.on || this.paused) return;
    let guard = 0;
    while (this.qi >= this.q.length) { if (++guard > 400) { this.stop(); return; } if (!(await this.advance())) return; }
    const item = this.q[this.qi];
    if (R.kind === 'flow') {
      const blk = R.blocks[this.b];
      if (blk) {
        const fr = el.flow.getBoundingClientRect(), r = blk.getBoundingClientRect();
        if (r.top < fr.top + 60 || r.top > fr.bottom - 120) { if (isPaged()) scrollToEl(blk); else { progScroll(); el.flow.scrollTo({ top: el.flow.scrollTop + r.top - fr.top - fr.height * 0.3, behavior: reduceMotion() ? 'auto' : 'smooth' }); } }
        if (S.spot) Spot.set(this.b);
        this.mark('tts-sent', blk, item.s, item.e);
      }
    }
    const u = new SpeechSynthesisUtterance(item.t);
    const v = this.voice(); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = S.ttsRate; u.pitch = 1;
    u.onboundary = e => { if (u !== this.u || e.name !== 'word' || R.kind !== 'flow') return; const blk = R.blocks[this.b]; const len = e.charLength || ((item.t.slice(e.charIndex).match(/^[\p{L}\p{N}'’-]+/u) || [''])[0].length); if (blk && len) this.mark('tts-word', blk, item.s + e.charIndex, item.s + e.charIndex + len); };
    u.onstart = () => { if (u === this.u) this.fails = 0; };
    u.onend = () => { if (u !== this.u) return; this.fails = 0; this.qi++; this.speak(); };
    u.onerror = e => {
      if (u !== this.u) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      this.fails = (this.fails || 0) + 1;
      if (e.error === 'not-allowed') { this.stop(); toast('The browser blocked speech. Press play again to start.'); return; }
      if (this.fails >= 2) { this.stop(); toast('Read aloud stopped because this browser could not speak. Check that a voice is installed on your device.', 6000); return; }
      this.qi++; this.speak();
    };
    this.u = u; touch();
    try { speechSynthesis.speak(u); } catch (e) { this.stop(); toast('Read aloud could not start here.'); }
  },
  mark(name, root, s, e) {
    try {
      if (!window.CSS || !CSS.highlights || typeof Highlight === 'undefined') { root.classList.add('speaking'); return; }
      const r = offsetsToRange(root, s, e); if (!r) return;
      CSS.highlights.set(name, new Highlight(r));
      if (name === 'tts-sent') CSS.highlights.delete('tts-word');
    } catch (err) { /* highlighting is optional */ }
  },
  clearMarks() { try { if (window.CSS && CSS.highlights) { CSS.highlights.delete('tts-sent'); CSS.highlights.delete('tts-word'); } } catch (e) { /* none */ } $$('.speaking', el.content).forEach(b => b.classList.remove('speaking')); },
  cancelSpeech() { this.u = null; try { speechSynthesis.cancel(); } catch (e) { /* none */ } },
  toggle() { if (!this.on) return this.start(); this.paused = !this.paused; if (this.paused) this.cancelSpeech(); else this.speak(); this.label(); },
  skip(d) {
    if (!this.on) return;
    this.cancelSpeech(); this.clearMarks();
    if (R.kind === 'flow') { this.b = clamp(this.b + d, 0, Math.max(0, R.blocks.length - 1)); this.loadBlock(); }
    else this.qi = clamp(this.qi + d * 3, 0, Math.max(0, this.q.length - 1));
    this.paused = false; this.label(); this.speak();
  },
  stop(silent) {
    if (!this.on && silent) return;
    this.on = false; this.paused = false; this.cancelSpeech(); this.clearMarks();
    $('#ttsPill').hidden = true;
    if (!Session.active && !R.deep && !Rsvp.on && !Lamp.on) Wake.off();
    if (Panel.kind === 'focus') Panel.refresh();
  },
  label() {
    const v = this.voice();
    $('#ttsLbl').textContent = (this.paused ? 'Paused' : 'Reading aloud') + (v ? ' · ' + v.name.replace(/^(Microsoft|Google)\s+/, '').split(/[-(]/)[0].trim() : '');
    const b = $('#ttsPlay'); b.innerHTML = this.paused ? ICON.play : ICON.pause; b.setAttribute('aria-label', this.paused ? 'Resume' : 'Pause');
  }
};
if (Speak.supported()) { try { speechSynthesis.addEventListener('voiceschanged', () => { if (Panel.kind === 'focus') Panel.refresh(); }); speechSynthesis.getVoices(); } catch (e) { /* voices load later */ } }

/* ================= Settings changes ================= */
const LAYOUT_KEYS = new Set(['font', 'size', 'lh', 'width', 'align', 'para', 'mode']);
function setS(k, v) {
  if (S[k] === v) return;
  const anchor = R.open && R.kind === 'flow' && (LAYOUT_KEYS.has(k) || k === 'bionic') ? firstVisibleBlock() : -1;
  S[k] = v; saveSettings();
  if (LAYOUT_KEYS.has(k)) {
    applyReaderSettings();
    if (R.open && R.kind === 'flow') {
      layoutFlow();
      if (anchor >= 0) goToBlock(anchor);
      if (S.spot) Spot.update(true);
      onPos();
    }
    return;
  }
  switch (k) {
    case 'rt': case 'rtPrivate': case 'pdfColor': applyTheme(); break;
    case 'warmth': case 'dim': applyReaderSettings(); break;
    case 'bionic': applyReaderSettings(); if (R.open && R.kind === 'flow') renderChapter(R.ch, { block: anchor }); break;
    case 'spot': applyReaderSettings(); if (v) Spot.update(true); else if (R.blocks[R.active]) R.blocks[R.active].classList.remove('on'); break;
    case 'ruler': Ruler.sync(); break;
    case 'pdfZoom': case 'pageMode': case 'pdfFit': if (R.open && R.kind !== 'flow') PV.relayout(); break;
    case 'autoHide': if (R.open) Chrome.show(); break;
    case 'vol': Sound.setVol(); break;
    case 'goal': if (!R.open) renderToday(); break;
    case 'sound': SndUI.update(); break;
    case 'vaultBlur': case 'vaultHideBtn': if (!R.open) renderLibrary(); break;
    case 'vaultVelvet': applyTheme(); break;
    case 'magShape': case 'magSize': case 'magZoom': if (Mag.on) { Mag.shape(); Mag.pill(); } { const o = $('#out-' + k); if (o) o.textContent = k === 'magZoom' ? (+v).toFixed(2).replace(/\.?0+$/, '') + '×' : v + 'px'; } break;
    case 'lampScale': Lamp.measure(); { const o = $('#out-lampScale'); if (o) o.textContent = v + '%'; } break;
    case 'lampSize': Lamp.measure(); { const o = $('#lampSizeOut'); if (o) o.textContent = v + '%'; const o2 = $('#out-lampSize'); if (o2) o2.textContent = Math.round(v) + '%'; } Lamp.preview(); break;
    case 'lampShow': applyReaderSettings(); Lamp.measure(); Lamp.syncBtn(); break;
    case 'sortBy': case 'shelfView': case 'libFilter': if (!R.open) renderShelf(); break;
    case 'libTab': if (!R.open) { renderLibrary(); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); } break;
  }
}

/* ================= Opening and closing books ================= */
/* Installed app: the phone's Back gesture closes panels, then the book, instead of leaving the app. */
const NAV = !!window.SP_PWA;
let navPopping = false;
/* Android back gesture / button: closes the top sheet, panel or preview first, then the book */
let skipPop = 0;
const OV = {
  set: new Set(),
  open(k) { if (!NAV) return; if (!this.set.size && !(history.state && history.state.sp)) try { history.pushState({ sp: 'ov' }, ''); } catch (e) { /* no history */ } this.set.add(k); },
  close(k) { if (!NAV || !this.set.has(k)) return; this.set.delete(k); setTimeout(() => this.tidy(), 0); },
  tidy() { if (!this.set.size && !R.open && history.state && history.state.sp === 'ov') { skipPop++; try { history.back(); } catch (e) { skipPop--; } } },
  closeTop() {
    const k = [...this.set].pop(); if (!k) return false;
    this.set.delete(k);
    if (k === 'sheet') closeCardMenus(); else if (k === 'panel') Panel.close(); else if (k === 'peek') Peek.close();
    if (this.set.size) try { history.pushState({ sp: 'ov' }, ''); } catch (e) { /* no history */ }
    return true;
  }
};
window.addEventListener('popstate', () => {
  if (skipPop) { skipPop--; return; }
  if (!NAV) return;
  if (!R.open) { OV.closeTop(); return; }
  const reopen = () => { try { history.pushState({ sp: 'reader' }, ''); } catch (e) { /* no history */ } };
  if (Panel.kind) { Panel.close(); reopen(); return; }
  if (!SndUI.pop.hidden) { SndUI.closePop(); reopen(); return; }
  if (!$('#rsvp').hidden) { Rsvp.close(); reopen(); return; }
  navPopping = true; try { closeReader(); } finally { navPopping = false; }
  setTimeout(() => OV.tidy(), 0);
});
async function openBook(id, at) {
  const meta = books.find(b => b.id === id); if (!meta) return;
  closeCardMenus(); Panel.close();
  const token = ++R.opening;
  R.open = true; R.meta = meta; R.doc = null; R.kind = null; R.backStack = []; R.active = -1;
  document.body.classList.add('reading'); el.library.inert = true; el.reader.hidden = false;
  el.flow.hidden = true; el.pdfview.hidden = true; el.backPill.hidden = true;
  el.loading.hidden = false; $('#loadingT').textContent = meta.title;
  if (NAV && !(history.state && history.state.sp === 'reader')) try { if (history.state && history.state.sp === 'ov') { OV.set.clear(); history.replaceState({ sp: 'reader' }, ''); } else history.pushState({ sp: 'reader' }, ''); } catch (e) { /* no history */ }
  el.bkTitle.textContent = meta.title; el.chTitle.textContent = '';
  applyReaderSettings(); Chrome.show(); Lamp.syncBtn();
  let doc;
  try {
    if (meta.format === 'sample') doc = buildSampleDoc();
    else {
      const blob = memFiles.get(id) || await DB.getFile(id);
      if (!blob) throw new Error('This book’s file is no longer stored in this browser. Remove it from your shelf and add it again.');
      doc = await parseBook(blob, meta.format, meta.name, false);
    }
  } catch (e) {
    if (token !== R.opening) return;
    el.loading.hidden = true; R.open = false; R.meta = null;
    el.reader.hidden = true; document.body.classList.remove('reading'); el.library.inert = false;
    toast(e && e.message ? e.message : 'This book could not be opened.', 6500);
    return;
  }
  if (token !== R.opening || !R.open) { try { doc.cleanup && doc.cleanup(); } catch (e) { /* closed */ } return; }
  R.doc = doc; R.kind = doc.kind; el.reader.classList.toggle('k-images', doc.kind === 'images');
  if (doc.author && !meta.author) meta.author = doc.author;
  applyReaderSettings();
  try {
    if (doc.kind === 'flow') {
      el.flow.hidden = false; el.content.lang = doc.lang || '';
      try { await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), sleep(1200)]); } catch (e) { /* fonts optional */ }
      const p = at && at.ch != null ? { ch: at.ch } : meta.pos && meta.pos.ch != null ? meta.pos : { ch: 0 };
      await renderChapter(clamp(p.ch, 0, doc.chapters.length - 1), { block: p.b, r: p.r });
    } else {
      el.pdfview.hidden = false;
      await PV.open(at && at.page != null ? { page: at.page, r: 0 } : meta.pos);
    }
  } catch (e) {
    console.error(e);
    toast('Part of this book could not be shown.', 5000);
  }
  if (token !== R.opening) return;
  el.loading.hidden = true;
  meta.opened = Date.now(); saveMetaSoon();
  updateBookmarkUI(); updateProgressUI(); SndUI.update(); Lamp.measure(); $('#lampSizeOut').textContent = S.lampSize + '%';
  (doc.kind === 'flow' ? el.flow : el.pdfview).focus({ preventScroll: true });
  if (meta.id === SAMPLE_ID && !ls.get('sp.seenHint', false)) { ls.set('sp.seenHint', true); setTimeout(() => toast(isCoarse() ? 'Tap the middle of the page to show or hide the controls.' : 'Move to the top or bottom edge to bring back the controls. Press ? for shortcuts.', 5200), 900); }
}
function closeReader() {
  if (!R.open) return;
  R.opening++;
  if (R.doc) { savePosSoon.flush(); }
  saveMetaSoon.flush();
  Mag.off(); LampPop.close(); Watch.unload(); Speak.stop(true); Rsvp.close(true); Auto.stop(); if (Session.active) Session.cancel(); Deep.exit(); Sound.stop(); Panel.close(); hideTool(); EyeBreak.hide(); Lamp.reset(); SndUI.closePop();
  if (S.sound !== 'off') { S.sound = 'off'; saveSettings(); }
  const d = R.doc;
  R.open = false; R.doc = null; R.kind = null; R.meta = null; R.backStack = []; R.blocks = [];
  try { d && d.cleanup && d.cleanup(); } catch (e) { /* closed */ }
  PV.clear(); el.content.innerHTML = ''; el.chEnd.innerHTML = ''; el.page.style.cssText = '';
  el.reader.hidden = true; el.loading.hidden = true; document.body.classList.remove('reading'); el.library.inert = false;
  el.backPill.hidden = true; $('#ruler').hidden = true; el.ribbon.hidden = true;
  if (NAV && !navPopping && history.state && history.state.sp === 'reader') try { history.back(); } catch (e) { /* no history */ }
  renderLibrary();
}

/* ================= Actions ================= */
const ACT = {
  library: () => closeReader(),
  openBook: t => {
    const id = t.dataset.id;
    if (R.open || reduceMotion()) return openBook(id);
    const card = t.closest('.card');
    const b3 = t.querySelector('.b3d') || (t.closest('.hero') && t.classList.contains('btn') ? $('.hero-b') : null) || (t.closest('.card-pop') && card ? $('.b3d', card) : null);
    const sp = !b3 && card ? $('.spine', card) : null;
    if (b3 && !b3.classList.contains('opening')) { closeCardMenus(); b3.classList.add('opening'); setTimeout(() => { openBook(id); setTimeout(() => b3.classList.remove('opening'), 500); }, 470); return; }
    if (sp) { closeCardMenus(); sp.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-26px) rotate(-3deg)' }], { duration: 260, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }).onfinish = a => { openBook(id); setTimeout(() => a.target && a.target.cancel && a.target.cancel(), 400); }; return; }
    openBook(id);
  },
  cardMenu: t => openCardMenu(t.dataset.id, t),
  closeMenus: () => { pendingVideo = null; closeCardMenus(); },
  videoPair: async t => { const f = pendingVideo; pendingVideo = null; closeCardMenus(); if (!f) return; await openBook(t.dataset.id); if (R.open && R.meta && R.meta.id === t.dataset.id) Watch.load(f); },
  peek: t => { closeCardMenus(); Peek.open(t.dataset.id || (t.closest('.card-pop') && t.closest('.card-pop').dataset.id)); },
  peekClose: () => Peek.close(),
  navSearch: () => { setS('libTab', 'library'); setTimeout(() => { const i = $('#shelfSearch'); if (i) { i.closest('.search').hidden = false; i.focus(); } }, 60); },
  rowScroll: t => { const r = t.closest('.cr').querySelector('.cr-s'); r.scrollBy({ left: +t.dataset.d * r.clientWidth * 0.85, behavior: reduceMotion() ? 'auto' : 'smooth' }); },
  watchBook: async t => { await openBook(t.dataset.id); if (R.open && R.meta && R.meta.id === t.dataset.id) Watch.open(); },
  seeAll: t => { S.libFilter = t.dataset.f || 'all'; setS('libTab', 'library'); },
  peekRead: t => Peek.read(t.dataset.page != null ? { page: +t.dataset.page } : t.dataset.ch != null ? { ch: +t.dataset.ch } : null, t.dataset.restart === '1'),
  peekPage: t => Peek.show(+t.dataset.i),
  peekNav: t => Peek.step(+t.dataset.d),
  peekLbClose: () => Peek.hideLb(),
  peekMore: () => Peek.more(),
  removeBook: t => removeBook(t.closest('.card-pop').dataset.id, t),
  peekRemove: t => removeBook(t.dataset.id, t),
  resetBook: t => resetBook(t.closest('.card-pop').dataset.id),
  pastePanel: () => Panel.open('paste'),
  pasteAdd: async () => {
    const text = $('#pasteText').value; const title = normWs($('#pasteTitle').value);
    if (!text.trim()) { toast('Paste some text first.'); return; }
    const name = (title || normWs(text).slice(0, 60) || 'Pasted text').replace(/[\\/:*?"<>|]+/g, ' ') + '.txt';
    const file = new File([text], name, { type: 'text/plain' });
    Panel.close(); await importFiles([file]);
  },
  bookmark: () => toggleBookmark(),
  contents: () => R.doc && Panel.open('contents'),
  search: () => R.doc && Panel.open('search'),
  notes: () => R.doc && Panel.open('notes', { tab: 'hl' }),
  type: () => Panel.open('type'),
  focus: () => R.doc && Panel.open('focus'),
  keys: () => Panel.open('keys'),
  closePanel: () => Panel.close(),
  nextChapter: () => { if (R.ch < R.doc.chapters.length - 1) renderChapter(R.ch + 1, { anim: true }); },
  tocGo: t => { const e = R.doc.toc[+t.dataset.k]; if (!e) return; Panel.close(); pushBack(); if (e.ch === R.ch && e.anchor) { const a = findAnchor(e.anchor); if (a) { scrollToEl(a); onPos(); return; } } renderChapter(e.ch, { anchor: e.anchor }); },
  pdfTocGo: async t => { const e = R.doc._outline && R.doc._outline[+t.dataset.k]; if (!e) return; const p = await resolveDest(e.dest); if (p == null) { toast('That entry does not point to a page.'); return; } Panel.close(); pushBack(); PV.goto(p, 0); },
  searchGo: t => { pushBack(); searchGo(+t.dataset.ch, +t.dataset.n); },
  pdfSearchGo: t => { if (window.innerWidth < 1100) Panel.close(); pushBack(); PV.goto(+t.dataset.page, 0); setTimeout(() => PV.markHits(+t.dataset.page), 50); },
  notesTab: t => { Panel.data.tab = t.dataset.tab; Panel.refresh(); },
  noteGo: async t => {
    const h = getHl(t.dataset.id); if (!h) return;
    if (window.innerWidth < 1100) Panel.close();
    pushBack();
    if (h.rects) { PV.goto(h.page, Math.max(0, h.rects[0].y - 0.12)); return; }
    if (h.ch !== R.ch) await renderChapter(h.ch);
    const m = $(`mark.hl[data-hid="${h.id}"]`, el.content); if (m) scrollToEl(m, el.flow.clientHeight * 0.3); onPos();
  },
  bmGo: t => { const b = R.meta.bookmarks.find(x => x.id === t.dataset.id); if (!b) return; Panel.close(); pushBack(); navigateTo(b); },
  bmDel: t => { R.meta.bookmarks = R.meta.bookmarks.filter(x => x.id !== t.dataset.id); saveMetaSoon(); updateBookmarkUI(); Panel.refresh(); },
  copyNotes: () => copyText(notesMarkdown()),
  saveNotes: async () => {
    if (!Cap.downloads) return copyText(notesMarkdown());
    const fn = (R.meta.title || 'Notes').replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80).trim() + ' – notes.md';
    try { await Cap.downloads.save({ filename: fn, data: notesMarkdown() }); toast('Saved'); }
    catch (e) { if (e && e.code === 'declined') return; if (e && e.code === 'rate_limited') { toast('A save is already waiting for your answer.'); return; } toast('Saving is not available here. Use Copy instead.'); }
  },
  hlColor: t => { const c = t.dataset.color; if (el.tool.dataset.mode === 'hl') { const h = getHl(curHl); if (h) { setHlColor(h, c); showTool('hl', anchorRectFor(h)); } } else createHighlight(c); },
  hlNote: () => { let h = el.tool.dataset.mode === 'hl' ? getHl(curHl) : createHighlight('honey'); if (!h) return; hideTool(); Panel.open('note', { id: h.id }); },
  hlCopy: () => { const h = el.tool.dataset.mode === 'hl' ? getHl(curHl) : null; const txt = h ? h.text : normWs(selState && selState.text); if (txt) copyText(txt); hideTool(); },
  hlExplain: () => { const h = el.tool.dataset.mode === 'hl' ? getHl(curHl) : null; const txt = h ? h.text : (selState && selState.text); hideTool(); if (txt) explain(txt); },
  hlRemove: () => { if (curHl) removeHl(curHl); curHl = null; },
  selSpeed: () => { const st = selState; hideTool(); try { window.getSelection().removeAllRanges(); } catch (e) { /* none */ } Rsvp.start(st); },
  noteSave: () => { const h = getHl(Panel.data.id); if (!h) return Panel.close(); h.note = $('#noteText').value.trim().slice(0, 8000); refreshNoteMark(h); saveMetaSoon(); Panel.close(); toast(h.note ? 'Note saved' : 'Note cleared'); },
  noteDelete: () => { const h = getHl(Panel.data.id); if (h) { h.note = ''; refreshNoteMark(h); saveMetaSoon(); } Panel.close(); },
  exStop: () => { if (Panel.data && Panel.data.ctrl) Panel.data.ctrl.abort(); },
  exCopy: () => copyText($('#exAns').textContent),
  sizeDn: () => { setS('size', clamp(S.size - 1, 13, 34)); Panel.refresh(); },
  sizeUp: () => { setS('size', clamp(S.size + 1, 13, 34)); Panel.refresh(); },
  zoomDn: () => { setS('pdfZoom', clamp(Math.round((S.pdfZoom - 0.1) * 10) / 10, 0.5, 4)); Panel.refresh(); },
  zoomUp: () => { setS('pdfZoom', clamp(Math.round((S.pdfZoom + 0.1) * 10) / 10, 0.5, 4)); Panel.refresh(); },
  zoomFit: () => { setS('pdfZoom', 1); Panel.refresh(); },
  goalDn: () => { setS('goal', clamp(S.goal - 5, 5, 240)); Panel.refresh(); },
  goalUp: () => { setS('goal', clamp(S.goal + 5, 5, 240)); Panel.refresh(); },
  sessStart: () => Session.begin(S.sessionMin),
  sessEnd: () => Session.finish(),
  newSession: () => { closeModal(); Session.begin(S.sessionMin); },
  breakStart: () => startBreak(),
  breakSkip: () => closeModal(),
  modalClose: () => closeModal(),
  sound: t => { setS('sound', t.dataset.val); Sound.play(t.dataset.val); Panel.refresh(); },
  removeSound: t => removeCustomSound(t.dataset.id),
  rsvpStart: () => Rsvp.start(),
  autoStart: () => { if (Auto.on) { Auto.stop(); Panel.refresh(); } else Auto.start(); },
  deep: () => Deep.enter(),
  exitDeep: () => Deep.exit(),
  autoSlower: () => Auto.faster(-1), autoFaster: () => Auto.faster(1), autoToggle: () => Auto.toggle(), autoStop: () => Auto.stop(),
  goBack: () => goBack(),
  rsvpClose: () => Rsvp.close(), rsvpToggle: () => Rsvp.toggle(), rsvpSlower: () => Rsvp.speed(-25), rsvpFaster: () => Rsvp.speed(25),
  rsvpBack: () => Rsvp.jumpSentence(-1), rsvpFwd: () => Rsvp.jumpSentence(1),
  eyeSkip: () => EyeBreak.hide(),
  afterDark: () => { if (Panel.kind) Panel.close(); Vault.enter(); },
  vaultLock: () => Vault.lock(),
  vaultSettings: () => Panel.open('vault'),
  appSettings: () => Panel.open(Vault.view ? 'vault' : 'app'),
  vaultShowBtn: () => { setS('vaultHideBtn', !S.vaultHideBtn); Panel.refresh(); toast(S.vaultHideBtn ? 'Private button hidden. Get back in from Settings or by holding the logo.' : 'Private button is back on the home screen.', 3200); },
  vaultCancel: () => Vault.closeGate(),
  vaultForgot: () => Vault.gate('erase'),
  vaultEraseAsk: () => { Panel.close(); Vault.gate('erase'); },
  setRtl: t => { if (!R.meta) return; R.meta.rtl = t.dataset.val === '1'; saveMetaSoon(); PV.placeBook(); PV.update(); Panel.refresh(); toast(R.meta.rtl ? 'Pages now go right to left' : 'Pages now go left to right', 1600); },
  ttsStart: () => { if (Speak.on) Speak.stop(); else Speak.start(); },
  ttsToggle: () => Speak.toggle(), ttsBack: () => Speak.skip(-1), ttsFwd: () => Speak.skip(1), ttsStop: () => Speak.stop(),
  lampHide: () => Lamp.hide(),
  lampSettings: t => LampPop.toggle(),
  pgLeft: () => { if (!R.open || !R.doc) return; if (R.kind !== 'flow') PV.jump(PV.book && PV.rtl() ? 1 : -1); else prev(); },
  pgRight: () => { if (!R.open || !R.doc) return; if (R.kind !== 'flow') PV.jump(PV.book && PV.rtl() ? -1 : 1); else next(); },
  magnifier: () => { Panel.close(); Mag.toggle(); },
  magShape: t => { setS('magShape', t.dataset.val); },
  magSize: t => { setS('magSize', clamp((+S.magSize || 220) + +t.dataset.d, 120, 480)); },
  magZoom: t => { setS('magZoom', clamp(Math.round(((+S.magZoom || 2) + +t.dataset.d) * 100) / 100, 1.25, 5)); },
  lampBtn: () => { Panel.close(); if (!S.lampShow) Lamp.bringBack(); else Lamp.tug(); },
  lampSmaller: () => Lamp.resize(-10),
  lampBigger: () => Lamp.resize(10),
  lampToggle: () => { Panel.close(); Lamp.tug(); }
};
function anchorRectFor(h) {
  if (h.rects) { const e = PV.els[h.rects[0].p]; if (e) { const b = e.getBoundingClientRect(), r = h.rects[0]; return { left: b.left + r.x * b.width, top: b.top + r.y * b.height, width: r.w * b.width, height: r.h * b.height, bottom: b.top + (r.y + r.h) * b.height }; } }
  const m = $(`mark.hl[data-hid="${h.id}"]`, el.content); return m ? m.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0, bottom: innerHeight / 2 };
}

document.addEventListener('mousedown', e => { if (e.target.closest('#seltool')) e.preventDefault(); });
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!e.target.closest('.card-pop') && !e.target.closest('[data-act="cardMenu"]')) closeCardMenus();
  if (t && !t.closest('#flow #content')) {
    const fn = ACT[t.dataset.act];
    if (fn) { e.preventDefault(); touch(); fn(t, e); return; }
  }
  const s = e.target.closest('[data-set]');
  if (s) { const k = s.dataset.set; let v = s.dataset.val; if (s.dataset.num || typeof DEF[k] === 'number') v = +v; setS(k, v); Panel.refresh(); }
  const so = e.target.closest('[data-sort]');
  if (so) setS('sortBy', so.dataset.sort);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.range) { const k = t.dataset.range; const v = parseFloat(t.value); setS(k, v); const o = document.getElementById('out-' + k); if (o && RNG_FMT[k]) o.textContent = RNG_FMT[k](v); if (k === 'scrollSpeed' && Auto.on) Auto.label(); }
  if (t.id === 'searchQ') runSearchSoon(t.value);
  if (t.id === 'shelfSearch') { shelfQuery = t.value; renderShelf(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.toggle) { setS(t.dataset.toggle, t.checked); if (t.dataset.toggle === 'sessionDeep') return; }
  if (t.id === 'fileInput') { importFiles(t.files); t.value = ''; }
  if (t.dataset && t.dataset.sel) { setS(t.dataset.sel, t.value); if (Speak.on) Speak.label(); }
  if (t.id === 'soundInput') { const f = t.files && t.files[0]; t.value = ''; addCustomSound(f); }
});
document.addEventListener('submit', e => {
  const f = e.target; e.preventDefault();
  if (f.dataset.form && f.dataset.form.startsWith('vault')) { Vault.submit(f.dataset.form); return; }
  if (f.dataset.form === 'gotoPage') { const n = parseInt($('#gotoPage').value, 10); if (n >= 1 && n <= R.doc.numPages) { Panel.close(); pushBack(); PV.goto(n - 1, 0); } else toast(`Enter a page from 1 to ${R.doc.numPages}.`); }
});
['#openLabel', '#fabOpen'].forEach(s => { const n = $(s); if (n) n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#fileInput').click(); } }); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('add-sound')) { e.preventDefault(); $('#soundInput').click(); } });

/* ---- Reader pointer interactions ---- */
let down = null, swiped = false, lastPointerType = 'mouse', multiTouch = false, touchN = 0;
document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { touchN++; if (touchN > 1) multiTouch = true; } }, true);
document.addEventListener('pointerup', e => { if (e.pointerType === 'touch') { touchN = Math.max(0, touchN - 1); if (!touchN) setTimeout(() => { multiTouch = false; }, 0); } }, true);
document.addEventListener('pointercancel', e => { if (e.pointerType === 'touch') touchN = Math.max(0, touchN - 1); }, true);
el.stage.addEventListener('pointerdown', e => {
  lastPointerType = e.pointerType || 'mouse';
  pointerDown = e.pointerType === 'mouse' && e.button === 0;
  down = { x: e.clientX, y: e.clientY, t: Date.now(), type: e.pointerType };
  swiped = false; touch();
});
document.addEventListener('pointerup', e => {
  if (pointerDown) { pointerDown = false; setTimeout(checkSelection, 0); }
  if (down && R.open && down.type !== 'mouse' && ((R.kind === 'flow' && isPaged()) || (R.kind && R.kind !== 'flow' && PV.book))) {
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    const sel = window.getSelection();
    const v = el.pdfview, mx = v.scrollWidth - v.clientWidth, canPan = R.kind !== 'flow' && mx > 4 && ((dx < 0 && v.scrollLeft < mx - 2) || (dx > 0 && v.scrollLeft > 2));
    if (!canPan && !multiTouch && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - down.t < 800 && (!sel || sel.isCollapsed)) { swiped = true; const flip = R.kind !== 'flow' && PV.rtl(); (dx < 0) !== flip ? next() : prev(); }
  }
  down = null;
});
document.addEventListener('selectionchange', debounce(checkSelection, 300));
el.stage.addEventListener('click', e => {
  if (!R.open || !R.doc) return;
  if (swiped) { swiped = false; return; }
  if (e.target.closest('button, [data-act]')) return;
  const a = e.target.closest('a');
  if (a && el.content.contains(a)) {
    if (a.dataset.ch != null || a.dataset.anchor) {
      e.preventDefault();
      let ch = a.dataset.ch != null ? +a.dataset.ch : R.ch;
      const an = a.dataset.anchor || null;
      if (a.dataset.ch == null && an && !findAnchor(an)) { const k = R.doc.chapters.findIndex(c => c.html.includes(`id="${an}"`)); if (k >= 0) ch = k; }
      pushBack();
      if (ch === R.ch) { const t = findAnchor(an); if (t) { scrollToEl(t); onPos(); } }
      else renderChapter(ch, { anchor: an });
      return;
    }
    if (a.getAttribute('href') === '#') { e.preventDefault(); return; }
    return;
  }
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed && sel.toString().trim()) return;
  const mark = e.target.closest('mark.hl');
  if (mark) { curHl = mark.dataset.hid; selState = null; showTool('hl', mark.getBoundingClientRect()); return; }
  if (R.kind === 'pdf') {
    const pg = e.target.closest('.pg');
    if (pg) {
      const i = +pg.dataset.i, b = pg.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      const h = R.meta.highlights.find(h => h.rects && h.rects.some(r => r.p === i && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h));
      if (h) { curHl = h.id; selState = null; showTool('hl', anchorRectFor(h)); return; }
    }
  }
  if (!el.tool.hidden) { hideTool(); return; }
  const pt = e.pointerType || lastPointerType;
  const fx = e.clientX / window.innerWidth;
  if ((R.kind === 'flow' && isPaged()) || (R.kind !== 'flow' && PV.book)) {
    const flip = R.kind !== 'flow' && PV.rtl();
    if (fx < 0.2) { flip ? next() : prev(); return; }
    if (fx > 0.8) { flip ? prev() : next(); return; }
  }
  if (pt !== 'mouse') Chrome.toggle();
});
el.stage.addEventListener('mousemove', e => {
  if (!R.open) return;
  touch();
  if (S.ruler && !isCoarse()) Ruler.place(e.clientY);
  if (R.deep) { Deep.arm(); return; }
  if (e.clientY < 72 || e.clientY > window.innerHeight - 96) Chrome.show();
  if ((R.kind === 'flow' && isPaged()) || (R.kind !== 'flow' && PV.book)) { const fx = e.clientX / window.innerWidth; el.stage.style.cursor = fx < 0.2 ? 'w-resize' : fx > 0.8 ? 'e-resize' : ''; }
  else el.stage.style.cursor = '';
});
el.reader.addEventListener('mousemove', e => { if (R.deep) Deep.arm(); });

let lastY = 0, posRaf = 0;
const selAfterScroll = debounce(checkSelection, 350);
const snapFix = debounce(() => { if (isPaged() && R.kind === 'flow' && R.colStep && Math.abs(el.flow.scrollLeft - R.page * R.colStep) > 1) el.flow.scrollLeft = R.page * R.colStep; }, 160);
el.flow.addEventListener('scroll', () => {
  if (!R.open || R.kind !== 'flow') return;
  if (isPaged()) { snapFix(); return; }
  const y = el.flow.scrollTop, dy = y - lastY; lastY = y;
  if (Date.now() > ignoreScrollUntil) { if (dy > 6 && S.autoHide && !Auto.on) Chrome.hide(); else if (dy < -30 && !Auto.on) Chrome.show(); }
  if (!el.tool.hidden) { hideTool(); selAfterScroll(); }
  if (!posRaf) posRaf = requestAnimationFrame(() => { posRaf = 0; if (S.spot) Spot.update(); onPos(); });
}, { passive: true });
el.pdfview.addEventListener('scroll', () => {
  if (!R.open || R.kind === 'flow' || !PV.els.length) return;
  const y = el.pdfview.scrollTop, dy = y - lastY; lastY = y;
  if (Date.now() > ignoreScrollUntil) { if (dy > 6 && S.autoHide && !Auto.on) Chrome.hide(); else if (dy < -30 && !Auto.on) Chrome.show(); }
  if (!el.tool.hidden) { hideTool(); selAfterScroll(); }
  if (!posRaf) posRaf = requestAnimationFrame(() => { posRaf = 0; PV.update(); onPos(); });
}, { passive: true });
let wheelAcc = 0, wheelLock = 0;
el.pdfview.addEventListener('wheel', e => {
  if (!R.open || R.kind === 'flow') return;
  if (!(e.ctrlKey || e.metaKey)) {
    if (!PV.book || el.pdfview.scrollHeight > el.pdfview.clientHeight + 2) return;
    e.preventDefault();
    const now = Date.now(); if (now < wheelLock) return;
    wheelAcc += e.deltaY + e.deltaX;
    if (Math.abs(wheelAcc) > 60) { PV.turn(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelLock = now + 520; }
    return;
  }
  e.preventDefault();
  Zoom.preview((Zoom.pending || S.pdfZoom) * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX, e.clientY);
}, { passive: false });
/* Zooming PDFs and comics: one zoom level for the whole book. Pinch on touch screens, Ctrl + wheel or + and − on a computer.
   While you pinch, the pages scale instantly; when you let go they are redrawn sharp at the new size. */
const Zoom = {
  pending: 0, t: 0,
  preview(z, cx, cy) {
    z = clamp(Math.round(z * 100) / 100, 0.5, 4);
    this.pending = z;
    const k = z / S.pdfZoom, v = el.pdfview, r = v.getBoundingClientRect();
    const ox = v.scrollLeft + (cx == null ? v.clientWidth / 2 : cx - r.left), oy = v.scrollTop + (cy == null ? v.clientHeight / 2 : cy - r.top);
    el.pdfpages.style.transformOrigin = `${ox}px ${oy}px`; el.pdfpages.style.transform = `scale(${k})`;
    this.badge(z);
    clearTimeout(this.t); this.t = setTimeout(() => this.commit(cx, cy), 220);
  },
  commit(cx, cy) {
    const z = this.pending; if (!z) return;
    const v = el.pdfview, r = v.getBoundingClientRect(), k = z / S.pdfZoom;
    const px = cx == null ? v.clientWidth / 2 : cx - r.left, py = cy == null ? v.clientHeight / 2 : cy - r.top;
    const fx = (v.scrollLeft + px) / Math.max(1, v.scrollWidth), fy = (v.scrollTop + py) / Math.max(1, v.scrollHeight);
    el.pdfpages.style.transform = ''; el.pdfpages.style.transformOrigin = '';
    this.pending = 0;
    if (Math.abs(k - 1) < 0.005) return;
    setS('pdfZoom', z);
    requestAnimationFrame(() => { v.scrollLeft = Math.max(0, fx * v.scrollWidth - px); v.scrollTop = Math.max(0, fy * v.scrollHeight - py); });
    const o = $('#zoomOut'); if (o) o.textContent = Math.round(z * 100) + '%';
  },
  badge(z) { toast(`Zoom ${Math.round(z * 100)}% · every page`, 900); }
};
(function () { // pinch
  const pts = new Map(); let d0 = 0, z0 = 1;
  const dist = () => { const a = [...pts.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
  const mid = () => { const a = [...pts.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
  el.pdfview.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { d0 = dist(); z0 = S.pdfZoom; } });
  el.pdfview.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && d0 > 10) { const m = mid(); Zoom.preview(z0 * dist() / d0, m.x, m.y); }
  });
  const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) d0 = 0; };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(k => el.pdfview.addEventListener(k, up));
})();
el.scrub.addEventListener('input', () => {
  scrubbing = true; const p = +el.scrub.value / 1000;
  el.scrub.style.setProperty('--pp', (p * 100) + '%');
  const d = R.doc; if (!d) return;
  if (d.kind === 'flow') { const target = p * d.total; let i = 0; while (i < d.chapters.length - 1 && d.cum[i + 1] <= target) i++; el.locR.textContent = d.chapters[i].title; }
  else el.locR.textContent = `Page ${Math.min(d.numPages, Math.floor(p * d.numPages) + 1)} of ${d.numPages}`;
  el.locL.textContent = Math.floor(p * 100) + '%';
});
el.scrub.addEventListener('change', () => { scrubbing = false; pushBack(); seekBook(+el.scrub.value / 1000); });

/* ---- Keyboard ---- */
document.addEventListener('keydown', e => {
  const tg = e.target, tag = (tg.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || tg.isContentEditable;
  if (e.key === 'Escape') {
    if (Peek.on) { Peek.escape(); return; }
    if (el.reader.classList.contains('vid-full')) { Watch.theater(false); return; }
    if (!$('#lampPop').hidden) { LampPop.close(); return; }
    if (Mag.on) { Mag.off(); return; }
    if (!$('#modal').hidden) { closeModal(); return; }
    if (Rsvp.on) { Rsvp.close(); return; }
    if (Panel.kind) { Panel.close(); return; }
    if (!el.tool.hidden) { hideTool(); return; }
    if (!SndUI.pop.hidden) { SndUI.closePop(); return; }
    if (Lamp.on) { Lamp.tug(); return; }
    if (Auto.on) { Auto.stop(); return; }
    if (R.deep) { Deep.exit(); return; }
    closeCardMenus(); return;
  }
  if (R.open && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && R.kind !== 'images') { e.preventDefault(); Panel.open('search'); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (!$('#modal').hidden) return;
  if (!R.open) { if (e.key === 'o') { e.preventDefault(); $('#fileInput').click(); } else if (e.key === 'D' && e.shiftKey && $('#vaultGate').hidden) { e.preventDefault(); Vault.enter(); } return; }
  if (!R.doc) return;
  if (Rsvp.on) {
    const k = e.key;
    if (k === ' ' || k === 'Enter') { e.preventDefault(); Rsvp.toggle(); }
    else if (k === 'ArrowLeft') { e.preventDefault(); Rsvp.jumpSentence(-1); }
    else if (k === 'ArrowRight') { e.preventDefault(); Rsvp.jumpSentence(1); }
    else if (k === 'ArrowUp') { e.preventDefault(); Rsvp.speed(25); }
    else if (k === 'ArrowDown') { e.preventDefault(); Rsvp.speed(-25); }
    return;
  }
  if (Panel.kind && !['?'].includes(e.key)) return;
  touch();
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const flow = R.kind === 'flow';
  const say = (on, what) => toast(`${what} ${on ? 'on' : 'off'}`, 1400);
  switch (k) {
    case 'ArrowRight': case 'PageDown': e.preventDefault(); if (!flow && k === 'ArrowRight') PV.jump(PV.book && PV.rtl() ? -1 : 1); else next(); break;
    case 'ArrowLeft': case 'PageUp': e.preventDefault(); if (!flow && k === 'ArrowLeft') PV.jump(PV.book && PV.rtl() ? 1 : -1); else prev(); break;
    case ' ': e.preventDefault(); if (Auto.on) Auto.toggle(); else (e.shiftKey ? prev() : next()); break;
    case 'ArrowDown': case 'ArrowUp':
      if (flow && isPaged()) { e.preventDefault(); if (S.ruler) Ruler.nudge(k === 'ArrowDown' ? 1 : -1); else (k === 'ArrowDown' ? next() : prev()); }
      else if (!flow && PV.book && el.pdfview.scrollHeight <= el.pdfview.clientHeight + 2) { e.preventDefault(); PV.turn(k === 'ArrowDown' ? 1 : -1); }
      break;
    case 'j': Spot.step(1); break;
    case 'k': Spot.step(-1); break;
    case 't': ACT.contents(); break;
    case '/': e.preventDefault(); ACT.search(); break;
    case 'n': ACT.notes(); break;
    case 'b': toggleBookmark(); break;
    case 'f': R.deep ? Deep.exit() : Deep.enter(); break;
    case 'h': Lamp.tug(); break;
    case 'm': Mag.toggle(); break;
    case 'w': Watch.toggle(); break;
    case 'v': Speak.on ? Speak.toggle() : Speak.start(); break;
    case '[': Lamp.resize(-10); break;
    case ']': Lamp.resize(10); break;
    case '{': Lamp.rescale(-10); break;
    case '}': Lamp.rescale(10); break;
    case 'l': setS('ruler', !S.ruler); say(S.ruler, 'Reading ruler'); break;
    case 's': if (flow) { setS('spot', !S.spot); say(S.spot, 'Spotlight'); } break;
    case 'r': Rsvp.start(); break;
    case 'a': Auto.on ? Auto.stop() : Auto.start(); break;
    case '+': case '=': if (flow) setS('size', clamp(S.size + 1, 13, 34)); else Zoom.preview(S.pdfZoom + 0.1); Panel.refresh(); break;
    case '-': case '_': if (flow) setS('size', clamp(S.size - 1, 13, 34)); else Zoom.preview(S.pdfZoom - 0.1); Panel.refresh(); break;
    case '?': Panel.kind === 'keys' ? Panel.close() : Panel.open('keys'); break;
    case 'Home': if (flow && S.mode === 'scroll') { /* native */ } break;
  }
});

/* ---- Window-level events ---- */
window.addEventListener('resize', debounce(() => { if (R.open) { hideTool(); relayout(); Ruler.sync(); } }, 180));
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { if (R.open && R.kind === 'flow') scheduleRelayout(); });
const themeMq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
if (themeMq && themeMq.addEventListener) themeMq.addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (Session.active) Session.leaves++; if (R.open && R.doc) { savePosSoon.flush(); saveMetaSoon.flush(); } saveStats(); }
  else if (Wake.want) { Wake.lock = null; Wake.on(); }
});
window.addEventListener('pagehide', () => { if (R.open && R.doc) { savePosSoon.flush(); saveMetaSoon.flush(); } saveStats(); });

let dragDepth = 0;
const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
window.addEventListener('dragenter', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; $('#drop').hidden = false; });
window.addEventListener('dragover', e => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
window.addEventListener('dragleave', e => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#drop').hidden = true; });
window.addEventListener('drop', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; $('#drop').hidden = true; importFiles(e.dataTransfer.files); });
document.addEventListener('paste', e => {
  if (R.open) return;
  const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea') return;
  const files = e.clipboardData && e.clipboardData.files;
  if (files && files.length) { e.preventDefault(); importFiles(files); return; }
  const text = e.clipboardData && e.clipboardData.getData('text/plain');
  if (text && text.trim().length > 40) { e.preventDefault(); Panel.open('paste', { text }); }
});

/* ---- Reading time ---- */
setInterval(() => {
  if (!R.open || !R.doc || document.hidden) return;
  if (!(Date.now() - lastActivity < 120000 || Auto.on || (Rsvp.on && Rsvp.playing))) return;
  const k = todayKey(); stats.days[k] = (stats.days[k] || 0) + 1;
  R.meta.readSec = (R.meta.readSec || 0) + 1;
  EyeBreak.count();
  if (stats.days[k] % 15 === 0) { saveStats(); saveMetaSoon(); }
}, 1000);

/* ================= Start ================= */
(async function init() {
  applyTheme();
  await DB.open();
  try { await loadBooks(); } catch (e) { books = [sampleMeta()]; }
  renderLibrary();
  if (S.sound !== 'off') { S.sound = 'off'; saveSettings(); }
  window.Stillpage = { importFiles: (files, o) => importFiles(files, o), openBook: id => openBook(id), toast: (m, ms) => toast(m, ms) };
  window.dispatchEvent(new Event('stillpage:ready'));
if (/Android/i.test(navigator.userAgent)) ['#fileInput', '#videoInput', '#soundInput'].forEach(q => { const n = $(q); if (n) n.removeAttribute('accept'); });
/* Hidden way into Private: press and hold the Readflix logo for about half a second */
(function () {
  let t = null, sx = 0, sy = 0, fired = false;
  const brand = () => document.querySelector('#library .brand');
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('#library .brand'); if (!b || R.open) return;
    sx = e.clientX; sy = e.clientY; fired = false; clearTimeout(t);
    t = setTimeout(() => { fired = true; if (navigator.vibrate) try { navigator.vibrate(10); } catch (x) { /* none */ } if (Vault.view) toast('You are already in Private.'); else Vault.enter(); }, 550);
  }, { passive: true });
  document.addEventListener('pointermove', e => { if (t && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) { clearTimeout(t); t = null; } }, { passive: true });
  ['pointerup', 'pointercancel'].forEach(k => document.addEventListener(k, () => { clearTimeout(t); t = null; }, { passive: true }));
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('#library .brand')) e.preventDefault(); });
  document.addEventListener('click', e => { if (fired && e.target.closest && e.target.closest('#library .brand')) { fired = false; e.preventDefault(); e.stopPropagation(); } }, true);
  void brand;
})();
})();
})();

