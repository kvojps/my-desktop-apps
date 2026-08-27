import Database from 'better-sqlite3';
import type { Month } from '@shared/types/month';
import { AppError } from '../../../utils/errors/AppError';
import { createMonthWithDefaults } from './monthsRepository';

export function runSetup(
  db: Database.Database,
  initialYear: number,
  initialMonth: number,
): Month[] {
  const existing = db.prepare('SELECT COUNT(*) as count FROM months').get() as { count: number };
  if (existing.count > 0) {
    throw new AppError(400, 'A configuração inicial já foi feita: já existem meses cadastrados.');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const createdMonths: Month[] = [];
  let year = initialYear;
  let month = initialMonth;

  const run = db.transaction(() => {
    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
      createdMonths.push(createMonthWithDefaults(db, year, month));
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  });

  run();

  return createdMonths;
}
