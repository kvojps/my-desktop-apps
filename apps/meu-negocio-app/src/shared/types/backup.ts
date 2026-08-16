import type { Order } from './order';
import type { Product } from './product';
import type { CompanySettings } from './settings';

export interface BackupData {
  version: number;
  exportedAt: string;
  products: Product[];
  orders: Order[];
  settings: CompanySettings;
}
