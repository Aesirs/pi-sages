import type { SageProfile } from './types.js';
import { SagesStorage } from './storage.js';

export function maskKey(key: string): string {
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export class VaultKeeper {
  private storage: SagesStorage;

  constructor() {
    this.storage = new SagesStorage();
  }

  get(name: string): string | undefined {
    if (name === 'duckduckgo') return 'none';
    const key = this.storage.getApiKey(name);
    if (key) return key;
    return process.env[`${name.toUpperCase()}_API_KEY`];
  }

  /** Return the masked stored key, or undefined if none. */
  peek(name: string): string | undefined {
    const key = this.storage.getApiKey(name);
    return key ? maskKey(key) : undefined;
  }

  set(name: string, key: string): void {
    this.storage.setApiKey(name, key);
  }

  has(name: string): boolean {
    return this.storage.hasApiKey(name);
  }

  remove(name: string): void {
    this.storage.removeApiKey(name);
  }

  status(meta: SageProfile): { configured: boolean; source: 'stored' | 'env' | 'none' } {
    if (!meta.needsKey) return { configured: true, source: 'env' };
    const key = this.storage.getApiKey(meta.id);
    if (key) return { configured: true, source: 'stored' };
    if (process.env[`${meta.id.toUpperCase()}_API_KEY`]) return { configured: true, source: 'env' };
    return { configured: false, source: 'none' };
  }
}
