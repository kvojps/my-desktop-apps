import { CircleAlert, FolderOpen, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { APP_ERROR_DESCRIPTIONS, decodeAppError } from '@shared/errors/appError';
import { api } from '@/api/client';
import { Button } from '@/components/Button';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface ErrorStateProps {
  /** O que a tela não conseguiu carregar, ex.: "Não foi possível carregar os produtos". */
  title: string;
  error: unknown;
  onRetry: () => void;
  /**
   * Dentro de uma seção, e não ocupando a página: sem o respiro de topo e um
   * degrau menor. É a mesma distinção que o `EmptyState` já faz nas chamadas,
   * com ícone de 48 na página inteira e de 40 numa seção.
   */
  dense?: boolean;
}

/**
 * Estado de erro das páginas. O texto descreve a falha que realmente pode ter
 * acontecido num app local (banco inacessível, corrompido, sem permissão) e
 * oferece a ação correspondente.
 */
export function ErrorState({ title, error, onRetry, dense }: ErrorStateProps) {
  const { code, message } = decodeAppError(error);
  const { showSnackbar, showError } = useSnackbar();
  const [restoring, setRestoring] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Quando uma carga falha, anunciar o título é mais útil que deixar o foco no
  // controle que disparou a navegação para uma área agora indisponível.
  useEffect(() => headingRef.current?.focus(), []);

  const canRestore = code === 'db-corrupted' || code === 'db-unavailable' || code === 'unknown';
  const canOpenFolder = code !== 'not-found' && code !== 'invalid-input';

  async function handleRestore() {
    setRestoring(true);
    try {
      const result = await api.importData();
      if (result.success) {
        showSnackbar('Backup restaurado');
        onRetry();
      } else if (result.error !== 'canceled') {
        showSnackbar('Arquivo de backup inválido', 'error');
      }
    } catch (err) {
      showError(err);
    } finally {
      setRestoring(false);
    }
  }

  async function handleOpenFolder() {
    try {
      await api.openDataFolder();
    } catch (err) {
      showError(err);
    }
  }

  return (
    <section className="negocio-error" data-dense={!!dense} role="alert">
      <CircleAlert size={dense ? 40 : 48} className="negocio-error-icon" aria-hidden="true" />
      <h2 ref={headingRef} tabIndex={-1}>
        {title}
      </h2>
      <p>{APP_ERROR_DESCRIPTIONS[code]}</p>
      <div className="negocio-state-actions">
        <Button variant="primary" onClick={onRetry}>
          Tentar novamente
        </Button>
        {canRestore && (
          <Button onClick={handleRestore} disabled={restoring}>
            <RotateCcw size={18} aria-hidden="true" />
            {restoring ? 'Restaurando...' : 'Restaurar backup'}
          </Button>
        )}
        {canOpenFolder && (
          <Button onClick={handleOpenFolder}>
            <FolderOpen size={18} aria-hidden="true" />
            Abrir pasta de dados
          </Button>
        )}
      </div>
      <p className="negocio-error-detail">{message}</p>
    </section>
  );
}
