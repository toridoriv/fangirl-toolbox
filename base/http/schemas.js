import { z } from "zod";

/** @type {Schema.Custom<Http.RequestInterceptor>} */
export const RequestInterceptorSchema = z.custom(
  validateInterceptor,
  "A request interceptor must be a function that receives at least one argument.",
);

/** @type {Schema.Custom<Http.ResponseInterceptor>} */
export const ResponseInterceptorSchema = z.custom(
  validateInterceptor,
  "A response interceptor must be a function that receives at least one argument.",
);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function validateInterceptor(value) {
  return typeof value === "function" && value.length > 0;
}

export const InterceptorsSchema = z.object({
  request: z.array(RequestInterceptorSchema).default([]),
  response: z.array(ResponseInterceptorSchema).default([]),
});

/** @typedef {Schema.Input<typeof InterceptorsSchema>} InterceptorsInput */

/** @typedef {Schema.Output<typeof InterceptorsSchema>} InterceptorsOutput */

export const RequestInitSchema = z.object({
  /**
   * A string indicating how the request will interact with the browser's cache to set
   * request's cache.
   */
  cache: z
    .enum(["default", "force-cache", "no-cache", "no-store", "only-if-cached", "reload"])
    .default("no-cache"),
  /**
   * A string indicating whether credentials will be sent with the request always,
   * never, or only when sent to a same-origin URL. Sets request's credentials.
   */
  credentials: z.enum(["include", "omit", "same-origin"]).optional(),
  /**
   * A Headers object, an object literal, or an array of two-item arrays to set request's
   * headers.
   */
  headers: z
    .instanceof(Headers)
    .or(
      z.record(z.string()).transform(function createHeaders(value) {
        return new Headers(value);
      }),
    )
    .optional(),
  /**
   * A cryptographic hash of the resource to be fetched by request. Sets request's
   * integrity.
   */
  integrity: z.string().optional(),
  /** A boolean to set request's keepalive. */
  keepalive: z.boolean().default(false),
  /**
   * A string to indicate whether the request will use CORS, or will be restricted to
   * same-origin URLs. Sets request's mode.
   */
  mode: z.enum(["same-origin", "cors", "navigate", "no-cors"]).default("no-cors"),
  /**
   * A string indicating whether request follows redirects, results in an error upon
   * encountering a redirect, or returns the redirect (in an opaque fashion). Sets
   * request's redirect.
   */
  redirect: z.enum(["error", "follow", "manual"]).default("follow"),
  /**
   * A string whose value is a same-origin URL, "about:client", or the empty string, to
   * set request's referrer.
   */
  referrer: z.string().default(""),
  /** A referrer policy to set request's referrerPolicy. */
  referrerPolicy: z
    .enum([
      "",
      "same-origin",
      "no-referrer",
      "no-referrer-when-downgrade",
      "origin",
      "origin-when-cross-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
      "unsafe-url",
    ])
    .default(""),
  /** An AbortSignal to set request's signal. */
  signal: z.instanceof(AbortSignal).optional(),
  /** The origin URL of the request. */
  origin: z
    .string()
    .url()
    .transform(function cleanUrl(value) {
      if (value.endsWith("/")) {
        return value.substring(0, value.length - 1);
      }

      return value;
    })
    .optional(),
  /** The path of the URL to make the request to. */
  path: z.string().startsWith("/").default("/"),
  interceptors: InterceptorsSchema.default({ request: [], response: [] }),
});

/** @typedef {Schema.Input<typeof RequestInitSchema>} RequestInitInput */

/** @typedef {Schema.Output<typeof RequestInitSchema>} RequestInitOutput */

export const SharedRequestSchema = RequestInitSchema.extend({
  /** The origin URL of the request. */
  origin: z
    .string()
    .url()
    .transform(function cleanUrl(value) {
      if (value.endsWith("/")) {
        return value.substring(0, value.length - 1);
      }

      return value;
    }),
  /** The path of the URL to make the request to. */
  path: z.string().startsWith("/").default("/"),
});

/** @typedef {Schema.Input<typeof SharedRequestSchema>} SharedRequestInput */

/** @typedef {Schema.Output<typeof SharedRequestSchema>} SharedRequestOutput */

/**
 * Schema for a request configuration without a request body.
 * Extends {@link SharedRequestSchema}.
 */
export const NoBodyRequestSchema = SharedRequestSchema.extend({
  /** A String indicating the method of the request. */
  method: z.enum([
    "get",
    "GET",
    "head",
    "HEAD",
    "options",
    "OPTIONS",
    "trace",
    "TRACE",
    "connect",
    "CONNECT",
    "delete",
    "DELETE",
  ]),
});

/** @typedef {Schema.Input<typeof NoBodyRequestSchema>} NoBodyRequestInput */

/** @typedef {Schema.Output<typeof NoBodyRequestSchema>} NoBodyRequestOutput */

/**
 * Schema for a request configuration with a request body.
 * Extends {@link SharedRequestSchema}.
 */
export const WithBodyRequestSchema = SharedRequestSchema.extend({
  /** A String indicating the method of the request. */
  method: z.enum(["post", "POST", "put", "PUT", "patch", "PATCH"]),
  /** A BodyInit object or null to set request's body. */
  body: z
    .instanceof(Blob)
    .or(z.instanceof(ArrayBuffer))
    .or(z.instanceof(FormData))
    .or(z.instanceof(URLSearchParams))
    .or(z.string())
    .or(
      z
        .object({})
        .passthrough()
        .transform(function stringifyBody(value) {
          return JSON.stringify(value);
        }),
    )
    .optional(),
});

/** @typedef {Schema.Input<typeof WithBodyRequestSchema>} WithBodyRequestInput */

/** @typedef {Schema.Output<typeof WithBodyRequestSchema>} WithBodyRequestOutput */

/** Schema for a request configuration which can be either with or without a body. */
export const RequestSchema = z.discriminatedUnion("method", [
  NoBodyRequestSchema,
  WithBodyRequestSchema,
]);

/** @typedef {Schema.Input<typeof RequestSchema>} RequestInput */

/** @typedef {Schema.Output<typeof RequestSchema>} RequestOutput */

/**
 * Set of models with different capabilities and price points.
 *
 * @see {@link https://platform.openai.com/docs/models Models} for more information.
 */
export const OpenAiModelSchema = z.enum([
  "gpt-4",
  "gpt-4-1106-preview",
  "gpt-4-vision-preview",
  "gpt-4-32k",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo",
]);

export const ChatCompletionMessageSchema = z.object({
  /** The role of the message author. */
  role: z.enum(["system", "user"]),
  /** The contents of the message. */
  content: z.string().min(1).trim(),
  /**
   * An optional name for the participant. Provides the model information to differentiate
   * between participants of the same role.
   */
  name: z.string().optional(),
});

/** @typedef {Schema.Input<typeof ChatCompletionMessageSchema>} ChatCompletionMessageInput */

/**
 * @typedef {Schema.Output<typeof ChatCompletionMessageSchema>}
 * ChatCompletionMessageOutput
 */

export const ChatCompletionPayloadSchema = z.object({
  /**
   * ID of the model to use. By default this client uses `gpt-3.5-turbo-16k`.
   *
   * @see {@link https://platform.openai.com/docs/models/model-endpoint-compatibility Model endpoint compatibility}
   */
  model: OpenAiModelSchema.default("gpt-3.5-turbo-16k"),
  /** A list of messages comprising the conversation so far. */
  messages: z.array(ChatCompletionMessageSchema),
  /**
   * Sampling temperature to use, between `0` and `2`. Higher values like `0.8` will make
   * the output more random, while lower values like `0.2` will make it more focused and
   * deterministic.
   */
  temperature: z.number().min(0).max(2).default(1),
  /**
   * How many chat completion choices to generate for each input message. Note that you
   * will be charged based on the number of generated tokens across all of the choices.
   */
  n: z.number().default(1),
  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on their
   * existing frequency in the text so far, decreasing the model's likelihood to repeat
   * the same line verbatim.
   *
   * @see {@link https://platform.openai.com/docs/guides/text-generation/parameter-details}
   */
  frequency_penalty: z.number().optional(),
  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on whether
   * they appear in the text so far, increasing the model's likelihood to talk about new
   * topics.
   *
   * @see {@link https://platform.openai.com/docs/guides/text-generation/parameter-details More}
   */
  presence_penalty: z.number().optional(),
});

/** @typedef {Schema.Input<typeof ChatCompletionPayloadSchema>} ChatCompletionPayloadInput */

/**
 * @typedef {Schema.Output<typeof ChatCompletionPayloadSchema>}
 * ChatCompletionPayloadOutput
 */
