# Progressive disclosure contract

`@libar-dev/architect-projection` uses a bundle contract for any projection that can fan out into multiple output files or UI child views.

## Bundle and routing surface

```ts
type ProjectionBundle<T extends Fragment> = {
  root: T;
  children: Record<string, Fragment>;
  routing?: BundleRouting;
};

type BundleRouting = {
  rootRouteId: string;
  childRouteIds: Record<string, string>;
  childPathStrategy: 'flat' | 'nested';
  anchorStrategy: 'heading-slug' | 'kind-id';
};
```

- `root` is the primary fragment for the projection.
- `children` is a flat map of leaf fragments keyed by deterministic child names.
- `routing` is optional logical route metadata; renderers map route IDs to file paths or anchors.
- Children never point back to a parent bundle and renderers do not cache outputs or call one another.

## Renderer contracts

- `renderMarkdown(input, options)` returns a single `string` for a standalone fragment or childless bundle, and returns `Record<string, string>` when a bundle has routed children.
- `renderCompactText(input, options)` returns a single compact `string`.
- `renderJson(input, options)` returns structured JSON by default and may return a `string` in pretty mode. `stableKeyOrder` defaults to `true`.
- `renderUi(input, options)` returns structured UI data and keeps bundle structure intact.

## Decision 1: Delivery-reporting view splitting stays at the projection layer

`projectCompletedMilestones` and `projectCurrentWork` stay explicit public projection entrypoints because their retained delivery-reporting views must remain deterministic. The roadmap view stays inside `parseAndProjectDocumentationBundle({ documentType: 'roadmap' })`, where the package can keep the internal timeline helper without re-exposing it as a public projector.

We do not create a single projection function that switches behavior from a runtime `view` option. That keeps routing, naming, and downstream renderer expectations deterministic.

## Decision 2: `splitOversizedDocument` is markdown-only

Oversized-document splitting stays a Markdown concern. `RenderMarkdownOptions` owns `sizeBudget` and `splitStrategy`, and the old `splitOversizedDocument` behavior is only relevant to Markdown file generation.

- Compact text does not split.
- JSON does not split.
- UI does not split.

Those renderers stay single-pass over the already projected fragment or bundle.

## Decision 3: legacy `additionalFiles` flattening becomes bundle children + routing

Legacy `additionalFiles` maps flatten into `ProjectionBundle.children` plus `routing` metadata.

- Markdown flattens the bundle by rendering `root`, iterating `children`, mapping `routing.rootRouteId` and `routing.childRouteIds` through its route profile, and emitting `Record<path, string>`.
- JSON keeps the structured `{ root, children, routing? }` object.
- UI keeps the structured `{ root, children, routing? }` object.

This preserves progressive disclosure without leaking file-path concerns into fragment schemas.
