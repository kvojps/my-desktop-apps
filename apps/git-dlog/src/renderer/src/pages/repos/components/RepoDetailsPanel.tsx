import { ArrowLeft } from 'lucide-react';
import type { RepoScanResult } from '@shared/types/repoScan';
import { Button } from '@/components/Button';
import { RepoDetails } from './RepoDetails';

/**
 * Painel do repositório selecionado: o botão de voltar fica parado e só o
 * conteúdo rola.
 *
 * O `key` pelo caminho é o que garante de quem são os detalhes: trocar de
 * repositório remonta o conteúdo, e nenhuma seção expandida do anterior
 * sobrevive para ser lida como se fosse do novo.
 */
export function RepoDetailsPanel({ repo, onBack }: { repo: RepoScanResult; onBack?: () => void }) {
  return (
    <section
      aria-label={`Detalhes de ${repo.name}`}
      className="ui:flex ui:min-h-0 ui:min-w-0 ui:flex-1 ui:flex-col ui:gap-2"
    >
      {onBack && (
        <Button variant="outline" onClick={onBack} className="ui:self-start">
          <ArrowLeft aria-hidden />
          Voltar para a lista
        </Button>
      )}
      <div className="ui:min-h-0 ui:flex-1 ui:overflow-y-auto ui:pr-1">
        <RepoDetails key={repo.path} repo={repo} />
      </div>
    </section>
  );
}
