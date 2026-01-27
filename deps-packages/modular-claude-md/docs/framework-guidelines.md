# CLAUDE.md Framework Guidelines

> **Philosophy:** These guidelines are evolutionary - adapt them based on what works for your codebase. Apply common sense over rigid rules. The framework itself should evolve as you learn what's effective.

## Why Framework Matters

The evaluation framework is **more important than CLAUDE.md content itself** - it determines what content you include and how effective it will be:

```
Framework quality → Content selection quality → Session success rate
```

A poor framework leads to accumulation of ineffective content. A good framework ensures evidence-based, high-impact content only.

---

## Module Development Philosophy

### Evidence-Based Content

Before including ANY pattern in CLAUDE.md, answer these questions:

| Question                                 | What to look for                                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **What failure does this prevent?**      | Sessions stuck >15min investigating? Repeated architectural violations? Missing critical context causing rework?      |
| **What's the cost of NOT including it?** | 2 hours rework? User explains same concept 3+ times? Security/correctness risk?                                       |
| **What's the minimum viable form?**      | Pattern name + anti-pattern contrast (50-100 tokens)? Decision tree (150-300 tokens)? Full example (500-2000 tokens)? |
| **How do we know it's working?**         | Observable behavior change? Reduced clarification questions? Faster task completion?                                  |

### Module Size Guidelines (Flexible)

Token allocation should be **effectiveness-driven**, not fixed by arbitrary limits:

| Effectiveness       | Token Budget      | Compression | Action                                |
| ------------------- | ----------------- | ----------- | ------------------------------------- |
| 90-100% (Critical)  | Use what's needed | 3:1 to 5:1  | Keep all details, examples, context   |
| 70-89% (High-value) | Reasonable        | 5:1 to 7:1  | Keep decision points and key examples |
| 40-69% (Useful)     | Aggressive        | 8:1 to 12:1 | Pattern name and critical rule only   |
| <40% (Low-value)    | Remove            | N/A         | Delete or move to external docs       |

**Key insight:** A critical pattern (90%+ effective) can legitimately use 2,000 tokens. Multiple weak patterns (<50% effective) should be removed even if they seem "useful."

### Splitting Large Concepts

**Bigger items can always be split into multiple modules** with shared tags:

```json
{
  "subsections": [
    { "path": "auth/overview.md", "tags": ["auth", "core"] },
    { "path": "auth/jwt-handling.md", "tags": ["auth", "security"] },
    { "path": "auth/multi-tenant.md", "tags": ["auth", "multi-tenant"] }
  ]
}
```

Benefits:

- Each module can be included/excluded independently
- Different variations can include different auth aspects
- Easier to test effectiveness of individual concepts

---

## Quality Over Quantity

### Impact Per Token

Evaluate modules on **impact per token**, not **tokens per concept**:

- Module with 4 concepts isn't automatically "bigger"
- Might be a tightly-related decision tree (single critical path)
- Might be a comprehensive reference saving investigation time
- Might be anti-patterns (negative knowledge is valuable)

### Effectiveness Testing Protocol

Before including a pattern:

```yaml
Testing:
  - Test in 3+ sessions WITH pattern in context
  - Test in 3+ sessions WITHOUT pattern in context
  - Document observable differences
  - Measure time impact (saved or lost)
  - Track violation rate

Inclusion Thresholds:
  ? >70
  : Keep at any token cost
  50-69%: Keep with reasonable compression
  40-49%: Aggressive compression, consider moving to docs/
  <40%: Remove or redesign

Removal Triggers:
  - <20% effectiveness over 5+ sessions
  - Pattern consistently ignored
  - No observable impact on session outcomes
  - Content stale or superseded
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                        | Why It's Bad                        |
| ----------------------------------- | ----------------------------------- |
| Migration status updates            | Temporal, becomes stale quickly     |
| Performance metrics without actions | Token waste, no actionable guidance |
| External doc references             | Claude can't access external URLs   |
| Standard practice explanations      | Already in Claude's training data   |
| Untested "helpful" additions        | Often ineffective, wastes tokens    |
| Verbose rationale sections          | Compress to one line or remove      |

---

## Framework Evolution

### When to Update the Framework

The framework itself should evolve. Update it when:

- **3+ modules are hard to classify** - Categories need refinement
- **New work types discovered** - Add new variation profiles
- **Session failures despite following CLAUDE.md** - Effectiveness criteria need adjustment
- **Evidence shows pattern misalignment** - Thresholds need recalibration
- **Pattern with high token cost but unclear effectiveness** - Need better measurement

### Evolution Actions

```yaml
Actions:
  - Update assessment criteria
  - Add new variation profiles
  - Refine effectiveness thresholds
  - Document new empirical findings
  - Improve compression techniques
  - Create new tools to support decision-making
```

---

## Quick Reference

### Module Checklist

Before committing any CLAUDE.md module:

- [ ] Effectiveness tested? (>40% improvement observed)
- [ ] Under variation token budget?
- [ ] Front-loads critical information?
- [ ] Compressed to minimum viable form?
- [ ] Tagged for correct variations?
- [ ] Passes validation? (`modular-claude-md validate`)

### Decision Tree: Include This Pattern?

```
Has this pattern been tested?
├── No → Test in 3+ sessions first
└── Yes → What's the effectiveness?
    ├── <40% → Remove or redesign
    ├── 40-69% → Compress aggressively, include if high impact
    ├── 70-89% → Include with reasonable compression
    └── 90%+ → Include at whatever token cost needed
```

---

> **Remember:** Every CLAUDE.md improvement should also consider framework improvements. The framework is the tool that builds the tool. **Framework evolution > Content accumulation.**
