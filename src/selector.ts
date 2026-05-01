import { SageResolver } from './resolver.js';
import { ALL_SAGE_PROFILES } from './registry.js';
import { SageConfigStore } from './storage.js';
import type { SageCapability, SageProfile } from './types.js';

const DEFAULT_PRIORITY = ['tavily', 'brave', 'firecrawl', 'exa', 'duckduckgo'];

export class SageSelector {
  private order: string[];
  private storage: SageConfigStore;

  constructor(
    private resolver: SageResolver,
    customOrder?: string[],
  ) {
    this.storage = new SageConfigStore();
    const env = this.loadEnvPriority();
    const stored = this.storage.getPriority();
    this.order = env ?? customOrder ?? stored ?? [...DEFAULT_PRIORITY];
  }

  private loadEnvPriority(): string[] | undefined {
    const raw = process.env.SAGE_PRIORITY;
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
      return undefined;
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  setPriority(providers: string[]): void {
    this.order = providers;
    this.storage.setPriority(providers);
  }

  getPriority(): string[] {
    return [...this.order];
  }

  select(capability: SageCapability): { meta: SageProfile; id: string } | null {
    for (const id of this.order) {
      const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
      if (!meta) continue;
      if (!meta.capabilities.includes(capability)) continue;
      if (!this.resolver.isConfigured(meta)) continue;
      return { meta, id };
    }
    return null;
  }

  getAvailableSages(capability: SageCapability): SageProfile[] {
    return ALL_SAGE_PROFILES.filter(
      (m) => m.capabilities.includes(capability) && this.resolver.isConfigured(m),
    );
  }

  buildAvailabilityMessage(capability: SageCapability): string {
    const available = this.getAvailableSages(capability);
    const availableIds = new Set(available.map((m) => m.id));

    const lines: string[] = [];
    lines.push(`Priority (first available with ${capability} is used):`);
    for (const id of this.order) {
      const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
      if (!meta) continue;
      const supports = meta.capabilities.includes(capability);
      const configured = availableIds.has(id);
      const icon = supports ? (configured ? '🟢' : '🟡 not configured') : `🔴 no ${capability}`;
      lines.push(`  ${icon} ${meta.label} (${id})`);
    }
    if (available.length === 0) {
      lines.push(`\nNo sages are configured for ${capability}. Use /sages to add API keys.`);
    }
    return lines.join('\n');
  }
}
