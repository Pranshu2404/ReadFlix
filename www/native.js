/* Desktop app: books opened from Explorer / Finder ("Open with Readflix") arrive here */
(function () {
  const N = window.readflixNative; if (!N) return;
  document.documentElement.classList.add('native-' + N.platform);
  const whenApp = fn => { const go = () => (window.Stillpage ? fn(window.Stillpage) : setTimeout(go, 80)); go(); };
  N.onOpenFiles(list => whenApp(sp => sp.importFiles(list.map(f => new File([f.data], f.name)))));
  whenApp(() => N.ready());
})();
