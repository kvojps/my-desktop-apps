const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

/** Formata um instante como "há 2 dias", a partir de segundos unix. */
export function formatRelativeSeconds(timestampSeconds: number): string {
  if (!timestampSeconds) return '';

  const diff = timestampSeconds - Date.now() / 1000;
  const absDiff = Math.abs(diff);

  for (const [unit, seconds] of UNITS) {
    if (absDiff >= seconds) {
      return relativeFormatter.format(Math.round(diff / seconds), unit);
    }
  }

  return 'agora mesmo';
}

export function formatRelativeDate(isoDate: string): string {
  return formatRelativeSeconds(new Date(isoDate).getTime() / 1000);
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('pt-BR');
}

/** "3 arquivos" / "1 arquivo" */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
