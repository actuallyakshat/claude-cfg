import React from 'react';
import { Box, Text } from 'ink';
import InkTextInput from 'ink-text-input';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  mask?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  mask,
}: TextInputProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="yellow">{label}: </Text>
      </Text>
      <Box>
        <Text color="gray">{' > '}</Text>
        <InkTextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          mask={mask}
        />
      </Box>
    </Box>
  );
}
