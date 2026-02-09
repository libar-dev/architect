### Data API CLI

Query delivery process state directly from the terminal. **Use this instead of reading generated markdown or launching explore agents** — targeted queries use 5-10x less context.

Run `pnpm process:query -- --help` for the full command reference with all options.

#### Context Gathering (Text Output — Use First in Sessions)

| Command                                                       | What It Provides                                         |
| ------------------------------------------------------------- | -------------------------------------------------------- |
| `pnpm process:query -- context <pattern> --session design`    | Pattern metadata, description, stubs, deps, deliverables |
| `pnpm process:query -- context <pattern> --session implement` | Deliverables, FSM state, test files                      |
| `pnpm process:query -- dep-tree <pattern>`                    | Dependency chain with status                             |
| `pnpm process:query -- overview`                              | Progress, active phases, blocking chains                 |
| `pnpm process:query -- files <pattern> --related`             | File reading list with implementation paths              |

#### Pattern Discovery (JSON Output)

| Command                                       | What It Provides                                     |
| --------------------------------------------- | ---------------------------------------------------- |
| `pnpm process:query -- list --status roadmap` | All patterns with given status                       |
| `pnpm process:query -- search <query>`        | Fuzzy name search                                    |
| `pnpm process:query -- pattern <name>`        | Full detail for one pattern (~3KB)                   |
| `pnpm process:query -- stubs <pattern>`       | Design stubs with target paths and resolution status |
| `pnpm process:query -- decisions <pattern>`   | AD-N design decisions from stub descriptions         |
| `pnpm process:query -- status`                | Status counts and completion percentage              |

#### Architecture Queries (JSON Output)

| Command                                             | What It Provides                                         |
| --------------------------------------------------- | -------------------------------------------------------- |
| `pnpm process:query -- arch neighborhood <pattern>` | uses/usedBy/dependsOn/enables/sameContext                |
| `pnpm process:query -- arch compare <ctx1> <ctx2>`  | Cross-context shared deps and integration points         |
| `pnpm process:query -- arch coverage`               | Annotation completeness (files with/without @libar-docs) |
| `pnpm process:query -- tags`                        | Tag usage report (counts per tag and value)              |
| `pnpm process:query -- sources`                     | File inventory by type (TS, Gherkin, Stubs)              |
| `pnpm process:query -- unannotated`                 | TypeScript files missing @libar-docs annotations         |

#### Output Modifiers (Composable with Any List Query)

| Modifier                     | Effect                                    |
| ---------------------------- | ----------------------------------------- |
| `--names-only`               | Return pattern name strings only          |
| `--count`                    | Return integer count                      |
| `--fields name,status,phase` | Return only specified fields              |
| `--full`                     | Bypass summarization, return raw patterns |

#### List Filters

```bash
pnpm process:query -- list --status completed --names-only
pnpm process:query -- list --phase 25 --count
pnpm process:query -- list --category core --source gherkin
```

#### Clean JSON Piping

`pnpm` outputs a banner line to stdout. For clean JSON piping to `jq`, use `npx tsx` directly:

```bash
npx tsx src/cli/process-api.ts -i 'src/**/*.ts' --features 'delivery-process/specs/*.feature' list --status completed | jq '.[].patternName'
```
