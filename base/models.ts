import { z } from "@dependencies";

import { getZodSchemaShape } from "../fanfictions/utils.ts";

export namespace Model {
  /**
   * Represents the constructor of a base model.
   */
  export type Constructor<T> = T extends Generic
    ? new (properties: Input<T>) => Instance<T>
    : SafeAny;

  /**
   * Gets the properties required to construct an instance of the model `T`.
   */
  export type Input<T> = T extends Generic ? z.input<T["schema"]> : never;

  /**
   * Gets the output properties from validating against the model schema.
   */
  export type Output<T> = T extends Generic ? z.output<T["schema"]> : never;

  /**
   * Type alias for a generic Model type, which picks the minimum required properties from
   * the abstract model class.
   */
  export type Generic = Pick<ModelType, RequiredProperties>;

  export type Instance<T> = T extends { prototype: infer P } ? P : Model<SafeAny>;

  type ModelType = typeof Model;

  type RequiredProperties = "schema" | "parse";
}

/**
 * Abstract base class for models with validation via Zod schemas.
 */
export abstract class Model<C extends Model.Generic> {
  /**
   * The Zod schema used to validate the model.
   */
  declare static schema: z.ZodTypeAny;

  /**
   * Parses model properties and returns a new instance of the model.
   *
   * @param this       - The model constructor.
   * @param properties - The properties to parse.
   * @returns A new instance of the model with the parsed properties.
   */
  static parse<T>(this: T, properties: Model.Input<T>): Model.Instance<T> {
    const self = Model.getSelf(this);

    return new self(properties);
  }

  /**
   * Binds the parse method from the provided model constructor to return a function that
   * parses properties into a model instance.
   *
   * @param model - The model constructor whose parse method to bind.
   * @returns A function that parses properties into a model instance.
   */
  static parseFromModel<T extends Model.Generic>(model: T) {
    return model.parse.bind(model) as (properties: Model.Input<T>) => Model.Instance<T>;
  }

  private static getSelf<T>(value: T) {
    if ((value as SafeAny).name === Model.name) {
      return value as Model.Constructor<T>;
    }

    if ((value as SafeAny).prototype instanceof Model) {
      return value as Model.Constructor<T>;
    }

    throw new TypeError("Something wrong happened and the context of `this` was lost.");
  }

  declare ["constructor"]: C;

  /**
   * Constructs a new instance of the model by parsing the given properties using the
   * schema defined on the model class.
   * Assigns the parsed properties to the instance.
   *
   * @param properties - The properties to parse and assign to the instance.
   */
  constructor(properties: Model.Input<C>) {
    Object.assign(this, this.constructor.schema.parse(properties));
  }

  /**
   * Checks if this instance is valid.
   *
   * @returns `true` if the object is valid, `false` otherwise.
   */
  public isValid() {
    return this.constructor.schema.safeParse(this).success;
  }

  /**
   * Validates this instance.
   *
   * @returns This instance.
   * @throws {z.ZodError}
   */
  public validate() {
    this.constructor.schema.parse(this);

    return this;
  }

  /**
   * Sets a property on the model instance to the provided value if it passes schema
   * validation.
   *
   * @param key   - The property key to set.
   * @param value - The value to set.
   * @returns The model instance after attempting to set and validate the property.
   */
  public setProperty<K extends keyof Model.Input<C>>(key: K, value: Model.Input<C>[K]) {
    const shape = getZodSchemaShape(this.constructor.schema);

    if (shape) {
      const validation = shape[key as string].safeParse(value);

      if (validation.success) {
        Object.defineProperty(this, key, {
          value: validation.data,
          enumerable: true,
        });
      }
    }

    return this.validate();
  }
}
