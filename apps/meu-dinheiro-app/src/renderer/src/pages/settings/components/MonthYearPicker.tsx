import { Box, Stack, TextField, Typography } from '@mui/material';

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

export function MonthYearPicker({
  label,
  month,
  year,
  onMonthChange,
  onYearChange,
}: MonthYearPickerProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          select
          label="Mês"
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          sx={{ minWidth: 130 }}
          SelectProps={{ native: true }}
          size="small"
        >
          {MONTH_NAMES.map((n, i) => (
            <option key={i} value={i + 1}>
              {n}
            </option>
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
