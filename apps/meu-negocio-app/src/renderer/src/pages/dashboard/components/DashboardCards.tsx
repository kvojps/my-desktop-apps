import { WarningAmberOutlined } from '@mui/icons-material';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import type { StatCardProps } from '@/components/StatCard';

const CARD_COUNT = 1;

interface DashboardCardsProps {
  isLoading?: boolean;
  lowStockCount: number;
}

export function DashboardCards({ isLoading, lowStockCount }: DashboardCardsProps) {
  if (isLoading) {
    return (
      <StatCardGrid count={CARD_COUNT}>
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </StatCardGrid>
    );
  }

  // Os rótulos não repetem "no Período": o recorte já está no filtro acima e na
  // linha de apoio de cada card.
  //
  // Total de Vendas e Ticket Médio saíram daqui: viraram tags ao lado do
  // título de "Produtos Mais Vendidos", assim como Faturamento e Lucro viraram
  // tags do gráfico mensal — repeti-los em card duplicava o número sem
  // acrescentar contexto. Pedidos Pendentes seguiu o mesmo caminho, virando
  // tag do gráfico de Faturamento e Lucro.
  //
  // O `accent` de cada card é o mesmo em todas as telas onde o indicador
  // reaparece — para o usuário reconhecer o número antes de ler o rótulo.
  const cards: StatCardProps[] = [
    {
      label: 'Estoque Baixo',
      value: String(lowStockCount),
      sub: lowStockCount === 1 ? 'produto abaixo do mínimo' : 'produtos abaixo do mínimo',
      icon: WarningAmberOutlined,
      // Vermelho só quando há de fato produto para repor — um zero em alerta
      // treina o usuário a ignorar a cor.
      tone: lowStockCount > 0 ? 'alert' : 'neutral',
    },
  ];

  return (
    <StatCardGrid count={cards.length}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </StatCardGrid>
  );
}
