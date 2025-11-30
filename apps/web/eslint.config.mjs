// Extend root ESLint config and add Next.js-specific rules
import rootConfig from "../../eslint.config.mjs";
// @ts-expect-error - eslint-config-next does not provide TypeScript definitions for these subpaths
// ESLint v9+ flat configs are often written in .mjs to avoid type complexity
import nextVitals from "eslint-config-next/core-web-vitals";
// @ts-expect-error - eslint-config-next does not provide TypeScript definitions for these subpaths
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";
import vitest from "eslint-plugin-vitest";

const eslintConfig = [
  // Start with root config (includes TypeScript strict rules + security plugin)
  ...rootConfig,

  // Override ignores for Next.js workspace
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  // Add Next.js-specific rules
  ...nextVitals,
  ...nextTs,

  // React Hooks with React 19 Compiler rules
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // Use recommended-latest preset for React Compiler-powered rules
      ...reactHooks.configs['recommended-latest'].rules,
    },
  },

  // Vitest rules for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/valid-expect': 'error',
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },
];

export default eslintConfig;
