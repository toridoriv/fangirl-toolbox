import { toolkit } from "@dependencies";

declare global {
  function structuredClone<T = SafeAny>(
    value: T,
    options?: StructuredSerializeOptions,
  ): T;

  /**
   * Recursively expands the properties of a type.
   */
  export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

  /**
   * Recursively expands the properties of a type T if T is an object type.
   */
  export type ExpandRecursively<T, Unless = Native> = T extends Unless
    ? T
    : {
        [K in keyof T]: ExpandRecursively<T[K], Unless>;
      };

  /**
   * Type alias for a JSON object.
   */
  export type JsonObject = { [key: PropertyKey]: JsonValue };

  /**
   * Type alias for values that can be serialized to JSON.
   * Includes primitive JSON types as well as arrays and objects.
   */
  export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;

  /**
   * Instead of adding a `disable` directive, use this value to indicate that an any type
   * is expected that way purposely.
   */
  // deno-lint-ignore no-explicit-any
  export type SafeAny = any;

  /**
   * Type alias for arrays that can contain any value.
   */
  export type AnyArray = Array<SafeAny>;

  /**
   * Constructs a new type from type T where the properties in R are made required.
   * All other properties remain unchanged from T.
   */
  export type SetRequired<T, R extends keyof T> = Required<Pick<T, R>> & Omit<T, R>;

  /**
   * Converts a type T to a mapped object type with the same properties.
   */
  export type ToObject<T> = {
    [K in keyof T]: T[K];
  };

  /**
   * Makes all properties in T optional and nested objects recursively partial.
   * Useful for partial update objects in PUT requests.
   */
  export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };

  /**
   * Type guard to check if a type T is an object type (not array, primitive, etc).
   */
  export type IsObject<T> = T extends AnyArray
    ? false
    : T extends Native
    ? false
    : T extends Record<PropertyKey, SafeAny>
    ? true
    : false;

  /**
   * Type alias for native browser types and objects.
   */
  export type Native =
    | toolkit.Primitive
    | URL
    // deno-lint-ignore ban-types
    | Function
    | Headers
    | Iterable<SafeAny>
    | BodyInit
    | AbortSignal
    | Date;

  /**
   * Merge properties from two object types T and U into a new object type.
   * For keys that exist in both T and U, recursively merge if the value types are
   * objects.
   * Otherwise take the value type from U if the key exists in U, or from T if only in T.
   */
  export type Merge<T, U> = Expand<{
    [K in keyof T | keyof U]: K extends keyof U
      ? K extends keyof T
        ? IsObject<U[K]> extends true
          ? IsObject<T[K]> extends true
            ? Merge<U[K], T[K]>
            : U[K]
          : U[K]
        : U[K]
      : K extends keyof T
        ? T[K]
        : never;
  }>;

  /**
   * Excludes the first element from a tuple type.
   *
   * @example
   *
   * ```typescript
   * type A = ExcludeFirstFromList<[1, 2, 3]>; // [2, 3]
   * ```
   *
   */
  export type ExcludeFirstFromList<T> = T extends [infer F, ...infer Rest]
    ? Rest
    : unknown[];

  /**
   * Constructs a new type with the properties in K set to optional.
   * All other properties are required.
   */
  export type SetPartial<T, K extends keyof T> = Expand<Partial<Pick<T, K>> & Omit<T, K>>;

  /**
   * Gets the common keys between two types T and U.
   */
  export type GetCommonKeys<
    T,
    U,
    KeysOfU = toolkit.UnionToTuple<keyof U>,
    Cache extends AnyArray = [],
  > = KeysOfU extends []
    ? Cache
    : KeysOfU extends [infer F, ...infer R]
      ? F extends keyof T
        ? GetCommonKeys<T, U, R, [...Cache, F]>
        : GetCommonKeys<T, U, R, Cache>
      : never;

  /**
   * Constructs a new type with the properties in C set to optional.
   * All other properties remain unchanged.
   */
  export type PartialDiff<T, U, C extends (keyof T)[] = GetCommonKeys<T, U>> = SetPartial<
    T,
    C[number]
  >;
}
