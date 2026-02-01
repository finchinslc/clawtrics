# Changelog

All notable changes to Clawtrics will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Mobile-friendly responsive design with fluid typography
- Session Deep-Dive modal showing full run timeline per session
- Thinking Mode breakdown showing distribution and avg durations per level
- Error tracking widget showing error counts and top error types
- Recent Sessions widget with clickable session cards
- Context Pressure metrics (compactions, estimated tokens, heavy sessions)
- Real-time updates via Server-Sent Events (SSE)
- Connection status indicator (Live/Connecting/Disconnected)

### Changed
- All grids now use auto-fit/minmax for flexible mobile layouts
- Modal optimized for mobile with better scrolling and word-break
- Header wraps elements on small screens
- Font sizes use CSS clamp() for smooth scaling (10-22px)

### Removed
- Cost estimation feature (inaccurate without real token counts from OpenClaw)
- 30-second polling replaced with SSE streaming
- "Updated X ago" footer timestamp

## [0.2.0] - 2026-02-01

### Added
- Initial release with basic metrics dashboard
- Tool usage tracking and visualization
- Model usage breakdown
- Channel statistics
- Shell command tracking
- Daily activity charts
- Tool chain detection
- Slowest runs widget
- Docker Compose deployment
- Real-time metrics parsing from OpenClaw logs

### Technical
- Next.js 15.5.11
- Server-side metrics parser
- SSE streaming endpoint
- Docker multi-stage build

---

## Release Notes

### v0.2.0 (2026-02-01)
First public release of Clawtrics - OpenClaw metrics dashboard. Real-time visualization of agent runs, tool usage, performance metrics, and session analytics. Mobile-friendly responsive design with SSE streaming updates.
