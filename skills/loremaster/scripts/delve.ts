import {
  VaultKeeper,
  Summoner,
  SummonOrder,
  ALL_SAGE_PROFILES,
  type CrawlResult,
  type SageProfile,
} from '../../../src/index.js';

function requireEnv(key: string): void {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const [, , sageArg, url, limitArg] = process.argv;

  if (!url) {
    console.error('Usage: delve.ts [sage] <url> [limit]');
    console.error('If sage is omitted, the highest-priority bound sage is summoned.');
    process.exit(1);
  }

  const vault = new VaultKeeper();
  const summoner = new Summoner(vault);
  const order = new SummonOrder(summoner);

  let sageName: string;
  let actualUrl = url;
  let limitStr = limitArg;

  const isUrl = sageArg?.startsWith('http://') || sageArg?.startsWith('https://');
  if (isUrl) {
    sageName = 'auto';
    actualUrl = sageArg;
    limitStr = url;
  } else {
    sageName = sageArg ?? 'auto';
  }

  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  let selectedId: string;
  let selectedMeta: SageProfile;

  if (sageName === 'auto') {
    const selected = order.select('crawl');
    if (!selected) {
      console.error('No crawl sages are bound.');
      console.error(order.buildAvailabilityMessage('crawl'));
      process.exit(1);
    }
    selectedId = selected.id;
    selectedMeta = selected.meta;
    console.log(`🕳️ Summoned sage: ${selectedMeta.label} (${selectedId})`);
  } else {
    selectedId = sageName;
    const meta = ALL_SAGE_PROFILES.find((m) => m.id === selectedId);
    if (!meta || !meta.capabilities.includes('crawl')) {
      console.error(`Sage "${selectedId}" does not practice the art of crawl.`);
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

  const results: CrawlResult[] = await sage.crawl!({ url: actualUrl, limit });

  console.log(`\n🕳️ ${selectedMeta.label} delves into ${actualUrl} (${results.length} pages)\n`);

  for (const [i, r] of results.entries()) {
    console.log(`[${i + 1}] ${r.url}`);
    if (r.markdown) {
      const preview = r.markdown.slice(0, 500).replace(/\n+/g, ' ');
      console.log(`    ${preview}${r.markdown.length > 500 ? '...' : ''}`);
    }
    if (r.statusCode) console.log(`    Status: ${r.statusCode}`);
    console.log();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
