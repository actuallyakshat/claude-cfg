import type { Provider } from './types.js';
import type { ProviderType } from '../types/index.js';
import { anthropicProvider } from './anthropic.js';
import { openrouterProvider } from './openrouter.js';
import { zaiProvider } from './zai.js';
import { customProvider } from './custom.js';

export * from './types.js';

export const providers: Record<ProviderType, Provider> = {
  anthropic: anthropicProvider,
  openrouter: openrouterProvider,
  zai: zaiProvider,
  custom: customProvider,
};

export const providerList: Provider[] = [
  anthropicProvider,
  openrouterProvider,
  zaiProvider,
  customProvider,
];

export function getProvider(type: ProviderType): Provider {
  return providers[type];
}
