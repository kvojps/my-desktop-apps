import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Plan, PlanShortfall } from '@shared/types/plan';
import type { Project } from '@shared/types/project';
import { describeFitRule } from '@/utils/cuttingGeometry';
import { formatDateTime } from '@/utils/date';
import {
  formatCount,
  formatDimensions,
  formatMillimeters,
  formatPercent,
  formatSquareMeters,
} from '@/utils/format';
import type { PlanLegend } from '../planLegend';
import { buildPlanPieceList } from '../planPrint';
import { SHORTFALL_COPY, describeRejection } from '../shortfallCopy';
import { PrintSheetDrawing } from './PrintSheetDrawing';

/**
 * O plano em papel, porque quem executa o corte costuma não ser quem planejou.
 *
 * O documento existe **sempre**, montado ao lado da tela e escondido dela: quem
 * o revela é o `@media print`, e quem manda imprimir é o Electron, sobre a
 * janela que já está aberta. É o que garante que o papel saia igual seja qual
 * for o caminho — o botão do app ou o atalho do sistema — em vez de existir só
 * dentro de um botão.
 *
 * Vai pendurado no `body`, e não dentro do `Layout`, e essa é a diferença que
 * faz a §5.6 ("só o conteúdo é impresso") ser estrutural em vez de uma lista de
 * exceções: no papel o app inteiro é escondido de uma vez, e o que aparece é
 * este documento. Esconder rail, botão e navegação um a um deixaria passar o
 * próximo controle que alguém acrescentasse.
 *
 * A ordem é a da norma: a página de resumo — que não é unidade de execução —
 * vem antes de todas as chapas, e cada chapa ocupa a sua folha.
 */

interface PlanPrintDocumentProps {
  project: Project;
  plan: Plan;
  /** A mesma legenda da tela: o número da peça no papel é o número da tela. */
  legend: PlanLegend;
}

export function PlanPrintDocument({ project, plan, legend }: PlanPrintDocumentProps) {
  const pieceList = useMemo(() => buildPlanPieceList(legend), [legend]);

  return createPortal(
    <div className="plan-print">
      {/* A tabela existe pelo `thead`, e não por haver dado tabular aqui: um
          cabeçalho de tabela é o que a impressão repete em **toda** folha
          reservando o espaço dele — um elemento fixo se repete mas não reserva,
          e o texto da folha seguinte corre por baixo.

          O que isso compra é a §5.6 na página que ninguém planejou: o resumo
          transborda quando o projeto tem peças demais, e a folha nascida do
          transbordo sairia anônima se a identidade do documento morasse no
          cabeçalho de cada seção. Aqui ela é do maço. */}
      <table className="plan-print__doc-frame">
        <thead>
          <tr>
            <th>
              <div className="plan-print__running-head">
                <strong>{project.name}</strong>
                <span>
                  Plano de corte · {project.material} · Gerado em {formatDateTime(plan.generatedAt)}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <section className="plan-print__page">
                <PrintPageHeader unit="Resumo do plano" />

                <dl className="plan-print__stats">
                  {/* O vocabulário é o do glossário e o da tela: "chapa
                      planejada" e "peças no plano". A mesma coisa com dois
                      nomes obrigaria quem confere o papel contra a tela a
                      traduzir. */}
                  <PrintStat label="Chapas planejadas" value={String(plan.sheets.length)} />
                  <PrintStat label="Peças no plano" value={String(pieceList.total)} />
                  <PrintStat label="Aproveitamento" value={formatPercent(plan.utilization)} />
                  <PrintStat
                    label="Kerf e refile"
                    value={`${formatMillimeters(plan.kerfTenthsMm)} · ${formatMillimeters(plan.trimTenthsMm)}`}
                  />
                </dl>

                <section className="plan-print__section">
                  <h2 className="plan-print__section-title">Peças no plano</h2>
                  {pieceList.entries.length > 0 ? (
                    <table className="plan-print__table">
                      <thead>
                        <tr>
                          <th className="plan-print__cell--number">Nº</th>
                          <th>Peça</th>
                          <th>Medida</th>
                          <th className="plan-print__cell--number">Qtd.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pieceList.entries.map((entry) => (
                          <tr key={entry.key}>
                            <td className="plan-print__cell--number">{entry.number}</td>
                            {/* Peça sem rótulo é reconhecida pela medida, que já está na
                        coluna ao lado — um travessão diz que não há nome, sem
                        inventar um. */}
                            <td>{entry.label || '—'}</td>
                            <td>{formatDimensions(entry.lengthTenthsMm, entry.widthTenthsMm)}</td>
                            <td className="plan-print__cell--number">{entry.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>Nenhuma peça coube nas chapas deste projeto.</p>
                  )}
                </section>

                {plan.sheets.length > 0 && (
                  <section className="plan-print__section">
                    <h2 className="plan-print__section-title">Chapas</h2>
                    <table className="plan-print__table">
                      <thead>
                        <tr>
                          <th className="plan-print__cell--number">Nº</th>
                          <th>Medida</th>
                          <th className="plan-print__cell--number">Peças</th>
                          <th className="plan-print__cell--number">Aproveitamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.sheets.map((sheet, index) => (
                          <tr key={index}>
                            <td className="plan-print__cell--number">{index + 1}</td>
                            <td>{formatDimensions(sheet.lengthTenthsMm, sheet.widthTenthsMm)}</td>
                            <td className="plan-print__cell--number">{sheet.placements.length}</td>
                            <td className="plan-print__cell--number">
                              {formatPercent(sheet.utilization)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                <PrintShortfall plan={plan} />
              </section>

              {/* Uma chapa por página: o que se executa uma de cada vez ocupa a folha
          inteira (§5.6). A posição na lista é a chave, como no desenho da tela:
          duas chapas iguais são duas folhas legítimas. */}
              {plan.sheets.map((sheet, index) => (
                <section className="plan-print__page" key={index}>
                  <PrintPageHeader
                    unit={`Chapa ${index + 1} de ${plan.sheets.length}`}
                    // A medida da chapa vai **escrita**: a superfície métrica na folha
                    // mantém a proporção e não promete escala aferível, porque ninguém
                    // mede a folha com régua (§5.6).
                    detail={`${formatDimensions(sheet.lengthTenthsMm, sheet.widthTenthsMm)} · ${formatPercent(
                      sheet.utilization,
                    )} de aproveitamento · ${formatCount(sheet.placements.length, 'peça', 'peças')}`}
                  />

                  <PrintSheetDrawing
                    sheet={sheet}
                    pieces={legend.placementPieces[index]}
                    trimTenthsMm={plan.trimTenthsMm}
                  />
                </section>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>,
    document.body,
  );
}

interface PrintPageHeaderProps {
  /** O que **esta** folha é: o resumo ou uma chapa. */
  unit: string;
  detail?: string;
}

/**
 * A metade da identificação que muda de página para página. A outra metade —
 * projeto, material e data de geração — é o cabeçalho corrente, repetido pela
 * própria impressão; junto com esta, ela é o "de que documento e de que
 * unidade" que a §5.6 exige de toda folha.
 *
 * A data de geração está lá de propósito: duas gerações do mesmo projeto
 * produzem dois maços parecidos, e é ela que distingue o que está na bancada do
 * que ficou na mesa.
 */
function PrintPageHeader({ unit, detail }: PrintPageHeaderProps) {
  return (
    <header className="plan-print__header">
      <p className="plan-print__doc">{unit}</p>
      {detail && <p className="plan-print__meta">{detail}</p>}
    </header>
  );
}

function PrintStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="plan-print__stat">
      <dt className="plan-print__meta">{label}</dt>
      <dd className="plan-print__stat-value">{value}</dd>
    </div>
  );
}

function ShortfallRows({ entries }: { entries: PlanShortfall[] }) {
  return (
    <ul className="plan-print__list">
      {entries.map((entry, index) => (
        <li key={index}>
          {/* A quantidade vem primeiro porque é o que se lê primeiro numa lista
              de compra: são quatro laterais que faltam, não a lateral. */}
          <strong>{entry.quantity}×</strong> {entry.label ? `${entry.label} — ` : ''}
          {formatDimensions(entry.lengthTenthsMm, entry.widthTenthsMm)}
        </li>
      ))}
    </ul>
  );
}

/**
 * O que ficou de fora, na folha que vai junto para a loja. As duas listas são
 * separadas de propósito: **não alocada** cabe e ficou sem chapa — comprar
 * resolve —, e **rejeitada** não cabe em chapa nenhuma do projeto, de modo que
 * somá-la à conta faria o papel recomendar uma compra que não resolve nada.
 */
function PrintShortfall({ plan }: { plan: Plan }) {
  if (plan.unplaced.length === 0 && plan.rejected.length === 0) return null;

  return (
    <>
      {plan.unplaced.length > 0 && (
        <section className="plan-print__section">
          <h2 className="plan-print__section-title">{SHORTFALL_COPY.unplacedTitle}</h2>
          <p>{SHORTFALL_COPY.unplacedLead}</p>
          <ShortfallRows entries={plan.unplaced} />

          {/* O déficit vai em duas colunas, e não na frase corrida da tela:
              quem está com a folha na mão está montando um pedido de compra, e
              varre a página atrás do número em vez de ler o parágrafo. */}
          <dl className="plan-print__facts">
            <dt>Área que falta</dt>
            <dd>{formatSquareMeters(plan.deficit.areaTenthsMm2)} — já com o kerf de cada peça</dd>

            {plan.deficit.referenceSheet ? (
              <>
                <dt>Equivale a</dt>
                <dd>
                  pelo menos {formatCount(plan.deficit.atLeastSheets, 'chapa', 'chapas')} de{' '}
                  {formatDimensions(
                    plan.deficit.referenceSheet.lengthTenthsMm,
                    plan.deficit.referenceSheet.widthTenthsMm,
                  )}
                  , o maior formato do projeto
                </dd>
              </>
            ) : (
              <>
                <dt>Equivale a</dt>
                <dd>{SHORTFALL_COPY.deficitWithoutReference}</dd>
              </>
            )}
          </dl>
          <p className="plan-print__meta">{SHORTFALL_COPY.deficitCaveat}</p>
        </section>
      )}

      {plan.rejected.length > 0 && (
        <section className="plan-print__section">
          <h2 className="plan-print__section-title">{SHORTFALL_COPY.rejectedTitle}</h2>
          <p>{describeRejection(plan.unplaced.length > 0)}</p>
          <ShortfallRows entries={plan.rejected} />
          <p className="plan-print__meta">
            {describeFitRule({ kerfTenthsMm: plan.kerfTenthsMm, trimTenthsMm: plan.trimTenthsMm })}
          </p>
        </section>
      )}
    </>
  );
}
