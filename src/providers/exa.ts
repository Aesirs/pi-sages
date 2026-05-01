import { Exa } from 'exa-js';
import type { SearchOptions, SearchResult, CrawlOptions, CrawlResult, SageProfile, ExtractResult } from '../types.js';
import { Sage } from '../base.js';

export interface ExaConfig {
  apiKey: string;
}

export class ExaSage extends Sage {
  static readonly metadata: SageProfile = {
    id: 'exa',
    label: 'Exa',
    capabilities: ['search', 'crawl', 'extract'],
    needsKey: true,
  };

  private client: Exa;

  constructor(config: ExaConfig) {
    super();
    this.client = new Exa(config.apiKey);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    this.validateSearchOptions(options);

    const result = await this.client.searchAndContents(options.query, {
      numResults: options.limit ?? 5,
      text: true,
      highlights: true,
    });

    return (result.results ?? []).map((item) => ({
      title: item.title ?? '',
      url: item.url ?? '',
      content: (item.text ?? item.highlights?.[0] ?? '') as string,
      score: typeof item.score === 'number' ? item.score : undefined,
      raw: item,
    }));
  }

  async crawl(options: CrawlOptions): Promise<CrawlResult[]> {
    this.validateCrawlOptions(options);

    const result = await this.client.getContents([options.url], {
      text: true,
      highlights: true,
    });

    return (result.results ?? []).map((item) => ({
      url: item.url ?? options.url,
      markdown: (item.text ?? '') as string,
      metadata: { title: item.title },
    }));
  }

  async extract(urls: string[], _options?: Record<string, unknown>): Promise<ExtractResult[]> {
    if (urls.length === 0) throw new Error('At least one URL is required for extraction');

    const result = await this.client.getContents(urls, { text: true });

    return (result.results ?? []).map((item) => ({
      url: item.url ?? '',
      title: item.title ?? null,
      content: (item.text ?? '') as string,
    }));
  }
}
