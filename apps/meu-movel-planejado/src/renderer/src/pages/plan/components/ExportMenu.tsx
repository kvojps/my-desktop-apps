import { ArrowDropDown, FileDownload, Image, PictureAsPdf } from '@mui/icons-material';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { type MouseEvent, useState } from 'react';
import type { ExportFormat } from '@/hooks/plan/useExportPlan';

/**
 * As duas saídas em arquivo do plano, num menu só.
 *
 * Menu, e não dois botões: PNG e PDF são a mesma intenção — levar o plano para
 * fora do app —, e separá-los em dois botões poria três ações de peso igual ao
 * lado de imprimir, que é a ação primária desta tela.
 *
 * Cada item diz para que serve o formato. Quem está aqui não escolhe entre
 * `.png` e `.pdf`; escolhe entre mandar para o ajudante e arquivar com o
 * orçamento, e é essa a decisão que o menu deveria estar tomando.
 */

interface ExportMenuProps {
  onExportPng: () => void;
  onExportPdf: () => void;
  /** Qual formato está sendo salvo, ou `null` quando nenhum está. */
  exportingFormat: ExportFormat | null;
}

export function ExportMenu({ onExportPng, onExportPdf, exportingFormat }: ExportMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  function close() {
    setAnchorEl(null);
  }

  function run(action: () => void) {
    // O menu fecha antes de o diálogo do sistema abrir: um menu aberto atrás de
    // um diálogo modal fica preso lá até o diálogo sair.
    close();
    action();
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileDownload />}
        endIcon={<ArrowDropDown />}
        // O rótulo troca enquanto o diálogo do sistema está aberto, que é o
        // único sinal de ação em andamento que o app usa (design system, §5.3).
        disabled={exportingFormat !== null}
        onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
      >
        {exportingFormat ? 'Salvando...' : 'Exportar'}
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        <MenuItem onClick={() => run(onExportPng)}>
          <ListItemIcon>
            <Image sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="Imagem PNG" secondary="Para mandar pelo celular" />
        </MenuItem>

        <MenuItem onClick={() => run(onExportPdf)}>
          <ListItemIcon>
            <PictureAsPdf sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="Documento PDF" secondary="Para arquivar com o orçamento" />
        </MenuItem>
      </Menu>
    </>
  );
}
