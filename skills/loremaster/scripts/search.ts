import {
  CredentialStore,
  SageResolver,
  SageSelector,
  ALL_SAGE_PROFILES,
  type SearchResult,
  type SageProfile,
} from '../../../src/index.js';

async function main(): Promise<void> {
  const [, , sageArg, query, limitArg] = process.argv;

  if (!query) {
    console.error('Usage: search.ts [sage] "query" [limit]');
    console.error('If sage is omitted, the highest-priority configured sage is used.');
    process.exit(1);
  }

  const vault = new CredentialStore();
  const resolver = new SageResolver(vault);
  const selector = new SageSelector(resolver);

  let sageName: string;
  let actualQuery = query;
  let limitStr = limitArg;

  const allIds = ALL_SAGE_PROFILES.map((m) => m.id);
  if (allIds.includes(sageArg)) {
    sageName = sageArg;
  } else {
    sageName = 'auto';
    actualQuery = sageArg;
    limitStr = query;
  }

  const limit = limitStr ? parseInt(limitStr, 10) : 5;

  let selectedId: string;
  let selectedMeta: SageProfile;

  if (sageName === 'auto') {
    const selected = selector.select('search');
    if (!selected) {
      console.error('No search sages are configured.');
      console.error(selector.buildAvailabilityMessage('search'));
      process.exit(1);
    }
    selectedId = selected.id;
    selectedMeta = selected.meta;
    console.log(`Using sage: ${selectedMeta.label} (${selectedId})`);
  } else {
    selectedId = sageName;
    const meta = ALL_SAGE_PROFILES.find((m) => m.id === selectedId);
    if (!meta || !meta.capabilities.includes('search')) {
      console.error(`Sage "${selectedId}" does not support search.`);
      process.exit(1);
    }
    if (!resolver.isConfigured(meta)) {
      console.error(`Sage "${selectedId}" is not configured.`);
      process.exit(1);
    }
    selectedMeta = meta;
  }

  if (selectedMeta.needsKey) {
    const key = vault.get(selectedId);
    if (!key) {
      console.error(
        `No API key found for ${selectedMeta.label}. ` +
          `Set ${selectedId.toUpperCase()}_API_KEY env var or store it via /sages.`,
      );
      process.exit(1);
    }
  }

  const sage = resolver.resolve(selectedId);
  if (!sage) {
    console.error(`Failed to resolve sage: ${selectedId}`);
    process.exit(1);
  }

  const results: SearchResult[] = await sage.search({ query: actualQuery, limit });

  console.log(`\n${selectedMeta.label} search "${actualQuery}" (${results.length} results)\n`);

  for (const [i, r] of results.entries()) {
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
