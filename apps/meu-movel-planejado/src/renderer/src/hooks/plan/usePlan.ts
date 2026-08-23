import { useCallback, useEffect, useState } from 'react';
import { isPlanOutdated } from '@shared/plan/planOutdated';
import type { Piece } from '@shared/types/piece';
import type { Plan } from '@shared/types/plan';
import type { Project } from '@shared/types/project';
import type { Sheet } from '@shared/types/sheet';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';

/**
 * Tudo que a tela de Plano sabe: o projeto, o plano vigente dele e o serviço de
 * que o plano saiu.
 *
 * O projeto vem junto porque é dele que saem o nome e o material — o plano é
 * um retrato do resultado, e não do serviço — e porque é o carimbo dele que
 * responde se o desenho ficou para trás. Peça e chapa vêm porque a tela oferece
 * gerar de novo ali mesmo: sem elas o aviso de desatualizado só saberia
 * apontar para a outra tela, e quem está com o papel na mão teria de ir buscar
 * a ação noutro lugar.
 *
 * As leituras são uma só, como na tela de Projeto: descrevem a mesma coisa e
 * vêm do mesmo banco, e uma falha aqui significa que o banco não respondeu, o
 * que é a tela inteira.
 *
 * Não regenera nada ao abrir. Plano é snapshot: o que se lê é exatamente o que
 * foi gerado, inclusive quando o projeto mudou depois — e é justamente esse
 * caso que o aviso nomeia, em vez de corrigir por conta própria.
 */
export function usePlan(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    try {
      const [nextProject, nextPlan, nextPieces, nextSheets] = await Promise.all([
        api.getProject(projectId),
        api.getPlan(projectId),
        api.getPieces(projectId),
        api.getSheets(projectId),
      ]);
      setProject(nextProject);
      setPlan(nextPlan);
      setPieces(nextPieces);
      setSheets(nextSheets);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useDataChanged(reload);

  /** Botão do `ErrorState`: parte de uma tela sem conteúdo, então levanta o esqueleto. */
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    reload();
  }, [reload]);

  return {
    project,
    plan,
    pieces,
    sheets,
    /**
     * O desenho na tela é anterior à última alteração do projeto. Derivado a
     * cada leitura, e não guardado: gravar "desatualizado" seria uma terceira
     * verdade a envelhecer ao lado dos dois carimbos que já a respondem.
     */
    isOutdated: !!plan && !!project && isPlanOutdated(plan, project),
    /** O projeto foi carregado e não existe — distinto de "ainda carregando". */
    notFound: !isLoading && !error && !project,
    isLoading,
    error,
    retry,
  };
}
