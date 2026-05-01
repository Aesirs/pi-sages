import { ALL_SAGE_PROFILES } from './index.js';
import { SageResolver } from './resolver.js';
import type { SageCapability, SageProfile } from './types.js';

export function assertSage(id: string, capability: SageCapability): SageProfile {
  if (!ALL_SAGE_PROFILES.some((m) => m.id === id)) {
    throw new Error(`Unknown sage "${id}". Valid: ${ALL_SAGE_PROFILES.map((m) => m.id).join(', ')}`);
  }
  const meta = ALL_SAGE_PROFILES.find((m) => m.id === id)!;
  if (!meta.capabilities.includes(capability)) {
    throw new Error(`Sage "${id}" does not support ${capability}. Capabilities: ${meta.capabilities.join(', ')}`);
  }
  return meta;
}

export function assertConfigured(resolver: SageResolver, meta: SageProfile): void {
  if (!resolver.isConfigured(meta)) {
    throw new Error(`Sage "${meta.id}" is not configured. Use /sages to add an API key.`);
  }
}

export function assertAvailable(meta: SageProfile | null, capability: SageCapability, fallbackMessage: string): SageProfile {
  if (!meta) {
    throw new Error(
      `No sage is available for ${capability}.\n${fallbackMessage}`,
    );
  }
  return meta;
}
