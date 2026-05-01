/**
 * Unified types for all web search/crawl sages
 */

export type SageArt = 'search' | 'crawl' | 'extract';

export interface SageProfile {
  /** Machine identifier (lowercase, kebab-case) */
  readonly id: string;
  /** Human-readable label */
  readonly label: string;
  /** What this sage can do */
  readonly capabilities: readonly SageArt[];
  /** Whether an API key is required */
  readonly needsKey: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  raw?: unknown;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  includeImages?: boolean;
  includeAnswer?: boolean;
  searchDepth?: 'basic' | 'advanced';
  days?: number;
  filters?: Record<string, unknown>;
}

export interface CrawlOptions {
  url: string;
  limit?: number;
  excludePaths?: string[];
  includePaths?: string[];
  maxDepth?: number;
  scrapeOptions?: Record<string, unknown>;
}

export interface CrawlResult {
  url: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
  statusCode?: number;
}

export interface ExtractResult {
  url: string;
  title: string | null;
  content: string;
  images?: string[];
  favicon?: string;
}

export interface Sage {
  readonly metadata: SageProfile;

  search(options: SearchOptions): Promise<SearchResult[]>;
  crawl?(options: CrawlOptions): Promise<CrawlResult[]>;
  extract?(urls: string[], options?: Record<string, unknown>): Promise<ExtractResult[]>;
}

export interface SageContract {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}
