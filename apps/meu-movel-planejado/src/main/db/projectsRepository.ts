import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import {
  type CuttingParamsInput,
  DEFAULT_KERF_TENTHS_MM,
  DEFAULT_TRIM_TENTHS_MM,
  type Project,
  type ProjectInput,
} from '@shared/types/project';
import { AppError } from '../errors/AppError';

interface ProjectRow {
  id: string;
  name: string;
  material: string;
  kerf_tenths_mm: number;
  trim_tenths_mm: number;
  created_at: string;
  updated_at: string;
}

/** A fronteira snake_case → camelCase. Nenhuma chave do banco sai daqui. */
function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    material: row.material,
    kerfTenthsMm: row.kerf_tenths_mm,
    trimTenthsMm: row.trim_tenths_mm,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Mais recentemente alterado primeiro: a lista existe para retomar o serviço em
 * que se estava mexendo, e é o carimbo de alteração que responde isso.
 */
export function listProjects(db: Database.Database): Project[] {
  const rows = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as ProjectRow[];
  return rows.map(rowToProject);
}

/**
 * O projeto que a tela de Projeto abre. `null`, e não 404, porque quem chama
 * precisa distinguir "este projeto não existe mais" de "o banco falhou": a
 * primeira é uma tela com saída de volta para a lista, a segunda é erro.
 */
export function getProject(db: Database.Database, id: string): Project | null {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  return row ? rowToProject(row) : null;
}

function getProjectOrThrow(db: Database.Database, id: string): Project {
  const project = getProject(db, id);
  if (!project) {
    throw new AppError(404, 'Este projeto não existe mais.');
  }
  return project;
}

export function createProject(db: Database.Database, data: ProjectInput): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    name: data.name,
    material: data.material,
    kerfTenthsMm: DEFAULT_KERF_TENTHS_MM,
    trimTenthsMm: DEFAULT_TRIM_TENTHS_MM,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO projects (id, name, material, kerf_tenths_mm, trim_tenths_mm, created_at, updated_at)
     VALUES (@id, @name, @material, @kerfTenthsMm, @trimTenthsMm, @createdAt, @updatedAt)`,
  ).run(project);

  return project;
}

/**
 * Renomear e trocar o material são a mesma escrita: os dois são o rótulo do
 * serviço, e mexer neles move o carimbo de alteração do projeto — é dele que a
 * detecção de plano desatualizado vai depender.
 */
export function updateProject(db: Database.Database, id: string, data: ProjectInput): Project {
  getProjectOrThrow(db, id);

  const updatedAt = new Date().toISOString();
  db.prepare(
    `UPDATE projects SET name = @name, material = @material, updated_at = @updatedAt
     WHERE id = @id`,
  ).run({ id, name: data.name, material: data.material, updatedAt });

  return getProjectOrThrow(db, id);
}

/**
 * Kerf e refile são escrita à parte do nome e do material: os dois formulários
 * são de telas diferentes, e um deles enxergando os campos do outro só teria
 * como não sobrescrevê-los carregando valores que ele não mostra.
 */
export function updateCuttingParams(
  db: Database.Database,
  id: string,
  data: CuttingParamsInput,
): Project {
  getProjectOrThrow(db, id);

  db.prepare(
    `UPDATE projects SET kerf_tenths_mm = @kerfTenthsMm, trim_tenths_mm = @trimTenthsMm,
       updated_at = @updatedAt
     WHERE id = @id`,
  ).run({ id, ...data, updatedAt: new Date().toISOString() });

  return getProjectOrThrow(db, id);
}

/**
 * Move o carimbo de alteração do projeto. Toda escrita em peça ou em chapa
 * passa por aqui, dentro da mesma transação: é esse instante que o plano guarda
 * ao ser gerado, e é comparando com ele que o app sabe que o papel na bancada
 * ficou para trás.
 *
 * Projeto inexistente é 404 aqui também — vale como a checagem de que a peça
 * está sendo cadastrada em algum lugar que existe.
 */
export function touchProject(db: Database.Database, projectId: string): void {
  const result = db
    .prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
    .run(new Date().toISOString(), projectId);

  if (result.changes === 0) {
    throw new AppError(404, 'Este projeto não existe mais.');
  }
}

/**
 * Peças, chapas e o plano do projeto vão junto, por `ON DELETE CASCADE`: nada
 * do serviço sobrevive ao serviço.
 *
 * Linha que já não existia é 404, e não sucesso silencioso: a lista da tela
 * pode estar velha, e confirmar "Projeto excluído" sobre nada diria que o app
 * fez algo que ele não fez.
 */
export function deleteProject(db: Database.Database, id: string): void {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  if (result.changes === 0) {
    throw new AppError(404, 'Este projeto não existe mais.');
  }
}
