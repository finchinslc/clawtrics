# Release Process

This document describes how to release new versions of Clawtrics.

## Overview

Clawtrics follows a dual-repo model:
- **Installer repo** (if separate): Minimal, stable installation logic
- **Code repo** (this repo): All features, active development, releases

All releases, changelog, and version tracking happen here in the code repo.

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.2.0 → 0.3.0): New features, backward compatible
- **PATCH** (0.2.0 → 0.2.1): Bug fixes, backward compatible

## Pre-Release Checklist

- [ ] All features/fixes merged to `main`
- [ ] Tests passing (if applicable)
- [ ] CHANGELOG.md updated with new version section
- [ ] README.md updated if needed
- [ ] Version bumped in `package.json`
- [ ] Docker image builds successfully

## Release Steps

### 1. Update CHANGELOG.md

Move `[Unreleased]` section to a new version:

```markdown
## [0.3.0] - 2026-02-15

### Added
- New feature here

### Fixed
- Bug fix here
```

### 2. Bump Version

Update `package.json`:
```bash
npm version minor  # or patch/major
```

This automatically:
- Updates version in package.json
- Creates a git commit
- Creates a git tag

**Or manually:**
```json
{
  "version": "0.3.0"
}
```

### 3. Commit and Tag

```bash
git add .
git commit -m "Release v0.3.0"
git tag -a v0.3.0 -m "Version 0.3.0 - Feature summary"
git push origin main
git push origin v0.3.0
```

### 4. Create GitHub Release

1. Go to: https://github.com/YOUR_USERNAME/clawtrics/releases
2. Click **"Draft a new release"**
3. Select tag: `v0.3.0`
4. Release title: `Version 0.3.0 - Feature Summary`
5. Description: Copy from CHANGELOG.md
6. Add screenshots/GIFs if significant UI changes
7. Click **"Publish release"**

**Benefits:**
- Creates public announcement
- Notifies watchers via email
- Generates release notes page
- Provides downloadable source archives

### 5. Build and Push Docker Image (Optional)

If publishing to Docker Hub:
```bash
docker build -t YOUR_USERNAME/clawtrics:0.3.0 .
docker tag YOUR_USERNAME/clawtrics:0.3.0 YOUR_USERNAME/clawtrics:latest
docker push YOUR_USERNAME/clawtrics:0.3.0
docker push YOUR_USERNAME/clawtrics:latest
```

### 6. Update README Badges (Optional)

Add version badges at top of README:
```markdown
[![GitHub release](https://img.shields.io/github/release/YOUR_USERNAME/clawtrics.svg)](https://github.com/YOUR_USERNAME/clawtrics/releases)
[![Docker Image](https://img.shields.io/docker/v/YOUR_USERNAME/clawtrics?label=docker)](https://hub.docker.com/r/YOUR_USERNAME/clawtrics)
```

### 7. Announce

Post announcements in:
- OpenClaw Discord
- Twitter/X with #OpenClaw hashtag
- Reddit (if significant)
- Your personal channels

## Hotfix Process

For urgent bug fixes:

1. Create hotfix branch from tagged release:
   ```bash
   git checkout -b hotfix-0.3.1 v0.3.0
   ```

2. Fix bug, update CHANGELOG (add `[0.3.1]` section)

3. Bump to patch version:
   ```bash
   npm version patch
   ```

4. Merge back to main:
   ```bash
   git checkout main
   git merge hotfix-0.3.1
   git push origin main
   git push --tags
   ```

5. Create GitHub release for hotfix

## Post-Release

- [ ] Verify Docker image works
- [ ] Test installation from scratch
- [ ] Monitor for issues
- [ ] Update docs if needed

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## Questions?

If unsure about version numbering:
- **Breaking change?** → MAJOR
- **New feature?** → MINOR
- **Bug fix only?** → PATCH

When in doubt, be conservative (smaller bump).
