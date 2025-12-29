import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { v4 as uuidv4 } from 'uuid';
import { Header } from './common/Header.js';
import { Select, type SelectItem } from './common/Select.js';
import { TextInput } from './common/TextInput.js';
import { providerList, getProvider } from '../providers/index.js';
import { addConfig, setActiveConfigId } from '../services/config-store.js';
import { setEnvSettings } from '../services/claude-settings.js';
import type { ProviderType, Credentials, ModelOverrides, SavedConfig } from '../types/index.js';

interface AddConfigProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'provider' | 'name' | 'credentials' | 'model-overrides' | 'confirm';

export function AddConfig({ onBack, onComplete }: AddConfigProps): React.ReactElement {
  const [step, setStep] = useState<Step>('provider');
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [configName, setConfigName] = useState('');
  const [credentials, setCredentials] = useState<Credentials>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [currentFieldValue, setCurrentFieldValue] = useState('');
  const [modelOverrides, setModelOverrides] = useState<ModelOverrides>({});
  const [modelOverrideStep, setModelOverrideStep] = useState<'sonnet' | 'opus' | 'haiku' | 'done'>('sonnet');
  const [currentModelValue, setCurrentModelValue] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'provider') {
        onBack();
      } else if (step === 'name') {
        setStep('provider');
      } else if (step === 'credentials') {
        if (currentFieldIndex > 0) {
          setCurrentFieldIndex(currentFieldIndex - 1);
          const provider = getProvider(providerType!);
          const prevField = provider.fields[currentFieldIndex - 1];
          setCurrentFieldValue((credentials as any)[prevField.name] || '');
        } else {
          setStep('name');
        }
      } else if (step === 'model-overrides') {
        setStep('credentials');
      } else if (step === 'confirm') {
        setStep('model-overrides');
      }
    }
  });

  // Step 1: Select Provider
  if (step === 'provider') {
    const items: SelectItem<ProviderType | '__back__'>[] = providerList.map((p) => ({
      label: `${p.name} - ${p.description}`,
      value: p.type,
    }));
    items.push({ label: '← Back to menu', value: '__back__' });

    return (
      <Box flexDirection="column">
        <Header title="Add Configuration" subtitle="Step 1: Select a provider" />
        <Select
          items={items}
          onSelect={(item) => {
            if (item.value === '__back__') {
              onBack();
            } else {
              setProviderType(item.value);
              setStep('name');
            }
          }}
        />
        <Box marginTop={1}>
          <Text dimColor>Use arrow keys to navigate, Enter to select, ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  const provider = getProvider(providerType!);

  // Step 2: Enter Name
  if (step === 'name') {
    return (
      <Box flexDirection="column">
        <Header title="Add Configuration" subtitle="Step 2: Name your configuration" />
        <Text dimColor>Provider: {provider.name}</Text>
        <Box marginTop={1}>
          <TextInput
            label="Configuration Name"
            value={configName}
            onChange={setConfigName}
            onSubmit={() => {
              if (configName.trim()) {
                setStep('credentials');
                setCurrentFieldIndex(0);
                setCurrentFieldValue('');
              }
            }}
            placeholder="e.g., My OpenRouter Config"
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press Enter to continue, ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  // Step 3: Enter Credentials
  if (step === 'credentials') {
    const currentField = provider.fields[currentFieldIndex];

    const handleSubmit = () => {
      if (currentField.required && !currentFieldValue.trim()) {
        return;
      }

      const newCredentials = { ...credentials, [currentField.name]: currentFieldValue };
      setCredentials(newCredentials);

      if (currentFieldIndex < provider.fields.length - 1) {
        setCurrentFieldIndex(currentFieldIndex + 1);
        const nextField = provider.fields[currentFieldIndex + 1];
        setCurrentFieldValue((newCredentials as any)[nextField.name] || '');
      } else {
        setStep('model-overrides');
        setModelOverrideStep('sonnet');
        setCurrentModelValue('');
      }
    };

    return (
      <Box flexDirection="column">
        <Header
          title="Add Configuration"
          subtitle={`Step 3: Enter credentials (${currentFieldIndex + 1}/${provider.fields.length})`}
        />
        <Text dimColor>Provider: {provider.name}</Text>
        <Text dimColor>Name: {configName}</Text>
        <Box marginTop={1}>
          <TextInput
            label={currentField.label + (currentField.required ? ' (required)' : ' (optional)')}
            value={currentFieldValue}
            onChange={setCurrentFieldValue}
            onSubmit={handleSubmit}
            placeholder={currentField.placeholder}
            mask={currentField.secret ? '*' : undefined}
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press Enter to continue, ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  // Step 4: Model Overrides (optional)
  if (step === 'model-overrides') {
    const modelLabels = {
      sonnet: 'Sonnet Model Override',
      opus: 'Opus Model Override',
      haiku: 'Haiku Model Override',
    };

    if (modelOverrideStep === 'done') {
      setStep('confirm');
      return <></>;
    }

    const handleSubmit = () => {
      if (currentModelValue.trim()) {
        setModelOverrides({ ...modelOverrides, [modelOverrideStep]: currentModelValue.trim() });
      }

      if (modelOverrideStep === 'sonnet') {
        setModelOverrideStep('opus');
      } else if (modelOverrideStep === 'opus') {
        setModelOverrideStep('haiku');
      } else {
        setStep('confirm');
      }
      setCurrentModelValue('');
    };

    const items: SelectItem<'enter' | 'skip'>[] = [
      { label: 'Enter a model override', value: 'enter' },
      { label: 'Skip (use default)', value: 'skip' },
    ];

    return (
      <Box flexDirection="column">
        <Header title="Add Configuration" subtitle="Step 4: Model overrides (optional)" />
        <Text dimColor>Leave empty to use provider defaults</Text>
        <Box marginTop={1}>
          <TextInput
            label={modelLabels[modelOverrideStep]}
            value={currentModelValue}
            onChange={setCurrentModelValue}
            onSubmit={handleSubmit}
            placeholder="e.g., openai/gpt-4o (leave empty to skip)"
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press Enter to continue (empty to skip), ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  // Step 5: Confirm
  if (step === 'confirm') {
    const items: SelectItem<'save' | 'save-activate' | 'back'>[] = [
      { label: 'Save and Activate', value: 'save-activate' },
      { label: 'Save Only', value: 'save' },
      { label: '← Go Back', value: 'back' },
    ];

    const handleSave = (activate: boolean) => {
      try {
        const newConfig: SavedConfig = {
          id: uuidv4(),
          name: configName.trim(),
          provider: providerType!,
          credentials,
          modelOverrides: Object.keys(modelOverrides).length > 0 ? modelOverrides : undefined,
          createdAt: new Date().toISOString(),
        };

        addConfig(newConfig);

        if (activate) {
          const envSettings = provider.buildEnvSettings(credentials, modelOverrides);
          setEnvSettings(envSettings);
          setActiveConfigId(newConfig.id);
        }

        setMessage({
          type: 'success',
          text: activate
            ? `Configuration saved and activated! Restart Claude Code to apply changes.`
            : `Configuration saved!`,
        });

        setTimeout(() => onComplete(), 1500);
      } catch (err) {
        setMessage({ type: 'error', text: `Failed to save: ${err}` });
      }
    };

    return (
      <Box flexDirection="column">
        <Header title="Add Configuration" subtitle="Step 5: Review and save" />

        <Box flexDirection="column" marginBottom={1}>
          <Text>
            <Text dimColor>Name: </Text>
            <Text bold>{configName}</Text>
          </Text>
          <Text>
            <Text dimColor>Provider: </Text>
            <Text>{provider.name}</Text>
          </Text>
          {Object.entries(credentials).map(([key, value]) => (
            <Text key={key}>
              <Text dimColor>{key}: </Text>
              <Text>{key.toLowerCase().includes('key') || key.toLowerCase().includes('token') ? '****' : value}</Text>
            </Text>
          ))}
          {Object.entries(modelOverrides).map(([key, value]) => (
            <Text key={key}>
              <Text dimColor>{key} model: </Text>
              <Text>{value}</Text>
            </Text>
          ))}
        </Box>

        {message && (
          <Box marginBottom={1}>
            <Text color={message.type === 'success' ? 'green' : 'red'}>{message.text}</Text>
          </Box>
        )}

        <Select
          items={items}
          onSelect={(item) => {
            if (item.value === 'save-activate') {
              handleSave(true);
            } else if (item.value === 'save') {
              handleSave(false);
            } else {
              setStep('model-overrides');
              setModelOverrideStep('sonnet');
            }
          }}
        />

        <Box marginTop={1}>
          <Text dimColor>Use arrow keys to navigate, Enter to select</Text>
        </Box>
      </Box>
    );
  }

  return <></>;
}
