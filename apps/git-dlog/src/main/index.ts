import { BrowserWindow, app, dialog, shell } from 'electron';
import path from 'node:path';
import { APP_ERROR_DESCRIPTIONS } from '@shared/errors/appError';
import icon from '../../resources/icon.png?asset';
import { registerIpcHandlers } from './controllers/registerIpc';
import { type ThemeModeEntity, resolveThemeMode } from './domain/settings';
import { initDb } from './infra/database/connection';
import { makeSettingsRepository } from './infra/database/repositories/settingsRepository';
import { theme } from './infra/gateways/system/theme';
import { errorReason } from './utils/errors/errorReason';
import { classifyError } from './utils/errors/toIpcError';

// Fixa a pasta userData (%APPDATA%/<nome>); mudar este nome após a primeira
// release deixa o banco de dados dos usuários órfão.
app.setName('git-dlog');

function createWindow(mode: ThemeModeEntity) {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    icon,
    backgroundColor: theme.windowBackgroundFor(mode),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
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
    return mainWindow;
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  return mainWindow;
}

/**
 * Se o banco não abre, nenhuma janela chega a existir - sem isso o app apenas
 * some. Diz o que houve e oferece a pasta de dados.
 */
function reportFatalDbError(err: unknown) {
  const dataDir = app.getPath('userData');
  const detail = errorReason(err);
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

  // Ordem de boot (docs/design-system.md §5.1): ler o banco → aplicar o tema
  // → criar a janela. Nunca depois.
  // O carve-out do bootstrap (ADR-0002) é ler *direto do repositório*, antes de
  // existir camada para atravessar — e não montar uma segunda unidade de
  // trabalho só para alcançar um getter.
  const initialMode = resolveThemeMode(
    makeSettingsRepository(db).getThemeMode(),
    theme.systemPrefersDarkColors(),
  );
  theme.apply(initialMode);

  registerIpcHandlers(db);

  createWindow(initialMode);

  // O modo em vigor vem do gateway, e não de uma variável daqui: quem o troca
  // em runtime é o `settingsService`, por um caminho que não passa mais pelo
  // bootstrap.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(theme.currentMode());
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
