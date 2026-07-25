const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  takeScreenshot: (args) => ipcRenderer.invoke('take-screenshot', args)
});
