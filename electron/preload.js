// Preload script for enhanced security
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Add any specific Electron APIs you need here
  // For now, we keep it minimal for security
  
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // File operations (if needed later)
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Database path for SQLite
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path')
});