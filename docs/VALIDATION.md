# Validation Tools

This guide covers the validation tools for ensuring annotation quality and process hygiene.

## Overview

The package provides three complementary validation systems:

| Tool                       | Purpose                          | Use Case                               |
| -------------------------- | -------------------------------- | -------------------------------------- |
| **Lint Patterns**          | Annotation quality checking      | Ensure patterns have required metadata |
| **Anti-Pattern Detection** | Architecture violation detection | Enforce dual-source ownership rules    |
| **DoD Validation**         | Definition of Done checks        | Validate phases are truly complete     |

---

## Lint Patterns

The lint-patterns tool validates `@<prefix>-*` annotations for completeness and quality.

### Rules Reference

| Rule                             | Severity | Description                                              |
| -------------------------------- | -------- | -------------------------------------------------------- |
| `missing-pattern-name`           | error    | Pattern must have explicit `@<prefix>-pattern` name      |
| `invalid-status`                 | error    | Status must be a valid FSM value                         |
| `tautological-description`       | error    | Description should not simply repeat the pattern name    |
| `pattern-conflict-in-implements` | error    | Implementation files must not also define patterns       |
| `missing-relationship-target`    | warning  | Relationship targets must reference existing patterns    |
| `missing-status`                 | warning  | Pattern should have `@<prefix>-status` tag               |
| `missing-when-to-use`            | warning  | Pattern should have "When to Use" section                |
| `missing-relationships`          | info     | Consider adding `@<prefix>-uses` and `@<prefix>-used-by` |

### Severity Levels

| Level     | Meaning                   | Default Behavior         |
| --------- | ------------------------- | ------------------------ |
| `error`   | Blocks commit/CI          | Always reported          |
| `warning` | Should fix, doesn't block | Reported unless filtered |
| `info`    | Suggestion only           | Reported unless filtered |

### CLI Usage

```bash
# Basic usage
npx lint-patterns -i "src/**/*.ts"

# Strict mode - treat warnings as errors
npx lint-patterns -i "src/**/*.ts" --strict

# Filter to errors only
npx lint-patterns -i "src/**/*.ts" --min-severity error

# JSON output for tooling
npx lint-patterns -i "src/**/*.ts" --format json

# With known patterns for relationship validation
npx lint-patterns -i "src/**/*.ts" --known-patterns patterns.json
```

### CLI Options

| Flag                      | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `-i, --input <glob>`      | Glob pattern for files to lint (required)                      |
| `-o, --output <file>`     | Output file for results (optional)                             |
| `--strict`                | Treat warnings as errors (exit 1 on warnings)                  |
| `--min-severity <level>`  | Minimum severity to report: error, warning, info               |
| `--format <type>`         | Output format: pretty (default) or json                        |
| `--known-patterns <file>` | JSON file with known pattern names for relationship validation |

### Programmatic API

```typescript
import {
  lintFiles,
  lintDirective,
  hasFailures,
  defaultRules,
  filterRulesBySeverity,
  formatPretty,
  formatJson,
} from '@libar-dev/delivery-process/lint';

// Lint files with default rules
const result = await lintFiles({
  include: ['src/**/*.ts'],
  rules: defaultRules,
});

if (hasFailures(result)) {
  console.log(formatPretty(result));
  process.exit(1);
}

// Filter to errors only
const errorRules = filterRulesBySeverity(defaultRules, 'error');
const strictResult = await lintFiles({
  include: ['src/**/*.ts'],
  rules: errorRules,
});

// Lint a single directive
const directive = { patternName: 'MyPattern', status: 'active' };
const violations = lintDirective(directive, 'src/file.ts', 10);
```

---

## Anti-Pattern Detection

Detects violations of the dual-source documentation architecture and process hygiene issues.

### Detection Rules

| ID                | Severity | Description                                     | Fix                                                            |
| ----------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `tag-duplication` | error    | Dependency tags found in feature files          | Move to TypeScript code with `@<prefix>-depends-on`            |
| `process-in-code` | error    | Process metadata found in TypeScript code       | Move `@<prefix>-quarter`, `@<prefix>-team` to `.feature` files |
| `magic-comments`  | warning  | Generator hints like `# GENERATOR:` in features | Use standard Gherkin tags instead                              |
| `scenario-bloat`  | warning  | Too many scenarios per feature (>20 default)    | Split feature file by component/domain                         |
| `mega-feature`    | warning  | Feature file too large (>500 lines default)     | Split into smaller feature files                               |

### Dual-Source Architecture

The anti-pattern detector enforces ownership rules:

| Tag Type               | Correct Location | Wrong Location  |
| ---------------------- | ---------------- | --------------- |
| `@<prefix>-depends-on` | TypeScript code  | Feature files   |
| `@<prefix>-enables`    | TypeScript code  | Feature files   |
| `@<prefix>-quarter`    | Feature files    | TypeScript code |
| `@<prefix>-team`       | Feature files    | TypeScript code |
| `@<prefix>-effort`     | Feature files    | TypeScript code |
| `@<prefix>-completed`  | Feature files    | TypeScript code |

### Configurable Thresholds

| Threshold                  | Default | Description                       |
| -------------------------- | ------- | --------------------------------- |
| `magicCommentThreshold`    | 5       | Max magic comments before warning |
| `scenarioBloatThreshold`   | 20      | Max scenarios per feature         |
| `megaFeatureLineThreshold` | 500     | Max lines per feature file        |

### CLI Usage

```bash
# Run via validate-patterns command
npx validate-patterns -i "**/*.feature" -t "src/**/*.ts" --anti-patterns

# With custom thresholds
npx validate-patterns -i "**/*.feature" -t "src/**/*.ts" --anti-patterns \
  --scenario-threshold 15 --mega-threshold 300
```

### Programmatic API

```typescript
import {
  detectAntiPatterns,
  detectProcessInCode,
  detectMagicComments,
  detectScenarioBloat,
  detectMegaFeature,
  formatAntiPatternReport,
  toValidationIssues,
} from '@libar-dev/delivery-process/validation';

// Detect all anti-patterns
const violations = detectAntiPatterns(scannedTsFiles, scannedFeatures, {
  registry, // Optional: for prefix-aware messages
  thresholds: {
    magicCommentThreshold: 3,
    scenarioBloatThreshold: 15,
    megaFeatureLineThreshold: 400,
  },
});

// Format for console output
console.log(formatAntiPatternReport(violations));

// Convert to ValidationIssue format
const issues = toValidationIssues(violations);

// Individual detectors
const processInCode = detectProcessInCode(tsFiles, registry);
const magicComments = detectMagicComments(features, 5);
const bloat = detectScenarioBloat(features, 20);
const mega = detectMegaFeature(features, 500);
```

---

## DoD (Definition of Done) Validation

Validates that completed phases meet Definition of Done criteria before release.

### What It Checks

For each phase/pattern with `completed` status:

| Criterion               | Requirement                                             |
| ----------------------- | ------------------------------------------------------- |
| **Deliverables**        | All deliverables must have "complete" status            |
| **Acceptance Criteria** | At least one `@acceptance-criteria` scenario must exist |

### Completion Status Detection

The following values indicate a deliverable is complete:

- Text values: `Complete`, `Done`, `Finished`
- Symbol values: `✓`, `✅`, `☑`

### CLI Usage

```bash
# Validate DoD for all completed phases
npx validate-patterns -i "**/*.feature" --dod

# Validate DoD for specific phases
npx validate-patterns -i "**/*.feature" --dod --phases 14,15,16
```

### Programmatic API

```typescript
import {
  validateDoD,
  validateDoDForPhase,
  formatDoDSummary,
  isDeliverableComplete,
  hasAcceptanceCriteria,
  extractAcceptanceCriteriaScenarios,
} from '@libar-dev/delivery-process/validation';

// Validate all completed phases
const summary = validateDoD(scannedFeatures);

// Filter to specific phases
const phaseSummary = validateDoD(scannedFeatures, [14, 15]);

// Format for console
console.log(formatDoDSummary(summary));
// Output:
// DoD Validation Summary
// ======================
// Total phases validated: 5
// Passed: 4
// Failed: 1
//
// Failed Phases:
//   [FAIL] Phase 15: ProjectionCategories
//          2/4 deliverables incomplete
//          - "Query API" (status: In Progress)
//          - "Documentation" (status: Planned)

// Validate single phase
const result = validateDoDForPhase('ProjectionCategories', 15, feature);
if (!result.isDoDMet) {
  console.log('Incomplete deliverables:', result.incompleteDeliverables);
  console.log('Missing AC:', result.missingAcceptanceCriteria);
}

// Check individual deliverable
const deliverable = { name: 'Query API', status: 'Complete', tests: 5, location: 'src/' };
const isComplete = isDeliverableComplete(deliverable); // true

// Check for acceptance criteria
const hasAC = hasAcceptanceCriteria(feature);
const acScenarios = extractAcceptanceCriteriaScenarios(feature);
```

### Validation Result Structure

```typescript
interface DoDValidationResult {
  patternName: string;
  phase: number;
  isDoDMet: boolean;
  deliverables: Deliverable[];
  incompleteDeliverables: Deliverable[];
  missingAcceptanceCriteria: boolean;
  messages: string[];
}

interface DoDValidationSummary {
  results: DoDValidationResult[];
  totalPhases: number;
  passedPhases: number;
  failedPhases: number;
}
```

---

## Combined Validation

The `validate-patterns` CLI combines all validation tools:

```bash
# Full validation suite
npx validate-patterns \
  -i "specs/**/*.feature" \
  -t "src/**/*.ts" \
  --dod \
  --anti-patterns \
  --cross-source \
  --strict
```

### CLI Options

| Flag                      | Description                               |
| ------------------------- | ----------------------------------------- |
| `-i, --input <glob>`      | Glob pattern for feature files            |
| `-t, --typescript <glob>` | Glob pattern for TypeScript files         |
| `--dod`                   | Run Definition of Done validation         |
| `--anti-patterns`         | Run anti-pattern detection                |
| `--cross-source`          | Validate feature/TypeScript consistency   |
| `--phases <list>`         | Specific phases for DoD (comma-separated) |
| `--strict`                | Treat warnings as errors                  |
| `--format <type>`         | Output format: pretty or json             |

### Exit Codes

| Code | Meaning                                    |
| ---- | ------------------------------------------ |
| `0`  | All validations passed                     |
| `1`  | Errors found (or warnings with `--strict`) |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Validate Documentation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install

      - name: Lint Patterns
        run: pnpm lint-patterns -i "src/**/*.ts" --strict

      - name: Validate Documentation
        run: pnpm validate-patterns -i "specs/**/*.feature" -t "src/**/*.ts" --dod --anti-patterns
```

### package.json Scripts

```json
{
  "scripts": {
    "lint:patterns": "lint-patterns -i 'src/**/*.ts'",
    "lint:patterns:strict": "lint-patterns -i 'src/**/*.ts' --strict",
    "validate": "validate-patterns -i 'specs/**/*.feature' -t 'src/**/*.ts' --dod --anti-patterns",
    "validate:strict": "validate-patterns -i 'specs/**/*.feature' -t 'src/**/*.ts' --dod --anti-patterns --strict"
  }
}
```
