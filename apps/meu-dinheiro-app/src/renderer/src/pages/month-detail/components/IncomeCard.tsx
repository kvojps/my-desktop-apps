import {
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
import { Income } from '@shared/types/income';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

interface IncomeCardProps {
  income: Income;
  onReceive: () => void;
  onUnreceive: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IncomeCard({
  income,
  onReceive,
  onUnreceive,
  onViewDetail,
  onEdit,
  onDelete,
}: IncomeCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const borderColor = income.isReceived ? 'success.main' : 'warning.main';

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
              {income.name}
            </Typography>
            {income.notes && (
              <Tooltip title="Possui observação">
                <StickyNote2Outlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {income.isReceived ? (
              <Chip label="Recebida" color="success" size="small" icon={<CheckCircle />} />
            ) : (
              <Chip label="Pendente" color="warning" size="small" />
            )}
          </Stack>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          {formatCurrencyOrFallback(income.amount)}
        </Typography>
        {income.expectedDate && (
          <Typography variant="body2" color="text.secondary">
            Previsto: {formatDateOnly(income.expectedDate)}
          </Typography>
        )}
        {income.receivedAt && (
          <Typography variant="body2" color="text.secondary">
            Recebido em: {formatPaidDate(income.receivedAt)}
          </Typography>
        )}
        {income.bankAccountName && (
          <Typography variant="body2" color="text.secondary">
            {income.isReceived ? 'Conta' : 'Conta prevista'}: {income.bankAccountName}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        {income.isReceived ? (
          <Button size="small" color="warning" onClick={onUnreceive}>
            Desmarcar
          </Button>
        ) : (
          <Button size="small" variant="contained" color="success" onClick={onReceive}>
            Receber
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
