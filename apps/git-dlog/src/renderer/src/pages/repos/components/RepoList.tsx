import { type RefObject, useLayoutEffect, useRef } from 'react';
import type { RepoScanResult } from '@shared/types/repoScan';
import { RepoListItem } from './RepoListItem';

/**
 * A lista rola sozinha, separada do painel de detalhes. Em janela estreita ela
 * é desmontada para dar lugar aos detalhes, então a posição de rolagem mora
 * num ref de quem sobrevive à troca — a tela.
 *
 * Guardar no desmonte, e não a cada evento de rolagem, é o que torna a volta
 * exata: uma rolagem seguida de clique no mesmo quadro não chega a emitir
 * evento, e a posição se perderia.
 *
 * O `ul` zera margem, recuo e marcador na mão: o piloto carrega o Tailwind sem
 * Preflight, então o estilo padrão do agente de usuário continua valendo.
 */
export function RepoList({
  repos,
  pathHints,
  selectedPath,
  onSelect,
  scrollTopRef,
  focusSelected = false,
}: {
  repos: RepoScanResult[];
  pathHints: Record<string, string>;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  scrollTopRef: RefObject<number>;
  /** Devolve o cursor ao item escolhido — a volta dos detalhes por teclado. */
  focusSelected?: boolean;
}) {
  const ref = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollTop = scrollTopRef.current;

    // Quem voltou dos detalhes teve o botão "Voltar" desmontado sob o foco; sem
    // isto o cursor cai no documento e o próximo Tab recomeça do topo da tela.
    // `preventScroll` porque a posição da lista é a que acabou de ser devolvida:
    // o item escolhido estava à vista quando foi clicado, e continua.
    if (focusSelected) {
      element
        .querySelector<HTMLButtonElement>('[aria-current="true"]')
        ?.focus({ preventScroll: true });
    }

    return () => {
      scrollTopRef.current = element.scrollTop;
    };
    // Só na montagem: a rolagem e o foco são do usuário a partir daqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul
      ref={ref}
      aria-label="Repositórios encontrados"
      className="ui:m-0 ui:min-h-0 ui:flex-1 ui:list-none ui:divide-y ui:divide-border ui:overflow-y-auto ui:p-0"
    >
      {repos.map((repo) => (
        <RepoListItem
          key={repo.path}
          repo={repo}
          pathHint={pathHints[repo.path]}
          selected={repo.path === selectedPath}
          onSelect={() => onSelect(repo.path)}
        />
      ))}
    </ul>
  );
}
