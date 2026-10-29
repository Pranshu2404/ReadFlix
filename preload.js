/* Bridge between the desktop shell and the page: only "files were opened" and "page is ready" */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('readflixNative', {
  platform: process.platform,
  onOpenFiles: cb => ipcRenderer.on('open-files', (_e, files) => cb(files)),
  ready: () => ipcRenderer.send('renderer-ready')
});
