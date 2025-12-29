import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from './common/Header.js';
import { Select, type SelectItem } from './common/Select.js';
import { TextInput } from './common/TextInput.js';
import { getProvider } from '../providers/index.js';
import { getConfigById, updateConfig, setActiveConfigId } from '../services/config-store.js';
import { setEnvSettings } from '../services/claude-settings.js';
import type { Credentials, ModelOverrides } from '../types/index.js';

interface EditConfigProps {
  configId: string;
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'name' | 'credentials' | 'model-overrides' | 'confirm';

export function EditConfig({ configId, onBack, onComplete }: EditConfigProps): React.ReactElement {
  const existingConfig = getConfigById(configId);

  if (!existingConfig) {
    return (
      <Box flexDirection="column">
        <Header title="Edit Configuration" />
        <Text color="red">Configuration not found.</Text>
        <Box marginTop={1}>
          <Text dimColor>Press ESC or 'q' to go back</Text>
        </Box>
      </Box>
    );
  }

  const provider = getProvider(existingConfig.provider);

  const [step, setStep] = useState<Step>('name');
  const [configName, setConfigName] = useState(existingConfig.name);
  const [credentials, setCredentials] = useState<Credentials>(existingConfig.credentials || {});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [currentFieldValue, setCurrentFieldValue] = useState(
    (existingConfig.credentials as any)[provider.fields[0]?.name] || ''
  );
  const [modelOverrides, setModelOverrides] = useState<ModelOverrides>(existingConfig.modelOverrides || {});
  const [modelOverrideStep, setModelOverrideStep] = useState<'sonnet' | 'opus' | 'haiku' | 'done'>('sonnet');
  const [currentModelValue, setCurrentModelValue] = useState(existingConfig.modelOverrides?.sonnet || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'name') {
        onBack();
      } else if (step === 'credentials') {
        if (currentFieldIndex > 0) {
          setCurrentFieldIndex(currentFieldIndex - 1);
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

  // Step 1: Edit Name
  if (step === 'name') {
    return (
      <Box flexDirection="column">
        <Header title="Edit Configuration" subtitle="Step 1: Update configuration name" />
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
                const firstField = provider.fields[0];
                setCurrentFieldValue((credentials as any)[firstField?.name] || '');
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

  // Step 2: Edit Credentials
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
        setCurrentModelValue(modelOverrides.sonnet || '');
      }
    };

    return (
      <Box flexDirection="column">
        <Header
          title="Edit Configuration"
          subtitle={`Step 2: Update credentials (${currentFieldIndex + 1}/${provider.fields.length})`}
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

  // Step 3: Model Overrides (optional)
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
      } else {
        // Remove the override if user cleared it
        const newOverrides = { ...modelOverrides };
        delete newOverrides[modelOverrideStep];
        setModelOverrides(newOverrides);
      }

      if (modelOverrideStep === 'sonnet') {
        setModelOverrideStep('opus');
        setCurrentModelValue(modelOverrides.opus || '');
      } else if (modelOverrideStep === 'opus') {
        setModelOverrideStep('haiku');
        setCurrentModelValue(modelOverrides.haiku || '');
      } else {
        setStep('confirm');
      }
    };

    return (
      <Box flexDirection="column">
        <Header title="Edit Configuration" subtitle="Step 3: Update model overrides (optional)" />
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

  // Step 4: Confirm
  if (step === 'confirm') {
    const items: SelectItem<'save' | 'save-activate' | 'back'>[] = [
      { label: 'Save and Activate', value: 'save-activate' },
      { label: 'Save Only', value: 'save' },
      { label: '← Go Back', value: 'back' },
    ];

    const handleSave = (activate: boolean) => {
      try {
        updateConfig(configId, {
          name: configName.trim(),
          credentials,
          modelOverrides: Object.keys(modelOverrides).length > 0 ? modelOverrides : undefined,
        });

        if (activate) {
          const envSettings = provider.buildEnvSettings(credentials, modelOverrides);
          setEnvSettings(envSettings);
          setActiveConfigId(configId);
        }

        setMessage({
          type: 'success',
          text: activate
            ? `Configuration updated and activated! Restart Claude Code to apply changes.`
            : `Configuration updated!`,
        });

        setTimeout(() => onComplete(), 1500);
      } catch (err) {
        setMessage({ type: 'error', text: `Failed to save: ${err}` });
      }
    };

    return (
      <Box flexDirection="column">
        <Header title="Edit Configuration" subtitle="Step 4: Review and save" />

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
