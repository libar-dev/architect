# Design Review: SetupCommand

**Purpose:** Auto-generated design review with sequence and component diagrams
**Detail Level:** Design review artifact from sequence annotations

---

**Pattern:** SetupCommand | **Phase:** Phase 45 | **Status:** roadmap | **Orchestrator:** init-cli | **Steps:** 6 | **Participants:** 8

**Source:** `delivery-process/specs/setup-command.feature`

---

## Annotation Convention

This design review is generated from the following annotations:

| Tag                   | Level    | Format | Purpose                            |
| --------------------- | -------- | ------ | ---------------------------------- |
| sequence-orchestrator | Feature  | value  | Identifies the coordinator module  |
| sequence-step         | Rule     | number | Explicit execution ordering        |
| sequence-module       | Rule     | csv    | Maps Rule to deliverable module(s) |
| sequence-error        | Scenario | flag   | Marks scenario as error/alt path   |

Description markers: `**Input:**` and `**Output:**` in Rule descriptions define data flow types for sequence diagram call arrows and component diagram edges.

---

## Sequence Diagram — Runtime Interaction Flow

Generated from: `@libar-docs-sequence-step`, `@libar-docs-sequence-module`, `@libar-docs-sequence-error`, `**Input:**`/`**Output:**` markers, and `@libar-docs-sequence-orchestrator` on the Feature.

```mermaid
sequenceDiagram
    participant User
    participant init_cli as "init-cli.ts"
    participant detect_context as "detect-context.ts"
    participant prompts as "prompts.ts"
    participant generate_config as "generate-config.ts"
    participant augment_package_json as "augment-package-json.ts"
    participant scaffold_dirs as "scaffold-dirs.ts"
    participant generate_example as "generate-example.ts"
    participant validate_setup as "validate-setup.ts"

    User->>init_cli: invoke

    Note over init_cli: Rule 1 — Init detects existing project context before making changes

    init_cli->>+detect_context: targetDir: string
    detect_context-->>-init_cli: ProjectContext

    alt Fails gracefully when no package.json exists
        init_cli-->>User: error
        init_cli->>init_cli: exit(1)
    end

    Note over init_cli: Rule 2 — Interactive prompts configure preset and source paths with smart defaults

    init_cli->>+prompts: ProjectContext
    prompts-->>-init_cli: InitConfig

    alt Non-interactive mode refuses to overwrite existing config
        init_cli-->>User: error
        init_cli->>init_cli: exit(1)
    end

    Note over init_cli: Rule 3 — Generated config file uses defineConfig with correct imports

    init_cli->>+generate_config: InitConfig
    generate_config-->>-init_cli: delivery-process.config.ts written to targetDir

    alt Existing config file is not overwritten without confirmation
        init_cli-->>User: error
        init_cli->>init_cli: exit(1)
    end

    Note over init_cli: Rule 4 — Npm scripts are injected using bin command names

    init_cli->>+augment_package_json: InitConfig
    augment_package_json-->>-init_cli: package.json updated with process and docs scripts

    Note over init_cli: Rule 5 — Directory structure and example annotation enable immediate first run

    init_cli->>+scaffold_dirs: InitConfig
    scaffold_dirs-->>-init_cli: directories created for source globs, example annotated .ts file
    init_cli->>+generate_example: InitConfig
    generate_example-->>-init_cli: directories created for source globs, example annotated .ts file

    Note over init_cli: Rule 6 — Init validates the complete setup by running the pipeline

    init_cli->>+validate_setup: targetDir: string
    validate_setup-->>-init_cli: SetupResult

    alt Failed validation prints diagnostic information
        init_cli-->>User: error
        init_cli->>init_cli: exit(1)
    end

```

---

## Component Diagram — Types and Data Flow

Generated from: `@libar-docs-sequence-module` (nodes), `**Input:**`/`**Output:**` (edges and type shapes), deliverables table (locations), and `sequence-step` (grouping).

```mermaid
graph LR
    subgraph phase_1["Phase 1: targetDir: string"]
        phase_1_detect_context["detect-context.ts"]
    end

    subgraph phase_2["Phase 2: ProjectContext"]
        phase_2_prompts["prompts.ts"]
    end

    subgraph phase_3["Phase 3: InitConfig"]
        phase_3_generate_config["generate-config.ts"]
        phase_3_augment_package_json["augment-package-json.ts"]
        phase_3_scaffold_dirs["scaffold-dirs.ts"]
        phase_3_generate_example["generate-example.ts"]
    end

    subgraph phase_4["Phase 4: targetDir: string"]
        phase_4_validate_setup["validate-setup.ts"]
    end

    subgraph orchestrator["Orchestrator"]
        init_cli["init-cli.ts"]
    end

    subgraph types["Key Types"]
        ProjectContext{{"ProjectContext\n-----------\npackageJsonPath\npackageJson\ntsconfigExists\ntsconfigModuleResolution\nexistingConfigPath\nisMonorepo\nhasEsmType"}}
        InitConfig{{"InitConfig\n-----------\ntargetDir\npreset\nsources\nforce\ncontext"}}
        SetupResult{{"SetupResult\n-----------\nsuccess\npatternCount\ndiagnostics"}}
    end

    phase_1_detect_context -->|"ProjectContext"| init_cli
    phase_2_prompts -->|"InitConfig"| init_cli
    phase_4_validate_setup -->|"SetupResult"| init_cli
    init_cli -->|"targetDir: string"| phase_1_detect_context
    init_cli -->|"ProjectContext"| phase_2_prompts
    init_cli -->|"InitConfig"| phase_3_generate_config
    init_cli -->|"InitConfig"| phase_3_augment_package_json
    init_cli -->|"InitConfig"| phase_3_scaffold_dirs
    init_cli -->|"InitConfig"| phase_3_generate_example
    init_cli -->|"targetDir: string"| phase_4_validate_setup
```

---

## Key Type Definitions

| Type             | Fields                                                                                                             | Produced By    | Consumed By                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------- |
| `ProjectContext` | packageJsonPath, packageJson, tsconfigExists, tsconfigModuleResolution, existingConfigPath, isMonorepo, hasEsmType | detect-context | prompts                                                                |
| `InitConfig`     | targetDir, preset, sources, force, context                                                                         | prompts        | generate-config, augment-package-json, scaffold-dirs, generate-example |
| `SetupResult`    | success, patternCount, diagnostics                                                                                 | validate-setup |                                                                        |

---

## Design Questions

Verify these design properties against the diagrams above:

| #    | Question                             | Auto-Check                      | Diagram   |
| ---- | ------------------------------------ | ------------------------------- | --------- |
| DQ-1 | Is the execution ordering correct?   | 6 steps in monotonic order      | Sequence  |
| DQ-2 | Are all interfaces well-defined?     | 3 distinct types across 6 steps | Component |
| DQ-3 | Is error handling complete?          | 4 error paths identified        | Sequence  |
| DQ-4 | Is data flow unidirectional?         | Review component diagram edges  | Component |
| DQ-5 | Does validation prove the full path? | Review final step               | Both      |

---

## Findings

Record design observations from reviewing the diagrams above. Each finding should reference which diagram revealed it and its impact on the spec.

| #   | Finding                                     | Diagram Source | Impact on Spec |
| --- | ------------------------------------------- | -------------- | -------------- |
| F-1 | (Review the diagrams and add findings here) | —              | —              |

---

## Summary

The SetupCommand design review covers 6 sequential steps across 8 participants with 3 key data types and 4 error paths.
