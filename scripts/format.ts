import { format } from "npm:prettier";
import type { Config } from "npm:prettier";
import jsdocPlugin from "npm:@homer0/prettier-plugin-jsdoc";
import { walkSync } from "std/fs/walk.ts";

const config: Config & Partial<PJPOptions> = {
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
  plugins: [jsdocPlugin],
  jsdocEnsureDescriptionsAreSentences: true,
  jsdocTagsOrder: [
    "example",
    "template",
    "param",
    "returns",
    "namespace",
    "typedef",
  ],
  jsdocFormatExamples: false,
  jsdocUseTypeScriptTypesCasing: false,
  parser: "typescript",
  jsdocMinSpacesBetweenNameAndDescription: 1,
};

const target = Deno.args[0] || "./";

if (target.endsWith(".ts")) {
  await formatFile(target);

  Deno.exit(0);
}

const files = walkSync(target, { includeDirs: false, exts: [".ts"] });

for (const file of files) {
  await formatFile(file.path);
}

async function formatFile(path: string) {
  const content = Deno.readTextFileSync(path);
  const formatted = await format(content, config);

  console.info(`✨ File ${path} formatted successfully.`);

  Deno.writeTextFileSync(path, formatted);
}

type PJPOptions = {
  jsdocAllowDescriptionTag: boolean;
  jsdocUseDescriptionTag: boolean;
  jsdocFormatExamples: boolean;
  jsdocLinesBetweenExampleTagAndCode: number;
  jsdocIndentFormattedExamples: boolean;
  jsdocIndentUnformattedExamples: boolean;
  jsdocAllowAccessTag: boolean;
  jsdocEnforceAccessTag: boolean;
  jsdocUseTypeScriptTypesCasing: boolean;
  jsdocFormatComplexTypesWithPrettier: boolean;
  jsdocUseShortArrays: boolean;
  jsdocFormatDotForArraysAndObjects: boolean;
  jsdocUseDotForArraysAndObjects: boolean;
  jsdocFormatStringLiterals: boolean;
  jsdocUseSingleQuotesForStringLiterals: boolean;
  jsdocSpacesBetweenStringLiterals: number;
  jsdocUseColumns: boolean;
  jsdocGroupColumnsByTag: boolean;
  jsdocConsistentColumns: boolean;
  jsdocDescriptionColumnMinLength: number;
  jsdocMinSpacesBetweenTagAndType: number;
  jsdocMinSpacesBetweenTypeAndName: number;
  jsdocMinSpacesBetweenNameAndDescription: number;
  jsdocLinesBetweenDescriptionAndTags: number;
  jsdocEnsureDescriptionsAreSentences: boolean;
  jsdocAllowDescriptionOnNewLinesForTags: string[];
  jsdocIgnoreNewLineDescriptionsForConsistentColumns: boolean;
  jsdocUseInlineCommentForASingleTagBlock: boolean;
  jsdocPrintWidth: number;
  jsdocPluginEnabled: boolean;
  jsdocPluginExtended: boolean;
};
