const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');

const SETTINGS = { wifi: 'ms-settings:network-wifi', bluetooth: 'ms-settings:bluetooth' };
const W = 400, H = 300;
let win;

if (!app.requestSingleInstanceLock()) app.quit();

function place() {
  const { bounds } = screen.getPrimaryDisplay();
  win.setBounds({ x: Math.round(bounds.x + (bounds.width - W) / 2), y: bounds.y, width: W, height: H });
}

function create() {
  win = new BrowserWindow({
    width: W, height: H, frame: false, transparent: true, resizable: false, movable: false,
    hasShadow: false, skipTaskbar: true, alwaysOnTop: true, focusable: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true, { forward: true });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => { place(); win.showInactive(); });
  screen.on('display-metrics-changed', () => win && place());
}

const fromWin = e => win && e.sender === win.webContents;
ipcMain.on('open-settings', (e, key) => {
  if (!fromWin(e) || !Object.prototype.hasOwnProperty.call(SETTINGS, key)) return;
  shell.openExternal(SETTINGS[key]);
});
ipcMain.on('interactive', (e, v) => { if (fromWin(e)) win.setIgnoreMouseEvents(v !== true, { forward: true }); });
ipcMain.on('quit', e => { if (fromWin(e)) app.quit(); });

app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
