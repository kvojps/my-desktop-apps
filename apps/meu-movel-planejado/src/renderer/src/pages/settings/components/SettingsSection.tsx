import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { IconTile, type TileAccent } from '@/components/IconTile';

interface SettingsSectionProps {
  icon: ComponentType<{ sx?: object }>;
  /**
   * Cor de identidade da seção. Seção que é operação, e não escolha guardada,
   * fica neutra — é o que faz a cor das outras significar alguma coisa (§1.5).
   */
  accent?: TileAccent;
  title: string;
  description: string;
  /** A seção nasce aberta. Reservado ao conteúdo principal da página. */
  defaultExpanded?: boolean;
  /**
   * A seção falhou ao carregar. Cada seção falha por conta própria (§5.3), mas
   * um erro atrás de acordeão fechado não é um erro visível: quando ele
   * aparece, a seção se abre sozinha. Fechar de novo continua sendo do usuário.
   */
  hasError?: boolean;
  children: ReactNode;
}

/**
 * Uma seção de Configurações: ladrilho, título e uma linha de explicação no
 * cabeçalho, conteúdo no painel.
 *
 * O cabeçalho é o que se lê com a seção fechada, então é ele que precisa dizer
 * o que tem dentro — e é por isso que a altura dele é a mesma aberto e fechado
 * (o override de `MuiAccordionSummary` no tema).
 */
export function SettingsSection({
  icon,
  accent,
  title,
  description,
  defaultExpanded = false,
  hasError = false,
  children,
}: SettingsSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (hasError) setExpanded(true);
  }, [hasError]);

  return (
    <Accordion expanded={expanded} onChange={(_, open) => setExpanded(open)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
          <IconTile icon={icon} accent={accent} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}
