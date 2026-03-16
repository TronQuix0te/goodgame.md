# goodgame.md — Roadmap

> North star: The HTTP GET endpoint returning raw markdown must stay fast, cheap, and reliable above everything else. No telemetry flows up from endpoint pulls — they are anonymous by design. That is a trust feature, not an oversight.

---

## Priority 1: Variable Team Endpoints

Extend the existing `curl /@username` endpoint to support team and archetype routing:

```
curl goodgame.md/@tron/gofast           # personal build by archetype
curl goodgame.md/@acme/gofast           # team-approved GOFAST build
curl goodgame.md/@acme/carol/control    # specific member's archetype within team
```

- Each route returns raw markdown only
- No auth required for public builds
- Must be extremely fast — this is in the hot path of every developer session

---

## Priority 2: Teams Feature

**New database tables:**

```sql
teams (id, slug, name, owner_id)
team_members (team_id, user_id, role)
team_approved_builds (team_id, build_id, archetype)
```

- Team admin can approve or revoke which builds are active per archetype
- Individual team members pick their preferred archetype from the approved menu
- Team endpoint serves only admin-approved builds
- A developer can run TEMPO while their colleague runs CONTROL — both pulling from the same team account
- Analytics showing archetype distribution across the team (e.g. senior devs skew CONTROL, juniors skew GOFAST)

---

## Priority 3: Seasons — Model Version Tracking

```sql
ALTER TABLE scores ADD COLUMN model_version TEXT; -- e.g. "sonnet-4-5", "opus-4"
```

- Every score is tagged with the Anthropic model it was judged against
- When Anthropic ships a new model, trigger a re-score job on all active builds
- Previous season scores are frozen and preserved, never overwritten
- Leaderboard defaults to current season with a season switcher UI
- Same build can have different scores across seasons — that delta is surfaced and visible
- **Core differentiator:** goodgame.md is the only place tracking behavioral performance across model generations

---

## Priority 4: Provenance Tags — Convention + Documentation

No backend needed. This is a convention the platform documents and promotes.

When Claude Code writes or modifies code, it appends a comment block:

```
# @goodgame gofast:tron | sonnet-4.5 | 2026-03-14
# reasoning: chose JWT for statelessness, refresh tokens explicitly deferred to v2
```

This is like git blame but with behavioral and reasoning context. It tells the next developer (or Claude session) not just who wrote it and when, but *how* it was built and what was consciously left out.

**Deliverables:**
- A copyable CLAUDE.md snippet on the site that users can drop into their own projects
- A documentation page explaining the convention and why it matters
- The snippet should instruct Claude to append the tag automatically when writing or modifying code, capturing archetype, model version, date, and a one-two sentence reasoning summary

---

## Priority 5: Monetization Tiers — Design Only (No Payments Yet)

Structure the UI and database to support these tiers:

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Browse, copy, public endpoint pulls, community leaderboard |
| **Pro** | $9-15/mo | Private builds, personal Pick Rate analytics, season champion alerts |
| **Teams** | TBD | Shared team endpoint, archetype governance, admin approval, team analytics |

**New metric — Pick Rate:**
How often an endpoint URL is actively pulled in a live session, distinct from Copy Count (manual copies). The gap between these two numbers is meaningful data.

---

## What's Already Built
- AI judging system (5 dimensions: archetype purity, consistency, token efficiency, signal density, clarity)
- 5 archetype categories (GOFAST, CONTROL, MIDRANGE, TEMPO, COMBO)
- Leaderboard with seasons
- Build versioning
- Voting system
- Blog/articles
- SEO injection
- CLI distribution via `curl /@username`
- GitHub OAuth + JWT auth
