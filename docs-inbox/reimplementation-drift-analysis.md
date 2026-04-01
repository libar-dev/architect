I need help with final validation of changes before I create a PR. i am not expecting that we will be able to do a code review, given that we did a huge cleanup and removed many layers of transformations, adapters, helpers, etc., for different "domains" where taxonomy had different values for statuses.

It would be perfect if we could deploy a few Explore agents to help us with some sanity checks which are not too complicated and for collecting context for creating a PR description. I would like it in a tmp file so I can do some checks before creating a pr.

GitHub preview of changes:
Showing 600 changed files with 45,830 additions and 3,957 deletions.

---

This PR introduces an extremely important new feature. We were about to do more work once a systemic drift issue was found:

@docs-inbox/anti-pattern-fence-monorepo.md
@docs-inbox/reimplementation-drift-monorepo-impact.md

I have managed to chase the root cause, force a breaking change, and enforce this as a last change:
@/Users/darkomijic/.claude/plans/wiggly-greeting-nest.md

The above context is for quality checks if any can be done. For PR review for unreleased public package I would keep the cleanup context to minimal not to look to nefative, something along the lines of Enforcement of Canonical Taxonomy from the last sesion plan... consistency, cleanup. This package is starting to be important in the monorepo which is conumer and driver of the development so it will stop being a toy for experimentation and poor type safety.

The important part, and most important feature in the whole repo was introduced and that part needs to be highlited:
**Process API for AI Coding Agents**

This untracked file is important for context:
@\_working-docs/01-process-api/03-process-api-data-api-context.md

And these specs are scope for the features introduced:

````
## 3. Data API Spec Inventory (8 Specs)

### Dependency Graph (with Status)

	```
	                     ┌── DataAPIOutputShaping (25a) ─────── [DONE] 8/8
	PatternGraphAPI ─────┤
	(V1, exists)         └── DataAPIContextAssembly (25b) ───── [DONE] 7/7
	                              │
	                              └── DataAPIDesignSessionSupport (25c) ── [PARTIALLY-DESIGNED]
	                                    │
	DataAPIStubIntegration (25a) ──────┘ ─────────────────────── [DONE] 7/7

	DataAPIArchitectureQueries (25b) ────────────────────────── [DONE] 6/6

	DataAPIRelationshipGraph (25c) ──────────────────────────── [ROADMAP]
	DataAPICLIErgonomics (25d) ──────────────────────────────── [ROADMAP]
	DataAPIPlatformIntegration (25d) ────────────────────────── [ROPDMAP]
	```


- Oh, I can see that `DataAPIDesignSessionSupport` is not marked as implemented, but it is. During review of that one, a systemic issue was discovered.

**The more details we can provide about the brand-new Process API and related, the better. I will be helpful for upcoming work in the monorepo.**
````

**This will be removed from git before I push:**

```
docs-inbox/reimplementation-drift-analysis.md
docs-inbox/session-prompt-generator-architecture-review.md
docs-inbox/session-prompt-generator-brief.md
docs-inbox/session-prompt-generator-manual.md
```

I will do a temporary bump of the dependency in the monorepo to review the scope of breaking changes before I push.

I would love checks/critical fixes and the tmp PR description for context in the scope of this session.
If some multi-agent magic can be done. Cheers! :)
