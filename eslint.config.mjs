import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-console": "warn",
      "no-duplicate-imports": "error",
      "prefer-const": "error",
      "no-shadow": "error",
      "no-var": "error",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      eqeqeq: ["error", "always"],
      "prefer-promise-reject-errors": "error",
      "arrow-body-style": ["error", "as-needed"],
      "no-useless-rename": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  ...tseslint.configs.recommended,
];
