import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type CuttingGeometry, fitsAnySheet } from '@shared/nesting/fit';
import type { Piece, PieceInput } from '@shared/types/piece';
import type { Rectangle } from '@shared/types/rectangle';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { formatMillimetersValue } from '@/utils/format';
import { fieldToTenths, fieldsToRectangle } from '@/utils/measureFields';
import { type PieceFormValues, emptyPieceFormValues, pieceFormSchema } from './pieceSchema';

/**
 * O mesmo formulário cadastra e edita. A conversão para a unidade do domínio
 * acontece nas duas pontas dele — `formatMillimetersValue` ao abrir, `fieldToTenths`
 * ao salvar —, e é o que mantém milímetro restrito à digitação e à tela.
 *
 * Ele também é onde a peça **rejeitada** é barrada: peça maior que qualquer
 * chapa do projeto não entra no cadastro, porque comprar chapa não a faria
 * caber e deixá-la passar faria o plano recomendar uma compra inútil. O main
 * aplica a mesma régua na fronteira; esta é a que fala com quem está digitando.
 *
 * A checagem não é do resolver: ela depende do estoque, que não é campo do
 * formulário, e o schema precisaria ser refeito a cada chapa cadastrada. É
 * medida a cada tecla, como o aviso de estoque do `meu-negocio-app`.
 */
export function usePieceForm(
  createPiece: (data: PieceInput) => Promise<void>,
  updatePiece: (id: string, data: PieceInput) => Promise<void>,
  /** Kerf e refile do projeto. `null` só enquanto a tela carrega. */
  geometry: CuttingGeometry | null,
  /** O estoque contra o qual a peça é medida. */
  sheets: readonly Rectangle[],
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

  const [length, width] = form.watch(['length', 'width']);
  const typed = fieldsToRectangle(length, width);
  /** Não cabe em chapa nenhuma: é rejeição, e não falta de estoque. */
  const doesNotFit = geometry !== null && typed !== null && !fitsAnySheet(typed, sheets, geometry);

  const onSubmit = form.handleSubmit(async (values) => {
    // O modal continua aberto com o que foi digitado, e o `Alert` dele já diz
    // por quê: a peça barrada não some sem explicação.
    if (doesNotFit) return;

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

  return { isOpen, editingId, isSaving, doesNotFit, form, openNew, openEdit, close, onSubmit };
}

export type UsePieceFormReturn = ReturnType<typeof usePieceForm>;
