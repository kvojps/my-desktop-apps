import {
  AttachFile,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert,
  StickyNote2Outlined,
  Visibility,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { KeyboardEvent, MouseEvent, ReactNode, useState } from 'react';
import { contentQuery } from '@/theme';
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
  color: 'primary' | 'success' | 'warning';
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
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  function closeMenu() {
    setMenuAnchor(null);
  }

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
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <Tooltip title={status.label}>
          <Box
            aria-label={status.label}
            sx={{ display: 'flex', color: `${status.color}.main`, flexShrink: 0 }}
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
        <IconButton
          size="small"
          aria-label={`Mais ações para ${name}`}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <MoreVert fontSize="small" />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              closeMenu();
              onViewDetail();
            }}
          >
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver detalhes</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onEdit();
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onDelete();
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>
    </Paper>
  );
}
