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
pnpm lint-patterns      # Lint pattern annotations in src/**/*.ts

# Validation
pnpm validate:patterns  # Cross-source pattern validation
pnpm validate:dod       # Definition of Done validation
pnpm validate:all       # All validations including anti-patterns

# Documentation generation
pnpm docs:patterns      # Generate pattern docs
pnpm docs:all           # Generate all doc types (patterns, roadmap, remaining, changelog)
```
