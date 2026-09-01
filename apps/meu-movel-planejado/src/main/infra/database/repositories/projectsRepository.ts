import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import {
  type CuttingParamsInput,
  DEFAULT_KERF_TENTHS_MM,
  DEFAULT_TRIM_TENTHS_MM,
  type ProjectInput,
} from '@shared/types/project';
import type { ProjectEntity } from '../../../domain/project';

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
function rowToProject(row: ProjectRow): ProjectEntity {
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

export function makeProjectsRepository(db: Database.Database) {
  function selectRow(id: string): ProjectRow | undefined {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  }

  function findById(id: string): ProjectEntity | null {
    const row = selectRow(id);
    return row ? rowToProject(row) : null;
  }

  return {
    /**
     * Mais recentemente alterado primeiro: a lista existe para retomar o serviço
     * em que se estava mexendo, e é o carimbo de alteração que responde isso.
     */
    list(): ProjectEntity[] {
      const rows = db
        .prepare('SELECT * FROM projects ORDER BY updated_at DESC')
        .all() as ProjectRow[];
      return rows.map(rowToProject);
    },

    /**
     * O projeto que a tela de Projeto abre. `null`, e não 404, porque quem chama
     * precisa distinguir "este projeto não existe mais" de "o banco falhou": a
     * primeira é uma tela com saída de volta para a lista, a segunda é erro.
     */
    findById,

    create(data: ProjectInput): ProjectEntity {
      const now = new Date().toISOString();
      const project: ProjectEntity = {
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
    },

    /**
     * Renomear e trocar o material são a mesma escrita: os dois são o rótulo do
     * serviço, e mexer neles move o carimbo de alteração do projeto — é dele que
     * a detecção de plano desatualizado vai depender.
     *
     * `null` quando o projeto não existe mais; o 404 é decidido por quem chama.
     */
    update(id: string, data: ProjectInput): ProjectEntity | null {
      if (!selectRow(id)) return null;

      const updatedAt = new Date().toISOString();
      db.prepare(
        `UPDATE projects SET name = @name, material = @material, updated_at = @updatedAt
         WHERE id = @id`,
      ).run({ id, name: data.name, material: data.material, updatedAt });

      return findById(id);
    },

    /**
     * Kerf e refile são escrita à parte do nome e do material: os dois
     * formulários são de telas diferentes, e um deles enxergando os campos do
     * outro só teria como não sobrescrevê-los carregando valores que ele não
     * mostra.
     */
    updateCuttingParams(id: string, data: CuttingParamsInput): ProjectEntity | null {
      if (!selectRow(id)) return null;

      db.prepare(
        `UPDATE projects SET kerf_tenths_mm = @kerfTenthsMm, trim_tenths_mm = @trimTenthsMm,
           updated_at = @updatedAt
         WHERE id = @id`,
      ).run({ id, ...data, updatedAt: new Date().toISOString() });

      return findById(id);
    },

    /**
     * Move o carimbo de alteração do projeto. Toda escrita em peça ou em chapa
     * passa por aqui, na mesma transação que a escrita: é esse instante que o
     * plano guarda ao ser gerado, e é comparando com ele que o app sabe que o
     * papel na bancada ficou para trás.
     *
     * `false` quando não há projeto com esse id — quem compõe a transação é que
     * traduz isso no 404.
     */
    touch(projectId: string): boolean {
      const result = db
        .prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
        .run(new Date().toISOString(), projectId);
      return result.changes > 0;
    },

    /**
     * Peças, chapas e o plano do projeto vão junto, por `ON DELETE CASCADE`:
     * nada do serviço sobrevive ao serviço.
     *
     * `false` quando a linha já não existia — quem chama é que decide se isso é
     * 404 ou sucesso silencioso.
     */
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
      return result.changes > 0;
    },

    /** Só a existência, para o guard de quem grava um plano do projeto. */
    exists(id: string): boolean {
      return db.prepare('SELECT 1 FROM projects WHERE id = ?').get(id) !== undefined;
    },
  };
}

export type ProjectsRepository = ReturnType<typeof makeProjectsRepository>;
