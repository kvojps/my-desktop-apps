import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Piece, PieceInput } from '@shared/types/piece';
import type { CuttingParamsInput, Project } from '@shared/types/project';
import type { Sheet, SheetInput } from '@shared/types/sheet';
import { totalAreaTenthsMm2 } from '@shared/units/area';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useDataChanged } from '@/hooks/useDataChanged';

/**
 * Tudo que a tela de Projeto sabe: o projeto, as peças e as chapas dele.
 *
 * As três leituras são uma só, e não uma por seção: elas descrevem o mesmo
 * serviço e vêm do mesmo banco. Carregar por seção só se justifica quando as
 * fontes podem falhar em separado (design system, §5.3), e aqui uma falha
 * significa que o banco não respondeu — a tela inteira.
 *
 * Continua sendo hook de tela e não context: projeto é consumido por uma tela
 * só, e a regra do repo é que o context nasce quando a segunda precisa
 * (README, §2.4).
 */
export function useProjectDetail(projectId: string) {
  const { showError, showSnackbar } = useSnackbar();
  const [project, setProject] = useState<Project | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    try {
      const [nextProject, nextPieces, nextSheets] = await Promise.all([
        api.getProject(projectId),
        api.getPieces(projectId),
        api.getSheets(projectId),
      ]);
      setProject(nextProject);
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

  // O main avisa toda vez que algo é gravado; ninguém precisa lembrar de
  // recarregar depois de escrever.
  useDataChanged(reload);

  /** Botão do `ErrorState`: parte de uma tela sem conteúdo, então levanta o skeleton. */
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    reload();
  }, [reload]);

  /**
   * Escrita que nasce de um formulário propaga a falha: o formulário precisa
   * continuar aberto com o que foi digitado. Exclusão trata a própria, porque
   * quem a chama é um `ConfirmDialog`, que fecha de qualquer jeito — e a
   * recarga tira da tela a linha que já não existia.
   */
  const handleDeleteFailure = useCallback(
    (err: unknown) => {
      showError(err);
      reload();
    },
    [reload, showError],
  );

  const createPiece = useCallback(
    async (data: PieceInput) => {
      await api.createPiece(projectId, data);
      showSnackbar('Peça adicionada');
    },
    [projectId, showSnackbar],
  );

  const updatePiece = useCallback(
    async (id: string, data: PieceInput) => {
      await api.updatePiece(id, data);
      showSnackbar('Peça atualizada');
    },
    [showSnackbar],
  );

  const deletePiece = useCallback(
    async (id: string) => {
      try {
        await api.deletePiece(id);
        showSnackbar('Peça excluída');
      } catch (err) {
        handleDeleteFailure(err);
      }
    },
    [handleDeleteFailure, showSnackbar],
  );

  const createSheet = useCallback(
    async (data: SheetInput) => {
      await api.createSheet(projectId, data);
      showSnackbar('Chapa adicionada');
    },
    [projectId, showSnackbar],
  );

  const updateSheet = useCallback(
    async (id: string, data: SheetInput) => {
      await api.updateSheet(id, data);
      showSnackbar('Chapa atualizada');
    },
    [showSnackbar],
  );

  const deleteSheet = useCallback(
    async (id: string) => {
      try {
        await api.deleteSheet(id);
        showSnackbar('Chapa excluída');
      } catch (err) {
        handleDeleteFailure(err);
      }
    },
    [handleDeleteFailure, showSnackbar],
  );

  const updateCuttingParams = useCallback(
    async (data: CuttingParamsInput) => {
      await api.updateCuttingParams(projectId, data);
      showSnackbar('Parâmetros de corte atualizados');
    },
    [projectId, showSnackbar],
  );

  /**
   * As duas áreas que a tela compara, mais as contagens que as explicam. Área
   * bruta nos dois lados: o kerf da peça e o refile da chapa são geometria de
   * plano, e descontar um só daria uma comparação torta.
   */
  const totals = useMemo(
    () => ({
      piecesAreaTenthsMm2: totalAreaTenthsMm2(pieces),
      sheetsAreaTenthsMm2: totalAreaTenthsMm2(sheets),
      pieceUnits: pieces.reduce((total, piece) => total + piece.quantity, 0),
      sheetUnits: sheets.reduce((total, sheet) => total + sheet.quantity, 0),
    }),
    [pieces, sheets],
  );

  return {
    project,
    /** O projeto foi carregado e não existe — distinto de "ainda carregando". */
    notFound: !isLoading && !error && !project,
    pieces,
    sheets,
    totals,
    isLoading,
    error,
    retry,
    createPiece,
    updatePiece,
    deletePiece,
    createSheet,
    updateSheet,
    deleteSheet,
    updateCuttingParams,
  };
}
