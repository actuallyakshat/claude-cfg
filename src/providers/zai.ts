import type { Provider } from './types.js';
import type { ClaudeEnvSettings, Credentials, ModelOverrides } from '../types/index.js';

export const zaiProvider: Provider = {
  type: 'zai',
  name: 'Z.AI (GLM)',
  description: 'Use GLM models via Z.AI Coding Plan',
  fields: [
    {
      name: 'authToken',
      label: 'Z.AI API Key',
      placeholder: 'Your Z.AI API key',
      required: true,
      secret: true,
    },
  ],
  buildEnvSettings(credentials: Credentials, modelOverrides?: ModelOverrides): ClaudeEnvSettings {
    const env: ClaudeEnvSettings = {
      ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
      ANTHROPIC_AUTH_TOKEN: credentials.authToken,
      API_TIMEOUT_MS: '3000000',
    };

    // Default GLM model mappings (lowercase as per Z.AI docs)
    const defaults = {
      sonnet: 'glm-4.7',
      opus: 'glm-4.7',
      haiku: 'glm-4.5-air',
    };

    // Apply overrides, or use defaults
    if (modelOverrides?.sonnet) {
      env.ANTHROPIC_DEFAULT_SONNET_MODEL = modelOverrides.sonnet.toLowerCase();
    } else {
      env.ANTHROPIC_DEFAULT_SONNET_MODEL = defaults.sonnet;
    }
    if (modelOverrides?.opus) {
      env.ANTHROPIC_DEFAULT_OPUS_MODEL = modelOverrides.opus.toLowerCase();
    } else {
      env.ANTHROPIC_DEFAULT_OPUS_MODEL = defaults.opus;
    }
    if (modelOverrides?.haiku) {
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL = modelOverrides.haiku.toLowerCase();
    } else {
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL = defaults.haiku;
    }

    return env;
  },
};
