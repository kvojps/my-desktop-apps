import { useEffect, useState } from 'react';
import type { AppInfo } from '@shared/types/appInfo';
import { api } from '@/api/client';

/** Versão do app e caminho do banco em disco — o que o suporte precisa saber. */
export function useAppInfo(): AppInfo | null {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    let active = true;

    api
      .getAppInfo()
      .then((result) => {
        if (active) setInfo(result);
      })
      .catch(() => {
        if (active) setInfo(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return info;
}
