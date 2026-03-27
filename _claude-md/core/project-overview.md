### Project Overview

Context engineering platform with extraction pipeline and typed codecs. Extracts patterns from TypeScript and Gherkin sources using configurable annotations, generates LLM-optimized markdown and Mermaid architecture diagrams, and validates delivery workflow via pre-commit hooks.

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

Both generated from the SAME annotated sources. Features are planned for **reusability across the monorepo**, not for minimal output in this package.
