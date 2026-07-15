# Campaign Operations Build Reveal

## Outcome

Build a compelling Campaign Operations workspace inside Campaign Factory that takes a campaign brief and makes the next operational work legible: audiences, contacts, email drafting, review, and a demo-safe outbox. The surface should look and feel like the existing product while proving a useful end-to-end slice. It is a separate OpenClaw coding demonstration, not part of the Campaign Factory LangGraph runtime.

The conference audience should understand within seconds: what this campaign is trying to achieve, who needs to be moved, what message is being prepared, what is waiting for human approval, and what the system can or cannot actually send.

## Required execution order

1. Read the repository instructions and inspect the existing product and visual implementation.
2. Fetch the remote and confirm the clean base is `origin/factory/multi-agent-build`.
3. Before feature code, search open issues for this scope. If no matching issue exists, open one in `CampaignLab/campaign-factory` titled **Campaign Operations: turn a campaign brief into an actionable workspace**. The issue must contain:
   - user/demo outcome
   - proposed information architecture and interaction flow
   - working-now versus coming-soon boundary
   - implementation slices
   - acceptance and verification checklist
   - safety/truth-label requirements
4. Record the issue URL and number in `PROGRESS.md`.
5. Create a feature branch from `origin/factory/multi-agent-build`, named `openclaw/issue-<number>-campaign-operations`.
6. Implement, verify, commit, and push coherent slices. Never work directly on the base branch.

You are explicitly authorized to create and update the scoped GitHub issue and push your feature branch. Do not merge or deploy.

## Product shape

Prefer a new, clearly named route such as `/operations`. Reuse the existing shell, typography, components, tokens, and campaign language rather than creating a separate design universe.

Design the experience around one campaign brief flowing into operational work:

1. **Campaign header and brief context**
   - Campaign outcome, place, current operational stage, and one clear next action.
   - A compact “Demo workspace” truth label where fixture/local data is used.
   - Brief context should remain visible or easy to recover without dominating the tool.
2. **Audience and contact work**
   - Useful audience segments with contact counts and readiness, not vanity metrics.
   - A functional way to select/filter a segment or contact set using local demo state.
   - Contact import/integration may be “Coming soon”, but the empty and disabled states must explain the path forward.
3. **Email drafting and review**
   - Editable subject and message content, audience context, and a readable preview.
   - A human approval step with clear draft, needs review, approved, and queued/demo states.
   - Preserve campaigner-readable provenance or verification warnings where claims need review.
4. **Demo-safe outbox and activity**
   - A useful queue/outbox view and truthful local-only status transitions.
   - Never say “sent” or “delivered” unless a real integration exists. Prefer “Approved”, “Queued for demo”, or “Not connected”.
   - A restrained activity record based only on actions actually taken in the UI.

The exact layout is yours to shape after inspecting the existing app. Avoid a generic admin template. Lead with campaign outcome and human decisions, not a permanent monitoring console.

## Working slice

Implement a coherent client-side demo using clearly labeled fixtures and local component state or `localStorage`. It should support, at minimum:

- opening the seeded campaign operations workspace
- choosing an audience/contact segment
- editing an email subject and body
- switching between compose and preview
- marking the draft ready for review and approving it through an explicit human action
- placing the approved draft into a clearly labeled demo/local queue
- resetting the demo state
- preserving relevant state across a refresh if practical

Use `Coming soon` for genuinely unbuilt integrations such as real provider connection, real contact import, delivery analytics, or production scheduling. Disabled controls require concise explanatory copy. Do not create fake success to make the demo look complete.

## Visual and interaction bar

- Match `PRODUCT.md` and the existing light Campaign Factory surface: large plain headings, selective serif italics, black pill actions, thin borders, generous rhythm, restrained pastel accents.
- Build one strong task hierarchy. Do not make every section an equal card.
- Avoid hero metric tiles, decorative glassmorphism, neon terminal styling, gradient text, side-stripe accents, and repeated icon-card grids.
- Use familiar product controls and consistent states: default, hover, visible focus, active, disabled, loading where relevant, and clear errors.
- Status must not depend on colour alone.
- Make the main demo flow usable on a conference laptop and structurally responsive on smaller screens.
- Respect `prefers-reduced-motion`; motion should explain state and use transform/opacity rather than layout animation.
- Keep labels and instructions plain enough for a nontechnical campaigner.

## Technical boundaries

- Work primarily in `web/`; use the installed Next.js documentation for framework-specific decisions.
- Prefer existing packages and primitives. Avoid a dependency unless it materially improves the working slice.
- Do not add a database migration, live email provider, new secret, background job, production API mutation, or changes to the LangGraph worker.
- Do not overwrite or entangle current production behavior.
- Do not add generated test results or screenshots to Git unless intentionally documented and useful.

## Acceptance criteria

- A discoverable Campaign Operations route renders successfully and feels native to the existing project.
- The complete local demo path works: choose audience, edit draft, preview, request review, approve, queue locally, reset.
- Working, demo/local-only, and coming-soon behavior are visually and textually distinct.
- No UI claims that email was sent or delivered.
- External action remains explicitly human-approved.
- Keyboard focus is visible; primary controls are labeled; layout has a credible small-screen structure.
- Existing relevant routes remain intact.
- `npm run build` passes from `web/`.
- Lint/tests are run where relevant, with any pre-existing failures distinguished from new failures.
- The route is inspected in a real browser if available, at desktop and a narrow viewport; obvious overflow and interaction defects are fixed.
- The issue has a concise milestone update when a coherent slice is pushed.
- `PROGRESS.md` contains the issue URL, branch, current commit, verification, honest limitations, and next step.

## Definition of done

The feature branch is pushed and reviewable, the issue accurately describes what exists, and a fresh build plus browser inspection finds no known blocker in the core demo path. Stop short of merge and deployment.
