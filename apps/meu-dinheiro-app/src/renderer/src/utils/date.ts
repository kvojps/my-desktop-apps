// Datas "YYYY-MM-DD" (dueDate) não têm horário: interpretá-las com `new Date()`
// as trata como UTC meia-noite, exibindo o dia anterior em fusos negativos (ex: Brasil).
// Por isso formatamos direto das partes da string, sem passar por Date.
export function formatDateOnly(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

// `paidAt` vem do SQLite (`datetime('now')`) em UTC, no formato "YYYY-MM-DD HH:MM:SS".
// Sem indicar o fuso explicitamente, `new Date()` teria parsing inconsistente entre engines.
export function formatDateTime(dateTimeStr: string): string {
  const iso = dateTimeStr.includes('T') ? dateTimeStr : `${dateTimeStr.replace(' ', 'T')}Z`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

// `paidAt` agora é uma data (sem horário) definida pelo usuário, então formatamos
// só os primeiros 10 caracteres com a mesma lógica de `formatDateOnly`, cobrindo
// tanto valores novos ("YYYY-MM-DD") quanto os antigos ("YYYY-MM-DD HH:MM:SS").
export function formatPaidDate(dateTimeStr: string): string {
  return formatDateOnly(dateTimeStr.slice(0, 10));
}

export function todayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}
