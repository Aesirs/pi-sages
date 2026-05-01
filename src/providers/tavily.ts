import { tavily, type TavilyClient } from '@tavily/core';
import type { SearchOptions, SearchResult, CrawlOptions, CrawlResult, SageProfile, ExtractResult } from '../types.js';
import { Sage } from '../base.js';

export interface TavilyConfig {
  apiKey: string;
}

export class TavilySage extends Sage {
  static readonly metadata: SageProfile = {
    id: 'tavily',
    label: 'Tavily',
    capabilities: ['search', 'crawl', 'extract'],
    needsKey: true,
  };

  private client: TavilyClient;

  constructor(config: TavilyConfig) {
    super();
    this.client = tavily({ apiKey: config.apiKey });
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    this.validateSearchOptions(options);

    const response = await this.client.search(options.query, {
      maxResults: options.limit ?? 5,
      searchDepth: options.searchDepth ?? 'basic',
      includeAnswer: options.includeAnswer ?? false,
      includeImages: options.includeImages ?? false,
      includeRawContent: false,
      days: options.days,
    });

    return (response.results ?? []).map((item) => ({
      title: item.title ?? '',
      url: item.url ?? '',
      content: item.content ?? '',
      score: typeof item.score === 'number' ? item.score : undefined,
      raw: item,
    }));
  }

  async crawl(options: CrawlOptions): Promise<CrawlResult[]> {
    this.validateCrawlOptions(options);

    const response = await this.client.crawl(options.url, {
      limit: options.limit,
      maxDepth: options.maxDepth,
      excludePaths: options.excludePaths,
      format: 'markdown',
    });

    return (response.results ?? []).map((item) => ({
      url: item.url,
      markdown: item.rawContent ?? '',
      metadata: { favicon: item.favicon },
    }));
  }

  async extract(urls: string[], options?: Record<string, unknown>): Promise<ExtractResult[]> {
    if (urls.length === 0) throw new Error('At least one URL is required for extraction');

    const response = await this.client.extract(urls, {
      extractDepth: (options?.extractDepth as 'basic' | 'advanced') ?? 'basic',
      format: (options?.format as 'markdown' | 'text') ?? 'markdown',
    });

    return (response.results ?? []).map((item) => ({
      url: item.url,
      title: item.title,
      content: item.rawContent ?? '',
      images: item.images,
      favicon: item.favicon,
    }));
  }
}
