import { CheckCircle2 } from 'lucide-react';
import { StatusChip } from '@/components/StatusChip';
import { Tooltip } from '@/components/Tooltip';
import { formatPaidDate } from '@/utils/date';

interface SettledChipProps {
  /** "Paga" ou "Recebida". */
  label: string;
  /** "Pago" ou "Recebido" — o verbo que a data acompanha. */
  verb: string;
  /** Quando foi quitada, se o registro souber. */
  date?: string | null;
}

/**
 * O marcador de item quitado, com a data da quitação.
 *
 * A data não tem coluna própria porque um cabeçalho de tabela é fixo, e
 * "Vencimento" e "Pago em" não podem ser a mesma coluna. Ela vai na dica **e**
 * no texto do marcador: a dica é do ponteiro, o texto é de quem lê por leitor
 * de tela, e por isso a dica é `redundant` — as duas não se anunciam em
 * duplicidade.
 */
export function SettledChip({ label, verb, date }: SettledChipProps) {
  const icon = <CheckCircle2 aria-hidden="true" />;
  if (!date) return <StatusChip label={label} color="success" icon={icon} />;

  const when = formatPaidDate(date);
  return (
    <Tooltip title={`${verb} em ${when}`} redundant>
      <StatusChip
        label={label}
        color="success"
        icon={icon}
        description={`${verb.toLowerCase()} em ${when}`}
      />
    </Tooltip>
  );
}
