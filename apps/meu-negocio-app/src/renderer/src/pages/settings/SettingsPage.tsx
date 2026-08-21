import {
  Download,
  ImportExportOutlined,
  InfoOutlined,
  SettingsOutlined,
  StorefrontOutlined,
  Upload,
} from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { useAppInfo } from '@/hooks/settings/useAppInfo';
import { useDataTransfer } from '@/hooks/settings/useDataTransfer';
import { useSettings } from '@/hooks/settings/useSettings';
import { AppInfoPanel } from './components/AppInfoPanel';
import { CompanyForm } from './components/CompanyForm';
import { SettingsSection } from './components/SettingsSection';

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

      <Stack spacing={3}>
        {/* A única seção que nasce aberta: é o que se vem editar aqui. Backup e
            informações do app são consulta pontual, e fechados eles cabem na
            tela junto do formulário. */}
        <SettingsSection
          icon={StorefrontOutlined}
          accent="primary"
          title="Dados da Empresa"
          description="Cabeçalho dos documentos gerados pelo app e do arquivo de backup"
          defaultExpanded
          hasError={!!settingsForm.error}
        >
          <CompanyForm formState={settingsForm} />
        </SettingsSection>

        <SettingsSection
          icon={ImportExportOutlined}
          title="Exportar e Importar Dados"
          description="Backup dos produtos e pedidos em arquivo, e restauração a partir dele"
        >
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
        </SettingsSection>

        <SettingsSection
          icon={InfoOutlined}
          title="Sobre o Aplicativo"
          description="Versão e caminho do banco — informe ao pedir ajuda ou ao trocar de computador"
          hasError={!!appInfo.error}
        >
          <AppInfoPanel info={appInfo} />
        </SettingsSection>
      </Stack>

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
