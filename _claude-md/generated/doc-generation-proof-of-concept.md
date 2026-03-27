# DocGenerationProofOfConcept

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Intro & Context

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

    The Architect package already has the required ingredients:
    - Pattern extraction from TypeScript JSDoc and Gherkin tags
    - Rich content support (DocStrings, tables, code blocks in features)
    - Multi-source aggregation via tag taxonomy
    - Progressive disclosure via codec detail levels
    - Relationship tags for cross-references

    **What's Missing:**

    | Gap | Impact | Solution |
    | Shape extraction from TypeScript | High | New @extract-shapes tag |
    | Recipe for aggregation | Medium | Decision documents as recipes |
    | Durable intro/context content | Medium | Decision Rule: Context sections |

### How It Works

**The Pattern:**

    Documentation is generated from three source types with different durability:

    | Source Type | Durability | Content Ownership |
    | Decision documents (ADR/PDR) | Permanent | Intro, context, rationale, recipes |
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

    """bash
    generate-docs --decisions 'specs/**/*.feature' --features 'tests/**/*.feature' --typescript 'src/**/*.ts' --generators doc-from-decision --output docs
    """

### Protection Levels

| spec                        | intent |
| --------------------------- | ------ |
| mvp-workflow-implementation | modify |
| short-form-tag-migration    | review |

| spec                        |
| --------------------------- |
| mvp-workflow-implementation |

| Deliverable | Status  |
| ----------- | ------- |
| Task A      | Done    |
| Task B      | Pending |

| Deliverable | Status  |
| ----------- | ------- |
| Task A      | Pending |

| Section         | Content                            |
| --------------- | ---------------------------------- |
| Active Session  | Session ID and status, or "none"   |
| Scoped Specs    | List of specs in scope             |
| Protected Specs | Specs with active/completed status |

| Tag            | Format | Purpose                                  |
| -------------- | ------ | ---------------------------------------- |
| session-id     | value  | Unique session identifier                |
| session-status | enum   | Session lifecycle: draft, active, closed |
| session-scope  | flag   | Marks file as session definition         |

| Tag           | Format       | Purpose                            |
| ------------- | ------------ | ---------------------------------- |
| unlock-reason | quoted-value | Required to modify protected files |
| locked-by     | value        | Session ID that locked the file    |

### Valid Transitions

| spec                        | intent |
| --------------------------- | ------ |
| mvp-workflow-implementation | modify |
| short-form-tag-migration    | review |

| spec                        |
| --------------------------- |
| mvp-workflow-implementation |

| Deliverable | Status  |
| ----------- | ------- |
| Task A      | Done    |
| Task B      | Pending |

| Deliverable | Status  |
| ----------- | ------- |
| Task A      | Pending |

| Section         | Content                            |
| --------------- | ---------------------------------- |
| Active Session  | Session ID and status, or "none"   |
| Scoped Specs    | List of specs in scope             |
| Protected Specs | Specs with active/completed status |

| Tag            | Format | Purpose                                  |
| -------------- | ------ | ---------------------------------------- |
| session-id     | value  | Unique session identifier                |
| session-status | enum   | Session lifecycle: draft, active, closed |
| session-scope  | flag   | Marks file as session definition         |

| Tag           | Format       | Purpose                            |
| ------------- | ------------ | ---------------------------------- |
| unlock-reason | quoted-value | Required to modify protected files |
| locked-by     | value        | Session ID that locked the file    |

### API Types

- `ProcessGuardRule` - type
- `DeciderInput` - interface
- `ValidationResult` - interface
- `ProcessViolation` - interface
- `FileState` - interface

### Decider API

- `validateChanges` - function

### Error Messages

| Error Code                |
| ------------------------- |
| completed-protection      |
| invalid-status-transition |
| scope-creep               |
| deliverable-removed       |
| session-scope             |
| session-excluded          |

### Pre-commit Setup

```bash
generate-docs --decisions 'specs/**/*.feature' --features 'tests/**/*.feature' --typescript 'src/**/*.ts' --generators doc-from-decision --output docs
```

```json
{
  "scripts": {
    "lint:process": "architect-guard --staged",
    "lint:process:ci": "architect-guard --all --strict"
  }
}
```

```typescript
import {
  deriveProcessState,
  detectStagedChanges,
  validateChanges,
  hasErrors,
  summarizeResult,
} from '@libar-dev/architect/lint';

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

```bash
npx architect-guard --staged
```

```javascript
// TODO: Architect design artifacts: Relax unused-vars
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

```typescript
// specs/stubs/shape-extractor.ts
/**
 * @architect
 * @architect-pattern ShapeExtractorStub
 * @architect-status roadmap
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

### Programmatic API

```bash
generate-docs --decisions 'specs/**/*.feature' --features 'tests/**/*.feature' --typescript 'src/**/*.ts' --generators doc-from-decision --output docs
```

```json
{
  "scripts": {
    "lint:process": "architect-guard --staged",
    "lint:process:ci": "architect-guard --all --strict"
  }
}
```

```typescript
import {
  deriveProcessState,
  detectStagedChanges,
  validateChanges,
  hasErrors,
  summarizeResult,
} from '@libar-dev/architect/lint';

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

```bash
npx architect-guard --staged
```

```javascript
// TODO: Architect design artifacts: Relax unused-vars
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

```typescript
// specs/stubs/shape-extractor.ts
/**
 * @architect
 * @architect-pattern ShapeExtractorStub
 * @architect-status roadmap
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
