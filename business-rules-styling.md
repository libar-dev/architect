# Annotation Business Rules

**Purpose:** Business rules for the Annotation product area  
**Scope:** 61 rules across 12 features  
**Rules with explicit invariants:** 12

---

# 1. Context Inference

> Source: context-inference.feature

---

### R-CI-001: Recursive wildcard `**` matches nested paths

**Rule**  
Glob patterns using `**` must match files in all nested subdirectories.

**Verified By**

- Recursive wildcard matches nested paths

---

### R-CI-002: First matching rule wins

**Rule**  
When multiple context rules match a file path, the first matching rule must be applied.

**Verified By**

- Single matching rule infers context
- First matching rule wins when multiple could match

---

### R-CI-003: Explicit `archContext` is never overridden

**Rule**  
If a pattern explicitly defines `archContext`, inference must not override it.

**Verified By**

- Explicit context takes precedence over inference

---

# 2. File Discovery

> Source: file-discovery.feature

---

### R-FD-001: Glob discovery returns absolute paths

**Rule**  
`findFilesToScan` must return absolute file paths for all matches.

**Invariant**  
Returned paths must be absolute, regardless of `cwd`.

**Rationale**  
Downstream AST parsing requires stable file references independent of runtime directory.

**Verified By**

- Find TypeScript files matching glob patterns
- Return absolute paths
- Support multiple glob patterns

---

### R-FD-002: Default exclusions filter non-source files

**Rule**  
The discovery system must exclude non-source files by default.

**Invariant**
The following paths must be excluded unless explicitly overridden:

- `node_modules`
- `dist`
- `.test.ts`
- `.spec.ts`
- `.d.ts`

**Rationale**  
Scanning generated output, third-party code, or test files introduces false positives and wastes processing time.

**Verified By**

- Exclude node_modules by default
- Exclude dist directory
- Exclude test files by default
- Exclude declaration files

---

# 3. Shape Extraction

> Source: shape-extraction.feature

---

### R-SE-001: Annotation tags are stripped from extracted JSDoc

**Rule**  
Annotation tags must not appear in rendered shape documentation.

**Invariant**  
Extracted shapes must not contain any `@libar-docs-*` annotation lines in their `jsDoc` field.

**Rationale**  
Annotation tags are pipeline metadata and must not leak into user-facing documentation.

**Verified By**

- JSDoc with only annotation tags produces no jsDoc
- Mixed JSDoc preserves standard tags and strips annotation tags
- Single-line annotation-only JSDoc produces no jsDoc
- Empty lines are collapsed after tag removal

---

### R-SE-002: Large source files are rejected

**Rule**  
Source files exceeding the configured size limit must be rejected during extraction.

**Verified By**

- Source code exceeding 5MB limit returns error

---
