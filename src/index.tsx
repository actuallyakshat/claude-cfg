#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { ensureDefaultConfigs } from './services/config-store.js';

// Auto-detect and import existing configs on startup
ensureDefaultConfigs();

const { waitUntilExit } = render(
  <App
    onExit={() => {
      process.exit(0);
    }}
  />
);

waitUntilExit().then(() => {
  process.exit(0);
});
