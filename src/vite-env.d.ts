/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVE_COUNTER_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
