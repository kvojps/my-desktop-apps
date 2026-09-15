import { DatabaseBackup, Info, Store } from 'lucide-react';
import type { ComponentType } from 'react';
import type { TileAccent } from '@/components/IconTile';

export type SectionId = 'company' | 'backup' | 'about';

/** A ordem é a da navegação: o que se vem editar primeiro, consulta depois. */
export const SECTION_IDS: readonly SectionId[] = ['company', 'backup', 'about'];

export interface SectionMeta {
  /** Nome curto, o que cabe no seletor. */
  label: string;
  /** Título do painel. */
  title: string;
  /** Uma linha dizendo o que tem dentro, lida antes de entrar. */
  description: string;
  icon: ComponentType<{ className?: string }>;
  /**
   * Cor de identidade do ladrilho. Só a seção que é o assunto da tela a recebe;
   * seção que é operação ou consulta fica neutra — é o que faz a cor das outras
   * significar alguma coisa (§1.5).
   */
  accent?: TileAccent;
}

export const SECTIONS: Record<SectionId, SectionMeta> = {
  company: {
    label: 'Empresa',
    title: 'Dados da Empresa',
    description: 'Cabeçalho dos documentos gerados pelo app e do arquivo de backup',
    icon: Store,
    accent: 'primary',
  },
  backup: {
    label: 'Backup',
    title: 'Exportar e Importar Dados',
    description: 'Backup dos produtos e pedidos em arquivo, e restauração a partir dele',
    icon: DatabaseBackup,
  },
  about: {
    label: 'Sobre',
    title: 'Sobre o Aplicativo',
    description: 'Versão e caminho do banco — informe ao pedir ajuda ou ao trocar de computador',
    icon: Info,
  },
};

/** Ids do par aba/painel, para `aria-controls` e `aria-labelledby` fecharem o laço. */
export function sectionIds(base: string, id: SectionId) {
  return { tab: `${base}-tab-${id}`, panel: `${base}-panel-${id}` };
}
