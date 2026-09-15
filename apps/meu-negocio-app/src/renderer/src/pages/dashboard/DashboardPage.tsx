import { HandCoins, LayoutDashboard, Tag } from 'lucide-react';
import { useMemo } from 'react';
import { getOrderProfit, getOrderTotal } from '@shared/types/order';
import type { Order } from '@shared/types/order';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { MonthRangeFilter } from '@/components/MonthRangeFilter';
import { PageHeader } from '@/components/PageHeader';
import { useOrders } from '@/hooks/orders/useOrders';
import { useProducts } from '@/hooks/products/useProducts';
import { formatCurrency } from '@/utils/format';
import { AccountsReceivableChart } from './components/AccountsReceivableChart';
import { AccountsReceivableTable } from './components/AccountsReceivableTable';
import { MonthlyRevenueChart } from './components/MonthlyRevenueChart';
import { MonthlyRevenueTable } from './components/MonthlyRevenueTable';
import { SectionCard } from './components/SectionCard';
import { SummaryTag } from './components/SummaryTag';
import { TopProductsChart } from './components/TopProductsChart';
import { TopProductsTable } from './components/TopProductsTable';
import { buildMonthlySeries } from './utils/monthlySeries';
import { resolvePeriod } from './utils/period';
import { buildReceivables, formatCount } from './utils/receivables';
import { buildTopProducts } from './utils/topProducts';

function sumRevenue(orders: Order[]): number {
  return orders.reduce((s, o) => s + getOrderTotal(o), 0);
}

function sumProfit(orders: Order[]): number {
  return orders.reduce((s, o) => s + getOrderProfit(o), 0);
}

export function DashboardPage() {
  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    retry: retryProducts,
  } = useProducts();
  const {
    orders: allOrders,
    filtered: orders,
    filters,
    isLoading: ordersLoading,
    error: ordersError,
    retry: retryOrders,
    setFilters,
  } = useOrders();

  const isLoading = productsLoading || ordersLoading;
  // A tela inteira é uma leitura só do banco: se qualquer um dos dois domínios
  // não carregou, não há dashboard a mostrar — não faz sentido desenhar meio
  // resumo do período e chamá-lo de resumo.
  const error = productsError ?? ordersError;
  const retry = () => {
    retryProducts();
    retryOrders();
  };

  const period = useMemo(
    () => resolvePeriod(allOrders, filters.dateFrom, filters.dateTo),
    [allOrders, filters.dateFrom, filters.dateTo],
  );

  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'completed'), [orders]);
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);

  const totalRevenue = useMemo(() => sumRevenue(completedOrders), [completedOrders]);
  const totalProfit = useMemo(() => sumProfit(completedOrders), [completedOrders]);
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : undefined;

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products],
  );

  // `allOrders`, e não `orders`: conta a receber é a posição de hoje, não um
  // recorte do período. Filtrar por mês esconderia justamente a conta velha.
  const receivables = useMemo(() => buildReceivables(allOrders), [allOrders]);

  const monthlyRows = useMemo(
    () => buildMonthlySeries(completedOrders, period),
    [completedOrders, period],
  );
  const topProducts = useMemo(() => buildTopProducts(completedOrders), [completedOrders]);

  // Carregando → erro → vazio. Sem o ramo de erro, um banco que não abre
  // desenhava três blocos zerados, dizendo ao usuário que ele não vendeu nada
  // quando o que houve foi uma falha (§5.3).
  if (error && !isLoading) {
    return (
      <ErrorState title="Não foi possível carregar o dashboard" error={error} onRetry={retry} />
    );
  }

  return (
    // A tela é uma leitura, não uma lista: ela preenche a faixa de conteúdo e,
    // enquanto cabe, não rola. Num app desktop a altura é o recurso escasso
    // (§4), e um dashboard que pede rolagem para mostrar o terceiro bloco
    // esconde justamente o que o usuário abriu a tela para comparar.
    <div className="negocio-page negocio-page-fill">
      {/* O recorte de período governa a tela inteira, então mora nas `actions`
          do cabeçalho e não numa faixa própria (§4). */}
      <PageHeader
        icon={<LayoutDashboard />}
        title="Dashboard"
        subtitle="Visão geral do seu negócio"
        actions={<MonthRangeFilter orders={allOrders} filters={filters} onChange={setFilters} />}
      />

      {/* As três seções são uma grade só: é o que deixa as linhas dividirem a
          altura que sobra do cabeçalho. O gráfico de meses é o assunto da tela
          e fica com a linha inteira; os dois recortes dividem a de baixo quando
          a faixa de conteúdo comporta (§2.2). */}
      <div className="negocio-dashboard-grid">
        <SectionCard
          title="Faturamento e Lucro por Mês"
          isLoading={isLoading}
          tags={
            <div className="negocio-tags">
              <SummaryTag
                label="Faturamento"
                value={formatCurrency(totalRevenue)}
                accent="primary"
              />
              <SummaryTag
                label="Lucro"
                value={formatCurrency(totalProfit)}
                accent="success"
                tone={totalProfit < 0 ? 'alert' : 'positive'}
                marginPct={profitMargin}
              />
              <SummaryTag
                label="Pedidos Pendentes"
                value={String(pendingOrders.length)}
                accent="warning"
              />
            </div>
          }
          chartLabel={`Faturamento e lucro de cada mês, ${period.label}. Os mesmos valores estão na alternativa em tabela.`}
          chart={<MonthlyRevenueChart rows={monthlyRows} />}
          table={
            <MonthlyRevenueTable
              rows={monthlyRows}
              caption={`Faturamento, lucro e margem por mês, ${period.label}`}
            />
          }
        />

        <SectionCard
          title="Vendas"
          isLoading={isLoading}
          tags={
            <div className="negocio-tags">
              <SummaryTag
                label="Total de Vendas"
                value={String(completedOrders.length)}
                accent="secondary"
              />
              <SummaryTag label="Ticket Médio" value={formatCurrency(avgTicket)} accent="info" />
              <SummaryTag
                label="Estoque Baixo"
                value={String(lowStockCount)}
                accent="warning"
                tone={lowStockCount > 0 ? 'alert' : 'neutral'}
              />
            </div>
          }
          chartLabel="Os cinco produtos mais vendidos no período, por quantidade. Os mesmos valores estão na alternativa em tabela."
          chart={<TopProductsChart rows={topProducts} />}
          table={<TopProductsTable rows={topProducts} />}
          empty={
            topProducts.length === 0 ? (
              <EmptyState
                icon={<Tag size={40} />}
                title="Nenhuma venda no período."
                description="A partir da primeira venda concluída, os cinco produtos que mais saíram aparecem aqui."
              />
            ) : undefined
          }
        />

        <SectionCard
          title="Cobranças"
          subtitle="Posição de hoje — não segue o filtro de meses"
          isLoading={isLoading}
          tags={
            // Sem conta nenhuma as tags diriam "R$ 0,00" e "0 contas" logo acima
            // de "Nenhuma conta a receber" — a mesma frase três vezes. Quem fala
            // no estado vazio é o `EmptyState`, sozinho. Já as tags de Vendas
            // ficam: estoque baixo não depende do período.
            receivables.count > 0 && (
              <div className="negocio-tags">
                {/* `primary` é o primeiro degrau da rampa de idade, o das contas
                    em dia — não o âmbar nem o vermelho: um total que soma as
                    quatro faixas pintado da cor do degrau que alarma leria como
                    se tudo estivesse vencido. */}
                <SummaryTag
                  label="Total a receber"
                  value={formatCurrency(receivables.total)}
                  accent="primary"
                />
                <SummaryTag
                  label="Em aberto"
                  value={formatCount(receivables.count)}
                  accent="info"
                />
              </div>
            )
          }
          chartLabel="Contas a receber por faixa de dias desde a venda, posição de hoje. Os mesmos valores estão na alternativa em tabela."
          chart={<AccountsReceivableChart rows={receivables.rows} />}
          table={<AccountsReceivableTable rows={receivables.rows} />}
          empty={
            receivables.count === 0 ? (
              <EmptyState
                icon={<HandCoins size={40} />}
                title="Nenhuma conta a receber."
                description="Toda venda concluída está quitada. Um pedido entregue e ainda não pago apareceria aqui, na faixa de dias desde a venda."
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
