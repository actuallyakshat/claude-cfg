import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { MANAGER_CONFIGS_PATH, CLAUDE_DIR } from './paths.js';
import { loadClaudeSettings } from './claude-settings.js';
import type { ConfigStore, SavedConfig, ProviderType } from '../types/index.js';

const DEFAULT_STORE: ConfigStore = {
  version: 1,
  activeConfigId: null,
  configs: [],
};

// Special ID for auto-detected Anthropic OAuth config
export const ANTHROPIC_OAUTH_CONFIG_ID = 'anthropic-oauth-default';

interface DetectedConfig {
  provider: ProviderType | 'anthropic-oauth';
  name: string;
  baseUrl?: string;
  authToken?: string;
  apiKey?: string;
  modelOverrides?: {
    sonnet?: string;
    opus?: string;
    haiku?: string;
  };
}

export function detectCurrentConfig(): DetectedConfig {
  const settings = loadClaudeSettings();
  const env = settings.env || {};

  const modelOverrides: DetectedConfig['modelOverrides'] = {};
  if (env.ANTHROPIC_DEFAULT_SONNET_MODEL) modelOverrides.sonnet = env.ANTHROPIC_DEFAULT_SONNET_MODEL;
  if (env.ANTHROPIC_DEFAULT_OPUS_MODEL) modelOverrides.opus = env.ANTHROPIC_DEFAULT_OPUS_MODEL;
  if (env.ANTHROPIC_DEFAULT_HAIKU_MODEL) modelOverrides.haiku = env.ANTHROPIC_DEFAULT_HAIKU_MODEL;

  // No env field or empty = Anthropic OAuth (Pro/Max plan)
  if (!settings.env || Object.keys(env).length === 0) {
    return {
      provider: 'anthropic-oauth',
      name: 'Anthropic (Pro/Max Plan)',
    };
  }

  // Check for OpenRouter
  if (env.ANTHROPIC_BASE_URL === 'https://openrouter.ai/api') {
    return {
      provider: 'openrouter',
      name: 'OpenRouter',
      baseUrl: env.ANTHROPIC_BASE_URL,
      authToken: env.ANTHROPIC_AUTH_TOKEN,
      modelOverrides: Object.keys(modelOverrides).length > 0 ? modelOverrides : undefined,
    };
  }

  // Check for Z.AI
  if (env.ANTHROPIC_BASE_URL === 'https://api.z.ai/api/anthropic') {
    return {
      provider: 'zai',
      name: 'Z.AI (GLM)',
      baseUrl: env.ANTHROPIC_BASE_URL,
      authToken: env.ANTHROPIC_AUTH_TOKEN,
      modelOverrides: Object.keys(modelOverrides).length > 0 ? modelOverrides : undefined,
    };
  }

  // Check for Anthropic API Key (direct, not OAuth)
  if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== '' && !env.ANTHROPIC_BASE_URL) {
    return {
      provider: 'anthropic',
      name: 'Anthropic (API Key)',
      apiKey: env.ANTHROPIC_API_KEY,
      modelOverrides: Object.keys(modelOverrides).length > 0 ? modelOverrides : undefined,
    };
  }

  // Custom provider (has base URL but not OpenRouter or Z.AI)
  if (env.ANTHROPIC_BASE_URL) {
    return {
      provider: 'custom',
      name: 'Custom Provider',
      baseUrl: env.ANTHROPIC_BASE_URL,
      authToken: env.ANTHROPIC_AUTH_TOKEN,
      apiKey: env.ANTHROPIC_API_KEY,
      modelOverrides: Object.keys(modelOverrides).length > 0 ? modelOverrides : undefined,
    };
  }

  // Fallback to OAuth
  return {
    provider: 'anthropic-oauth',
    name: 'Anthropic (Pro/Max Plan)',
  };
}

export function ensureDefaultConfigs(): void {
  const store = loadConfigStore();
  const detected = detectCurrentConfig();

  // Always ensure Anthropic OAuth config exists
  const hasOAuthConfig = store.configs.some((c) => c.id === ANTHROPIC_OAUTH_CONFIG_ID);
  if (!hasOAuthConfig) {
    const oauthConfig: SavedConfig = {
      id: ANTHROPIC_OAUTH_CONFIG_ID,
      name: 'Anthropic (Pro/Max Plan)',
      provider: 'anthropic',
      credentials: {}, // Empty - will clear env to use OAuth
      createdAt: new Date().toISOString(),
    };
    store.configs.unshift(oauthConfig); // Add at beginning
  }

  // If current config is not OAuth and not already saved, import it
  if (detected.provider !== 'anthropic-oauth') {
    const alreadyExists = store.configs.some((c) => {
      if (c.provider !== detected.provider) return false;
      if (detected.baseUrl && c.credentials.baseUrl !== detected.baseUrl) return false;
      if (detected.authToken && c.credentials.authToken !== detected.authToken) return false;
      if (detected.apiKey && c.credentials.apiKey !== detected.apiKey) return false;
      return true;
    });

    if (!alreadyExists && (detected.authToken || detected.apiKey)) {
      const importedConfig: SavedConfig = {
        id: `imported-${Date.now()}`,
        name: `${detected.name} (Imported)`,
        provider: detected.provider as ProviderType,
        credentials: {
          baseUrl: detected.baseUrl,
          authToken: detected.authToken,
          apiKey: detected.apiKey,
        },
        modelOverrides: detected.modelOverrides,
        createdAt: new Date().toISOString(),
      };
      store.configs.push(importedConfig);

      // Mark imported config as active since it's currently in use
      store.activeConfigId = importedConfig.id;
    }
  } else {
    // Using OAuth, mark it as active if no other config is active
    if (!store.activeConfigId) {
      store.activeConfigId = ANTHROPIC_OAUTH_CONFIG_ID;
    }
  }

  saveConfigStore(store);
}

function ensureDir(): void {
  if (!existsSync(CLAUDE_DIR)) {
    mkdirSync(CLAUDE_DIR, { recursive: true });
  }
}

export function loadConfigStore(): ConfigStore {
  try {
    if (!existsSync(MANAGER_CONFIGS_PATH)) {
      return { ...DEFAULT_STORE };
    }
    const content = readFileSync(MANAGER_CONFIGS_PATH, 'utf-8');
    return JSON.parse(content) as ConfigStore;
  } catch {
    return { ...DEFAULT_STORE };
  }
}

export function saveConfigStore(store: ConfigStore): void {
  ensureDir();
  writeFileSync(MANAGER_CONFIGS_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function getConfigs(): SavedConfig[] {
  return loadConfigStore().configs;
}

export function getConfigById(id: string): SavedConfig | undefined {
  return loadConfigStore().configs.find((c) => c.id === id);
}

export function getActiveConfig(): SavedConfig | undefined {
  const store = loadConfigStore();
  if (!store.activeConfigId) return undefined;
  return store.configs.find((c) => c.id === store.activeConfigId);
}

export function addConfig(config: SavedConfig): void {
  const store = loadConfigStore();
  store.configs.push(config);
  saveConfigStore(store);
}

export function updateConfig(id: string, updates: Partial<SavedConfig>): void {
  const store = loadConfigStore();
  const index = store.configs.findIndex((c) => c.id === id);
  if (index !== -1) {
    store.configs[index] = { ...store.configs[index], ...updates };
    saveConfigStore(store);
  }
}

export function deleteConfig(id: string): void {
  const store = loadConfigStore();
  store.configs = store.configs.filter((c) => c.id !== id);
  if (store.activeConfigId === id) {
    store.activeConfigId = null;
  }
  saveConfigStore(store);
}

export function setActiveConfigId(id: string | null): void {
  const store = loadConfigStore();
  store.activeConfigId = id;
  if (id) {
    const config = store.configs.find((c) => c.id === id);
    if (config) {
      config.lastUsed = new Date().toISOString();
    }
  }
  saveConfigStore(store);
}
