import { Add, DashboardCustomizeOutlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@shared/types/project';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Column } from '@/components/DataTable';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { useProjectForm } from '@/hooks/projects/useProjectForm';
import type { SortKey } from '@/hooks/projects/useProjects';
import { useProjects } from '@/hooks/projects/useProjects';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime } from '@/utils/date';
import { projectPath } from '../../routes';
import { ProjectFormModal } from './components/ProjectFormModal';

export function ProjectsPage() {
  const navigate = useNavigate();
  const {
    sortedProjects,
    sort,
    isLoading,
    error,
    retry,
    toggleSort,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const form = useProjectForm(createProject, updateProject);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { page, setPage, totalPages, paginatedItems, start } = usePagination(sortedProjects, 10);

  const columns: Column<Project>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Projeto',
        sortable: true,
        render: (project: Project) => <strong>{project.name}</strong>,
      },
      {
        key: 'material',
        label: 'Material',
        sortable: true,
        render: (project: Project) => project.material,
      },
      {
        key: 'updatedAt',
        label: 'Última alteração',
        sortable: true,
        render: (project: Project) => (
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(project.updatedAt)}
          </Typography>
        ),
      },
    ],
    [],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // Precedência carregando → erro → vazio (§5.3): um banco que não abriu não
  // pode ser respondido com "você ainda não tem projeto".
  if (error && !isLoading) {
    return (
      <ErrorState title="Não foi possível carregar os projetos" error={error} onRetry={retry} />
    );
  }

  const newProjectButton = (
    <Button variant="contained" startIcon={<Add />} onClick={form.openNew}>
      Novo projeto
    </Button>
  );

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<DashboardCustomizeOutlined />}
        title="Projetos"
        subtitle="Cada serviço a planejar é um projeto: um material, as peças e as chapas de que você dispõe"
        actions={newProjectButton}
      />

      <DataTable
        columns={columns}
        items={paginatedItems}
        totalCount={sortedProjects.length}
        start={start}
        sort={sort}
        onToggleSort={(key) => toggleSort(key as SortKey)}
        renderActions={(project: Project) => (
          <ActionsMenu
            ariaLabel={`Ações de ${project.name}`}
            editLabel="Editar projeto"
            deleteLabel="Excluir projeto"
            onEdit={() => form.openEdit(project)}
            onDelete={() => setDeleteTarget(project)}
          />
        )}
        getRowKey={(project) => project.id}
        // A linha inteira abre o projeto: é a ação que se faz com um projeto,
        // e o menu de três pontos guarda as duas que mexem na lista.
        onRowClick={(project) => navigate(projectPath(project.id))}
        getRowLabel={(project) => `Abrir ${project.name}`}
        footerLabel="projetos"
        isLoading={isLoading}
        empty={
          <EmptyState
            icon={<DashboardCustomizeOutlined sx={{ fontSize: 48 }} />}
            title="Você ainda não tem nenhum projeto de corte."
            description="Um projeto guarda um serviço inteiro: o material, as peças que precisam ser cortadas e as chapas que você tem à disposição. Comece dando um nome ao serviço e dizendo em que material ele será cortado."
            action={newProjectButton}
          />
        }
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      <ProjectFormModal formState={form} />

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Excluir projeto"
          message={
            // Peças, chapas e o plano vão junto: dizer isso aqui é mais barato
            // que descobrir depois.
            <>
              Excluir <strong>{deleteTarget.name}</strong> apaga também as peças, as chapas e o
              plano de corte deste projeto. Esta ação não pode ser desfeita.
            </>
          }
          confirmLabel="Excluir projeto"
          loadingLabel="Excluindo..."
          loading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Stack>
  );
}
