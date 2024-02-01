// @ts-check

/** @type {PrettierConfig & Partial<PJPOptions>} */
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
  jsdocTagsOrder: [
    "example",
    "internal",
    "private",
    "protected",
    "public",
    "exports",
    "memberof",
    "template",
    "this",
    "callback",
    "param",
    "returns",
    "namespace",
    "see",
    "typedef",
  ],
  jsdocFormatExamples: false,
  jsdocUseTypeScriptTypesCasing: false,
  parser: "babel-ts",
  jsdocMinSpacesBetweenNameAndDescription: 1,
  jsdocExperimentalFormatCommentsWithoutTags: true,
  jsdocPluginExtended: true,
  jsdocPluginEnabled: true,
  jsdocAllowAccessTag: false,
  jsdocUseInlineCommentForASingleTagBlock: true,
  jsdocFormatComplexTypesWithPrettier: true,
  jsdocUseColumns: false,
  jsdocDescriptionColumnMinLength: 1,
  jsdocSortTags: true,
  overrides: [
    {
      files: "*.ts",
      options: {
        parser: "typescript",
      },
    },
    {
      files: "*.json",
      options: {
        parser: "json",
        plugins: [],
      },
    },
  ],
};

/** @typedef {import("prettier").Options} PrettierConfig */

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
