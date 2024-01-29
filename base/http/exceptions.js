import * as string from "@toridoriv/toolkit/lib/string.js";

/**
 * Custom error class for HTTP request failures.
 * Contains the response status and body that caused the error.
 */
export class HttpError extends Error {
  /** @protected */
  static MessageTpl = string.Template.create(
    "Request to {url} failed with status {statusText}",
  );

  /**
   * Constructor for the HttpError class.
   *
   * @param {Response} response - The response object that caused the error.
   * @param {unknown}  body     - The response body that caused the error.
   */
  constructor(response, body) {
    super(HttpError.MessageTpl.render(response), {
      cause: {
        status: response.status,
        body,
      },
    });

    this.name = this.constructor.name;
  }
}
