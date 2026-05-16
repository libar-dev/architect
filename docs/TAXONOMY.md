# Tag Taxonomy

> **Deprecated manual overview:** use the auto-generated [Taxonomy Reference](../docs-live/TAXONOMY.md) for the live registry snapshot. This file keeps the concepts short and points at the generated source of truth.

The taxonomy defines the annotation vocabulary: which roles exist, which metadata tags are retained, and how values are parsed. The registry is TypeScript-defined in `src/taxonomy/`, then projected into the generated docs.

---

## Concept

A taxonomy in `@libar-dev/architect` covers three things:

| Component         | Purpose                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Roles**         | Implementation classification such as `projection`, `service`, or `contract`                              |
| **Metadata tags** | Pattern identity, lifecycle, relationships, architecture grouping, PRD data, ADR links, shapes, and stubs |
| **Format types**  | How values are parsed: `flag`, `value`, `enum`, `csv`, `number`, `quoted-value`                           |

The generated reference is the only place that should claim exact counts. When counts change, regenerate docs instead of editing numbers here.

---

## Current package-host role story

The package-host runtime now exposes a focused authored role surface. The generated taxonomy currently shows eight retained roles:

- `projection`
- `service`
- `decider`
- `read-model`
- `codec`
- `contract`
- `barrel`
- `utility`

Historical role names such as `core`, `api`, and `infra` are no longer part of the normal package guidance. If you need migration context, see [`../../architect-claude-plugin/MIGRATION.md`](../../architect-claude-plugin/MIGRATION.md).

---

## Format types

| Format         | Example                               | Parsing                          |
| -------------- | ------------------------------------- | -------------------------------- |
| `flag`         | `@architect`                          | Boolean presence with no value   |
| `value`        | `@architect-pattern MyPattern`        | Simple string                    |
| `enum`         | `@architect-status completed`         | Constrained to predefined values |
| `csv`          | `@architect-uses A, B, C`             | Comma-separated values           |
| `number`       | `@architect-adr:2`                    | Numeric value                    |
| `quoted-value` | `@architect-usecase "When X happens"` | Preserves spaces                 |

---

## Generating the live reference

```bash
# Recommended
pnpm pkg:docs

# Query the structured digest directly
pnpm pkg:query -- taxonomy --format json
```

Use the generated docs when you need exact tag groups, allowed enum values, required flags, or examples. Use the JSON query when a tool needs the structured shape.

---

## Related documentation

| Topic                | Document                                             |
| -------------------- | ---------------------------------------------------- |
| Live tag catalog     | [../docs-live/TAXONOMY.md](../docs-live/TAXONOMY.md) |
| Annotation authoring | [ANNOTATION-GUIDE.md](./ANNOTATION-GUIDE.md)         |
| Config surface       | [CONFIGURATION.md](./CONFIGURATION.md)               |
| Runtime architecture | [ARCHITECTURE.md](./ARCHITECTURE.md)                 |
