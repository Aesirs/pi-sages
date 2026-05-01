import type { SearchResult, CrawlResult, ExtractResult } from './types.js';

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No results found.';
  return results
    .map((r, i) => {
      const score = r.score !== undefined ? ` (score: ${r.score.toFixed(3)})` : '';
      const content = r.content.slice(0, 400).replace(/\n+/g, ' ');
      const ellipsis = r.content.length > 400 ? '...' : '';
      return `[${i + 1}] ${r.title}${score}\nURL: ${r.url}\n${content}${ellipsis}`;
    })
    .join('\n\n');
}

export function formatCrawlResults(results: CrawlResult[]): string {
  if (results.length === 0) return 'No pages crawled.';
  return results
    .map((r, i) => {
      const preview = r.markdown ? r.markdown.slice(0, 600).replace(/\n+/g, ' ') : '';
      const ellipsis = r.markdown && r.markdown.length > 600 ? '...' : '';
      return `[${i + 1}] ${r.url}${r.statusCode ? ` (status: ${r.statusCode})` : ''}\n${preview}${ellipsis}`;
    })
    .join('\n\n');
}

export function formatExtractResults(results: ExtractResult[]): string {
  return results
    .map((r, i) => {
      const preview = r.content.slice(0, 800).replace(/\n+/g, ' ');
      const ellipsis = r.content.length > 800 ? '...' : '';
      const extras: string[] = [];
      if (r.images?.length) extras.push(`Images: ${r.images.length}`);
      if (r.favicon) extras.push(`Favicon: yes`);
      return `[${i + 1}] ${r.title ?? 'Untitled'}\nURL: ${r.url}\n${preview}${ellipsis}${extras.length ? '\n' + extras.join(', ') : ''}`;
    })
    .join('\n\n');
}
