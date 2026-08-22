import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Sheet, SheetInput } from '@shared/types/sheet';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { formatMillimetersValue } from '@/utils/format';
import { fieldToTenths } from '@/utils/measureFields';
import { type SheetFormValues, emptySheetFormValues, sheetFormSchema } from './sheetSchema';

/** O gêmeo de `usePieceForm` para a chapa, que é o mesmo retângulo sem rótulo. */
export function useSheetForm(
  createSheet: (data: SheetInput) => Promise<void>,
  updateSheet: (id: string, data: SheetInput) => Promise<void>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showError } = useSnackbar();

  const form = useForm<SheetFormValues>({
    resolver: zodResolver(sheetFormSchema),
    defaultValues: emptySheetFormValues,
  });

  function openNew() {
    form.reset(emptySheetFormValues);
    setEditingId(null);
    setIsOpen(true);
  }

  function openEdit(sheet: Sheet) {
    form.reset({
      length: formatMillimetersValue(sheet.lengthTenthsMm),
      width: formatMillimetersValue(sheet.widthTenthsMm),
      quantity: String(sheet.quantity),
    });
    setEditingId(sheet.id);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditingId(null);
    form.reset(emptySheetFormValues);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const data: SheetInput = {
        lengthTenthsMm: fieldToTenths(values.length),
        widthTenthsMm: fieldToTenths(values.width),
        quantity: Number(values.quantity.trim()),
      };

      if (editingId) {
        await updateSheet(editingId, data);
      } else {
        await createSheet(data);
      }

      close();
    } catch (err) {
      showError(err, 'Erro ao salvar a chapa.');
    } finally {
      setIsSaving(false);
    }
  });

  return { isOpen, editingId, isSaving, form, openNew, openEdit, close, onSubmit };
}

export type UseSheetFormReturn = ReturnType<typeof useSheetForm>;
