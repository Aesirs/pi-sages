import {
  CredentialStore,
  SageResolver,
  ALL_SAGE_PROFILES,
  type SearchResult,
  type Sage,
} from '../../../src/index.js';

interface SageEntry {
  label: string;
  instance: Sage;
}

function dedupe(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

async function main(): Promise<void> {
  const [, , query, limitArg] = process.argv;

  if (!query) {
    console.error('Usage: multiSearch.ts "query" [limit-per-sage]');
    process.exit(1);
  }

  const limit = limitArg ? parseInt(limitArg, 10) : 3;

  const vault = new CredentialStore();
  const resolver = new SageResolver(vault);

  const active: SageEntry[] = [];
  for (const meta of ALL_SAGE_PROFILES) {
    if (!meta.capabilities.includes('search')) continue;
    if (!resolver.isConfigured(meta)) continue;
    const instance = resolver.resolve(meta.id);
    if (instance) active.push({ label: meta.label, instance });
  }

  if (active.length === 0) {
    console.error('No search sages are configured. Set at least one API key environment variable or use /sages.');
    process.exit(1);
  }

  console.log(`\nMulti Search — "${query}"`);
  console.log(`Sages: ${active.map((p) => p.label).join(', ')}\n`);

  const allResults: SearchResult[] = [];

  for (const { label, instance } of active) {
    try {
      const results = await instance.search({ query, limit });
      console.log(`✅ ${label}: ${results.length} results`);
      allResults.push(...results);
    } catch (err: unknown) {
      console.error(`❌ ${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const unique = dedupe(allResults);
  console.log(`\n${unique.length} unique results\n`);

  for (const [i, r] of unique.entries()) {
    console.log(`[${i + 1}] ${r.title}`);
    console.log(`    URL: ${r.url}`);
    console.log(`    ${r.content.slice(0, 300).replace(/\n+/g, ' ')}${r.content.length > 300 ? '...' : ''}`);
    if (r.score !== undefined) console.log(`    Score: ${r.score.toFixed(3)}`);
    console.log();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
