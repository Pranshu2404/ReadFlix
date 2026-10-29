/* Readflix extension: the toolbar button opens Readflix in a tab (or brings back the one already open) */
const PAGE = chrome.runtime.getURL('index.html');
async function openReadflix() {
  try {
    if (chrome.runtime.getContexts) {
      const ctx = await chrome.runtime.getContexts({ contextTypes: ['TAB'], documentUrls: [PAGE] });
      const c = ctx.find(x => x.tabId >= 0);
      if (c) { const t = await chrome.tabs.update(c.tabId, { active: true }); await chrome.windows.update(t.windowId, { focused: true }); return; }
    }
  } catch (e) { /* fall through and open a new tab */ }
  chrome.tabs.create({ url: PAGE });
}
chrome.action.onClicked.addListener(openReadflix);
chrome.runtime.onInstalled.addListener(d => { if (d.reason === 'install') openReadflix(); });
