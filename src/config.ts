import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.chesh', 'config.json');

export interface Config {
  api: {
    baseUrl: string;
    token?: string;
    timeout: number;
  };
  cache: {
    enabled: boolean;
    path: string;
    duration: number;
  };
  theme: string;
  retries: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
}

const DEFAULT_CONFIG: Config = {
  api: {
    baseUrl: 'https://lichess.org',
    timeout: 30000,
  },
  cache: {
    enabled: true,
    path: path.join(os.homedir(), '.chesh', 'cache'),
    duration: 86400000,
  },
  theme: 'default',
  retries: {
    maxAttempts: 3,
    backoffMultiplier: 2,
  },
};

export async function loadConfig(): Promise<Config> {
  try {
    const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
  } catch {
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const configDir = path.dirname(CONFIG_PATH);
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getToken(): string | undefined {
  return process.env['LICHESS_TOKEN'];
}
