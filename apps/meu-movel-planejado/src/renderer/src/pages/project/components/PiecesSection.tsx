import { Add, WidgetsOutlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import type { Piece } from '@shared/types/piece';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Column } from '@/components/DataTable';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { usePagination } from '@/hooks/usePagination';
import { formatDimensions, formatMillimeters } from '@/utils/format';
import { SectionHeader } from './SectionHeader';

/** Como a peça é chamada onde só cabe um nome: o rótulo, ou a medida dela. */
export function pieceName(piece: Piece): string {
  return piece.label || formatDimensions(piece.lengthTenthsMm, piece.widthTenthsMm);
}

interface PiecesSectionProps {
  pieces: Piece[];
  onAdd: () => void;
  onEdit: (piece: Piece) => void;
  onDelete: (id: string) => Promise<void>;
}

export function PiecesSection({ pieces, onAdd, onEdit, onDelete }: PiecesSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<Piece | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { page, setPage, totalPages, paginatedItems, start } = usePagination(pieces);

  const columns: Column<Piece>[] = useMemo(
    () => [
      {
        key: 'label',
        label: 'Peça',
        render: (piece) =>
          piece.label ? (
            <strong>{piece.label}</strong>
          ) : (
            // O rótulo é opcional, e a ausência dele não é um dado faltando:
            // a peça se identifica pela medida, que está na própria linha.
            <Typography variant="body2" color="text.secondary">
              Sem rótulo
            </Typography>
          ),
      },
      {
        key: 'lengthTenthsMm',
        label: 'Comprimento',
        render: (piece) => formatMillimeters(piece.lengthTenthsMm),
      },
      {
        key: 'widthTenthsMm',
        label: 'Largura',
        render: (piece) => formatMillimeters(piece.widthTenthsMm),
      },
      { key: 'quantity', label: 'Quantidade', render: (piece) => piece.quantity },
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
      Adicionar peça
    </Button>
  );

  return (
    <Stack spacing={2}>
      <SectionHeader
        title="Peças"
        description="Os retângulos que precisam ser cortados neste serviço"
        action={addButton}
      />

      <DataTable
        columns={columns}
        items={paginatedItems}
        totalCount={pieces.length}
        start={start}
        renderActions={(piece) => (
          <ActionsMenu
            ariaLabel={`Ações de ${pieceName(piece)}`}
            editLabel="Editar peça"
            deleteLabel="Excluir peça"
            onEdit={() => onEdit(piece)}
            onDelete={() => setDeleteTarget(piece)}
          />
        )}
        getRowKey={(piece) => piece.id}
        footerLabel="peças"
        empty={
          // Ícone 40 e não 48: é uma seção da página, não a página inteira (§5.4).
          <EmptyState
            icon={<WidgetsOutlined sx={{ fontSize: 40 }} />}
            title="Nenhuma peça cadastrada ainda."
            description="Cadastre cada retângulo que precisa ser cortado, com comprimento, largura e quantas vezes ele se repete. O rótulo é opcional e serve para reconhecer o pedaço depois de cortado."
            action={addButton}
          />
        }
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Excluir peça"
          message={
            <>
              Excluir <strong>{pieceName(deleteTarget)}</strong> do projeto. Esta ação não pode ser
              desfeita.
            </>
          }
          confirmLabel="Excluir peça"
          loadingLabel="Excluindo..."
          loading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Stack>
  );
}
