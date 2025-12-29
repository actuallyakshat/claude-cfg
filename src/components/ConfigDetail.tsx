import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from './common/Header.js';
import { Select, type SelectItem } from './common/Select.js';
import {
  getConfigById,
  deleteConfig,
  setActiveConfigId,
  getActiveConfig,
  ANTHROPIC_OAUTH_CONFIG_ID,
} from '../services/config-store.js';
import { setEnvSettings, clearEnvSettings } from '../services/claude-settings.js';
import { getProvider } from '../providers/index.js';
import { EditConfig } from './EditConfig.js';

interface ConfigDetailProps {
  configId: string;
  onBack: () => void;
}

type Action = 'activate' | 'edit' | 'delete' | 'back';

export function ConfigDetail({ configId, onBack }: ConfigDetailProps): React.ReactElement {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const config = getConfigById(configId);
  const activeConfig = getActiveConfig();
  const isActive = activeConfig?.id === configId;

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      if (confirmDelete) {
        setConfirmDelete(false);
      } else if (isEditing) {
        setIsEditing(false);
      } else {
        onBack();
      }
    }
  });

  // Show edit mode
  if (isEditing) {
    return (
      <EditConfig
        configId={configId}
        onBack={() => setIsEditing(false)}
        onComplete={() => {
          setIsEditing(false);
          setMessage({ type: 'success', text: 'Configuration updated successfully!' });
        }}
      />
    );
  }

  if (!config) {
    return (
      <Box flexDirection="column">
        <Header title="Config Details" />
        <Text color="red">Configuration not found.</Text>
        <Box marginTop={1}>
          <Text dimColor>Press ESC or 'q' to go back</Text>
        </Box>
      </Box>
    );
  }

  const provider = getProvider(config.provider);

  const maskSecret = (value: string | undefined): string => {
    if (!value) return '(not set)';
    if (value.length <= 8) return '*'.repeat(value.length);
    return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
  };

  const isOAuthConfig = config.id === ANTHROPIC_OAUTH_CONFIG_ID;

  const handleActivate = () => {
    try {
      if (isOAuthConfig) {
        // Clear env to use OAuth (Keychain credentials)
        clearEnvSettings();
      } else {
        const envSettings = provider.buildEnvSettings(config.credentials, config.modelOverrides);
        setEnvSettings(envSettings);
      }
      setActiveConfigId(config.id);
      setMessage({ type: 'success', text: `Activated "${config.name}"! Restart Claude Code to apply changes.` });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to activate: ${err}` });
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      deleteConfig(config.id);
      setMessage({ type: 'success', text: 'Configuration deleted.' });
      setTimeout(() => onBack(), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to delete: ${err}` });
    }
  };

  if (confirmDelete) {
    const deleteItems: SelectItem<'yes' | 'no'>[] = [
      { label: 'No, keep it', value: 'no' },
      { label: 'Yes, delete it', value: 'yes' },
    ];

    return (
      <Box flexDirection="column">
        <Header title="Confirm Delete" />
        <Text color="yellow">Are you sure you want to delete "{config.name}"?</Text>
        <Box marginTop={1}>
          <Select
            items={deleteItems}
            onSelect={(item) => {
              if (item.value === 'yes') {
                handleDelete();
              } else {
                setConfirmDelete(false);
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  const items: SelectItem<Action>[] = [
    { label: isActive ? 'Re-apply Configuration' : 'Activate Configuration', value: 'activate' },
  ];

  // Don't allow editing or deleting the OAuth config
  if (!isOAuthConfig) {
    items.push({ label: 'Edit Configuration', value: 'edit' });
    items.push({ label: 'Delete Configuration', value: 'delete' });
  }

  items.push({ label: '← Back', value: 'back' });

  const handleSelect = (item: SelectItem<Action>) => {
    switch (item.value) {
      case 'activate':
        handleActivate();
        break;
      case 'edit':
        setIsEditing(true);
        break;
      case 'delete':
        handleDelete();
        break;
      case 'back':
        onBack();
        break;
    }
  };

  return (
    <Box flexDirection="column">
      <Header title="Config Details" subtitle={config.name} />

      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text dimColor>Provider: </Text>
          <Text bold>{provider.name}</Text>
        </Text>
        <Text>
          <Text dimColor>Status: </Text>
          <Text color={isActive ? 'green' : 'gray'}>{isActive ? 'Active' : 'Inactive'}</Text>
        </Text>
        <Text>
          <Text dimColor>Created: </Text>
          <Text>{new Date(config.createdAt).toLocaleString()}</Text>
        </Text>
        {config.lastUsed && (
          <Text>
            <Text dimColor>Last Used: </Text>
            <Text>{new Date(config.lastUsed).toLocaleString()}</Text>
          </Text>
        )}
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">Credentials:</Text>
        <Box flexDirection="column" marginLeft={2}>
          {isOAuthConfig ? (
            <Text>
              <Text dimColor>Auth: </Text>
              <Text color="green">OAuth (macOS Keychain)</Text>
            </Text>
          ) : (
            <>
              {config.credentials.apiKey && (
                <Text>
                  <Text dimColor>API Key: </Text>
                  <Text>{maskSecret(config.credentials.apiKey)}</Text>
                </Text>
              )}
              {config.credentials.authToken && (
                <Text>
                  <Text dimColor>Auth Token: </Text>
                  <Text>{maskSecret(config.credentials.authToken)}</Text>
                </Text>
              )}
              {config.credentials.baseUrl && (
                <Text>
                  <Text dimColor>Base URL: </Text>
                  <Text>{config.credentials.baseUrl}</Text>
                </Text>
              )}
            </>
          )}
        </Box>
      </Box>

      {config.modelOverrides && Object.keys(config.modelOverrides).length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">Model Overrides:</Text>
          <Box flexDirection="column" marginLeft={2}>
            {config.modelOverrides.sonnet && (
              <Text>
                <Text dimColor>Sonnet: </Text>
                <Text>{config.modelOverrides.sonnet}</Text>
              </Text>
            )}
            {config.modelOverrides.opus && (
              <Text>
                <Text dimColor>Opus: </Text>
                <Text>{config.modelOverrides.opus}</Text>
              </Text>
            )}
            {config.modelOverrides.haiku && (
              <Text>
                <Text dimColor>Haiku: </Text>
                <Text>{config.modelOverrides.haiku}</Text>
              </Text>
            )}
          </Box>
        </Box>
      )}

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
