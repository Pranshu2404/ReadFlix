/* Readflix desktop (Windows, macOS, Linux) — Electron shell around the web app in ./www */
const { app, BrowserWindow, protocol, net, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const WWW = path.join(__dirname, 'www');
const BOOK_EXT = /\.(epub|kepub|pdf|docx|txt|text|md|markdown|html?|xhtml|fb2|cbz|zip|rtf|jpe?g|png|gif|webp|avif|bmp)$/i;

/* A private, secure scheme so the app gets a real origin: storage that persists, workers for PDFs, full crypto. */
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);

let win = null, rendererReady = false, pending = [];

function filesFrom(argv) {
  return argv.filter(a => a && !a.startsWith('-') && BOOK_EXT.test(a)).filter(a => { try { return fs.statSync(a).isFile(); } catch (e) { return false; } });
}
function sendFiles(paths) {
  if (!paths.length) return;
  if (!win || !rendererReady) { pending.push(...paths); return; }
  const files = paths.map(p => { try { return { name: path.basename(p), data: fs.readFileSync(p) }; } catch (e) { return null; } }).filter(Boolean);
  if (files.length) win.webContents.send('open-files', files);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1320, height: 860, minWidth: 360, minHeight: 480,
    backgroundColor: '#141414', title: 'Readflix', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  win.removeMenu();
  win.loadURL('app://readflix/index.html');
  /* links to websites open in the normal browser, never inside the app */
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://readflix/')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
  win.webContents.on('did-start-loading', () => { rendererReady = false; });
  win.on('closed', () => { win = null; });
}

ipcMain.on('renderer-ready', () => { rendererReady = true; const p = pending; pending = []; sendFiles(p); });

/* One window only: opening a book from Explorer while Readflix runs sends it to the open window */
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', (_e, argv) => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } sendFiles(filesFrom(argv)); });
  app.on('open-file', (e, p) => { e.preventDefault(); sendFiles([p]); }); /* macOS */
  app.whenReady().then(() => {
    protocol.handle('app', req => {
      const u = new URL(req.url);
      let rel = decodeURIComponent(u.pathname); if (rel === '/' || !rel) rel = '/index.html';
      const file = path.normalize(path.join(WWW, rel));
      if (!file.startsWith(WWW)) return new Response('Not allowed', { status: 403 });
      return net.fetch(pathToFileURL(file).toString());
    });
    createWindow();
    pending.push(...filesFrom(process.argv.slice(1)));
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
