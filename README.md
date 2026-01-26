# @libar-dev/delivery-process

Documentation generator that extracts patterns from TypeScript and Gherkin sources using configurable annotations.

**Features:**
- Configurable tag prefix (`@docs-`, `@libar-docs-`, or custom)
- Two presets: **Generic** (simple) and **DDD-ES-CQRS** (full taxonomy)
- Four-stage pipeline: Scanner → Extractor → Transformer → Codec
- CLI tools and programmatic API

## Quick Start

### 1. Annotate Your Code

```typescript
/** @libar-docs */

/**
 * @libar-docs-pattern CommandOrchestrator
 * @libar-docs-status completed
 * @libar-docs-core
 *
 * ## CommandOrchestrator - 7-Step Command Pipeline
 *
 * Coordinates command execution through the full lifecycle.
 */
export class CommandOrchestrator { ... }
```

### 2. Generate Documentation

```bash
npx generate-docs -g patterns -i "src/**/*.ts" -o docs -f
```

### 3. Lint Annotations

```bash
npx lint-patterns -i "src/**/*.ts" --strict
```

---

## Configuration

The package supports configurable tag prefixes via presets or custom configuration:

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// Default: DDD-ES-CQRS preset with @libar-docs- prefix
const dp = createDeliveryProcess();

// Generic preset with @docs- prefix (simpler taxonomy)
const dp = createDeliveryProcess({ preset: "generic" });

// Custom prefix
const dp = createDeliveryProcess({
  tagPrefix: "@my-project-",
  fileOptInTag: "@my-project"
});
```

### Available Presets

| Preset | Tag Prefix | Categories | Use Case |
|--------|------------|------------|----------|
| `ddd-es-cqrs` (default) | `@libar-docs-` | 21 | DDD/Event Sourcing architectures |
| `generic` | `@docs-` | 3 | Simple projects |

> **See:** [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for complete configuration guide.

---

## CLI Commands

| Command                 | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `generate-docs`         | Generate documentation from annotated sources |
| `lint-patterns`         | Validate annotation quality                   |
| `lint-process`          | FSM validation for delivery process (PDR-005) |
| `validate-patterns`     | Cross-source validation with DoD checks       |
| `generate-tag-taxonomy` | Generate tag reference from TypeScript source |

## Available Generators

```bash
npx generate-docs --list-generators
```

## Tag Taxonomy

Tags are defined in TypeScript as the single source of truth:

```
src/taxonomy/
├── registry-builder.ts  # buildRegistry() - main entry
├── categories.ts        # 21 category definitions
├── status-values.ts     # FSM states
└── format-types.ts      # Tag value formats
```

Generate a complete reference:

```bash
npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f
```

## Documentation

### Getting Started
- **[docs/CONFIGURATION.md](./docs/CONFIGURATION.md)** - Configuration guide, presets, customization
- **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** - Complete tag reference and CLI details

### Methodology
- **[docs/METHODOLOGY.md](./docs/METHODOLOGY.md)** - Core thesis, FSM workflow, two-tier architecture
- **[docs/SESSION-GUIDES.md](./docs/SESSION-GUIDES.md)** - Planning, design, and implementation session workflows
- **[docs/GHERKIN-PATTERNS.md](./docs/GHERKIN-PATTERNS.md)** - Rich Gherkin patterns for BDD specs

### Architecture
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Pipeline architecture and codec system

### Validation & Quality
- **[docs/PROCESS-GUARD.md](./docs/PROCESS-GUARD.md)** - FSM validation, protection levels, change detection
- **[docs/VALIDATION.md](./docs/VALIDATION.md)** - Lint rules, anti-patterns, Definition of Done

### Reference
- **[docs/TAXONOMY.md](./docs/TAXONOMY.md)** - Tag taxonomy reference (status, categories, formats)
