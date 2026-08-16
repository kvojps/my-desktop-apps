export const ROUTES = {
  DASHBOARD: '/dashboard',
  HISTORY: '/history',
  SETTINGS: '/settings',
  MONTH_DETAIL: '/months/:id',
} as const;

export function monthDetailPath(id: number | string): string {
  return `/months/${id}`;
}
