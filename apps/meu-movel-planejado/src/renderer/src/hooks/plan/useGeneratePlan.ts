import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { packCuttingPlanAttempts } from '@shared/nesting/packCuttingPlan';
import type { CuttingPlan, CuttingPlanInput } from '@shared/nesting/types';
import { toPlanInput } from '@shared/plan/planSnapshot';
import type { Piece } from '@shared/types/piece';
import type { Project } from '@shared/types/project';
import type { Sheet } from '@shared/types/sheet';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { planPath } from '../../routes';

/**
 * A geração do plano: o empacotamento roda **aqui**, no renderer, e só o
 * resultado atravessa o IPC. O empacotador é função pura — sem banco e sem
 * sistema de arquivos —, e o precedente do repo é lógica de domínio pura morar
 * fora do main quando ela não toca nem um nem outro.
 *
 * Gerar é sempre um pedido explícito, nunca disparado por alteração de peça ou
 * de chapa: o plano é snapshot, e o usuário precisa poder cadastrar o serviço
 * inteiro sem o resultado mudando debaixo dele.
 */

/**
 * Devolve o controle ao navegador entre uma tentativa e outra, para o rótulo do
 * botão conseguir repintar. Sem isso o laço inteiro roda dentro do mesmo quadro
 * e a tela só volta a pintar quando ele acaba — o usuário clica e nada acontece.
 *
 * `setTimeout`, e não `requestAnimationFrame`: um app de janela pode estar
 * minimizado ou coberto, e nesse estado o quadro não chega nunca. Ceder o
 * controle não pode depender de haver quem esteja olhando.
 */
function yieldToInterface(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Roda as tentativas até o fim, cedendo o controle entre elas, e devolve a
 * melhor — que é o último valor do gerador.
 */
async function runAttempts(input: CuttingPlanInput): Promise<CuttingPlan> {
  let best: CuttingPlan | null = null;

  for (const attempt of packCuttingPlanAttempts(input)) {
    best = attempt;
    await yieldToInterface();
  }

  if (best === null) {
    // Inalcançável: o número de tentativas é uma constante do empacotador, e
    // nem projeto vazio o zera. Fica explícito em vez de virar um plano vazio
    // gravado por engano.
    throw new Error('O empacotador não produziu nenhuma tentativa.');
  }
  return best;
}

/**
 * Sem peça não há o que planejar. Sem chapa há: o plano sai vazio, com tudo de
 * fora, e é justamente ele que diz quanto comprar.
 */
const NO_PIECES_REASON = 'Cadastre ao menos uma peça para gerar o plano';

export function useGeneratePlan(project: Project | null, pieces: Piece[], sheets: Sheet[]) {
  const { showError, showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    if (!project || isGenerating) return;

    setIsGenerating(true);
    try {
      // `Piece` e `Sheet` já satisfazem o que o empacotador lê; o que ele não
      // recebe é o resto do projeto, porque o empacotamento só depende da
      // geometria do corte.
      const input: CuttingPlanInput = {
        pieces,
        sheets,
        kerfTenthsMm: project.kerfTenthsMm,
        trimTenthsMm: project.trimTenthsMm,
      };

      const result = await runAttempts(input);
      // O carimbo é o do projeto de que este plano saiu, lido antes de gerar:
      // é comparando com ele que a tela de Plano saberá que o papel na bancada
      // ficou para trás.
      await api.savePlan(project.id, toPlanInput(input, result, project.updatedAt));

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
  }, [isGenerating, navigate, pathname, pieces, project, sheets, showError, showSnackbar]);

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
