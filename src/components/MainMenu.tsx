import React from 'react';
import { Box, Text } from 'ink';
import { Header } from './common/Header.js';
import { Select, type SelectItem } from './common/Select.js';
import type { Screen } from '../types/index.js';
import { getConfigs, getActiveConfig, ANTHROPIC_OAUTH_CONFIG_ID } from '../services/config-store.js';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
  onExit: () => void;
}

type MenuAction = Screen | 'exit';

export function MainMenu({ onNavigate, onExit }: MainMenuProps): React.ReactElement {
  const configs = getConfigs();
  const activeConfig = getActiveConfig();
  const isOAuthActive = activeConfig?.id === ANTHROPIC_OAUTH_CONFIG_ID;

  const items: SelectItem<MenuAction>[] = [
    { label: 'Switch Configuration', value: 'switch-config' },
    { label: 'Add New Configuration', value: 'add-config' },
    { label: 'View Current Status', value: 'status' },
    { label: 'Manage Saved Configs', value: 'config-list' },
    { label: 'Exit', value: 'exit' },
  ];

  const handleSelect = (item: SelectItem<MenuAction>) => {
    if (item.value === 'exit') {
      onExit();
    } else {
      onNavigate(item.value);
    }
  };

  return (
    <Box flexDirection="column">
      <Header subtitle="Manage your Claude Code configurations" />

      <Box marginBottom={1}>
        <Text>
          <Text dimColor>Active: </Text>
          {activeConfig ? (
            <>
              <Text color="green" bold>{activeConfig.name}</Text>
              {isOAuthActive && <Text dimColor> (OAuth)</Text>}
            </>
          ) : (
            <Text color="yellow">None selected</Text>
          )}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Saved configs: {configs.length}</Text>
      </Box>

      <Select items={items} onSelect={handleSelect} />

      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
}
