export type {
  SageArt,
  SageProfile,
  SearchResult,
  SearchOptions,
  CrawlOptions,
  CrawlResult,
  ExtractResult,
  Sage,
  SageContract,
} from './types.js';

export { Sage as SageBase } from './base.js';

export {
  FirecrawlSage,
  TavilySage,
  ExaSage,
  BraveSage,
  DuckDuckGoSage,
  type FirecrawlContract,
  type TavilyContract,
  type ExaContract,
  type BraveContract,
  type DuckDuckGoContract,
} from './providers/index.js';

export { VaultKeeper, maskKey } from './auth.js';
export { Summoner } from './resolver.js';
export { formatSearchResults, formatCrawlResults, formatExtractResults } from './formatter.js';
export { renderSearchCall, renderSearchResult } from './renderer.js';
export { assertSage, assertBound, assertAvailable } from './validator.js';
export { registerCommands } from './commands.js';
export {
  SAGE_CLASSES,
  ALL_SAGE_PROFILES,
  ALL_SAGE_IDS,
  summonSage,
  getSagesByArt,
  isValidSageId,
} from './registry.js';
export { SummonOrder } from './selector.js';
