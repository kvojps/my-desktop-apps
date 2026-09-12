import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import type { SnackbarState } from '@/contexts/SnackbarContext';

interface AppSnackbarProps {
  snackbar: SnackbarState | null;
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

const SEVERITIES = {
  success: { icon: CircleCheck, label: 'Sucesso' },
  error: { icon: CircleAlert, label: 'Erro' },
  warning: { icon: TriangleAlert, label: 'Atenção' },
  info: { icon: Info, label: 'Informação' },
};

export function AppSnackbar({ snackbar, open, onClose, onExited }: AppSnackbarProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
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
      className="money-snackbar money-surface"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className="money-notification-message"
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
