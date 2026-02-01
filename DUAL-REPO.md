# Dual-Repo Release Model

## Architecture

Clawtrics uses a dual-repo model optimized for ease of development and distribution:

### Code Repo (this repo: `clawtrics`)
- **Purpose:** Active development, features, bug fixes
- **Contains:** Full source code, Docker setup, documentation
- **Releases:** Version tags, GitHub releases, CHANGELOG
- **Users:** Pull directly from this repo (git clone or release tarball)

### Installer Repo (if separate: `clawtrics-installer`)
- **Purpose:** Installation automation, user onboarding
- **Contains:** Minimal CLI tool for setup/management
- **Updates:** Rarely (only when install logic changes)
- **Distribution:** Published to npm for `npx` usage

## Why This Model?

**Benefits:**
- ✅ Iterate on features without republishing installer
- ✅ Clear separation: install logic vs application code
- ✅ Users always get latest from code repo
- ✅ Installer stays stable and lightweight
- ✅ Version control where it matters (features, not install scripts)

**Trade-offs:**
- Two repos to manage (but installer rarely changes)
- Users need git + Node.js (acceptable for dev tool)

## Workflow

### For Feature Development

1. **Develop in code repo** (`~/projects/clawtrics`)
   ```bash
   # Make changes
   git add .
   git commit -m "Add new feature"
   ```

2. **Update CHANGELOG.md** with changes

3. **Release when ready** (see [RELEASE.md](./RELEASE.md))
   ```bash
   npm version minor
   git push origin main --tags
   # Create GitHub release
   ```

4. **Installer automatically pulls latest** — no action needed!

### For Installer Changes

Only update installer repo when:
- Install process changes (new dependencies, setup steps)
- CLI commands change (add/remove commands)
- Bug in installation logic

**Rarely needed!** Most changes go in code repo.

## User Installation Flow

1. User runs: `npx clawtrics-installer`
2. Installer checks prerequisites
3. Installer clones/downloads this code repo
4. Installer sets up Docker, builds, starts
5. User accesses dashboard at `http://localhost:3001`

## Current State

**Code Repo:** ✅ Set up with CHANGELOG, versioning, release docs

**Installer Repo:** 
- If exists separately: Minimal updates needed
- If combined: Already includes installer logic
- If doesn't exist: Can create when needed

## Next Steps

1. ✅ Code repo ready to release (this is done)
2. 🔲 Create v0.2.0 GitHub release (when ready to announce)
3. 🔲 Verify installer pulls from correct repo/branch
4. 🔲 Test full install flow from scratch

## Questions?

See:
- [RELEASE.md](./RELEASE.md) — How to create releases
- [CHANGELOG.md](./CHANGELOG.md) — Version history
- [README.md](./README.md) — User-facing docs
