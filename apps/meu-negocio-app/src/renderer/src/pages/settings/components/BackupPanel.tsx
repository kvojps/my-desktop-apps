import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/Button';

interface BackupPanelProps {
  exporting: boolean;
  importing: boolean;
  onExport: () => void;
  onImport: () => void;
}

/**
 * As duas operações de backup. Enquanto uma roda, as duas ficam bloqueadas: o
 * arquivo exportado no meio de uma importação não seria nem o banco antigo nem
 * o novo. O rótulo do botão é o que diz o que está demorando (§5.3).
 */
export function BackupPanel({ exporting, importing, onExport, onImport }: BackupPanelProps) {
  const busy = exporting || importing;
  return (
    <div className="negocio-actions-row">
      <Button variant="primary" onClick={onExport} disabled={busy}>
        <Download size={18} aria-hidden="true" />
        {exporting ? 'Exportando...' : 'Exportar Dados'}
      </Button>
      <Button onClick={onImport} disabled={busy}>
        <Upload size={18} aria-hidden="true" />
        {importing ? 'Importando...' : 'Importar Dados'}
      </Button>
    </div>
  );
}
