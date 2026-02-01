# Clawtrics Installer

A terminal UI installer for [Clawtrics](https://github.com/finchinslc/clawtrics) — an OpenClaw metrics dashboard.

## Quick Start

```bash
npx clawtrics-installer
```

This will:
- Check prerequisites (Docker, Git)
- Clone and configure the dashboard
- Build and start the Docker container
- Set up auto-start on boot (optional, macOS only)

## Managing the Dashboard

After installation, use these commands:

```bash
npx clawtrics-installer status   # Check if running
npx clawtrics-installer start    # Start the dashboard
npx clawtrics-installer stop     # Stop the dashboard
npx clawtrics-installer restart  # Restart
npx clawtrics-installer logs     # View container logs
npx clawtrics-installer open     # Open in browser
npx clawtrics-installer update   # Pull latest & rebuild
```

## What Gets Installed

| Component   | Location |
|-------------|----------|
| App         | ~/clawtrics |
| Logs        | ~/clawtrics/logs/ |
| Auto-start  | ~/Library/LaunchAgents/com.clawtrics.dashboard.plist (macOS) |

## Requirements

- Docker (running)
- Git
- macOS or Linux

## License

MIT
