import { Search, TriangleAlert } from 'lucide-react';
import { Field, SelectInput, TextInput } from '@/components/Field';
import type { FilterState } from '@/hooks/products/useProducts';

interface ProductFiltersProps {
  filters: FilterState;
  categories: string[];
  lowStockCount: number;
  onChange: (filters: FilterState) => void;
  children?: React.ReactNode;
}

export function ProductFilters({
  filters,
  categories,
  lowStockCount,
  onChange,
  children,
}: ProductFiltersProps) {
  return (
    // Sem superfície própria: a tabela logo abaixo já é um `Paper` com borda, e
    // dois retângulos empilhados leem como duas seções quando são uma (§4).
    <div className="negocio-filters">
      <Field label="Buscar">
        <div className="negocio-search">
          <Search size={16} aria-hidden="true" />
          <TextInput
            aria-label="Buscar por nome, categoria, fornecedor"
            placeholder="Nome, categoria ou fornecedor"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
      </Field>
      <Field label="Categoria">
        <SelectInput
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </SelectInput>
      </Field>
      {lowStockCount > 0 && (
        <button
          type="button"
          className="negocio-filter-toggle"
          aria-pressed={filters.lowStockOnly}
          onClick={() => onChange({ ...filters, lowStockOnly: !filters.lowStockOnly })}
        >
          <TriangleAlert size={16} aria-hidden="true" /> Estoque baixo <span>{lowStockCount}</span>
        </button>
      )}
      {children}
    </div>
  );
}
