import tseslint from "typescript-eslint";

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/*.js", "**/*.mjs"],
  },

  // Base recommended configs
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // TypeScript files configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ============================================================
      // STRICT TYPE SAFETY
      // ============================================================

      // Require explicit return types on functions
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],

      // Require explicit accessibility modifiers
      "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],

      // No any - strict mode
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",

      // Strict null checks
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
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
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",

      // ============================================================
      // CODE QUALITY
      // ============================================================

      // Unused variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // No console in production code (warn for now)
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Prefer const
      "prefer-const": "error",

      // No var
      "no-var": "error",

      // Require === and !==
      eqeqeq: ["error", "always"],

      // No eval
      "no-eval": "error",
      "no-implied-eval": "error",

      // ============================================================
      // STYLE CONSISTENCY
      // ============================================================

      // Consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],

      // Consistent type exports
      "@typescript-eslint/consistent-type-exports": "error",

      // Array type style
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],

      // Prefer nullish coalescing
      "@typescript-eslint/prefer-nullish-coalescing": "error",

      // Prefer optional chain
      "@typescript-eslint/prefer-optional-chain": "error",

      // ============================================================
      // RELAXED RULES (pragmatic exceptions)
      // ============================================================

      // Allow empty functions for callbacks/stubs
      "@typescript-eslint/no-empty-function": "off",

      // Allow require for dynamic imports in CLI
      "@typescript-eslint/no-require-imports": "off",

      // Restrict template expressions is too strict for logging
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: false,
          allowRegExp: false,
        },
      ],

      // Disable some overly pedantic rules
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/prefer-readonly": "off",

      // AST libraries use string enums that don't match TypeScript enums
      "@typescript-eslint/no-unsafe-enum-comparison": "off",

      // Allow type aliases for simple types (Ok, Err)
      "@typescript-eslint/consistent-type-definitions": "off",

      // Allow throwing unknown errors (Result.unwrap pattern)
      "@typescript-eslint/only-throw-error": "off",

      // Deprecated Zod APIs - will update when needed
      "@typescript-eslint/no-deprecated": "warn",

      // Sometimes we need these assertions for branded types
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    },
  },

  // CLI files - allow console output
  {
    files: ["**/cli/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // AST parser - relax unnecessary condition checks (defensive coding for external libs)
  {
    files: ["**/scanner/ast-parser.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },

  // Test files - slightly relaxed
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    rules: {
      // Allow console in tests
      "no-console": "off",

      // Allow any in tests for mocking
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",

      // Relax strict boolean for test assertions
      "@typescript-eslint/strict-boolean-expressions": "off",

      // Allow non-null assertions in tests
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // BDD test files (steps, support, fixtures) - same relaxed rules as unit tests
  {
    files: [
      "**/tests/steps/**/*.ts",
      "**/tests/support/**/*.ts",
      "**/tests/fixtures/**/*.ts",
      "**/tests/unit/**/*.ts",
      "**/*.steps.ts",
    ],
    rules: {
      // Allow console in tests
      "no-console": "off",

      // Allow any in tests for mocking and test utilities
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",

      // Relax strict boolean for test assertions
      "@typescript-eslint/strict-boolean-expressions": "off",

      // Allow non-null assertions in tests (common in assertions)
      "@typescript-eslint/no-non-null-assertion": "off",

      // Allow redundant type constituents in test types
      "@typescript-eslint/no-redundant-type-constituents": "off",

      // Allow unnecessary type arguments in test utilities
      "@typescript-eslint/no-unnecessary-type-arguments": "off",

      // Allow reduce type parameter assertions in test utilities
      "@typescript-eslint/prefer-reduce-type-parameter": "off",

      // Allow || for test defaults (less strict than ??)
      "@typescript-eslint/prefer-nullish-coalescing": "off",

      // BDD step definitions don't need explicit return types (cucumber pattern)
      "@typescript-eslint/explicit-function-return-type": "off",

      // Allow unused vars in step definitions (some steps are defined for documentation)
      "@typescript-eslint/no-unused-vars": "warn",
    },
  }
);
