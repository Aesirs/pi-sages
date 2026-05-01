import { ALL_SAGE_PROFILES } from './index.js';
import { Summoner } from './resolver.js';
import type { SageArt, SageProfile } from './types.js';

export function assertSage(id: string, art: SageArt): SageProfile {
  if (!ALL_SAGE_PROFILES.some((m) => m.id === id)) {
    throw new Error(`Unknown sage "${id}". Valid: ${ALL_SAGE_PROFILES.map((m) => m.id).join(', ')}`);
  }
  const meta = ALL_SAGE_PROFILES.find((m) => m.id === id)!;
  if (!meta.capabilities.includes(art)) {
    throw new Error(`Sage "${id}" does not practice ${art}. Arts: ${meta.capabilities.join(', ')}`);
  }
  return meta;
}

export function assertBound(summoner: Summoner, meta: SageProfile): void {
  if (!summoner.isConfigured(meta)) {
    throw new Error(`Sage "${meta.id}" is not bound. Use /sages to add an API key.`);
  }
}

export function assertAvailable(meta: SageProfile | null, art: SageArt, fallbackMessage: string): SageProfile {
  if (!meta) {
    throw new Error(
      `No sage is available for ${art}.\n${fallbackMessage}`,
    );
  }
  return meta;
}
