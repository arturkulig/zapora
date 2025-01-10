import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  js.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: ["*.config.mjs"],

    plugins: {
      prettier,
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jasmine,
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },

    settings: {},

    rules: {
      "naming-convention": "off",
      "no-self-compare": "error",
      "no-template-curly-in-string": "error",
      "no-unreachable-loop": "error",

      "no-constant-condition": [
        "error",
        {
          checkLoops: false,
        },
      ],

      eqeqeq: [
        "warn",
        "always",
        {
          null: "ignore",
        },
      ],

      "no-label-var": "error",

      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",

      "no-unneeded-ternary": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-exponentiation-operator": "error",

      yoda: [
        "error",
        "never",
        {
          exceptRange: true,
        },
      ],

      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      "@typescript-eslint/no-use-before-define": [
        "error",
        {
          variables: true,
          typedefs: true,
          functions: false,
          classes: false,
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/switch-exhaustiveness-check": "error",

      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],

      "no-floating-promises": "off",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
);
