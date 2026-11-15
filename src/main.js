const { app, BrowserWindow, screen, ipcMain, shell } = require('electron');
const path = require('path');

let win;
let expanded = false;
let poller;

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 300;
const COLLAPSED_HIT_WIDTH = 156;
const COLLAPSED_HIT_HEIGHT = 44;
const EXPANDED_HIT_HEIGHT = WINDOW_HEIGHT;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const bounds = display.bounds;
  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: Math.round(bounds.x + (bounds.width - WINDOW_WIDTH) / 2),
    y: bounds.y,
    frame: false, transparent: true, backgroundColor: '#00000000',
    resizable: false, movable: false, minimizable: false, maximizable: false,
    fullscreenable: false, show: false, skipTaskbar: true, alwaysOnTop: true,
    focusable: false, hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, backgroundThrottling: true
    }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => {
    positionOnDisplay(screen.getPrimaryDisplay());
    win.showInactive();
    startPointerPolling();
  });
  win.on('closed', () => {
    win = null;
    if (poller) clearInterval(poller);
  });
}

function positionOnDisplay(display) {
  if (!win || win.isDestroyed()) return;
  const b = display.bounds;
  win.setBounds({
    x: Math.round(b.x + (b.width - WINDOW_WIDTH) / 2),
    y: b.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT
  }, false);
}

function startPointerPolling() {
  poller = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    const b = display.bounds;
    const centerX = b.x + b.width / 2;
    const targetX = Math.round(centerX - WINDOW_WIDTH / 2);
    const current = win.getBounds();
    if (current.x !== targetX || current.y !== b.y) positionOnDisplay(display);

    const withinX = Math.abs(cursor.x - centerX) <=
      (expanded ? WINDOW_WIDTH / 2 : COLLAPSED_HIT_WIDTH / 2);
    const withinY = cursor.y >= b.y &&
      cursor.y <= b.y + (expanded ? EXPANDED_HIT_HEIGHT : COLLAPSED_HIT_HEIGHT);
    const shouldExpand = withinX && withinY;

    if (shouldExpand !== expanded) {
      expanded = shouldExpand;
      win.webContents.send('pisho:expanded', expanded);
      win.setIgnoreMouseEvents(!expanded, { forward: true });
    }
  }, 60);
}

ipcMain.on('pisho:open-settings', (_event, kind) => {
  if (kind === 'wifi') shell.openExternal('ms-settings:network-wifi');
  if (kind === 'bluetooth') shell.openExternal('ms-settings:bluetooth');
});

app.whenReady().then(createWindow);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('window-all-closed', event => event.preventDefault());
app.on('before-quit', () => { if (poller) clearInterval(poller); });
