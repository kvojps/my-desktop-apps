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
      className="orca:flex orca:min-h-0 orca:min-w-0 orca:flex-1 orca:flex-col orca:gap-2"
    >
      {onBack && (
        <Button variant="outline" onClick={onBack} className="orca:self-start">
          <ArrowLeft aria-hidden />
          Voltar para a lista
        </Button>
      )}
      <div className="orca:min-h-0 orca:flex-1 orca:overflow-y-auto orca:pr-1">
        <RepoDetails key={repo.path} repo={repo} />
      </div>
    </section>
  );
}
