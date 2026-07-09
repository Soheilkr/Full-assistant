const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setWindowCollapsed: (collapsed, dimensions) => ipcRenderer.send('set-window-collapsed', collapsed, dimensions),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.send('set-always-on-top', alwaysOnTop),
  updateActiveTradeState: (state) => ipcRenderer.send('update-active-trade-state', state),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  saveExcelFile: (args) => ipcRenderer.invoke('save-excel-file', args),
  takeScreenshot: (args) => ipcRenderer.invoke('take-screenshot', args),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveStateSync: (key, data) => ipcRenderer.sendSync('save-state-sync', { key, data }),
  loadStateSync: (key) => ipcRenderer.sendSync('load-state-sync', { key }),
  clearAllStatesSync: () => ipcRenderer.sendSync('clear-all-states-sync')
});
