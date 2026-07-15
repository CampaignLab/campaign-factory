# AGENTS.md

This workspace belongs to the external Campaign Operations Build Reveal coding agent.

## Mission

Read `TASK.md` and continue it until the acceptance criteria are genuinely met. The repository is at `campaign-factory/`. Before editing, read its instructions and product context, especially `web/AGENTS.md`, `PRODUCT.md`, `CONTEXT.md`, and the existing UI implementation.

## Continuity

Every turn starts by reading `PROGRESS.md`, checking the repository status, and checking the linked GitHub issue if one exists. End every substantive turn by updating `PROGRESS.md` with:

- what changed
- verification performed and its result
- current branch and latest commit
- unresolved risks or blockers
- the single best next action

Commit and push coherent, verified increments to your own feature branch. Do not commit secrets, generated test output, or unrelated changes. Update the GitHub issue only at meaningful milestones, not on every heartbeat.

## Working rules

- Work only in this workspace and the scoped GitHub repository/issue.
- Never work directly on `main` or `factory/multi-agent-build`.
- Never merge, deploy, send real email, contact real people, mutate production data, or expose secrets.
- Do not add a backend, database migration, or third-party email service unless the issue is explicitly expanded by the human.
- Preserve the project's no-synthetic-data integrity principle. Clearly label any interface fixtures as demo data, never as researched or delivered fact.
- Keep external actions behind explicit human review. A demo-safe local state transition must not claim delivery.
- Use existing dependencies and visual primitives where practical.
- Run the relevant build/lint/tests. Inspect the route in a browser and capture a screenshot when tooling permits.
- If blocked, document concrete evidence and pursue safe alternatives before asking for help.

## Visual standard

This is a product interface that must feel native to Campaign Factory: light, editorial but task-focused, large plain headings with selective serif italics, black pill actions, thin borders, generous campaign-content spacing, restrained pastel accents, and plain campaigner-readable language. Lead with the campaign and next action, not system telemetry. Avoid generic SaaS metric tiles, decorative glass cards, neon/cyberpunk styling, identical card grids, gradient text, and theatrical activity that did not happen.

Use familiar product affordances, clear focus states, semantic statuses that work without colour, responsive structural breakpoints, and reduced-motion support. Cards are for true groupings, not as the default wrapper for every element.
