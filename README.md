# 📊 Clawtrics

Metrics dashboard for OpenClaw — track run durations, tool usage, models, channels, and more.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1a/ef4444?text=Clawtrics+Dashboard)

## Features

- **Run metrics**: Total runs, duration, sessions, abort rate
- **Duration percentiles**: Average, P50, P95, Max
- **Tool usage**: Bar chart of most-used tools
- **Model breakdown**: Which AI models you're using
- **Channel stats**: Discord, webchat, heartbeat, etc.
- **Provider stats**: API providers (github-copilot, anthropic, etc.)
- **Daily activity**: 14-day activity chart
- **Auto-refresh**: Dashboard updates every 30 seconds
- **CLI companion**: Terminal-based metrics

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/finchinslc/clawtrics.git
cd clawtrics
docker compose up -d

# Open http://localhost:3001
```

The container mounts `/tmp/clawdbot` (read-only) to access OpenClaw logs.

### Local Development

```bash
git clone https://github.com/finchinslc/clawtrics.git
cd clawtrics
npm install

# Run dashboard
npm run dev -- -p 3001
# Open http://localhost:3001

# CLI usage
npm run cli                 # Summary
npm run cli daily           # Daily breakdown
npm run cli tools           # Tool usage
npm run cli models          # Model usage
```

## CLI Commands

```bash
clawtrics          # Overall summary
clawtrics daily    # Last 14 days breakdown
clawtrics tools    # Full tool usage chart
clawtrics models   # Model usage chart
clawtrics help     # Show help
```

## Data Source

Clawtrics parses OpenClaw's log files from `/tmp/clawdbot/*.log`. These are NDJSON logs with structured run data.

### What's tracked

From log analysis:
- Run start/end times and duration
- Session IDs
- Model and provider
- Message channel (webchat, discord, etc.)
- Tool usage (exec, read, write, browser, etc.)
- Abort status

### Not yet tracked (need API-level logging)
- Token counts (input/output/cache)
- Cost estimates
- Thinking tokens

## Tech Stack

- **Next.js 15** — React framework
- **Recharts** — (available for custom charts)
- **Node.js** — Log parsing

## Development

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run cli     # Run CLI directly
```

## Roadmap

- [ ] Token count extraction (requires OpenClaw logging changes)
- [ ] Cost estimation with model pricing
- [ ] Date range picker
- [ ] Export to CSV
- [ ] WebSocket real-time updates
- [ ] Historical trends

## License

MIT © Finch
