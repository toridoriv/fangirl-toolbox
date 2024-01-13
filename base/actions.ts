/**
 * Custom error class representing an action not found error.
 */
export class ActionNotFoundError extends Error {
  /**
   * Creates an instance of ActionNotFoundError.
   *
   * @param name - The name of the action that couldn't be found.
   */
  constructor(name: string) {
    super(`The action ${name} doesn't exist.`);
  }
}

/**
 * Executes a callable function based on the provided action.
 *
 * @example
 *
 * ```typescript
 * const actions = {
 *   greet: (name: string) => console.log(`Hello, ${name}!`),
 *   calculate: (a: number, b: number) => console.log(a + b),
 * };
 *
 * execute(actions);
 * ```
 *
 * @param actions - An object containing actions as keys and corresponding callable
 *                functions as values.
 * @throws {ActionNotFoundError} - When the provided action is not found in the actions
 *                               object.
 */
export function execute<S extends Record<string, CallableFunction>>(actions: S) {
  const [action, ...args] = Deno.args;

  if (!(action in actions)) {
    throw new ActionNotFoundError(action);
  }

  actions[action](...args);
}
