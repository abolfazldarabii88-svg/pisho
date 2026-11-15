const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let win;
let expanded = false;
let poller;

const WINDOW_WIDTH = 620;
const WINDOW_HEIGHT = 340;
const TOP_HIT_HEIGHT = 72;

function getDisplay() {
  const cursor = screen.getCursorScreenPoint();
  return screen.getDisplayNearestPoint(cursor);
}

function placeWindow() {
  const display = getDisplay();
  const area = display.bounds;
  const x = Math.round(area.x + (area.width - WINDOW_WIDTH) / 2);
  const y = area.y;
  win.setBounds({ x, y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT }, false);
}

function createWindow() {
  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: Math.round((screen.getPrimaryDisplay().bounds.width - WINDOW_WIDTH) / 2),
    y: screen.getPrimaryDisplay().bounds.y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => {
    placeWindow();
    win.showInactive();
    startPointerPolling();
  });
  win.on('closed', () => {
    win = null;
    if (poller) clearInterval(poller);
  });
}

function startPointerPolling() {
  poller = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    const bounds = display.bounds;
    const centerX = bounds.x + bounds.width / 2;
    const closeWidth = Math.min(190, bounds.width * 0.105);
    const inTopBand = cursor.y >= bounds.y && cursor.y <= bounds.y + TOP_HIT_HEIGHT;
    const nearNotch = inTopBand && Math.abs(cursor.x - centerX) <= closeWidth / 2 + 52;

    const current = win.getBounds();
    const targetX = Math.round(bounds.x + (bounds.width - WINDOW_WIDTH) / 2);
    if (current.x !== targetX || current.y !== bounds.y) {
      win.setBounds({ x: targetX, y: bounds.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT }, false);
    }

    if (nearNotch !== expanded) {
      expanded = nearNotch;
      win.webContents.send('pisho:expanded', expanded);
      win.setIgnoreMouseEvents(!expanded, { forward: true });
    }
    win.webContents.send('pisho:pointer', {
      x: cursor.x,
      y: cursor.y,
      displayX: bounds.x,
      displayY: bounds.y,
      displayWidth: bounds.width,
      displayHeight: bounds.height,
      nearNotch
    });
  }, 35);
}

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', (event) => { event.preventDefault(); });
app.on('before-quit', () => { if (poller) clearInterval(poller); });
