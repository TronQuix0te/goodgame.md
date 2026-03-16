# goodgame.md

## What This Is
A registry and leaderboard for Claude Code behavioral disposition files. Live at https://goodgame.md.

## Tech Stack
- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (better-sqlite3, WAL mode)
- **AI:** Anthropic Claude API (Sonnet for judging)
- **Auth:** GitHub OAuth + JWT (legacy username auth still supported)

## Project Structure
Monorepo: `client/` (React SPA) and `server/` (Express API).

## Build & Run
```bash
# Dev
cd client && npm run dev       # Vite dev server
cd server && npm run dev       # tsx watch

# Production
cd client && npm run build     # Vite build
cd server && npm run build     # tsc to dist/
sudo systemctl restart goodgame
```

## Key Architecture
- `server/src/champion.ts` — curl endpoint (/@name, /@user/archetype)
- `server/src/judge.ts` — AI scoring engine (5 dimensions)
- `server/src/services/season-service.ts` — auto-creates seasons when new Claude models drop
- Seasons auto-detect new Anthropic releases via API polling (on boot + daily)
- Champion crowning is automatic (recalculates on every score change)

## Deployment
- Service: `/etc/systemd/system/goodgame.service`
- Nginx proxies goodgame.md → localhost:3002
- DB: `/home/tron/goodgame/server/data/goodgame.db`
- Logs: `sudo journalctl -u goodgame -f`

## Behavioral Disposition
@goodgame.md

## Workflow Rules
- **Update CHANGELOG.md after completing a task.** Add a dated entry at the top.
- Test builds compile before deploying (`npx tsc --noEmit`)
- Restart service after deploy: `sudo systemctl restart goodgame`
