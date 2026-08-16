import { Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface CategoryTagProps {
  name?: string | null;
  color?: string | null;
  /** Exibido quando a despesa não tem categoria. */
  fallback?: string;
  sx?: SxProps<Theme>;
}

/**
 * Categoria como ponto colorido + texto normal. A cor saturada do app fica
 * reservada para status (paga / pendente / vencida), então a cor da categoria
 * nunca disputa significado com ela dentro do mesmo card.
 */
export function CategoryTag({ name, color, fallback = '—', sx }: CategoryTagProps) {
  if (!name) {
    return <Typography variant="body2">{fallback}</Typography>;
  }

  return (
    // `minWidth: 0` nos dois níveis: sem isso o item flex se recusa a encolher
    // abaixo do texto, o `noWrap` nunca chega a reticenciar e nomes longos
    // ("Transporte e Combustível") vazam para fora do card, que os corta.
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: color ?? 'text.disabled',
        }}
      />
      <Typography variant="body2" noWrap title={name} sx={{ minWidth: 0 }}>
        {name}
      </Typography>
    </Stack>
  );
}
