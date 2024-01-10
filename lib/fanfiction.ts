import { z } from "zod";
import { LanguageSchema, LocalizedText, TranslatedText } from "./localization.ts";
import { md5, uuid } from "./crypto.ts";
import { BaseModel } from "./helpers.ts";

const TranslatableTextSchema = TranslatedText.schema.transform(
  BaseModel.parseFromModel(TranslatedText),
);

/**
 * Represents the properties of a paragraph.
 */
export type ParagraphProperties = z.output<typeof Paragraph.schema>;

/**
 * Represents the properties required for creating a new paragraph.
 */
export type ParagraphInput = z.input<typeof Paragraph.schema>;

export interface Paragraph extends ParagraphProperties {}

/**
 * Represents a paragraph that may contain translations.
 */
export class Paragraph extends TranslatedText {
  /**
   * The schema for validation and parsing of paragraph properties.
   */
  static override schema = TranslatedText.schema.extend({
    /**
     * The index of the paragraph within a chapter.
     */
    index: z.number().int().min(0),
    /**
     * A hash representing the content of the paragraph for quick comparison
     * and validation purposes.
     */
    hash: z.string().default(""),
  });

  /**
   * Creates a new instance of the Paragraph class with the given properties.
   *
   * @param properties - The input properties for the paragraph.
   */
  constructor(properties: ParagraphInput) {
    super(properties);

    if (!this.hash) {
      this.hash = md5(this.original.raw);
    }
  }
}

/**
 * Represents the properties of a chapter.
 */
export type ChapterProperties = z.output<typeof Chapter.schema>;

/**
 * Represents the properties required for creating a new chapter.
 */
export type ChapterInput = z.input<typeof Chapter.schema>;

export interface Chapter extends ChapterProperties {}

/**
 * Represents a chapter within a fanfiction.
 */
export class Chapter extends BaseModel<typeof Chapter> {
  /**
   * The Zod schema for the Chapter class, defining the structure of chapter data.
   */
  static schema = z.object({
    title: TranslatableTextSchema.nullable().default(null),
    index: z.number().int().min(0).default(0),
    paragraphs: z
      .array(Paragraph.schema.transform(BaseModel.parseFromModel(Paragraph)))
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
  addParagraph(paragraph: Paragraph | ParagraphInput) {
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
 * Represents the properties of an author.
 */
export type AuthorProperties = z.output<typeof Author.schema>;

/**
 * Represents the properties required for creating a new author.
 */
export type AuthorInput = z.input<typeof Author.schema>;

export interface Author extends AuthorProperties {}

/**
 * Represents an author.
 */
export class Author extends BaseModel<typeof Author> {
  /**
   * The schema that defines the shape of the Author model.
   */
  static schema = z.object({
    name: LocalizedText.schema.transform(BaseModel.parseFromModel(LocalizedText)),
    profile_url: z.string().url().nullable().default(null),
  });
}

/**
 * Represents the properties of a fanfiction.
 */
export type FanfictionProperties = z.output<typeof Fanfiction.schema>;

/**
 * Represents the properties required for creating a new fanfiction.
 */
export type FanfictionInput = z.input<typeof Fanfiction.schema>;

export interface Fanfiction extends FanfictionProperties {}

/**
 * Represents a fanfiction.
 */
export class Fanfiction extends BaseModel<typeof Fanfiction> {
  /**
   * The schema that defines the shape of the Fanfiction model.
   * Contains properties for author, chapters, metadata fields, etc.
   */
  static schema = z
    .object({
      author: Author.schema.transform(BaseModel.parseFromModel(Author)),
      chapters: z
        .array(Chapter.schema.transform(BaseModel.parseFromModel(Chapter)))
        .default([]),
      created_at: z.coerce.date(),
      fandom: z.string(),
      id: z.string().uuid().default(uuid),
      language: LanguageSchema,
      origin_id: z.coerce.string().min(1),
      origin_url: z.string().url(),
      published_at: z.coerce.date(),
      relationship_characters: z.array(z.string().min(1)).default([]),
      relationship: z.string().default(""),
      source: z.string().default(""),
      summary: TranslatableTextSchema,
      title: TranslatableTextSchema,
      updated_at: z.coerce.date(),
    })
    .transform(addSource)
    .transform(setRelationship);

  /**
   * Adds a chapter to the story's list of chapters.
   *
   * @param chapter - The chapter to add, either a Chapter instance or plain object.
   * @returns This Fanfiction instance for method chaining.
   */
  addChapter(chapter: Chapter | ChapterInput) {
    chapter.index = this.chapters.length;

    if (chapter instanceof Chapter) {
      this.chapters.push(chapter);
    } else {
      this.chapters.push(Chapter.parse(chapter));
    }

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
