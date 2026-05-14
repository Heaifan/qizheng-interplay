const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.ELECTRON_DEV === '1';

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 700,
    title: '奇正相生-战斗模拟器 v0.2.4.2.2',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---- auto-updater events ----
autoUpdater.on('checking-for-update', () => {
  console.log('[auto-updater] checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[auto-updater] update available:', info.version);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[auto-updater] no update available');
});

autoUpdater.on('error', (err) => {
  console.error('[auto-updater] error:', err.message);
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`[auto-updater] download ${Math.round(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[auto-updater] update downloaded, will install on quit');
  autoUpdater.quitAndInstall(true, true);
});
