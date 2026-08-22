import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Project, ProjectInput } from '@shared/types/project';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useDataChanged } from '@/hooks/useDataChanged';

export type SortKey = 'name' | 'material' | 'updatedAt';

interface Sort {
  key: SortKey;
  direction: 'asc' | 'desc';
}

/**
 * O que a tela de Projetos sabe. Ainda é hook de tela e não context: projeto é
 * consumido por uma tela só, e a regra do repo é que o context nasce quando a
 * segunda precisa (README, §2.4).
 *
 * A ordem inicial é a do repositório — alterado mais recentemente primeiro —,
 * porque a lista existe para retomar o serviço em que se estava mexendo.
 */
export function useProjects() {
  const { showError, showSnackbar } = useSnackbar();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [sort, setSort] = useState<Sort>({ key: 'updatedAt', direction: 'desc' });

  const reload = useCallback(async () => {
    try {
      setProjects(await api.getProjects());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // O main avisa toda vez que algo é gravado; ninguém precisa lembrar de
  // recarregar depois de escrever.
  useDataChanged(reload);

  /** Botão do `ErrorState`: parte de uma tela sem conteúdo, então levanta o skeleton. */
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    reload();
  }, [reload]);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'updatedAt' ? 'desc' : 'asc' },
    );
  }, []);

  const sortedProjects = useMemo(() => {
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...projects].sort((a, b) => {
      if (sort.key === 'updatedAt') return factor * a.updatedAt.localeCompare(b.updatedAt);
      return factor * a[sort.key].localeCompare(b[sort.key], 'pt-BR');
    });
  }, [projects, sort]);

  const createProject = useCallback(
    async (data: ProjectInput) => {
      await api.createProject(data);
      showSnackbar('Projeto criado');
    },
    [showSnackbar],
  );

  const updateProject = useCallback(
    async (id: string, data: ProjectInput) => {
      await api.updateProject(id, data);
      showSnackbar('Projeto atualizado');
    },
    [showSnackbar],
  );

  /**
   * Ao contrário de criar e editar, exclusão trata o próprio erro: quem a chama
   * é um `ConfirmDialog`, que fecha de qualquer jeito, e não um formulário que
   * precisa continuar aberto com o valor digitado. A falha vira snackbar, e a
   * recarga tira da tela a linha que já não existia — foi ela que ofereceu
   * excluir o que não estava mais lá.
   */
  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await api.deleteProject(id);
        showSnackbar('Projeto excluído');
      } catch (err) {
        showError(err);
        reload();
      }
    },
    [reload, showError, showSnackbar],
  );

  return {
    sortedProjects,
    sort,
    isLoading,
    error,
    retry,
    toggleSort,
    createProject,
    updateProject,
    deleteProject,
  };
}
