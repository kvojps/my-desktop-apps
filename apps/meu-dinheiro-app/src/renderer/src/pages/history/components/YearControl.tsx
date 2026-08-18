import { ExpandMoreOutlined } from '@mui/icons-material';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';

/** Quantos anos ficam como atalho antes de o resto cair no popover. */
const SHORTCUT_YEARS = 3;

interface YearControlProps {
  /** Anos com mês cadastrado, do mais recente para o mais antigo. */
  years: number[];
  value: number;
  onChange: (year: number) => void;
}

/**
 * O recorte do Histórico, no `PageHeader` e no mesmo vocabulário do
 * `PeriodRangeControl` da Visão Geral: os anos são opções exclusivas, que é o
 * que um grupo de toggle diz e um `Select` com setas ao redor não.
 *
 * Os atalhos saem em ordem **ascendente**, mesmo com `years` vindo do mais
 * recente: a linha do tempo cresce para a direita no gráfico logo abaixo, e um
 * seletor que cresce para a esquerda contradiz o eixo que ele controla.
 */
export function YearControl({ years, value, onChange }: YearControlProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const shortcuts = years.slice(0, SHORTCUT_YEARS).reverse();
  const hasMore = years.length > SHORTCUT_YEARS;
  const isShortcut = shortcuts.includes(value);

  function handleSelect(year: number) {
    onChange(year);
    setAnchor(null);
  }

  return (
    <>
      <ToggleButtonGroup
        size="small"
        exclusive
        // Ano fora dos atalhos deixa marcado o botão do popover — ele é a
        // representação de "um ano mais antigo" dentro do grupo.
        value={isShortcut ? value : 'more'}
        onChange={(_, next: number | 'more' | null) => {
          if (typeof next === 'number') onChange(next);
        }}
        aria-label="Ano exibido"
      >
        {shortcuts.map((year) => (
          <ToggleButton key={year} value={year}>
            {year}
          </ToggleButton>
        ))}
        {hasMore && (
          <ToggleButton
            value="more"
            aria-label="Outro ano"
            onClick={(e) => setAnchor(e.currentTarget)}
          >
            <Tooltip title="Outro ano">
              <ExpandMoreOutlined fontSize="small" />
            </Tooltip>
          </ToggleButton>
        )}
      </ToggleButtonGroup>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <FormControl size="small" sx={{ m: 2, minWidth: 160 }}>
          <InputLabel>Ano</InputLabel>
          <Select
            value={value || ''}
            label="Ano"
            onChange={(e) => handleSelect(Number(e.target.value))}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Popover>
    </>
  );
}
