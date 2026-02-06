### Process API CLI

Query delivery process state directly from the terminal instead of reading generated markdown. Returns JSON, pipeable to `jq`.

**Prefer the CLI over reading `PATTERNS.md` or `ROADMAP.md`** — targeted queries use 5-10x less context than reading full documents.

#### Subcommands

```bash
# Delivery status overview
pnpm process:query -- status

# Execute any ProcessStateAPI method by name
pnpm process:query -- query getCurrentWork
pnpm process:query -- query getPatternsByCategory projection
pnpm process:query -- query getPatternsByPhase 18
pnpm process:query -- query isValidTransition roadmap active

# Full detail for one pattern (metadata + deliverables + dependencies + relationships)
pnpm process:query -- pattern OrderFulfillmentSaga

# Architecture queries (bounded contexts, layers, roles, dependency graphs)
pnpm process:query -- arch roles
pnpm process:query -- arch context scanner
pnpm process:query -- arch layer domain
pnpm process:query -- arch graph ProcessStateAPI
```

#### Session Workflows

| Session Start Task       | Command                                                        |
| ------------------------ | -------------------------------------------------------------- |
| Quick status check       | `pnpm process:query -- status`                                 |
| Find active work         | `pnpm process:query -- query getCurrentWork`                   |
| Check roadmap items      | `pnpm process:query -- query getRoadmapItems`                  |
| Validate a transition    | `pnpm process:query -- query isValidTransition roadmap active` |
| Get pattern dependencies | `pnpm process:query -- query getPatternRelationships <name>`   |
| Explore architecture     | `pnpm process:query -- arch context <name>`                    |

#### Clean JSON Piping

`pnpm` outputs a banner line to stdout (`> @libar-dev/...`). For clean JSON piping to `jq`, use `npx tsx` directly:

```bash
npx tsx src/cli/process-api.ts -i 'src/**/*.ts' --features 'delivery-process/specs/*.feature' query getPatternsByCategory projection | jq '.[].patternName'
```

See `docs/PROCESS-API.md` for the complete 28-method API reference.
