import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { getAgentDir } from '@mariozechner/pi-coding-agent';

export interface SageConfig {
  apiKeys?: Record<string, string>;
  priority?: string[];
}

const CONFIG_FILE_NAME = 'sages.json';

export class SageConfigStore {
  private configPath: string;

  constructor() {
    this.configPath = join(getAgentDir(), CONFIG_FILE_NAME);
  }

  private ensureDir(): void {
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }

  private load(): SageConfig {
    if (!existsSync(this.configPath)) {
      return {};
    }
    try {
      const raw = readFileSync(this.configPath, 'utf-8');
      return JSON.parse(raw) as SageConfig;
    } catch {
      return {};
    }
  }

  private save(config: SageConfig): void {
    this.ensureDir();
    writeFileSync(this.configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  }

  getApiKey(name: string): string | undefined {
    return this.load().apiKeys?.[name];
  }

  setApiKey(name: string, key: string): void {
    const config = this.load();
    if (!config.apiKeys) config.apiKeys = {};
    config.apiKeys[name] = key;
    this.save(config);
  }

  removeApiKey(name: string): void {
    const config = this.load();
    if (config.apiKeys) {
      delete config.apiKeys[name];
      this.save(config);
    }
  }

  hasApiKey(name: string): boolean {
    return !!this.load().apiKeys?.[name];
  }

  getPriority(): string[] | undefined {
    return this.load().priority;
  }

  setPriority(order: string[]): void {
    const config = this.load();
    config.priority = order;
    this.save(config);
  }
}
