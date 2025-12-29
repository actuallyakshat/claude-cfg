import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from './common/Header.js';
import { Select, type SelectItem } from './common/Select.js';
import { getConfigs, getActiveConfig, setActiveConfigId, ANTHROPIC_OAUTH_CONFIG_ID } from '../services/config-store.js';
import { setEnvSettings, clearEnvSettings } from '../services/claude-settings.js';
import { getProvider } from '../providers/index.js';

interface SwitchConfigProps {
  onBack: () => void;
}

export function SwitchConfig({ onBack }: SwitchConfigProps): React.ReactElement {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const configs = getConfigs();
  const activeConfig = getActiveConfig();

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
    }
  });

  if (configs.length === 0) {
    return (
      <Box flexDirection="column">
        <Header title="Switch Configuration" subtitle="Quick switch between saved configs" />
        <Text color="yellow">No configurations saved yet.</Text>
        <Text dimColor>Add a configuration first from the main menu.</Text>
        <Box marginTop={1}>
          <Text dimColor>Press ESC or 'q' to go back</Text>
        </Box>
      </Box>
    );
  }

  const items: SelectItem<string>[] = configs.map((config) => {
    const isOAuth = config.id === ANTHROPIC_OAUTH_CONFIG_ID;
    const providerName = isOAuth ? 'OAuth' : getProvider(config.provider).name;
    return {
      label: `${config.name}${activeConfig?.id === config.id ? ' [Active]' : ''}`,
      value: config.id,
    };
  });

  items.push({ label: '← Back to menu', value: '__back__' });

  const handleSelect = (item: SelectItem<string>) => {
    if (item.value === '__back__') {
      onBack();
      return;
    }

    const config = configs.find((c) => c.id === item.value);
    if (!config) {
      setMessage({ type: 'error', text: 'Configuration not found' });
      return;
    }

    try {
      const isOAuth = config.id === ANTHROPIC_OAUTH_CONFIG_ID;

      if (isOAuth) {
        // Clear env to use OAuth (Keychain credentials)
        clearEnvSettings();
      } else {
        const provider = getProvider(config.provider);
        const envSettings = provider.buildEnvSettings(config.credentials, config.modelOverrides);
        setEnvSettings(envSettings);
      }

      setActiveConfigId(config.id);
      setMessage({
        type: 'success',
        text: `Switched to "${config.name}"! Restart Claude Code to apply changes.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to switch: ${err}` });
    }
  };

  return (
    <Box flexDirection="column">
      <Header title="Switch Configuration" subtitle="Quick switch between saved configs" />

      {message && (
        <Box marginBottom={1}>
          <Text color={message.type === 'success' ? 'green' : 'red'}>{message.text}</Text>
        </Box>
      )}

      <Select items={items} onSelect={handleSelect} />

      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select, ESC to go back</Text>
      </Box>
    </Box>
  );
}
