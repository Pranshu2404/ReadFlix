/* App builds only. Desktop: books opened from Explorer / Finder arrive here.
   Android: keep the status-bar icons readable on dark (home) and light (reading) screens. */
(function () {
  const whenApp = fn => { const go = () => (window.Stillpage ? fn(window.Stillpage) : setTimeout(go, 80)); go(); };
  const N = window.readflixNative;
  if (N) {
    document.documentElement.classList.add('native-' + N.platform);
    N.onOpenFiles(list => whenApp(sp => sp.importFiles(list.map(f => new File([f.data], f.name)))));
    whenApp(() => N.ready());
  }
  const cap = window.Capacitor;
  const bars = cap && cap.Plugins && cap.Plugins.SystemBars;
  if (!bars || !bars.setStyle) return;
  document.documentElement.classList.add('native-android');
  let last = '';
  const lum = c => { const m = String(c).match(/\d+(\.\d+)?/g); if (!m) return 0; const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const sync = () => {
    const reader = document.getElementById('reader');
    const src = reader && !reader.hidden ? reader : document.body;
    const style = lum(getComputedStyle(src).backgroundColor) > 0.55 ? 'LIGHT' : 'DARK';
    if (style !== last) { last = style; try { bars.setStyle({ style }); } catch (e) { /* older app shell */ } }
  };
  whenApp(() => {
    sync();
    const mo = new MutationObserver(() => requestAnimationFrame(sync));
    mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-rt', 'data-theme'] });
    const reader = document.getElementById('reader');
    if (reader) mo.observe(reader, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
  });
})();
