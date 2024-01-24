import { z } from "@dependencies";

import { Model } from "@base";

import {
  LanguageCode,
  StringOrLanguageSchema,
  LocalizedText,
  TranslatableText,
} from "@localization";

import { AuthorSchema, DateSchema } from "./schemas.ts";

const TranslatableTextSchema = TranslatableText.schema.transform(
  Model.parseFromModel(TranslatableText),
);

/**
 * Represents the properties of a paragraph.
 */
export type ParagraphProperties = Model.Output<typeof Paragraph>;

/**
 * Represents the properties required for creating a new paragraph.
 */
export type ParagraphInput = Model.Input<typeof Paragraph>;

export interface Paragraph extends ParagraphProperties {}

/**
 * Represents a paragraph that may contain translations.
 */
export class Paragraph extends TranslatableText {
  static toSeal = ["index"];
  /**
   * The schema for validation and parsing of paragraph properties.
   */
  static override schema = TranslatableText.schema.extend({
    /**
     * The index of the paragraph within a chapter.
     */
    index: z.number().int().min(0),
  });
}

/**
 * Represents the properties of a chapter.
 */
export type ChapterProperties = Model.Output<typeof Chapter>;

/**
 * Represents the properties required for creating a new chapter.
 */
export type ChapterInput = Model.Input<typeof Chapter>;

export interface Chapter extends ChapterProperties {}

/**
 * Represents a chapter within a fanfiction.
 */
export class Chapter extends Model<typeof Chapter> {
  static toSeal = ["index"];

  /**
   * The Zod schema for the Chapter class, defining the structure of chapter data.
   */
  static schema = z.object({
    title: TranslatableTextSchema.nullable().default(null),
    summary: TranslatableTextSchema.nullable().default(null),
    index: z.number().int().min(0).default(0),
    paragraphs: z
      .array(Paragraph.schema.transform(Model.parseFromModel(Paragraph)))
      .default([]),
  });

  /**
   * Adds a paragraph to the chapter.
   *
   * The index of the paragraph is automatically set based on the current number of
   * paragraphs.
   *
   * @param paragraph - The paragraph instance or input object to add to the chapter.
   * @returns The instance of the Chapter for method chaining.
   */
  public addParagraph(paragraph: Paragraph | ParagraphInput) {
    paragraph.index = this.paragraphs.length;

    if (paragraph instanceof Paragraph) {
      this.paragraphs.push(paragraph);
    } else {
      this.paragraphs.push(Paragraph.parse(paragraph));
    }

    return this;
  }
}

/**
 * Represents the properties of a fanfiction.
 */
export type FanfictionProperties = Model.Output<typeof Fanfiction>;

/**
 * Represents the properties required for creating a new fanfiction.
 */
export type FanfictionInput = Model.Input<typeof Fanfiction>;

export interface Fanfiction extends FanfictionProperties {}

/**
 * Represents a fanfiction.
 */
export class Fanfiction extends Model<typeof Fanfiction> {
  static toSeal = ["created_at", "id", "origin_id"];
  static schema = z
    .object({
      /**
       * The details of the author of a fanfiction.
       */
      author: AuthorSchema,
      /**
       * The chapters of a fanfiction.
       */
      chapters: z
        .array(Chapter.schema.transform(Model.parseFromModel(Chapter)))
        .default([]),
      /**
       * Creation date of the fanfiction.
       *
       * **IMPORTANT**: This date is in reference to when the fanfiction was created in
       * one of this app repositories and not in its origin platform.
       */
      created_at: DateSchema.default(defaultDate),
      /**
       * The fandom that a fanfiction belongs to.
       */
      fandom: z.string(),
      /**
       * The unique identifier for the fanfiction.
       */
      id: z.string(),
      /**
       * The language that the fanfiction is written in.
       */
      language: StringOrLanguageSchema,
      /**
       * The unique identifier for the fanfiction from its original source.
       */
      origin_id: z.coerce.string().min(1),
      /**
       * The URL where the fanfiction originates from.
       */
      origin_url: z.string().url(),
      /**
       * The date when the fanfiction was published.
       */
      published_at: DateSchema,
      /**
       * The characters involved in the relationship described in the fanfiction.
       */
      relationship_characters: z.array(z.string().min(1)).default([]),
      /**
       * The characters involved in the relationship described in the fanfiction
       * represented as string splitted by a slash.
       *
       * @example
       *
       * `Tony Stark/Steve Rogers`
       *
       */
      relationship: z.string().default(""),
      /**
       * The source platform where this fanfiction originates from.
       */
      source: z.string().default(""),
      /**
       * The summary of the fanfiction as describe by its author.
       */
      summary: TranslatableTextSchema,
      /**
       * The title of the fanfiction.
       */
      title: TranslatableTextSchema,
      /**
       * The date when the fanfiction was last updated in this application's repositories.
       */
      updated_at: DateSchema.default(defaultDate),
    })
    .transform(addSource)
    .transform(setRelationship)
    .transform(fixAuthorLanguage);

  /**
   * Adds a chapter to the story's list of chapters.
   *
   * @param chapter - The chapter to add, either a Chapter instance or plain object.
   * @returns This Fanfiction instance for method chaining.
   */
  public addChapter(chapter: Chapter | ChapterInput) {
    chapter.index = this.chapters.length;

    if (chapter instanceof Chapter) {
      this.chapters.push(chapter);
    } else {
      this.chapters.push(Chapter.parse(chapter));
    }

    return this.triggerUpdate();
  }

  /**
   * Sets rich text formatting for all translatable text fields in this fanfiction model,
   * including the author name, summary, title, chapter titles and summaries, and
   * paragraph content.
   *
   * This allows text in multiple languages to be formatted appropriately for display,
   * e.g. with furigana or transliteration based on the language.
   */
  public async setRichTexts() {
    await setRichText(this.author.name);
    await setRichText(this.summary);
    await setRichText(this.title);

    for (const chapter of this.chapters) {
      await setRichText(chapter.title);
      await setRichText(chapter.summary);

      for (const paragraph of chapter.paragraphs) {
        await setRichText(paragraph);
      }
    }

    return this.triggerUpdate();
  }

  /**
   * Triggers an update of the fanfiction's `updated_at` timestamp.
   *
   * @returns This Fanfiction instance to allow method chaining.
   */
  public triggerUpdate() {
    this.updated_at = new Date();

    return this;
  }
}

function addSource<T extends { source?: string; origin_url: string }>(value: T) {
  if (!value.source) {
    value.source = new URL(value.origin_url).hostname;
  }

  return value;
}

function setRelationship<
  T extends { relationship_characters: string[]; relationship?: string },
>(value: T) {
  if (value.relationship_characters.length > 0) {
    value.relationship = value.relationship_characters.join("/");
  }

  return value;
}

function fixAuthorLanguage<
  T extends { author: { name: LocalizedText }; language: { code: LanguageCode } },
>(value: T) {
  if (value.author.name.language.code === LanguageCode.XX) {
    value.author.name.updateLanguage(value.language.code);
  }

  return value;
}

function defaultDate() {
  return new Date();
}

async function setRichText(value: TranslatableText | LocalizedText | null) {
  if (value === null) return;

  if (value instanceof TranslatableText) {
    await value.original.setRichText();

    return;
  }

  return await value.setRichText();
}
