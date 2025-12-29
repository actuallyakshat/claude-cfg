import { homedir } from 'os';
import { join } from 'path';

export const CLAUDE_DIR = join(homedir(), '.claude');
export const CLAUDE_SETTINGS_PATH = join(CLAUDE_DIR, 'settings.json');
export const MANAGER_CONFIGS_PATH = join(CLAUDE_DIR, 'manager-configs.json');
