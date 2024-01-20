// @ts-check

/**
 * @type {PrettierConfig & Partial<PJPOptions> & SortImportsConfig}
 */
module.exports = {
  trailingComma: "all",
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  printWidth: 90,
  proseWrap: "always",
  quoteProps: "consistent",
  useTabs: false,
  endOfLine: "lf",
  bracketSameLine: true,
  plugins: ["./plugins/prettier/all.cjs"],
  jsdocEnsureDescriptionsAreSentences: true,
  jsdocPrintWidth: 90,
  jsdocTagsOrder: ["example", "template", "param", "returns", "namespace", "typedef"],
  jsdocFormatExamples: false,
  jsdocUseTypeScriptTypesCasing: false,
  parser: "typescript",
  jsdocMinSpacesBetweenNameAndDescription: 1,
  jsdocExperimentalFormatCommentsWithoutTags: true,
  jsdocPluginExtended: true,
  importOrder: [
    "^./global.ts$|^@global$",
    "<THIRD_PARTY_MODULES>|^@dependencies$|^@dev-dependencies$",
    "^@base$",
    "^@fanfictions$",
    "^@localization$",
    "^[./]",
  ],
  importOrderSeparation: true,
  overrides: [
    {
      files: "*.test.ts",
      options: {
        printWidth: 120,
      },
    },
  ],
};

/**
 * @typedef {import("prettier").Options} PrettierConfig
 */

/**
 * @typedef {import("@trivago/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig
 */

/**
 * Options for configuring Prettier JSDoc plugin behavior.
 *
 * @typedef {{
 *   jsdocAllowDescriptionTag: boolean;
 *   jsdocUseDescriptionTag: boolean;
 *   jsdocFormatExamples: boolean;
 *   jsdocLinesBetweenExampleTagAndCode: number;
 *   jsdocIndentFormattedExamples: boolean;
 *   jsdocIndentUnformattedExamples: boolean;
 *   jsdocAllowAccessTag: boolean;
 *   jsdocEnforceAccessTag: boolean;
 *   jsdocUseTypeScriptTypesCasing: boolean;
 *   jsdocFormatComplexTypesWithPrettier: boolean;
 *   jsdocUseShortArrays: boolean;
 *   jsdocFormatDotForArraysAndObjects: boolean;
 *   jsdocUseDotForArraysAndObjects: boolean;
 *   jsdocFormatStringLiterals: boolean;
 *   jsdocUseSingleQuotesForStringLiterals: boolean;
 *   jsdocSpacesBetweenStringLiterals: number;
 *   jsdocUseColumns: boolean;
 *   jsdocGroupColumnsByTag: boolean;
 *   jsdocConsistentColumns: boolean;
 *   jsdocDescriptionColumnMinLength: number;
 *   jsdocMinSpacesBetweenTagAndType: number;
 *   jsdocMinSpacesBetweenTypeAndName: number;
 *   jsdocMinSpacesBetweenNameAndDescription: number;
 *   jsdocLinesBetweenDescriptionAndTags: number;
 *   jsdocEnsureDescriptionsAreSentences: boolean;
 *   jsdocAllowDescriptionOnNewLinesForTags: string[];
 *   jsdocIgnoreNewLineDescriptionsForConsistentColumns: boolean;
 *   jsdocUseInlineCommentForASingleTagBlock: boolean;
 *   jsdocPrintWidth: number;
 *   jsdocPluginEnabled: boolean;
 *   jsdocPluginExtended: boolean;
 * }} PJPOptions
 */
