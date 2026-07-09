const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleCollapse: (collapsed) => ipcRenderer.send('toggle-collapse', collapsed),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  takeScreenshot: (dir) => ipcRenderer.invoke('take-screenshot', dir),
  closeApp: () => ipcRenderer.send('close-app'),
  minimizeApp: () => ipcRenderer.send('minimize-app')
});
