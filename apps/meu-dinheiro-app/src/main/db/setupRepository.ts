import Database from 'better-sqlite3';
import { AppError } from '../errors/AppError';
import { MonthRow, createMonthWithDefaults } from './monthsRepository';

export function runSetup(
  db: Database.Database,
  initialYear: number,
  initialMonth: number,
): MonthRow[] {
  const existing = db.prepare('SELECT COUNT(*) as count FROM months').get() as { count: number };
  if (existing.count > 0) {
    throw new AppError(400, 'Setup already completed. Months already exist.');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const createdMonths: MonthRow[] = [];
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
