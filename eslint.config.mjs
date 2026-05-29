import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

// No-BC doctrine: source files must not carry suppression or
// backwards-compatibility marker comments. See AGENTS.md → "Engineering
// doctrine → No-BC" and `scripts/guard-no-suppressions.mjs` for the
// out-of-band ratcheting guard with the same rule pattern.
const SUPPRESSION_COMMENT_PATTERN = /(?:eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck)/u;

const architectLocalPlugin = {
  rules: {
    'no-suppression-comments': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow suppression and backwards-compatibility marker comments.',
        },
        messages: {
          forbidden:
            '[no-bc:no-suppression-comments] Do not add suppression or backwards-compatibility marker comments (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`). Fix the root cause. See AGENTS.md → "Engineering doctrine → No-BC".',
        },
        schema: [],
      },
      create(context) {
        return {
          Program() {
            const sourceCode = context.sourceCode;
            for (const comment of sourceCode.getAllComments()) {
              if (SUPPRESSION_COMMENT_PATTERN.test(comment.value)) {
                context.report({
                  loc: comment.loc,
                  messageId: 'forbidden',
                });
              }
            }
          },
        };
      },
    },
  },
};

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.js', '**/*.mjs'],
  },

  // Base recommended configs
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Register the local plugin globally; specific rule activation lives in
  // file-scoped blocks below so test/fixture surfaces stay opt-in.
  {
    plugins: {
      'architect-local': architectLocalPlugin,
    },
  },

  // No-suppression doctrine — production source only. Tests stay free to use
  // type-narrowing tools the rule would otherwise forbid.
  {
    files: ['packages/*/src/**/*.ts', 'src/**/*.ts'],
    ignores: ['**/tests/**', '**/*.steps.ts', '**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'architect-local/no-suppression-comments': 'error',
    },
  },

  // No circular imports doctrine (CLAUDE.md → "Engineering doctrine → TypeScript
  // strictness") — production source only. The same rule lives in the
  // `tests/scripts/architect.config.ts` block below for those surfaces;
  // pre-existing source cycles are tracked separately under P1-12.
  {
    files: ['packages/*/src/**/*.ts'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './tsconfig.eslint.json'],
        },
      },
    },
    rules: {
      'import/no-cycle': ['warn', { ignoreExternal: true }],
    },
  },

  // architect-projection src — honour the `_`-prefix unused convention used by factory wrappers
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // architect-projection boundary rules — each message carries a `[arch-boundary:<id>]` tag
  // so contributors can grep the codebase (and `packages/architect-projection/README.md` →
  // "Architecture invariants → Enforced at lint time") for the rule by id.
  {
    files: ['src/renderers/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '../projections/documentation-composition/architecture-diagram.js',
              message:
                '[arch-boundary:renderer-no-doc-composition] Renderers must not import documentation-composition projections or its registry. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
            {
              name: '../projections/documentation-composition/documentation-bundle.js',
              message:
                '[arch-boundary:renderer-no-doc-composition] Renderers must not import documentation-composition projections or its registry. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
            {
              name: '../projections/documentation-composition/documentation-type-registry.js',
              message:
                '[arch-boundary:renderer-no-doc-composition] Renderers must not import documentation-composition projections or its registry. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
            {
              name: '../projections/documentation-composition/index.js',
              message:
                '[arch-boundary:renderer-no-doc-composition] Renderers must not import documentation-composition projections or its registry. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
            {
              name: '../projections/documentation-composition/pr-change-review.js',
              message:
                '[arch-boundary:renderer-no-doc-composition] Renderers must not import documentation-composition projections or its registry. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
            {
              name: '../projections/documentation-composition/project-config.js',
              message:
                '[arch-boundary:renderer-no-doc-composition] Renderers must not import documentation-composition projections or its registry. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
            {
              name: '../routing/route-id.js',
              importNames: ['createIndexRouteId', 'createEntityRouteId'],
              message:
                '[arch-boundary:renderer-no-route-construction] Renderers must not construct route ids directly; keep route construction in projection helpers. Type-only `LogicalRouteId` imports are allowed. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
          ],
          patterns: [
            {
              group: ['../**/*.internal.js'],
              message:
                '[arch-boundary:renderer-no-cross-layer-internal] Renderers must not import foreign `.internal.js` modules; keep renderer-private wrappers local to `src/renderers/`. See packages/architect-projection/README.md "Architecture invariants → Enforced at lint time".',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportSpecifier[imported.name="TRUSTED_MARKDOWN"]',
          message:
            '[trust-boundary:trusted-markdown-firewall] `TRUSTED_MARKDOWN` is renderer-private and must not be imported or exported; it authorizes raw-markdown emission strictly within the renderer module that owns it. See packages/architect-projection/README.md "Markdown/content trust boundary".',
        },
        {
          selector: 'ExportSpecifier[local.name="TRUSTED_MARKDOWN"]',
          message:
            '[trust-boundary:trusted-markdown-firewall] `TRUSTED_MARKDOWN` is renderer-private and must not be imported or exported. See packages/architect-projection/README.md "Markdown/content trust boundary".',
        },
        {
          selector: 'ExportSpecifier[exported.name="TRUSTED_MARKDOWN"]',
          message:
            '[trust-boundary:trusted-markdown-firewall] `TRUSTED_MARKDOWN` is renderer-private and must not be imported or exported. See packages/architect-projection/README.md "Markdown/content trust boundary".',
        },
        {
          selector:
            'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name="TRUSTED_MARKDOWN"]',
          message:
            '[trust-boundary:trusted-markdown-firewall] `TRUSTED_MARKDOWN` is renderer-private and must not be imported or exported. See packages/architect-projection/README.md "Markdown/content trust boundary".',
        },
        {
          selector: 'ExportNamedDeclaration > FunctionDeclaration[id.name="TRUSTED_MARKDOWN"]',
          message:
            '[trust-boundary:trusted-markdown-firewall] `TRUSTED_MARKDOWN` is renderer-private and must not be imported or exported. See packages/architect-projection/README.md "Markdown/content trust boundary".',
        },
      ],
    },
  },

  // TypeScript files configuration
  {
    files: ['architect.config.ts', 'tests/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './tsconfig.eslint.json'],
        },
      },
    },
    rules: {
      // ============================================================
      // STRICT TYPE SAFETY
      // ============================================================

      // Require explicit return types on functions
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],

      // Require explicit accessibility modifiers
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],

      // No any - strict mode
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Strict null checks
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: true, // Allow if (str) for string checks
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: false,
          allowNullableString: true, // Allow if (str) for nullable strings
          allowNullableNumber: false,
          allowAny: false,
        },
      ],

      // Prevent floating promises
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // ============================================================
      // CODE QUALITY
      // ============================================================

      // Unused variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // No console in production code (warn for now)
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Prefer const
      'prefer-const': 'error',

      // No var
      'no-var': 'error',

      // Require === and !==
      eqeqeq: ['error', 'always'],

      // No eval
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // ============================================================
      // STYLE CONSISTENCY
      // ============================================================

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // Consistent type exports
      '@typescript-eslint/consistent-type-exports': 'error',

      // Prevent runtime import cycles.
      'import/no-cycle': ['error', { ignoreExternal: true }],

      // Array type style
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // Prefer nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Prefer optional chain
      '@typescript-eslint/prefer-optional-chain': 'error',

      // ============================================================
      // RELAXED RULES (pragmatic exceptions)
      // ============================================================

      // Allow empty functions for callbacks/stubs
      '@typescript-eslint/no-empty-function': 'off',

      // Allow require for dynamic imports in CLI
      '@typescript-eslint/no-require-imports': 'off',

      // Restrict template expressions is too strict for logging
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: false,
          allowRegExp: false,
        },
      ],

      // Disable some overly pedantic rules
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/prefer-readonly': 'off',

      // AST libraries use string enums that don't match TypeScript enums
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',

      // Allow type aliases for simple types (Ok, Err)
      '@typescript-eslint/consistent-type-definitions': 'off',

      // Allow throwing unknown errors (Result.unwrap pattern)
      '@typescript-eslint/only-throw-error': 'off',

      // Deprecated Zod APIs - will update when needed
      '@typescript-eslint/no-deprecated': 'warn',

      // Sometimes we need these assertions for branded types
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    },
  },

  // CLI files - allow console output
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Test files - slightly relaxed
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    rules: {
      // Allow console in tests
      'no-console': 'off',

      // Allow any in tests for mocking
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Relax strict boolean for test assertions
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // Allow non-null assertions in tests
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // BDD test files (steps, support, fixtures) - same relaxed rules as unit tests
  {
    files: [
      '**/tests/steps/**/*.ts',
      '**/tests/support/**/*.ts',
      '**/tests/fixtures/**/*.ts',
      '**/tests/unit/**/*.ts',
      '**/*.steps.ts',
    ],
    rules: {
      // Allow console in tests
      'no-console': 'off',

      // Allow any in tests for mocking and test utilities
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Relax strict boolean for test assertions
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // Allow non-null assertions in tests (common in assertions)
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Test helpers frequently assemble assertion strings from partially typed
      // fixture content; keep these checks strict in product code, but relax them here.
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',

      // Allow redundant type constituents in test types
      '@typescript-eslint/no-redundant-type-constituents': 'off',

      // Allow unnecessary type arguments in test utilities
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',

      // Allow reduce type parameter assertions in test utilities
      '@typescript-eslint/prefer-reduce-type-parameter': 'off',

      // Allow || for test defaults (less strict than ??)
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      // Vitest-cucumber tables and dynamic result assertions often use bracket access
      '@typescript-eslint/dot-notation': 'off',

      // Test assertions frequently keep defensive checks that are clearer than lint-perfect code
      '@typescript-eslint/no-unnecessary-condition': 'off',

      // Regex match style is not important in step/support files
      '@typescript-eslint/prefer-regexp-exec': 'off',

      // Preserve the existing local test-helper array style without churn
      '@typescript-eslint/array-type': 'off',

      // BDD step definitions don't need explicit return types (cucumber pattern)
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow unused vars in step definitions (some steps are defined for documentation)
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // Prettier config - must be last to override style rules
  eslintConfigPrettier,
);
