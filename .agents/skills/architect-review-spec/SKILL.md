---
name: architect-review-spec
description: MANDATORY when the user mentions reviewing an Architect design-level spec, finding gaps in a spec, checking deliverables, scope-validate state, dep-tree blockers, or spec-implementation readiness — even if they just say "review" in the context of `architect/specs/` or a pattern name. Also triggers on: gap analysis, deliverable-path correctness, type-reuse checks against shared/, ephemeral-readiness verification, overlap between concurrent Architect specs, or reviewing idea/candidate-tier specs against the four-tier ladder shape. Output is a compact gap list — do NOT rewrite the spec. Do NOT use for: design-tier rewrites — output is a gap list, not a spec edit; route gap fixes back to architect-design-session. Also do NOT use for generic PR code review, OpenAPI review, security audits, dependency audits, or Figma design review. Invoke BEFORE any Read/Glob/Grep on architect-scoped paths — the Data API (CLI / MCP) is the canonical source.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Design-Spec Review Session

Find gaps. Do **not** rewrite content. Do **not** generate enriched session
prompts. The spec itself is what implementers consume — your job is to make
sure it's complete enough to consume.

> **Scope note.** This skill reviews **specs before implementation** —
> gap-finding so the implementer has a complete prompt. To review
> **completed implementations** (verify value transfer + decide on
> batched spec deletion), use `architect-review-implementation`
> instead. The two skills do not overlap; pick by lifecycle phase.

## Doctrine references

When the gap-finding checklist below requires judgment about Gherkin
authoring or pattern-relationship conventions, defer to the canonical
shared references:

- [`../_shared/canonical-references.md`](../_shared/canonical-references.md)
  — anti-anecdote rule + index of authoritative sources.
- [`../_shared/rule-block-template.md`](../_shared/rule-block-template.md)
  — when Rule blocks belong in a spec; the 4-field template; tier
  guidance.
- [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md) —
  tier table (already referenced below).
- [`../_shared/spec-pattern-relationships.md`](../_shared/spec-pattern-relationships.md)
  — bipartite production↔test pattern conventions; the
  `*ExecutableTests` escape hatch when reviewing a "spec for shipped
  code" candidate.

## Pre-flight

```bash
pnpm architect:query overview
pnpm architect:query scope-validate <pattern> implement     # gate: PASS / WARN / BLOCKED
pnpm architect:query context <pattern> --session implement
pnpm architect:query dep-tree <pattern>
pnpm architect:query arch blocking
pnpm architect:query files <pattern> --related
```

**Tier note.** `scope-validate` only accepts `design` and `implement` — there
is no `scope-validate <pattern> idea` or `... candidate`. For idea-tier and
candidate-tier reviews, skip the CLI gate and use the structural checklist
below instead. The full ladder lives at
[`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md).

### Idea/candidate-tier structural checklist (no CLI verb)

When the spec under review sits in `architect/specs/ideas/` /
`architect/specs/candidates/` or is otherwise presented as idea/candidate-tier,
walk this list
instead of running `scope-validate`:

- **File location matches maturity.** Idea-tier files live under
  `architect/specs/ideas/`; candidate-tier files under
  `architect/specs/candidates/`. Mismatch is a gap.
- **Five-tag authored baseline present.** `@architect`, `@architect-pattern`,
  `@architect-status`, `@architect-product-area`, `@architect-parent`. Missing
  any is a gap. Epic/slice variants add a 6th `@architect-level` tag and may
  omit `@architect-parent`. Authored `@architect-maturity` is itself a gap
  because maturity is derived, not authored.
- **Epic/slice level carve-out.** A file with @architect-level:epic or @architect-level:slice does NOT require @architect-parent — the parent requirement applies to leaf ideas only.
- **Line budget honoured.** Idea: ≤30 lines (warn-only). Candidate: 30-80 lines.
  Over-budget is a "premature promotion" gap — flag it.
- **No deliverables table, no phase/effort/priority/release tags at idea
  tier.** Their presence is a "premature plan-tier metadata" gap.
- **Rules carry `**Invariant:**` only at idea tier.** Adding `**Rationale:**`
  or `**Verified by:**` at idea tier is a gap (those are plan-tier additions).
- **Candidate tier carries `**Open Questions:**` and 1-2 happy-path
  scenarios.** Missing the open-questions block is the most common gap.
- **No retroactive idea spec for shipped code.** If the pattern already has
  production code, the idea spec is the wrong artifact — flag it as a
  "retroactive spec" gap.

## What to check (the gap-finding checklist)

1. **Normative source coverage.** Read the redesign doc, ADR, or brief that
   the spec was derived from. Are all types, constants, and constraints
   defined there represented in the spec's deliverables? Grep for them in the
   referenced files.
2. **Deliverable path correctness.** Each file path in the Background table
   must exist (or be a path the spec explicitly creates). Check with
   `pnpm architect:query files <pattern>` and direct file existence. A typo here ships
   broken implementation.
3. **Type reuse.** Search for existing types that overlap the spec's proposed
   types. If the same Zod schema or interface already exists somewhere in
   `packages/`, the spec should reference and reuse it, not redefine it.
4. **Dependency chain.** `pnpm architect:query dep-tree <pattern>` — is anything
   blocking? `pnpm architect:query arch blocking` shows the global blocker view. A spec
   whose dependency is `roadmap` and not implemented yet is not ready.
5. **Scope-validate state.** PASS = ready. WARN = author missed something
   recoverable. BLOCKED = upstream dependency or invariant violation.
6. **Implied file modifications.** Does the normative source imply changes to
   files the Background table doesn't list? Common miss: a new type in
   `shared` that requires a barrel re-export.
7. **Edge cases vs scenarios.** For each Rule, are there scenarios that
   exercise both the happy path and at least one error / boundary case?
8. **Stub completeness.** Does every architecturally-relevant pattern in the
   deliverables have a stub? Stubs are required for shape decisions, not for
   trivial functions.
9. **Overlap with concurrent specs.** If two specs in the same phase modify
   the same files, that's a sequencing hazard. Surface it.
10. **Ephemeral readiness.** When this spec is implemented and deleted, will
    the value transfer cleanly? Specifically: does every rule have an
    `**Invariant:**` (so it can become an executable Rule block)? Does every
    architectural decision have enough rationale to become a JSDoc annotation?
    A spec that won't transfer cleanly is a spec that will leave debt behind.

## Output format (compact, no rewrites)

```
**Gaps found in <PatternName> design spec**

1. <gap>: <one-sentence description> — owner: <which deliverable>
2. <gap>: <one-sentence description> — owner: <which deliverable>
...
```

If you found nothing: say so in one sentence. Do not generate a "looks good"
report with elaborate restating.

## Anti-patterns (stop)

- **Rewriting the spec.** Not your job. Surface the gap; let the design-tier
  author fix it.
- **Generating wrapper or enriched-prompt documents.** The spec is the prompt.
  Do not write a "session-prep" or "implementation-checklist" markdown.
- **Implementing what's missing.** This is a review session. Do not start
  coding. If a deliverable is unclear, the gap is "deliverable unclear" —
  not "I'll figure it out and write it."
- **Reading source files via Read/Glob/Grep before the CLI bootstrap.** The
  Data API is faster, more accurate, and more compact than file scanning. Use
  `pnpm architect:query files <pattern>` and `pnpm architect:query dep-tree
  <pattern>` first.

## Do not

- Do not transition the FSM in this session.
- Do not delete the design spec — that's the implement-spec session, after
  value transfer.
- Do not paraphrase the spec back as a "summary." Surface gaps only.
