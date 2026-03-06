### Common Commands

```bash
# Build and development
pnpm build              # Compile TypeScript
pnpm dev                # Watch mode compilation
pnpm typecheck          # Type check without emit

# Testing
pnpm test               # Run all Vitest tests
pnpm test <pattern>     # Run tests matching pattern (e.g., pnpm test scanner)

# Linting
pnpm lint               # ESLint on src and tests
pnpm lint:fix           # Auto-fix lint issues

# Validation + Documentation
pnpm validate:all       # All validations including anti-patterns and DoD
pnpm docs:all           # Generate all doc types

# Data API (see Context Gathering Protocol above)
pnpm process:query -- --help                              # All subcommands and options
pnpm process:query -- context <pattern> --session design  # Session context bundle
pnpm process:query -- overview                            # Project health summary
```
