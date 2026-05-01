import { summonSage } from './registry.js';
import { VaultKeeper } from './auth.js';
import type { SageProfile, Sage } from './types.js';

export class Summoner {
  constructor(private auth: VaultKeeper) {}

  resolve(id: string): Sage | null {
    return summonSage(id, this.auth.get(id));
  }

  isConfigured(meta: SageProfile): boolean {
    if (!meta.needsKey) return true;
    return !!this.auth.get(meta.id);
  }
}
