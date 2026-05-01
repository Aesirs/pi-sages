import { BraveSearch } from 'brave-search';
import type { SearchOptions, SearchResult, SageProfile } from '../types.js';
import { Sage } from '../base.js';

export interface BraveConfig {
  apiKey: string;
}

export class BraveSage extends Sage {
  static readonly metadata: SageProfile = {
    id: 'brave',
    label: 'Brave Search',
    capabilities: ['search'],
    needsKey: true,
  };

  private client: BraveSearch;

  constructor(config: BraveConfig) {
    super();
    this.client = new BraveSearch(config.apiKey);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    this.validateSearchOptions(options);

    const webResults = await this.client.webSearch(options.query, {
      count: options.limit ?? 10,
      offset: 0,
    });

    const results = webResults.web?.results ?? [];

    return results.map((item) => ({
      title: item.title ?? '',
      url: item.url ?? '',
      content: item.description ?? '',
      score: undefined,
      raw: item,
    }));
  }
}
