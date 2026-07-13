// Shared ESLint flat-config preset, extended by every app/package's eslint.config.js.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
export const basePreset = [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        // Type-aware rules (e.g. await-thenable below) need a type-checked program per file.
        // projectService discovers each file's nearest tsconfig.json by walking up from it and
        // resolves relative to cwd (each app's own directory, since lint runs as
        // `pnpm --filter <app> lint`) — no hand-maintained `project` path list needed.
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      // react-hook-form's handleSubmit(onSubmit) returns a Promise-returning event handler —
      // the idiomatic, documented way to wire it to <form onSubmit>, not a bug. Without this,
      // every react-hook-form usage in every app trips no-misused-promises on that one line.
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    },
  },
  {
    // Enforces the Clean Architecture dependency direction from Architecture §5:
    // domain/ and application/ must never import infrastructure/ or framework code —
    // scoped to those two folders only, so infrastructure/ code importing its siblings is unaffected.
    files: ["**/domain/**/*.ts", "**/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/*", "**/infrastructure/**"],
              message: "domain/ and application/ may not import infrastructure/ — depend on the interface, bind the implementation in the module's providers array.",
            },
          ],
        },
      ],
    },
  },
  {
    // `**/` prefixes are required here, not just `dist/**` — flat-config `ignores` patterns
    // match from the config's base path, and every app nests its build output one level down
    // (apps/web-merchant/.next, etc.), so an unprefixed pattern silently never matched and
    // this preset ended up linting build artifacts and generated files (see next-env.d.ts).
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/.expo/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.config.js",
      "**/*.config.ts",
      "**/next-env.d.ts",
    ],
  },
];

export default basePreset;
