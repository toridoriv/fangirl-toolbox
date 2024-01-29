/** @type {import("eslint").Linter.Config} */
module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  overrides: [
    {
      files: ["*.cjs"],
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      files: ["*.ts", "*.d.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        "no-unused-vars": "off",
        "no-undef": "off",
      },
    },
  ],
  parser: "espree",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": [
      "error",
      {},
      {
        usePrettierrc: true,
      },
    ],
    "no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_|^types" },
    ],
    "sort-imports": [
      "error",
      {
        ignoreCase: false,
        ignoreDeclarationSort: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ["none", "single", "all", "multiple"],
        allowSeparatedGroups: true,
      },
    ],
  },
};
