import {
  FileDownload,
  FileUpload,
  ImportExportOutlined,
  InfoOutlined,
  PaletteOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { useAppInfo } from '@/hooks/settings/useAppInfo';
import { useDataTransfer } from '@/hooks/settings/useDataTransfer';
import { AppInfoPanel } from './components/AppInfoPanel';
import { SettingsSection } from './components/SettingsSection';
import { ThemeModeControl } from './components/ThemeModeControl';

/**
 * Configurações. Três seções em acordeão, com só a primeira aberta: o cabeçalho
 * de cada uma diz o que tem dentro, e fechadas as três cabem na tela de uma vez
 * (design system, §6 — acordeão como estrutura de página).
 *
 * O backup nasce aberto porque é o que se vem fazer aqui. Tema e informações do
 * app são consulta pontual — e o tema tem o alternador do rail, sempre à mão em
 * qualquer tela.
 */
export function SettingsPage() {
  const appInfo = useAppInfo();
  const {
    exporting,
    importing,
    confirmOpen,
    exportData,
    requestImport,
    cancelImport,
    confirmImport,
  } = useDataTransfer();

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<SettingsOutlined />}
        title="Configurações"
        subtitle="Backup dos dados, aparência e informações do aplicativo"
      />

      <Stack spacing={3}>
        <SettingsSection
          icon={ImportExportOutlined}
          accent="primary"
          title="Backup dos dados"
          description="Salva os projetos, as peças, as chapas e os planos num arquivo — e restaura a partir dele"
          defaultExpanded
        >
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Os dados ficam só neste computador. O arquivo exportado é o que resta se ele se
              perder, e é por ele que os projetos chegam a outra máquina.
            </Typography>

            {/* O rótulo do botão troca enquanto a ação acontece, e não há
                spinner: o olho já está no botão, e o rótulo diz o que está
                demorando (§5.3). */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<FileDownload />}
                onClick={exportData}
                disabled={exporting}
              >
                {exporting ? 'Exportando...' : 'Exportar dados'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileUpload />}
                onClick={requestImport}
                disabled={importing}
              >
                {importing ? 'Importando...' : 'Importar dados'}
              </Button>
            </Stack>
          </Stack>
        </SettingsSection>

        <SettingsSection
          icon={PaletteOutlined}
          title="Aparência"
          description="Tema claro ou escuro, guardado para as próximas vezes que o app abrir"
        >
          <ThemeModeControl />
        </SettingsSection>

        <SettingsSection
          icon={InfoOutlined}
          title="Sobre o aplicativo"
          description="Versão e onde os dados moram em disco — o que informar ao pedir ajuda ou ao trocar de computador"
          hasError={!!appInfo.error}
        >
          <AppInfoPanel state={appInfo} />
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
            Importar um backup <strong>apaga todos os projetos, peças, chapas e planos</strong> que
            existem hoje neste computador e põe no lugar os do arquivo. Não há como desfazer.
            <br />
            <br />
            Se o arquivo for recusado, nada é alterado.
          </>
        }
        confirmColor="error"
      />
    </Stack>
  );
}
