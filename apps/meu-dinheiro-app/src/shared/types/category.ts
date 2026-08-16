export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CategoryTotal {
  category_id: number | null;
  name: string | null;
  color: string | null;
  total: number;
  count: number;
}
