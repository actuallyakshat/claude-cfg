import type { Provider } from './types.js';
import type { ClaudeEnvSettings, Credentials, ModelOverrides } from '../types/index.js';

export const openrouterProvider: Provider = {
  type: 'openrouter',
  name: 'OpenRouter',
  description: 'Access multiple models via OpenRouter API',
  fields: [
    {
      name: 'authToken',
      label: 'OpenRouter API Key',
      placeholder: 'sk-or-...',
      required: true,
      secret: true,
    },
  ],
  buildEnvSettings(credentials: Credentials, modelOverrides?: ModelOverrides): ClaudeEnvSettings {
    const env: ClaudeEnvSettings = {
      ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
      ANTHROPIC_AUTH_TOKEN: credentials.authToken,
      ANTHROPIC_API_KEY: '', // Must be explicitly empty
    };

    if (modelOverrides?.sonnet) {
      env.ANTHROPIC_DEFAULT_SONNET_MODEL = modelOverrides.sonnet;
    }
    if (modelOverrides?.opus) {
      env.ANTHROPIC_DEFAULT_OPUS_MODEL = modelOverrides.opus;
    }
    if (modelOverrides?.haiku) {
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL = modelOverrides.haiku;
    }

    return env;
  },
};
