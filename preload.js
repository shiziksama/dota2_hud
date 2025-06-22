import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('versions', {
  userlist: () => ipcRenderer.invoke('userlist'),
  getConfig: () => ipcRenderer.invoke('getConfig'),
  setConfig: (config) => ipcRenderer.invoke('setConfig',config),
  generate: () => ipcRenderer.invoke('generate'),
  getHud: (userid) => ipcRenderer.invoke('getHud',userid),
  // we can also expose variables, not just functions
})