### Dual-Source Architecture

Patterns can be defined in TypeScript, Feature files, or both. Each source owns specific metadata.

#### When to Use TypeScript vs Feature Files

| Use Case                  | Source       | Why                                       |
| ------------------------- | ------------ | ----------------------------------------- |
| Retroactive documentation | TypeScript   | Code existed before delivery process      |
| Rich relationships        | TypeScript   | `@libar-docs-uses`, `@libar-docs-used-by` |
| Phase/release tracking    | Feature file | Milestone planning                        |
| Acceptance criteria       | Feature file | BDD scenarios                             |
| New patterns              | Both         | Feature for roadmap, TypeScript for graph |

#### Category Flags (libar-generic preset)

| Flag                | Domain         |
| ------------------- | -------------- |
| `@libar-docs-core`  | Core patterns  |
| `@libar-docs-api`   | Public APIs    |
| `@libar-docs-infra` | Infrastructure |

**Note:** The `@libar-docs` opt-in marker is NOT a category—add explicit category tags for proper categorization.

#### Dual-Source Merging

When pattern exists in both TypeScript AND feature file:

| Aspect            | Resolution                      |
| ----------------- | ------------------------------- |
| Pattern name      | Must match exactly              |
| Categories        | Unioned from both sources       |
| `uses`, `used-by` | Unioned from both sources       |
| Phase/release     | Feature file takes precedence   |
| Description       | TypeScript markdown description |

**Warning:** If TypeScript file is missing `@libar-docs-status`, the pattern data is **ignored** and not merged with feature file.
