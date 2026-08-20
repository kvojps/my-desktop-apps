import { useCallback, useEffect, useState } from 'react';
import type { AppInfo } from '@shared/types/appInfo';
import { api } from '@/api/client';

export interface UseAppInfoReturn {
  info: AppInfo | null;
  isLoading: boolean;
  error: unknown;
  retry: () => void;
}

/**
 * Versão do app e caminho do banco em disco — o que o suporte precisa saber.
 *
 * Os três estados são distintos de propósito. Antes a falha também zerava o
 * `info`, e a tela ficava dizendo "Carregando informações..." para sempre: o
 * usuário esperava por algo que nunca ia chegar.
 */
export function useAppInfo(): UseAppInfoReturn {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    api
      .getAppInfo()
      .then((result) => {
        if (active) setInfo(result);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  return { info, isLoading, error, retry };
}
