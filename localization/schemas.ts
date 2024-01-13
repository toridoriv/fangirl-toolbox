import { z } from "zod";
import { LANGUAGE_BY_CODE, LanguageCode } from "./enums.ts";
import { LANGUAGE_BY_NAME, LanguageName } from "./enums.ts";
import { lazyPick } from "@base";

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
    /** A two-letter language code following ISO 639-1 standard. */
    code: LanguageCodeSchema,
    /** The English name of the language. */
    name: LanguageNameSchema,
  })
  .or(LanguageCodeSchema.transform(lazyPick(LANGUAGE_BY_CODE)))
  .or(LanguageNameSchema.transform(lazyPick(LANGUAGE_BY_NAME)));
