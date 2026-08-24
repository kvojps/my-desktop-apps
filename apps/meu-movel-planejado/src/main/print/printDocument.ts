import type { WebContents } from 'electron';
import { AppError } from '../errors/AppError';

/**
 * Manda para a impressora o que a janela já tem renderizado.
 *
 * Não existe um "documento de impressão" separado do que está na tela: o que
 * sai no papel é o próprio DOM do renderer, e quem o transforma em documento é
 * o `@media print` — a folha esconde o rail, os botões e a navegação e revela a
 * página de resumo e uma página por chapa (design system, §5.6). É por isso que
 * o main não recebe o plano aqui: ele não desenha nada, e mandar o plano por
 * IPC para redesenhá-lo do outro lado criaria um segundo desenho que pode
 * divergir do que está à vista.
 *
 * `landscape` acompanha o `@page` do renderer. Os dois precisam concordar: o
 * desenho de uma chapa é deitado, e uma folha em pé o encolheria à metade.
 */
export async function printDocument(contents: WebContents): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const fail = (reason: string) =>
      reject(new AppError(500, `Falha ao imprimir: ${reason}`, 'print-failed'));

    try {
      contents.print(
        {
          // O diálogo do sistema é onde o usuário escolhe a impressora e o
          // número de cópias. Imprimir em silêncio mandaria o maço inteiro para
          // uma impressora que ele não escolheu.
          silent: false,
          // A folha não tem cor de fundo (§5.6), então não há fundo que imprimir
          // — o desenho é feito de traço e preenchimento de SVG, que saem de
          // qualquer jeito.
          printBackground: false,
          landscape: true,
        },
        (success, failureReason) => {
          if (success) return resolve(true);
          // Cancelar não é falha: é a resposta "não, agora não" a um diálogo que
          // o app abriu. Ela volta como resultado, e não como exceção, para a
          // tela não ter de decidir se um erro é erro.
          if (failureReason === 'cancelled') return resolve(false);
          fail(failureReason);
        },
      );
    } catch (err) {
      // Sem nenhuma impressora instalada o Electron falha aqui, e não pelo
      // callback. Sem este ramo a promessa ficaria pendurada para sempre.
      fail(err instanceof Error ? err.message : String(err));
    }
  });
}
