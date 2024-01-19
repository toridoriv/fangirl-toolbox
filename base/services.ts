import type { Repository } from "./repositories.ts";

export abstract class Service<T> {
  public constructor(readonly repository: Repository<T>) {}

  public abstract execute(...args: AnyArray): void | Promise<void>;
}
