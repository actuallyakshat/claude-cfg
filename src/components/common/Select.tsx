import React from 'react';
import SelectInput from 'ink-select-input';

export interface SelectItem<T = string> {
  label: string;
  value: T;
}

interface SelectProps<T = string> {
  items: SelectItem<T>[];
  onSelect: (item: SelectItem<T>) => void;
}

export function Select<T = string>({ items, onSelect }: SelectProps<T>): React.ReactElement {
  return (
    <SelectInput
      items={items}
      onSelect={onSelect}
    />
  );
}
