import {
  VaultKeeper,
  Summoner,
  SummonOrder,
  ALL_SAGE_PROFILES,
  type SearchResult,
  type SageProfile,
} from '../../../src/index.js';

function requireEnv(key: string): void {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const [, , sageArg, query, limitArg] = process.argv;

  if (!query) {
    console.error('Usage: scry.ts [sage] "query" [limit]');
    console.error('If sage is omitted, the highest-priority bound sage is summoned.');
    process.exit(1);
  }

  const vault = new VaultKeeper();
  const summoner = new Summoner(vault);
  const order = new SummonOrder(summoner);

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
    const selected = order.select('search');
    if (!selected) {
      console.error('No search sages are bound.');
      console.error(order.buildAvailabilityMessage('search'));
      process.exit(1);
    }
    selectedId = selected.id;
    selectedMeta = selected.meta;
    console.log(`🔮 Summoned sage: ${selectedMeta.label} (${selectedId})`);
  } else {
    selectedId = sageName;
    const meta = ALL_SAGE_PROFILES.find((m) => m.id === selectedId);
    if (!meta || !meta.capabilities.includes('search')) {
      console.error(`Sage "${selectedId}" does not practice the art of search.`);
      process.exit(1);
    }
    if (!summoner.isConfigured(meta)) {
      console.error(`Sage "${selectedId}" is not bound.`);
      process.exit(1);
    }
    selectedMeta = meta;
  }

  if (selectedMeta.needsKey) {
    requireEnv(`${selectedId.toUpperCase()}_API_KEY`);
  }

  const sage = summoner.resolve(selectedId);
  if (!sage) {
    console.error(`Failed to summon sage: ${selectedId}`);
    process.exit(1);
  }

  const results: SearchResult[] = await sage.search({ query: actualQuery, limit });

  console.log(`\n🔮 ${selectedMeta.label} scries "${actualQuery}" (${results.length} results)\n`);

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
