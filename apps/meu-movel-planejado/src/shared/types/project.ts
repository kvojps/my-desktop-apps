/**
 * Projeto de corte: um serviço a planejar — um material, as peças que precisam
 * ser cortadas e as chapas de que se dispõe (CONTEXT.md). É a unidade que o app
 * cria, lista, renomeia e exclui.
 *
 * `kerf` e `refile` são parâmetros do projeto, não da oficina: a mesma pessoa
 * pode planejar um serviço na fresa de 3 mm e outro na de 0,3 mm.
 */
export interface Project {
  id: string;
  name: string;
  /** Rótulo livre da chapa bruta, ex. `MDF 15 mm branco`. */
  material: string;
  kerfTenthsMm: number;
  /**
   * O **refile** do glossário: a margem descartada em cada borda da chapa.
   * `trim` é só a tradução — o rótulo de tela é "Refile", como todo termo que o
   * `CONTEXT.md` fixa.
   */
  trimTenthsMm: number;
  createdAt: string;
  /**
   * Carimbo da última alteração do projeto, das suas peças ou das suas chapas.
   * É dele que a detecção de plano desatualizado depende.
   */
  updatedAt: string;
}

/** 0,3 mm — medida de fresa. Disco de serra fica em 3–4 mm, daí o campo ser editável. */
export const DEFAULT_KERF_TENTHS_MM = 3;

/** Zero: nem toda oficina refila. */
export const DEFAULT_TRIM_TENTHS_MM = 0;

export interface ProjectInput {
  name: string;
  material: string;
}
