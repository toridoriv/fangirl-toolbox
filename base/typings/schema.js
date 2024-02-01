/**
 * Schema related utility types.
 *
 * @namespace Schema
 */
export {};

/**
 * Any possible schema.
 *
 * @memberof Schema
 * @typedef {import("zod").ZodTypeAny} AnySchema
 */

/**
 * Obtains the required type for parsing a schema successfully.
 *
 * @memberof Schema
 * @template {AnySchema} S
 * @typedef {import("zod").input<S>} Input
 */

/**
 * Obtains the result of parsing a value.
 *
 * @memberof Schema
 * @template {AnySchema} S
 * @typedef {import("zod").output<S>} Output
 */

/**
 * Describes a custom schema.
 *
 * @memberof Schema
 * @template T
 * @typedef {import("zod").ZodType<T, import("zod").ZodTypeDef, T>} Custom
 */

/**
 * Obtains the input or output type for the given schema S.
 * Allows specifying the kind to be either `Input` or `Output`.
 * Defaults to `Input`.
 *
 * @memberof Schema
 * @template {AnySchema} S
 * @template {keyof Value<S>} [Kind="Input"]
 * @typedef {Value<S>[Kind]} Infer
 */

/**
 * Input and output types for a schema.
 *
 * @memberof Schema
 * @template {AnySchema} S
 * @namespace Value
 * @typedef {object} Value
 * @property {Input<S>} Input
 * @property {Output<S>} Output
 */
