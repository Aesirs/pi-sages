import { Summoner } from './resolver.js';
import { ALL_SAGE_PROFILES } from './registry.js';
import type { SageArt, SageProfile } from './types.js';

const DEFAULT_SUMMON_ORDER = ['tavily', 'brave', 'firecrawl', 'exa', 'duckduckgo'];

export class SummonOrder {
  private order: string[];

  constructor(
    private summoner: Summoner,
    customOrder?: string[],
  ) {
    const env = this.loadEnvOrder();
    this.order = env ?? customOrder ?? [...DEFAULT_SUMMON_ORDER];
  }

  private loadEnvOrder(): string[] | undefined {
    const raw = process.env.SAGE_SUMMON_ORDER;
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
      return undefined;
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  setOrder(providers: string[]): void {
    this.order = providers;
  }

  getOrder(): string[] {
    return [...this.order];
  }

  select(art: SageArt): { meta: SageProfile; id: string } | null {
    for (const id of this.order) {
      const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
      if (!meta) continue;
      if (!meta.capabilities.includes(art)) continue;
      if (!this.summoner.isConfigured(meta)) continue;
      return { meta, id };
    }
    return null;
  }

  getAvailableSages(art: SageArt): SageProfile[] {
    return ALL_SAGE_PROFILES.filter(
      (m) => m.capabilities.includes(art) && this.summoner.isConfigured(m),
    );
  }

  buildAvailabilityMessage(art: SageArt): string {
    const available = this.getAvailableSages(art);
    const availableIds = new Set(available.map((m) => m.id));

    const lines: string[] = [];
    lines.push(`Summon order (first available with ${art} is used):`);
    for (const id of this.order) {
      const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
      if (!meta) continue;
      const supports = meta.capabilities.includes(art);
      const configured = availableIds.has(id);
      const icon = supports ? (configured ? '🟢' : '🟡 not configured') : `🔴 no ${art}`;
      lines.push(`  ${icon} ${meta.label} (${id})`);
    }
    if (available.length === 0) {
      lines.push(`\nNo sages are configured for ${art}. Use /sages to add API keys.`);
    }
    return lines.join('\n');
  }
}
