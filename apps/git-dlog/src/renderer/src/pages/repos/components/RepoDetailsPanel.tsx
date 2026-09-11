import { ArrowLeft } from 'lucide-react';
import type { RepoScanResult } from '@shared/types/repoScan';
import { Button } from '@/components/Button';
import { RepoCard } from './RepoCard';

/**
 * Painel do repositório selecionado. O conteúdo ainda é o `RepoCard` que já
 * existia — o ticket 03 é que migra os detalhes; aqui o que muda é onde eles
 * aparecem e de quem eles são.
 *
 * O `key` pelo caminho é o que garante o "de quem": trocar de repositório
 * remonta o cartão, e nenhuma seção expandida do anterior sobrevive para ser
 * lida como se fosse do novo.
 */
export function RepoDetailsPanel({ repo, onBack }: { repo: RepoScanResult; onBack?: () => void }) {
  return (
    <section
      aria-label={`Detalhes de ${repo.name}`}
      className="orca:flex orca:min-h-0 orca:flex-1 orca:flex-col orca:gap-2"
    >
      {onBack && (
        <Button variant="outline" onClick={onBack} className="orca:self-start">
          <ArrowLeft aria-hidden />
          Voltar para a lista
        </Button>
      )}
      <div className="orca:min-h-0 orca:flex-1 orca:overflow-y-auto">
        <RepoCard key={repo.path} repo={repo} expandedByDefault />
      </div>
    </section>
  );
}
