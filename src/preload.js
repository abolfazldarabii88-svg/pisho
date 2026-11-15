const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('pisho', {
  onExpanded: callback => ipcRenderer.on('pisho:expanded', (_event, value) => callback(value)),
  openSettings: kind => ipcRenderer.send('pisho:open-settings', kind)
});