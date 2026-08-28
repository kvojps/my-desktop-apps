import { BrowserWindow, app, dialog, shell } from 'electron';
import path from 'node:path';
import { APP_ERROR_DESCRIPTIONS } from '@shared/errors/appError';
import type { ThemeMode } from '@shared/types/theme';
import icon from '../../resources/icon.png?asset';
import { notifyDataChanged } from './controllers/notifyDataChanged';
import { registerIpcHandlers } from './controllers/registerIpc';
import { initDb } from './infra/database/connection';
import { ensureCurrentMonthExists } from './infra/database/repositories/monthsRepository';
import {
  applyThemeMode,
  getThemeMode,
  resolveInitialThemeMode,
  themeBackground,
} from './infra/gateways/system/themeMode';
import { classifyError } from './utils/errors/toIpcError';

app.setName('meu-dinheiro');

function createWindow(mode: ThemeMode) {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    icon,
    // Sem isto a janela nasce branca. Não é o flash de boot (`show: false` +
    // `ready-to-show` já cobre esse): é a faixa branca ao redimensionar e no
    // `maximize()`, com o app em modo escuro.
    backgroundColor: themeBackground(mode),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // O renderer escolhe o tema no primeiro render, e o banco só é alcançável
      // por IPC assíncrono. Passar o modo por argumento o entrega ao preload de
      // forma síncrona, antes de qualquer render.
      additionalArguments: [`--initial-theme-mode=${mode}`],
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
    title: 'Meu Dinheiro',
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

  ensureCurrentMonthExists(db);
  registerIpcHandlers(db);

  // O app costuma ficar aberto por dias: cobre a virada de mês sem reiniciar.
  // O aviso só sai quando o mês foi de fato criado — sem ele, o mês novo só
  // apareceria na tela no boot seguinte.
  app.on('browser-window-focus', () => {
    if (ensureCurrentMonthExists(db)) notifyDataChanged();
  });

  // Precisa vir antes da janela: é o modo que decide a cor com que ela nasce e
  // a da moldura nativa.
  const mode = resolveInitialThemeMode(db);
  applyThemeMode(mode);

  createWindow(mode);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(getThemeMode());
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
