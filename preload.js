const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('versions', {
  userlist: () => ipcRenderer.invoke('userlist'),
  getConfig: () => ipcRenderer.invoke('getConfig'),
  setConfig: (config) => ipcRenderer.invoke('setConfig', config),
  generate: () => ipcRenderer.invoke('generate'),
  getHud: (userid) => ipcRenderer.invoke('getHud', userid),
  getAppVersion: () => ipcRenderer.invoke('getAppVersion'),
  previewHud: (payload) => ipcRenderer.invoke('previewHud', payload),
  // we can also expose variables, not just functions
})
