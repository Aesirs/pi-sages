import type { ExtensionAPI, ExtensionContext } from '@mariozechner/pi-coding-agent';
import { ALL_SAGE_PROFILES } from './registry.js';
import { CredentialStore, maskKey } from './auth.js';
import { SageSelector } from './selector.js';

function buildStatusMessage(vault: CredentialStore, order: SageSelector): string {
  const lines = ['Sages Status:'];
  for (const meta of ALL_SAGE_PROFILES) {
    const { configured, source } = vault.status(meta);
    const icon = configured ? '🟢' : '🔴';
    const src = meta.needsKey
      ? source === 'stored'
        ? 'sages.json'
        : source === 'env'
          ? 'env var'
          : 'not set'
      : 'no key needed';
    const caps = meta.capabilities.join('/');
    lines.push(`  ${icon} ${meta.label} (${meta.id}): ${src} [${caps}]`);
  }
  lines.push('\nPriority:');
  for (const id of order.getPriority()) {
    const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
    if (!meta) continue;
    lines.push(`  ${meta.label} (${meta.id})`);
  }
  return lines.join('\n');
}

async function manageKeys(vault: CredentialStore, ctx: ExtensionContext): Promise<void> {
  while (true) {
    const action = await ctx.ui.select('API Keys:', [
      'Set Key',
      'Clear Key',
      'View Keys',
      'Back',
    ]);
    if (!action || action === 'Back') return;

    if (action === 'View Keys') {
      const lines = ['Stored API keys:'];
      let hasAny = false;
      for (const meta of ALL_SAGE_PROFILES) {
        if (!meta.needsKey) continue;
        const masked = vault.peek(meta.id);
        if (masked) {
          lines.push(`  ${meta.id}: ${masked} (sages.json)`);
          hasAny = true;
        } else {
          lines.push(`  ${meta.id}: not set`);
        }
      }
      if (!hasAny) lines.push('\nNo keys stored. Use "Set Key" to add them.');
      ctx.ui.notify(lines.join('\n'), 'info');
      continue;
    }

    if (action === 'Set Key') {
      const keySages = ALL_SAGE_PROFILES.filter((m) => m.needsKey);
      const lines = ['Current key status:'];
      for (const meta of keySages) {
        const { source } = vault.status(meta);
        const stored = vault.peek(meta.id);
        if (stored) {
          lines.push(`  ${meta.label} (${meta.id}): ${stored} (sages.json)`);
        } else if (source === 'env') {
          lines.push(`  ${meta.label} (${meta.id}): from env var`);
        } else {
          lines.push(`  ${meta.label} (${meta.id}): not set`);
        }
      }
      ctx.ui.notify(lines.join('\n'), 'info');

      const choice = await ctx.ui.select(
        'Which sage do you want to set a key for?',
        keySages.map((m) => `${m.label} (${m.id})`),
      );
      if (!choice) continue;

      const id = choice.match(/\(([^)]+)\)$/)?.[1];
      const meta = keySages.find((m) => m.id === id);
      if (!meta) continue;

      const key = await ctx.ui.input(`Enter API key for ${meta.label}:`, 'sk-...');
      if (!key || !key.trim()) {
        ctx.ui.notify('No key entered. Aborted.', 'warning');
        continue;
      }

      vault.set(meta.id, key.trim());
      ctx.ui.notify(`Key set for ${meta.label} (${maskKey(key.trim())}) → sages.json`, 'info');
      continue;
    }

    if (action === 'Clear Key') {
      const configuredSages = ALL_SAGE_PROFILES.filter((m) => m.needsKey && vault.has(m.id));
      if (configuredSages.length === 0) {
        ctx.ui.notify('No stored keys to clear.', 'info');
        continue;
      }

      const choice = await ctx.ui.select(
        'Which key do you want to clear?',
        configuredSages.map((m) => `${m.label} (${m.id}) — ${vault.peek(m.id) ?? ''}`),
      );
      if (!choice) continue;

      const id = choice.match(/\(([^)]+)\)/)?.[1];
      const meta = configuredSages.find((m) => m.id === id);
      if (!meta) continue;

      const ok = await ctx.ui.confirm('Clear key?', `Remove stored key for ${meta.label}?`);
      if (!ok) {
        ctx.ui.notify('Aborted.', 'info');
        continue;
      }

      vault.remove(meta.id);
      ctx.ui.notify(`Cleared key for ${meta.label}. Key removed from sages.json.`, 'info');
      continue;
    }
  }
}

async function configurePriority(order: SageSelector, ctx: ExtensionContext): Promise<void> {
  const current = order.getPriority();
  const lines = ['Current priority:'];
  for (const id of current) {
    const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
    if (!meta) continue;
    lines.push(`  ${meta.label} (${meta.id})`);
  }
  ctx.ui.notify(lines.join('\n'), 'info');

  const orderIds: string[] = [];
  const used = new Set<string>();

  while (true) {
    const remaining = ALL_SAGE_PROFILES.filter((m) => !used.has(m.id));
    if (remaining.length === 0) break;

    const position = orderIds.length === 0 ? 'first' : 'next';
    const choice = await ctx.ui.select(
      `Select the ${position} sage in priority:`,
      remaining.map((m) => `${m.label} (${m.id})${m.needsKey ? ' — requires key' : ''}`),
    );
    if (!choice) break;

    const id = choice.match(/\(([^)]+)\)/)?.[1];
    if (!id) break;
    orderIds.push(id);
    used.add(id);

    const addAnother = await ctx.ui.confirm('Add another sage?', 'Add another sage to the priority?');
    if (!addAnother) break;
  }

  if (orderIds.length === 0) {
    ctx.ui.notify('No sages selected. Priority unchanged.', 'warning');
    return;
  }

  order.setPriority(orderIds);
  const pretty = orderIds
    .map((id) => ALL_SAGE_PROFILES.find((m) => m.id === id)?.label ?? id)
    .join(' > ');
  ctx.ui.notify(`Priority set to: ${pretty}`, 'info');
}

export function registerCommands(pi: ExtensionAPI, vault: CredentialStore, order: SageSelector): void {
  pi.registerCommand('sages', {
    description: 'Sages: view status, manage API keys, configure priority',
    handler: async (args, ctx: ExtensionContext) => {
      // Non-interactive: print status and exit
      if (!ctx.hasUI) {
        console.log(buildStatusMessage(vault, order));
        return;
      }

      // ── Non-interactive CLI overrides ────────────────────────────────────
      const parts = args.trim().split(/\s+/).filter(Boolean);
      if (parts[0] === 'set-key' && parts.length >= 3) {
        const id = parts[1]!.toLowerCase();
        const key = parts.slice(2).join(' ').trim();
        const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
        if (!meta || !meta.needsKey) {
          ctx.ui.notify(`Unknown sage or no key needed: ${id}`, 'warning');
          return;
        }
        vault.set(id, key);
        ctx.ui.notify(`Key set for ${meta.label} (${maskKey(key)}) → sages.json`, 'info');
        return;
      }
      if (parts[0] === 'clear-key' && parts.length >= 2) {
        const id = parts[1]!.toLowerCase();
        if (vault.has(id)) {
          vault.remove(id);
          ctx.ui.notify(`Cleared key for ${id}. Key removed from sages.json.`, 'info');
        } else {
          ctx.ui.notify(`No stored key for ${id}.`, 'info');
        }
        return;
      }
      if (parts[0] === 'priority' && parts.length >= 2) {
        const ids = parts.slice(1);
        const invalid = ids.filter((id) => !ALL_SAGE_PROFILES.some((m) => m.id === id));
        if (invalid.length > 0) {
          ctx.ui.notify(`Unknown sage(s): ${invalid.join(', ')}`, 'warning');
          return;
        }
        order.setPriority(ids);
        ctx.ui.notify(`Priority set to: ${ids.join(' > ')}`, 'info');
        return;
      }

      // ── Interactive menu loop ────────────────────────────────────────────
      while (true) {
        const choice = await ctx.ui.select('Sages:', [
          'View Status',
          'Manage API Keys',
          'Set Priority',
          'Leave',
        ]);
        if (!choice || choice === 'Leave') return;

        if (choice === 'View Status') {
          ctx.ui.notify(buildStatusMessage(vault, order), 'info');
        } else if (choice === 'Manage API Keys') {
          await manageKeys(vault, ctx);
        } else if (choice === 'Set Priority') {
          await configurePriority(order, ctx);
        }
      }
    },
  });
}
