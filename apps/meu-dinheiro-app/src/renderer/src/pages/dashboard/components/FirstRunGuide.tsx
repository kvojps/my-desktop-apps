import { Landmark, Receipt, Settings, Tag } from 'lucide-react';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import type { TileAccent } from '@/theme/orca';

const STEPS: { icon: typeof Landmark; accent: TileAccent; title: string; description: string }[] = [
  {
    icon: Landmark,
    accent: 'primary',
    title: 'Cadastre suas contas',
    description: 'É de onde saem os pagamentos e para onde entram os recebimentos.',
  },
  {
    icon: Tag,
    accent: 'warning',
    title: 'Ajuste as categorias',
    description: 'Dez já vêm prontas; renomeie ou troque a cor das que você usa.',
  },
  {
    icon: Receipt,
    accent: 'secondary',
    title: 'Cadastre as despesas e entradas fixas',
    description: 'Elas são criadas automaticamente em todo mês novo.',
  },
];

interface FirstRunGuideProps {
  onGoToSettings: () => void;
}

/**
 * A primeira tela de quem ainda não tem mês nenhum. Não é uma lista vazia: é a
 * ordem em que os três cadastros precisam acontecer para o app montar os meses
 * sozinho, com a saída para onde eles são feitos (§5.4).
 */
export function FirstRunGuide({ onGoToSettings }: FirstRunGuideProps) {
  return (
    <section className="money-panel money-guide">
      <h2>Nenhum mês cadastrado</h2>
      <p>Três passos em Configurações e o app já monta os meses para você.</p>

      <ol>
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <IconTile icon={step.icon} accent={step.accent} />
            <div>
              <strong>
                {index + 1}. {step.title}
              </strong>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="money-guide-actions">
        <Button variant="primary" onClick={onGoToSettings}>
          <Settings size={18} aria-hidden="true" />
          Ir para Configurações
        </Button>
      </div>
    </section>
  );
}
