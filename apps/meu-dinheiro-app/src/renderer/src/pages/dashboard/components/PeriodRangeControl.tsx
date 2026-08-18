import { DateRangeOutlined } from '@mui/icons-material';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { useMemo, useState } from 'react';

export interface MonthOption {
  label: string;
  /** Competência no formato "AAAA-MM", que ordena como string. */
  value: string;
}

/** Quantos meses o atalho "3 meses" cobre, contando do mais recente para trás. */
const LAST_N = 3;

type Preset = 'last3' | 'year' | 'all';

interface PeriodRangeControlProps {
  /** Meses existentes, em ordem ascendente. */
  options: MonthOption[];
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

/** O intervalo de cada atalho, ou `null` quando ele não alcança mês nenhum. */
export function resolvePresets(options: MonthOption[]) {
  if (options.length === 0) return { last3: null, year: null, all: null };

  const first = options[0].value;
  const last = options[options.length - 1].value;

  const yearOptions = options.filter((opt) => opt.value.startsWith(`${new Date().getFullYear()}`));

  return {
    last3: { from: options[Math.max(0, options.length - LAST_N)].value, to: last },
    year:
      yearOptions.length > 0
        ? { from: yearOptions[0].value, to: yearOptions[yearOptions.length - 1].value }
        : null,
    all: { from: first, to: last },
  };
}

/**
 * O recorte de meses da tela, no `PageHeader` e não numa faixa própria.
 *
 * Ele era um `Card` de largura inteira logo abaixo do título, com os dois campos
 * de data sempre abertos — quase a mesma altura da fileira de indicadores, para
 * um controle que na prática se usa nos três atalhos. Aqui ele custa zero de
 * altura, e o `Histórico` já põe o seletor de ano exatamente neste lugar.
 *
 * Os atalhos viraram `ToggleButtonGroup`: são exclusivos e mutuamente
 * excludentes, que é o que um grupo de toggle diz e um `Chip` clicável não.
 * "De/Até" só aparece no popover, para quem precisa de um recorte que os
 * atalhos não dão.
 */
export function PeriodRangeControl({ options, from, to, onChange }: PeriodRangeControlProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const presets = useMemo(() => resolvePresets(options), [options]);

  const active: Preset | null =
    (Object.keys(presets) as Preset[]).find(
      (key) => presets[key]?.from === from && presets[key]?.to === to,
    ) ?? null;

  function applyPreset(preset: Preset) {
    const range = presets[preset];
    if (range) onChange(range.from, range.to);
  }

  // Trocar um extremo para além do outro inverteria o intervalo e esvaziaria a
  // tabela sem explicar por quê; o extremo oposto acompanha.
  function handleFromChange(value: string) {
    onChange(value, value > to ? value : to);
  }

  function handleToChange(value: string) {
    onChange(value < from ? value : from, value);
  }

  return (
    <>
      <ToggleButtonGroup
        size="small"
        exclusive
        // Sem atalho correspondente, quem fica marcado é o botão do popover —
        // ele é a representação de "personalizado" dentro do grupo.
        value={active ?? 'custom'}
        onChange={(_, next: Preset | 'custom' | null) => {
          if (next && next !== 'custom') applyPreset(next);
        }}
        aria-label="Período exibido"
      >
        <ToggleButton value="last3" disabled={!presets.last3}>
          3 meses
        </ToggleButton>
        <ToggleButton value="year" disabled={!presets.year}>
          Este ano
        </ToggleButton>
        <ToggleButton value="all" disabled={!presets.all}>
          Tudo
        </ToggleButton>
        <ToggleButton
          value="custom"
          aria-label="Período personalizado"
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <Tooltip title="Período personalizado">
            <DateRangeOutlined fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack direction="row" spacing={2} sx={{ p: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>De</InputLabel>
            <Select value={from} label="De" onChange={(e) => handleFromChange(e.target.value)}>
              {options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Até</InputLabel>
            <Select value={to} label="Até" onChange={(e) => handleToChange(e.target.value)}>
              {options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Popover>
    </>
  );
}
