### Annotation System

Files must opt-in with a marker to be scanned:

```typescript
/** @libar-docs */

/**
 * @libar-docs-pattern PatternName
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-uses OtherPattern
 *
 * ## Description in markdown
 */
export class MyClass { ... }
```

#### Key Tags

| Tag          | Format | Description                                             |
| ------------ | ------ | ------------------------------------------------------- |
| `pattern`    | value  | Pattern identifier (required for named patterns)        |
| `status`     | enum   | FSM state: `roadmap`, `active`, `completed`, `deferred` |
| `phase`      | number | Roadmap phase number                                    |
| `release`    | value  | Version tag: `v0.1.0` or `vNEXT`                        |
| `uses`       | csv    | Runtime dependencies (TypeScript only)                  |
| `used-by`    | csv    | Reverse dependencies                                    |
| `depends-on` | csv    | Planning dependencies (Gherkin only)                    |
| `quarter`    | value  | Timeline: `Q1-2025` (Gherkin only)                      |

**Category tags** are flags (no value): `@libar-docs-core`, `@libar-docs-api`, `@libar-docs-infra`, `@libar-docs-domain`, etc.

#### CLI Commands

| Command                 | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `generate-docs`         | Generate documentation from annotated sources              |
| `lint-patterns`         | Validate annotation quality (missing tags, invalid status) |
| `lint-process`          | FSM validation for delivery process                        |
| `validate-patterns`     | Cross-source validation with DoD checks                    |
| `generate-tag-taxonomy` | Generate tag reference from TypeScript                     |
