=== DATAAPI OVERVIEW ===

Purpose: DataAPI product area overview
Detail Level: Compact summary

**How do I query process state?** The Data API provides direct terminal access to delivery process state. It replaces reading generated markdown or launching explore agents — targeted queries use 5-10x less context. The `context` command assembles curated bundles tailored to session type (planning, design, implement).

=== KEY INVARIANTS ===

- One-command context assembly: `context <pattern> --session <type>` returns metadata + file paths + dependency status + architecture position in ~1.5KB
- Session type tailoring: `planning` (~500B, brief + deps), `design` (~1.5KB, spec + stubs + deps), `implement` (deliverables + FSM + tests)
- Direct API queries replace doc reading: JSON output is 5-10x smaller than generated docs

=== API TYPES ===

| Type                    | Kind  |
| ----------------------- | ----- |
| MasterDatasetSchema     | const |
| StatusGroupsSchema      | const |
| StatusCountsSchema      | const |
| PhaseGroupSchema        | const |
| SourceViewsSchema       | const |
| RelationshipEntrySchema | const |
| ArchIndexSchema         | const |
