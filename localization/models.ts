import { eld, z } from "@dependencies";
import { LanguageSchema } from "./schemas.ts";
import { RichTextByLanguageCode } from "./utils.ts";
import { Model } from "@base";

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
      language: eld.detect(value).language,
    });
  }

  /**
   * Sets the rich text value for the LocalizedText object.
   *
   * @returns The modified LocalizedText object.
   */
  public async setRichText() {
    this.rich = await RichTextByLanguageCode[this.language.code](this.raw);

    return this;
  }
}
