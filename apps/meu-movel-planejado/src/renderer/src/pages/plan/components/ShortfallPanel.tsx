import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import type { PlanDeficit, PlanShortfall } from '@shared/types/plan';
import { describeFitRule } from '@/utils/cuttingGeometry';
import { formatCount, formatDimensions, formatSquareMeters } from '@/utils/format';
import { SHORTFALL_COPY, describeRejection } from '../shortfallCopy';

/**
 * O que ficou de fora do plano — e é a razão de o app existir em vez de uma
 * conta de cabeça. Quando o estoque não cobre o serviço, o app não falha em
 * silêncio: ele diz quais peças ficaram para depois, quanto material falta e
 * quantas chapas isso é, para que a compra aconteça antes de o corte começar.
 *
 * As duas listas são separadas de propósito, e o glossário existe para mantê-las
 * assim. **Não alocada** é peça que caberia e ficou sem chapa — comprar resolve,
 * e é ela que entra no déficit. **Rejeitada** não cabe em chapa nenhuma do
 * projeto: somá-la à conta faria o app recomendar uma compra que não resolveria
 * nada.
 */

interface ShortfallPanelProps {
  /** Caberia, mas o estoque acabou. */
  unplaced: PlanShortfall[];
  /** Não cabe em chapa nenhuma do projeto. */
  rejected: PlanShortfall[];
  deficit: PlanDeficit;
  /**
   * A geometria com que **este** plano foi feito. Ela entra porque a rejeição
   * quase sempre é decidida por ela: peça do tamanho exato da chapa não cabe, e
   * quem não sabe que a fresa cobra contra a borda lê isso como erro do app.
   */
  kerfTenthsMm: number;
  trimTenthsMm: number;
}

/** Como a peça se identifica onde só cabe um nome: o rótulo, ou a medida dela. */
function shortfallName(entry: PlanShortfall): string {
  return entry.label || formatDimensions(entry.lengthTenthsMm, entry.widthTenthsMm);
}

function ShortfallList({ entries }: { entries: PlanShortfall[] }) {
  return (
    <Stack component="ul" spacing={1} sx={{ m: 0, pl: 0, listStyle: 'none' }}>
      {entries.map((entry, index) => (
        // A posição é a chave, e não rótulo com medida: o plano é um snapshot
        // imóvel, e duas peças cadastradas com o mesmo rótulo e a mesma medida
        // são duas linhas legítimas — a chave derivada as colidiria.
        <Stack key={index} component="li" direction="row" spacing={1} alignItems="baseline">
          {/* A quantidade vem primeiro porque é o que se lê primeiro numa lista
              de compra: são quatro laterais que faltam, não a lateral. */}
          <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
            {entry.quantity}×
          </Typography>
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="body2">{shortfallName(entry)}</Typography>
            {/* Peça sem rótulo já se identifica pela medida na linha acima:
                repeti-la aqui diria duas vezes a mesma coisa. */}
            {entry.label && (
              <Typography variant="caption" color="text.secondary">
                {formatDimensions(entry.lengthTenthsMm, entry.widthTenthsMm)}
              </Typography>
            )}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * O déficit em m² e traduzido em chapas. A tradução diz **qual formato** entrou
 * na divisão — sem isso "pelo menos 3 chapas" não é um pedido que se faça na
 * loja — e é apresentada como limite inferior: a conta por área ignora o
 * encaixe, e prometer o número exato faria o marceneiro descobrir na hora do
 * corte que a conta era otimista.
 */
function DeficitLines({ deficit }: { deficit: PlanDeficit }) {
  // As duas primeiras frases evitam concordar com o número: "falta 1 chapa" e
  // "faltam 3 chapas" seriam dois ramos para a mesma linha, e "área que falta" e
  // "equivale a" servem os dois casos sem ramificar.
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        Área que falta: <strong>{formatSquareMeters(deficit.areaTenthsMm2)}</strong>, já com o kerf
        de cada peça.
      </Typography>

      {deficit.referenceSheet ? (
        <>
          <Typography variant="body2">
            Equivale a{' '}
            <strong>pelo menos {formatCount(deficit.atLeastSheets, 'chapa', 'chapas')}</strong> de{' '}
            {formatDimensions(
              deficit.referenceSheet.lengthTenthsMm,
              deficit.referenceSheet.widthTenthsMm,
            )}
            , o maior formato do projeto.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {SHORTFALL_COPY.deficitCaveat}
          </Typography>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {SHORTFALL_COPY.deficitWithoutReference}
        </Typography>
      )}
    </Stack>
  );
}

export function ShortfallPanel({
  unplaced,
  rejected,
  deficit,
  kerfTenthsMm,
  trimTenthsMm,
}: ShortfallPanelProps) {
  // Nada de fora, nada a dizer: este card é a própria condição, e uma caixa
  // vazia anunciando que não há notícia é superfície gasta com nada. ("Painel"
  // fica só no nome em inglês do componente: em português o glossário reserva
  // a palavra como sinônimo de chapa, e a lista em _Avoid_ dela.)
  if (unplaced.length === 0 && rejected.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          {unplaced.length > 0 && (
            <Stack spacing={1.5}>
              <Stack spacing={0.5}>
                <Typography variant="h6">{SHORTFALL_COPY.unplacedTitle}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {SHORTFALL_COPY.unplacedLead}
                </Typography>
              </Stack>

              <ShortfallList entries={unplaced} />
              <Divider />
              <DeficitLines deficit={deficit} />
            </Stack>
          )}

          {unplaced.length > 0 && rejected.length > 0 && <Divider />}

          {rejected.length > 0 && (
            <Stack spacing={1.5}>
              <Stack spacing={0.5}>
                <Typography variant="h6">{SHORTFALL_COPY.rejectedTitle}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {describeRejection(unplaced.length > 0)}
                </Typography>
              </Stack>

              <ShortfallList entries={rejected} />

              <Typography variant="caption" color="text.secondary">
                {describeFitRule({ kerfTenthsMm, trimTenthsMm })}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
