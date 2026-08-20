import { PriceCheckOutlined } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  useXAxisScale,
  useYAxisTicks,
} from 'recharts';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency } from '@/utils/format';
import { tooltipProps } from '../chartTheme';
import type { AgingBucket, BucketRow, Receivables } from '../receivables';
import { LABEL_BAR_GAP, renderLeftAlignedTick, useTextMeasure } from '../textMeasure';

interface AccountsReceivableProps {
  receivables: Receivables;
}

const BAR_SIZE = 20;

/**
 * A rampa é ordinal, não categórica: as quatro faixas não são quatro assuntos
 * diferentes, são um mesmo assunto em quatro graus de severidade. Por isso ela
 * herda a paleta semântica em vez da categórica (design-system §1.7).
 *
 * `warning` só pode aparecer aqui porque barra é **preenchimento**; como texto
 * o âmbar reprova em AA nas duas superfícies do modo claro (§1.4), e é por isso
 * que a cor do número, logo abaixo, segue outra regra.
 */
function barColor(theme: Theme, bucket: AgingBucket): string {
  switch (bucket) {
    case '0-15':
    case '16-30':
      return theme.palette.primary.main;
    case '31-60':
      return theme.palette.warning.main;
    case '60+':
      return theme.palette.error.main;
  }
}

/**
 * O número na ponta da barra é texto de 12px sobre papel, onde o limiar volta a
 * ser 4.5:1 — então ele não herda a cor da barra. Só `error` tem par por modo e
 * passa (§1.2), e pinta só a faixa que pede atenção (§1.5).
 *
 * Faixa zerada cai para `text.secondary`: "R$ 0,00" em vermelho alarma sobre
 * nada, e valor ausente é conteúdo, não controle desabilitado (§1.4).
 */
function labelColor(theme: Theme, row: BucketRow): string {
  if (row.total <= 0) return theme.palette.text.secondary;
  if (row.bucket === '60+') return theme.palette.error.main;
  return theme.palette.text.primary;
}

/**
 * Os valores **não** saem de um `LabelList`, e a razão é a faixa zerada: o
 * Recharts não desenha o retângulo de uma barra de valor zero, e sem retângulo o
 * `LabelList` daquela linha nunca é chamado — a faixa aparecia sem o "R$ 0,00"
 * que é justamente o que ela tem a dizer. Desenhando a camada inteira a partir
 * do eixo, as quatro linhas existem independentemente de existir barra.
 *
 * `LabelList` também pinta a lista toda com um `style` só, e aqui cada linha tem
 * a sua cor — então nem o caminho fácil serviria.
 */
function ValueLabels({ rows, theme }: { rows: BucketRow[]; theme: Theme }) {
  const xScale = useXAxisScale();
  const ticks = useYAxisTicks();
  if (!xScale || !ticks) return null;

  return (
    <g aria-hidden="true">
      {rows.map((row) => {
        // Casado pelo rótulo, e não pelo índice: a ordem dos ticks é do eixo, e
        // não há por que assumir que ela acompanha a ordem dos dados.
        const tick = ticks.find((t) => t.value === row.label);
        if (!tick) return null;

        return (
          <text
            key={row.bucket}
            x={Number(xScale(row.total)) + LABEL_BAR_GAP}
            y={tick.coordinate}
            dy={4}
            textAnchor="start"
            fontSize={12}
            fontWeight={600}
            fill={labelColor(theme, row)}
          >
            {formatCurrency(row.total)}
          </text>
        );
      })}
    </g>
  );
}

function formatCount(count: number): string {
  return count === 1 ? '1 conta' : `${count} contas`;
}

export function AccountsReceivable({ receivables }: AccountsReceivableProps) {
  const theme = useTheme();
  const { rows, count } = receivables;

  // O Recharts não mede o texto que ele mesmo desenha (§7): sem estas duas
  // medidas o rótulo mais largo é cortado pela borda do card.
  const measure = useTextMeasure();
  const yAxisWidth = useMemo(
    () => measure.getYAxisWidth(rows.map((r) => r.label)),
    [rows, measure],
  );
  const labelMargin = useMemo(
    () => measure.getLabelMargin(rows.map((r) => formatCurrency(r.total))),
    [rows, measure],
  );

  if (count === 0) {
    return (
      <EmptyState
        icon={<PriceCheckOutlined sx={{ fontSize: 40 }} />}
        title="Nenhuma conta a receber."
        description="Toda venda concluída está quitada. Um pedido entregue e ainda não pago apareceria aqui, na faixa de dias desde a venda."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* As quatro faixas aparecem sempre, zeradas inclusive: "nada acima de 60
          dias" é informação, e a linha ausente obrigaria o usuário a reparar no
          que não está lá. É também o que mantém a altura da seção estável sem
          precisar preencher o conjunto com linhas falsas (§5.3). */}
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: labelMargin, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={yAxisWidth}
          tick={(props) => renderLeftAlignedTick(props, theme.palette.text.secondary)}
          axisLine={false}
          tickLine={false}
        />
        <RechartsTooltip
          formatter={(value, _name, item) => [
            `${formatCurrency(Number(value))} · ${formatCount(Number(item?.payload?.count ?? 0))}`,
            'A receber',
          ]}
          {...tooltipProps(theme)}
        />
        {/* Barra chapada, e não o degradê dos outros dois gráficos: aqui cada
            barra tem a sua cor, e `<Cell>` não convive com `fill="url(#id)"`. */}
        <Bar dataKey="total" barSize={BAR_SIZE} radius={[0, 4, 4, 0]}>
          {rows.map((row) => (
            <Cell key={row.bucket} fill={barColor(theme, row.bucket)} />
          ))}
        </Bar>
        <ValueLabels rows={rows} theme={theme} />
      </BarChart>
    </ResponsiveContainer>
  );
}
