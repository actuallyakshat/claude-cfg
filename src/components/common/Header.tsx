import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'Claude Manager', subtitle }: HeaderProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>
      {subtitle && (
        <Text dimColor>{subtitle}</Text>
      )}
      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(40)}</Text>
      </Box>
    </Box>
  );
}
