const dateFormatter = new Intl.DateTimeFormat('pt-BR');

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Data de um timestamp ISO no formato curto brasileiro, ex. `15/08/2026`. */
export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

/**
 * Data e hora, ex. `15/08/2026, 14:32`. A lista de projetos precisa da hora:
 * num dia de trabalho os projetos são todos "hoje", e é a hora que distingue o
 * que se estava mexendo agora do que se abriu de manhã.
 */
export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}
