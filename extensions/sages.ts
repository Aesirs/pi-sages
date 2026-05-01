import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Type } from 'typebox';
import {
  CredentialStore,
  SageResolver,
  SageSelector,
  formatSearchResults,
  formatCrawlResults,
  formatExtractResults,
  renderSearchCall,
  renderSearchResult,
  assertAvailable,
  registerCommands,
  ALL_SAGE_PROFILES,
  type Sage,
} from '../src/index.js';

export default function sagesExtension(pi: ExtensionAPI) {
  const vault = new CredentialStore();
  const resolver = new SageResolver(vault);
  const selector = new SageSelector(resolver);

  // ─── Tools ─────────────────────────────────────────────────────────────────

  pi.registerTool({
    name: 'search',
    label: 'Search',
    description:
      'Search the web for current information, documentation, facts, or news. Returns titles, URLs, and content snippets. The highest-priority configured sage is selected automatically.',
    promptSnippet: 'Search the web for current information, documentation, facts, or news',
    promptGuidelines: [
      'Use search when the user asks about recent events, technologies, or facts that may not be in training data.',
      'Use search when the user asks to find documentation, tutorials, or external resources.',
    ],
    parameters: Type.Object({
      query: Type.String({ description: 'Search query string' }),
      limit: Type.Optional(Type.Number({ description: 'Maximum results (default: 5)', default: 5 })),
    }),
    renderCall: renderSearchCall,
    renderResult: renderSearchResult,
    async execute(_toolCallId, params, _signal, onUpdate) {
      const selected = selector.select('search');
      assertAvailable(selected?.meta ?? null, 'search', selector.buildAvailabilityMessage('search'));
      const { meta, id } = selected!;

      onUpdate?.({ content: [{ type: 'text', text: `Using ${meta.label} to search for "${params.query}"...` }], details: {} });

      const sage = resolver.resolve(id)!;
      const results = await sage.search({ query: params.query, limit: params.limit ?? 5 });

      return {
        content: [{ type: 'text', text: formatSearchResults(results) }],
        details: { sage: id, query: params.query, results },
      };
    },
  });

  pi.registerTool({
    name: 'crawl',
    label: 'Crawl',
    description: 'Crawl a website to extract full page content as markdown and metadata. The highest-priority configured sage is selected automatically.',
    promptSnippet: 'Crawl a website to extract full page content as markdown',
    promptGuidelines: [
      'Use crawl when the user asks to extract content from a specific URL or website.',
      'Use crawl to read documentation pages, blog posts, or articles that are too large for a simple search snippet.',
    ],
    parameters: Type.Object({
      url: Type.String({ description: 'URL to crawl' }),
      limit: Type.Optional(Type.Number({ description: 'Max pages (default: 5)', default: 5 })),
    }),
    async execute(_toolCallId, params, _signal, onUpdate) {
      const selected = selector.select('crawl');
      assertAvailable(selected?.meta ?? null, 'crawl', selector.buildAvailabilityMessage('crawl'));
      const { meta, id } = selected!;

      onUpdate?.({ content: [{ type: 'text', text: `Crawling ${params.url} with ${meta.label}...` }], details: {} });

      const sage = resolver.resolve(id)!;
      const results = await sage.crawl!({ url: params.url, limit: params.limit ?? 5 });

      return {
        content: [{ type: 'text', text: formatCrawlResults(results) }],
        details: { sage: id, url: params.url, results },
      };
    },
  });

  pi.registerTool({
    name: 'extract',
    label: 'Extract',
    description:
      'Extract full content from specific URLs as markdown or text. Returns title, content, and images for each page. More precise than crawl for known URLs. The highest-priority configured sage is selected automatically.',
    promptSnippet: 'Extract full content from specific URLs as markdown or text',
    promptGuidelines: [
      'Use extract when the user provides specific URLs and wants their full content.',
      'Use extract instead of crawl when you already know the exact pages to read.',
      'extract supports up to 20 URLs in a single call.',
    ],
    parameters: Type.Object({
      urls: Type.Optional(
        Type.Union([
          Type.String({ description: 'Single URL or list of URLs to extract' }),
          Type.Array(Type.String({ description: 'URL to extract' }), { description: 'List of URLs' }),
        ]),
      ),
      url: Type.Optional(Type.String({ description: 'Single URL to extract (alternative to urls)' })),
      extractDepth: Type.Optional(
        Type.String({ description: 'Depth: basic or advanced. Default: basic.', default: 'basic' }),
      ),
      format: Type.Optional(
        Type.String({ description: 'Format: markdown or text. Default: markdown.', default: 'markdown' }),
      ),
    }),
    async execute(_toolCallId, params, _signal, onUpdate) {
      const selected = selector.select('extract');
      assertAvailable(selected?.meta ?? null, 'extract', selector.buildAvailabilityMessage('extract'));
      const { meta, id } = selected!;

      const rawUrls = params.urls ?? params.url;
      if (!rawUrls) throw new Error('At least one URL is required.');
      const urls = Array.isArray(rawUrls) ? rawUrls : [rawUrls];

      onUpdate?.({ content: [{ type: 'text', text: `Extracting ${urls.length} URL(s) via ${meta.label}...` }], details: {} });

      const sage = resolver.resolve(id)!;
      const results = await sage.extract!(urls, {
        extractDepth: (params.extractDepth as 'basic' | 'advanced') ?? 'basic',
        format: (params.format as 'markdown' | 'text') ?? 'markdown',
      });

      return {
        content: [{ type: 'text', text: formatExtractResults(results) }],
        details: { sage: id, urls, results },
      };
    },
  });

  pi.registerTool({
    name: 'multiSearch',
    label: 'Multi Search',
    description: 'Search across all configured sages simultaneously and return deduplicated results.',
    promptSnippet: 'Run the same query across multiple search engines and merge results',
    promptGuidelines: [
      'Use multiSearch when the user needs comprehensive research from multiple sources.',
      'Results are deduplicated by URL across all sages.',
    ],
    parameters: Type.Object({
      query: Type.String({ description: 'Search query string' }),
      limit: Type.Optional(Type.Number({ description: 'Max results per sage (default: 3)', default: 3 })),
    }),
    async execute(_toolCallId, params, _signal, onUpdate) {
      const limit = params.limit ?? 3;
      const allResults: import('../src/types.js').SearchResult[] = [];
      const active: { label: string; instance: Sage }[] = [];

      for (const meta of ALL_SAGE_PROFILES) {
        if (!meta.capabilities.includes('search')) continue;
        const key = vault.get(meta.id);
        if (!meta.needsKey || key) {
          const instance = resolver.resolve(meta.id);
          if (instance) active.push({ label: meta.label, instance });
        }
      }

      if (active.length === 0) {
        throw new Error('No search sages are configured. Use /sages to add API keys.');
      }

      onUpdate?.({ content: [{ type: 'text', text: `Searching with ${active.length} sages for "${params.query}"...` }], details: {} });

      for (const { label, instance } of active) {
        try {
          const results = await instance.search({ query: params.query, limit });
          allResults.push(...results);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          onUpdate?.({ content: [{ type: 'text', text: `🟡 ${label}: ${msg}` }], details: {} });
        }
      }

      const seen = new Set<string>();
      const unique = allResults.filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });

      return {
        content: [{ type: 'text', text: formatSearchResults(unique) }],
        details: { query: params.query, sages: active.map((p) => p.label), results: unique },
      };
    },
  });

  // ─── Commands ──────────────────────────────────────────────────────────────
  registerCommands(pi, vault, selector);
}
