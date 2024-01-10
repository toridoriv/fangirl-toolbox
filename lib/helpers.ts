import { z } from "zod";

export function parse<S extends z.ZodTypeAny>(schema: S, value: z.input<S>) {
  return schema.parse(value);
}

/**
 * Represents the constructor of a base model.
 */
export interface BaseModelConstructor {
  /** The prototype of the model class. */
  // deno-lint-ignore no-explicit-any
  prototype: any;
  /** The Zod schema used to validate the model. */
  schema: z.ZodTypeAny;
}

/**
 * Gets all non-method properties from an object type.
 */
export type GetNonMethodProperties<T> = {
  [K in keyof T as T[K] extends CallableFunction | BaseModelConstructor
    ? never
    : K]: T[K];
};

/**
 * Gets the properties required to construct an instance of the model `T`.
 */
export type GetModelProperties<T extends BaseModelConstructor> = z.input<
  T["schema"]
>;

/**
 * Gets the prototype property of the BaseModelConstructor to be the instance type.
 */
export type ModelInstance<T extends BaseModelConstructor> = T["prototype"];

/**
 * Abstract base class for models with validation via Zod schemas.
 */
export abstract class BaseModel<C extends BaseModelConstructor> {
  // deno-lint-ignore no-explicit-any
  declare static schema: any;

  /**
   * Parses model properties and returns a new instance of the model.
   *
   * @param this       - The model constructor.
   * @param properties - The properties to parse.
   * @returns A new instance of the model with the parsed properties.
   */
  // deno-lint-ignore no-explicit-any
  static parse<T extends BaseModelConstructor = any>(
    this: T,
    properties: GetModelProperties<T>
  ): ModelInstance<T> {
    // @ts-ignore: ¯\_(ツ)_/¯
    return new this(properties);
  }

  /**
   * Binds the parse method from the provided model constructor to return a function that
   * parses properties into a model instance.
   *
   * @param model - The model constructor whose parse method to bind.
   * @returns A function that parses properties into a model instance.
   */
  static parseFromModel<T extends typeof BaseModel, P>(model: T) {
    return model.parse.bind(model) as (properties: P) => ModelInstance<T>;
  }

  declare ["constructor"]: C;

  /**
   * Constructs a new instance of the model by parsing the given properties using the
   * schema defined on the model class.
   * Assigns the parsed properties to the instance.
   *
   * @param properties - The properties to parse and assign to the instance.
   */
  constructor(properties: z.input<C["schema"]>) {
    Object.assign(this, this.constructor.schema.parse(properties));
  }

  /**
   * Checks if this instance is valid.
   *
   * @returns `true` if the object is valid, `false` otherwise.
   */
  isValid() {
    return this.constructor.schema.safeParse(this).success;
  }

  /**
   * Validates this instance.
   *
   * @returns This instance.
   * @throws {z.ZodError}
   */
  validate() {
    this.constructor.schema.parse(this);

    return this;
  }
}
