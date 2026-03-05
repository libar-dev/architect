# Plan: Add Pencil Design Instructions to libar-dev-website CLAUDE.md

## Context

The libar-dev-website has a Pencil design file (`design/libar-dev-design.pen`) and the existing CLAUDE.md already has a "Reference Skill" stub pointing to the pencil-design skill at `/Users/darkomijic/.agents/skills/pencil-design`. However, the CLAUDE.md is missing:

1. Project-specific design context (design file path, Swiss Constructivist aesthetic, fonts, token prefix)
2. Token→CSS mapping (how Pencil variables → `--dp-*` CSS vars → Tailwind utilities)
3. Landing page build status (which sections are pending)
4. A crisp tool/operation quick reference grounded in this project's needs
5. A note on the MCPorter typed client pattern for potential scripted design work

The full schema (confirmed via `npx mcporter list pencil --schema`) shows 14 tools. The most impactful for design work in this project:

| Tool                                     | Why Critical                                                      |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `batch_design`                           | All create/update/delete operations — the core DSL                |
| `batch_get`                              | Component discovery (`reusable: true`) before inserting anything  |
| `get_variables`                          | Token audit before applying any style value                       |
| `search_all_unique_properties`           | Audit hardcoded values (fillColor, textColor, cornerRadius, etc.) |
| `replace_all_matching_properties`        | Bulk token migration — swap hardcoded → variable refs             |
| `snapshot_layout(problemsOnly: true)`    | Catch overflow/clipping after each section                        |
| `get_screenshot`                         | Visual verification after each section                            |
| `get_editor_state(include_schema: true)` | First call in any session — gets live schema                      |

No TypeScript helper file is needed: this project has no programmatic Pencil scripting (Astro docs site, interactive design sessions only). Helper patterns go in CLAUDE.md as documentation.

---

## What to Add to CLAUDE.md

**File:** `/Users/darkomijic/dev-projects/libar-dev-website/CLAUDE.md`

Add a `## Pencil Design` section (after the existing "Reference Skill" section) with the following subsections:

### 1. Design File

```
design/libar-dev-design.pen   ← single source of design truth
```

### 2. This Project's Design System

- **Aesthetic:** Swiss Constructivist — functional, typographic, precise
- **Fonts:** Bebas Neue (display), JetBrains Mono (code), Outfit (body)
- **Accent:** `#e8530e` (warm orange)
- **Token prefix:** `--dp-*` in `src/styles/tokens.css`
- **Pencil variables → CSS:** Pencil variable names must match `--dp-*` keys for accurate code generation

### 3. Session Start Checklist

5 steps before any design work:

1. `get_editor_state(include_schema: true)` — live schema + active selection
2. `batch_get(reusable: true)` — discover ALL existing components first
3. `get_variables` — read all `--dp-*` token values
4. `get_guidelines(topic)` — relevant design rules
5. `get_style_guide_tags` / `get_style_guide` — only for new screen directions

### 4. Token→CSS Mapping Rule

- **In Pencil**: use `$variableName` references, never hardcoded hex values
- **In generated CSS**: emit `var(--dp-*)` custom properties
- **In Tailwind**: use semantic classes (`bg-primary`, `text-foreground`), never arbitrary values (`bg-[#e8530e]`)
- Before any styling: run `search_all_unique_properties` to audit for hardcoded values

### 5. Landing Page Section Status

| Section              | Status  | Component File                                             |
| -------------------- | ------- | ---------------------------------------------------------- |
| Hero                 | Live    | `src/components/landing/Hero.astro`                        |
| Pipeline             | Pending | `src/components/landing/delivery-process/Pipeline.astro`   |
| Capabilities/Pillars | Pending | `src/components/landing/delivery-process/Pillars.astro`    |
| Comparison           | Pending | (no file yet)                                              |
| QuickStart           | Pending | (no file yet)                                              |
| Metrics              | Pending | `src/components/landing/delivery-process/Metrics.astro`    |
| MCP Callout          | Pending | `src/components/landing/delivery-process/McpCallout.astro` |

### 6. Operation Mini-Language Quick Reference

Key rules distilled from the full schema:

- `I(parent, {type, ...props})` — Insert (always assign binding)
- `U("nodeId", {...props})` — Update (never changes `id`/`type`/`ref`)
- `C("nodeId", parent, {descendants: {...}})` — Copy (use `descendants` for nested overrides, NOT separate `U` calls)
- `R("nodeId", {...})` — Replace a node entirely
- `D("nodeId")` — Delete (use literal node ID, not binding)
- `M("nodeId", parent, index?)` — Move
- `G(nodeIdOrBinding, "ai"|"stock", prompt)` — Image fill (no "image" type — images are fills)
- Max 25 ops per `batch_design` call; operations roll back on error
- Binding names are local to one `batch_design` call; don't reuse across calls

### 7. Common Project-Specific Mistakes

| Mistake                                   | Correct                                             |
| ----------------------------------------- | --------------------------------------------------- |
| Hardcoding `#e8530e`                      | Use Pencil variable `$accent` or equivalent         |
| Using Inter font                          | Use Bebas Neue / Outfit / JetBrains Mono            |
| Building entire section then checking     | Screenshot + layout check after each section        |
| `U()` on descendant of just-`C()`-ed node | Use `descendants` property in the `C()` call itself |
| Generating `rounded-[6px]`                | Use `rounded-md` or equivalent semantic class       |

### 8. MCPorter Typed Client (Optional Scripted Work)

If you ever need to call Pencil tools from TypeScript scripts:

```bash
npx mcporter list pencil --schema   # full typed signatures
npx mcporter emit-ts pencil --mode client --out scripts/pencil-client.ts
```

The typed proxy (`createServerProxy`) is significantly more ergonomic than raw MCP SDK calls for batch scripting.

---

## File to Modify

**`/Users/darkomijic/dev-projects/libar-dev-website/CLAUDE.md`** — append the `## Pencil Design` section after the existing `## Reference Skill` section (line 93).

The existing `## Reference Skill` section already covers the skill file path and its references — do not duplicate that. The new section adds project-specific context that the generic skill doesn't know: design file path, token prefix, landing page build status, and operation rules.

---

## Verification

After editing:

1. Read the file back to confirm no duplication with existing "Reference Skill" section
2. Confirm the landing page section status table matches `src/components/landing/` directory contents
3. Confirm MCPorter command works: `npx mcporter list pencil --schema` (already verified ✓)
