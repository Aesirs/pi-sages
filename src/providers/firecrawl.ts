import Firecrawl from '@mendable/firecrawl-js';
import type { SearchOptions, SearchResult, CrawlOptions, CrawlResult, SageProfile, ExtractResult } from '../types.js';
import { Sage } from '../base.js';

export interface FirecrawlContract {
  apiKey: string;
  apiUrl?: string;
}

export class FirecrawlSage extends Sage {
  static readonly metadata: SageProfile = {
    id: 'firecrawl',
    label: 'Firecrawl',
    capabilities: ['search', 'crawl', 'extract'],
    needsKey: true,
  };

  private client: Firecrawl;

  constructor(config: FirecrawlContract) {
    super();
    this.client = new Firecrawl({ apiKey: config.apiKey, apiUrl: config.apiUrl ?? null });
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    this.validateSearchOptions(options);

    const data = await this.client.search(options.query, {
      limit: options.limit ?? 5,
    });

    const web = data.web ?? [];
    return web.map((item) => ({
      title: ('title' in item ? item.title : undefined) ?? '',
      url: ('url' in item ? item.url : undefined) ?? '',
      content: ('description' in item ? item.description : undefined) ?? ('markdown' in item ? item.markdown : undefined) ?? '',
      raw: item,
    }));
  }

  async crawl(options: CrawlOptions): Promise<CrawlResult[]> {
    this.validateCrawlOptions(options);

    const job = await this.client.crawl(options.url, {
      limit: options.limit ?? 10,
      excludePaths: options.excludePaths ?? null,
      includePaths: options.includePaths ?? null,
      maxDiscoveryDepth: options.maxDepth ?? null,
      scrapeOptions: options.scrapeOptions as Record<string, unknown> | null,
    });

    return (job.data ?? []).map((item) => ({
      url: item.metadata?.sourceURL ?? item.metadata?.url ?? options.url,
      markdown: item.markdown ?? '',
      html: item.html ?? '',
      metadata: item.metadata ?? {},
      statusCode: item.metadata?.statusCode as number | undefined,
    }));
  }

  async extract(urls: string[], _options?: Record<string, unknown>): Promise<ExtractResult[]> {
    if (urls.length === 0) throw new Error('At least one URL is required for extraction');

    if (urls.length === 1) {
      const doc = await this.client.scrape(urls[0]!, { formats: ['markdown'] });
      return [{
        url: urls[0]!,
        title: doc.metadata?.title ?? null,
        content: doc.markdown ?? doc.html ?? '',
        images: doc.images,
      }];
    }

    const job = await this.client.batchScrape(urls, {
      options: { formats: ['markdown'] },
    });

    return (job.data ?? []).map((doc) => ({
      url: doc.metadata?.sourceURL ?? doc.metadata?.url ?? '',
      title: doc.metadata?.title ?? null,
      content: doc.markdown ?? doc.html ?? '',
      images: doc.images,
    }));
  }
}
