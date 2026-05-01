import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SearchOptions, SearchResult, SageProfile } from '../types.js';
import { Sage } from '../base.js';

export interface DuckDuckGoContract {
  baseUrl?: string;
}

export class DuckDuckGoSage extends Sage {
  static readonly metadata: SageProfile = {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    capabilities: ['search'],
    needsKey: false,
  };

  private baseUrl: string;

  constructor(config?: DuckDuckGoContract) {
    super();
    this.baseUrl = config?.baseUrl ?? 'https://html.duckduckgo.com/html';
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    this.validateSearchOptions(options);

    const response = await axios.get<string>(this.baseUrl, {
      params: { q: options.query },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];
    const limit = options.limit ?? 10;

    $('.result').each((_index, element) => {
      if (results.length >= limit) return false;

      const $el = $(element);
      const titleAnchor = $el.find('.result__a').first();
      const title = titleAnchor.text().trim();
      const href = titleAnchor.attr('href');
      const snippet = $el.find('.result__snippet').first().text().trim();

      if (title && href) {
        results.push({
          title,
          url: this.normalizeUrl(href),
          content: snippet,
          raw: { title, href, snippet },
        });
      }

      return undefined;
    });

    return results;
  }

  private normalizeUrl(href: string): string {
    if (href.startsWith('http')) return href;
    if (href.startsWith('//')) return `https:${href}`;
    if (href.startsWith('/')) return `https://duckduckgo.com${href}`;
    return href;
  }
}
