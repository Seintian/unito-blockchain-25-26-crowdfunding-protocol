/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACTORY_ADDRESS?: string;
  readonly VITE_FUNDING_TOKEN_ADDRESS?: string;
  readonly VITE_REWARD_TOKEN_ADDRESS?: string;
  readonly VITE_DEFAULT_CHAIN_ID?: string;
  readonly VITE_SEPOLIA_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
