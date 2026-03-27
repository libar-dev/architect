@architect
@architect-release:v1.0.0
@architect-status:active
@architect-product-area:DeliveryProcess
Feature: v1.0.0 - Package Extraction Release

  First independent release of @libar-dev/architect as a
  standalone package.

  **Summary - TODO - releases should have minimal content and primarily serve to "instantiate" release/phase annotations:**

  This release marks the extraction of Architect from the
  convex-event-sourcing monorepo into an independent package ready
  for standalone publication.

  **Highlights:**

  - Scanner/extractor/generator pipeline for pattern documentation
  - TypeScript-sourced taxonomy with Zod validation (no JSON dependencies)
  - FSM-enforced workflow (roadmap → active → completed)
  - Process Guard linter for file protection
  - Configurable tag prefix support (`@architect-*` or custom)
  - Self-documentation infrastructure (dog-fooding)
  - 11 section renderers and pluggable generator architecture
  - Gherkin scanner for dual-source extraction (code + feature files)

  **Package Scripts:**

  - `pnpm docs:all` - Generate all documentation
  - `pnpm validate:all` - Validate patterns, DoD, and anti-patterns
  - `pnpm test` - Run all tests (3000+ pass)

  **Breaking Changes:**

  None (initial package release)

  **Migration Notes:**

  Consumers previously importing from the monorepo should update their
  package.json to reference `@libar-dev/architect@1.0.0`.
