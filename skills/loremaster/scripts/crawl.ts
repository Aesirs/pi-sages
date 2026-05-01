import {
  CredentialStore,
  SageResolver,
  SageSelector,
  ALL_SAGE_PROFILES,
  type CrawlResult,
  type SageProfile,
} from '../../../src/index.js';

async function main(): Promise<void> {
  const [, , sageArg, url, limitArg] = process.argv;

  if (!url) {
    console.error('Usage: crawl.ts [sage] <url> [limit]');
    console.error('If sage is omitted, the highest-priority configured sage is used.');
    process.exit(1);
  }

  const vault = new CredentialStore();
  const resolver = new SageResolver(vault);
  const selector = new SageSelector(resolver);

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
    const selected = selector.select('crawl');
    if (!selected) {
      console.error('No crawl sages are configured.');
      console.error(selector.buildAvailabilityMessage('crawl'));
      process.exit(1);
    }
    selectedId = selected.id;
    selectedMeta = selected.meta;
    console.log(`Using sage: ${selectedMeta.label} (${selectedId})`);
  } else {
    selectedId = sageName;
    const meta = ALL_SAGE_PROFILES.find((m) => m.id === selectedId);
    if (!meta || !meta.capabilities.includes('crawl')) {
      console.error(`Sage "${selectedId}" does not support crawl.`);
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

  const results: CrawlResult[] = await sage.crawl!({ url: actualUrl, limit });

  console.log(`\n${selectedMeta.label} crawl ${actualUrl} (${results.length} pages)\n`);

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
