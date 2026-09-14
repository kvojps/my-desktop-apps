import { Info } from 'lucide-react';
import { DetailField } from '@/pages/month-detail/components/DetailField';
import { SectionHeader } from './SectionHeader';

interface AboutSectionProps {
  titleId: string;
}

/** As informações do aplicativo instalado — nome, versão e finalidade. */
export function AboutSection({ titleId }: AboutSectionProps) {
  return (
    <>
      <SectionHeader
        icon={Info}
        title="Sobre"
        description="Informações do aplicativo instalado."
        titleId={titleId}
      />

      <div className="money-panel money-about">
        <dl className="money-detail">
          <DetailField label="Aplicativo">Meu Dinheiro</DetailField>
          <DetailField label="Versão">{__APP_VERSION__}</DetailField>
        </dl>
        <p className="money-description">
          Controle de finanças pessoais: contas bancárias, categorias, despesas e entradas padrão,
          criação de meses e backup dos dados.
        </p>
      </div>
    </>
  );
}
