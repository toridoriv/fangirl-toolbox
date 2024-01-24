import { z } from "@dependencies";

import { lazyPick } from "@base";

import { LANGUAGE_BY_CODE, LanguageCode } from "./enums.ts";
import { LANGUAGE_BY_NAME, LanguageName } from "./enums.ts";

/**
 * Schema for language codes following `ISO 639-1` standard.
 */
export const LanguageCodeSchema = z.nativeEnum(LanguageCode);

/**
 * Schema for language names in English.
 */
export const LanguageNameSchema = z.nativeEnum(LanguageName);

/**
 * Defines a schema for language objects.
 */
export const LanguageSchema = z
  .object({
    /**
     * A two-letter language code following ISO 639-1 standard.
     */
    code: LanguageCodeSchema,
    /**
     * The English name of the language.
     */
    name: LanguageNameSchema,
  })
  .or(LanguageCodeSchema.transform(lazyPick(LANGUAGE_BY_CODE)))
  .or(LanguageNameSchema.transform(lazyPick(LANGUAGE_BY_NAME)));

/**
 * Defines a schema that can accept either a string or LanguageSchema object as input.
 */
export const StringOrLanguageSchema = z
  .preprocess(preprocessStringLanguage, z.string())
  .transform(LanguageSchema.parse)
  .or(LanguageSchema);

function preprocessStringLanguage(value: unknown) {
  if (typeof value === "string") {
    if (value.length === 2) {
      return value.toLowerCase();
    }

    return value[0].toUpperCase() + value.substring(1).toLowerCase();
  }
  return value;
}
