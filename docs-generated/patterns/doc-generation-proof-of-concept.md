# ✅ Doc Generation Proof Of Concept

**Purpose:** Detailed documentation for the Doc Generation Proof Of Concept pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 27 |

## Description

**Status: SUPERSEDED** - This POC has been implemented. See:
  - Convention-tagged decision records (ADR/PDR) with @libar-docs-convention tags
  - `docs-generated/ANNOTATION-GUIDE.md` - Comprehensive guide for fixing generated docs

  This decision establishes the pattern for generating technical documentation
  from annotated source files. It serves as both the DECISION (why/how) and
  the PROOF OF CONCEPT (demonstrating the pattern works).

## Dependencies

- Depends on: ShapeExtraction

## Acceptance Criteria

**Decision Rule descriptions become documentation sections**

- Given a decision with Rule blocks:
- When generating documentation from the decision
- Then section "## Context" contains the background
- And section "## How It Works" contains the approach
- And section "## Trade-offs" contains benefits and costs

| Rule Name | Content |
| --- | --- |
| Context - Why we need X | Background explanation |
| Decision - How X works | Implementation approach |
| Consequences - Trade-offs | Benefits and costs |

**Decision DocStrings become code examples**

- Given a decision with DocStrings containing code:
- When generating documentation
- Then code blocks appear with correct language tags
- And code content is preserved exactly

| Language | Content |
| --- | --- |
| bash | Pre-commit hook script |
| typescript | API usage example |

**Source mapping aggregates multiple files**

- Given a decision with source mapping table
- And the mapping references:
- When generating documentation
- Then content from all sources is aggregated
- And sections appear in mapping order

| Source | Extraction |
| --- | --- |
| behavior spec | Rule blocks |
| TypeScript file | @extract-shapes |

**Compact and detailed outputs from same sources**

- Given a decision with source mapping
- When generating with detail level "summary"
- Then output uses summary rendering (essential tables, type names only)
- When generating with detail level "detailed"
- Then output includes full content with JSDoc and examples

**Missing source file produces warning**

- Given a source mapping references "nonexistent.ts"
- When generating documentation
- Then warning is logged: "Source file not found: nonexistent.ts"
- And generation continues with available sources

**Source file exists but extraction method fails**

- Given a source mapping references "src/types.ts" with extraction "@extract-shapes"
- And the file exists but contains no matching shapes
- When generating documentation
- Then warning is logged: "No shapes extracted from src/types.ts"
- And generation continues with empty shapes section

**Source mapping validated at generation time**

- Given a decision with source mapping table
- When running validation before generation
- Then all referenced files are checked for existence
- And extraction methods are validated against file content
- And warnings are collected before generation starts

**Full pipeline generates documentation from decision documents**

- Given the ProcessGuard ADR exists at "decisions/adr-006-process-guard.feature"
- When running the doc-from-decision generator
- Then "_claude-md/validation/process-guard.md" is created from ProcessGuard ADR
- And "docs/PROCESS-GUARD.md" is created from ProcessGuard ADR
- And "_claude-md/generated/doc-generation-proof-of-concept.md" is created from this POC

**Generator registered in CODEC_MAP**

- Given the doc-from-decision generator is implemented
- Then it is registered in the GeneratorRegistry
- And can be invoked via generate-docs --generators doc-from-decision
- And follows the existing CodecBasedGenerator pattern

## Business Rules

**Context - Manual documentation maintenance does not scale**

**The Problem:**

    Common technical documentation is the hardest part to maintain in a repository.
    The volume constantly grows, and AI coding sessions are drastically less effective
    at updating documentation compared to code. Documentation drifts from source.

    Current state in this package:
    | Document | Lines | Maintenance Burden |
    | docs/PROCESS-GUARD.md | ~300 | High - duplicates code behavior |
    | docs/METHODOLOGY.md | ~400 | Medium - conceptual, changes less |
    | _claude-md/validation/*.md | ~50 each | High - must match detailed docs |
    | CLAUDE.md | ~800 | Very High - aggregates everything |

    **Root Causes:**

    1. **Duplication** - Same information exists in code comments, feature files,
       and markdown docs. Changes require updating multiple places.

    2. **No Single Source** - Documentation is authored separately from the code
       it describes. There's no compilation step to catch drift.

    3. **Detail Level Mismatch** - Compact docs for AI context and detailed docs
       for humans are maintained separately despite sharing content.

    **What We Have:**

    The delivery-process package already has the required ingredients:
    - Pattern extraction from TypeScript JSDoc and Gherkin tags
    - Rich content support (DocStrings, tables, code blocks in features)
    - Multi-source aggregation via tag taxonomy
    - Progressive disclosure via codec detail levels
    - Relationship tags for cross-references

    **What's Missing:**

    | Gap | Impact | Solution |
    | Shape extraction from TypeScript | High | New @extract-shapes tag |
    | Convention-tagged content | Medium | Decision records as convention sources |
    | Durable intro/context content | Medium | Decision Rule: Context sections |

**Decision - Decisions own convention content and durable context, code owns details**

**The Pattern:**

    Documentation is generated from three source types with different durability:

    | Source Type | Durability | Content Ownership |
    | Decision documents (ADR/PDR) | Permanent | Intro, context, rationale, conventions |
    | Behavior specs (.feature) | Permanent | Rules, examples, acceptance criteria |
    | Implementation code (.ts) | Compiled | API types, error messages, signatures |

    **Why Decisions Own Intro Content:**

    Tier 1 specs (roadmap features) become clutter after implementation - their
    deliverables are done, status is completed, they pile up. Behavior specs stay
    current because tests must pass. But neither is appropriate for intro content.

    Decisions (ADR/PDR) are durable by design - they remain valid until explicitly
    superseded. The `Rule: Context` section of a decision IS the background/intro
    for any documentation about that topic.

    **Extends Existing ADR Codec:**

    The doc-from-decision generator extends the existing `AdrDocumentCodec` which
    already parses Rule: prefixes via `partitionAdrRules()` (see adr.ts:627-663):

    | Rule Prefix | ADR Section | Doc Section |
    | `Context...` | context | ## Background / Introduction |
    | `Decision...` | decision | ## How It Works |
    | `Consequence...` | consequences | ## Trade-offs |
    | Other rules | other (warning logged) | Custom sections |

    **Source Mapping Pattern:**

    Each documentation decision declares its target documents and source mapping:

    | Target Document | Sources | Detail Level | Effect |
    | docs/PROCESS-GUARD.md | This decision + behavior specs + code | detailed | All sections, full JSDoc |
    | _claude-md/validation/process-guard.md | This decision + behavior specs + code | summary | Rules table, types only |

    **Detail Level Mapping:**

    Uses existing `DetailLevel` enum from `renderable/codecs/types/base.ts`:

    | Level | Content Included | Rendering Style |
    | summary | Essential tables, type names only | Compact - lists vs code blocks |
    | standard | Tables, types, key descriptions | Balanced |
    | detailed | Everything including JSDoc, examples | Full - code blocks with JSDoc |

    **Extraction by Source Type:**

    | Source | What's Extracted | How |
    | Decision Rule: Context | Intro/background section | Rule description text |
    | Decision Rule: Decision | How it works section | Rule description text |
    | Decision Rule: Consequences | Trade-offs section | Rule description text |
    | Decision DocStrings | Code examples (Husky, API) | Fenced code blocks |
    | Behavior spec Rules | Validation rules, business rules | Rule names + descriptions |
    | Behavior spec Scenario Outlines | Decision tables, lookup tables | Examples tables |
    | TypeScript @extract-shapes | API types, interfaces | AST extraction |
    | TypeScript JSDoc | Implementation notes | Markdown in comments |

    **The Generator Command:**

```bash
generate-docs --decisions 'specs/**/*.feature' --features 'tests/**/*.feature' --typescript 'src/**/*.ts' --generators doc-from-decision --output docs
```

**Proof of Concept - Self-documentation validates the pattern**

This POC demonstrates the doc-from-decision pattern by generating docs
    about ITSELF. The DocGenerationProofOfConcept pattern produces:

    | Output | Purpose | Detail Level |
    | docs/DOC-GENERATION-PROOF-OF-CONCEPT.md | Detailed reference | detailed |
    | _claude-md/generated/doc-generation-proof-of-concept.md | AI context | summary |

    **Process Guard docs are generated separately from `adr-006-process-guard.feature`.**

    **Source Mapping for POC Self-Documentation:**

    This source mapping demonstrates all extraction methods by extracting content
    from this POC's own sources. The table serves as both documentation AND test data.

    | Section | Source File | Extraction Method |
    | Intro & Context | THIS DECISION (Rule: Context above) | Decision rule description |
    | How It Works | THIS DECISION (Rule: Decision above) | Decision rule description |
    | Validation Rules | tests/features/validation/process-guard.feature | Rule blocks |
    | Protection Levels | delivery-process/specs/process-guard-linter.feature | Scenario Outline Examples |
    | Valid Transitions | delivery-process/specs/process-guard-linter.feature | Scenario Outline Examples |
    | API Types | src/lint/process-guard/types.ts | @extract-shapes tag |
    | Decider API | src/lint/process-guard/decider.ts | @extract-shapes tag |
    | CLI Options | src/cli/lint-process.ts | JSDoc section |
    | Error Messages | src/lint/process-guard/decider.ts | createViolation() patterns |
    | Pre-commit Setup | THIS DECISION (DocString) | Fenced code block |
    | Programmatic API | THIS DECISION (DocString) | Fenced code block |

    **Pre-commit Hook Setup:**

    File: `.husky/pre-commit`

```bash
npx lint-process --staged
```

**Package.json Scripts:**

```json
{
      "scripts": {
        "lint:process": "lint-process --staged",
        "lint:process:ci": "lint-process --all --strict"
      }
    }
```

**Programmatic API Example:**

```typescript
import {
      deriveProcessState,
      detectStagedChanges,
      validateChanges,
      hasErrors,
      summarizeResult,
    } from '@libar-dev/delivery-process/lint';

    // 1. Derive state from annotations
    const state = (await deriveProcessState({ baseDir: '.' })).value;

    // 2. Detect changes
    const changes = detectStagedChanges('.').value;

    // 3. Validate
    const { result } = validateChanges({
      state,
      changes,
      options: { strict: false, ignoreSession: false },
    });

    // 4. Handle results
    if (hasErrors(result)) {
      console.log(summarizeResult(result));
      process.exit(1);
    }
```

**Escape Hatches:**

    | Situation | Solution | Example |
    | Fix bug in completed spec | Add unlock reason tag | `@libar-docs-unlock-reason:'Fix-typo'` |
    | Modify outside session scope | Use ignore flag | `lint-process --staged --ignore-session` |
    | CI treats warnings as errors | Use strict flag | `lint-process --all --strict` |
    | Skip workflow (legacy import) | Multiple transitions | Set roadmap then completed in same commit |

**Expected Output - Compact claude module structure**

**File:** `_claude-md/validation/process-guard.md`

    The compact module extracts only essential content for AI context.
    Output size depends on source mapping entries - there is no artificial line limit.

    **Expected Sections:**

    | Section | Content |
    | Header + Intro | Pattern name, problem/solution summary |
    | API Types | Core interface definitions (DeciderInput, ValidationResult) |
    | 7 Validation Rules | Rule table with severity and description |
    | Protection Levels | Status-to-protection mapping table |
    | CLI | Essential command examples |
    | Link | Reference to full documentation |

    **Key Characteristics:**

    - Summary detail level (essential tables only)
    - No JSDoc comments or implementation details
    - Tables for structured data (rules, protection levels)
    - Inline code blocks for CLI examples
    - Cross-reference to detailed documentation

**Consequences - Durable sources with clear ownership boundaries**

**Benefits:**

    | Benefit | How |
    | Single source of truth | Each content type owned by one source |
    | Always-current docs | Generated from tested/compiled sources |
    | Reduced maintenance | Change source once, docs regenerate |
    | Progressive disclosure | Same sources → compact + detailed outputs |
    | Clear ownership | Decisions own "why", code owns "what" |

    **Trade-offs:**

    | Trade-off | Mitigation |
    | Decisions must be updated for fundamental changes | Appropriate - fundamentals ARE decisions |
    | New @extract-shapes capability required | Spec created (shape-extraction.feature) |
    | Initial annotation effort on existing code | One-time migration, then maintained |
    | Generated docs in git history | Same as current manual approach |

    **Ownership Boundaries:**

    | Content Type | Owner | Update Trigger |
    | Intro, rationale, context | Decision document | Fundamental change to approach |
    | Rules, examples, edge cases | Behavior specs | Behavior change (tests fail) |
    | API types, signatures | Code with @extract-shapes | Interface change (compile fail) |
    | Error messages | Code patterns | Message text change |
    | Code examples | Decision DocStrings | Example needs update |

**Consequences - Design stubs live in stubs, not src**

**The Problem:**

    Design stubs (pre-implementation API shapes) placed in `src/` cause issues:

    | Issue | Impact |
    | ESLint exceptions needed | Rules relaxed for "not-yet-real" code |
    | Confusion | What's production vs. what's design? |
    | Pollution | Stubs mixed with implemented code |
    | Import accidents | Other code might import unimplemented stubs |
    | Maintenance burden | Must track which files are stubs |

    Example of the anti-pattern (from monorepo eslint.config.js):

```javascript
// TODO: Delivery process design artifacts: Relax unused-vars
    {
      files: [
        "**/packages/platform-core/src/durability/durableAppend.ts",
        "**/packages/platform-core/src/durability/intentCompletion.ts",
        // ... more stubs in src/ ...
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
      },
    }
```

**The Solution:**

    Design stubs live in `delivery-process/stubs/`:

    | Location | Content | When Moved to src/ |
    | delivery-process/stubs/{pattern}/*.ts | API shapes, interfaces, throw-not-implemented | Implementation session |
    | src/**/*.ts | Production code only | Already there |

    **Design Stub Pattern:**

```typescript
// delivery-process/stubs/shape-extractor/shape-extractor.ts
    /**
     * @libar-docs
     * @libar-docs-pattern ShapeExtractorStub
     * @libar-docs-status roadmap
     *
     * ## Shape Extractor - Design Stub
     *
     * API design for extracting TypeScript types from source files.
     */

    export interface ExtractedShape {
      name: string;
      kind: 'interface' | 'type' | 'enum' | 'function';
      sourceText: string;
    }

    export function extractShapes(
      sourceCode: string,
      shapeNames: string[]
    ): Map<string, ExtractedShape> {
      throw new Error('ShapeExtractor not yet implemented - roadmap pattern');
    }
```

**Benefits:**

    | Benefit | How |
    | No ESLint exceptions | Stubs aren't in src/, no relaxation needed |
    | Clear separation | delivery-process/stubs/ = design, src/ = production |
    | Documentation source | Stubs with @extract-shapes generate API docs |
    | Safe iteration | Can refine stub APIs without breaking anything |
    | Implementation signal | Moving from delivery-process/stubs/ to src/ = implementation started |

    **Workflow:**

    1. **Design session:** Create stub in `delivery-process/stubs/{pattern-name}/`
    2. **Iterate:** Refine API shapes, add JSDoc, test with docs generation
    3. **Implementation session:** Move/copy to `src/`, implement real logic
    4. **Stub becomes example:** Original stub stays as reference (optional)

    **What This Enables:**

    Once proven with Process Guard, the pattern applies to all documentation:

    | Document | Decision Source |
    | docs/METHODOLOGY.md | ADR for delivery process methodology |
    | docs/TAXONOMY.md | PDR-006 TypeScript Taxonomy (exists) |
    | docs/VALIDATION.md | ADR for validation approach |
    | docs/SESSION-GUIDES.md | ADR for session workflows |
    | _claude-md/**/*.md | Corresponding decisions with compact extraction |

**Decision - Source mapping table parsing and extraction method dispatch**

**Invariant:** The source mapping table in a decision document defines how
    documentation sections are assembled from multiple source files.

    **Table Format:**

    | Column | Purpose | Example |
    | Section | Target section heading in generated doc | "Intro & Context", "API Types" |
    | Source File | Path to source file or self-reference marker | "src/types.ts", "THIS DECISION" |
    | Extraction Method | How to extract content from source | "@extract-shapes", "Rule blocks" |

    **Self-Reference Markers:**

    | Marker | Meaning |
    | THIS DECISION | Extract from the current decision document |
    | THIS DECISION (Rule: X) | Extract specific Rule: block from current document |
    | THIS DECISION (DocString) | Extract fenced code blocks from current document |

    **Extraction Method Dispatch:**

    | Extraction Method | Source Type | Action |
    | Decision rule description | Decision (.feature) | Extract Rule: block content (Invariant, Rationale) |
    | @extract-shapes tag | TypeScript (.ts) | Invoke shape extractor for @libar-docs-extract-shapes |
    | Rule blocks | Behavior spec (.feature) | Extract Rule: names and descriptions |
    | Scenario Outline Examples | Behavior spec (.feature) | Extract Examples tables as markdown |
    | JSDoc section | TypeScript (.ts) | Extract markdown from JSDoc comments |
    | createViolation() patterns | TypeScript (.ts) | Extract error message literals |
    | Fenced code block | Decision (.feature) | Extract DocString code blocks with language |

    **Path Resolution:**

    - Relative paths are resolved from project root
    - `THIS DECISION` resolves to the current decision document
    - Missing files produce warnings but generation continues

_Verified by: Decision Rule descriptions become documentation sections, Decision DocStrings become code examples, Source mapping aggregates multiple files, Compact and detailed outputs from same sources, Missing source file produces warning, Source file exists but extraction method fails, Source mapping validated at generation time, Full pipeline generates documentation from decision documents, Generator registered in CODEC_MAP_

---

[← Back to Pattern Registry](../PATTERNS.md)
