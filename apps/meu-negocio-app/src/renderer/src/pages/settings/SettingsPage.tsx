import { Download, SettingsOutlined, Upload } from '@mui/icons-material';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { useAppInfo } from '@/hooks/settings/useAppInfo';
import { useDataTransfer } from '@/hooks/settings/useDataTransfer';
import { useSettings } from '@/hooks/settings/useSettings';
import { AppInfoCard } from './components/AppInfoCard';
import { CompanyForm } from './components/CompanyForm';

export function SettingsPage() {
  const settingsForm = useSettings();
  const appInfo = useAppInfo();
  const {
    exporting,
    importing,
    confirmOpen,
    handleExport,
    requestImport,
    cancelImport,
    confirmImport,
  } = useDataTransfer();

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<SettingsOutlined />}
        title="Configurações"
        subtitle="Dados da empresa, backup e informações do aplicativo"
      />

      <CompanyForm formState={settingsForm} />

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Exportar e Importar Dados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Exporte todos os produtos e pedidos para um arquivo de backup, ou importe um arquivo
            existente para restaurar os dados.
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exportando...' : 'Exportar Dados'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={requestImport}
              disabled={importing}
            >
              {importing ? 'Importando...' : 'Importar Dados'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <AppInfoCard info={appInfo} />

      <ConfirmDialog
        open={confirmOpen}
        title="Importar dados"
        onConfirm={confirmImport}
        onClose={cancelImport}
        confirmLabel="Importar"
        loadingLabel="Importando..."
        loading={importing}
        message={
          <>
            Importar um arquivo de backup substituirá todos os produtos e pedidos atuais. Essa ação
            não pode ser desfeita. Deseja continuar?
          </>
        }
        confirmColor="error"
      />
    </Stack>
  );
}
