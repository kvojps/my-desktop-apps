/**
 * O nome que o diálogo de salvar sugere para o plano exportado.
 *
 * O arquivo sai do app: ele vai para a pasta do cliente, para o WhatsApp do
 * ajudante, para o e-mail do orçamento. Fora daqui o nome é a única coisa que
 * resta do contexto, e `plano.pdf` na décima pasta não diz de que serviço nem
 * de que geração ele é — por isso o nome carrega o projeto e a data, que são
 * exatamente o par que o cabeçalho do papel também carrega.
 *
 * Sugestão, não imposição: quem salva pode reescrever tudo no diálogo. O que
 * este módulo garante é que o padrão já esteja certo, e que ele seja aceito
 * pelo sistema de arquivos — um nome recusado faria o diálogo abrir vazio.
 *
 * Módulo puro, sem import de runtime, para ficar ao alcance da suíte.
 */

const PREFIX = 'plano-de-corte';

/** Projeto sem nenhum caractere aproveitável — emoji, pontuação — vira isto. */
const FALLBACK_SLUG = 'projeto';

/**
 * Teto do trecho do projeto no nome. Não é limite do sistema de arquivos (que é
 * bem maior): é o ponto em que o nome deixa de caber na coluna do explorador e
 * na tela do celular, que é onde ele será lido.
 */
const MAX_SLUG_LENGTH = 40;

function slugify(projectName: string): string {
  const slug = projectName
    // Separa o acento da letra para que a letra sobreviva sozinha: `ç` vira
    // `c`, e não um traço no meio da palavra.
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    // Tudo que não é letra nem dígito vira separador, o que resolve de uma vez
    // o espaço, a pontuação e os caracteres que o Windows proíbe (\ / : * ? " < > |).
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    // O corte pode cair sobre um separador, e o traço solto na emenda faria o
    // nome terminar pendurado.
    .replace(/-+$/g, '');

  return slug || FALLBACK_SLUG;
}

/**
 * O dia **local** da geração. `generatedAt` é UTC, e um plano gerado às 21h no
 * Brasil já é do dia seguinte lá — quem procura o arquivo procura pelo dia em
 * que trabalhou.
 */
function localDay(generatedAt: string): string {
  const date = new Date(generatedAt);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function planExportFileName(
  projectName: string,
  generatedAt: string,
  extension: 'png' | 'pdf',
): string {
  return `${PREFIX}-${slugify(projectName)}-${localDay(generatedAt)}.${extension}`;
}
