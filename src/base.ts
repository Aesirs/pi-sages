import type { SearchOptions, SearchResult, CrawlOptions, CrawlResult, SageProfile, ExtractResult } from './types.js';

export abstract class Sage implements Sage {
  static readonly metadata: SageProfile;

  get metadata(): SageProfile {
    return (this.constructor as typeof Sage).metadata;
  }

  abstract search(options: SearchOptions): Promise<SearchResult[]>;

  async crawl(_options: CrawlOptions): Promise<CrawlResult[]> {
    throw new Error(`Crawl is not supported by ${this.metadata.label}`);
  }

  async extract(_urls: string[], _options?: Record<string, unknown>): Promise<ExtractResult[]> {
    throw new Error(`Extract is not supported by ${this.metadata.label}`);
  }

  protected validateSearchOptions(options: SearchOptions): void {
    if (!options.query || options.query.trim().length === 0) {
      throw new Error('Search query is required');
    }
  }

  protected validateCrawlOptions(options: CrawlOptions): void {
    if (!options.url || options.url.trim().length === 0) {
      throw new Error('Crawl URL is required');
    }
  }
}
