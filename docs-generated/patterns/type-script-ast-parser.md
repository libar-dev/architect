# ✅ TypeScript AST Parser

**Purpose:** Detailed documentation for the TypeScript AST Parser pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## TypeScript AST Parser - JSDoc Directive Extraction

Parses TypeScript source files using @typescript-eslint/typescript-estree
to extract @libar-docs-* directives with their associated code blocks.
First stage of the three-stage pipeline: Scanner → Extractor → Generator.

### When to Use

- Scanning TypeScript files for documentation directives
- Extracting code snippets following JSDoc comments
- Building pattern metadata from JSDoc tags

### Key Concepts

- **Data-Driven Extraction**: Tag formats defined in registry, not hardcoded
- **Schema-First Validation**: All directives validated against Zod schemas
- **Result Monad**: Returns Result<T, E> for explicit error handling

## Use Cases

- When parsing JSDoc comments for @libar-docs-* directives
- When extracting code blocks following documentation comments

---

[← Back to Pattern Registry](../PATTERNS.md)
