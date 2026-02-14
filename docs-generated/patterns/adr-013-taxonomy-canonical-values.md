# 📋 ADR 013 Taxonomy Canonical Values

**Purpose:** Detailed documentation for the ADR 013 Taxonomy Canonical Values pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |

## Description

**Context:**
  Several taxonomy tags use freeform `format: 'value'` with no defined
  canonical values. Over 166 executable specs, organic growth produced
  21 distinct product-area values with drift (Generator vs Generators,
  Process vs DeliveryProcess) and a catch-all Behavior area covering
  15 unrelated specs. The adr-category tag documents 3 example values
  but 4 are used in practice. These inconsistencies degrade the value
  of generated documentation grouped by these tags.

  **Decision:**
  Define canonical values for product-area and adr-category. Product
  areas are reader-oriented documentation sections, not source directory
  mirrors. Each executable spec gets exactly one product-area. ADR
  categories are fixed to the values actually in use.

  **Consequences:**
  - (+) Generated docs-live documentation groups into coherent sections
  - (+) Progressive disclosure per product area (intro, diagrams, rules, details)
  - (+) Eliminates drift and catch-all areas
  - (+) ADR categories match reality
  - (-) Migration effort for ~95 executable specs changing product-area
  - (-) Judgment calls on borderline specs (e.g., codec-migration: Generation or Annotation?)

## Business Rules

**Product area canonical values**

**Invariant:** The product-area tag uses one of 7 canonical values.
    Each value represents a reader-facing documentation section, not a
    source module. Specs are assigned based on what question they answer
    for the reader.

    | Value | Reader Question | Covers |
    | Annotation | How do I annotate code so it gets picked up? | Scanning, extraction, pattern relationships, tag parsing, dual-source |
    | Configuration | How do I configure the tool? | Config loading, presets, define-config, resolution, project config |
    | Generation | How does annotated code become documentation? | Codecs, generators, doc generation, architecture diagrams, rendering |
    | Validation | How does the delivery workflow get enforced? | FSM, DoD, anti-patterns, process guard, lint engine, lint rules |
    | DataAPI | How do I query process state? | Process state API, stubs, context assembly, output shaping, CLI tools |
    | CoreTypes | What foundational types does the toolkit provide? | Result monad, error factories, string utils |
    | Process | How does the session workflow operate? | Session lifecycle, handoffs, delivery process conventions, POC |

    **Rationale:** 7 areas ensures no section has fewer than 5 specs
    (enough for progressive disclosure) and no catch-all junk drawer.
    The previous Behavior area (15 specs) is dissolved: rendering specs
    go to Generation, relationship specs go to Annotation, session specs
    go to Process.

**Migration mapping from current values**

**Invariant:** Every current product-area value maps to exactly one
    canonical value. No specs are orphaned.

    | Current Value | Canonical Value | Rationale |
    | Scanner | Annotation | Scanning is the input side of annotation |
    | Extractor | Annotation | Extraction parses annotations |
    | PatternRelationship | Annotation | Relationships are annotation metadata |
    | Pipeline | Annotation | Transform-dataset processes extracted annotations |
    | Configuration | Configuration | Unchanged |
    | Codec | Generation | Codecs produce output |
    | DocGeneration | Generation | Doc generation is output |
    | Generator | Generation | Generators produce output |
    | Generators | Generation | Drift variant of Generator |
    | Architecture | Generation | Diagram generation is output |
    | Behavior | Generation | Rendering, descriptions, patterns-codec, rich-content |
    | Validation | Validation | Unchanged |
    | Lint | Validation | Linting enforces workflow |
    | API | DataAPI | Unchanged (renamed for clarity) |
    | CLI | DataAPI | CLI is the interface to the API |
    | Types | CoreTypes | Foundational types |
    | Utils | CoreTypes | Utilities |
    | DeliveryProcess | Process | Session workflow, conventions |
    | Process | Process | Drift variant of DeliveryProcess |
    | POC | Process | Proof of concepts for process |

    **Exception — Behavior specs require individual judgment:**
    The Behavior catch-all contains specs that span multiple areas.
    Each spec is assigned based on its primary subject:

    | Spec | Canonical Value | Why |
    | render.feature | Generation | Markdown rendering |
    | session-handoffs.feature | Process | Session workflow |
    | pattern-tag-extraction.feature | Annotation | Tag parsing |
    | error-handling.feature | CoreTypes | Error infrastructure |
    | codec-migration.feature | Generation | Codec system change |

**ADR category canonical values**

**Invariant:** The adr-category tag uses one of 4 values.

    | Value | Purpose | Example |
    | architecture | System structure, component design, data flow | Pipeline architecture, progressive disclosure |
    | process | Workflow, conventions, annotation rules | Gherkin-only testing, pattern naming |
    | testing | Test strategy, verification approach | Gherkin-only testing policy |
    | documentation | Documentation generation, content structure | Reference sample conventions |

    **Rationale:** These are the 4 values already in use across 15
    decision specs. The previously documented example value "tooling"
    does not exist in any file and is removed.

**Quarter format convention**

**Invariant:** The quarter tag uses the format `YYYY-QN` where N
    is 1-4. Examples: `2026-Q1`, `2026-Q2`.

    **Rationale:** ISO-year-first sorting works lexicographically.
    Avoids ambiguity between `Q1-2026`, `Q1`, and `2026Q1` formats.

**Unused taxonomy tags (TODO)**

**Invariant:** The following tags are defined in the registry but
    have zero usage across all source files. They should be audited
    in a future session to determine whether to remove, document, or
    mark as monorepo-only.

    | Tag | Format | Defined Values | Usage |
    | adr-theme | enum | persistence, isolation, commands, projections, coordination, taxonomy, testing | 0 files |
    | adr-layer | enum | foundation, infrastructure, refinement | 0 files |
    | workflow | enum | implementation, planning, validation, documentation | 0 files |
    | team | value | (freeform) | 0 files |
    | user-role | value | (freeform) | sparse |

    **No action now.** These tags may have value in the monorepo context
    where multiple teams and workflows exist. Retirement decision deferred
    until monorepo integration validates or invalidates each tag.

---

[← Back to Pattern Registry](../PATTERNS.md)
