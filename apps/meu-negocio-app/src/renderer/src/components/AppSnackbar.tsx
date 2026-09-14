import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import type { SnackbarState } from '@/contexts/SnackbarContext';

interface AppSnackbarProps {
  snackbar: SnackbarState | null;
  open: boolean;
  onClose: () => void;
  /** Avisa que a mensagem atual saiu de cena e a fila pode avançar. */
  onExited: () => void;
}

/**
 * Ícone e nome da severidade: a cor não é canal nenhum aqui — o texto da
 * notificação é neutro, e "Erro: …" é o que diferencia sem depender de âmbar
 * ou vermelho como texto (§1.4, §1.7).
 */
const SEVERITIES = {
  success: { icon: CircleCheck, label: 'Sucesso' },
  error: { icon: CircleAlert, label: 'Erro' },
  warning: { icon: TriangleAlert, label: 'Atenção' },
  info: { icon: Info, label: 'Informação' },
};

export function AppSnackbar({ snackbar, open, onClose, onExited }: AppSnackbarProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const element = useRef<HTMLDivElement>(null);

  // O aviso é um `popover` manual: só a camada superior fica acima de um
  // `<dialog>` modal, e é ali que o erro de salvar precisa aparecer — o
  // formulário continua aberto com os dados digitados, e um aviso atrás do
  // véu do diálogo é um aviso que ninguém vê.
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || !open || !snackbar) return;
    node.showPopover();
    return () => {
      if (node.isConnected && node.matches(':popover-open')) node.hidePopover();
    };
  }, [open, snackbar]);

  // Sem transição não há "exited" a esperar: fechar já libera a fila. O timer
  // reinicia a cada mensagem (`key`) — sem isso a segunda da fila herdaria o
  // tempo já corrido da primeira — e pausa enquanto o cursor ou o foco estão
  // sobre o aviso.
  useEffect(() => {
    if (!open) {
      onExited();
      return;
    }
    if (hovered || focused) return;
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [open, snackbar?.key, hovered, focused, onClose, onExited]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!snackbar || !open) return null;
  const { icon: Icon, label } = SEVERITIES[snackbar.severity];

  return (
    <div
      ref={element}
      popover="manual"
      className="negocio-snackbar"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className="negocio-snackbar-message"
        role={snackbar.severity === 'error' ? 'alert' : 'status'}
      >
        <Icon size={18} aria-hidden="true" />
        <span>
          <strong>{label}: </strong>
          {snackbar.message}
        </span>
      </div>
      <Button variant="ghost" aria-label="Fechar notificação" onClick={onClose}>
        <X size={18} aria-hidden="true" />
      </Button>
    </div>
  );
}
