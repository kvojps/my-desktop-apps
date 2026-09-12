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
    <div className="ui:flex ui:flex-1 ui:flex-col ui:items-center ui:justify-center ui:gap-3 ui:p-6 ui:text-center">
      <Icon aria-hidden width={40} height={40} className="ui:text-muted-foreground" />
      <p className="ui:m-0 ui:max-w-[40ch] ui:text-sm ui:text-muted-foreground">
        {description}
      </p>
      {action}
    </div>
  );
}
