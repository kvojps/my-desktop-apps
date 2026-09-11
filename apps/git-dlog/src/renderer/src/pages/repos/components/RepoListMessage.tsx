import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Os estados em que a lista não tem o que listar. Cada um existe porque a saída
 * é diferente: cadastrar um diretório-base, esperar a varredura, varrer de novo
 * ou limpar os filtros (docs/design-system.md §5.4).
 *
 * Ícone de 40: o vazio é do painel da lista, não da tela — o cabeçalho e as
 * ações continuam ali ao lado (§5.4).
 */
export function RepoListMessage({
  icon: Icon,
  description,
  action,
}: {
  icon: LucideIcon;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="orca:flex orca:flex-1 orca:flex-col orca:items-center orca:justify-center orca:gap-3 orca:p-6 orca:text-center">
      <Icon aria-hidden width={40} height={40} className="orca:text-muted-foreground" />
      <p className="orca:m-0 orca:max-w-[40ch] orca:text-sm orca:text-muted-foreground">
        {description}
      </p>
      {action}
    </div>
  );
}
