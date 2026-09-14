import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Ícone da própria tela — reforça que a lista está vazia de propósito. */
  icon: ReactNode;
  /** Uma frase dizendo o que vai aparecer ali. */
  title: string;
  description?: string;
  /** A saída: criar o primeiro registro, ou limpar o filtro que não achou nada. */
  action?: ReactNode;
}

/**
 * Lista vazia é o primeiro contato de todo usuário com toda tela, e uma frase
 * cinza no meio de uma tabela não é um estado vazio.
 *
 * São três casos, e confundir os dois primeiros é o erro comum — mandar
 * "cadastre seu primeiro produto" para quem tem 400 e digitou um filtro errado:
 *
 * - nunca teve registro → ícone da tela, o que ela faz, ação de criar;
 * - filtro não achou nada → ícone de filtro, diz que é o filtro, ação de limpar;
 * - falhou ao carregar → não é vazio, é erro: use `ErrorState`.
 *
 * O ícone vai em texto secundário: ícone de estado é conteúdo, não controle
 * desabilitado, e `text.disabled` falha contraste (§1.4).
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section className="negocio-empty">
      <div className="negocio-state-icon" aria-hidden="true">
        {icon}
      </div>
      <p>{title}</p>
      {description && <p className="negocio-description">{description}</p>}
      {action}
    </section>
  );
}
