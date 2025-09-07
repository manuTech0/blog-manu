import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next"

export default defineConfig([
  { 
    ignores: ["node_modules/**", "lib/generated/**", "./node_modules/"]
  },
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], 
    languageOptions: {
      globals: globals.browser
    },
    plugins: { 
      js, 
      react: pluginReact,
      "@next/next": nextPlugin
    },
    rules: {
      "react/react-in-jsx-scope": "off"
    },
  },
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], 
    languageOptions: { globals: globals.browser }
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  nextPlugin.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
]);
