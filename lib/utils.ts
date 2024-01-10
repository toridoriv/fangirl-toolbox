/**
 * Recursively expands the properties of a type.
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * Recursively expands the properties of a type T if T is an object type.
 */
export type ExpandRecursively<T, Unless = never> = T extends Unless
  ? T
  : {
      [K in keyof T]: ExpandRecursively<T[K], Unless>;
    };
