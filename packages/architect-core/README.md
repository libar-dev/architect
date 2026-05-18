# @libar-dev/architect-core

Core read-model, config, extraction, and validation utilities for the Architect
package family.

This package owns trusted graph construction and shared boundary primitives. Projection,
CLI, MCP, and Studio consumers should enter through the public graph/config APIs instead of
importing scanner internals or re-validating already trusted projection output.

## Boundary validation

Use the shared boundary helpers instead of re-defining local parse wrappers:

- `src/utils/argv-hygiene.ts` — null-byte checks and safe CLI/MCP string schemas.
- `src/utils/errors.ts` — `formatZodError` and `parseOrThrow` for trust-boundary parsing.
- `src/utils/session-helpers.ts` — shared session enums, handoff inference, and user-facing Zod formatting helpers.
- `src/utils/runtime-helpers.ts` — package metadata reads, invocation-dir resolution, and built-entrypoint helpers used by the published runtimes.
