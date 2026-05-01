---
name: loremaster
description: A guild of sages for web research. Search, crawl, and extract knowledge using Firecrawl, Tavily, Exa, Brave Search, or DuckDuckGo. Uses priority-based summon order so the best available sage is called automatically.
---

# Loremaster

Web research skill powered by the Sages guild. Summon sages to scry, delve, and decipher the web.

## Setup

Ensure dependencies are installed in the project root:

```bash
cd ../.. && npm install
```

Set your API key(s) as environment variables:

```bash
export FIRECRAWL_API_KEY="your-key"
export TAVILY_API_KEY="your-key"
export EXA_API_KEY="your-key"
export BRAVE_API_KEY="your-key"
# DuckDuckGo requires no API key
```

Or use the `/sages` command in pi to manage contracts interactively.

## Scry (Search)

Gaze into the weave of knowledge. The highest-priority bound sage is summoned automatically:

```bash
cd ../.. && npx tsx skills/loremaster/scripts/scry.ts "query" [limit]
```

You can also specify a sage explicitly:

```bash
npx tsx skills/loremaster/scripts/scry.ts tavily "latest rust async runtime" 5
npx tsx skills/loremaster/scripts/scry.ts brave "typescript 5.5 features" 10
npx tsx skills/loremaster/scripts/scry.ts duckduckgo "openai o3 model" 8
```

## Delve (Crawl)

Descend into a URL to extract full page content. The highest-priority bound sage is summoned automatically:

```bash
cd ../.. && npx tsx skills/loremaster/scripts/delve.ts <url> [limit]
```

You can also specify a sage explicitly:

```bash
npx tsx skills/loremaster/scripts/delve.ts firecrawl "https://example.com" 5
npx tsx skills/loremaster/scripts/delve.ts tavily "https://example.com"
```

## Commune (Multi-Provider Search)

Convene the full council of sages and merge their findings:

```bash
cd ../.. && npx tsx skills/loremaster/scripts/commune.ts "query" [limit-per-sage]
```

Example:

```bash
npx tsx skills/loremaster/scripts/commune.ts "solidjs vs react 2024" 3
```
