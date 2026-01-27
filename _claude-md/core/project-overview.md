### Project Overview

Code-first documentation and delivery process toolkit. Extracts patterns from TypeScript and Gherkin sources using configurable annotations, generates LLM-optimized markdown and Mermaid architecture diagrams, and validates delivery workflow via pre-commit hooks.

**Core Principle:** Code is the single source of truth. Generated documentation is a projection of annotated source code.

**Key Capabilities:**

- Pattern extraction from TypeScript JSDoc and Gherkin tags
- MasterDataset transformation with pre-computed views (O(1) access)
- Codec-based markdown generation with progressive disclosure
- FSM-enforced delivery workflow validation via pre-commit hooks
