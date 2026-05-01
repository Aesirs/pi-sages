import type { Theme, AgentToolResult } from '@mariozechner/pi-coding-agent';
import { Text, truncateToWidth } from '@mariozechner/pi-tui';

export function renderSearchCall(args: Record<string, unknown>, theme: Theme): Text {
  const query = String(args.query ?? '');
  const limit = Number(args.limit ?? 5);
  const label = theme.fg('toolTitle', theme.bold('scry '));
  const meta = theme.fg('muted', `×${limit}`);
  const q = theme.fg('dim', `"${truncateToWidth(query, 60)}"`);
  return new Text(`${label}${meta} ${q}`, 0, 0);
}

export function renderSearchResult(result: AgentToolResult<unknown>, _options: { expanded: boolean }, theme: Theme): Text {
  const first = result.content[0];
  const snippet = first && first.type === 'text' ? first.text : '';
  const lines = snippet.split('\n').filter((l: string) => l.trim());
  const count = lines.filter((l: string) => l.startsWith('[')).length;
  return new Text(
    theme.fg('muted', `${count} result(s)`) +
      (snippet.length > 200 ? '\n' + theme.fg('dim', truncateToWidth(snippet, 120)) : ''),
    0,
    0,
  );
}
