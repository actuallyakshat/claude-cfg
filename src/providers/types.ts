import type { ClaudeEnvSettings, Credentials, ModelOverrides, ProviderType } from '../types/index.js';

export interface ProviderField {
  name: keyof Credentials | 'customField';
  label: string;
  placeholder: string;
  required: boolean;
  secret?: boolean;
}

export interface Provider {
  type: ProviderType;
  name: string;
  description: string;
  fields: ProviderField[];
  buildEnvSettings(credentials: Credentials, modelOverrides?: ModelOverrides): ClaudeEnvSettings;
}
