# 📊 Clawtrics

Metrics dashboard for OpenClaw — track run durations, tool usage, models, channels, and more.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1a/ef4444?text=Clawtrics+Dashboard)

## Features

- **Run metrics**: Total runs, duration, sessions, abort rate
- **Duration percentiles**: Average, P50, P95, Max
- **Context pressure**: Compaction tracking, estimated tokens
- **Thinking mode breakdown**: Distribution of reasoning levels (off/low/medium/high)
- **Error tracking**: Categorized error counts (exec failures, auth errors, etc.)
- **Tool usage**: Bar chart of most-used tools
- **Model breakdown**: Which AI models you're using
- **Channel stats**: Discord, webchat, heartbeat, etc.
- **Session deep-dive**: Click any session to see full timeline
- **Real-time updates**: SSE-based live dashboard (no polling)
- **CLI companion**: Terminal-based metrics

## Quick Start

### One-Line Install (recommended)

```bash
npx clawtrics-installer
```

This will:
- Check prerequisites (Docker, Git)
- Clone and configure the dashboard  
- Build and start the Docker container
- Set up auto-start on boot (optional, macOS)

### Manual (Docker)

```bash
git clone https://github.com/finchinslc/clawtrics.git
cd clawtrics
docker compose up -d

# Open http://localhost:3001
```

The container mounts `/tmp/clawdbot` and `/tmp/openclaw` (read-only) to access OpenClaw logs.

## Managing the Dashboard

```bash
npx clawtrics-installer status   # Check if running
npx clawtrics-installer start    # Start the dashboard
npx clawtrics-installer stop     # Stop the dashboard
npx clawtrics-installer restart  # Restart
npx clawtrics-installer logs     # View container logs
npx clawtrics-installer open     # Open in browser
npx clawtrics-installer update   # Pull latest & rebuild
```

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
