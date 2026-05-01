import type { ExtensionAPI, ExtensionContext } from '@mariozechner/pi-coding-agent';
import { ALL_SAGE_PROFILES } from './registry.js';
import { VaultKeeper, maskKey } from './auth.js';
import { SummonOrder } from './selector.js';

function buildStatusMessage(vault: VaultKeeper, order: SummonOrder): string {
  const lines = ['Sages Guild Status:'];
  for (const meta of ALL_SAGE_PROFILES) {
    const { configured, source } = vault.status(meta);
    const icon = configured ? '🟢' : '🔴';
    const src = meta.needsKey
      ? source === 'auth'
        ? 'auth.json'
        : source === 'env'
          ? 'env var'
          : 'not set'
      : 'no key needed';
    const caps = meta.capabilities.join('/');
    lines.push(`  ${icon} ${meta.label} (${meta.id}): ${src} [${caps}]`);
  }
  lines.push('\nSummon order:');
  for (const id of order.getOrder()) {
    const meta = ALL_SAGE_PROFILES.find((m) => m.id === id);
    if (!meta) continue;
    lines.push(`  ${meta.label} (${meta.id})`);
  }
  return lines.join('\n');
}

async function manageContracts(vault: VaultKeeper, ctx: ExtensionContext): Promise<void> {
  while (true) {
    const action = await ctx.ui.select('Sage Contracts:', [
      'Sign contract (Set Key)',
      'Break contract (Clear Key)',
      'View contracts (View Keys)',
      'Back',
    ]);
    if (!action || action === 'Back') return;

    if (action === 'View contracts (View Keys)') {
      const lines = ['Stored sage contracts:'];
      let hasAny = false;
      for (const meta of ALL_SAGE_PROFILES) {
        if (!meta.needsKey) continue;
        const masked = vault.peek(meta.id);
        if (masked) {
          lines.push(`  ${meta.id}: ${masked} (auth.json)`);
          hasAny = true;
        } else {
          lines.push(`  ${meta.id}: not set`);
        }
      }
      if (!hasAny) lines.push('\nNo contracts stored. Use "Sign contract" to add them.');
      ctx.ui.notify(lines.join('\n'), 'info');
      continue;
    }

    if (action === 'Sign contract (Set Key)') {
      const keySages = ALL_SAGE_PROFILES.filter((m) => m.needsKey);
      const lines = ['Current contract status:'];
      for (const meta of keySages) {
        const { source } = vault.status(meta);
        const stored = vault.peek(meta.id);
        if (stored) {
          lines.push(`  ${meta.label} (${meta.id}): ${stored} (auth.json)`);
        } else if (source === 'env') {
          lines.push(`  ${meta.label} (${meta.id}): from env var`);
        } else {
          lines.push(`  ${meta.label} (${meta.id}): not set`);
        }
      }
      ctx.ui.notify(lines.join('\n'), 'info');

      const choice = await ctx.ui.select(
        'Which sage do you want to sign a contract with?',
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
      ctx.ui.notify(`Contract signed with ${meta.label} (${maskKey(key.trim())}) → auth.json`, 'info');
      continue;
    }

    if (action === 'Break contract (Clear Key)') {
      const boundSages = ALL_SAGE_PROFILES.filter((m) => m.needsKey && vault.has(m.id));
      if (boundSages.length === 0) {
        ctx.ui.notify('No stored contracts to break.', 'info');
        continue;
      }

      const choice = await ctx.ui.select(
        'Which contract do you want to break?',
        boundSages.map((m) => `${m.label} (${m.id}) — ${vault.peek(m.id) ?? ''}`),
      );
      if (!choice) continue;

      const id = choice.match(/\(([^)]+)\)/)?.[1];
      const meta = boundSages.find((m) => m.id === id);
      if (!meta) continue;

      const ok = await ctx.ui.confirm('Break contract?', `Remove stored key for ${meta.label}?`);
      if (!ok) {
        ctx.ui.notify('Aborted.', 'info');
        continue;
      }

      vault.remove(meta.id);
      ctx.ui.notify(`Broke contract with ${meta.label}. Key removed from auth.json.`, 'info');
      continue;
    }
  }
}

async function configureSummonOrder(order: SummonOrder, ctx: ExtensionContext): Promise<void> {
  const current = order.getOrder();
  const lines = ['Current summon order:'];
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
      `Select the ${position} sage in summon order:`,
      remaining.map((m) => `${m.label} (${m.id})${m.needsKey ? ' — requires contract' : ''}`),
    );
    if (!choice) break;

    const id = choice.match(/\(([^)]+)\)/)?.[1];
    if (!id) break;
    orderIds.push(id);
    used.add(id);

    const addAnother = await ctx.ui.confirm('Add another sage?', 'Add another sage to the summon order?');
    if (!addAnother) break;
  }

  if (orderIds.length === 0) {
    ctx.ui.notify('No sages selected. Summon order unchanged.', 'warning');
    return;
  }

  order.setOrder(orderIds);
  const pretty = orderIds
    .map((id) => ALL_SAGE_PROFILES.find((m) => m.id === id)?.label ?? id)
    .join(' > ');
  ctx.ui.notify(`Summon order set to: ${pretty}`, 'info');
}

export function registerCommands(pi: ExtensionAPI, vault: VaultKeeper, order: SummonOrder): void {
  pi.registerCommand('sages', {
    description: 'Enter the Sages Guild: view status, manage contracts, configure summon order',
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
          ctx.ui.notify(`Unknown sage or no contract needed: ${id}`, 'warning');
          return;
        }
        vault.set(id, key);
        ctx.ui.notify(`Contract signed with ${meta.label} (${maskKey(key)}) → auth.json`, 'info');
        return;
      }
      if (parts[0] === 'clear-key' && parts.length >= 2) {
        const id = parts[1]!.toLowerCase();
        if (vault.has(id)) {
          vault.remove(id);
          ctx.ui.notify(`Broke contract with ${id}. Key removed from auth.json.`, 'info');
        } else {
          ctx.ui.notify(`No stored contract with ${id}.`, 'info');
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
        order.setOrder(ids);
        ctx.ui.notify(`Summon order set to: ${ids.join(' > ')}`, 'info');
        return;
      }

      // ── Interactive menu loop ────────────────────────────────────────────
      while (true) {
        const choice = await ctx.ui.select('Sages:', [
          'Inspect the Council (View Status)',
          'Manage Contracts (API Keys)',
          'Set Summon Order (Priority)',
          'Leave',
        ]);
        if (!choice || choice === 'Leave') return;

        if (choice === 'Inspect the Council (View Status)') {
          ctx.ui.notify(buildStatusMessage(vault, order), 'info');
        } else if (choice === 'Manage Contracts (API Keys)') {
          await manageContracts(vault, ctx);
        } else if (choice === 'Set Summon Order (Priority)') {
          await configureSummonOrder(order, ctx);
        }
      }
    },
  });
}
