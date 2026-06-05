# Appendix A — Examples

> **Architect Spec v0.2.0** — Complete annotated examples for all artifact types.

---

## Example 1: Candidate Spec (Refinement Track)

A candidate spec — an idea being explored, not yet accepted into the delivery pipeline.

```gherkin
@architect
@architect-pattern:DarkModeTheme
@architect-status:candidate
@architect-product-area:Desktop
@architect-parent:DesktopExperience
Feature: DarkModeTheme - System-aware dark/light theme toggle

  **Idea:** Users expect dark mode in desktop apps. Tailwind CSS 4 supports
  dark: variants natively. System preference detection is standard.

  **Open Questions:**
  - Should we support a third "system" option beyond dark/light?
  - Where does the preference persist? Electron store? localStorage?
  - Should theme affect code syntax highlighting in spec viewers?

  Rule: Theme follows system preference by default

    **Invariant:** The app uses the OS dark/light preference unless overridden.

    Scenario: System preference is respected on first launch
      Given the OS is set to dark mode
      When the app launches for the first time
      Then the app renders in dark mode

    Scenario: User override persists across sessions
      Given the user has set the theme to "light"
      When the app launches
      Then the app renders in light mode regardless of OS preference
```

**What this demonstrates:**

- `@architect-status:candidate` — not yet accepted
- No explicit `@architect-maturity` — candidate maturity derives to `idea` from `status:candidate`
- Candidate baseline only — no plan-level tags (role, bounded-context, relationships) until acceptance
- `**Open Questions:**` section — unresolved issues that must be answered before acceptance
- Scenarios without `@acceptance-criteria` tags (optional for candidates)
- No deliverables table (optional for candidates)
- When promoted to plan-level: status → `roadmap`, full tags added, questions resolved

---

## Example 2: Minimal Plan-Level Spec (Level 1)

The simplest valid accepted spec — just enough tags for pattern graph inclusion.

```gherkin
@architect
@architect-pattern:UserRegistration
@architect-status:roadmap
Feature: UserRegistration - New user account creation

  User self-service registration with email validation and duplicate prevention.

  Rule: Duplicate emails are rejected

    @acceptance-criteria @happy-path
    Scenario: Successful registration with new email
      Given a new user with email "new@example.com"
      When they submit the registration form
      Then an account is created
      And a verification email is sent

    @acceptance-criteria @edge-case
    Scenario: Registration with existing email is rejected
      Given a user with email "existing@example.com" already exists
      When another user tries to register with "existing@example.com"
      Then the registration is rejected with a duplicate email error
```

**What this demonstrates:**

- Gate tag (`@architect`) on line 1
- Pattern name and status are the only required metadata
- Standard Gherkin structure parseable by any Gherkin toolchain
- Scenario tags follow the `@acceptance-criteria` + subtype convention

---

## Example 3: Full Plan-Level Spec (Level 2)

A complete plan-level spec with all required tags, deliverables, and structured rules.

```gherkin
@architect
@architect-pattern:ProjectConnection
@architect-status:roadmap
@architect-product-area:Desktop
@architect-uses:McpIntegration,AppShell
@architect-see-also:UserOnboarding
@architect-bounded-context:desktop
@architect-arch-layer:application
@architect-role:service
@architect-level:task
@architect-parent:DesktopShellEpic
Feature: ProjectConnection - Connect the desktop app to a project directory

  **Business Value:** Without a connected project, every other Studio feature is inert.
  ProjectConnection is the unlock that transforms Studio from a static shell into a live
  architecture workbench. Drag-and-drop or recent-project selection must feel instant —
  the first 10 seconds determine whether a $49/seat trial converts.

  **How It Works:** The user selects a project directory via file dialog, drag-and-drop,
  or the recents list. The app looks for `architect.config.ts` at the project root. If
  found, it reads the config, initializes the PatternGraphAPI, and transitions to the
  connected state. If not found, it offers guided setup. Recent projects persist across
  sessions via Electron's app data storage.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable                | Status  | Location                                           | Tests | Test Type |
      | ProjectConnectionView      | pending | apps/desktop/src/views/ProjectConnectionView.tsx   | Yes   | unit      |
      | useProjectConnection       | pending | apps/desktop/src/lib/use-project-connection.ts     | Yes   | unit      |
      | config-detector            | pending | apps/desktop/src/lib/config-detector.ts            | Yes   | unit      |
      | recent-projects            | pending | apps/desktop/src/lib/recent-projects.ts            | Yes   | unit      |
      | project-connection types   | pending | apps/desktop/src/lib/types.ts                      | No    | n/a       |

  # ===========================================================================
  # RULE 1: Project Detection
  # ===========================================================================

  Rule: The app detects architect.config.ts in the selected directory

    **Invariant:** A directory is a valid project if and only if it contains
    a readable architect.config.ts at its root.
    **Rationale:** The config file is the entry point for the entire delivery
    process. Without it, there is no tag taxonomy, no source globs, and no
    pattern graph to build.
    **Verified by:** Valid project detection, missing config handling.

    @acceptance-criteria @happy-path
    Scenario: Valid project detection
      Given the user selects a directory containing architect.config.ts
      When the config detector scans the directory
      Then the app transitions to the connected state
      And the project name is displayed in the header

    @acceptance-criteria @edge-case
    Scenario: Missing config handling
      Given the user selects a directory without architect.config.ts
      When the config detector scans the directory
      Then the app shows a "No architect config found" message
      And offers a guided setup option

  # ===========================================================================
  # RULE 2: Recent Projects
  # ===========================================================================

  Rule: Recently connected projects are persisted and displayed

    **Invariant:** The app remembers the last 10 connected projects across sessions.
    **Rationale:** Developers typically work on 1-3 projects. Requiring directory
    selection every launch would be unacceptable friction.
    **Verified by:** Recents list persistence, recents list ordering.

    @acceptance-criteria @happy-path
    Scenario: Recents list persistence
      Given the user has previously connected to 3 projects
      When the app launches
      Then the recents list shows all 3 projects with names and paths
      And the most recently connected project appears first

    @acceptance-criteria @validation
    Scenario: Recents list ordering
      Given the user connects to project "Alpha" then "Beta" then "Gamma"
      When the recents list is displayed
      Then "Gamma" appears first, then "Beta", then "Alpha"

  # ===========================================================================
  # RULE 3: Connection Methods
  # ===========================================================================

  Rule: Users can connect via file dialog, drag-and-drop, or recents

    **Invariant:** All three connection methods produce the same connected state.
    **Rationale:** Different workflows suit different moments. File dialog for first
    use, recents for daily use, drag-and-drop for power users.
    **Verified by:** File dialog connection, drag-and-drop connection, recents reconnection.

    @acceptance-criteria @happy-path
    Scenario: File dialog connection
      Given the user clicks the "Open Project" button
      When they select a valid project directory in the file dialog
      Then the app connects to that project

    @acceptance-criteria @happy-path
    Scenario: Drag-and-drop connection
      Given the app is in the disconnected state
      When the user drags a valid project directory onto the app window
      Then the app connects to that project

    @acceptance-criteria @happy-path
    Scenario: Recents reconnection
      Given the recents list shows previously connected projects
      When the user clicks a project in the recents list
      Then the app connects to that project

  # ===========================================================================
  # RULE 4: Error Recovery
  # ===========================================================================

  Rule: Connection errors are recoverable without restarting

    **Invariant:** A failed connection attempt does not leave the app in a broken state.
    **Rationale:** Config files can be malformed, directories can be deleted, permissions
    can change. The app must handle all failures gracefully.
    **Verified by:** Malformed config recovery, removed directory handling.

    @acceptance-criteria @edge-case
    Scenario: Malformed config recovery
      Given the user selects a directory with an invalid architect.config.ts
      When the config detector encounters a parse error
      Then the app shows a descriptive error message
      And the user can select a different directory

    @acceptance-criteria @edge-case
    Scenario: Removed directory handling
      Given a project in the recents list has been deleted from disk
      When the user clicks that project in the recents list
      Then the app shows "Directory not found" message
      And removes the entry from the recents list
```

**What this demonstrates:**

- Complete tag header with the v0.2.0 canonical Level 2 tag set (gate, pattern, status,
  product-area, uses, see-also, bounded-context, arch-layer, role, level, parent)
- Business Value + How It Works description pattern
- 5-column deliverables table with concrete file paths
- 4 rules with Invariant/Rationale/Verified by structure
- Mix of @happy-path, @validation, and @edge-case scenarios
- Section separators for visual structure
- 10 total scenarios across 4 rules

> _Informative:_ Earlier drafts of this example included `@architect-phase`,
> `@architect-effort`, `@architect-priority`, `@architect-business-value`, and
> `@architect-release`. These are not part of the v0.2.0 canonical taxonomy.

---

## Example 4: Design-Level Spec Excerpt (Ephemeral)

A design-level rule with Input/Output declarations and detailed scenarios.
**Note:** Design-level specs are ephemeral — this file is deleted during implementation,
replaced by an executable spec in `tests/features/`.

```gherkin
  Rule: Step 1, MCP bridge starts when a project is connected

    **Invariant:** Exactly one PatternGraphAPI instance exists per connected project.
    **Rationale:** Multiple instances would cause cache inconsistency and doubled memory.
    The API must be a singleton scoped to the project connection lifecycle.
    **Input:** ProjectConfig -- configPath: string, sources: SourceConfig, roles: RoleDefinition[]
    **Output:** McpState -- status: 'connected', api: PatternGraphAPI, watcher: FileWatcher
    **Verified by:** Successful initialization, duplicate prevention, config error handling.

    @acceptance-criteria @happy-path
    Scenario: Successful initialization
      Given a valid project at "/home/user/my-project"
      And the project has architect.config.ts with typescript and features sources
      When the Electron main process calls initializePatternGraph(configPath)
      Then buildPatternGraph() is called with the resolved config
      And a PatternGraphAPI instance is created from the graph
      And a file watcher is started on all source glob patterns
      And the McpState transitions to "connected"

    @acceptance-criteria @edge-case
    Scenario: Duplicate prevention
      Given a PatternGraphAPI instance already exists for the current project
      When initializePatternGraph is called again for the same project
      Then the existing instance is returned without rebuilding
      And no duplicate file watchers are created

    @acceptance-criteria @validation
    Scenario: Config error handling
      Given a project with an architect.config.ts that fails Zod validation
      When initializePatternGraph attempts to load the config
      Then a ConfigValidationError is returned with field-level details
      And no PatternGraphAPI instance is created
      And the renderer is notified with the structured error
```

**What this demonstrates:**

- Ordered design intent expressed directly in the `Rule:` title
- Input/Output declarations with typed fields
- Behavior-focused scenarios (HOW, not just WHAT)
- Technical precision: specific function names, error types, state transitions

---

## Example 5: ADR in Gherkin Format (Level 2)

A complete Architecture Decision Record.

```gherkin
@architect
@architect-adr:005
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-pattern:ADR005ElectronReactStack
@architect-status:completed
@architect-product-area:Process
Feature: ADR-005 - Electron + React Technology Stack

  **Context:** Studio needs a desktop application framework. The original choice
  (Tauri 2.x + React) was decided in ADR-003 based on binary size and performance.
  However, Tauri's Rust backend is invisible to the @architect annotation system —
  the delivery process that Studio demonstrates cannot track its own backend code.
  Studio is approximately 1% built, making the pivot cost near-zero.

  **Decision:** Pivot from Tauri to Electron + React. The entire Studio codebase
  becomes TypeScript — fully trackable by @architect annotations. The MCP server /
  PatternGraphAPI runs in Electron's main process (no sidecar needed), eliminating
  SidecarLifecycle as a separate concern and dramatically simplifying IPCBridge.

  **Consequences:**
  | Type     | Impact                                                                 |
  | Positive | Full dogfooding — every Studio component is a trackable pattern        |
  | Positive | Architecture simplification — 1 process instead of 3                   |
  | Positive | PatternGraphAPI runs in-process — no sidecar spawning or stdio         |
  | Positive | Mature ecosystem — Electron tooling, debugging, and community support  |
  | Negative | Larger binary size (~150MB vs ~10MB with Tauri)                        |
  | Negative | Higher memory usage (Chromium per-window overhead)                     |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable          | Status    | Location                          | Tests | Test Type |
      | electron-main        | pending   | apps/desktop/src/main/index.ts    | Yes   | unit      |
      | electron-preload     | pending   | apps/desktop/src/main/preload.ts  | No    | n/a       |
      | vite-electron-config | pending   | apps/desktop/vite.config.ts       | No    | n/a       |

  Rule: Decision: Studio uses Electron for full delivery-process dogfooding

    **Invariant:** Every Studio source file is trackable by @architect annotations.
    **Rationale:** A product that demonstrates delivery-process management must be
    buildable using its own delivery process. Tauri's Rust backend was invisible to
    annotations, creating a dogfooding gap.
    **Verified by:** Annotation coverage validation, self-hosted pattern graph.

    @acceptance-criteria @happy-path
    Scenario: Annotation coverage validation
      Given Studio's codebase uses only TypeScript and Gherkin
      When architect_arch_coverage is run on the Studio repo
      Then every source directory is eligible for @architect annotations
      And no source files are in a language invisible to the extraction pipeline

  Rule: Decision: PatternGraphAPI runs in Electron main process

    **Invariant:** No separate sidecar process is needed for architecture queries.
    **Rationale:** Electron's main process is Node.js — the same runtime as
    PatternGraphAPI. Direct function calls replace stdio JSON-RPC transport.
    **Verified by:** In-process query latency, no sidecar process detection.

    @acceptance-criteria @happy-path
    Scenario: In-process query latency
      Given the PatternGraphAPI is initialized in the Electron main process
      When a query is dispatched from the renderer via IPC
      Then the response time is under 5ms for cached queries
      And no child process is spawned for the query
```

**What this demonstrates:**

- ADR-specific tags (`@architect-adr`, `@architect-adr-status`, `@architect-adr-category`)
- Live-state bootstrap example with no supersession chain
- Context / Decision / Consequences structure
- Consequences table with Positive/Negative types
- Rules prefixed with `Decision:`
- ADR pattern naming convention (`ADR005ElectronReactStack`)

---

## Example 6: TypeScript Design Stub (Ephemeral)

A complete design stub with JSDoc annotations and interface definitions.

```typescript
/**
 * @architect
 * @architect-status roadmap
 * @architect-pattern IPCBridge
 * @architect-implements McpIntegration
 * @architect-target apps/desktop/src/lib/architect-bridge.ts
 * @architect-bounded-context desktop
 * @architect-arch-layer infrastructure
 * @architect-product-area Infrastructure
 * @architect-uses ProjectConnection, McpIntegration
 *
 * ## IPCBridge -- Typed Electron IPC for PatternGraphAPI
 *
 * Provides a type-safe bridge between Electron's renderer process (React UI)
 * and the main process (PatternGraphAPI). All architecture queries flow through
 * this bridge via contextBridge and ipcRenderer.
 *
 * ### Design Decisions
 * DD-1: Type-safe IPC channels -- each MCP tool gets a typed channel
 * DD-2: Automatic serialization -- complex types serialized via structured clone
 * DD-3: Error propagation -- main process errors are forwarded as typed errors
 *
 * ### When to Use
 * - Any React component that needs PatternGraphAPI data
 * - Custom hooks that wrap architecture queries
 *
 * See: feature-inventory.md F-03 IPCBridge
 */

// ---------------------------------------------------------------------------
// Configuration Types
// ---------------------------------------------------------------------------

/** Bridge configuration for connecting to the PatternGraphAPI. */
export interface ArchitectBridgeConfig {
  /** Path to the project's architect.config.ts */
  readonly configPath: string;
  /** Whether to enable file watching for auto-rebuild */
  readonly watchEnabled: boolean;
  /** Timeout for IPC calls in milliseconds */
  readonly timeoutMs: number;
}

// ---------------------------------------------------------------------------
// Query Types
// ---------------------------------------------------------------------------

/** Result wrapper for all IPC queries. */
export interface QueryResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: BridgeError;
  readonly durationMs: number;
}

/** Typed error from the IPC bridge. */
export interface BridgeError {
  readonly code: 'NOT_CONNECTED' | 'TIMEOUT' | 'QUERY_FAILED' | 'CONFIG_ERROR';
  readonly message: string;
  readonly details?: unknown;
}

// ---------------------------------------------------------------------------
// Bridge Service
// ---------------------------------------------------------------------------

/** Type-safe IPC bridge to PatternGraphAPI in the Electron main process. */
export class ArchitectBridge {
  /**
   * Initialize the bridge and connect to the PatternGraphAPI.
   * @param config - Bridge configuration
   * @returns Connection result with API readiness status
   */
  async connect(_config: ArchitectBridgeConfig): Promise<QueryResult<void>> {
    throw new Error('IPCBridge not yet implemented -- roadmap pattern');
  }

  /**
   * Execute a typed query against the PatternGraphAPI.
   * @param tool - MCP tool name (e.g., 'architect_overview')
   * @param params - Tool-specific parameters
   * @returns Query result with typed data
   */
  async query<T>(_tool: string, _params?: Record<string, unknown>): Promise<QueryResult<T>> {
    throw new Error('IPCBridge not yet implemented -- roadmap pattern');
  }

  /** Disconnect from the PatternGraphAPI and clean up resources. */
  async disconnect(): Promise<void> {
    throw new Error('IPCBridge not yet implemented -- roadmap pattern');
  }
}
```

**What this demonstrates:**

- JSDoc annotation block with space-separated tag values
- All required stub tags (`@architect-implements`, `@architect-target`)
- Markdown documentation within JSDoc (`## heading`, `### sections`)
- Design decisions in DD-N format
- `readonly` on all interface fields
- Underscore-prefixed placeholder parameters
- Descriptive throw messages with pattern name
- Section separator comments for type organization

> _Informative:_ Earlier drafts of this example included `@architect-phase`,
> `@architect-depends-on`, `@architect-used-by`, and `@architect-release` in the JSDoc
> tag block. These are not part of the v0.2.0 canonical taxonomy; reverse edges such
> as `used-by` are derived from `@architect-uses` declarations elsewhere in the graph
> rather than authored on the stub.

---

## Example 7: Minimal Project Configuration

A starter `architect.config.ts` for a new project.

```typescript
import { DEFAULT_ROLES, defineConfig } from '@libar-dev/architect-core';

export default defineConfig({
  // Use the general-purpose role set (default tag taxonomy)
  roles: DEFAULT_ROLES,

  // Define where annotated source files live
  sources: {
    // TypeScript files with @architect-* JSDoc annotations
    typescript: ['src/**/*.ts', 'src/**/*.tsx'],

    // Design stubs (not compiled, not linted)
    stubs: ['architect/stubs/**/*.ts'],

    // Gherkin feature files (specs, ADRs, executable features if projected)
    features: ['architect/specs/*.feature', 'architect/decisions/*.feature'],

    // Exclude test files from pattern extraction
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  },

  // Generated documentation output
  output: {
    directory: 'docs-live',
    overwrite: true,
  },
});
```

**What this demonstrates:**

- `defineConfig()` entry point with TypeScript type safety
- Default role set selection for the standard tag taxonomy
- Three source types with glob patterns
- Exclusion patterns for test files
- Output directory configuration

---

## Summary: Example Coverage

| Example | Artifact Type     | Track                | Key Concepts                                             |
| ------- | ----------------- | -------------------- | -------------------------------------------------------- |
| 1       | Candidate spec    | Refinement           | `candidate` status, open questions, reduced requirements |
| 2       | Feature spec      | Delivery (Level 1)   | Gate tag, pattern name, basic scenarios                  |
| 3       | Feature spec      | Delivery (Level 2)   | All tags, deliverables, rules, invariants                |
| 4       | Design-level spec | Delivery (ephemeral) | Input/Output, sequence tags, behavior detail             |
| 5       | ADR               | Permanent            | Context/Decision/Consequences, supersession              |
| 6       | Design stub       | Delivery (ephemeral) | JSDoc annotations, readonly interfaces, placeholders     |
| 7       | Configuration     | —                    | defineConfig, sources, roles                             |
