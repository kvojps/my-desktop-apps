import {
  ArrowBack,
  AutoAwesomeMosaicOutlined,
  ChevronLeft,
  ChevronRight,
  GridOffOutlined,
  LayersOutlined,
  PercentOutlined,
  SearchOffOutlined,
  WidgetsOutlined,
} from '@mui/icons-material';
import { Button, Card, CardContent, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { useGeneratePlan } from '@/hooks/plan/useGeneratePlan';
import { usePlan } from '@/hooks/plan/usePlan';
import { CATEGORICAL_PALETTE, contentQuery } from '@/theme';
import { formatDateTime } from '@/utils/date';
import { formatCount, formatDimensions, formatMillimeters, formatPercent } from '@/utils/format';
import { ROUTES, projectPath } from '../../routes';
import { OutdatedPlanNotice } from './components/OutdatedPlanNotice';
import { PlanLegend } from './components/PlanLegend';
import { SheetDrawing } from './components/SheetDrawing';
import { ShortfallPanel } from './components/ShortfallPanel';
import { buildPlanLegend } from './planLegend';

/**
 * A prancheta: cada chapa do plano desenhada em escala, com as peças no lugar,
 * a sobra destacada e o aproveitamento à vista.
 *
 * Tela à parte da de Projeto para que o desenho receba a viewport inteira, e
 * tela de **leitura**: ela não rola: o desenho encolhe até caber (design
 * system, §4). Ela também não gera nada — o plano é snapshot, e o que se lê
 * aqui é exatamente o que foi gerado.
 */

/**
 * A proporção que o esqueleto reserva: a chapa de MDF mais comum do mercado.
 * A medida nomeada da §5.3 não desaparece na superfície métrica em escala —
 * ela deixa de ser altura e vira proporção, e é ela que impede a caixa de
 * saltar quando o desenho chega.
 */
const REFERENCE_SHEET_ASPECT = '2750 / 1850';

export function PlanPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const { project, plan, pieces, sheets, isOutdated, notFound, isLoading, error, retry } =
    usePlan(projectId);
  // Gerar mora nas duas telas, com o mesmo hook: aqui ele serve só ao aviso de
  // plano desatualizado, que é onde a saída precisa estar à mão de quem já está
  // com o desenho aberto.
  const { generate, isGenerating, canGenerate, blockedReason } = useGeneratePlan(
    project,
    pieces,
    sheets,
  );
  const [requestedSheet, setRequestedSheet] = useState(0);

  const legend = useMemo(
    () => buildPlanLegend(plan?.sheets ?? [], CATEGORICAL_PALETTE),
    [plan?.sheets],
  );

  function goToProject() {
    navigate(projectPath(projectId));
  }

  // Precedência carregando → erro → vazio (§5.3).
  if (isLoading) {
    return (
      <Stack spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <Skeleton variant="text" width={280} height={48} />
        <StatCardGrid count={3}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </StatCardGrid>
        {/* O esqueleto reserva a mesma grade de duas colunas do conteúdo, e
            não só a caixa do desenho: reservar a largura cheia para depois
            abrir espaço à legenda é o salto de layout que o esqueleto existe
            para evitar (§5.3). */}
        <Stack
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: '1fr',
            [contentQuery.medium]: { gridTemplateColumns: 'minmax(0, 1fr) 260px' },
          }}
        >
          <Skeleton
            variant="rounded"
            sx={{ width: '100%', aspectRatio: REFERENCE_SHEET_ASPECT, maxHeight: '100%' }}
          />
          <Skeleton variant="rounded" sx={{ display: { xs: 'none', sm: 'block' } }} />
        </Stack>
      </Stack>
    );
  }

  if (error) {
    return <ErrorState title="Não foi possível carregar o plano" error={error} onRetry={retry} />;
  }

  if (notFound || !project) {
    return (
      <EmptyState
        icon={<SearchOffOutlined sx={{ fontSize: 48 }} />}
        title="Projeto não encontrado"
        description="O projeto deste plano não existe mais."
        action={
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate(ROUTES.PROJECTS)}
          >
            Voltar para os projetos
          </Button>
        }
      />
    );
  }

  const backButton = (
    <Button variant="outlined" startIcon={<ArrowBack />} onClick={goToProject}>
      Voltar para o projeto
    </Button>
  );

  if (!plan) {
    return (
      <EmptyState
        icon={<AutoAwesomeMosaicOutlined sx={{ fontSize: 48 }} />}
        title="Nenhum plano gerado ainda."
        description="O plano é gerado quando você pede, na tela do projeto, e fica salvo do jeito que saiu — reabrir não muda o desenho que você já imprimiu."
        action={backButton}
      />
    );
  }

  // A chapa pedida pode não existir mais depois de gerar de novo: o índice é
  // preso ao que o plano tem, em vez de zerado por efeito.
  const sheetIndex = Math.min(requestedSheet, Math.max(0, plan.sheets.length - 1));
  const sheet = plan.sheets[sheetIndex];
  const placedPieces = plan.sheets.reduce((total, item) => total + item.placements.length, 0);

  // O painel se apaga sozinho quando nada ficou de fora, e é ele que mantém
  // separadas as duas listas que o glossário separa. Ele não vira indicador na
  // fileira do topo: a contagem de cards do esqueleto é reservada antes de o
  // plano existir, e um card que só aparece com déficit a faria saltar (§5.3).
  const shortfallPanel = (
    <ShortfallPanel
      unplaced={plan.unplaced}
      rejected={plan.rejected}
      deficit={plan.deficit}
      kerfTenthsMm={plan.kerfTenthsMm}
      trimTenthsMm={plan.trimTenthsMm}
    />
  );

  // Plano sem chapa nenhuma tem duas causas opostas, e a saída de cada uma é o
  // contrário da outra. Só rejeitada: comprar chapa não resolve, e mandar
  // comprar seria exatamente a compra inútil que este app existe para evitar.
  const onlyRejected = plan.unplaced.length === 0 && plan.rejected.length > 0;

  return (
    // `flex: 1` na faixa de conteúdo do Layout: é assim que uma tela de leitura
    // pede a viewport inteira sem recorrer a `100vh`, que ignoraria o padding
    // da faixa (§4).
    <Stack spacing={3} sx={{ flex: 1, minHeight: 0 }}>
      <PageHeader
        icon={<AutoAwesomeMosaicOutlined />}
        title="Plano de corte"
        subtitle={`${project.name} · ${project.material} · Gerado em ${formatDateTime(plan.generatedAt)}`}
        actions={backButton}
      />

      {/* Antes dos indicadores, e não ao lado do desenho: o que ele diz vale
          para o plano inteiro, inclusive para os números logo abaixo — eles são
          do desenho de ontem tanto quanto as chapas são. */}
      {isOutdated && (
        <OutdatedPlanNotice
          projectUpdatedAt={project.updatedAt}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          blockedReason={blockedReason}
          onGenerate={generate}
        />
      )}

      <StatCardGrid count={3}>
        <StatCard
          label="Aproveitamento do plano"
          value={formatPercent(plan.utilization)}
          sub={`${formatPercent(1 - plan.utilization)} de sobra na área útil`}
          icon={PercentOutlined}
          accent="primary"
        />
        <StatCard
          label="Chapas planejadas"
          value={String(plan.sheets.length)}
          // Kerf e refile viajam no plano, e não são lidos do projeto: eles são
          // a geometria com que **este** desenho foi feito, e mudá-los depois
          // não muda o papel que já está na bancada.
          sub={`Kerf ${formatMillimeters(plan.kerfTenthsMm)} · Refile ${formatMillimeters(plan.trimTenthsMm)}`}
          icon={LayersOutlined}
          accent="info"
        />
        <StatCard
          label="Peças no plano"
          value={String(placedPieces)}
          sub={`em ${formatCount(legend.dimensionCount, 'medida', 'medidas')}`}
          icon={WidgetsOutlined}
          accent="secondary"
        />
      </StatCardGrid>

      {sheet ? (
        <Stack
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: '1fr',
            [contentQuery.medium]: { gridTemplateColumns: 'minmax(0, 1fr) 260px' },
          }}
        >
          <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <CardContent
              sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 2 }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack sx={{ minWidth: 0 }}>
                  <Typography variant="h6">
                    Chapa {sheetIndex + 1} de {plan.sheets.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDimensions(sheet.lengthTenthsMm, sheet.widthTenthsMm)} ·{' '}
                    {formatPercent(sheet.utilization)} de aproveitamento ·{' '}
                    {formatPercent(1 - sheet.utilization)} de sobra
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <IconButton
                    aria-label="Chapa anterior"
                    disabled={sheetIndex === 0}
                    onClick={() => setRequestedSheet(sheetIndex - 1)}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    aria-label="Próxima chapa"
                    disabled={sheetIndex >= plan.sheets.length - 1}
                    onClick={() => setRequestedSheet(sheetIndex + 1)}
                  >
                    <ChevronRight />
                  </IconButton>
                </Stack>
              </Stack>

              <SheetDrawing
                sheet={sheet}
                pieces={legend.placementPieces[sheetIndex]}
                trimTenthsMm={plan.trimTenthsMm}
                position={{ index: sheetIndex, total: plan.sheets.length }}
              />
            </CardContent>
          </Card>

          {/* A coluna rola, e não cada card: o que falta e a legenda se leem em
              sequência, e dois campos de rolagem lado a lado obrigariam a
              descobrir qual deles responde à roda do mouse. */}
          <Stack sx={{ minHeight: 0, gap: 2, overflowY: 'auto', '& > *': { flexShrink: 0 } }}>
            {shortfallPanel}

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Peças desta chapa
                </Typography>
                <PlanLegend entries={legend.sheetEntries[sheetIndex]} />
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      ) : (
        // Nenhuma chapa usada não pode ser o fim da tela: é justamente o caso em
        // que o que falta comprar é a única coisa que o plano tem a dizer.
        <>
          <Card variant="outlined">
            <EmptyState
              icon={<GridOffOutlined sx={{ fontSize: 40 }} />}
              title={
                onlyRejected
                  ? 'Nenhuma peça cabe nas chapas deste projeto.'
                  : 'Nenhuma chapa foi usada neste plano.'
              }
              description={
                onlyRejected
                  ? 'Comprar mais chapas do mesmo tamanho não resolveria. Abaixo estão as peças e a razão de nenhuma delas caber.'
                  : 'Nenhuma peça coube nas chapas cadastradas no projeto. Cadastre chapas maiores ou em maior número e gere de novo.'
              }
              action={backButton}
            />
          </Card>

          {shortfallPanel}
        </>
      )}
    </Stack>
  );
}
