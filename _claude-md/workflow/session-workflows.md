**Core Thesis:** Git is the event store. Documentation artifacts are projections. Feature files are the single source of truth.

For detailed guides, see [SESSION-GUIDES.md](./docs/SESSION-GUIDES.md).

### Session Decision Tree

```
Starting from pattern brief?
├── Yes → Need code stubs now? → Yes → Planning + Design
│                              → No  → Planning
└── No  → Ready to code? → Yes → Complex decisions? → Yes → Design first
                                                    → No  → Implementation
                        → No  → Planning
```

| Session           | Input               | Output                    | FSM Change                 |
| ----------------- | ------------------- | ------------------------- | -------------------------- |
| Planning          | Pattern brief       | Roadmap spec (`.feature`) | Creates `roadmap`          |
| Design            | Complex requirement | Design doc + code stubs   | None                       |
| Implementation    | Roadmap spec        | Code + tests              | `roadmap→active→completed` |
| Planning + Design | Pattern brief       | Spec + stubs              | Creates `roadmap`          |
