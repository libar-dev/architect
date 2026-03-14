@architect
@architect-pattern:SetupCommand
@architect-status:roadmap
@architect-phase:45
@architect-product-area:Configuration
@architect-effort:3d
@architect-priority:high
@architect-depends-on:ConfigLoader
@architect-business-value:reduce-first-project-setup-from-55-minutes-to-under-2-minutes
@architect-sequence-orchestrator:init-cli
Feature: Interactive Setup Command

  **Problem:**
  Setting up a new project to use Architect requires 7 manual steps spanning
  ~55 minutes: install the package plus dev dependencies, create tsconfig.json with
  correct module settings, create architect.config.ts with defineConfig() and
  correct source globs, add 15+ npm scripts to package.json, create directory
  structure, and annotate the first file with the correct opt-in marker and tags.

  Each step has failure modes: wrong module type (CommonJS instead of ESM),
  incorrect moduleResolution (node instead of NodeNext), wrong glob patterns,
  missing flags, typos in long dist paths. A single mistake produces silent failures
  or cryptic errors that a new user cannot diagnose without reading the full tutorial.

  **Solution:**
  Add an interactive setup CLI invoked via npx:

  npx @libar-dev/architect init

  The command detects existing project context (package.json, TypeScript config,
  monorepo markers), asks the user to select a preset, and generates all required
  files and configuration in a single run. Non-interactive mode (--yes flag) uses
  all defaults for CI and scripted adoption.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Project context detector | pending | src/cli/init/detect-context.ts |
      | Interactive prompt engine | pending | src/cli/init/prompts.ts |
      | Config file generator | pending | src/cli/init/generate-config.ts |
      | Package.json augmenter | pending | src/cli/init/augment-package-json.ts |
      | Directory scaffolder | pending | src/cli/init/scaffold-dirs.ts |
      | Example annotation generator | pending | src/cli/init/generate-example.ts |
      | Setup validator | pending | src/cli/init/validate-setup.ts |
      | Init CLI entry point | pending | src/cli/init.ts |
      | Bin entry registration | pending | package.json |

  @architect-sequence-step:1
  @architect-sequence-module:detect-context
  Rule: Init detects existing project context before making changes

    **Invariant:** The init command reads the target directory for package.json,
    tsconfig.json, architect.config.ts (or .js), and monorepo markers before prompting
    or generating any files. Detection results determine which steps are skipped.

    **Rationale:** Blindly generating files overwrites user configuration and breaks
    working setups. Context detection enables safe adoption into existing projects by
    skipping steps that are already complete.

    **Input:** targetDir: string

    **Output:** ProjectContext -- packageJsonPath, packageJson, tsconfigExists,
    tsconfigModuleResolution, existingConfigPath, isMonorepo, hasEsmType

    **Verified by:** Detects existing package.json and skips creation,
    Fails gracefully when run outside a project directory

    @acceptance-criteria @happy-path
    Scenario: Detects existing package.json and adapts behavior
      Given a directory with an existing package.json containing "type": "module"
      And a tsconfig.json with moduleResolution "NodeNext"
      When running the init command
      Then the command does not prompt for package.json creation
      And the command does not modify tsconfig.json
      And the command proceeds to preset selection

    @acceptance-criteria @validation @architect-sequence-error
    Scenario: Fails gracefully when no package.json exists
      Given an empty directory with no package.json
      When running the init command
      Then the command prints "No package.json found. Run npm init first."
      And exits with code 1

  @architect-sequence-step:2
  @architect-sequence-module:prompts
  Rule: Interactive prompts configure preset and source paths with smart defaults

    **Invariant:** The init command prompts for preset selection from the three
    available presets (generic, libar-generic, ddd-es-cqrs) with descriptions, and
    for source glob paths with defaults inferred from project structure. The --yes
    flag skips non-destructive selection prompts and uses defaults. Destructive
    overwrites require an explicit --force flag; otherwise init exits without
    modifying existing files.

    **Rationale:** New users do not know which preset to choose or what glob patterns
    to use. Smart defaults reduce decisions to confirmations. The --yes flag enables
    scripted adoption in CI.

    **Input:** ProjectContext

    **Output:** InitConfig -- targetDir, preset, sources, force, context

    **Verified by:** Preset selection shows all three presets,
    Non-interactive mode uses defaults without prompting

    @acceptance-criteria @happy-path
    Scenario: Preset selection prompt shows all three presets
      Given a project directory with package.json
      When running the init command
      Then the prompt displays three preset choices:
        | Preset | Description |
        | generic | Minimal categories with docs- prefix |
        | libar-generic | Minimal categories with libar-docs- prefix |
        | ddd-es-cqrs | Full 21-category DDD taxonomy |
      And the default selection is "libar-generic"

    @acceptance-criteria @validation
    Scenario: Non-interactive mode uses defaults without prompting
      Given a project directory with package.json
      When running the init command with --yes flag
      Then no interactive prompts are displayed
      And preset defaults to "libar-generic"
      And source globs use sensible defaults

    @acceptance-criteria @validation @architect-sequence-error
    Scenario: Non-interactive mode refuses to overwrite existing config
      Given a directory with an existing Architect config file
      When running the init command with --yes flag
      Then the command prints a message requiring --force to overwrite
      And exits with code 1

  @architect-sequence-step:3
  @architect-sequence-module:generate-config
  Rule: Generated config file uses defineConfig with correct imports

    **Invariant:** The generated architect.config.ts (or .js) imports
    defineConfig from the correct path, uses the selected preset, and includes
    configured source globs. An existing config file is never overwritten without
    confirmation.

    **Rationale:** The config file is the most important artifact. An incorrect
    import path or malformed glob causes every subsequent command to fail. The
    overwrite guard prevents destroying custom configuration.

    **Input:** InitConfig

    **Output:** architect.config.ts written to targetDir

    **Verified by:** Generated config is valid TypeScript,
    Existing config is not overwritten without confirmation

    @acceptance-criteria @happy-path
    Scenario: Generated config file is valid TypeScript
      Given the user selected preset "libar-generic"
      And TypeScript source glob is "src/**/*.ts"
      When the config file is generated
      Then architect.config.ts imports from "@libar-dev/architect/config"
      And contains defineConfig with the selected preset
      And contains the configured source globs

    @acceptance-criteria @validation @architect-sequence-error
    Scenario: Existing config file is not overwritten without confirmation
      Given a directory with an existing Architect config file
      When running the init command
      Then the command prompts for overwrite confirmation
      And answering "no" preserves the existing file

  @architect-sequence-step:4
  @architect-sequence-module:augment-package-json
  Rule: Npm scripts are injected using bin command names

    **Invariant:** Injected scripts reference bin names (process-api, generate-docs)
    resolved via node_modules/.bin, not dist paths. Existing scripts are preserved.
    The package.json "type" field is preserved. ESM migration is an explicit
    opt-in via --esm flag.

    **Rationale:** The tutorial uses long fragile dist paths. Bin commands are the
    stable public API. Setting type:module ensures ESM imports work for the config.

    **Input:** InitConfig

    **Output:** package.json updated with process and docs scripts

    **Verified by:** Injected scripts use bin names,
    Existing scripts are preserved

    @acceptance-criteria @happy-path
    Scenario: Injected scripts use bin command names
      Given a package.json with no Architect scripts
      When the init command injects scripts
      Then package.json contains process:query using "process-api"
      And contains docs:all using "generate-docs"
      And preserves the existing "type" field

    @acceptance-criteria @validation
    Scenario: Existing scripts in package.json are preserved
      Given a package.json with existing "build" and "test" scripts
      When the init command injects scripts
      Then existing scripts are unchanged
      And new process and docs scripts are added alongside them

  @architect-sequence-step:5
  @architect-sequence-module:scaffold-dirs,generate-example
  Rule: Directory structure and example annotation enable immediate first run

    **Invariant:** The init command creates directories for configured source globs
    and generates one example annotated TypeScript file with the minimum annotation
    set (opt-in marker, pattern tag, status, category, description).

    **Rationale:** Empty source globs produce a confusing "0 patterns" result. An
    example file proves the pipeline works and teaches annotation syntax by example.

    **Input:** InitConfig

    **Output:** directories created for source globs, example annotated .ts file

    **Verified by:** Directories created for configured globs,
    Example file is detected by the scanner

    @acceptance-criteria @happy-path
    Scenario: Example annotation file is detected by the pipeline
      Given the init command generated an example annotated file
      When running process-api overview
      Then the output shows 1 pattern detected

  @architect-sequence-step:6
  @architect-sequence-module:validate-setup
  Rule: Init validates the complete setup by running the pipeline

    **Invariant:** After all files are generated, init runs process-api overview and
    reports whether the pipeline detected the example pattern. Success prints a
    summary and next steps. Failure prints diagnostic information.

    **Rationale:** Generating files without verification produces false confidence.
    Running the pipeline as the final step proves config, globs, directories, and
    the example annotation all work together.

    **Input:** targetDir: string

    **Output:** SetupResult -- success, patternCount, diagnostics

    **Verified by:** Successful setup prints summary,
    Failed validation prints diagnostics

    @acceptance-criteria @happy-path
    Scenario: Successful setup prints summary and next steps
      Given all init steps completed without errors
      When the validation step detects 1 pattern
      Then the command prints a setup summary with config file and preset
      And prints next steps for annotating files and generating docs
      And exits with code 0

    @acceptance-criteria @validation @architect-sequence-error
    Scenario: Failed validation prints diagnostic information
      Given init completed but the example file has an invalid glob match
      When the validation step detects 0 patterns
      Then the command prints a diagnostic message about source glob configuration
      And exits with code 1
