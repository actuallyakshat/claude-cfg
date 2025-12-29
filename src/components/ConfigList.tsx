import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from './common/Header.js';
import { Select, type SelectItem } from './common/Select.js';
import { getConfigs, getActiveConfig } from '../services/config-store.js';
import { getProvider } from '../providers/index.js';

interface ConfigListProps {
  onBack: () => void;
  onSelectConfig: (configId: string) => void;
}

export function ConfigList({ onBack, onSelectConfig }: ConfigListProps): React.ReactElement {
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
        <Header title="Manage Configs" subtitle="View and manage saved configurations" />
        <Text color="yellow">No configurations saved yet.</Text>
        <Box marginTop={1}>
          <Text dimColor>Press ESC or 'q' to go back</Text>
        </Box>
      </Box>
    );
  }

  const items: SelectItem<string>[] = configs.map((config) => ({
    label: `${config.name} (${getProvider(config.provider).name})${
      activeConfig?.id === config.id ? ' [Active]' : ''
    }`,
    value: config.id,
  }));

  items.push({ label: '← Back to menu', value: '__back__' });

  const handleSelect = (item: SelectItem<string>) => {
    if (item.value === '__back__') {
      onBack();
    } else {
      onSelectConfig(item.value);
    }
  };

  return (
    <Box flexDirection="column">
      <Header title="Manage Configs" subtitle="Select a configuration to view or edit" />

      <Select items={items} onSelect={handleSelect} />

      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select, ESC to go back</Text>
      </Box>
    </Box>
  );
}
