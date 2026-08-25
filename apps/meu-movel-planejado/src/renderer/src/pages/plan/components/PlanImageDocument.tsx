import { Fragment, type RefObject, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Plan, PlanShortfall } from '@shared/types/plan';
import type { Project } from '@shared/types/project';
import { formatDateTime } from '@/utils/date';
import {
  formatCount,
  formatDimensions,
  formatMillimeters,
  formatPercent,
  formatSquareMeters,
} from '@/utils/format';
import {
  CONTENT_WIDTH,
  IMAGE,
  buildPlanImageLayout,
  truncateToWidth,
  wrapToWidth,
} from '../planImage';
import { type PlanLegend, pieceIdentity } from '../planLegend';
import { buildPlanPieceList } from '../planPrint';
import { SHORTFALL_COPY } from '../shortfallCopy';
import { useTextMeasure } from '../textMeasure';
import { OffscreenSheetDrawing } from './OffscreenSheetDrawing';

/**
 * O plano como imagem, porque o combinado com o ajudante acontece pelo celular.
 *
 * É a folha sem paginação: o mesmo documento do papel — identificação, o que se
 * confere antes, uma chapa depois da outra — num quadro só, que se rola em vez
 * de virar página. E é a norma da folha que vale aqui, não a da tela (§5.6):
 * sem tema, preto sobre branco, sobra hachurada, proporção da chapa preservada.
 * O arquivo sai do app e pode acabar impresso do outro lado, e um PNG pintado
 * com o tema escuro chegaria ao ajudante como cinza sobre cinza.
 *
 * Ele fica montado **sempre**, ao lado da tela e escondido dela, pelo mesmo
 * motivo do documento de impressão: o desenho a exportar é o desenho que está
 * à vista, e montá-lo no clique criaria um segundo desenho, feito depois, capaz
 * de divergir do plano que o usuário conferiu.
 *
 * O que sai na imagem é o que sai no papel, inclusive o que falta comprar: são
 * dois formatos do mesmo plano, e a imagem que calasse o déficit mandaria à
 * oficina um documento que diz menos que o outro sobre o mesmo serviço.
 */

/** Preto sobre branco: a imagem não tem tema, como a folha não tem (§5.6). */
const INK = '#000000';
const PAPER = '#ffffff';

const BOLD = 600;

/** Uma seção de texto da imagem, já com as linhas quebradas na largura. */
interface ImageSection {
  title: string;
  rows: string[];
}

interface PlanImageDocumentProps {
  project: Project;
  plan: Plan;
  /** A mesma legenda da tela: o número da peça na imagem é o número da tela. */
  legend: PlanLegend;
  /** Por onde a exportação alcança o SVG para serializá-lo. */
  svgRef: RefObject<SVGSVGElement | null>;
}

export function PlanImageDocument({ project, plan, legend, svgRef }: PlanImageDocumentProps) {
  const pieceList = useMemo(() => buildPlanPieceList(legend), [legend]);
  const measure = useTextMeasure();

  const sections = useMemo(() => {
    // As frases quebram em quantas linhas precisarem; o que identifica é
    // encurtado. A largura é a mesma, e é a do quadro — o arquivo não rola
    // para o lado, e o que passa da margem some sem aviso.
    const wrap = (text: string) =>
      wrapToWidth(text, CONTENT_WIDTH, (line) => measure.measureTextWidth(line, IMAGE.font.row));

    const list: ImageSection[] = [];

    if (pieceList.entries.length > 0) {
      list.push({
        title: 'Peças no plano',
        // A lista é o decodificador dos desenhos abaixo: onde o retângulo é
        // estreito demais para o rótulo, o desenho recua para o número, e é
        // aqui que o número volta a ter nome e medida.
        rows: pieceList.entries.flatMap((entry) =>
          wrap(
            `${pieceIdentity(entry)} · ${formatDimensions(entry.lengthTenthsMm, entry.widthTenthsMm)} · ${entry.count}×`,
          ),
        ),
      });
    }

    // As duas listas do glossário ficam separadas aqui como ficam no papel:
    // **não alocada** cabe e ficou sem chapa, e comprar resolve; **rejeitada**
    // não cabe em chapa nenhuma do projeto, e somá-la à conta faria o arquivo
    // recomendar uma compra que não resolve nada.
    if (plan.unplaced.length > 0) {
      list.push({
        title: SHORTFALL_COPY.unplacedTitle,
        rows: [
          ...wrap(SHORTFALL_COPY.unplacedLead),
          ...plan.unplaced.flatMap((batch) => wrap(shortfallRow(batch))),
          ...wrap(describeDeficit(plan)),
          ...wrap(SHORTFALL_COPY.deficitCaveat),
        ],
      });
    }

    if (plan.rejected.length > 0) {
      list.push({
        title: SHORTFALL_COPY.rejectedTitle,
        rows: plan.rejected.flatMap((batch) => wrap(shortfallRow(batch))),
      });
    }

    return list;
  }, [measure, pieceList.entries, plan]);

  const layout = useMemo(
    () =>
      buildPlanImageLayout({
        sectionRowCounts: sections.map((section) => section.rows.length),
        sheets: plan.sheets,
      }),
    [plan.sheets, sections],
  );

  /** O que **identifica** é encurtado: o começo dele já diz quase tudo. */
  const fitLine = (text: string, fontSize: number) =>
    truncateToWidth(text, CONTENT_WIDTH, (line) => measure.measureTextWidth(line, fontSize));

  return createPortal(
    <div className="plan-image" aria-hidden="true">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        fontFamily={IMAGE.fontFamily}
        fill={INK}
      >
        {/* O fundo é desenhado, e não deixado transparente: PNG transparente
            chega preto no aplicativo de mensagem em modo escuro, que é
            exatamente onde este arquivo vai parar. */}
        <rect x={0} y={0} width={layout.width} height={layout.height} fill={PAPER} />

        <text x={IMAGE.padding} y={layout.titleY} fontSize={IMAGE.font.title} fontWeight={BOLD}>
          {fitLine(project.name, IMAGE.font.title)}
        </text>

        {/* A mesma identificação do cabeçalho corrente do papel, e pela mesma
            razão: duas gerações do mesmo projeto produzem dois arquivos
            parecidos, e é a data que distingue o que está valendo. */}
        <text x={IMAGE.padding} y={layout.subtitleY} fontSize={IMAGE.font.subtitle}>
          {fitLine(
            `Plano de corte · ${project.material} · Gerado em ${formatDateTime(plan.generatedAt)}`,
            IMAGE.font.subtitle,
          )}
        </text>

        <text x={IMAGE.padding} y={layout.statsY} fontSize={IMAGE.font.stats}>
          {fitLine(
            [
              formatCount(plan.sheets.length, 'chapa', 'chapas'),
              formatCount(pieceList.total, 'peça', 'peças'),
              `${formatPercent(plan.utilization)} de aproveitamento`,
              `Kerf ${formatMillimeters(plan.kerfTenthsMm)}`,
              `Refile ${formatMillimeters(plan.trimTenthsMm)}`,
            ].join(' · '),
            IMAGE.font.stats,
          )}
        </text>

        {sections.map((section, sectionIndex) => (
          <Fragment key={section.title}>
            <text
              x={IMAGE.padding}
              y={layout.sections[sectionIndex].titleY}
              fontSize={IMAGE.font.sectionTitle}
              fontWeight={BOLD}
            >
              {section.title}
            </text>

            {section.rows.map((row, rowIndex) => (
              <text
                key={`${row}-${rowIndex}`}
                x={IMAGE.padding}
                y={layout.sections[sectionIndex].rowsY[rowIndex]}
                fontSize={IMAGE.font.row}
              >
                {row}
              </text>
            ))}
          </Fragment>
        ))}

        {plan.sheets.map((sheet, index) => {
          const block = layout.sheets[index];

          return (
            <Fragment key={index}>
              {/* Toda unidade se identifica sozinha, como no papel: a imagem se
                  lê rolando, e quem parou numa chapa precisa saber qual é. A
                  medida vai escrita porque o desenho mantém a proporção e não
                  promete escala aferível. */}
              <text
                x={IMAGE.padding}
                y={block.captionY}
                fontSize={IMAGE.font.caption}
                fontWeight={BOLD}
              >
                {fitLine(
                  `Chapa ${index + 1} de ${plan.sheets.length} · ${formatDimensions(
                    sheet.lengthTenthsMm,
                    sheet.widthTenthsMm,
                  )} · ${formatPercent(sheet.utilization)} de aproveitamento`,
                  IMAGE.font.caption,
                )}
              </text>

              <OffscreenSheetDrawing
                sheet={sheet}
                pieces={legend.placementPieces[index]}
                trimTenthsMm={plan.trimTenthsMm}
                box={{ width: block.drawing.width, height: block.drawing.height }}
                x={block.drawing.x}
                y={block.drawing.y}
                hatchId={`plan-image-hatch-${index}`}
              />
            </Fragment>
          );
        })}
      </svg>
    </div>,
    document.body,
  );
}

/**
 * Um lote que ficou de fora, na linha em que ele se lê. A quantidade vem
 * primeiro, como no papel, porque é o que se lê primeiro numa lista de compra:
 * são quatro laterais que faltam, não a lateral.
 */
function shortfallRow(batch: PlanShortfall): string {
  const identity = batch.label ? `${batch.label} — ` : '';
  return `${batch.quantity}× ${identity}${formatDimensions(batch.lengthTenthsMm, batch.widthTenthsMm)}`;
}

/**
 * O déficit em uma linha: a área que falta e, quando há formato de referência,
 * quantas chapas dele isso significa. "Pelo menos" não é modéstia — a conta por
 * área ignora encaixe, e o número real pode ser maior, nunca menor.
 */
function describeDeficit(plan: Plan): string {
  const area = `Área que falta: ${formatSquareMeters(plan.deficit.areaTenthsMm2)}`;
  const reference = plan.deficit.referenceSheet;

  if (!reference) return `${area} · ${SHORTFALL_COPY.deficitWithoutReference}`;

  return `${area} · pelo menos ${formatCount(plan.deficit.atLeastSheets, 'chapa', 'chapas')} de ${formatDimensions(
    reference.lengthTenthsMm,
    reference.widthTenthsMm,
  )}`;
}
