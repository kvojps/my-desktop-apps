import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Piece } from '@shared/types/piece';
import type { Project } from '@shared/types/project';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { planPath } from '../../routes';

/**
 * A geração do plano: um pedido `plans:generate` com o id do projeto. O
 * empacotamento e o snapshot rodam no main (ADR-0003) — daqui sai só o id, e
 * volta o plano pronto.
 *
 * Gerar é sempre um pedido explícito, nunca disparado por alteração de peça ou
 * de chapa: o plano é snapshot, e o usuário precisa poder cadastrar o serviço
 * inteiro sem o resultado mudando debaixo dele.
 *
 * O rótulo "Gerando…" é o único sinal de progresso — o app não tem indicador
 * circular. Com o empacotamento fora do renderer, o event loop dele fica livre
 * durante toda a operação e o rótulo repinta sozinho, sem ninguém precisar ceder
 * o controle entre as tentativas.
 */

/**
 * Sem peça não há o que planejar. Sem chapa há: o plano sai vazio, com tudo de
 * fora, e é justamente ele que diz quanto comprar.
 */
const NO_PIECES_REASON = 'Cadastre ao menos uma peça para gerar o plano';

export function useGeneratePlan(project: Project | null, pieces: Piece[]) {
  const { showError, showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    if (!project || isGenerating) return;

    setIsGenerating(true);
    try {
      await api.generatePlan(project.id);

      showSnackbar('Plano gerado');
      // Da tela de Projeto, gerar leva para o desenho. Da própria tela de
      // Plano, quem gerou já está olhando para ele: repetir a rota empilharia
      // uma entrada de histórico igual à anterior, e voltar passaria duas vezes
      // pela mesma tela.
      const planRoute = planPath(project.id);
      if (pathname !== planRoute) navigate(planRoute);
    } catch (err) {
      showError(err);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, navigate, pathname, project, showError, showSnackbar]);

  const blockedReason = pieces.length === 0 ? NO_PIECES_REASON : '';

  return {
    generate,
    isGenerating,
    /**
     * Se o botão de gerar está vivo, e por que não — a mesma resposta para as
     * duas telas que oferecem gerar. A condição mora aqui, e não em cada uma
     * delas, porque duas cópias de uma regra são duas chances de a tela de
     * Plano deixar gerar o que a tela de Projeto barra.
     */
    canGenerate: !!project && !isGenerating && blockedReason === '',
    /** Vazio quando não há o que explicar — é o título do tooltip, que some. */
    blockedReason,
  };
}
