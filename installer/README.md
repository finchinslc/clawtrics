# Clawtrics Installer

A terminal UI installer for [Clawtrics](https://github.com/finchinslc/clawtrics) — an OpenClaw metrics dashboard.

## Quick Start

```bash
npx clawtrics
```

This will:
- Check prerequisites (Node.js 18+, Git)
- Clone and build the dashboard
- Set up auto-start on boot (optional, macOS only)

## Managing the Dashboard

After installation, use these commands:

```bash
npx clawtrics status   # Check if running
npx clawtrics start    # Start the dashboard
npx clawtrics stop     # Stop the dashboard
npx clawtrics restart  # Restart
npx clawtrics logs     # View logs
npx clawtrics open     # Open in browser
npx clawtrics update   # Pull latest & rebuild
```

## What Gets Installed

| Component   | Location |
|-------------|----------|
| App         | ~/clawtrics |
| Logs        | ~/clawtrics/logs/ |
| Auto-start  | ~/Library/LaunchAgents/com.clawtrics.dashboard.plist (macOS) |

## Requirements

- Node.js 18+
- Git
- macOS or Linux

## License

MIT
