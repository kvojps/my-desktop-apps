import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useId } from 'react';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface MonthYearPickerProps {
  label: string;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

/**
 * "De:" e "Até:" nomeiam o par de campos, não um campo — daí o `role="group"`
 * com `aria-labelledby`. Sem isso o leitor de tela anuncia quatro campos
 * chamados "Mês" e "Ano", sem dizer qual ponta do intervalo é qual.
 */
export function MonthYearPicker({
  label,
  month,
  year,
  onMonthChange,
  onYearChange,
}: MonthYearPickerProps) {
  const labelId = useId();

  return (
    <Box>
      <Typography
        id={labelId}
        variant="caption"
        color="text.secondary"
        sx={{ mb: 0.5, display: 'block' }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={1} role="group" aria-labelledby={labelId}>
        {/* `Select` do MUI e não `native`: o nativo era o único do app, e ele
            não recebe nem o tema nem o `CONTROL_RADIUS` dos outros controles. */}
        <TextField
          select
          label="Mês"
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          sx={{ minWidth: 130 }}
          size="small"
        >
          {MONTH_NAMES.map((name, i) => (
            <MenuItem key={name} value={i + 1}>
              {name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Ano"
          type="number"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          inputProps={{ min: 2000, max: 2100 }}
          sx={{ width: 100 }}
          size="small"
        />
      </Stack>
    </Box>
  );
}
