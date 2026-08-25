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
      IPC_CHANNELS.scanPathsAdd,
      IPC_CHANNELS.scanPathsDelete,
      IPC_CHANNELS.reposFetch,
      IPC_CHANNELS.prsSaveToken,
      IPC_CHANNELS.prsDeleteToken,
      IPC_CHANNELS.prsRedetect,
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

  it('não avisa ao gravar o modo de tema', () => {
    // A exceção deste app: grava, mas quem repinta a tela é o caminho do tema,
    // não uma recarga de dado. Está aqui para que tirá-lo da lista seja uma
    // decisão, e não um efeito colateral de mexer na classificação.
    expect(shouldNotifyDataChanged(IPC_CHANNELS.settingsSaveThemeMode)).toBe(false);
  });
});
