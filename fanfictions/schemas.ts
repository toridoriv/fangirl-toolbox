import { z } from "@dependencies";

import { LocalizedTextModelSchema } from "@localization";

/**
 * Schema for author data.
 * Defines the shape of an author object with a localized name and optional profile URL.
 */
export const AuthorSchema = z.object({
  name: LocalizedTextModelSchema,
  profile_url: z.string().url().nullable().default(null),
});

/**
 * Defines a Zod schema for date values.
 *
 * Accepts a string, number or Date object. Transforms the value into a Date object.
 */
export const DateSchema = z.string().or(z.number()).or(z.date()).transform(parseDate);

function parseDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value);
}
