import { DarkMode, LightMode } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { useThemeMode } from '@/hooks/useThemeMode';

/**
 * Claro e escuro como duas opções nomeadas, e não como o botão de alternar do
 * rail.
 *
 * São os dois lugares certos para o mesmo controle, e não uma duplicata: no
 * rail o alvo é trocar depressa, e o ícone sozinho já diz para onde se vai;
 * aqui o alvo é **saber em qual modo o app está** e escolher, que é o que se
 * procura numa tela de Configurações. Um alternador solto não responde a
 * primeira pergunta — sem rótulo, ele mostra o destino, não o estado.
 *
 * Os dois botões carregam ícone além do rótulo porque o selecionado se
 * distingue por tingimento, e cor nunca é o único canal (§1.7).
 */
export function ThemeModeControl() {
  const { mode, setMode } = useThemeMode();

  return (
    <ToggleButtonGroup
      exclusive
      value={mode}
      // `null` é o clique no botão que já está selecionado. Não há terceiro
      // estado: o app está sempre num modo, e desmarcar não é uma resposta.
      onChange={(_, next: PaletteMode | null) => next && setMode(next)}
      aria-label="Tema do aplicativo"
    >
      <ToggleButton value="light">
        <LightMode fontSize="small" sx={{ mr: 1 }} />
        Claro
      </ToggleButton>
      <ToggleButton value="dark">
        <DarkMode fontSize="small" sx={{ mr: 1 }} />
        Escuro
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
