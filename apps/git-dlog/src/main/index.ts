import { BrowserWindow, app, dialog, nativeTheme, shell } from 'electron';
import path from 'node:path';
import { APP_ERROR_DESCRIPTIONS } from '@shared/errors/appError';
import type { ThemeMode } from '@shared/types/theme';
import icon from '../../resources/icon.png?asset';
import { initDb } from './db/connection';
import { getThemeMode } from './db/settingsRepository';
import { classifyError } from './errors/toIpcError';
import { registerIpcHandlers } from './ipc/registerIpc';

// Fixa a pasta userData (%APPDATA%/<nome>); mudar este nome após a primeira
// release deixa o banco de dados dos usuários órfão.
app.setName('git-dlog');

/**
 * `background.default` do tema (docs/design-system.md §1.2/§5.1) — janela
 * nasce branca sem isso, o que aparece como flash ao redimensionar/maximizar
 * em modo escuro, mesmo com `show: false` + `ready-to-show`.
 */
function backgroundColorFor(mode: ThemeMode): string {
  return mode === 'dark' ? '#10131C' : '#F4F6FB';
}

/**
 * Sem preferência salva ainda, lê `nativeTheme.shouldUseDarkColors` uma
 * única vez, nesta resolução inicial — e não persiste isso como se fosse
 * escolha do usuário (docs/design-system.md §5.1).
 */
function resolveInitialThemeMode(db: Parameters<typeof getThemeMode>[0]): ThemeMode {
  return getThemeMode(db) ?? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
}

function createWindow(mode: ThemeMode) {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    icon,
    backgroundColor: backgroundColorFor(mode),
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

  // Ordem de boot (docs/design-system.md §5.1): ler o banco → aplicar o tema
  // → criar a janela. Nunca depois.
  let currentThemeMode = resolveInitialThemeMode(db);
  nativeTheme.themeSource = currentThemeMode;

  registerIpcHandlers(db, {
    onThemeModeChange: (mode) => {
      currentThemeMode = mode;
      nativeTheme.themeSource = mode;
      for (const win of BrowserWindow.getAllWindows()) {
        win.setBackgroundColor(backgroundColorFor(mode));
      }
    },
  });

  createWindow(currentThemeMode);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(currentThemeMode);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
