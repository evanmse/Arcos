# Design Brief — Integreat

## Context

**Integreat** is an early-stage B2B SaaS startup helping European fintech companies (BNPL, payments, lending, crypto, insurance, trading) reach compliance with the **EU AI Act, DORA, and RGPD** before the **2 August 2026** high-risk deadline.

The product connects to a customer's stack (GitHub, Jira, Google Drive, Teams), scans their AI systems, surfaces compliance gaps against Annex III obligations, runs adversarial tests in a sandbox, and outputs an audit-ready governance policy + Jira action plan + insurance quote.

Customers: Heads of Compliance, CTOs, and AI/ML leads at fintech companies (50–500 employees) across France and the EU.

A rough HTML wireframe of the current 5-step flow is attached (`arcos_demo.html`). Treat it as a wireframe, not a design reference — re-skin everything. The placeholder name "ARCOS" should be replaced with **Integreat** wherever it appears.

---

## What I need from you

### 1. Brand identity for Integreat

- **Naming rationale**: "integrate" + "great" — a tool that *integrates* AI governance into a fintech's stack and makes compliance feel achievable rather than dreadful.
- **Positioning**: We are not another dusty audit firm. We are *regulator-grade trust + builder-grade speed*. Serious, but built by and for engineers.
- **References for tone**: Linear (precision), Stripe (clarity), Vanta (trust without being sterile).
- **Deliverables**:
  - Full logo lockup (mark + wordmark)
  - Mark only (square, for app icon / favicon)
  - Monochrome variant
  - Primary + secondary/accent color palette
  - Typography pairing: display, UI/body, monospace (we surface a lot of code & logs)
  - Short brand rationale (≤ 1 page)

### 2. Redesigned UI for the 5-step wizard

| # | Step | Core elements |
|---|------|---------------|
| 1 | **Profile** | Company info form, AI system to evaluate (GitHub URL + system type), connected data sources, regulatory deadline alert |
| 2 | **Scanning** | Live analysis with terminal-style log, counters (deps, AI components, tickets), progress bar, status |
| 3 | **Risk map** | Compliance score (numeric ring) + classification, active regulations panel, risk heatmap (obligations × AI systems) with click-to-drill on HIGH cells |
| 4 | **Sandbox** | Adversarial test results (bias / prompt injection / robustness / data leakage), priority fixes with projected score impact |
| 5 | **Compliance output** | Cert-readiness gauge (current vs post-fix), generated policy PDF preview, Jira epics list, insurance quote card |

### 3. Connectors on Step 1

The active data-source connectors are: **GitHub, Jira, Google Drive, Microsoft Teams**. All four are functional — design them as fully active states (no "coming soon" badges, no greys).

### 4. Universal UX rule — applies to the whole app

**Never grey out or lock unavailable features. Hide them entirely.**

No disabled chips, no "+ coming soon" placeholders, no greyed buttons, no locked states anywhere. If a feature isn't shipped, it doesn't exist in the UI. The product must feel complete at every step.

---

## Constraints

- Web app, desktop-first (≈ 900–1100px content width is fine), with at least the 2 most important screens adapted to tablet
- The current demo is dark-mode — you decide whether to keep dark-first, ship light + dark, or pivot to light-first
- Premium and serious (this is regulatory work) but never bureaucratic — fintech founders are the buyer
- High information density: the design must handle dense data tables, heatmaps, code logs, and PDF previews gracefully

---

## Deliverables

- Figma file containing:
  - Brand system page (logo, colors, type, spacing, radii, components)
  - Component library (buttons, inputs, chips, cards, tables, charts, log viewer, gauge, heatmap)
  - All 5 screens, polished
  - 1–2 tablet adaptations
- Logo files: SVG, PNG @1x/2x, favicon
- Design tokens (JSON or Figma variables) ready for frontend handoff
- 1-page rationale on brand + key design decisions
