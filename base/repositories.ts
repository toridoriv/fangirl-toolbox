import { existsSync, Template } from "@dependencies";

export namespace Repository {
  export type Entity = { id: string };
}

/**
 * Abstract base repository class with CRUD methods for entities of type `T`.
 */
export abstract class Repository<T extends Repository.Entity> {
  /**
   * Creates an instance of the repository.
   * This static method is intended to be called on a class that extends `Repository`.
   * It utilizes a generic type `T` to ensure that the type of `this` within the method
   * refers to the type of the subclass on which `create` is called.
   *
   * @returns An instance of the subclass that extends `Repository`.
   */
  public static create<T>(this: T) {
    const self = Repository.getSelf(this);

    return new self() as Repository.Instance<T>;
  }

  private static getSelf<T>(value: T) {
    if ((value as SafeAny).name === LocalRepository.name) {
      return value as Repository.Constructor<T>;
    }

    if ((value as SafeAny).prototype instanceof Repository) {
      return value as Repository.Constructor<T>;
    }

    throw new TypeError("Something wrong happened and the context of `this` was lost.");
  }

  /**
   * Gets the number of entities.
   *
   * @returns A promise that resolves to the number of entities.
   */
  public abstract count(): Promise<number>;
  /**
   * Deletes an entity by ID.
   *
   * @param id - The ID of the entity to delete.
   * @returns A promise that resolves when the entity has been deleted.
   */
  public abstract delete(id: string): Promise<void>;
  /**
   * Gets an entity by ID.
   *
   * @param id - The ID of the entity to get.
   * @returns A promise that resolves to the entity, or null if not found.
   */
  public abstract get(id: string): Promise<T | null>;
  /**
   * Saves an entity.
   *
   * @param value - The entity to save.
   * @returns A promise that resolves when the entity has been saved.
   */
  public abstract save(value: T): Promise<void>;
  /**
   * Updates an entity.
   *
   * @param value - The partial entity containing the updated values.
   * @returns A promise that resolves when the entity has been updated.
   */
  public abstract update(value: DeepPartial<T>): Promise<void>;
}

/**
 * Represents a local storage repository for entities of type T.
 * This class provides a template for creating, reading, updating, and deleting entities
 * in a local storage context, with the assumption that each entity is associated with a
 * unique ID.
 */
export abstract class LocalRepository<T extends Repository.Entity> extends Repository<T> {
  declare abstract readonly directory: string;

  /**
   * A template that renders into a path.
   */
  declare abstract readonly pathTemplate: Template<`${string}{id}${string}`>;

  public count(): Promise<number> {
    throw new Error("Not implemented");
  }

  public async delete(id: string): Promise<void> {
    if (this.exists(id)) {
      const path = this.pathTemplate.render({ id });

      await Deno.remove(path);
    }
  }

  /**
   * Checks if an entity with the given ID exists by checking if a file exists at the
   * rendered path template.
   *
   * @param id - The ID of the entity to check.
   * @returns Whether a file exists for the given entity ID.
   */
  public exists(id: string) {
    const path = this.pathTemplate.render({
      id,
    });

    return existsSync(path);
  }
}
