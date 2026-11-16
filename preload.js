const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pisho', {
  openSettings: key => ipcRenderer.send('open-settings', String(key)),
  setInteractive: v => ipcRenderer.send('interactive', !!v),
  quit: () => ipcRenderer.send('quit')
});
