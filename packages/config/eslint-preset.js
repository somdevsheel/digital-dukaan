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
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
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
    ignores: ["dist/**", ".next/**", "coverage/**", "**/*.config.js"],
  },
];

export default basePreset;
