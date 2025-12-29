import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { CLAUDE_SETTINGS_PATH, CLAUDE_DIR } from './paths.js';
import type { ClaudeSettings, ClaudeEnvSettings } from '../types/index.js';

function ensureDir(): void {
  if (!existsSync(CLAUDE_DIR)) {
    mkdirSync(CLAUDE_DIR, { recursive: true });
  }
}

export function loadClaudeSettings(): ClaudeSettings {
  try {
    if (!existsSync(CLAUDE_SETTINGS_PATH)) {
      return {};
    }
    const content = readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8');
    return JSON.parse(content) as ClaudeSettings;
  } catch {
    return {};
  }
}

export function saveClaudeSettings(settings: ClaudeSettings): void {
  ensureDir();
  writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export function getEnvSettings(): ClaudeEnvSettings {
  const settings = loadClaudeSettings();
  return settings.env || {};
}

export function setEnvSettings(env: ClaudeEnvSettings): void {
  const settings = loadClaudeSettings();
  settings.env = env;
  saveClaudeSettings(settings);
}

export function clearEnvSettings(): void {
  const settings = loadClaudeSettings();
  delete settings.env;
  saveClaudeSettings(settings);
}

export function detectCurrentProvider(): {
  provider: string;
  baseUrl?: string;
} {
  const env = getEnvSettings();

  if (!env.ANTHROPIC_BASE_URL && env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic' };
  }

  if (env.ANTHROPIC_BASE_URL === 'https://openrouter.ai/api') {
    return { provider: 'openrouter', baseUrl: env.ANTHROPIC_BASE_URL };
  }

  if (env.ANTHROPIC_BASE_URL === 'https://api.z.ai/api/anthropic') {
    return { provider: 'zai', baseUrl: env.ANTHROPIC_BASE_URL };
  }

  if (env.ANTHROPIC_BASE_URL) {
    return { provider: 'custom', baseUrl: env.ANTHROPIC_BASE_URL };
  }

  return { provider: 'none' };
}
