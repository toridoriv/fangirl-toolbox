/**
 * Common utility types.
 *
 * @namespace Common
 */
export {};

/**
 * Union type that describes either a value or a promise that resolves to that value.
 *
 * @memberof Common
 * @template T
 * @typedef {T | Promise<T>} MaybePromise
 */

/**
 * Takes a union type `U` and returns the intersection of the types in `U`.
 *
 * @memberof Common
 * @template U
 * @typedef {(U extends any ? (k: U) => void : never) extends (
 * k: infer I
 * ) => void
 * ? I
 * : never} UnionToIntersection
 */

/**
 * Determines whether the type `T` is a union type.
 *
 * @memberof Common
 * @template T
 * @typedef {[T] extends [UnionToIntersection<T>] ? false : true} IsUnion
 */

/**
 * Transforms an union type `U` into a function overload type.
 *
 * @memberof Common
 * @template U
 * @typedef {UnionToIntersection<U extends any ? (f: U) => void : never>} UnionToOverload
 */

/**
 * Extracts the first union member from a union type `U`.
 * Returns the extracted member if `U` is a union type, otherwise returns `never`.
 *
 * @memberof Common
 * @template U
 * @typedef {UnionToOverload<U> extends (a: infer A) => void ? A : never} PopUnion
 */

/**
 * Transforms a union type `U` into a tuple type, with the first element being the first
 * member of the union. If `U` is not a union type, returns a tuple type with `U` as the
 * first element.
 *
 * @memberof Common
 * @template T
 * @template {any[]} [A=[]]
 * @typedef {IsUnion<T> extends true
 *     ? UnionToTuple<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
 *     : [T, ...A]} UnionToTuple
 */
