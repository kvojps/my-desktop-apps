import { AttachFile, StickyNote2Outlined } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { ActionsMenu } from '@/components/ActionsMenu';
import { CONTROL_RADIUS, contentQuery } from '@/theme';
import { formatCurrencyOrFallback } from '@/utils/format';

export interface ItemRowStatus {
  /** Chave da paleta usada na barra lateral e no ícone. */
  color: 'success' | 'warning' | 'error';
  /** Texto do ícone de status — o cue não-cromático exigido pela cor sozinha. */
  label: string;
  icon: ReactNode;
}

export interface ItemRowAction {
  label: string;
  onClick: () => void;
  variant: 'contained' | 'text';
  /** Sem `warning`: como rótulo de botão o âmbar dá 1.83:1 sobre o papel. */
  color: 'primary' | 'success';
}

interface ItemRowProps {
  name: string;
  hasNotes?: boolean;
  hasReceipt?: boolean;
  status: ItemRowStatus;
  /** Coluna secundária: categoria (despesa) ou conta bancária (entrada). */
  secondary: ReactNode;
  metaLabel: string;
  metaValue: string;
  /** Pinta a data de vermelho quando a conta está vencida. */
  metaHighlight?: boolean;
  amount: number | null | undefined;
  action: ItemRowAction;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Uma conta em uma linha só. Layout em grade para que nome, categoria, data e
 * valor fiquem alinhados entre linhas vizinhas — é isso que torna a lista
 * escaneável, e é por isso que as colunas têm largura fixa e não `auto`.
 *
 * As colunas fixas só cabem quando há espaço: com 790px de conteúdo (janela
 * mínima) as cinco colunas deixavam 97px para o nome, o campo mais importante
 * da linha, que virava "Fin…". Então a densidade cede em dois passos, medidos
 * sobre a largura real do conteúdo e não sobre a da janela:
 *
 *   ≥1000px  nome | categoria | data | valor | ações
 *   ≥640px   nome | data | valor | ações  (categoria desce para a linha de apoio)
 *   <640px   nome + linha de apoio | valor, com as ações numa segunda linha
 */
export function ItemRow({
  name,
  hasNotes,
  hasReceipt,
  status,
  secondary,
  metaLabel,
  metaValue,
  metaHighlight,
  amount,
  action,
  onViewDetail,
  onEdit,
  onDelete,
}: ItemRowProps) {
  /** As ações da linha não devem disparar o clique de "ver detalhes". */
  function stopRowClick(event: MouseEvent) {
    event.stopPropagation();
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onViewDetail();
    }
  }

  return (
    <Paper
      role="button"
      tabIndex={0}
      aria-label={`${name} — ver detalhes`}
      onClick={onViewDetail}
      onKeyDown={handleRowKeyDown}
      sx={{
        display: 'grid',
        alignItems: 'center',
        // Todas as colunas depois da primeira têm largura fixa — inclusive a de
        // ações. Com `auto` ali, "Pagar" e "Desmarcar" têm larguras diferentes e
        // empurram as colunas vizinhas, desalinhando linhas pagas e pendentes.
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        [contentQuery.medium]: {
          gridTemplateColumns: 'minmax(0, 1fr) 116px 132px 148px',
        },
        [contentQuery.wide]: {
          gridTemplateColumns: 'minmax(0, 1fr) 160px 132px 148px 152px',
        },
        columnGap: 2,
        rowGap: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: `${status.color}.main`,
        transition: (theme) =>
          theme.transitions.create(['background-color', 'border-color'], {
            duration: theme.transitions.duration.shortest,
          }),
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <Tooltip title={status.label}>
          {/* Ladrilho preenchido, e não glifo colorido: âmbar sobre papel dá
              1.83:1, abaixo até do limiar de 3:1 de gráfico não-textual. No
              preenchimento a cor é legível e o rótulo sai do `contrastText`.
              O ícone e o tooltip seguem dizendo a mesma coisa sem a cor. */}
          <Box
            aria-label={status.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              width: 26,
              height: 26,
              borderRadius: `${CONTROL_RADIUS / 2}px`,
              bgcolor: `${status.color}.main`,
              color: `${status.color}.contrastText`,
            }}
          >
            {status.icon}
          </Box>
        </Tooltip>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap title={name} sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            {hasNotes && (
              <Tooltip title="Possui observação">
                <StickyNote2Outlined
                  fontSize="small"
                  sx={{ color: 'text.secondary', flexShrink: 0 }}
                />
              </Tooltip>
            )}
            {hasReceipt && (
              <Tooltip title="Possui comprovante">
                <AttachFile fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
              </Tooltip>
            )}
          </Stack>
          {/* Recupera o que as colunas do meio deixaram de mostrar: cada parte
              some daqui exatamente quando ganha coluna própria. */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ display: 'flex', mt: 0.25, [contentQuery.wide]: { display: 'none' } }}
          >
            {secondary}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'inline', [contentQuery.medium]: { display: 'none' } }}
            >
              ·
            </Typography>
            <Typography
              variant="caption"
              color={metaHighlight ? 'error.main' : 'text.secondary'}
              sx={{
                fontWeight: metaHighlight ? 600 : 400,
                [contentQuery.medium]: { display: 'none' },
              }}
            >
              {metaLabel}: {metaValue}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ display: 'none', minWidth: 0, [contentQuery.wide]: { display: 'block' } }}>
        {secondary}
      </Box>

      <Box sx={{ display: 'none', [contentQuery.medium]: { display: 'block' } }}>
        <Typography variant="caption" color="text.secondary" component="div">
          {metaLabel}
        </Typography>
        <Typography
          variant="body2"
          color={metaHighlight ? 'error.main' : 'text.primary'}
          sx={{ fontWeight: metaHighlight ? 600 : 400 }}
        >
          {metaValue}
        </Typography>
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'right' }}>
        {formatCurrencyOrFallback(amount, '—')}
      </Typography>

      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        onClick={stopRowClick}
        sx={{
          gridColumn: '1 / -1',
          justifyContent: 'flex-end',
          [contentQuery.medium]: { gridColumn: 'auto' },
        }}
      >
        <Button size="small" variant={action.variant} color={action.color} onClick={action.onClick}>
          {action.label}
        </Button>
        <ActionsMenu
          ariaLabel={`Mais ações para ${name}`}
          onView={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Stack>
    </Paper>
  );
}
