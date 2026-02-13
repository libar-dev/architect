### Modular CLAUDE.md Architecture

The package uses a **modular CLAUDE.md system** via `@libar-dev/modular-claude-md`.

**Philosophy:** Optimized instructions are the 20% of context that delivers 80% of value. Different work contexts need different information.

#### Directory Structure

| Directory                  | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `_claude-md/core/`         | Project overview, commands, architecture |
| `_claude-md/testing/`      | Gherkin policy, vitest-cucumber rules    |
| `_claude-md/workflow/`     | Session workflows, FSM, handoff          |
| `_claude-md/validation/`   | Process Guard, anti-patterns             |
| `_claude-md/api/`          | Annotations, tag formats, relationships  |
| `_claude-md/authoring/`    | Gherkin patterns, feature file content   |
| `_claude-md/meta/`         | Claude MD management, deps-packages      |
| `_claude-md/metadata.json` | Central configuration                    |

#### Adding New Content

1. **Create module file** in appropriate directory:
   - Use tables over paragraphs where possible
   - Focus on actionable rules and patterns
   - Keep it essential and compact

2. **Update metadata.json** with module path and tags

3. **Validate and build:**

   ```bash
   pnpm claude-md:validate  # Check configuration
   pnpm claude-md:build     # Regenerate CLAUDE.md
   pnpm claude-md:info      # Review structure
   ```

4. **Commit both** module and generated CLAUDE.md files

#### Content Guidelines

| Guideline      | Rationale                                            |
| -------------- | ---------------------------------------------------- |
| Essential only | Only include what Claude needs to know               |
| Actionable     | Rules, patterns, decisions - not prose               |
| Compact        | Tables over paragraphs where possible                |
| Tagged         | Use tags to control which variations include content |
