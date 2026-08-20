import { Search, WarningAmber } from '@mui/icons-material';
import {
  Badge,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import type { FilterState } from '@/hooks/products/useProducts';

interface ProductFiltersProps {
  filters: FilterState;
  categories: string[];
  lowStockCount: number;
  onChange: (filters: FilterState) => void;
}

export function ProductFilters({
  filters,
  categories,
  lowStockCount,
  onChange,
}: ProductFiltersProps) {
  return (
    // Sem superfície própria: a tabela logo abaixo já é um `Paper` com borda, e
    // dois retângulos empilhados leem como duas seções quando são uma (§4).
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <Tooltip title="Buscar por nome, categoria, fornecedor">
        <TextField
          size="small"
          placeholder="Buscar por nome, categoria, fornecedor"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          sx={{
            minWidth: 220,
            maxWidth: 320,
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Tooltip>
      <TextField
        select
        size="small"
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        sx={{ minWidth: 200, maxWidth: 280, '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
        slotProps={{
          select: {
            displayEmpty: true,
            renderValue: (value) =>
              value ? (
                <Typography
                  component="span"
                  variant="body2"
                  noWrap
                  title={value as string}
                  sx={{ display: 'block' }}
                >
                  {value as string}
                </Typography>
              ) : (
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block' }}
                >
                  Todas as categorias
                </Typography>
              ),
          },
        }}
      >
        <MenuItem value="">Todas as categorias</MenuItem>
        {categories.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {cat}
          </MenuItem>
        ))}
      </TextField>
      {lowStockCount > 0 && (
        <ToggleButton
          value="lowStockOnly"
          selected={filters.lowStockOnly}
          onChange={() => onChange({ ...filters, lowStockOnly: !filters.lowStockOnly })}
          size="small"
          color="warning"
        >
          <WarningAmber sx={{ fontSize: 16 }} />
          <Stack component="span" sx={{ ml: 1, mr: 1.5 }}>
            Estoque baixo
          </Stack>
          <Badge
            badgeContent={lowStockCount}
            color="warning"
            sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
          />
        </ToggleButton>
      )}
    </Stack>
  );
}
