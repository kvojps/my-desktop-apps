import { Settings } from 'lucide-react';
import { useId, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { useAppInfo } from '@/hooks/settings/useAppInfo';
import { useDataTransfer } from '@/hooks/settings/useDataTransfer';
import { useSettings } from '@/hooks/settings/useSettings';
import { AppInfoPanel } from './components/AppInfoPanel';
import { BackupPanel } from './components/BackupPanel';
import { CompanyForm } from './components/CompanyForm';
import { SettingsNav } from './components/SettingsNav';
import { SettingsSection } from './components/SettingsSection';
import type { SectionId } from './sections';

/**
 * Configurações: três assuntos independentes — empresa, backup e informações
 * do app — numa navegação interna, uma seção visível por vez. A empresa abre
 * primeiro porque é o que se vem editar aqui; backup e informações são consulta
 * pontual. O tema não mora nesta tela: fica no rodapé da lateral, com o modo
 * atual no nome (exceção local registrada em docs/orca-theme.md).
 *
 * Os dados e a seleção vivem aqui, acima dos painéis, e os painéis ficam todos
 * montados: trocar de seção ou redimensionar a janela não desfaz nada do que
 * foi digitado. Cada seção carrega e falha por conta própria (§5.3), e a
 * falha aparece na navegação além do painel.
 */
export function SettingsPage() {
  const [active, setActive] = useState<SectionId>('company');
  const idBase = useId();
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
    <div className="negocio-page">
      <PageHeader
        icon={<Settings />}
        title="Configurações"
        subtitle="Dados da empresa, backup e informações do aplicativo"
      />

      <div className="negocio-settings">
        <SettingsNav
          idBase={idBase}
          active={active}
          onChange={setActive}
          failed={{ company: !!settingsForm.error, about: !!appInfo.error }}
        />

        <SettingsSection idBase={idBase} id="company" active={active === 'company'}>
          <CompanyForm formState={settingsForm} />
        </SettingsSection>

        <SettingsSection idBase={idBase} id="backup" active={active === 'backup'}>
          <BackupPanel
            exporting={exporting}
            importing={importing}
            onExport={handleExport}
            onImport={requestImport}
          />
        </SettingsSection>

        <SettingsSection idBase={idBase} id="about" active={active === 'about'}>
          <AppInfoPanel info={appInfo} />
        </SettingsSection>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Importar dados"
        onConfirm={confirmImport}
        onClose={cancelImport}
        confirmLabel="Importar"
        loadingLabel="Importando..."
        loading={importing}
        message="Importar um arquivo de backup substituirá todos os produtos e pedidos atuais. Essa ação não pode ser desfeita. Deseja continuar?"
        confirmColor="error"
      />
    </div>
  );
}
