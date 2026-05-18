# Skills IA Mapping — Doc-Gen Campaign Input

Scope: 18 hand-maintained markdown files under `.agents/skills/` (9 SKILL.md, 9 `_shared/*.md`). Total 2827 lines. Read-only analysis. Goal: identify the structure that a `WikiIndexDefinition` + `ContentFragment` doc-gen campaign should reproduce, and surface the duplications that ContentFragments at INPUT-disclosure depth can collapse.

---

## A. Per-file TOC inventory

Legend for content-type tags: `DATA` = mechanically derivable from PatternGraph / Zod / code; `DERIVABLE` = paragraph derivable from JSDoc/Gherkin Rule rationale; `EDIT` = genuine human framing; `ANTI` = "don't do this" list; `XREF` = pointers to sibling docs.

### A.1 Session skills (7 files, routing/intent-specific)

#### `architect-session-router/SKILL.md` (62 lines)

| Section                                                 | Type | Notes                                                                                               |
| ------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| (frontmatter + 1-line preamble)                         | EDIT | description string is itself routing data — Zod-derivable from trigger-verb registry if one existed |
| Step 1 — Choose session intent (mandatory, exactly one) | DATA | Intent table is the canonical router map; same shape as verify-handoff's "Recommended next" table   |
| Step 2 — Run the canonical bootstrap                    | XREF | Pure pointer to `architect-data-api` §"Pre-flight by session intent"                                |
| Step 3 — Hand off                                       | EDIT | 3 imperative sentences                                                                              |
| Do not                                                  | ANTI | 3 bullets                                                                                           |

#### `architect-plan-session/SKILL.md` (205 lines)

| Section                                                                  | Type        | Notes                                                                                                            |
| ------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| (preamble)                                                               | EDIT        | "single most common failure mode" framing                                                                        |
| Doctrine references                                                      | XREF        | 4 sibling links, each with 2-3-line summary                                                                      |
| Pre-flight                                                               | XREF        | Pointer to data-api §"Planning" + scope-validate carve-out restated                                              |
| Four-Tier Ladder                                                         | DATA + XREF | Restates 5-tag minimum (duplicates `four-tier-ladder.md`)                                                        |
| Idea-tier template (write exactly this shape, no more)                   | DATA        | Gherkin code block — derivable from tag registry + tier table                                                    |
| Epic / slice variants                                                    | DATA        | Two Gherkin code blocks                                                                                          |
| Candidate-tier delta (add only when promoting from idea)                 | DATA        | Gherkin code block + mechanical promotion delta                                                                  |
| Anti-patterns at idea tier (block these aggressively)                    | ANTI        | 5 inlined rules — explicitly tagged as duplicate of `formal-spec/08-spec-evolution.md` and `four-tier-ladder.md` |
| Additional anti-patterns (this skill, applies to all planning-tier work) | ANTI        | 2 bullets + retroactive-spec tripwire blockquote                                                                 |
| Promotion deltas                                                         | DATA + XREF | Subset of four-tier-ladder's promotion table                                                                     |
| Output for this session                                                  | EDIT        | 3 valid outcomes                                                                                                 |
| Do not                                                                   | ANTI        | 3 bullets                                                                                                        |

#### `architect-design-session/SKILL.md` (143 lines)

| Section                                                                  | Type             | Notes                                                                    |
| ------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------ |
| (preamble)                                                               | EDIT             | One-line scope framing                                                   |
| Doctrine references                                                      | XREF             | 4 sibling links with summaries                                           |
| Pre-flight (mandatory CLI bootstrap)                                     | XREF             | Pointer to data-api §"Design tier authoring" + stubs-have-no-verb caveat |
| Four-Tier Ladder (entering design tier)                                  | DATA + XREF      | Plan→Design delta restated                                               |
| Design-tier deliverables                                                 | DATA             | 5 bullets — derivable from tier table                                    |
| Stubs (ephemeral scaffolds — read this carefully)                        | EDIT + DERIVABLE | Stub lifecycle prose                                                     |
| Anti-drift tripwires (stop and redirect if you catch yourself doing any) | ANTI             | 7 numbered tripwires                                                     |
| Ephemeral spec principle (mandatory understanding)                       | DERIVABLE        | 4-step value-transfer mini-statement (duplicates `value-transfer.md`)    |
| Acceptance criteria for design tier                                      | DATA             | 2 CLI commands                                                           |
| Do not                                                                   | ANTI             | 4 bullets                                                                |

#### `architect-implement-spec/SKILL.md` (186 lines)

| Section                                 | Type             | Notes                                                        |
| --------------------------------------- | ---------------- | ------------------------------------------------------------ |
| (preamble)                              | EDIT             | Framing line                                                 |
| Value Transfer (concept)                | DERIVABLE + XREF | Concept paragraph restated from `value-transfer.md`          |
| (related references)                    | XREF             | 3 sibling links with summaries                               |
| Pre-flight (mandatory CLI bootstrap)    | XREF             | Pointer to data-api §"Implement"                             |
| Implementation order (strict)           | DATA             | 8 numbered steps with embedded CLI                           |
| Value transfer (verify before deletion) | XREF             | Restates 5-criterion gate pointer                            |
| Deletion (ask the user first)           | EDIT + DATA      | 2 outcomes + CLI commands                                    |
| Anti-patterns (stop and redirect)       | ANTI             | 4 bullets — overlaps with `value-transfer.md` §Anti-patterns |
| Big-gap escape hatch                    | EDIT             | Generic escape-hatch (mirrored in refactor-session)          |
| Do not                                  | ANTI             | 4 bullets                                                    |

#### `architect-refactor-session/SKILL.md` (240 lines — largest session skill)

| Section                                 | Type        | Notes                                                                |
| --------------------------------------- | ----------- | -------------------------------------------------------------------- |
| (preamble)                              | EDIT        | Premise framing                                                      |
| Premise — value transfer without a spec | DERIVABLE   | Inverts the value-transfer doctrine                                  |
| Doctrine references                     | XREF        | 7 sibling links — the widest XREF block in the corpus                |
| Pre-flight (mandatory CLI bootstrap)    | XREF        | Pointer to data-api §"Refactor" + scope-validate absence note        |
| Refactor order (strict)                 | DATA        | 6 numbered steps                                                     |
| Adapted invariant-carrier gate          | DATA        | 5-criterion gate (parallel to value-transfer.md's pre-deletion gate) |
| Multi-session campaign mode             | XREF + DATA | 4 bullets — partial restatement of `multi-session-coordination.md`   |
| Anti-patterns (stop and redirect)       | ANTI        | 6 bullets                                                            |
| Big-gap escape hatch                    | EDIT        | Mirrors implement-spec's escape hatch                                |
| Do not                                  | ANTI        | 6 bullets — overlaps heavily with Anti-patterns above                |

#### `architect-review-spec/SKILL.md` (152 lines)

| Section                                                | Type        | Notes                                               |
| ------------------------------------------------------ | ----------- | --------------------------------------------------- |
| (preamble + scope note)                                | EDIT        | Distinguishes from review-implementation            |
| Doctrine references                                    | XREF        | 4 sibling links                                     |
| Pre-flight                                             | XREF + DATA | Pointer to data-api §"Review" + tier-note carve-out |
| Idea/candidate-tier structural checklist (no CLI verb) | DATA        | 7 bullets — parallel to four-tier-ladder rules      |
| What to check (the gap-finding checklist)              | DATA        | 10 numbered checks — embedded CLI                   |
| Output format (compact, no rewrites)                   | DATA        | Markdown template                                   |
| Anti-patterns (stop)                                   | ANTI        | 4 bullets                                           |
| Do not                                                 | ANTI        | 3 bullets                                           |

#### `architect-review-implementation/SKILL.md` (156 lines)

| Section                                      | Type        | Notes                                                                                          |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| (preamble + scope note)                      | EDIT        | Distinguishes from review-spec                                                                 |
| Doctrine references                          | XREF        | 3 sibling links                                                                                |
| Pre-flight                                   | XREF + DATA | Pointer + per-pattern CLI loop                                                                 |
| Per-pattern verification (apply the gate)    | DATA        | 6-criterion gate (duplicates value-transfer.md's 5-criterion gate + adds graph-integrity step) |
| Output format                                | DATA        | Markdown table template                                                                        |
| Spec-deletion step (only if user authorizes) | DATA        | CLI commands                                                                                   |
| Anti-patterns (stop)                         | ANTI        | 4 bullets                                                                                      |
| Do not                                       | ANTI        | 3 bullets                                                                                      |

#### `architect-verify-handoff/SKILL.md` (109 lines)

| Section                      | Type        | Notes                                                          |
| ---------------------------- | ----------- | -------------------------------------------------------------- |
| (preamble)                   | EDIT        | 1-line framing                                                 |
| Doctrine references          | XREF        | 2 sibling links                                                |
| Pre-flight                   | XREF + DATA | Pointer + anchor CLI verb                                      |
| What to extract              | DATA        | 8-row field-source table                                       |
| Handoff note format          | DATA        | Markdown template                                              |
| Recommended-next-skill table | DATA        | 9-row routing table — sibling to session-router's intent table |
| Anti-patterns (stop)         | ANTI        | 3 bullets                                                      |
| Do not                       | ANTI        | 2 bullets                                                      |

### A.2 Reference skill (1 file, the data-api kernel)

#### `architect-data-api/SKILL.md` (514 lines — the reference)

| Section                              | Type        | Notes                                                                                                                                                 |
| ------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| (preamble)                           | EDIT        | Frames "reference, not router"                                                                                                                        |
| When this skill fires                | EDIT        | Activation-trigger paragraph                                                                                                                          |
| CLI vs MCP — which to use            | DATA        | 4-column comparison table + doctrine paragraph                                                                                                        |
| CLI ↔ MCP tool-name mapping (parity) | DATA        | 20-row parity table — derivable from `packages/architect-mcp/src/tool-registry.ts`                                                                    |
| Pre-flight by session intent         | DATA        | 7 subsections (Planning / Design / Implement / Review / Refactor / Handoff / Generic) — derivable from CLI help + intent registry                     |
| Verb reference                       | DATA        | 8 categorized subsections, ~30 verbs total — derivable from CLI `--help` output                                                                       |
| Output formats & JSON consumption    | DATA        | Format table + 5 worked JSON shapes — derivable from Zod schemas + sample CLI runs                                                                    |
| Deterministic gates                  | DATA        | 3 verbs flagged as parse-for-verdict                                                                                                                  |
| Known quirks                         | EDIT + DATA | 4 quirks — pure editorial knowledge (CLI footnote pointing at non-existent verb, error-path ambiguity, MCP underscore rule, scope-validate carve-out) |
| Doctrine cross-references            | XREF        | 4 sibling links                                                                                                                                       |
| Anti-patterns (stop)                 | ANTI        | 7 bullets                                                                                                                                             |
| Provenance                           | EDIT        | Verification date + re-verify command                                                                                                                 |

### A.3 Shared doctrine (9 files)

#### `_shared/canonical-references.md` (82 lines)

| Section                                             | Type        | Notes                                |
| --------------------------------------------------- | ----------- | ------------------------------------ |
| (preamble)                                          | EDIT        | Names the kernel's two anchor rules  |
| Anti-anecdote rule                                  | EDIT        | 3 numbered rules — pure doctrine     |
| Self-containment rule                               | EDIT        | 4 numbered rules — pure doctrine     |
| Provenance (informational, verified at commit time) | XREF + DATA | 5 bullets — re-verification commands |

#### `_shared/annotation-ownership.md` (95 lines)

| Section                                               | Type             | Notes                                             |
| ----------------------------------------------------- | ---------------- | ------------------------------------------------- |
| (preamble)                                            | EDIT             | Names skill consumers                             |
| Split-ownership principle                             | EDIT + DERIVABLE | 3-bullet kernel statement                         |
| Feature files own (planning)                          | DATA             | 7-row tag-purpose table — derivable from taxonomy |
| Code stubs / production TS own (implementation)       | DATA             | 4-row tag-purpose table                           |
| Code-originated patterns                              | DERIVABLE        | Para describes code-as-identity carve-out         |
| When to use a feature file vs the source for identity | EDIT             | 2-paragraph decision rule                         |
| Critical: do not duplicate identity                   | ANTI             | Single rule                                       |
| Production-TS annotations are additive, not mandatory | DERIVABLE + ANTI | 3 implication bullets                             |
| Sibling references                                    | XREF             | 3 links                                           |
| Provenance (informational)                            | XREF             | Re-verification path                              |

#### `_shared/four-tier-ladder.md` (129 lines — the densest shared doc)

| Section                                     | Type             | Notes                                                                   |
| ------------------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| (preamble + terminology note)               | EDIT             | "Idea inbox" colloquial-name note                                       |
| Tiers                                       | DATA             | 4-row tier table — fully derivable from tier definitions + tag registry |
| Mandatory tags per tier                     | DATA             | 5-tag bullet list                                                       |
| Epic and slice variants                     | DATA + DERIVABLE | Carve-out rules                                                         |
| Effective maturity                          | DERIVABLE        | Para                                                                    |
| Valid promotion paths                       | DATA             | ASCII arrow diagram + 3 promotion-delta bullets                         |
| Worked example 1 — idea-tier minimum        | DATA             | Gherkin code block + 1-line caption                                     |
| Worked example 2 — candidate-tier promotion | DATA             | Gherkin code block + mechanical-changes caption                         |

#### `_shared/fsm-transitions.md` (107 lines)

| Section                                                 | Type | Notes                                                                            |
| ------------------------------------------------------- | ---- | -------------------------------------------------------------------------------- |
| (preamble + category-split note)                        | EDIT | Two transition categories framing                                                |
| Process-Guard FSM transitions (validated)               | DATA | ASCII arrow diagram + 3 notes — derivable from `ProcessGuard`                    |
| Maturity-driven status flips (acceptance-gate, not FSM) | DATA | Single transition + framing                                                      |
| `@architect-unlock-reason:` requirements                | DATA | 3 transition triggers + 3 authoring rules — derivable from guard's runtime check |
| Pre-flight: use scope-validate                          | DATA | CLI command + interpretation                                                     |
| Provenance (informational, verified at commit time)     | EDIT | Verification commands                                                            |

#### `_shared/value-transfer.md` (150 lines)

| Section                                                     | Type             | Notes                                                                                                                      |
| ----------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| (preamble)                                                  | EDIT             | 1-line scope                                                                                                               |
| Concept                                                     | EDIT + DERIVABLE | 2 durable artifact categories                                                                                              |
| The primary durable artifact is the executable feature file | DERIVABLE        | Para reconciling maximalist framing with split-ownership                                                                   |
| Transfer checklist                                          | DATA             | 7-row from-to table                                                                                                        |
| Anti-patterns (stop)                                        | ANTI             | 3 bullets — duplicated in implement-spec + refactor-session                                                                |
| Pre-deletion gate                                           | DATA             | 5-criterion gate — duplicated in review-implementation (with graph-integrity addition) and refactor-session (adapted form) |
| Mechanical check (when shipped)                             | DATA + EDIT      | Future-verb forward reference                                                                                              |
| Deletion timing                                             | EDIT             | 2 outcomes + default rule (duplicated in implement-spec)                                                                   |
| Sibling references                                          | XREF             | 4 links                                                                                                                    |

#### `_shared/spec-pattern-relationships.md` (136 lines)

| Section                                                                   | Type             | Notes                                 |
| ------------------------------------------------------------------------- | ---------------- | ------------------------------------- |
| (preamble)                                                                | EDIT             | Consumers                             |
| The bipartite pattern graph                                               | DATA + DERIVABLE | 2-tag example + traversal explanation |
| Naming conventions for test patterns                                      | DATA             | 2-row suffix table                    |
| Forward / reverse link pair (deletion-gate input)                         | DATA             | 2-bullet tag pair                     |
| `*ExecutableTests` as the formal escape from retroactive plan-level specs | DATA + DERIVABLE | 3-step recipe + framing               |
| Refactoring carve-out                                                     | DATA + EDIT      | Carve-out rule + provenance           |
| Hierarchy axis (epic / phase / task / slice)                              | DATA             | 2 authored tags + 5 constraints       |
| Sibling references                                                        | XREF             | 3 links                               |
| Provenance (informational)                                                | XREF             | Re-verification path                  |

#### `_shared/multi-session-coordination.md` (205 lines — largest shared)

| Section                                      | Type             | Notes                                             |
| -------------------------------------------- | ---------------- | ------------------------------------------------- |
| (preamble)                                   | EDIT             | "Not refactor-specific" framing                   |
| When this applies                            | DATA             | 3-bucket trigger list                             |
| Folder layout — `.pr-coordination/`          | DATA             | ASCII tree + archive convention                   |
| Coordinator + worker split (≥3 sessions)     | EDIT + DERIVABLE | 3 role bullets — pure doctrine                    |
| DECISIONS.md template                        | DATA             | Markdown template                                 |
| SESSION-REPORTS-AND-LEARNINGS.md template    | DATA             | Markdown template                                 |
| Scope-discovery handling — load-bearing rule | DATA + EDIT      | 5-step heuristic                                  |
| Gates discipline                             | DATA + ANTI      | 4 bullets — overlaps with session-preamble Rule 2 |
| Commit hygiene                               | DATA + ANTI      | 3 bullets — overlaps with session-preamble Rule 3 |
| Sibling references                           | XREF             | 3 links                                           |

#### `_shared/rule-block-template.md` (75 lines)

| Section                                      | Type             | Notes                                    |
| -------------------------------------------- | ---------------- | ---------------------------------------- |
| (preamble)                                   | EDIT             | Consumers                                |
| Rule blocks are OPTIONAL                     | EDIT             | 2-paragraph framing                      |
| 4-field template (when Rule blocks are used) | DATA             | Gherkin code block + 4 field annotations |
| Verified-by is the back-link                 | EDIT + DERIVABLE | 2-paragraph rename caveat                |
| Tier guidance                                | DATA             | 5-row tier-fields table                  |
| Sibling references                           | XREF             | 2 links                                  |
| Provenance (informational)                   | XREF             | Single line                              |

#### `_shared/session-preamble.md` (81 lines)

| Section                  | Type        | Notes                                                     |
| ------------------------ | ----------- | --------------------------------------------------------- |
| (preamble)               | EDIT        | Names consumers                                           |
| The six rules            | DATA + EDIT | 6 numbered rules — each rule is a mini-doctrine paragraph |
| When this file is loaded | EDIT        | 1-line scope                                              |
| Sibling references       | XREF        | 4 links                                                   |

---

## B. Topic-cluster map (ContentFragment candidates)

22 recurring topics. Depth markers: `[1]` = one-line mention, `[2]` = brief reference (paragraph), `[3]` = full explanation.

| #   | Topic                                                                                                                                                    | Appears in                                                                                                                                            | Canonical-owner candidate                                                | Data source                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 1   | Four-tier ladder (tiers + budgets + mandatory tags)                                                                                                      | `four-tier-ladder.md` [3], `plan-session` [3], `design-session` [2], `review-spec` [2], `verify-handoff` [2], `session-router` [1]                    | `_shared/four-tier-ladder.md`                                            | PatternGraph + tag registry (mostly DATA)                             |
| 2   | FSM transitions (Process-Guard valid moves)                                                                                                              | `fsm-transitions.md` [3], `implement-spec` [2], `verify-handoff` [2], `refactor-session` [1], `data-api` [2]                                          | `_shared/fsm-transitions.md`                                             | `ProcessGuard` source (DATA)                                          |
| 3   | `@architect-unlock-reason` audit-trail rules                                                                                                             | `fsm-transitions.md` [3], `refactor-session` [1], `review-implementation` [1]                                                                         | `_shared/fsm-transitions.md`                                             | Guard runtime check (DATA)                                            |
| 4   | scope-validate verdicts (PASS/WARN/BLOCKED + carve-out for planning/review)                                                                              | `data-api` [3], `design-session` [2], `implement-spec` [2], `review-spec` [2], `plan-session` [1], `fsm-transitions.md` [2]                           | `_shared/fsm-transitions.md` or new `_shared/scope-validate-verdicts.md` | CLI output (DATA)                                                     |
| 5   | Pre-deletion gate (5-criterion value-transfer gate)                                                                                                      | `value-transfer.md` [3], `implement-spec` [2], `review-implementation` [3 with +1 graph-integrity], `refactor-session` [3 adapted]                    | `_shared/value-transfer.md`                                              | Gherkin Rule rationale (DERIVABLE) + Zod (DATA)                       |
| 6   | Annotation ownership / split-ownership policy                                                                                                            | `annotation-ownership.md` [3], `design-session` [2], `implement-spec` [2], `refactor-session` [2], `review-implementation` [2]                        | `_shared/annotation-ownership.md`                                        | Taxonomy + ADR (DATA + EDIT)                                          |
| 7   | Tag-purpose tables (feature-owned vs code-owned)                                                                                                         | `annotation-ownership.md` [3], `data-api` (indirect via taxonomy verb)                                                                                | `_shared/annotation-ownership.md`                                        | Taxonomy (`pnpm architect:query taxonomy --format json`) — fully DATA |
| 8   | Bipartite production↔test pattern graph + `*ExecutableTests`                                                                                             | `spec-pattern-relationships.md` [3], `implement-spec` [2], `refactor-session` [2], `review-spec` [2], `review-implementation` [1], `plan-session` [1] | `_shared/spec-pattern-relationships.md`                                  | Gherkin tag conventions (DATA + EDIT)                                 |
| 9   | Forward/reverse link pair (`@architect-executable-specs` + `@architect-implements`)                                                                      | `spec-pattern-relationships.md` [3], `value-transfer.md` [2], `review-implementation` [2]                                                             | `_shared/spec-pattern-relationships.md`                                  | Tag registry (DATA)                                                   |
| 10  | Refactoring carve-out (skip plan-tier for shipped code)                                                                                                  | `four-tier-ladder.md` [2], `spec-pattern-relationships.md` [2], `refactor-session` [3], `plan-session` [2], `implement-spec` [2], `review-spec` [1]   | `_shared/four-tier-ladder.md` (or new dedicated fragment)                | `formal-spec/08-spec-evolution.md` (EDIT, paraphrased)                |
| 11  | Retroactive plan-level spec anti-pattern                                                                                                                 | `plan-session` [3 with tripwire], `implement-spec` [2], `refactor-session` [2], `value-transfer.md` [2], `spec-pattern-relationships.md` [2]          | `_shared/value-transfer.md` or `_shared/spec-pattern-relationships.md`   | Pure ANTI                                                             |
| 12  | Idea-tier 5-tag minimum + line budget                                                                                                                    | `four-tier-ladder.md` [3], `plan-session` [3], `review-spec` [2]                                                                                      | `_shared/four-tier-ladder.md`                                            | Tag registry + tier definition (DATA)                                 |
| 13  | Epic/slice structural carve-out (7th tag, parent omission)                                                                                               | `four-tier-ladder.md` [3], `plan-session` [3], `review-spec` [1], `spec-pattern-relationships.md` [2 hierarchy axis]                                  | `_shared/four-tier-ladder.md`                                            | DATA                                                                  |
| 14  | Gherkin idea/candidate template (full file shape)                                                                                                        | `plan-session` [3], `four-tier-ladder.md` [3 worked example]                                                                                          | `_shared/four-tier-ladder.md`                                            | DERIVABLE (template assembly from tag registry)                       |
| 15  | Rule-block 4-field template + Verified-by back-link                                                                                                      | `rule-block-template.md` [3], `design-session` [2], `review-spec` [1], `refactor-session` [1], `implement-spec` [2], `value-transfer.md` [2]          | `_shared/rule-block-template.md`                                         | Gherkin convention (DATA)                                             |
| 16  | Tier-by-tier rule-block field guidance                                                                                                                   | `rule-block-template.md` [3], `four-tier-ladder.md` [2 implicit], `plan-session` [2], `design-session` [1]                                            | `_shared/rule-block-template.md`                                         | DATA                                                                  |
| 17  | CLI ↔ MCP parity (tool naming + verb mapping)                                                                                                            | `data-api` [3], `session-router` [1]                                                                                                                  | `_shared/` or `architect-data-api`                                       | `packages/architect-mcp/src/tool-registry.ts` (DATA)                  |
| 18  | CLI verb reference (`overview`, `context`, `bundle`, `scope-validate`, …)                                                                                | `data-api` [3], every session skill [1 via XREF to data-api § headings]                                                                               | `architect-data-api`                                                     | CLI `--help` (DATA)                                                   |
| 19  | Pre-flight bootstrap per session intent                                                                                                                  | `data-api` [3], `session-router` [1 XREF], every session skill [1 XREF]                                                                               | `architect-data-api`                                                     | DATA (composable from per-intent verb tuples)                         |
| 20  | Six universal session-preamble rules (Data API first, gates non-negotiable, commit hygiene, decisions before code, scope-discovery, learnings propagate) | `session-preamble.md` [3], `refactor-session` [1 XREF], `multi-session-coordination.md` [1 XREF + reinforcement of Rules 2/3]                         | `_shared/session-preamble.md`                                            | EDIT (doctrine)                                                       |
| 21  | Multi-session campaign / `.pr-coordination/` layout                                                                                                      | `multi-session-coordination.md` [3], `refactor-session` [2]                                                                                           | `_shared/multi-session-coordination.md`                                  | EDIT + DATA                                                           |
| 22  | Anti-anecdote + self-containment rules (kernel doctrine)                                                                                                 | `canonical-references.md` [3], every `_shared/*.md` provenance footer [1]                                                                             | `_shared/canonical-references.md`                                        | Pure EDIT                                                             |
| 23  | Session-intent → skill routing table                                                                                                                     | `session-router` [3], `verify-handoff` [3 "Recommended next"]                                                                                         | `architect-session-router` (or new `_shared/session-intent-routing.md`)  | Trigger-verb registry (could be DATA if encoded)                      |
| 24  | Hierarchy axis (`@architect-level` + `@architect-parent`)                                                                                                | `spec-pattern-relationships.md` [3], `four-tier-ladder.md` [2 carve-out], `plan-session` [2 epic/slice]                                               | `_shared/spec-pattern-relationships.md`                                  | Tag registry (DATA)                                                   |
| 25  | Anti-pattern: zombie spec / half-transferred value                                                                                                       | `value-transfer.md` [3], `implement-spec` [2], `refactor-session` [2]                                                                                 | `_shared/value-transfer.md`                                              | Pure ANTI                                                             |

---

## C. Per-session-skill structural patterns

Ignoring `architect-data-api` (the reference, not a session) the 7 routing/session skills share a near-identical shape. The table below maps which sections each skill includes:

| Skill                 | Frontmatter description (router-trigger) | Preamble framing | Doctrine references                    | Pre-flight (XREF to data-api)                         | Core operating procedure                                                                            | Output format                                        | Anti-patterns             | Do not          | Big-gap escape hatch |
| --------------------- | ---------------------------------------- | ---------------- | -------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------- | --------------- | -------------------- |
| session-router        | yes                                      | yes              | (none — it IS the router)              | yes (Step 2)                                          | Step 1 intent table + Step 3 handoff                                                                | n/a                                                  | n/a                       | yes (3 bullets) | n/a                  |
| plan-session          | yes                                      | yes              | yes (4 links)                          | yes                                                   | Idea-tier template + Candidate-tier delta + Anti-patterns at idea tier                              | "Output for this session" (3 outcomes)               | yes (idea tier + general) | yes (3 bullets) | n/a                  |
| design-session        | yes                                      | yes              | yes (4 links)                          | yes                                                   | Design-tier deliverables + Stubs + Anti-drift tripwires + Ephemeral spec principle                  | "Acceptance criteria" (2 CLI commands)               | (folded into tripwires)   | yes (4 bullets) | n/a                  |
| implement-spec        | yes                                      | yes              | yes (3 links via "Related references") | yes                                                   | Value Transfer concept + Implementation order (8 steps) + Value transfer verify + Deletion ask-user | (none explicit)                                      | yes (4 bullets)           | yes (4 bullets) | yes                  |
| refactor-session      | yes                                      | yes              | yes (7 links — widest)                 | yes                                                   | Premise + Refactor order (6 steps) + Adapted invariant-carrier gate + Multi-session campaign mode   | (none explicit)                                      | yes (6 bullets)           | yes (6 bullets) | yes                  |
| review-spec           | yes (with scope note)                    | yes              | yes (4 links)                          | yes (+ idea/candidate structural checklist carve-out) | Gap-finding checklist (10 checks)                                                                   | Markdown gap-list template                           | yes (4 bullets)           | yes (3 bullets) | n/a                  |
| review-implementation | yes (with scope note)                    | yes              | yes (3 links)                          | yes (+ per-pattern loop)                              | Per-pattern verification (6-criterion gate) + Spec-deletion step                                    | Markdown table template                              | yes (4 bullets)           | yes (3 bullets) | n/a                  |
| verify-handoff        | yes                                      | yes              | yes (2 links)                          | yes (+ anchor `handoff` CLI verb)                     | What to extract (8-field table)                                                                     | Handoff note template + Recommended-next-skill table | yes (3 bullets)           | yes (2 bullets) | n/a                  |

The common shape (the wiki-tree template for skills under D7):

```
SKILL.md
├── Frontmatter (description + allowed-tools)
├── Preamble  (1-3 lines, EDIT)
├── Doctrine references  (XREF block — pointer fragments)
├── Pre-flight  (XREF to data-api §Pre-flight + intent-specific carve-outs)
├── Core operating procedure  (DATA: numbered steps, optionally with embedded CLI)
├── Output format  (DATA: template / table)
├── Anti-patterns  (ANTI: per-skill specific)
├── Do not  (ANTI: redundant with Anti-patterns)
└── Big-gap escape hatch  (EDIT, ~half the skills only)
```

Six of seven session skills follow this shape exactly. The session-router is the exception (no doctrine references, no operating procedure beyond Step 1/2/3 — it IS the routing primitive). The "Anti-patterns" vs "Do not" split is consistent across skills and consistently duplicates content within the skill (≥40 % overlap inside each skill body).

---

## D. Duplication hotspots (top-10)

Lines counted are gross duplications (verbatim or near-verbatim restatement of the same rule/table/template across 3+ files).

| #   | Content                                                                                                                                                                               | Files                                                                                                                  | Approx. lines duplicated | Save if extracted                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| 1   | Pre-flight bootstrap pointer + scope-validate carve-out paragraph                                                                                                                     | 6 session skills + data-api                                                                                            | 6 × ~8 lines = 48        | ~40                                                    |
| 2   | 5-criterion pre-deletion gate (value-transfer) — verbatim in value-transfer.md, paraphrased in implement-spec, +graph-integrity in review-implementation, adapted in refactor-session | 4 files                                                                                                                | 4 × ~15 lines = 60       | ~40                                                    |
| 3   | Doctrine-references XREF block (sibling-link-with-2-line-summary pattern)                                                                                                             | 7 session skills                                                                                                       | 7 × ~12 lines = 84       | ~60 (extract as fragment "doctrine-refs-for-<intent>") |
| 4   | Retroactive plan-level spec anti-pattern (with formal-spec/08 provenance)                                                                                                             | plan-session (tripwire blockquote), implement-spec, refactor-session, value-transfer.md, spec-pattern-relationships.md | 5 files × ~8 lines = 40  | ~30                                                    |
| 5   | Four-tier-ladder mandatory-5-tag list + idea-tier line budget                                                                                                                         | four-tier-ladder.md, plan-session, review-spec                                                                         | 3 files × ~8 lines = 24  | ~15                                                    |
| 6   | "Anti-patterns" vs "Do not" intra-skill repetition (each session skill has both, ~50 % overlap)                                                                                       | 6 session skills                                                                                                       | 6 × ~6 lines = 36        | ~25 (collapse to single block per skill)               |
| 7   | FSM-transitions diagram + unlock-reason rules                                                                                                                                         | fsm-transitions.md, implement-spec step 1, refactor-session pre-flight, verify-handoff                                 | 4 files × ~7 lines = 28  | ~18                                                    |
| 8   | Refactoring carve-out (skip plan-tier for shipped code) sentence                                                                                                                      | four-tier-ladder.md, spec-pattern-relationships.md, plan-session, implement-spec, refactor-session, review-spec        | 6 files × ~5 lines = 30  | ~22                                                    |
| 9   | Zombie design spec / half-transferred value anti-pattern                                                                                                                              | value-transfer.md, implement-spec, refactor-session                                                                    | 3 files × ~6 lines = 18  | ~12                                                    |
| 10  | "Validation cadence: typecheck && test && validate:all before any commit" verbatim                                                                                                    | implement-spec step 5, refactor-session step 4, session-preamble Rule 2, multi-session-coordination Gates discipline   | 4 files × ~5 lines = 20  | ~13                                                    |

**Total estimated savings if these 10 hotspots are extracted as ContentFragments: ~275 lines (~10 % of the corpus).** The bigger structural win is consistency: once the fragments live in one place, the next CLI / FSM / gate change updates one source instead of 4-7.

---

## E. The `_shared/` situation

**9 files, 1048 lines (37 % of corpus). They are already proto-ContentFragments.** Each `_shared/*.md` file:

1. States its rules inline (the self-containment rule in `canonical-references.md` makes this explicit).
2. Carries a "Sibling references" / "Provenance" footer pointing at peers and external sources.
3. Names its consumer skills in the preamble.
4. Resolves load-bearing claims locally — no "see formal-spec/" for authority.

This is exactly the ContentFragment shape D1–D12 propose, just authored by hand. The mechanism today:

- **Loading model:** SKILL.md files reference `_shared/*.md` via Markdown relative links in a "Doctrine references" block. Loading is **on-read by the skill body's recommendation** ("read these once per session if you haven't"). The harness does not auto-embed.
- **Authority:** `canonical-references.md` declares the kernel self-contained and adopts an explicit anti-anecdote rule. External docs (`formal-spec/`, ADRs) are cited as provenance, not authority.
- **Drift containment:** the anti-anecdote rule keeps SKILL.md prose from diverging — when SKILL.md and `_shared/` disagree, `_shared/` wins.

**Is "load via prose link" load-bearing?** Partly. The link mechanism gives session skills latitude to elide doctrine the user doesn't need, but it also means the SKILL.md author must restate the most-load-bearing rules (e.g. retroactive-spec tripwire, value-transfer gate) inline anyway, "in case the link isn't followed." This produces hotspots #2, #4, #8 above. **File-system embedding (wiki shape with INPUT-disclosure)** would:

- Replace the manual restatement-vs-link tradeoff with a deterministic depth selector (`overview` / `summary` / `advanced`).
- Let the SKILL.md author opt into a depth at the embedding site and trust the renderer to expand consistently.
- Let `canonical-references.md`'s self-containment rule continue to hold — the canonical source is the fragment, embeddings are projections.

**Recommendation:** treat the 9 `_shared/*.md` files as the seed ContentFragment set. Each one is already a roughly-self-contained doctrine atom with explicit consumers. The wiki shape doesn't require re-authoring them — it requires (a) splitting some of the larger ones into smaller fragments along the topic-cluster boundaries in §B (e.g. `four-tier-ladder.md` → `four-tier-ladder/tiers`, `.../mandatory-tags`, `.../promotion-paths`, `.../epic-slice-carveout`), and (b) replacing the "Doctrine references" prose blocks with generated `INPUT` directives.

The drift risk in the current model is concentrated in the 9 SKILL.md "Doctrine references" sections — they carry handwritten 1-2-line summaries of each `_shared/` file, and those summaries silently age. A wiki-shape generator should generate those summaries from the fragment's own preamble (the file's first H1+blockquote pair).

---

## F. Recommendations for ContentFragment carving

10 concrete extractions, ordered by leverage (lines saved + drift-risk reduced):

| ID                                | Canonical doc                                                                                                                                         | Data source                                                                              | Should be embedded by                                                                                                                                                                                                     | Disclosure depth                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `CF-fsm-transitions`              | `_shared/fsm-transitions.md` §"Process-Guard FSM transitions" + §"unlock-reason requirements"                                                         | `ProcessGuard` source + Zod schema (DATA)                                                | implement-spec [overview], refactor-session [overview], verify-handoff [overview], data-api [summary]                                                                                                                     | overview at consumer sites, advanced at canonical                                                      |
| `CF-scope-validate-verdicts`      | New `_shared/scope-validate-verdicts.md` (or a §within data-api)                                                                                      | CLI output + `formal-spec/` (DATA + EDIT)                                                | design-session [summary], implement-spec [summary], review-spec [summary], plan-session [overview — to surface the carve-out], data-api [advanced]                                                                        | summary                                                                                                |
| `CF-pre-deletion-gate`            | `_shared/value-transfer.md` §"Pre-deletion gate"                                                                                                      | Gherkin Rule rationale on `value-transfer-state.feature` + Zod schema (DERIVABLE + DATA) | implement-spec [summary], review-implementation [advanced, with graph-integrity overlay], refactor-session [summary, with adapted-form overlay]                                                                           | summary; refactor-session uses an `adapted` variant                                                    |
| `CF-four-tier-ladder-table`       | `_shared/four-tier-ladder.md` §"Tiers" + §"Mandatory tags per tier"                                                                                   | Tier definition + tag registry (DATA)                                                    | plan-session [overview], design-session [summary], review-spec [summary], verify-handoff [overview], session-router [overview]                                                                                            | overview                                                                                               |
| `CF-retroactive-spec-antipattern` | `_shared/value-transfer.md` or `_shared/spec-pattern-relationships.md` (one of them, not both)                                                        | Pure ANTI (EDIT)                                                                         | plan-session [advanced — tripwire], implement-spec [summary], refactor-session [summary], review-spec [overview], review-implementation [overview]                                                                        | summary; plan-session uses an `expanded` variant for the tripwire                                      |
| `CF-annotation-ownership-table`   | `_shared/annotation-ownership.md` §"Feature files own" + §"Code stubs / production TS own"                                                            | Taxonomy `pnpm architect:query taxonomy --format json` (DATA)                            | design-session [summary], implement-spec [summary], refactor-session [summary], review-implementation [summary]                                                                                                           | summary                                                                                                |
| `CF-rule-block-template`          | `_shared/rule-block-template.md` §"4-field template" + §"Tier guidance"                                                                               | Gherkin convention (DATA)                                                                | design-session [summary], implement-spec [summary], refactor-session [summary], review-spec [overview], plan-session [overview — invariant-only carve-out]                                                                | summary; plan-session uses `tier-restricted` variant                                                   |
| `CF-session-preamble-six-rules`   | `_shared/session-preamble.md` §"The six rules"                                                                                                        | Pure EDIT (doctrine)                                                                     | refactor-session [advanced], every session skill [overview]                                                                                                                                                               | overview by default; refactor-session embeds advanced because it concentrates the scope-discovery risk |
| `CF-cli-verb-pre-flight`          | `architect-data-api/SKILL.md` §"Pre-flight by session intent"                                                                                         | CLI `--help` output + intent registry (DATA)                                             | session-router [summary], plan-session [overview], design-session [overview], implement-spec [overview], review-spec [overview], review-implementation [overview], refactor-session [overview], verify-handoff [overview] | overview per-intent (intent-parameterised fragment)                                                    |
| `CF-recommended-next-skill`       | `architect-verify-handoff/SKILL.md` §"Recommended-next-skill table" merged with `architect-session-router/SKILL.md` §"Step 1 — Choose session intent" | Trigger-verb registry — needs to be encoded as Zod (currently EDIT, can become DATA)     | session-router [advanced], verify-handoff [advanced]                                                                                                                                                                      | advanced at both — single fragment, two embedding sites                                                |

### Notes on the carving plan

1. **CF-pre-deletion-gate is the highest-leverage extraction** — it's both the most-duplicated and the one most likely to drift when the `value-transfer` CLI verb ships and rewrites the 5-criterion gate into a deterministic verdict. Centralising it now means the future verb's JSON shape can be auto-injected at the canonical site.

2. **CF-cli-verb-pre-flight needs the most schema work.** The data-api skill's §"Pre-flight by session intent" is structurally a 7-row `{intent → verb-tuple}` table that today reads as 7 separate code-blocks. Encoded as a Zod schema (`PreflightBundleSchema`) it becomes the most-embedded fragment in the wiki and the strongest argument for the no-new-annotation-carriers position — every session skill calls into it.

3. **The session-router's intent table and the verify-handoff "Recommended next" table are the same data.** Merging them into a single `CF-recommended-next-skill` fragment (with two embedding contexts: "open a session" vs "close a session") removes the worst drift hazard in the corpus — they have already diverged in column shape and they describe the same routing logic.

4. **Plan-session's "Anti-patterns at idea tier" block is already documented as a duplicate** (the skill body explicitly cites `formal-spec/08-spec-evolution.md` § "Anti-Patterns at Idea Tier" and `four-tier-ladder.md`). It is the canonical "this should be a fragment" comment in the source — fold it into `CF-retroactive-spec-antipattern` and reference from the tripwire blockquote.

5. **`Big-gap escape hatch` (implement-spec + refactor-session)** is a small but identical block. Not in the top-10 because it's only 2 sites; promote to fragment if a third session adopts it, otherwise leave inline.

6. **The `_shared/canonical-references.md` anti-anecdote rule itself should NOT be a fragment.** It is the doctrine that says fragments are self-contained — pulling it out as a fragment would be self-referential and add no value. It stays as the doctrine root in `_shared/`.

---

## Provenance and verification

- Line counts: `wc -l` on 18 files at HEAD on branch `campaign/docs-and-skills-consolidation` on 2026-05-17.
- TOC extraction: `grep -n "^## "` on every SKILL.md / `_shared/*.md`.
- All file contents read in full (no truncation).
- No file modifications.
