# 01 — Conformance

> **Architect Spec v0.2.0** — Conformance levels, versioning, and keyword conventions.

---

## Keyword Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT",
"RECOMMENDED", "MAY", and "OPTIONAL" in this specification are to be interpreted as described
in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

**Normative** sections define requirements. **Informative** sections provide context,
rationale, or examples and are marked with _Informative_ labels or presented as block quotes.

## Conformance Levels

This specification defines three conformance levels. Each level is a strict superset of the
previous — a Level 2 implementation also satisfies Level 1.

### Level 1: Minimal

**Purpose:** Architecture metadata on standard Gherkin files.

A Level 1 conformant artifact:

1. MUST be a valid Gherkin file parseable by the [Cucumber Gherkin parser](https://github.com/cucumber/gherkin)
2. MUST contain the `@architect` gate tag before the `Feature:` keyword
3. MUST contain an `@architect-pattern:<Name>` tag with a PascalCase pattern name
4. MUST contain an `@architect-status:<state>` tag with one of: `candidate`, `roadmap`, `active`, `completed`, `deferred`
5. SHOULD contain a `Feature:` title in the format `PatternName - Description`
6. MAY contain additional `@architect-*` tags from the tag registry (§04)

> _Informative:_ The `candidate` status is specifically for specs in the refinement track
> (pre-acceptance). Candidate specs have reduced structural requirements — they MAY omit
> the deliverables table, full rule metadata, and scenario subtype tags. See §08.

**What Level 1 enables:** Any conforming parser can extract pattern names, statuses, and
relationships from tagged Gherkin files. This is sufficient for basic architecture inventories
and dependency tracking.

### Level 2: Standard

**Purpose:** Full architecture-connected specifications with queryable structure.

A Level 2 conformant artifact satisfies all Level 1 requirements AND:

1. MUST contain all required tags for its artifact type (see §02 and §04)
2. MUST contain a `Background: Deliverables` section with a data table (see §05)
3. MUST contain at least one `Rule:` block (for feature specs and ADRs)
4. Each `Rule:` block MUST contain `**Invariant:**`, `**Rationale:**`, and `**Verified by:**` metadata
5. Each `Scenario:` MUST be tagged with `@acceptance-criteria` and one of `@happy-path`, `@validation`, or `@edge-case`
6. The `@architect-status` tag MUST reflect a valid FSM state (see §09)
7. All `@architect-uses` references MUST name patterns that exist in the project
8. TypeScript stubs (§07) MUST use JSDoc `@architect-*` annotations with `@architect-implements` and `@architect-target`

**What Level 2 enables:** A complete pattern graph with pre-computed views, machine-extractable
business rules, deliverable tracking, and the full tag system. This is sufficient for
documentation generation, dependency analysis, and AI context assembly.

### Level 3: Full

**Purpose:** Enforced delivery process with projections and AI context.

A Level 3 conformant implementation satisfies all Level 2 requirements AND:

1. MUST implement the FSM state machine with valid transitions (§09)
2. MUST enforce protection levels: scope-locked for `active`, hard-locked for `completed`
3. MUST implement ProcessGuard rules for at least: completed-protection, scope-creep, invalid-status-transition
4. MUST produce a pattern graph data structure conforming to the schema in §10
5. SHOULD produce at least the following projections: patterns inventory, business rules, decisions, architecture overview
6. MAY produce session-aware AI context bundles

**What Level 3 enables:** Full delivery lifecycle enforcement with scope-creep prevention,
generated documentation, and AI agent context delivery.

## Conformance Summary

| Requirement                        | Level 1 | Level 2 | Level 3 |
| ---------------------------------- | ------- | ------- | ------- |
| Valid Gherkin                      | MUST    | MUST    | MUST    |
| Gate tag (`@architect`)            | MUST    | MUST    | MUST    |
| Pattern name and status            | MUST    | MUST    | MUST    |
| Full tag set per artifact type     | MAY     | MUST    | MUST    |
| Deliverables table                 | MAY     | MUST    | MUST    |
| Rule/Invariant/Rationale structure | MAY     | MUST    | MUST    |
| Scenario tags                      | MAY     | MUST    | MUST    |
| Valid FSM transitions              | —       | MUST    | MUST    |
| FSM enforcement (ProcessGuard)     | —       | —       | MUST    |
| Protection levels                  | —       | —       | MUST    |
| Pattern graph generation           | —       | —       | MUST    |
| Documentation projections          | —       | —       | SHOULD  |
| AI context bundles                 | —       | —       | MAY     |

## Versioning

This specification follows [Semantic Versioning 2.0.0](https://semver.org/):

- **Major** (1.0.0): Breaking changes to required format or data model
- **Minor** (0.2.0): New optional features, new tags, new conformance requirements
- **Patch** (0.1.1): Clarifications, typo fixes, non-normative changes

The current version is **0.2.0** (Draft) — a working draft. Breaking changes are expected before 1.0.0.

## Extension Points

Projects MAY extend this specification in the following ways:

1. **Custom tags** — Add project-specific `@architect-*` tags to the tag taxonomy.
   Custom tags MUST use the configured tag prefix and MUST NOT conflict with tags
   defined in the standard registry (§04).

2. **Custom role sets** — Define project-specific role configurations that set default
   tag values, role hierarchies, and validation rules.

3. **Custom projections** — Produce additional generated documents beyond those specified
   in Level 3.

4. **Custom ProcessGuard rules** — Add enforcement rules beyond the standard six.

Extensions MUST NOT alter the semantics of standard tags or structures defined in this spec.
