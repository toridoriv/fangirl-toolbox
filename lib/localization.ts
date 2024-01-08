import { z } from "zod";
import { BaseModel } from "./utils.ts";

/**
 * Language class represents a language with code, name and native name.
 * It has two static methods to create a Language instance from code or name.
 */
export class Language<
  Code extends string = string,
  Name extends string = string
> {
  /**
   * Gets a Language instance by its language code.
   *
   * @param code - The language code.
   * @returns The Language instance for the given code, or a new Language instance with default values if not found.
   */
  declare static fromCode: <Code extends string>(
    code: Code
  ) => Code extends LanguageCode ? GetLanguageByCode<Code> : Language<Code>;

  /**
   * Gets a Language instance by language name.
   *
   * @param name - The language name
   * @returns The Language instance for the given name if found, otherwise a new Language instance with the name set
   */
  declare static fromName: <Name extends string>(
    name: Name
  ) => Name extends LanguageName
    ? GetLanguageByName<Name>
    : Language<string, Name>;

  /**
   * Creates a new `Language` object.
   *
   * @param code - The language code.
   * @param name - The language name.
   * @param native_name - The language's name in its native script.
   */
  constructor(
    readonly code: Code,
    readonly name: Name,
    readonly native_name: string
  ) {}
}

/**
 * Resolves to the appropriate language type based on the input type (code or name).
 */
export type GetLanguage<T extends string> = T extends LanguageCode
  ? GetLanguageByCode<T>
  : T extends LanguageName
  ? GetLanguageByName<T>
  : Language;

/**
 * Object containing `Language` instances indexed by their language codes.
 */
export const LANGUAGE_BY_CODE = Object.freeze({
  en: new Language("en", "English", "English"),
  es: new Language("es", "Spanish", "Español"),
  fr: new Language("fr", "French", "Français"),
  it: new Language("it", "Italian", "Italiano"),
  ja: new Language("ja", "Japanese", "日本語"),
  ko: new Language("ko", "Korean", "한국어"),
  pt: new Language("pt", "Portuguese", "Português"),
  ru: new Language("ru", "Russian", "Русский"),
  th: new Language("th", "Thai", "ไทย"),
  zh: new Language("zh", "Chinese", "中文"),
});

/**
 * Union of all available language codes.
 */
export type LanguageCode = keyof typeof LANGUAGE_BY_CODE;

/**
 * Resolves to the specific language type based on the input language code.
 */
export type GetLanguageByCode<C extends LanguageCode> =
  (typeof LANGUAGE_BY_CODE)[C];

/**
 * Object containing `Language` instances indexed by their language names.
 */
export const LANGUAGE_BY_NAME = Object.freeze({
  [LANGUAGE_BY_CODE.en.name]: LANGUAGE_BY_CODE.en,
  [LANGUAGE_BY_CODE.es.name]: LANGUAGE_BY_CODE.es,
  [LANGUAGE_BY_CODE.fr.name]: LANGUAGE_BY_CODE.fr,
  [LANGUAGE_BY_CODE.it.name]: LANGUAGE_BY_CODE.it,
  [LANGUAGE_BY_CODE.ja.name]: LANGUAGE_BY_CODE.ja,
  [LANGUAGE_BY_CODE.ko.name]: LANGUAGE_BY_CODE.ko,
  [LANGUAGE_BY_CODE.pt.name]: LANGUAGE_BY_CODE.pt,
  [LANGUAGE_BY_CODE.ru.name]: LANGUAGE_BY_CODE.ru,
  [LANGUAGE_BY_CODE.th.name]: LANGUAGE_BY_CODE.th,
  [LANGUAGE_BY_CODE.zh.name]: LANGUAGE_BY_CODE.zh,
});

/**
 * Union of all language names.
 */
export type LanguageName = keyof typeof LANGUAGE_BY_NAME;

/**
 * Resolves to the language code based on the input language name.
 */
export type GetLanguageByName<N extends LanguageName> =
  keyof (typeof LANGUAGE_BY_NAME)[N];

Language.fromCode = function fromCode(code) {
  return code in LANGUAGE_BY_CODE
    ? LANGUAGE_BY_CODE[code as LanguageCode]
    : new Language(code, "", "");
};

Language.fromName = function fromName(name) {
  return name in LANGUAGE_BY_NAME
    ? LANGUAGE_BY_NAME[name as LanguageName]
    : new Language("", name, "");
};

/**
 * Schema for representing language codes. When parsing, it
 * transforms the received code into a `Language` object.
 */
export const LanguageCodeSchema = z
  .string()
  .min(2)
  .max(2)
  .transform(Language.fromCode);

/**
 * Schema for representing language names. When parsing, it
 * transforms the received name into a `Language` object.
 */
export const LanguageNameSchema = z
  .string()
  .min(3)
  .transform((a) => Language.fromName(a));

/**
 * Defines a schema for language objects.
 *
 * The schema enforces the structure of the language object and provides a transformation
 * to an instance of the `Language` class.
 */
export const LanguageObjectSchema = z
  .object({
    /** A two-letter language code following ISO 639-1 standard. */
    code: z.string().max(2),
    /** The English name of the language. */
    name: z.string().min(1),
    /**
     * The name of the language in its native script or format.
     * It defaults to an empty string if not provided.
     */
    native_name: z.string().default(""),
  })
  .transform((v) => new Language(v.code, v.name, v.native_name));

/**
 * Union schema for representing either language codes or language names.
 * When parsing, it transforms the received value into a `Language` object.
 */
export const LanguageSchema = z.union([
  LanguageCodeSchema,
  LanguageNameSchema,
  LanguageObjectSchema,
]);

/**
 * Type definition for the properties of a LocalizedText object.
 */
export type LocalizedTextProperties = z.output<typeof LocalizedText.schema>;

/**
 * Type definition for the input properties when creating a LocalizedText object.
 */
export type LocalizedTextInput = z.input<typeof LocalizedText.schema>;

export interface LocalizedText extends LocalizedTextProperties {}

/**
 * Class representing a localized text.
 * It enforces a specific structure for the text, including raw text,
 * rich text, and language information.
 */
export class LocalizedText extends BaseModel<typeof LocalizedText> {
  /**
   * Zod schema for LocalizedText objects.
   * It defines the structure of a LocalizedText object.
   */
  static schema = z.object({
    raw: z.string().min(1).trim(),
    rich: z.string().trim().default(""),
    language: LanguageSchema,
  });

  /**
   * Sets the rich text value for the LocalizedText object.
   *
   * @param value - The rich text value to be set.
   * @returns The modified LocalizedText object.
   */
  public setRichText(value: string) {
    this.rich = LocalizedText.schema.shape.rich.parse(value);

    return this;
  }
}

/**
 * Type definition for the properties of a TranslatedText object.
 */
export type TranslatedTextProperties = z.output<typeof TranslatedText.schema>;

/**
 * Type definition for the input properties when creating a TranslatedText object.
 */
export type TranslatedTextInput = z.input<typeof TranslatedText.schema>;

export interface TranslatedText extends TranslatedTextProperties {}

/**
 * Class representing a translated text.
 * It enforces a specific structure for the original text and an array of translations.
 */
export class TranslatedText extends BaseModel<typeof TranslatedText> {
  /**
   * Zod schema for TranslatedText objects.
   */
  static schema = z.object({
    original: LocalizedText.schema.transform(
      BaseModel.parseFromModel(LocalizedText)
    ),
    translations: z
      .array(
        LocalizedText.schema.transform(BaseModel.parseFromModel(LocalizedText))
      )
      .default([]),
  });

  /**
   * Gets a translation by language code.
   *
   * @param code - The language code to look for.
   * @returns The translated text or null if not found.
   */
  public getTranslationByCode(code: LanguageCode) {
    const result = this.translations.find(
      (translation) => translation.language.code === code
    );

    return result || null;
  }

  /**
   * Gets a translation by language name.
   *
   * @param name - The language name to look for.
   * @returns The translated text or null if not found.
   */
  public getTranslationByName(name: LanguageName) {
    const result = this.translations.find(
      (translation) => translation.language.name === name
    );

    return result || null;
  }
}
