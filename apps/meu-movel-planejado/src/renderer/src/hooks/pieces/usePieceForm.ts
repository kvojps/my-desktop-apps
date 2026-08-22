import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Piece, PieceInput } from '@shared/types/piece';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { formatMillimetersValue } from '@/utils/format';
import { fieldToTenths } from '@/utils/measureFields';
import { type PieceFormValues, emptyPieceFormValues, pieceFormSchema } from './pieceSchema';

/**
 * O mesmo formulário cadastra e edita. A conversão para a unidade do domínio
 * acontece nas duas pontas dele — `formatMillimetersValue` ao abrir, `fieldToTenths`
 * ao salvar —, e é o que mantém milímetro restrito à digitação e à tela.
 */
export function usePieceForm(
  createPiece: (data: PieceInput) => Promise<void>,
  updatePiece: (id: string, data: PieceInput) => Promise<void>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showError } = useSnackbar();

  const form = useForm<PieceFormValues>({
    resolver: zodResolver(pieceFormSchema),
    defaultValues: emptyPieceFormValues,
  });

  function openNew() {
    form.reset(emptyPieceFormValues);
    setEditingId(null);
    setIsOpen(true);
  }

  function openEdit(piece: Piece) {
    form.reset({
      label: piece.label,
      length: formatMillimetersValue(piece.lengthTenthsMm),
      width: formatMillimetersValue(piece.widthTenthsMm),
      quantity: String(piece.quantity),
    });
    setEditingId(piece.id);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditingId(null);
    form.reset(emptyPieceFormValues);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const data: PieceInput = {
        label: values.label.trim(),
        lengthTenthsMm: fieldToTenths(values.length),
        widthTenthsMm: fieldToTenths(values.width),
        quantity: Number(values.quantity.trim()),
      };

      if (editingId) {
        await updatePiece(editingId, data);
      } else {
        await createPiece(data);
      }

      close();
    } catch (err) {
      showError(err, 'Erro ao salvar a peça.');
    } finally {
      setIsSaving(false);
    }
  });

  return { isOpen, editingId, isSaving, form, openNew, openEdit, close, onSubmit };
}

export type UsePieceFormReturn = ReturnType<typeof usePieceForm>;
