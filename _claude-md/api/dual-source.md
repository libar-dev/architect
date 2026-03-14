### Dual-Source Architecture

Patterns can be defined in TypeScript, Feature files, or both. Each source owns specific metadata.

#### When to Use TypeScript vs Feature Files

| Use Case                  | Source       | Why                                       |
| ------------------------- | ------------ | ----------------------------------------- |
| Retroactive documentation | TypeScript   | Code existed before delivery process      |
| Rich relationships        | TypeScript   | `@architect-uses`, `@architect-used-by`   |
| Phase/release tracking    | Feature file | Milestone planning                        |
| Acceptance criteria       | Feature file | BDD scenarios                             |
| New patterns              | Both         | Feature for roadmap, TypeScript for graph |

#### Category Flags (libar-generic preset)

| Flag               | Domain         |
| ------------------ | -------------- |
| `@architect-core`  | Core patterns  |
| `@architect-api`   | Public APIs    |
| `@architect-infra` | Infrastructure |

**Note:** The `@architect` opt-in marker is NOT a category—add explicit category tags for proper categorization.

#### Dual-Source Merging

When pattern exists in both TypeScript AND feature file:

| Aspect            | Resolution                      |
| ----------------- | ------------------------------- |
| Pattern name      | Must match exactly              |
| Categories        | Unioned from both sources       |
| `uses`, `used-by` | Unioned from both sources       |
| Phase/release     | Feature file takes precedence   |
| Description       | TypeScript markdown description |

**Warning:** If TypeScript file is missing `@architect-status`, the pattern data is **ignored** and not merged with feature file.

**Implementation:** `mergePatterns()` in `src/generators/pipeline/merge-patterns.ts`. Conflict strategy is per-consumer: `fatal` (orchestrator/process-api) or `concatenate` (validator).
