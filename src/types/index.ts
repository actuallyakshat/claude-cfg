export type ProviderType = 'anthropic' | 'openrouter' | 'zai' | 'custom';

export interface Credentials {
  apiKey?: string;
  authToken?: string;
  baseUrl?: string;
}

export interface ModelOverrides {
  sonnet?: string;
  opus?: string;
  haiku?: string;
}

export interface SavedConfig {
  id: string;
  name: string;
  provider: ProviderType;
  credentials: Credentials;
  modelOverrides?: ModelOverrides;
  createdAt: string;
  lastUsed?: string;
}

export interface ConfigStore {
  version: 1;
  activeConfigId: string | null;
  configs: SavedConfig[];
}

export interface ClaudeEnvSettings {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_AUTH_TOKEN?: string;
  ANTHROPIC_BASE_URL?: string;
  API_TIMEOUT_MS?: string;
  ANTHROPIC_DEFAULT_SONNET_MODEL?: string;
  ANTHROPIC_DEFAULT_OPUS_MODEL?: string;
  ANTHROPIC_DEFAULT_HAIKU_MODEL?: string;
  [key: string]: string | undefined;
}

export interface ClaudeSettings {
  env?: ClaudeEnvSettings;
  [key: string]: unknown;
}

export type Screen =
  | 'main-menu'
  | 'add-config'
  | 'config-list'
  | 'config-detail'
  | 'status'
  | 'switch-config';

export interface AppState {
  screen: Screen;
  selectedConfigId?: string;
}
