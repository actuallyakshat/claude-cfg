import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from './common/Header.js';
import { getActiveConfig } from '../services/config-store.js';
import { getEnvSettings, detectCurrentProvider } from '../services/claude-settings.js';
import { getProvider } from '../providers/index.js';
import type { ProviderType } from '../types/index.js';

interface StatusViewProps {
  onBack: () => void;
}

export function StatusView({ onBack }: StatusViewProps): React.ReactElement {
  useInput((input, key) => {
    if (key.escape || input === 'q' || input === 'b') {
      onBack();
    }
  });

  const activeConfig = getActiveConfig();
  const envSettings = getEnvSettings();
  const currentProvider = detectCurrentProvider();

  const maskSecret = (value: string | undefined): string => {
    if (!value) return '(not set)';
    if (value.length <= 8) return '*'.repeat(value.length);
    return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
  };

  return (
    <Box flexDirection="column">
      <Header title="Current Status" subtitle="View your active configuration" />

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">Saved Configuration:</Text>
        {activeConfig ? (
          <Box flexDirection="column" marginLeft={2}>
            <Text>
              <Text dimColor>Name: </Text>
              <Text color="green">{activeConfig.name}</Text>
            </Text>
            <Text>
              <Text dimColor>Provider: </Text>
              <Text>{getProvider(activeConfig.provider).name}</Text>
            </Text>
            {activeConfig.lastUsed && (
              <Text>
                <Text dimColor>Last Used: </Text>
                <Text>{new Date(activeConfig.lastUsed).toLocaleString()}</Text>
              </Text>
            )}
          </Box>
        ) : (
          <Box marginLeft={2}>
            <Text color="yellow">No saved configuration active</Text>
          </Box>
        )}
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">Detected Provider:</Text>
        <Box marginLeft={2}>
          <Text>
            <Text dimColor>Type: </Text>
            <Text color={currentProvider.provider === 'none' ? 'yellow' : 'green'}>
              {currentProvider.provider === 'none' ? 'Not configured' : currentProvider.provider}
            </Text>
          </Text>
        </Box>
        {currentProvider.baseUrl && (
          <Box marginLeft={2}>
            <Text>
              <Text dimColor>Base URL: </Text>
              <Text>{currentProvider.baseUrl}</Text>
            </Text>
          </Box>
        )}
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">Environment Variables:</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>
            <Text dimColor>ANTHROPIC_BASE_URL: </Text>
            <Text>{envSettings.ANTHROPIC_BASE_URL || '(not set)'}</Text>
          </Text>
          <Text>
            <Text dimColor>ANTHROPIC_AUTH_TOKEN: </Text>
            <Text>{maskSecret(envSettings.ANTHROPIC_AUTH_TOKEN)}</Text>
          </Text>
          <Text>
            <Text dimColor>ANTHROPIC_API_KEY: </Text>
            <Text>
              {envSettings.ANTHROPIC_API_KEY === ''
                ? '(empty string)'
                : maskSecret(envSettings.ANTHROPIC_API_KEY)}
            </Text>
          </Text>
          {envSettings.API_TIMEOUT_MS && (
            <Text>
              <Text dimColor>API_TIMEOUT_MS: </Text>
              <Text>{envSettings.API_TIMEOUT_MS}</Text>
            </Text>
          )}
          {envSettings.ANTHROPIC_DEFAULT_SONNET_MODEL && (
            <Text>
              <Text dimColor>ANTHROPIC_DEFAULT_SONNET_MODEL: </Text>
              <Text>{envSettings.ANTHROPIC_DEFAULT_SONNET_MODEL}</Text>
            </Text>
          )}
          {envSettings.ANTHROPIC_DEFAULT_OPUS_MODEL && (
            <Text>
              <Text dimColor>ANTHROPIC_DEFAULT_OPUS_MODEL: </Text>
              <Text>{envSettings.ANTHROPIC_DEFAULT_OPUS_MODEL}</Text>
            </Text>
          )}
          {envSettings.ANTHROPIC_DEFAULT_HAIKU_MODEL && (
            <Text>
              <Text dimColor>ANTHROPIC_DEFAULT_HAIKU_MODEL: </Text>
              <Text>{envSettings.ANTHROPIC_DEFAULT_HAIKU_MODEL}</Text>
            </Text>
          )}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press ESC, 'q', or 'b' to go back</Text>
      </Box>
    </Box>
  );
}
