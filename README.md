# 🏛️ pi-sages

A guild of sages for web research. Deterministic, priority-based provider selection — no more guessing which search API to use.

## The Guild

Each web provider is a **Sage** with their own arts:

| Sage | Arts | Needs Contract |
|---|---|---|
| **Tavily** | scry, delve, decipher | 🟢 |
| **Brave** | scry | 🟢 |
| **Firecrawl** | scry, delve, decipher | 🟢 |
| **Exa** | scry, delve, decipher | 🟢 |
| **DuckDuckGo** | scry | 🔴 |

## 🔮 Tools

The model summons sages automatically based on your configured **Summon Order**:

| Tool | Art | Description |
|---|---|---|
| `scry` | search | Gaze into the weave for information, docs, news |
| `delve` | crawl | Descend into a URL, extract full page content |
| `decipher` | extract | Study URLs closely, extract structured lore |
| `commune` | search | Convene the full council, deduplicated results |

The model never chooses the provider — the first available sage in your priority list is summoned automatically.

## ⚔️ Command

```bash
/sages                    # Enter the Sages Guild hall
/sages set-key <sage> <key>
/sages clear-key <sage>
/sages priority <sage1> <sage2> ...
```

Interactive mode lets you inspect the council, sign/break contracts, and set summon order via menus.

## 📦 Installation

```bash
pi install git:github.com/Aesirs/pi-sages
```

Or local development:
```bash
git clone https://github.com/Aesirs/pi-sages.git
cd pi-sages && npm install
```

Then in `.pi/settings.json`:
```json
{
  "packages": ["/absolute/path/to/pi-sages"]
}
```

## 🔑 Setup

Set API keys as env vars:
```bash
export TAVILY_API_KEY="tvly-..."
export BRAVE_API_KEY="BSA..."
export FIRECRAWL_API_KEY="fc-..."
export EXA_API_KEY="exa-..."
```

Or use `/sages` to manage keys interactively (stored in auth.json).

## 📜 Skill: Loremaster

This package includes the **loremaster** skill for standalone CLI scripts:

```bash
# Scry (search)
npx tsx skills/loremaster/scripts/scry.ts "latest rust features" 5

# Delve (crawl)
npx tsx skills/loremaster/scripts/delve.ts "https://example.com"

# Commune (multi-provider)
npx tsx skills/loremaster/scripts/commune.ts "solidjs vs react" 3
```

## ⚙️ Configuration

### Summon Order

Default: `tavily → brave → firecrawl → exa → duckduckgo`

Override via env var:
```bash
export SAGE_SUMMON_ORDER='tavily,brave,duckduckgo'
```

Or interactively via `/sages`.

## 📁 Structure

```
pi-sages/
├── extensions/
│   └── sages.ts          # Pi extension: tools + /sages command
├── src/
│   ├── types.ts           # Sage, SageArt, SageProfile, result types
│   ├── base.ts            # Abstract Sage class
│   ├── auth.ts            # VaultKeeper (API key management)
│   ├── resolver.ts        # Summoner (instantiates sages)
│   ├── selector.ts        # SummonOrder (priority-based selection)
│   ├── registry.ts        # Sage registry and factory
│   ├── commands.ts        # /sages command implementation
│   ├── providers/         # Individual sage implementations
│   └── ...
├── skills/
│   └── loremaster/        # Standalone CLI skill
└── package.json
```

## 📝 License

MIT
