import { AutoAwesomeMosaicOutlined } from '@mui/icons-material';
import { Alert, AlertTitle, Button, Tooltip } from '@mui/material';
import { formatDateTime } from '@/utils/date';

/**
 * O aviso de **plano desatualizado**: o desenho na tela é anterior à última
 * alteração do projeto.
 *
 * Ele não corrige nada e não esconde nada. O plano continua sendo o vigente e
 * continua desenhado embaixo — é ele que está na bancada, e apagá-lo tiraria da
 * tela justamente o papel que o marceneiro tem na mão. O que o aviso faz é
 * dizer que os dois deixaram de corresponder, e oferecer a saída ali mesmo: sem
 * o botão aqui, quem já está lendo o desenho teria de voltar uma tela para
 * refazer o que acabou de descobrir que precisa refazer.
 *
 * `warning`, e não `error`: nada está quebrado e nada foi recusado. O plano
 * continua íntegro e cortar por ele pode ser exatamente o que a pessoa quer —
 * `error` é a cor do que o app não faz, e aqui ele fez.
 */
interface OutdatedPlanNoticeProps {
  /** Quando o projeto foi alterado — o instante que deixou este plano para trás. */
  projectUpdatedAt: string;
  isGenerating: boolean;
  canGenerate: boolean;
  /** Por que não dá para gerar agora; vazio quando dá. */
  blockedReason: string;
  onGenerate: () => void;
}

export function OutdatedPlanNotice({
  projectUpdatedAt,
  isGenerating,
  canGenerate,
  blockedReason,
  onGenerate,
}: OutdatedPlanNoticeProps) {
  return (
    <Alert
      severity="warning"
      action={
        // O `span` é o que dá ao tooltip um alvo que continua recebendo o
        // ponteiro quando o botão está desligado.
        <Tooltip title={blockedReason}>
          <span>
            <Button
              color="inherit"
              size="small"
              startIcon={<AutoAwesomeMosaicOutlined />}
              onClick={onGenerate}
              disabled={!canGenerate}
            >
              {isGenerating ? 'Gerando...' : 'Gerar de novo'}
            </Button>
          </span>
        </Tooltip>
      }
    >
      <AlertTitle>Este plano é anterior às últimas alterações</AlertTitle>
      {/* A data é o que torna o aviso verificável: ela diz de que alteração se
          está falando, e é como quem imprimiu o papel confere se foi antes ou
          depois dele. */}
      O projeto foi alterado em {formatDateTime(projectUpdatedAt)}, depois deste desenho. Gere de
      novo para o plano voltar a corresponder ao serviço.
    </Alert>
  );
}
