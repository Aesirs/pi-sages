import { resolveSage } from './registry.js';
import { CredentialStore } from './auth.js';
import type { SageProfile, Sage } from './types.js';

export class SageResolver {
  constructor(private auth: CredentialStore) {}

  resolve(id: string): Sage | null {
    return resolveSage(id, this.auth.get(id));
  }

  isConfigured(meta: SageProfile): boolean {
    if (!meta.needsKey) return true;
    return !!this.auth.get(meta.id);
  }
}
