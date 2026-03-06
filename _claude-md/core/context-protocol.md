### Context Gathering Protocol (MANDATORY)

**Rule: Always query the Process Data API BEFORE using grep, explore agents, or reading files.**

The API returns structured, current data using 5-10x less context than file reads. Annotations and relationships in source files feed the API — invest in annotations, not manual notes.

#### PR / Session Start (run these FIRST)

| Step | Command                                                    | What You Get                                |
| ---- | ---------------------------------------------------------- | ------------------------------------------- |
| 1    | `pnpm process:query -- overview`                           | Project health, active phases, blockers     |
| 2    | `pnpm process:query -- scope-validate <pattern> <session>` | Pre-flight: FSM violations, missing deps    |
| 3    | `pnpm process:query -- context <pattern> --session <type>` | Curated context bundle for the session      |
| 4    | `pnpm process:query -- files <pattern> --related`          | File reading list with implementation paths |

Session types: `planning` (minimal), `design` (full: stubs + deps + deliverables), `implement` (focused: deliverables + FSM + tests).

#### When You Need More Context

| Need                    | Command (NOT grep)                          | Why                                         |
| ----------------------- | ------------------------------------------- | ------------------------------------------- |
| Find code structure     | `arch context [name]` / `arch layer [name]` | Structured by annotations, not file paths   |
| Find dependencies       | `dep-tree <pattern>`                        | Shows status of each dependency             |
| Find business rules     | `rules --pattern <name>`                    | Extracted from Gherkin Rule: blocks         |
| Find unannotated files  | `unannotated --path <dir>`                  | Catches missing @libar-docs markers         |
| Check FSM state         | `query getProtectionInfo <status>`          | Protection level + allowed actions          |
| Check valid transitions | `query getValidTransitionsFrom <status>`    | Valid next states from current status       |
| Tag inventory           | `tags`                                      | Counts per tag and value across all sources |
| Annotation coverage     | `arch coverage`                             | Files with/without @libar-docs annotations  |

#### Why Annotations Beat Grep

- **Structured**: `arch context` groups by bounded context; grep returns unstructured matches
- **Queryable**: `rules --only-invariants` extracts 140+ business rules; grep can't parse Rule: blocks
- **Feed generation**: Annotations produce generated docs; grep results are ephemeral
- **Discoverable**: `unannotated --path` finds gaps; grep doesn't know what's missing

**When adding new code:** Add `@libar-docs` annotations and relationship tags (`@libar-docs-depends-on`, `@libar-docs-uses`) so future sessions can discover the code via API queries instead of grep.

Full CLI reference: `pnpm process:query -- --help`
