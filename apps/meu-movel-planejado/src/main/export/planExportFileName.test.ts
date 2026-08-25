import { describe, expect, it } from 'vitest';
import { planExportFileName } from './planExportFileName';

/**
 * O nome que o diálogo de salvar sugere. Ele identifica o projeto e a data
 * porque o arquivo sai do app e vai para uma pasta de cliente, onde o nome é a
 * única coisa que sobra do contexto — `plano.pdf` na décima pasta não diz de
 * que serviço ele é nem de que geração.
 */

/** 24/08/2026, 15h — construído em hora local para o teste não depender do fuso. */
const GENERATED_AT = new Date(2026, 7, 24, 15, 0).toISOString();

describe('planExportFileName', () => {
  it('identifica o projeto e a data da geração', () => {
    expect(planExportFileName('Cozinha da Ana', GENERATED_AT, 'png')).toBe(
      'plano-de-corte-cozinha-da-ana-2026-08-24.png',
    );
  });

  it('usa a extensão pedida', () => {
    expect(planExportFileName('Cozinha da Ana', GENERATED_AT, 'pdf')).toBe(
      'plano-de-corte-cozinha-da-ana-2026-08-24.pdf',
    );
  });

  it('carimba o dia local da geração, e não o dia UTC', () => {
    // Plano gerado às 21h no Brasil já é do dia seguinte em UTC. O marceneiro
    // procura o arquivo pelo dia em que ele trabalhou.
    const lateEvening = new Date(2026, 7, 24, 21, 30).toISOString();

    expect(planExportFileName('Ana', lateEvening, 'png')).toContain('2026-08-24');
  });

  it('desfaz acento e cedilha, que atravessam mal o celular e o e-mail', () => {
    expect(planExportFileName('Móveis Ação', GENERATED_AT, 'png')).toBe(
      'plano-de-corte-moveis-acao-2026-08-24.png',
    );
  });

  it('descarta o que o sistema de arquivos não aceita no nome', () => {
    // `\ / : * ? " < > |` são proibidos no Windows, e o diálogo recusaria o
    // nome sugerido em vez de abrir.
    expect(planExportFileName('Cliente: A/B "urgente"?', GENERATED_AT, 'pdf')).toBe(
      'plano-de-corte-cliente-a-b-urgente-2026-08-24.pdf',
    );
  });

  it('cai num nome genérico quando não sobra nada do projeto', () => {
    // Nome só de emoji ou de pontuação: sem isto o arquivo sairia com dois
    // traços onde estaria o projeto.
    expect(planExportFileName('«»', GENERATED_AT, 'png')).toBe(
      'plano-de-corte-projeto-2026-08-24.png',
    );
  });

  it('encurta projeto longo sem deixar o traço solto na emenda', () => {
    const name = planExportFileName(
      'Cozinha completa da residência da família Albuquerque Silva',
      GENERATED_AT,
      'png',
    );

    expect(name.length).toBeLessThanOrEqual(70);
    expect(name).not.toContain('--');
    expect(name).toMatch(/^plano-de-corte-[a-z0-9-]+-2026-08-24\.png$/);
  });
});
