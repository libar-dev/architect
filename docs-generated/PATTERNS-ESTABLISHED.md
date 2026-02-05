# Auto-Generated Documentation Patterns

> **Established patterns from Phase 1 (PROCESS-GUARD.md) for sequential agent deployment.**

---

## Overview

This document captures the patterns established during Phase 1 for auto-generating documentation from annotated source code. Sequential agents should use these patterns as context.

### Generation Command Template

```bash
npx tsx scripts/generate-docs-auto.ts [filter-pattern]

# Examples:
npx tsx scripts/generate-docs-auto.ts                    # All feature files
npx tsx scripts/generate-docs-auto.ts process-guard      # Only process-guard-*
npx tsx scripts/generate-docs-auto.ts taxonomy           # Only taxonomy-*
```

### Output Structure

```
docs-generated/
├── docs/                    # Detailed human-readable (300-500 lines)
│   └── {PATTERN}-REFERENCE.md
├── _claude-md/              # Compact Claude context (50-150 lines)
│   └── {section}/
│       └── {pattern}-reference.md
└── PATTERNS-ESTABLISHED.md  # This file
```

---

## Feature File Pattern

### Location and Naming

```
specs/docs/{document-name}-reference.feature
```

### Required Tags

```gherkin
@libar-docs
@libar-docs-pattern:{PatternName}Reference
@libar-docs-status:active
@libar-docs-phase:99
@libar-docs-core
@libar-docs-{category}
@libar-docs-claude-md-section:{section-name}
```

| Tag | Purpose |
| --- | --- |
| `@libar-docs-pattern` | PascalCase identifier for the pattern |
| `@libar-docs-status:active` | Required for generation (not roadmap) |
| `@libar-docs-phase:99` | High phase number for documentation |
| `@libar-docs-core` | Marks as core documentation |
| `@libar-docs-{category}` | Category tag (lint, validation, etc.) |
| `@libar-docs-claude-md-section` | Output folder in _claude-md/ |

### Feature Description Structure

```gherkin
Feature: {Pattern Name} - Auto-Generated Documentation

  **Problem:**
  Brief description of what problem this documentation solves.

  **Solution:**
  Brief description of how the documentation solves it.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/{NAME}.md | Detailed human reference | detailed |
| docs-generated/_claude-md/{section}/{name}.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| {Section Name} | THIS DECISION (Rule: {Rule Name}) | Rule block table |
| {Section Name} | src/path/to/file.ts | @extract-shapes tag |
| {Diagram Name} | THIS DECISION (Rule: {Rule Name} DocString) | Fenced code block (Mermaid) |
```

### Background Section (Deliverables)

```gherkin
  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Feature file | Complete | specs/docs/{name}.feature |
      | Generated detailed docs | Pending | docs-generated/docs/{NAME}.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/{section}/{name}.md |
```

---

## Rule Block Patterns

### Table-Based Rules

Use for reference tables that should appear in output:

```gherkin
  Rule: {Rule Name}

    **Context:** Brief context for this rule.

    **Decision:** Brief decision statement:

| Column1 | Column2 | Column3 |
| --- | --- | --- |
| value1 | value2 | value3 |
```

### Mermaid Diagrams in DocStrings

Use triple-quoted DocStrings with language hint:

```gherkin
  Rule: {Rule Name}

    **Context:** Context for the diagram.

    **{Diagram Type} Diagram:**

    """mermaid
    stateDiagram-v2
        [*] --> state1
        state1 --> state2 : transition
    """
```

**CRITICAL CONSTRAINT:** DocStrings cannot have `#` at the start of any line. The Gherkin parser treats `#` as a comment, which terminates the description context.

### Code Examples in DocStrings

```gherkin
  Rule: CLI Usage

    **CLI Examples:**

    """bash
    lint-process --staged
    lint-process --all --strict
    """

  Rule: Programmatic API

    **Usage Example:**

    """typescript
    import { ... } from '@libar-dev/delivery-process/lint';

    const state = (await deriveProcessState({ baseDir: '.' })).value;
    """
```

**FORBIDDEN in DocStrings:**
- `#` at start of line (treated as Gherkin comment)
- `@` prefixed identifiers (treated as Gherkin tags)
- `Feature:`, `Scenario:`, other Gherkin keywords at start of line

---

## Source Annotation Pattern

### @libar-docs-extract-shapes

Add to TypeScript files to extract types, interfaces, functions, or constants:

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes TypeName1, TypeName2, FunctionName
 */
```

**Example from src/validation/fsm/transitions.ts:**

```typescript
/**
 * @libar-docs-extract-shapes VALID_TRANSITIONS, isValidTransition, getValidTransitionsFrom, getTransitionErrorMessage
 */
```

### What Gets Extracted

| Source Element | Extraction |
| --- | --- |
| `type Foo = ...` | Full type definition with JSDoc |
| `interface Bar { ... }` | Full interface with properties and JSDoc |
| `function baz(...)` | Function signature with JSDoc |
| `const QUX = ...` | Const declaration with JSDoc |

### JSDoc Quality

Shape extraction preserves JSDoc comments. Well-documented source code produces better generated documentation:

```typescript
/**
 * Valid FSM transitions matrix
 *
 * Maps each state to the list of states it can transition to.
 *
 * | From      | Valid Targets              | Notes                        |
 * |-----------|----------------------------|------------------------------|
 * | roadmap   | active, deferred, roadmap  | Can start, park, or stay     |
 * | active    | completed, roadmap         | Can finish or regress        |
 */
const VALID_TRANSITIONS: Readonly<...>;
```

---

## Validation Checklist

After running generation, verify:

| Check | Method |
| --- | --- |
| Files exist | `ls docs-generated/docs/` and `ls docs-generated/_claude-md/` |
| TypeScript shapes extracted | Look for ```typescript code blocks |
| Mermaid diagrams included | Look for ```mermaid code blocks |
| Tables rendered | Look for pipe-delimited tables |
| Code examples included | Look for ```bash and ```typescript blocks |
| No Gherkin artifacts | No `Rule:`, `Given`, `When`, `Then` in output |
| Compact version smaller | `_claude-md/` version should be 50-150 lines |

### Content Comparison with Original

Generated docs focus on **API reference**. Original docs may include:

| Original Content | In Generated? | Notes |
| --- | --- | --- |
| Type definitions | Yes | Via @extract-shapes |
| Function signatures | Yes | Via @extract-shapes |
| Tables | Yes | From Rule blocks |
| Mermaid diagrams | Yes | From DocStrings |
| Error message examples | No | Add to Rule blocks if needed |
| Narrative explanations | Partial | Feature description only |
| Pre-commit setup | No | Manual content |
| Related docs links | No | Manual content |

---

## Generation Script

### scripts/generate-docs-auto.ts

```typescript
const CONFIG = {
  typescriptSources: [
    'src/lint/process-guard/**/*.ts',
    'src/validation/fsm/**/*.ts',
    'src/cli/lint-process.ts',
  ],
  featureFiles: 'specs/docs/*.feature',
  outputDir: 'docs-generated',
  force: true,
};
```

To add new documentation:
1. Add TypeScript source patterns to `typescriptSources`
2. Create feature file in `specs/docs/`
3. Run `npx tsx scripts/generate-docs-auto.ts`

---

## Sequential Agent Context

When deploying agents for remaining docs, provide:

1. **This patterns file** as reference
2. **Feature file template** from specs/docs/process-guard-reference.feature
3. **Source mapping guidance** for the specific document
4. **Quality checklist** from this document

### Remaining Documents (Priority Order)

| Priority | Document | Est. Auto-Gen % | Key Sources |
| --- | --- | --- | --- |
| 2 | TAXONOMY.md | 60% | src/taxonomy/*.ts |
| 3 | VALIDATION.md | 50% | src/lint/rules.ts, src/validation/ |
| 4 | CONFIGURATION.md | 50% | src/config/presets.ts |
| 5 | ARCHITECTURE.md | 40% | src/renderable/codecs/, pipeline |
| 6 | INDEX.md | 60% | Scan generated docs |
| 7 | SESSION-GUIDES.md | 20% | src/validation/fsm/ |
| 8 | GHERKIN-PATTERNS.md | 15% | src/taxonomy/, feature examples |
| 9 | METHODOLOGY.md | 10% | Annotation examples from source |
| 10 | PUBLISHING.md | 10% | package.json scripts |
| 11 | INSTRUCTIONS.md | TBD | All tag definitions, CLI options |

---

## Troubleshooting

### Common Errors

| Error | Cause | Fix |
| --- | --- | --- |
| "A tag may not contain whitespace" | `@` in DocString | Remove `@` or escape |
| "expected: #EOF" after line N | `#` at start of DocString line | Remove comment line |
| "expected: #EOF... got 'Feature:'" | Gherkin keyword in DocString | Remove or rephrase |
| No TypeScript shapes in output | Missing @extract-shapes | Add annotation to source file |
| Empty _claude-md output | Missing @libar-docs-claude-md-section | Add tag to feature file |

### Debugging

1. **Check feature file syntax:**
   ```bash
   npx gherkin-lint specs/docs/{file}.feature
   ```

2. **Check source annotations:**
   ```bash
   grep -r "@libar-docs-extract-shapes" src/
   ```

3. **Run generation with verbose output:**
   ```bash
   npx tsx scripts/generate-docs-auto.ts 2>&1 | head -100
   ```
