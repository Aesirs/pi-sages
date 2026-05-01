import { FirecrawlSage } from './providers/firecrawl.js';
import { TavilySage } from './providers/tavily.js';
import { ExaSage } from './providers/exa.js';
import { BraveSage } from './providers/brave.js';
import { DuckDuckGoSage } from './providers/duckduckgo.js';
import type { Sage, SageCapability, SageProfile } from './types.js';

/** All sage classes that can be instantiated. */
export const SAGE_CLASSES = [
  FirecrawlSage,
  TavilySage,
  ExaSage,
  BraveSage,
  DuckDuckGoSage,
] as const;

/** Profiles for every sage, read from static properties (no instantiation needed). */
export const ALL_SAGE_PROFILES: SageProfile[] = SAGE_CLASSES.map((cls) => cls.metadata);

/** All sage IDs. */
export const ALL_SAGE_IDS: string[] = ALL_SAGE_PROFILES.map((m) => m.id);

/** Instantiate a sage by ID with an API key. Returns null if the sage needs a key and none is provided. */
export function resolveSage(id: string, apiKey?: string): Sage | null {
  const cls = SAGE_CLASSES.find((c) => c.metadata.id === id);
  if (!cls) return null;

  if (cls.metadata.needsKey && !apiKey) return null;

  return new cls({ apiKey: apiKey ?? '' });
}

/** Get sage IDs that support a given capability. */
export function getSagesByCapability(capability: SageCapability): string[] {
  return SAGE_CLASSES
    .filter((cls) => cls.metadata.capabilities.includes(capability))
    .map((cls) => cls.metadata.id);
}

/** Check if a sage ID exists. */
export function isValidSageId(id: string): boolean {
  return SAGE_CLASSES.some((cls) => cls.metadata.id === id);
}
