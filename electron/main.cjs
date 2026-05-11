const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#000000',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true
  });

  // Set a global user agent for the entire session (including popups)
  const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  session.defaultSession.setUserAgent(chromeUserAgent);

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // Load the production website directly to ensure perfect Auth compatibility
    win.loadURL('https://sechsmeter.de');
  }
}

app.whenReady().then(() => {
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Auto-Update Events
autoUpdater.on('update-downloaded', (info) => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('update-downloaded', info);
  }
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (err) => {
  console.error('Auto-Update Fehler:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
