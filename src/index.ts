export type {
  SageCapability,
  SageProfile,
  SearchResult,
  SearchOptions,
  CrawlOptions,
  CrawlResult,
  ExtractResult,
  Sage,
  SageConfig,
} from './types.js';

export { Sage as SageBase } from './base.js';

export {
  FirecrawlSage,
  TavilySage,
  ExaSage,
  BraveSage,
  DuckDuckGoSage,
  type FirecrawlConfig,
  type TavilyConfig,
  type ExaConfig,
  type BraveConfig,
  type DuckDuckGoConfig,
} from './providers/index.js';

export { CredentialStore, maskKey } from './auth.js';
export { SageConfigStore } from './storage.js';
export { SageResolver } from './resolver.js';
export { formatSearchResults, formatCrawlResults, formatExtractResults } from './formatter.js';
export { renderSearchCall, renderSearchResult } from './renderer.js';
export { assertSage, assertConfigured, assertAvailable } from './validator.js';
export { registerCommands } from './commands.js';
export {
  SAGE_CLASSES,
  ALL_SAGE_PROFILES,
  ALL_SAGE_IDS,
  resolveSage,
  getSagesByCapability,
  isValidSageId,
} from './registry.js';
export { SageSelector } from './selector.js';
