import type { BrowserWindow } from 'electron';
import { AppError } from '../../../utils/errors/AppError';
import { errorReason } from '../../../utils/errors/errorReason';

/**
 * A janela cujo documento vai para o papel ou para o PDF.
 *
 * Chega resolvida pelo controller (de `windowFor(event)`), e daqui é um valor
 * opaco de passagem — o apelido existe para o service poder pedir "imprima esta
 * janela" sem importar `BrowserWindow`. Quem conhece `webContents.print` e
 * `webContents.printToPDF` é este gateway.
 */
export type PrintDocumentWindow = BrowserWindow;

export interface PrintingGateway {
  /**
   * Manda para a impressora o que a janela já tem renderizado. `false` quando o
   * usuário cancela o diálogo do sistema — cancelar é resposta, não falha.
   */
  print(window: PrintDocumentWindow): Promise<boolean>;
  /** Os bytes do PDF impresso da janela, com o mesmo layout do papel. */
  printToPdf(window: PrintDocumentWindow): Promise<Uint8Array>;
}

/**
 * Não existe um "documento de impressão" separado do que está na tela: o que sai
 * no papel é o próprio DOM do renderer, e quem o transforma em documento é o
 * `@media print` — a folha esconde o rail, os botões e a navegação e revela a
 * página de resumo e uma página por chapa (design system, §5.6). É por isso que
 * o main não recebe o plano aqui: ele não desenha nada, e mandar o plano por IPC
 * para redesenhá-lo do outro lado criaria um segundo desenho que pode divergir
 * do que está à vista.
 *
 * `landscape` acompanha o `@page` do renderer. Os dois precisam concordar: o
 * desenho de uma chapa é deitado, e uma folha em pé o encolheria à metade.
 */
export const printing: PrintingGateway = {
  print(window: PrintDocumentWindow): Promise<boolean> {
    const contents = window.webContents;
    return new Promise<boolean>((resolve, reject) => {
      const fail = (reason: string) =>
        reject(new AppError(500, `Falha ao imprimir: ${reason}`, 'print-failed'));

      try {
        contents.print(
          {
            // O diálogo do sistema é onde o usuário escolhe a impressora e o
            // número de cópias. Imprimir em silêncio mandaria o maço inteiro
            // para uma impressora que ele não escolheu.
            silent: false,
            // A folha não tem cor de fundo (§5.6), então não há fundo que
            // imprimir — o desenho é feito de traço e preenchimento de SVG, que
            // saem de qualquer jeito.
            printBackground: false,
            landscape: true,
          },
          (success, failureReason) => {
            if (success) return resolve(true);
            // Cancelar não é falha: é a resposta "não, agora não" a um diálogo
            // que o app abriu. Ela volta como resultado, e não como exceção,
            // para a tela não ter de decidir se um erro é erro.
            if (failureReason === 'cancelled') return resolve(false);
            fail(failureReason);
          },
        );
      } catch (err) {
        // Sem nenhuma impressora instalada o Electron falha aqui, e não pelo
        // callback. Sem este ramo a promessa ficaria pendurada para sempre.
        fail(errorReason(err));
      }
    });
  },

  async printToPdf(window: PrintDocumentWindow): Promise<Uint8Array> {
    try {
      return await window.webContents.printToPDF({
        // O `@page` do renderer manda: A4 deitada com 10 mm de margem, a mesma
        // folha que sai da impressora. `landscape` fica aqui como piso, para o
        // caso de a página não declarar tamanho — uma folha em pé desenharia a
        // chapa com pouco mais da metade do tamanho.
        preferCSSPageSize: true,
        landscape: true,
        // A folha não tem cor de fundo (§5.6): o desenho é traço e preenchimento
        // de SVG, que saem de qualquer jeito.
        printBackground: false,
      });
    } catch (err) {
      // Montar o PDF é a etapa **antes** de gravar, e falha nela por razões que
      // não são as da gravação: a janela é que não entregou a folha. Mandar o
      // usuário conferir espaço em disco aqui o faria procurar no lugar errado.
      throw new AppError(500, `Falha ao gerar o PDF: ${errorReason(err)}`, 'pdf-failed');
    }
  },
};
