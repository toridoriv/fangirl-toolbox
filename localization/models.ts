import { eld, z } from "@dependencies";

import { Model } from "@base";

import { LanguageCode, LanguageName } from "./enums.ts";
import { LanguageSchema } from "./schemas.ts";
import { RichTextByLanguageCode } from "./utils.ts";

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
export class LocalizedText extends Model<typeof LocalizedText> {
  /**
   * Main schema for parsing `LocalizedText` instances.
   */
  static schema = z.object({
    /**
     * Non-empty text value.
     */
    raw: z.string().min(1).trim(),
    /**
     * The rich text representation of the localized text.
     */
    rich: z.string().trim().default(""),
    /**
     * The language schema to validate the language field.
     */
    language: LanguageSchema,
  });

  /**
   * Creates a new `LocalizedText` instance from a string value.
   *
   * @param value - The raw text value.
   * @returns The created `LocalizedText` instance.
   */
  static fromString(value: string) {
    return new LocalizedText({
      raw: value,
      language: eld.detect(value).language || LanguageCode.XX,
    });
  }

  /**
   * Sets the rich text value for the LocalizedText object.
   *
   * @returns The modified LocalizedText object.
   */
  public async setRichText() {
    if (!this.rich) {
      this.rich = await RichTextByLanguageCode[this.language.code](this.raw);
    }

    return this;
  }

  /**
   * Updates the language code for this localized text.
   *
   * @param code - The new language code.
   * @returns This LocalizedText instance.
   */
  public updateLanguage(language: LanguageCode | LanguageName) {
    this.language = LanguageSchema.parse(language);

    return this;
  }
}

export const LocalizedTextModelSchema = z
  .string()
  .min(1)
  .trim()
  .transform(LocalizedText.fromString)
  .or(LocalizedText.schema.transform(Model.parseFromModel(LocalizedText)));

/**
 * Type definition for the properties of a TranslatedText object.
 */
export type TranslatableTextProperties = z.output<typeof TranslatableText.schema>;

/**
 * Type definition for the input properties when creating a TranslatableText object.
 */
export type TranslatableTextInput = z.input<typeof TranslatableText.schema>;

export interface TranslatableText extends TranslatableTextProperties {}

export class TranslatableText extends Model<typeof TranslatableText> {
  static schema = z.object({
    original: LocalizedTextModelSchema,
    translations: z.array(LocalizedTextModelSchema).default([]),
  });

  static fromString(value: string) {
    return new TranslatableText({
      original: value,
    });
  }

  /**
   * Adds a translation to the translations array.
   *
   * @param translation - The translation to add, either as a LocalizedTextInput or a
   *                    LocalizedText instance.
   * @returns This `TranslatableText` instance for method chaining.
   */
  public addTranslation(translation: LocalizedTextInput | LocalizedText) {
    if (translation instanceof LocalizedText) {
      this.translations.push(translation);
    } else {
      this.translations.push(new LocalizedText(translation));
    }

    return this;
  }

  /**
   * Gets a translation by language code.
   *
   * @param code - The language code to look for.
   * @returns The translated text or null if not found.
   */
  public getTranslationByCode(code: LanguageCode) {
    const result = this.translations.find(
      (translation) => translation.language.code === code,
    );

    return result || null;
  }

  /**
   * Gets all translations with the given language code.
   *
   * @param code - The language code to filter by.
   * @returns An array of translations with the matching language code.
   */
  public getTranslationsByCode(code: LanguageCode) {
    const result = this.translations.filter(
      (translation) => translation.language.code === code,
    );

    return result;
  }

  /**
   * Gets a translation by language name.
   *
   * @param name - The language name to look for.
   * @returns The translated text or null if not found.
   */
  public getTranslationByName(name: LanguageName) {
    const result = this.translations.find(
      (translation) => translation.language.name === name,
    );

    return result || null;
  }

  /**
   * Gets all translations with the given language name.
   *
   * @param name - The language name to filter by.
   * @returns An array of translations with the matching language name.
   */
  public getTranslationsByName(name: LanguageName) {
    const result = this.translations.filter(
      (translation) => translation.language.name === name,
    );

    return result;
  }
}
