import { existsSync, Template } from "@dependencies";

/**
 * Abstract base repository class with CRUD methods for entities of type `T`.
 */
export abstract class Repository<T> {
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
export abstract class LocalRepository<T> extends Repository<T> {
  /**
   * Initializes a new instance of the `LocalRepository` with a path template.
   * The path template is used to determine the file location for each entity based on its
   * ID.
   *
   * @param pathTemplate - A template literal type that includes an ID placeholder.
   */
  constructor(readonly pathTemplate: Template<`${string}{id}`>) {
    super();
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
