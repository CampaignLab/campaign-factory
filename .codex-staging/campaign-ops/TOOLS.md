# TOOLS.md

## Repository

- Local clone: `/root/.openclaw/workspace/campaign-ops/campaign-factory`
- GitHub: `CampaignLab/campaign-factory`
- Base branch: `origin/factory/multi-agent-build`
- Feature branch prefix: `openclaw/`
- `gh` is authenticated as `sugaroverflow` with repository access.

## App

- Next.js app: `campaign-factory/web`
- Read `campaign-factory/web/AGENTS.md` before editing Next.js code.
- The app uses Next.js 16.2.10 and may differ from familiar Next.js conventions. Read the relevant installed guide under `web/node_modules/next/dist/docs/` before relying on framework assumptions.

## Operating boundary

The server's scheduler and OpenClaw configuration are managed outside this agent. Do not change them. Do not inspect or print secrets.
