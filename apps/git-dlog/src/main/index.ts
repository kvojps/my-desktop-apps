import { BrowserWindow, app, dialog, shell } from 'electron';
import path from 'node:path';
import { APP_ERROR_DESCRIPTIONS } from '@shared/errors/appError';
import icon from '../../resources/icon.png?asset';
import { initDb } from './db/connection';
import { classifyError } from './errors/toIpcError';
import { registerIpcHandlers } from './ipc/registerIpc';

// Fixa a pasta userData (%APPDATA%/<nome>); mudar este nome após a primeira
// release deixa o banco de dados dos usuários órfão.
app.setName('git-dlog');

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

  // Definida pelo electron-vite ao subir o dev server do renderer.
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

/**
 * Se o banco não abre, nenhuma janela chega a existir - sem isso o app apenas
 * some. Diz o que houve e oferece a pasta de dados.
 */
function reportFatalDbError(err: unknown) {
  const dataDir = app.getPath('userData');
  const detail = err instanceof Error ? err.message : String(err);
  const choice = dialog.showMessageBoxSync({
    type: 'error',
    title: 'Git Dlog',
    message: 'Não foi possível abrir o banco de dados',
    detail: `${APP_ERROR_DESCRIPTIONS[classifyError(err)]}\n\nPasta de dados: ${dataDir}\n\n${detail}`,
    buttons: ['Abrir pasta de dados', 'Fechar'],
    defaultId: 0,
    cancelId: 1,
  });

  if (choice === 0) shell.openPath(dataDir);
  app.quit();
}

app.whenReady().then(() => {
  let db: ReturnType<typeof initDb>;
  try {
    db = initDb();
  } catch (err) {
    reportFatalDbError(err);
    return;
  }

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
