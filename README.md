# 🏛️ pi-sages

Web research providers for pi. Deterministic, priority-based provider selection — no more guessing which search API to use.

## Providers

Each web provider is a **Sage** with its own capabilities:

| Sage | Capabilities | Needs Key |
|---|---|---|
| **Tavily** | search, crawl, extract | 🟢 |
| **Brave** | search | 🟢 |
| **Firecrawl** | search, crawl, extract | 🟢 |
| **Exa** | search, crawl, extract | 🟢 |
| **DuckDuckGo** | search | 🔴 |

## 🔮 Tools

The model selects sages automatically based on your configured **Priority**:

| Tool | Capability | Description |
|---|---|---|
| `search` | search | Search the web for information, docs, news |
| `crawl` | crawl | Crawl a URL, extract full page content |
| `extract` | extract | Extract structured content from URLs |
| `multiSearch` | search | Search across all sages, deduplicated results |

The model never chooses the provider — the first available sage in your priority list is selected automatically.

## ⚔️ Command

```bash
/sages                    # Open sages menu
/sages set-key <sage> <key>
/sages clear-key <sage>
/sages priority <sage1> <sage2> ...
```

Interactive mode lets you view status, manage API keys, and set priority via menus.

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

Or use `/sages` to manage keys interactively (stored in `sages.json`).

## 📜 Skill: Loremaster

This package includes the **loremaster** skill for standalone CLI scripts:

```bash
# Search
npx tsx skills/loremaster/scripts/search.ts "latest rust features" 5

# Crawl
npx tsx skills/loremaster/scripts/crawl.ts "https://example.com"

# Multi-provider
npx tsx skills/loremaster/scripts/multiSearch.ts "solidjs vs react" 3
```

## ⚙️ Configuration

### Priority

Default: `tavily → brave → firecrawl → exa → duckduckgo`

Override via env var:
```bash
export SAGE_PRIORITY='tavily,brave,duckduckgo'
```

Or interactively via `/sages`.

## 📁 Structure

```
pi-sages/
├── extensions/
│   └── sages.ts          # Pi extension: tools + /sages command
├── src/
│   ├── types.ts           # Sage, SageCapability, SageProfile, result types
│   ├── base.ts            # Abstract Sage class
│   ├── auth.ts            # CredentialStore (API key management)
│   ├── resolver.ts        # SageResolver (instantiates sages)
│   ├── selector.ts        # SageSelector (priority-based selection)
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
