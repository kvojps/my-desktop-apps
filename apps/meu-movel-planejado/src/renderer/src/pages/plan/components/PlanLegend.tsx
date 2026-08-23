import { Box, Stack, Typography } from '@mui/material';
import { CONTROL_RADIUS, labelOn } from '@/theme';
import { formatDimensions } from '@/utils/format';
import type { SheetLegendEntry } from '../planLegend';

/**
 * A legenda da chapa à vista: quem é cada número desenhado nela.
 *
 * Ela não é um enfeite do desenho — é a metade dele. O rótulo só aparece dentro
 * da peça quando cabe, e "cabe" é medido; nas peças estreitas o que sobra é o
 * número, e é aqui que ele vira "3. Lateral, 800,0 × 400,0 mm".
 *
 * Fica **fora** da caixa do desenho, como o cabeçalho e a navegação: é o que
 * confina o movimento ao desenho quando se troca de chapa (design system,
 * §5.3).
 */

/** Lado do quadradinho de cor, com o número da peça dentro. */
const SWATCH_SIZE = 26;

interface PlanLegendProps {
  entries: SheetLegendEntry[];
}

export function PlanLegend({ entries }: PlanLegendProps) {
  return (
    <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {entries.map((entry) => (
        <Stack key={entry.key} component="li" direction="row" spacing={1.5} alignItems="flex-start">
          {/* O número mora dentro da cor: é o mesmo par que está no desenho, e
              separá-los obrigaria a fazer a correspondência duas vezes. */}
          <Box
            aria-hidden
            sx={{
              flexShrink: 0,
              width: SWATCH_SIZE,
              height: SWATCH_SIZE,
              borderRadius: `${CONTROL_RADIUS}px`,
              bgcolor: entry.color,
              color: labelOn(entry.color),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {entry.number}
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {/* Peça sem rótulo é reconhecida pela medida, como na lista de
                  peças: inventar "Sem rótulo" acrescentaria uma palavra que não
                  ajuda a achar o pedaço na bancada. */}
              {entry.label || formatDimensions(entry.lengthTenthsMm, entry.widthTenthsMm)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {entry.label
                ? `${formatDimensions(entry.lengthTenthsMm, entry.widthTenthsMm)} · ${entry.count}× nesta chapa`
                : `${entry.count}× nesta chapa`}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
