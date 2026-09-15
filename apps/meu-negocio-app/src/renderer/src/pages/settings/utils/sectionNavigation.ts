/**
 * Para onde as setas levam na navegação interna de Configurações. O seletor é
 * uma lista de abas, e a mesma lista fica vertical na faixa larga e horizontal
 * na estreita, então as duas direções valem sempre: quem lê com o teclado não
 * precisa saber como o CSS a dispôs. Circula nas pontas; `Home`/`End` vão a elas.
 *
 * Devolve `null` para tecla que não navega ou seção desconhecida — o chamador
 * deixa o evento seguir e não mexe na seleção.
 */
export function moveSection<T extends string>(
  sections: readonly T[],
  current: string,
  key: string,
): T | null {
  const index = sections.indexOf(current as T);
  if (index === -1 || sections.length === 0) return null;
  const last = sections.length - 1;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return sections[index === last ? 0 : index + 1];
    case 'ArrowLeft':
    case 'ArrowUp':
      return sections[index === 0 ? last : index - 1];
    case 'Home':
      return sections[0];
    case 'End':
      return sections[last];
    default:
      return null;
  }
}
