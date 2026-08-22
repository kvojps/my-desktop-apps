import { describe, expect, it } from 'vitest';
import { IPC_CHANNELS, READ_ONLY_CHANNELS, shouldNotifyDataChanged } from './channels';

/**
 * `shouldNotifyDataChanged` decide se uma chamada de IPC bem-sucedida avisa o
 * renderer de que os dados mudaram. Errar para o lado do silêncio devolve o bug
 * que este mecanismo existe para fechar: valor velho na tela sem nenhum sinal.
 */
describe('shouldNotifyDataChanged', () => {
  it('não avisa nas leituras', () => {
    for (const channel of READ_ONLY_CHANNELS) {
      expect(shouldNotifyDataChanged(channel), channel).toBe(false);
    }
  });

  it('avisa nas escritas', () => {
    const writes = [
      IPC_CHANNELS.projectsCreate,
      IPC_CHANNELS.projectsUpdate,
      IPC_CHANNELS.projectsUpdateCuttingParams,
      IPC_CHANNELS.projectsDelete,
      IPC_CHANNELS.piecesCreate,
      IPC_CHANNELS.piecesUpdate,
      IPC_CHANNELS.piecesDelete,
      IPC_CHANNELS.sheetsCreate,
      IPC_CHANNELS.sheetsUpdate,
      IPC_CHANNELS.sheetsDelete,
    ];
    for (const channel of writes) {
      expect(shouldNotifyDataChanged(channel), channel).toBe(true);
    }
  });

  it('trata canal desconhecido como escrita', () => {
    // O lado seguro: um canal novo que ninguém classificou custa uma recarga a
    // mais, nunca um valor velho.
    expect(shouldNotifyDataChanged('algo:novo')).toBe(true);
  });

  it('só classifica canais que existem', () => {
    // Renomear um canal e esquecer desta lista o tiraria do conjunto de
    // leituras em silêncio, e ele passaria a disparar recarga à toa.
    const known = new Set<string>(Object.values(IPC_CHANNELS));
    for (const channel of READ_ONLY_CHANNELS) {
      expect(known.has(channel), channel).toBe(true);
    }
  });

  it('não classifica o próprio canal de evento como leitura', () => {
    // `dataChanged` vai do main para o renderer e nunca passa pelo `handle`.
    expect(READ_ONLY_CHANNELS.has(IPC_CHANNELS.dataChanged)).toBe(false);
  });
});
