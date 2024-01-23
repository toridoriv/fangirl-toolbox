import "@global";

import type { Repository } from "./repositories.ts";

export namespace Service {
  /**
   * Defines the instance type for a service.
   *
   * If the service class has a `prototype` property, the instance type is inferred from
   * that prototype. Otherwise, falls back to `Service<Repository.Entity>`.
   */
  export type Instance<T> = T extends { prototype: infer P }
    ? P
    : Service<Repository.Entity>;
}

/**
 * Abstract service class to be extended.
 * Handles creation of service instances.
 *
 * @template T - The entity type this service works with, extending Repository.Entity.
 * @see {@link Repository.Entity}
 */
export abstract class Service<T extends Repository.Entity> {
  /**
   * Creates an instance of a service.
   * This method is intended to be used on classes that extend the Service class.
   * It utilizes a static method to retrieve the constructor reference of the subclass and
   * creates a new instance of it.
   *
   * @returns An instance of the subclass that extends Service.
   */
  public static create<T>(this: T) {
    const self = Service.getSelf(this);

    return new self() as Service.Instance<T>;
  }

  private static getSelf<T>(value: T) {
    if ((value as SafeAny).name === Service.name) {
      return value as Constructor<T>;
    }

    if ((value as SafeAny).prototype instanceof Service) {
      return value as Constructor<T>;
    }

    throw new TypeError("Something wrong happened and the context of `this` was lost.");
  }

  /**
   * Constructor for the Service class.
   *
   * @param {Repository<T>} repository - The repository this service will use.
   */
  public constructor(readonly repository: Repository<T>) {}
}
