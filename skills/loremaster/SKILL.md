---
name: loremaster
description: Web research skill powered by the Sages. Guides the model on when and how to use search, crawl, extract, and multiSearch for searching, crawling, and extracting web content. Priority selector picks the best available sage automatically.
---

# Loremaster

Use this skill when the user needs web research, current information, documentation lookup, or content extraction from URLs.

## Available Tools

When running inside pi with the Sages extension, use these tools directly:

### `search` — Web Search
Search the web for information. Use for:
- Current events, news, or recent developments
- Finding documentation, tutorials, or libraries
- Verifying facts or gathering context on a topic

The highest-priority configured sage is selected automatically based on your priority list.

### `crawl` — Crawl URL
Crawl a URL to extract full page content as markdown. Use for:
- Reading full documentation pages too large for a search snippet
- Extracting content from blog posts or articles
- When the user provides a specific URL to explore

### `extract` — Extract Structured Content
Extract content from specific URLs. Use for:
- Precise extraction from known URLs
- When you already know the exact pages to read
- Supports up to 20 URLs in a single call

Prefer `extract` over `crawl` when you already know the target URLs.

### `multiSearch` — Multi-Provider Search
Search across all configured sages simultaneously. Use for:
- Comprehensive research from multiple angles
- When you need broader coverage or cross-validation
- Results are deduplicated by URL across all sages

## Priority

Sages are selected automatically based on priority. Default order:
1. Tavily — search, crawl, extract
2. Brave — search
3. Firecrawl — search, crawl, extract
4. Exa — search, crawl, extract
5. DuckDuckGo — search (no API key needed)

The first sage in the priority list that supports the requested capability and has a configured API key is used.

## Standalone Scripts (CLI usage outside pi)

If using this skill outside of pi, run the helper scripts directly:

```bash
cd /path/to/pi-sages && npm install
```

Search:
```bash
npx tsx skills/loremaster/scripts/search.ts "query" [limit]
npx tsx skills/loremaster/scripts/search.ts tavily "query" 5
```

Crawl:
```bash
npx tsx skills/loremaster/scripts/crawl.ts <url> [limit]
npx tsx skills/loremaster/scripts/crawl.ts firecrawl "https://example.com" 5
```

Multi-provider:
```bash
npx tsx skills/loremaster/scripts/multiSearch.ts "query" [limit-per-sage]
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
