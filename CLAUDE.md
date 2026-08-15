# CLAUDE.md

Guidance for Claude Code when working in this repository.

## gstack skills

This project has [gstack](https://github.com/garrytan/gstack) (Garry Tan's Claude Code
setup) installed at `~/.claude/skills/gstack`. Invoke any tool below with `/<name>`
(e.g. `/autoplan`), or say `gstack` to let the router pick the right one.

### Planning & specs
- `/spec` — Turn vague intent into a precise, executable spec in five phases.
- `/office-hours` — YC Office Hours: shape and pressure-test an idea (two modes).
- `/plan-ceo-review` — CEO/founder-mode plan review.
- `/plan-eng-review` — Eng manager-mode plan review.
- `/plan-design-review` — Designer's-eye plan review (interactive).
- `/plan-devex-review` — Interactive developer-experience plan review.
- `/plan-tune` — Self-tuning question sensitivity for plan reviews.
- `/autoplan` — Auto-review pipeline: runs the CEO, design, eng, and DX reviews
  sequentially with auto-decisions.

### Review & QA
- `/review` — Pre-landing PR / diff review.
- `/qa` — Systematically QA a web app and fix the bugs found.
- `/qa-only` — Report-only QA testing (no fixes).
- `/investigate` — Systematic debugging with root-cause investigation.
- `/health` — Code quality dashboard.
- `/devex-review` — Live developer-experience audit.
- `/design-review` — Designer's-eye visual QA (finds and fixes UI issues).

### Shipping & deploy
- `/ship` — Ship workflow: merge base, run tests, bump VERSION/CHANGELOG, commit,
  push, open PR.
- `/land-and-deploy` — Land and deploy workflow.
- `/setup-deploy` — Configure deployment settings for `/land-and-deploy`.
- `/canary` — Post-deploy canary monitoring.
- `/landing-report` — Read-only queue dashboard for workspace-aware ship.
- `/document-release` — Post-ship documentation update.

### Design
- `/design-consultation` — Research the landscape and propose a full design system.
- `/design-html` — Generate production-quality Pretext-native HTML/CSS.
- `/design-shotgun` — Generate multiple AI design variants and compare them.
- `/diagram` — Turn English (or mermaid) into a diagram triplet.

### Browser & data
- `/browse` — Fast headless browser for QA and dogfooding.
- `/open-gstack-browser` — Launch AI-controlled Chromium with the sidebar extension.
- `/scrape` — Pull data from a web page.
- `/skillify` — Codify the last successful `/scrape` into a permanent browser-skill.
- `/setup-browser-cookies` — Import cookies from your real Chromium into the headless session.
- `/pair-agent` — Pair a remote AI agent with your browser.

### Docs & PDFs
- `/document-generate` — Generate missing documentation from scratch.
- `/make-pdf` — Turn any markdown file into a publication-quality PDF.

### Context & sessions
- `/context-save` — Save working context.
- `/context-restore` — Restore context saved by `/context-save`.
- `/retro` — Weekly engineering retrospective.
- `/learn` — Manage project learnings.

### Security & safety
- `/cso` — Chief Security Officer mode.
- `/careful` — Safety guardrails for destructive commands.
- `/guard` — Full safety mode (destructive warnings + directory-scoped edits).
- `/freeze` — Restrict file edits to a specific directory for the session.
- `/unfreeze` — Clear the freeze boundary set by `/freeze`.

### iOS
- `/ios-qa` — Live-device iOS QA for SwiftUI apps.
- `/ios-fix` — Autonomous iOS bug fixer.
- `/ios-design-review` — Visual design audit for iOS apps on real hardware.
- `/ios-clean` — Remove the DebugBridge SPM package and `#if DEBUG` wiring.
- `/ios-sync` — Regenerate the iOS debug bridge against latest gstack templates.

### Benchmarks & maintenance
- `/benchmark` — Performance regression detection using the browse daemon.
- `/benchmark-models` — Cross-model benchmark for gstack skills.
- `/codex` — OpenAI Codex CLI wrapper (three modes).
- `/setup-gbrain` — Set up gbrain (CLI + local brain + MCP) for this agent.
- `/sync-gbrain` — Keep gbrain current with this repo's code.
- `/gstack-upgrade` — Upgrade gstack to the latest version.

> Note: browser tools rely on Chromium. The gstack `./setup` browser download is
> blocked by this environment's network policy, so gstack is pointed at the
> pre-installed Chromium instead via `GSTACK_CHROMIUM_PATH=/opt/pw-browsers/chromium`
> (exported in the shell profile). With that set, the browser launches and runs.
> Reaching public websites is still limited by the environment's outbound network
> policy (the egress gateway returns 403 for non-allowlisted hosts), which affects
> `/browse`, `/qa`, `/scrape`, and `/design-review` against arbitrary sites.

## UI/UX Pro Max skills

[UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) v2.13.0 is
installed in-repo at `.claude/skills/`. These are model-invoked skills — they activate
on design intent rather than a slash command.

- `ui-ux-pro-max` — Orchestrator. Searchable catalogs of styles, palettes, font
  pairings, UX guidelines, icons, chart types, and 22 stack-specific guides.
- `design` — Brand identity, logos, corporate identity, banners, icons, social images.
- `design-system` — Three-layer design tokens (primitive → semantic → component).
- `brand` — Brand voice, messaging frameworks, style guides.
- `ui-styling` — shadcn/ui, Tailwind, responsive layout, dark mode, accessibility.
- `banner-design` — Banners for social, ads, web heroes, and print.
- `slides` — HTML presentations with Chart.js.

The catalogs are queried through a local Python script (no network, no API key):

```bash
# Full design-system recommendation for a project
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product> <industry>" --design-system -p "Name"

# Targeted lookup in one domain
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react
```

Two gaps to know about, both inherited from the upstream npm package:

- `banner-design`'s AI image-generation steps call the author's separate `ai-artist`,
  `ai-multimodal`, and `chrome-devtools` skills, which are not part of this package.
  Every other skill works standalone.
- `ui-styling/references/canvas-design-system.md` points at a `./canvas-fonts`
  directory that upstream excludes from the published package (5.8 MB of font
  binaries). Only the canvas/poster workflow touches it.
