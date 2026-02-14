# 📋 Living Roadmap CLI

**Purpose:** Detailed requirements for the Living Roadmap CLI feature

---

## Overview

| Property       | Value                               |
| -------------- | ----------------------------------- |
| Status         | planned                             |
| Product Area   | Process                             |
| Business Value | query roadmap with natural language |
| Phase          | 100                                 |

## Description

**Problem:**
Roadmap is a static document that requires regeneration.
No interactive way to answer "what's next?" or "what's blocked?"
Critical path analysis requires manual inspection.

**Solution:**
Add interactive CLI commands for roadmap queries:

- `pnpm roadmap:next` - Show next actionable phase
- `pnpm roadmap:blocked` - Show phases waiting on dependencies
- `pnpm roadmap:path-to --phase N` - Show critical path to target
- `pnpm roadmap:status` - Quick summary (completed/active/roadmap counts)

This is the capstone for Setup A (Framework Roadmap OS).
Transforms roadmap from "document to maintain" to "queries over reality".

Implements Convergence Opportunity 8: Living Roadmap That Compiles.

## Acceptance Criteria

**Query next actionable phase**

- Given TypeScript phase files with dependencies and status
- When running pnpm roadmap:next
- Then output shows the next phase that can be started
- And dependencies are verified as complete
- And estimated effort is shown

**Query blocked phases**

- Given TypeScript phase files with depends-on metadata
- When running pnpm roadmap:blocked
- Then output shows phases waiting on incomplete dependencies
- And blocking dependencies are listed per phase

**Calculate critical path to target**

- Given a target phase with transitive dependencies
- When running pnpm roadmap:path-to --phase N
- Then output shows all phases that must complete first
- And total estimated effort is calculated
- And phases are ordered by dependency graph

**Quick status summary**

- Given TypeScript phase files with completed, active, and roadmap status
- When running pnpm roadmap:status
- Then output shows counts per status
- And overall progress percentage is shown
- And active phase details are highlighted

## Deliverables

- roadmap:next CLI command (pending)
- roadmap:blocked CLI command (pending)
- roadmap:path-to CLI command (pending)
- roadmap:status CLI command (pending)
- Dependency graph analyzer (pending)
- Critical path calculator (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
