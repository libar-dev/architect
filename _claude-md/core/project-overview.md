### Project Overview

Code-first documentation and delivery process toolkit. Extracts patterns from TypeScript and Gherkin sources using configurable annotations, generates LLM-optimized markdown and Mermaid architecture diagrams, and validates delivery workflow via pre-commit hooks.

**Core Principle:** Code is the single source of truth. Generated documentation is a projection of annotated source code.

**Key Capabilities:**

- Pattern extraction from TypeScript JSDoc and Gherkin tags
- MasterDataset transformation with pre-computed views (O(1) access)
- Codec-based markdown generation with progressive disclosure
- FSM-enforced delivery workflow validation via pre-commit hooks

---

### Development Philosophy

**This package was extracted from a large monorepo** where it accelerates development by eliminating manually maintained documentation. It is published and consumed by that monorepo.

#### Why This Matters for Implementation Sessions

| Aspect    | Wrong Mental Model                    | Correct Mental Model                              |
| --------- | ------------------------------------- | ------------------------------------------------- |
| Scope     | "Build feature for small output here" | "Build capability for hundreds of files there"    |
| ROI       | "Over-engineered for this repo"       | "Multi-day investment saves weeks of maintenance" |
| Testing   | "Simple feature, basic tests"         | "Mission-critical infra, comprehensive tests"     |
| Shortcuts | "Good enough for this repo"           | "Must work across many annotated sources"         |

#### Reference Implementation Pattern

This package uses itself as the primary test case:

- `_claude-md/validation/process-guard.md` → compact AI context
- `docs/PROCESS-GUARD.md` → detailed human reference

Both generated from the SAME annotated sources. When the POC succeeds here, the pattern applies to the entire monorepo.

#### Session Planning Principle

Features are planned for **reusability across the monorepo**, not for minimal output in this package.

---

### Target Monorepo

**Location:** `~/dev-projects/convex-event-sourcing/libar-platform`

The package is actively used as a dev dependency. The monorepo contains:

| Component                 | Purpose                                                                    |
| ------------------------- | -------------------------------------------------------------------------- |
| `packages/platform-*`     | 6 platform packages with annotated TypeScript sources                      |
| `delivery-process/specs/` | Tier 1 roadmap specifications                                              |
| `docs-living/`            | Generated documentation output (patterns, phases, requirements, decisions) |

**Manual docs being replaced:** `~/dev-projects/convex-event-sourcing/docs/` contains 150+ manually maintained files including architecture decisions, pattern theory, roadmap phases, and project management docs—all candidates for code-first generation.

#### What Gets Generated

| Output Type                  | Purpose                                    |
| ---------------------------- | ------------------------------------------ |
| `PATTERNS.md` + detail pages | Pattern registry from annotated TypeScript |
| `ROADMAP.md` + phase files   | Roadmap from Tier 1 feature specs          |
| `REMAINING-WORK.md`          | Outstanding work summary                   |
| `CURRENT-WORK.md`            | Active work tracking                       |
| `DECISIONS.md` + ADRs        | Architecture decision records              |
| `BUSINESS-RULES.md`          | Business rules from Gherkin                |

---

### Why No Shortcuts

Every shortcut in this package ripples across:

- Multiple platform packages with annotated sources
- Many Gherkin feature specifications
- All generated documentation files

**Test rigor matches mission-critical status.** A bug in the codec system means many files generate incorrectly. A gap in the extractor means patterns are missed across source files.

The validation in this repo is a **proof of concept**. When it succeeds here, the same validation applies to the entire monorepo's delivery workflow.
