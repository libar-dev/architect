# Process API CLI

> Query delivery process state directly from the command line.

---

## Overview

The `process-api` CLI exposes the 27-method ProcessStateAPI as shell-accessible subcommands with JSON output. It runs the full scan-extract-transform pipeline on annotated TypeScript and Gherkin sources, then routes queries to the API.

**Primary use case:** Claude Code sessions querying delivery state without regenerating markdown documentation.

**Key benefits:**

- Real-time queries from annotated source code
- JSON output, pipeable to `jq` for filtering
- 5-10x smaller context than reading generated docs
- Same data as generated documentation, different access pattern

---

## Quick Start

```bash
# Overall delivery status
pnpm process:query -- status

# What's currently being worked on?
pnpm process:query -- query getCurrentWork

# Full detail for a specific pattern
pnpm process:query -- pattern ProcessStateAPI

# Architecture: which bounded contexts exist?
pnpm process:query -- arch roles

# Architecture: what's in the scanner context?
pnpm process:query -- arch context scanner
```

---

## Subcommands

### `status`

Returns delivery status counts and completion percentage.

```bash
pnpm process:query -- status
```

**Output:** `{ counts: { completed, active, planned, total }, completionPercentage, distribution }`

### `query <method> [args...]`

Executes any ProcessStateAPI method by name.

```bash
pnpm process:query -- query getStatusCounts
pnpm process:query -- query getPatternsByPhase 18
pnpm process:query -- query isValidTransition roadmap active
pnpm process:query -- query getPatternsByCategory projection
```

Integer-like arguments are automatically coerced to numbers.

### `pattern <name>`

Returns full detail for one pattern including deliverables, dependencies, and relationships.

```bash
pnpm process:query -- pattern OrderFulfillmentSaga
```

**Output:** Pattern metadata + deliverables array + dependencies + relationships (uses, usedBy, implementsPatterns, etc.)

### `arch <subcommand> [args]`

Architecture queries using `@libar-docs-arch-*` annotations.

| Subcommand               | Description                                | Example                        |
| ------------------------ | ------------------------------------------ | ------------------------------ |
| `roles`                  | All arch-roles with pattern counts         | `arch roles`                   |
| `context`                | All bounded contexts                       | `arch context`                 |
| `context <name>`         | Patterns in one bounded context            | `arch context scanner`         |
| `layer`                  | All architecture layers                    | `arch layer`                   |
| `layer <name>`           | Patterns in one layer                      | `arch layer domain`            |
| `neighborhood <pattern>` | Uses, usedBy, same-context siblings        | `arch neighborhood EventStore` |
| `compare <ctx1> <ctx2>`  | Cross-context shared deps + integration    | `arch compare scanner codec`   |
| `coverage`               | Annotation coverage analysis               | `arch coverage`                |
| `dangling`               | Broken references (names that don't exist) | `arch dangling`                |
| `orphans`                | Patterns with no relationships (isolated)  | `arch orphans`                 |
| `blocking`               | Patterns blocked by incomplete deps        | `arch blocking`                |

---

## CLI Options

| Flag                   | Short | Description                          | Default  |
| ---------------------- | ----- | ------------------------------------ | -------- |
| `--input <pattern>`    | `-i`  | TypeScript glob pattern (repeatable) | required |
| `--features <pattern>` |       | Gherkin glob pattern (repeatable)    | ---      |
| `--base-dir <dir>`     | `-b`  | Base directory                       | cwd      |
| `--workflow <file>`    | `-w`  | Workflow config JSON                 | default  |
| `--help`               | `-h`  | Show help                            | ---      |
| `--version`            | `-v`  | Show version                         | ---      |

**Exit codes:** `0` success, `1` error (with message on stderr)

---

## Available API Methods

All methods accessible via `query <method> [args...]`.

### Status Queries

| Method                          | Arguments                    | Returns                                 |
| ------------------------------- | ---------------------------- | --------------------------------------- |
| `getPatternsByNormalizedStatus` | `completed\|active\|planned` | Patterns by normalized status           |
| `getPatternsByStatus`           | `<status>`                   | Patterns by exact FSM status            |
| `getStatusCounts`               | ---                          | `{ completed, active, planned, total }` |
| `getStatusDistribution`         | ---                          | Counts + percentages                    |
| `getCompletionPercentage`       | ---                          | Integer 0-100                           |

### Phase Queries

| Method               | Arguments  | Returns                  |
| -------------------- | ---------- | ------------------------ |
| `getPatternsByPhase` | `<number>` | Patterns in phase        |
| `getPhaseProgress`   | `<number>` | Phase completion details |
| `getActivePhases`    | ---        | Phases with active work  |
| `getAllPhases`       | ---        | All phases sorted        |

### FSM Queries

| Method                    | Arguments     | Returns                  |
| ------------------------- | ------------- | ------------------------ |
| `isValidTransition`       | `<from> <to>` | Boolean                  |
| `checkTransition`         | `<from> <to>` | Detailed validation      |
| `getValidTransitionsFrom` | `<status>`    | Valid target states      |
| `getProtectionInfo`       | `<status>`    | Protection level details |

### Pattern Queries

| Method                    | Arguments    | Returns                          |
| ------------------------- | ------------ | -------------------------------- |
| `getPattern`              | `<name>`     | Full pattern detail              |
| `getPatternDependencies`  | `<name>`     | dependsOn, enables, uses, usedBy |
| `getPatternRelationships` | `<name>`     | All 10 relationship fields       |
| `getRelatedPatterns`      | `<name>`     | seeAlso values                   |
| `getApiReferences`        | `<name>`     | apiRef values                    |
| `getPatternDeliverables`  | `<name>`     | Deliverables with status         |
| `getPatternsByCategory`   | `<category>` | Patterns in category             |
| `getCategories`           | ---          | All categories with counts       |

### Timeline Queries

| Method                 | Arguments   | Returns                          |
| ---------------------- | ----------- | -------------------------------- |
| `getPatternsByQuarter` | `<quarter>` | Patterns in quarter              |
| `getQuarters`          | ---         | All quarters sorted              |
| `getCurrentWork`       | ---         | Active patterns                  |
| `getRoadmapItems`      | ---         | Roadmap + deferred patterns      |
| `getRecentlyCompleted` | `[limit]`   | Recently completed (default: 10) |

### Raw Access

| Method             | Arguments | Returns                           |
| ------------------ | --------- | --------------------------------- |
| `getMasterDataset` | ---       | Full MasterDataset with archIndex |

---

## Output Format

All subcommands output JSON to stdout. Errors go to stderr.

```bash
# Pipe to jq for filtering
pnpm process:query -- query getPatternsByCategory projection | jq '.[].patternName'

# Check a transition
pnpm process:query -- query isValidTransition roadmap active | jq '.valid // .'

# Get pattern names in a bounded context
pnpm process:query -- arch context scanner | jq '.[].patternName'
```

**Note:** `pnpm` outputs a banner line to stdout (`> @libar-dev/...`). For clean JSON piping, use `npx tsx src/cli/process-api.ts` directly instead of `pnpm process:query`.

---

## Common Use Cases

### Claude Code Session Start

```bash
# Quick status check
pnpm process:query -- status

# What's active?
pnpm process:query -- query getCurrentWork
```

### Planning Session

```bash
# What can we start next?
pnpm process:query -- query getRoadmapItems

# What phase are we in?
pnpm process:query -- query getActivePhases

# Check if a transition is valid before editing specs
pnpm process:query -- query isValidTransition roadmap active
```

### Implementation Session

```bash
# Get full detail for the pattern being implemented
pnpm process:query -- pattern ProcessStateAPI

# Check dependencies
pnpm process:query -- query getPatternRelationships ProcessStateAPI

# Architecture context
pnpm process:query -- arch context api
```
