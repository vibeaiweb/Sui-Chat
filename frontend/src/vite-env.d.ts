/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_NETWORK: string
  readonly VITE_PACKAGE_ID: string
  readonly VITE_CHAT_ROOM_ID: string
  readonly VITE_WALRUS_AGGREGATOR: string
  readonly VITE_WALRUS_PUBLISHER: string
  readonly VITE_ENABLE_WALRUS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
