import {
  AttachFile,
  CheckCircle,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert,
  StickyNote2Outlined,
  Visibility,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Expense } from '@shared/types/expense';
import { api } from '@/api/client';
import { CategoryTag } from '@/components/CategoryTag';
import { formatDateOnly, formatPaidDate, todayDateString } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

interface ExpenseCardProps {
  expense: Expense;
  onPay: () => void;
  onUnpay: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseCard({
  expense,
  onPay,
  onUnpay,
  onViewDetail,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const isOverdue = !expense.isPaid && !!expense.dueDate && expense.dueDate < todayDateString();

  let borderColor: string = 'warning.main';
  if (expense.isPaid) borderColor = 'success.main';
  else if (isOverdue) borderColor = 'error.main';

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '4px solid',
        borderLeftColor: borderColor,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="h6" gutterBottom>
              {expense.name}
            </Typography>
            {expense.notes && (
              <Tooltip title="Possui observação">
                <StickyNote2Outlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {expense.isPaid ? (
              <Chip label="Paga" color="success" size="small" icon={<CheckCircle />} />
            ) : isOverdue ? (
              <Chip label="Vencida" color="error" size="small" />
            ) : (
              <Chip label="Pendente" color="warning" size="small" />
            )}
          </Stack>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          {formatCurrencyOrFallback(expense.amount)}
        </Typography>
        <Divider sx={{ mb: 1 }} />
        {/* Duas colunas só quando cabem: num card de ~280px (janela mínima, três
            por linha) "Vencimento" e "Comprovante" eram cortados no meio pela
            borda do card. Abaixo disso os campos empilham. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
            columnGap: 2,
            rowGap: 1,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" component="div">
              Categoria
            </Typography>
            <CategoryTag
              name={expense.categoryName}
              color={expense.categoryColor}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" component="div">
              Vencimento
            </Typography>
            <Typography variant="body2">
              {expense.dueDate ? formatDateOnly(expense.dueDate) : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" component="div">
              Pago em
            </Typography>
            <Typography variant="body2">
              {expense.paidAt ? formatPaidDate(expense.paidAt) : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" component="div">
              Comprovante
            </Typography>
            {expense.receipt ? (
              <Button
                size="small"
                startIcon={<AttachFile fontSize="small" />}
                onClick={() => api.openReceipt(expense.receipt!)}
                sx={{ minWidth: 0, px: 0.5 }}
              >
                Ver
              </Button>
            ) : (
              <Typography variant="body2">—</Typography>
            )}
          </Box>
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        {expense.isPaid ? (
          <Button size="small" color="warning" onClick={onUnpay}>
            Desmarcar
          </Button>
        ) : (
          <Button size="small" variant="contained" onClick={onPay}>
            Pagar
          </Button>
        )}
        <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
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
      </CardActions>
    </Card>
  );
}
