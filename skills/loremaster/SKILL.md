---
name: loremaster
description: Web research skill powered by the Sages guild. Guides the model on when and how to use scry, delve, decipher, and commune for searching, crawling, and extracting web content. Summon order picks the best available sage automatically.
---

# Loremaster

Use this skill when the user needs web research, current information, documentation lookup, or content extraction from URLs.

## Available Tools

When running inside pi with the Sages extension, use these tools directly:

### `scry` — Web Search
Gaze into the weave of knowledge. Use for:
- Current events, news, or recent developments
- Finding documentation, tutorials, or libraries
- Verifying facts or gathering context on a topic

The highest-priority configured sage is summoned automatically based on your summon order.

### `delve` — Crawl URL
Descend into a URL to extract full page content as markdown. Use for:
- Reading full documentation pages too large for a search snippet
- Extracting content from blog posts or articles
- When the user provides a specific URL to explore

### `decipher` — Extract Structured Content
Study specific URLs closely. Use for:
- Precise extraction from known URLs
- When you already know the exact pages to read
- Supports up to 20 URLs in a single call

Prefer `decipher` over `delve` when you already know the target URLs.

### `commune` — Multi-Provider Search
Convene the full council of sages. Use for:
- Comprehensive research from multiple angles
- When you need broader coverage or cross-validation
- Results are deduplicated by URL across all sages

## Summon Order

Sages are summoned automatically based on priority. Default order:
1. Tavily — scry, delve, decipher
2. Brave — scry
3. Firecrawl — scry, delve, decipher
4. Exa — scry, delve, decipher
5. DuckDuckGo — scry (no API key needed)

The first sage in the order that supports the requested art and has a configured API key is used.

## Standalone Scripts (CLI usage outside pi)

If using this skill outside of pi, run the helper scripts directly:

```bash
cd /path/to/pi-sages && npm install
```

Search:
```bash
npx tsx skills/loremaster/scripts/scry.ts "query" [limit]
npx tsx skills/loremaster/scripts/scry.ts tavily "query" 5
```

Crawl:
```bash
npx tsx skills/loremaster/scripts/delve.ts <url> [limit]
npx tsx skills/loremaster/scripts/delve.ts firecrawl "https://example.com" 5
```

Multi-provider:
```bash
npx tsx skills/loremaster/scripts/commune.ts "query" [limit-per-sage]
```

## Setup

Set API keys as environment variables, or use the `/sages` command inside pi to manage them interactively (stored in `sages.json`).

```bash
export TAVILY_API_KEY="tvly-..."
export BRAVE_API_KEY="BSA..."
export FIRECRAWL_API_KEY="fc-..."
export EXA_API_KEY="exa-..."
# DuckDuckGo requires no API key
```
