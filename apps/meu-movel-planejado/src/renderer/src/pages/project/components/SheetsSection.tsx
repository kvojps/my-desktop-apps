import { Add, LayersOutlined } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import type { Sheet } from '@shared/types/sheet';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Column } from '@/components/DataTable';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { usePagination } from '@/hooks/usePagination';
import { formatDimensions, formatMillimeters } from '@/utils/format';
import { SectionHeader } from './SectionHeader';

interface SheetsSectionProps {
  sheets: Sheet[];
  onAdd: () => void;
  onEdit: (sheet: Sheet) => void;
  onDelete: (id: string) => Promise<void>;
}

export function SheetsSection({ sheets, onAdd, onEdit, onDelete }: SheetsSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<Sheet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { page, setPage, totalPages, paginatedItems, start } = usePagination(sheets);

  const columns: Column<Sheet>[] = useMemo(
    () => [
      {
        key: 'lengthTenthsMm',
        label: 'Comprimento',
        render: (sheet) => <strong>{formatMillimeters(sheet.lengthTenthsMm)}</strong>,
      },
      {
        key: 'widthTenthsMm',
        label: 'Largura',
        render: (sheet) => formatMillimeters(sheet.widthTenthsMm),
      },
      { key: 'quantity', label: 'Quantidade', render: (sheet) => sheet.quantity },
    ],
    [],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const addButton = (
    <Button variant="contained" startIcon={<Add />} onClick={onAdd}>
      Adicionar chapa
    </Button>
  );

  return (
    <Stack spacing={2}>
      <SectionHeader
        title="Chapas"
        description="O estoque deste projeto: quantas chapas de cada tamanho você tem à disposição"
        action={addButton}
      />

      <DataTable
        columns={columns}
        items={paginatedItems}
        totalCount={sheets.length}
        start={start}
        renderActions={(sheet) => (
          <ActionsMenu
            ariaLabel={`Ações da chapa de ${formatDimensions(sheet.lengthTenthsMm, sheet.widthTenthsMm)}`}
            editLabel="Editar chapa"
            deleteLabel="Excluir chapa"
            onEdit={() => onEdit(sheet)}
            onDelete={() => setDeleteTarget(sheet)}
          />
        )}
        getRowKey={(sheet) => sheet.id}
        footerLabel="tamanhos de chapa"
        empty={
          <EmptyState
            icon={<LayersOutlined sx={{ fontSize: 40 }} />}
            title="Nenhuma chapa cadastrada ainda."
            description="Cadastre as chapas de que você dispõe, um tamanho de cada vez. Vários tamanhos convivem no mesmo projeto — é assim que o retalho de um serviço anterior entra no plano ao lado da chapa inteira."
            action={addButton}
          />
        }
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Excluir chapa"
          message={
            <>
              Excluir a chapa de{' '}
              <strong>
                {formatDimensions(deleteTarget.lengthTenthsMm, deleteTarget.widthTenthsMm)}
              </strong>{' '}
              do estoque deste projeto. Esta ação não pode ser desfeita.
            </>
          }
          confirmLabel="Excluir chapa"
          loadingLabel="Excluindo..."
          loading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Stack>
  );
}
