export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface CategoryTotal {
  categoryId: number | null;
  name: string | null;
  color: string | null;
  total: number;
  count: number;
}
