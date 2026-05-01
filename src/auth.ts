import { AuthStorage } from '@mariozechner/pi-coding-agent';
import type { SageProfile } from './types.js';

const AUTH_PREFIX = 'sage-';

export function maskKey(key: string): string {
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export class VaultKeeper {
  private storage: AuthStorage;

  constructor() {
    this.storage = AuthStorage.create();
  }

  private keyName(name: string): string {
    return `${AUTH_PREFIX}${name}`;
  }

  get(name: string): string | undefined {
    if (name === 'duckduckgo') return 'none';
    const cred = this.storage.get(this.keyName(name));
    if (cred?.type === 'api_key') return cred.key;
    return process.env[`${name.toUpperCase()}_API_KEY`];
  }

  /** Return the masked stored key, or undefined if none. */
  peek(name: string): string | undefined {
    const cred = this.storage.get(this.keyName(name));
    return cred?.type === 'api_key' ? maskKey(cred.key) : undefined;
  }

  set(name: string, key: string): void {
    this.storage.set(this.keyName(name), { type: 'api_key', key });
  }

  has(name: string): boolean {
    return this.storage.has(this.keyName(name));
  }

  remove(name: string): void {
    this.storage.remove(this.keyName(name));
  }

  status(meta: SageProfile): { configured: boolean; source: 'auth' | 'env' | 'none' } {
    if (!meta.needsKey) return { configured: true, source: 'env' };
    const cred = this.storage.get(this.keyName(meta.id));
    if (cred?.type === 'api_key') return { configured: true, source: 'auth' };
    if (process.env[`${meta.id.toUpperCase()}_API_KEY`]) return { configured: true, source: 'env' };
    return { configured: false, source: 'none' };
  }
}
