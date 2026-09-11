import type { LucideIcon } from 'lucide-react';
import type { DetailTone } from '@/pages/repos/utils/repoDetails';

/**
 * Estado de um registro, na linguagem do piloto: contorno discreto, ícone e
 * palavra — a cor nunca é o único canal (design system §1.7).
 *
 * Só `danger` e `success` pintam o texto, e os dois foram medidos sobre o papel
 * dos dois modos: 4,89:1 e 5,32:1 no claro, 4,75:1 e 5,34:1 no escuro. É por
 * isso que o chip não vai sobre `accent` — ali o mesmo vermelho cai para
 * 4,48:1, abaixo de AA. O âmbar não é tom daqui: como texto ele dá 1,83:1
 * (§1.4, ADR-0001) e só aparece preenchido, no `SeverityBadge`. O que seria
 * atenção chega como `emphasis`: peso, e não cor.
 */
export const TONE_TEXT: Record<DetailTone, string> = {
  danger: 'orca:text-danger orca:font-semibold',
  success: 'orca:text-success',
  emphasis: 'orca:text-foreground orca:font-semibold',
  neutral: 'orca:text-muted-foreground',
};

/** Só quem pinta o texto pinta a borda; o resto fica na borda neutra. */
const TONE_BORDER: Record<DetailTone, string> = {
  danger: 'orca:border-danger',
  success: 'orca:border-success',
  emphasis: 'orca:border-border',
  neutral: 'orca:border-border',
};

export function StatusChip({
  label,
  icon: Icon,
  tone = 'neutral',
  title,
  mono = false,
}: {
  label: string;
  /** Obrigatório: é o segundo canal ao lado da cor (design system §3.1). */
  icon: LucideIcon;
  tone?: DetailTone;
  /** Explicação que não cabe no rótulo, ex.: para onde vai o push. */
  title?: string;
  /** Nome de branch e hash pedem a monoespaçada. */
  mono?: boolean;
}) {
  return (
    <span
      title={title}
      className={`orca:inline-flex orca:max-w-full orca:items-center orca:gap-1 orca:rounded-md orca:border orca:px-1.5 orca:py-0.5 orca:text-xs ${TONE_BORDER[tone]} ${TONE_TEXT[tone]}`}
    >
      <Icon aria-hidden width={13} height={13} className="orca:shrink-0" />
      <span className={`orca:truncate ${mono ? 'orca:font-mono' : ''}`}>{label}</span>
    </span>
  );
}
