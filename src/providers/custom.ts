import type { Provider } from './types.js';
import type { ClaudeEnvSettings, Credentials, ModelOverrides } from '../types/index.js';

export const customProvider: Provider = {
  type: 'custom',
  name: 'Custom Provider',
  description: 'Configure a custom API endpoint',
  fields: [
    {
      name: 'baseUrl',
      label: 'Base URL',
      placeholder: 'https://api.example.com',
      required: true,
      secret: false,
    },
    {
      name: 'authToken',
      label: 'Auth Token',
      placeholder: 'Your API key or token',
      required: true,
      secret: true,
    },
  ],
  buildEnvSettings(credentials: Credentials, modelOverrides?: ModelOverrides): ClaudeEnvSettings {
    const env: ClaudeEnvSettings = {
      ANTHROPIC_BASE_URL: credentials.baseUrl,
      ANTHROPIC_AUTH_TOKEN: credentials.authToken,
      ANTHROPIC_API_KEY: '', // Explicitly empty
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
