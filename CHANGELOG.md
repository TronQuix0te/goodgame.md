# Changelog

## 2026-03-16 — Phase 1: Foundation + Features

### Auth
- GitHub OAuth login (redirect flow with CSRF protection)
- Auto-admin promotion via `ADMIN_GITHUB_IDS` env var
- Legacy username auth preserved as fallback

### Build Management
- Edit build metadata (title, description)
- Publish/unpublish toggle
- Delete builds with cascade cleanup (versions, scores, votes, pull log)
- Re-judge button — owner can re-trigger AI scoring

### Champion System
- Automatic champion crowning per archetype per season
- Recalculates on every score change, publish/unpublish, or delete
- Champion badge (★) on leaderboard and build detail

### Seasons
- Automatic season creation when new Anthropic model releases detected
- Polls `api.anthropic.com/v1/models` on boot + daily
- Prioritizes Opus > Sonnet > Haiku within same generation
- Season switcher on leaderboard
- Admin panel for manual season management

### Variable Endpoints
- `/@user/archetype` — pull a user's build by archetype (e.g. `curl goodgame.md/@tron/gofast`)
- Existing `/@name` and `/@name@version` preserved
- Browser detection redirects to web UI

### Build URLs
- Changed from `/build/41` (numeric ID) to `/build/blitz` (slug name)
- All API endpoints accept both ID and name
- SEO meta tags updated

### Engagement
- **Fork/remix** — one-click fork with attribution, fork count displayed
- **Trending** — builds sorted by pull velocity (last 7 days)
- **Build of the Week** — auto-featured build (score 40% + pulls 30% + votes 30%)

### Discovery
- **Search** — search builds by name, title, author, description
- **Compare** — side-by-side build comparison with score deltas and autocomplete
- **Archetype Quiz** — 5 questions to find your archetype
- **Archetype Detail Pages** — philosophy, strengths, weaknesses, top builds per archetype
- **Related Builds** — shown on build detail (same archetype, ranked by score)
- **Public User Profiles** — `/user/@username` with all published builds

### Creator Tools
- **Embed Badge** — SVG badge for READMEs with one-click markdown copy
- **Version Diff** — API endpoint for comparing build versions
- **Tags** — database support for build tags

### Content
- **Provenance Tags article** — convention for behavioral git blame
- Blog article admin (create/edit/delete via admin API)

### Technical
- Rate limiting — 30 writes/minute per IP
- RSS feed at `/feed.xml`
- Install command updated to `goodgame.md` (not `CLAUDE.md`)

### UX Polish
- Mobile hamburger nav (collapses on <768px)
- Mobile card view for leaderboard (terminal table on desktop)
- Compare page stacks vertically on mobile
- Build content truncated with expand/collapse
- `t-dim` color bumped from #404040 to #666666 for readability
- Article XSS fix — HTML escaped before rendering
- Responsive font sizes and spacing throughout
- Submit textarea reduced from 18 to 10 rows
- Footer shows "BUILT WITH @BLITZ"

### Project Setup
- Added `CLAUDE.md` with project instructions
- Added `goodgame.md` behavioral file (@blitz — COMBO archetype)
- Added `ROADMAP.md` with 5-priority roadmap
- Fixed `.gitignore` (was malformed)
