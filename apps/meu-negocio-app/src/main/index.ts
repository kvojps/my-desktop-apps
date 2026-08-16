import { BrowserWindow, app } from 'electron';
import path from 'node:path';
import icon from '../../resources/icon.png?asset';
import { initDb } from './db/connection';
import { registerIpcHandlers } from './ipc/registerIpc';

// Fixa a pasta userData existente (%APPDATA%/meu-negocio-app);
// mudar este nome deixa o banco de dados dos usuários órfão.
app.setName('meu-negocio-app');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    return;
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  const db = initDb();
  registerIpcHandlers(db);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
