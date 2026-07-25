const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  takeScreenshot: (args) => ipcRenderer.invoke('take-screenshot', args),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  setWindowCollapsed: (collapsed, dims) => ipcRenderer.send('set-window-collapsed', { collapsed, dims }),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.send('set-always-on-top', alwaysOnTop),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  updateActiveTradeState: (isActive) => ipcRenderer.send('update-active-trade-state', isActive),
  saveExcelFile: (args) => ipcRenderer.invoke('save-excel-file', args),
  loadStateSync: (key) => ipcRenderer.sendSync('load-state-sync', key),
  saveStateSync: (key, val) => ipcRenderer.sendSync('save-state-sync', { key, val }),
  clearAllStatesSync: () => ipcRenderer.sendSync('clear-all-states-sync'),
  saveLargeAudio: (args) => ipcRenderer.invoke('save-large-audio', args),
  loadLargeAudio: (key) => ipcRenderer.invoke('load-large-audio', key)
});
