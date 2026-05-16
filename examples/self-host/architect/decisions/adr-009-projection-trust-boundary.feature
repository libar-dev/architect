@architect
@architect-adr:009
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-adr-layer:refinement
@architect-adr-theme:projections
@architect-pattern:ADR009ProjectionTrustBoundary
@architect-status:completed
@architect-see-also:ADR005CodecBasedMarkdownRendering,ADR006SingleReadModelArchitecture
Feature: ADR-009 - Projection Trust Boundary and W7 Naming

  **Context:**
  The W7 simplification wave replaced the deleted presentation codec stack and
  dissolved query package with a Fragment / Projection / Renderer pipeline.
  The wave also renamed public projection entrypoints so exported names match
  fragment kinds and external callers use validated `parseAndProject*`
  boundaries.

  **Decision:**
  `parseAndProject*` functions are the raw-input trust boundary for external
  consumers. They parse options once, then call typed `project*` helpers.
  Projection builders construct typed fragments directly and do not re-parse
  their own outputs on hot paths.

  Generated Markdown has a separate content boundary: fragment text fields are
  plain text unless a renderer-owned block explicitly marks inline Markdown as
  trusted. Markdown renderers escape plain-text prose/list/link labels, validate
  outbound URL schemes, reject protocol-relative targets, and allow raw content
  only for intentional surfaces such as code fences and mermaid diagrams. The
  trusted-inline-Markdown escape hatch is renderer-private, not part of the
  shared fragment block schema. Emitted routed markdown files use a stricter
  path contract: root paths may be canonicalized, while child paths must already
  be canonical relative `.md` outputs; rejected or ambiguous internal child
  references fall back to plain text instead of links.

  Public names follow fragment-kind vocabulary. Current projection mappings are
  maintained in `packages/architect-projection/docs/MIGRATION.md`; public
  contract tests pin only canonical package surfaces.

  **Consequences:**
  | Type | Impact |
  | Positive | CLI, MCP, docs, and Studio share one projection pipeline |
  | Positive | Runtime hot paths avoid duplicate Zod walks after boundary validation |
  | Positive | Contract-freeze tests protect canonical public entrypoints |
  | Negative | Breaking package-surface changes require coordinated downstream updates |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Decision spec | complete | architect/decisions/adr-009-projection-trust-boundary.feature |

  Rule: Parse once at external projection boundaries

    **Invariant:** External callers use `parseAndProject*` entrypoints for raw
    options. Internal projection composition uses typed `project*` helpers and
    typed fragment builders.

    **Rationale:** Re-parsing projection outputs contradicts the trust-boundary
    contract and makes CLI/MCP hot paths pay for duplicate full-object walks.

    @acceptance-criteria @contract
    Scenario: Canonical public names stay explicit
      Given a canonical projection entrypoint remains public
      When contract-freeze tests run
      Then the canonical public name is pinned
      And raw internal helpers remain hidden from the top-level barrel when a validated entrypoint exists
