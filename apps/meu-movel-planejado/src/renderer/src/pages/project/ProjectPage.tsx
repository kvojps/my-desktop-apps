import {
  ArrowBack,
  AutoAwesomeMosaicOutlined,
  ContentCut,
  DashboardCustomizeOutlined,
  LayersOutlined,
  SearchOffOutlined,
  VisibilityOutlined,
  WidgetsOutlined,
} from '@mui/icons-material';
import { Button, IconButton, Skeleton, Stack, Tooltip } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { usePieceForm } from '@/hooks/pieces/usePieceForm';
import { useGeneratePlan } from '@/hooks/plan/useGeneratePlan';
import { useCuttingParamsForm } from '@/hooks/projects/useCuttingParamsForm';
import { useProjectDetail } from '@/hooks/projects/useProjectDetail';
import { useSheetForm } from '@/hooks/sheets/useSheetForm';
import { formatCount, formatMillimeters, formatSquareMeters } from '@/utils/format';
import { ROUTES, planPath } from '../../routes';
import { CuttingParamsModal } from './components/CuttingParamsModal';
import { PieceFormModal } from './components/PieceFormModal';
import { PiecesSection } from './components/PiecesSection';
import { SheetFormModal } from './components/SheetFormModal';
import { SheetsSection } from './components/SheetsSection';

/**
 * Altura do esqueleto de cada seção: a medida nomeada que o §5.3 exige, para o
 * espaço reservado enquanto o banco responde ser o mesmo que a tabela ocupa
 * depois — cabeçalho, uma página de linhas e o rodapé de contagem.
 */
const SECTION_SKELETON_HEIGHT = 320;

/**
 * A tela onde o serviço é descrito: as peças que precisam ser cortadas, as
 * chapas de que se dispõe e a geometria do corte. Ao fim dela o projeto está
 * completo — o plano é a tela seguinte, e só existe quando o usuário mandar
 * gerar.
 */
export function ProjectPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();

  const {
    project,
    notFound,
    pieces,
    sheets,
    plan,
    totals,
    isLoading,
    error,
    retry,
    createPiece,
    updatePiece,
    deletePiece,
    createSheet,
    updateSheet,
    deleteSheet,
    updateCuttingParams,
  } = useProjectDetail(projectId);

  const pieceForm = usePieceForm(createPiece, updatePiece, project, sheets);
  const sheetForm = useSheetForm(createSheet, updateSheet);
  const cuttingParamsForm = useCuttingParamsForm(updateCuttingParams);
  const { generate, isGenerating, canGenerate, blockedReason } = useGeneratePlan(project, pieces);

  function goToProjects() {
    navigate(ROUTES.PROJECTS);
  }

  // Precedência carregando → erro → vazio (§5.3). O esqueleto tem a forma da
  // tela real, e não um spinner: cabeçalho, os dois indicadores e as duas
  // seções, para nada saltar quando os dados chegam.
  if (isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={280} height={48} />
        <StatCardGrid count={2}>
          <StatCardSkeleton />
          <StatCardSkeleton />
        </StatCardGrid>
        <Skeleton variant="rounded" height={SECTION_SKELETON_HEIGHT} />
        <Skeleton variant="rounded" height={SECTION_SKELETON_HEIGHT} />
      </Stack>
    );
  }

  if (error) {
    return <ErrorState title="Não foi possível carregar o projeto" error={error} onRetry={retry} />;
  }

  if (notFound || !project) {
    return (
      <EmptyState
        icon={<SearchOffOutlined sx={{ fontSize: 48 }} />}
        title="Projeto não encontrado"
        description="O projeto que você tentou abrir não existe mais."
        action={
          <Button variant="contained" startIcon={<ArrowBack />} onClick={goToProjects}>
            Voltar para os projetos
          </Button>
        }
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<DashboardCustomizeOutlined />}
        title={project.name}
        // Material, kerf e refile numa linha só: são a descrição do serviço, e
        // dar a cada um uma superfície própria custaria três caixas para três
        // valores que não se editam com frequência.
        subtitle={`${project.material} · Kerf ${formatMillimeters(project.kerfTenthsMm)} · Refile ${formatMillimeters(project.trimTenthsMm)}`}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Voltar para os projetos">
              <IconButton onClick={goToProjects} aria-label="Voltar para os projetos">
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<ContentCut />}
              onClick={() => cuttingParamsForm.open(project)}
            >
              Parâmetros de corte
            </Button>
            {plan && (
              <Button
                variant="outlined"
                startIcon={<VisibilityOutlined />}
                onClick={() => navigate(planPath(project.id))}
              >
                Ver plano
              </Button>
            )}
            {/* A troca de rótulo é o único sinal de ação em andamento no app
                inteiro: não há indicador circular de progresso em lugar nenhum
                (design system, §5.3), e é por isso que o laço de tentativas
                cede o controle entre elas — para que este rótulo repinte.

                Quando o botão está desligado, quem diz por quê é o hook: a
                mesma frase serve o aviso de plano desatualizado, na outra tela.  */}
            <Tooltip title={blockedReason}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeMosaicOutlined />}
                  onClick={generate}
                  disabled={!canGenerate}
                >
                  {isGenerating ? 'Gerando...' : plan ? 'Gerar de novo' : 'Gerar plano'}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      {/* As duas áreas lado a lado são a conta que o marceneiro faz de olho
          antes de existir plano: cabe ou não cabe no que eu tenho. */}
      <StatCardGrid count={2}>
        <StatCard
          label="Área das peças"
          value={formatSquareMeters(totals.piecesAreaTenthsMm2)}
          sub={
            pieces.length === 0
              ? 'Nenhuma peça cadastrada'
              : `${formatCount(totals.pieceUnits, 'peça', 'peças')} em ${formatCount(pieces.length, 'medida', 'medidas')}`
          }
          icon={WidgetsOutlined}
          accent="primary"
        />
        <StatCard
          label="Área em chapas"
          value={formatSquareMeters(totals.sheetsAreaTenthsMm2)}
          sub={
            sheets.length === 0
              ? 'Nenhuma chapa cadastrada'
              : `${formatCount(totals.sheetUnits, 'chapa', 'chapas')} em ${formatCount(sheets.length, 'tamanho', 'tamanhos')}`
          }
          icon={LayersOutlined}
          accent="info"
        />
      </StatCardGrid>

      <PiecesSection
        pieces={pieces}
        onAdd={pieceForm.openNew}
        onEdit={pieceForm.openEdit}
        onDelete={deletePiece}
      />

      <SheetsSection
        sheets={sheets}
        onAdd={sheetForm.openNew}
        onEdit={sheetForm.openEdit}
        onDelete={deleteSheet}
      />

      <PieceFormModal formState={pieceForm} />
      <SheetFormModal formState={sheetForm} />
      <CuttingParamsModal formState={cuttingParamsForm} />
    </Stack>
  );
}
