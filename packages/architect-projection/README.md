# @libar-dev/architect-projection

Fragment/Projection/Renderer pipeline for the Architect toolchain. Consumes a
`PatternGraph` (from `@libar-dev/architect-core`) through typed projection
functions. Prefer the validated public `parseAndProject*` entrypoints whenever a
projection exposes both validated and raw forms. Canonical `project*` exports
remain public for projections that do not have a separate validated wrapper.

Replaces the deleted `@libar-dev/architect-presentation` codec stack and the
`architect-query/api/*` assemblers with a single pipeline:

```
PatternGraph ─► parseAndProject*(context, rawOptions?) ─► Fragment | ProjectionBundle<T>
                                                          │
                                                          ▼
                                       renderCompactText | renderJson |
                                       renderMarkdown    | renderUi
```

## Usage

```ts
import {
  parseAndProjectSessionContext,
  renderCompactText,
  type ProjectionContext,
} from '@libar-dev/architect-projection';

const context: ProjectionContext = { graph }; // graph from buildPatternGraph()
const bundle = parseAndProjectSessionContext(context, {
  patterns: ['UnifiedRoleSystem'],
  sessionType: 'implement',
});
console.log(renderCompactText(bundle));
```

### With option validation (recommended for cross-package calls)

```ts
import { parseAndProjectSessionContext, renderCompactText } from '@libar-dev/architect-projection';

const bundle = parseAndProjectSessionContext(context, {
  patterns: ['UserService'],
  sessionType: 'design',
});
console.log(renderCompactText(bundle));
```

`parseAndProject*` variants run `OptionsSchema.parse(options)` at the
entrypoint; plain `project*` functions assume pre-validated options.

For surfaces without a validated/raw pair, use the canonical `project*` export,
for example `projectOverviewDigest`, `projectStatusDistribution`, or
`projectSourceInventoryDigest`.

## Entry points

- [`docs/MIGRATION.md`](./docs/MIGRATION.md) — codec-to-projection mapping table.
- [`docs/ddd-inventory.md`](./docs/ddd-inventory.md) — full catalog of fragments
  organized by subdomain (pattern-relations, delivery-reporting, governance,
  execution-context, operational-insights, documentation-composition).
- `src/index.ts` — public surface (`parseAndProject*` validated entrypoints,
  canonical `project*` projections without validated/raw splits, Fragment
  types, `render*` functions, `ProjectionContext`).

## Architecture invariants

- `project*` functions must only read `ProjectionContext.graph`, and
  `parseAndProject*` wrappers must limit themselves to option parsing plus a
  call into the matching projection helper. ADR-006 lint rules ban direct
  `session.dataset.patterns` /
  `context.graph.{patterns,archIndex,relationshipIndex}` access from CLI / MCP /
  desktop consumers — use projection-owned fragments instead.
- Renderers cannot import `PatternGraph` or `ProjectionContext`. They operate
  on `Fragment`s only.
- Runtime dependencies: `zod` + peer `@libar-dev/architect-core`. No filesystem,
  no network.

## Markdown/content trust boundary

- `parseAndProject*` validates raw options once at the projection boundary.
- Fragment block text (`heading`, `paragraph`, list item text, table cells, and
  `link-out.text`) should be treated as **plain text by default**.
- `renderMarkdown` escapes plain-text block content before emission.
- `collapsible.summary` is plain text too; it uses the same escaping contract as
  other human-readable block text.
- `code` and `mermaid` block bodies are intentional raw content surfaces.
- `link-out.path` accepts relative/root-relative paths plus `http:`, `https:`,
  and `mailto:` targets. Unsafe schemes and protocol-relative targets are
  rendered as plain text instead of links.
- Renderer-authored inline Markdown, when intentionally needed, stays behind
  renderer-private helpers rather than the shared block schema.
- Routed output paths used for emitted markdown records are stricter than
  `link-out.path`: the root path is canonicalized, child paths must already be
  canonical relative `.md` paths, and traversal / absolute / scheme-bearing /
  ambiguous internal child references are rejected or downgraded to plain text.

## Documentation Composition Contract

Documentation-composition projections use progressive disclosure to describe
how much context belongs at each logical route while preserving the existing
`ProjectionBundle<T>` contract: `{ root, children, routing? }`. The bundle shape
is the composition boundary; it must not be replaced by a universal document
fragment.

The disclosure vocabulary is exactly `essential | important | useful |
advanced`:

- Level 0, `essential`: index content that is always visible at
  `<docType>:index`.
- Level 1, `important`: same-bundle details reachable from the index at
  `<docType>:<stableEntityId>`.
- Level 2, `useful`: cross-bundle or nested details reachable at
  `<docType>:<stableEntityId>:<childKind>:<stableChildId>`.
- Level 3, `advanced`: reference material that remains reachable through the
  same logical route contract but is intentionally separated from primary
  reading paths.

Logical route IDs are stable internal identifiers. They use only these formats:
`<docType>:index`, `<docType>:<stableEntityId>`, and
`<docType>:<stableEntityId>:<childKind>:<stableChildId>`. They never include
Markdown extensions, folder layout, anchors, or renderer-specific syntax.

Domain fragments remain renderer-neutral. They must not contain Markdown paths,
filenames, split-page flags, or heading-depth hints; renderers may decide how to
serialize a route for their output surface, but fragments and projection policy
carry stable route identity only.

## Testing

```bash
pnpm --filter @libar-dev/architect-projection test
```

Tests are Gherkin feature files + vitest-cucumber step definitions under
`tests/features/**` and `tests/steps/**`.
