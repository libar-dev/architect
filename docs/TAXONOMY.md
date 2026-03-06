# Tag Taxonomy

> **This document is a pointer.** The authoritative taxonomy reference is auto-generated from `src/taxonomy/` source files.

## Generated Reference

| Document                                                                      | Content                                         | Command              |
| ----------------------------------------------------------------------------- | ----------------------------------------------- | -------------------- |
| [docs-live/TAXONOMY.md](../docs-live/TAXONOMY.md)                             | Taxonomy overview with tag counts               | `pnpm docs:taxonomy` |
| [docs-live/taxonomy/metadata-tags.md](../docs-live/taxonomy/metadata-tags.md) | All 56+ metadata tags with formats and examples | `pnpm docs:taxonomy` |
| [docs-live/taxonomy/categories.md](../docs-live/taxonomy/categories.md)       | Category definitions per preset                 | `pnpm docs:taxonomy` |
| [docs-live/taxonomy/format-types.md](../docs-live/taxonomy/format-types.md)   | Tag value format types (flag, csv, enum, etc.)  | `pnpm docs:taxonomy` |

## Concepts (Quick Reference)

A **taxonomy** defines the vocabulary for pattern annotations: categories, status values, format types, and hierarchy levels. It is 100% TypeScript-defined in `src/taxonomy/`, providing type safety and IDE autocomplete.

| Component        | Purpose                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Categories**   | Domain classifications (e.g., `core`, `api`)                                        |
| **Status**       | FSM states (`roadmap`, `active`, `completed`, `deferred`)                           |
| **Format Types** | How tag values are parsed (`flag`, `csv`, `enum`)                                   |
| **Presets**      | Taxonomy subsets: `libar-generic` (3 categories), `ddd-es-cqrs` (21), `generic` (3) |

## Related Documentation

| Topic                    | Document                                     |
| ------------------------ | -------------------------------------------- |
| **Presets & config**     | [CONFIGURATION.md](./CONFIGURATION.md)       |
| **Annotation mechanics** | [ANNOTATION-GUIDE.md](./ANNOTATION-GUIDE.md) |
