# IndexReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Package Metadata

**Context:** Essential package information for orientation.

| Field | Value |
| --- | --- |
| Package | @libar-dev/delivery-process |
| Version | 0.1.0-pre.0 |
| Purpose | Turn TypeScript annotations and Gherkin specs into living docs, architecture graphs, and AI-queryable delivery state |
| Node.js | >=18.0.0 |
| License | MIT |

### Quick Start Paths

**Context:** Common tasks with recommended documentation paths.

| Task | Start Here | Then Read |
| --- | --- | --- |
| Set up pre-commit hooks | PROCESS-GUARD.md | CONFIGURATION.md |
| Add annotations to TypeScript | INSTRUCTIONS.md | GHERKIN-PATTERNS.md |
| Run AI-assisted implementation | SESSION-GUIDES.md | PROCESS-GUARD.md |
| Generate documentation | CONFIGURATION.md | ARCHITECTURE.md |
| Validate before PR | VALIDATION.md | PROCESS-GUARD.md |
| Understand the system | METHODOLOGY.md | ARCHITECTURE.md |

### Quick Navigation

**Context:** Direct links to documentation by task.

| If you want to... | Read this |
| --- | --- |
| Get started quickly | README.md |
| Configure presets and tags | CONFIGURATION.md |
| Understand the why | METHODOLOGY.md |
| Learn the architecture | ARCHITECTURE.md |
| Run AI coding sessions | SESSION-GUIDES.md |
| Write Gherkin specs | GHERKIN-PATTERNS.md |
| Enforce delivery process rules | PROCESS-GUARD.md |
| Validate annotation quality | VALIDATION.md |
| Look up tag definitions | INSTRUCTIONS.md |
| Understand the taxonomy | TAXONOMY.md |
| Publish to npm | PUBLISHING.md |

### Reading Order for New Users

**Context:** Recommended path for developers new to the package.

| Order | Document | Focus |
| --- | --- | --- |
| 1 | README.md | Installation, quick start, ProcessStateAPI overview |
| 2 | CONFIGURATION.md | Presets, tag prefixes, config files |
| 3 | METHODOLOGY.md | Core thesis, dual-source architecture |

### Reading Order for Developers

**Context:** Recommended path for developers implementing features.

| Order | Document | Focus |
| --- | --- | --- |
| 4 | ARCHITECTURE.md | Four-stage pipeline, codecs, MasterDataset |
| 5 | SESSION-GUIDES.md | Planning/Design/Implementation workflows |
| 6 | GHERKIN-PATTERNS.md | Writing effective Gherkin specs |
| 7 | INSTRUCTIONS.md | Complete tag and CLI reference |

### Reading Order for Team Leads

**Context:** Recommended path for team leads and CI/CD setup.

| Order | Document | Focus |
| --- | --- | --- |
| 8 | PROCESS-GUARD.md | FSM enforcement, pre-commit hooks |
| 9 | VALIDATION.md | Lint rules, DoD checks, anti-patterns |

### Document Contents Summary

**Context:** Quick reference to key sections within each document.

    **README.md Key Sections:**

| Section | Lines | Topics |
| --- | --- | --- |
| The Problem / The Solution | 16-33 | Documentation drift, code as source of truth |
| Built for AI-Assisted Dev | 36-57 | ProcessStateAPI typed queries |
| How It Works | 60-111 | Annotation examples, dual-source |
| Quick Start | 114-170 | Install, annotate, generate, lint |
| CLI Commands | 173-183 | Command summary table |
| FSM-Enforced Workflow | 187-217 | State diagram, protection levels |

    **ARCHITECTURE.md Key Sections:**

| Section | Lines | Topics |
| --- | --- | --- |
| Executive Summary | 28-66 | What it does, key principles, overview |
| Four-Stage Pipeline | 140-245 | Scanner, Extractor, Transformer, Codec |
| Unified Transformation | 248-362 | MasterDataset schema, single-pass |
| Codec Architecture | 366-407 | Concepts, block vocabulary, factory |
| Available Codecs | 410-607 | All 16 codecs with options tables |
| Data Flow Diagrams | 823-980 | Pipeline flow, MasterDataset views |

    **SESSION-GUIDES.md Key Sections:**

| Section | Lines | Topics |
| --- | --- | --- |
| Session Decision Tree | 7-24 | Which session type to use |
| Planning Session | 27-83 | Create roadmap spec, checklist |
| Design Session | 86-132 | When required, checklist, code stubs |
| Implementation Session | 135-192 | Pre-flight, execution, FSM transitions |
| Handoff Documentation | 277-313 | Template, discovery tags |

    **PROCESS-GUARD.md Key Sections:**

| Section | Lines | Topics |
| --- | --- | --- |
| Quick Reference | 9-37 | Protection levels, transitions, escapes |
| Error completed-protection | 40-65 | Fix with unlock reason |
| Error invalid-status-transition | 68-98 | Follow FSM path |
| CLI Usage | 187-235 | Modes, options, exit codes |
| Pre-commit Setup | 238-260 | Husky, package.json scripts |

### Dual-Source Architecture

**Context:** TypeScript and Gherkin files have distinct ownership domains.

    **Split Ownership Table:**

| Source | Owns | Example Tags |
| --- | --- | --- |
| Feature files | Planning: status, phase, quarter, effort | status, phase, depends-on |
| TypeScript | Implementation: uses, used-by, category | uses, used-by, core |

    **Rationale:** Gherkin owns timeline/planning metadata (when/priority).
    TypeScript owns runtime metadata (dependencies/categories).

### Delivery Workflow FSM

**Context:** Status transitions follow a finite state machine for process integrity.

    **FSM Diagram:**

    """mermaid
    stateDiagram-v2
        [*] --> roadmap
        roadmap --> active : Start work
        roadmap --> deferred : Postpone
        active --> completed : Finish
        active --> roadmap : Regress (blocked)
        deferred --> roadmap : Resume
        completed --> [*]

        note right of completed : Terminal state
        note right of active : Scope-locked
    """

    **Key Transitions:**

| From | To | When |
| --- | --- | --- |
| roadmap | active | Starting implementation work |
| active | completed | All deliverables done |
| active | roadmap | Blocked or regressed |
| deferred | roadmap | Ready to resume |

### ProcessStateAPI

**Context:** Typed queries for AI agents and tooling integration.

    **Usage Example:**

    """typescript
    import { createProcessStateAPI } from '@libar-dev/delivery-process';

    const api = createProcessStateAPI(dataset);

    // Query current work
    api.getCurrentWork();          // What is active now

    // Query planning
    api.getRoadmapItems();         // What can be started

    // Validate transitions
    api.isValidTransition('roadmap', 'active');

    // Pattern lookup
    api.getPattern('TransformDataset');
    """

    **Key Methods:**

| Method | Returns |
| --- | --- |
| getCurrentWork() | Patterns with active status |
| getRoadmapItems() | Patterns with roadmap status |
| isValidTransition(from, to) | Boolean for FSM validation |
| getPattern(id) | Single pattern by ID |
| getPatternsByCategory(cat) | Patterns in a category |

### Document Roles

**Context:** Each document serves a specific audience and focus area.

| Document | Audience | Focus |
| --- | --- | --- |
| README.md | Everyone | Quick start, value proposition |
| METHODOLOGY.md | Everyone | Why - core thesis, principles |
| CONFIGURATION.md | Users | Setup - presets, tags, config |
| ARCHITECTURE.md | Developers | How - pipeline, codecs, schemas |
| SESSION-GUIDES.md | AI/Devs | Workflow - day-to-day usage |
| GHERKIN-PATTERNS.md | Writers | Specs - writing effective Gherkin |
| PROCESS-GUARD.md | Team Leads | Governance - enforcement rules |
| VALIDATION.md | CI/CD | Quality - automated checks |
| INSTRUCTIONS.md | Reference | Lookup - tag and CLI reference |
| TAXONOMY.md | Reference | Lookup - tag format definitions |
| PUBLISHING.md | Maintainers | Release - npm publishing |
