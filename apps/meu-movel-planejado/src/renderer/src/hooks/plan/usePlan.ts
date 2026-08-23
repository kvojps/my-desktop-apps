import { useCallback, useEffect, useState } from 'react';
import type { Plan } from '@shared/types/plan';
import type { Project } from '@shared/types/project';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';

/**
 * Tudo que a tela de Plano sabe: o projeto e o plano vigente dele.
 *
 * O projeto vem junto porque é dele que saem o nome e o material — o plano é
 * um retrato do resultado, e não do serviço. As duas leituras são uma só, como
 * na tela de Projeto: descrevem a mesma coisa e vêm do mesmo banco, e uma
 * falha aqui significa que o banco não respondeu, o que é a tela inteira.
 *
 * Não regenera nada ao abrir. Plano é snapshot: o que se lê é exatamente o que
 * foi gerado, inclusive quando o projeto mudou depois.
 */
export function usePlan(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    try {
      const [nextProject, nextPlan] = await Promise.all([
        api.getProject(projectId),
        api.getPlan(projectId),
      ]);
      setProject(nextProject);
      setPlan(nextPlan);
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
    /** O projeto foi carregado e não existe — distinto de "ainda carregando". */
    notFound: !isLoading && !error && !project,
    isLoading,
    error,
    retry,
  };
}
