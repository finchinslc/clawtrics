# Clawtrics

Metrics dashboard for [OpenClaw](https://github.com/openclaw/openclaw) — track your AI agent's token usage, speed, and performance.

## Features

- 📊 **Token tracking** — Input/output tokens per session
- ⏱️ **Speed metrics** — Response times, time-to-first-token
- 📈 **Usage trends** — Daily, weekly, monthly views
- 🔧 **Tool breakdown** — Which tools you use most
- 💰 **Cost estimates** — Approximate spend per session/day

## Quick Start

```bash
# Clone
git clone https://github.com/finchinslc/clawtrics.git
cd clawtrics

# Install
npm install

# Start dashboard
npm run dev
```

Open http://localhost:3001

## Data Sources

Clawtrics reads from OpenClaw's log files:
- `/tmp/clawdbot/clawdbot-YYYY-MM-DD.log` — Session and run data
- `~/.openclaw/logs/` — Gateway logs

## CLI

```bash
clawtrics summary      # Today's usage
clawtrics daily        # Last 7 days
clawtrics sessions     # Recent sessions
```

## License

MIT
