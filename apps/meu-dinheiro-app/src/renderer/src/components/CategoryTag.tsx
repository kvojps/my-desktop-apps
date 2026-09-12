interface CategoryTagProps {
  name?: string | null;
  color?: string | null;
  /** Exibido quando a despesa não tem categoria. */
  fallback?: string;
}

/**
 * Categoria como ponto colorido + texto normal. A cor de estado do app fica
 * reservada para paga / pendente / vencida, então a cor da categoria nunca
 * disputa significado com ela dentro da mesma linha.
 *
 * O ponto é `aria-hidden` porque ele não nomeia nada — quem nomeia é o texto
 * ao lado, e a cor é escolha do usuário, não um estado a anunciar.
 */
export function CategoryTag({ name, color, fallback = '—' }: CategoryTagProps) {
  if (!name) return <span className="money-muted-text">{fallback}</span>;

  return (
    <span className="money-category">
      <span
        className="money-category-dot"
        aria-hidden="true"
        style={color ? { background: color } : undefined}
      />
      <span title={name}>{name}</span>
    </span>
  );
}
