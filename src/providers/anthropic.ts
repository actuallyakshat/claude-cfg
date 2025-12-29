import type { Provider } from './types.js';
import type { ClaudeEnvSettings, Credentials, ModelOverrides } from '../types/index.js';

export const anthropicProvider: Provider = {
  type: 'anthropic',
  name: 'Anthropic Direct',
  description: 'Use Claude directly with your Anthropic API key',
  fields: [
    {
      name: 'apiKey',
      label: 'API Key',
      placeholder: 'sk-ant-...',
      required: true,
      secret: true,
    },
  ],
  buildEnvSettings(credentials: Credentials, modelOverrides?: ModelOverrides): ClaudeEnvSettings {
    const env: ClaudeEnvSettings = {
      ANTHROPIC_API_KEY: credentials.apiKey,
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
