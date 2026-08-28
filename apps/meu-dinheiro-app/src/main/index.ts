import { BrowserWindow, app, dialog, shell } from 'electron';
import path from 'node:path';
import { APP_ERROR_DESCRIPTIONS } from '@shared/errors/appError';
import icon from '../../resources/icon.png?asset';
import { notifyDataChanged } from './controllers/notifyDataChanged';
import { registerIpcHandlers } from './controllers/registerIpc';
import { THEME_MODE_KEY, type ThemeModeEntity, resolveThemeMode } from './domain/theme';
import { initDb } from './infra/database/connection';
import { makeAppSettingsRepository } from './infra/database/repositories/appSettingsRepository';
import { themeMode } from './infra/gateways/system/themeMode';
import { classifyError } from './utils/errors/toIpcError';

app.setName('meu-dinheiro');

function createWindow(mode: ThemeModeEntity) {
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
    backgroundColor: themeMode.windowBackgroundFor(mode),
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

  // Carve-out do ADR-0002 (spec de `.scratch/dinheiro-camadas-processo-principal/`,
  // decisão 5): `registerIpcHandlers` devolve a composição de services porque o
  // bootstrap precisa invocar uma operação de negócio — garantir o Mês corrente.
  // A ordem mudou de "ensure → register" para "register → ensure", ainda antes
  // de `createWindow`.
  const services = registerIpcHandlers(db);
  services.months.ensureCurrentMonth();

  // O app costuma ficar aberto por dias: cobre a virada de mês sem reiniciar.
  // O aviso só sai quando o Mês foi de fato criado — sem ele, o Mês novo só
  // apareceria na tela no boot seguinte.
  app.on('browser-window-focus', () => {
    if (services.months.ensureCurrentMonth()) notifyDataChanged();
  });

  // Precisa vir antes da janela: é o modo que decide a cor com que ela nasce e a
  // da moldura nativa. Carve-out do ADR-0002: o bootstrap lê o tema direto do
  // repositório, sem montar uma unidade de trabalho só para um getter.
  const stored = makeAppSettingsRepository(db).getAppSetting(THEME_MODE_KEY);
  const mode = resolveThemeMode(stored, themeMode.systemPrefersDark());
  themeMode.apply(mode);

  createWindow(mode);

  // O modo em vigor vem do gateway, não de uma variável daqui: quem o troca em
  // runtime é o `settingsService`, por um caminho que não passa pelo bootstrap.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(themeMode.currentMode());
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
