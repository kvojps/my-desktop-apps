import type Database from 'better-sqlite3';
import { app, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { ThemeMode } from '@shared/types/theme';
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '../db/projectsRepository';
import { projectInputSchema } from '../schemas/project.schema';
import { themeModeSchema } from '../schemas/theme.schema';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';

interface RegisterIpcOptions {
  /** Aplica o novo modo ao que só o main controla, além de persistir. */
  onThemeModeChange: (mode: ThemeMode) => void;
}

export function registerIpcHandlers(db: Database.Database, options: RegisterIpcOptions): void {
  handle(IPC_CHANNELS.projectsList, () => listProjects(db));

  handle(IPC_CHANNELS.projectsCreate, (_event, data: unknown) =>
    createProject(db, parseOrThrow(projectInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsUpdate, (_event, id: unknown, data: unknown) =>
    updateProject(db, parseId(id), parseOrThrow(projectInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsDelete, (_event, id: unknown) => deleteProject(db, parseId(id)));

  handle(IPC_CHANNELS.dataOpenFolder, async () => {
    await shell.openPath(app.getPath('userData'));
  });

  handle(IPC_CHANNELS.themeSet, (_event, data: unknown) => {
    options.onThemeModeChange(parseOrThrow(themeModeSchema, data));
  });
}
