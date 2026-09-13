import { Download, HardDriveDownload, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import { SectionHeader } from './SectionHeader';

interface BackupSectionProps {
  titleId: string;
  exporting: boolean;
  importing: boolean;
  onExport: () => void;
  /** Abre a confirmação — a substituição é declarada **antes** do seletor. */
  onAskImport: () => void;
}

/**
 * Exportar e importar o backup completo.
 *
 * Importar não abre o seletor de arquivo direto: ele substitui todos os dados,
 * e escolher o arquivo primeiro faria a confirmação chegar depois da decisão.
 * A ordem é confirmar, depois escolher.
 */
export function BackupSection({
  titleId,
  exporting,
  importing,
  onExport,
  onAskImport,
}: BackupSectionProps) {
  return (
    <>
      <SectionHeader
        icon={HardDriveDownload}
        title="Backup"
        description="Um arquivo ZIP com meses, despesas, entradas, cadastros e comprovantes."
        titleId={titleId}
      />

      <div className="money-backup">
        <div className="money-backup-actions">
          <Button variant="primary" onClick={onExport} disabled={exporting}>
            <Download size={18} aria-hidden="true" />
            {exporting ? 'Exportando...' : 'Exportar'}
          </Button>
          <Button onClick={onAskImport} disabled={importing}>
            <Upload size={18} aria-hidden="true" />
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        </div>
        <p className="money-description">
          Exportar grava o arquivo onde você escolher. Importar aceita arquivos exportados por
          qualquer versão do app e <strong>substitui todos os dados atuais</strong> — um arquivo
          inválido é recusado inteiro, sem alterar nada.
        </p>
      </div>
    </>
  );
}
