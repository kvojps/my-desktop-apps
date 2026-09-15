/// <reference types="vite/client" />
import type { ElectronApi } from '@shared/ipc/api';

declare global {
  interface Window {
    api: ElectronApi;
  }
  const __APP_VERSION__: string;
}

export {};
