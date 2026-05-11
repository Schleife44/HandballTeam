const { contextBridge } = require('electron');

// Expose a safe flag and update listener to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  onUpdateDownloaded: (callback) => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('update-downloaded', (_event, value) => callback(value));
  },
  restartApp: () => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('restart_app');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
