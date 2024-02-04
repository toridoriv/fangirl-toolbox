import { z } from "zod";

import { Schema } from "./typings/index.js";
import { coerce } from "./utils.js";

/**
 * Custom error class for HTTP request failures.
 * Contains the response status and body that caused the error.
 */
export class HttpError extends Error {
  /**
   * Constructor for the HttpError class.
   *
   * @param {HttpResponse} response - The response object that caused the error.
   */
  constructor(response) {
    super(`Request to ${response.url} failed with status ${response.statusText}`, {
      cause: response,
    });

    this.name = this.constructor.name;
  }
}

/**
 * Represents the details of a HTTP request. It encapsulates all the necessary properties
 * and behaviors required to construct and manipulate HTTP request data in a structured an
 * consistent manner.
 */
export class HttpRequest {
  /** The schema of an `HttpRequest` */
  static schema = z.object({
    /**
     * A string indicating how the request will interact with the browser's cache to set
     * request's cache.
     */
    cache: z
      .enum([
        "default",
        "force-cache",
        "no-cache",
        "no-store",
        "only-if-cached",
        "reload",
      ])
      .default("no-cache"),
    /**
     * A string indicating whether credentials will be sent with the request always,
     * never, or only when sent to a same-origin URL. Sets request's credentials.
     */
    credentials: z.enum(["include", "omit", "same-origin"]).optional(),
    /**
     * A Headers object, an object literal, or an array of two-item arrays to set
     * request's headers.
     */
    headers: z
      .instanceof(Headers)
      .or(
        z.record(z.string()).transform(function createHeaders(value) {
          return new Headers(value);
        }),
      )
      .default(() => new Headers()),
    /**
     * A cryptographic hash of the resource to be fetched by request. Sets request's
     * integrity.
     */
    integrity: z.string().optional(),
    /** A boolean to set request's keepalive. */
    keepalive: z.boolean().default(false),
    /**
     * A string to indicate whether the request will use CORS, or will be restricted to
     * same-origin URLs. Sets request's mode.
     */
    mode: z.enum(["same-origin", "cors", "navigate", "no-cors"]).default("no-cors"),
    /**
     * A string indicating whether request follows redirects, results in an error upon
     * encountering a redirect, or returns the redirect (in an opaque fashion). Sets
     * request's redirect.
     */
    redirect: z.enum(["error", "follow", "manual"]).default("follow"),
    /**
     * A string whose value is a same-origin URL, "about:client", or the empty string,
     * to set request's referrer.
     */
    referrer: z.string().default(""),
    /** A referrer policy to set request's referrerPolicy. */
    referrerPolicy: z
      .enum([
        "",
        "same-origin",
        "no-referrer",
        "no-referrer-when-downgrade",
        "origin",
        "origin-when-cross-origin",
        "strict-origin",
        "strict-origin-when-cross-origin",
        "unsafe-url",
      ])
      .default(""),
    /** An AbortSignal to set request's signal. */
    signal: z.instanceof(AbortSignal).optional(),
    /** The origin URL of the request. */
    origin: z
      .string()
      .url()
      .transform(function cleanUrl(value) {
        if (value.endsWith("/")) {
          return value.substring(0, value.length - 1);
        }

        return value;
      })
      .optional(),
    /** The path of the URL to make the request to. */
    path: z.string().startsWith("/").default("/"),
    /** A string indicating the method of the request. */
    method: z
      .enum([
        "get",
        "GET",
        "head",
        "HEAD",
        "options",
        "OPTIONS",
        "trace",
        "TRACE",
        "connect",
        "CONNECT",
        "delete",
        "DELETE",
        "post",
        "POST",
        "put",
        "PUT",
        "patch",
        "PATCH",
      ])
      .default("GET"),
    /** A JSON request body. */
    json: z
      .object({})
      .passthrough()
      .optional()
      .transform((x) => JSON.stringify(x))
      .or(
        z.string().refine((value) => {
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        }, "Not a valid JSON body."),
      ),
    /** A BodyInit object or null to set request's body. */
    body: z
      .instanceof(Blob)
      .or(z.instanceof(ArrayBuffer))
      .or(z.instanceof(FormData))
      .or(z.instanceof(URLSearchParams))
      .or(z.string())
      .optional(),
  });

  /**
   * Schema for a request interceptor. @see {@link HttpRequest.Interceptor} for more info.
   *
   * @type {Schema.Custom<HttpRequest.Interceptor>}
   */
  static interceptor = z.custom(
    validateInterceptor,
    "A request interceptor must be a named function.",
  );

  /**
   * Creates a new `HttpRequest`.
   *
   * @param {HttpRequest.Input} [properties] - The properties required to create a new
   *                                         instance.
   */
  static create(properties) {
    return new HttpRequest(properties);
  }

  /**
   * Creates a new `HttpRequest`.
   *
   * @param {HttpRequest.Input} properties - The properties required to create a new
   *                                       instance.
   */
  constructor(properties = {}) {
    /** The properties of a HttpRequest. */
    this.properties = this.super.schema.parse(properties);

    if (this.properties.json) {
      if (!this.contentType || !this.contentType.includes("json")) {
        this.properties.headers.set("content-type", "application/json;charset=UTF-8");
      }
    }
  }

  /**
   * Gets the parent class of this instance.
   * This allows accessing static properties/methods from the child class.
   *
   * @returns The parent class.
   */
  get super() {
    // eslint-disable-next-line prettier/prettier
    return /** @type {typeof HttpRequest} */ (this.constructor);
  }

  /**
   * Gets the content-type header from the request headers.
   *
   * @returns {string | null}
   */
  get contentType() {
    return this.properties.headers.get("content-type") || "";
  }

  get url() {
    return new URL(this.properties.path, this.properties.origin);
  }

  /**
   * Gets the total number of headers in the properties.headers Map.
   *
   * @returns {number} The number of headers.
   */
  get totalHeaders() {
    return Array.from(this.properties.headers).length;
  }

  /**
   * Merge the current properties with the new ones to create a new `HttpRequest`.
   *
   * @param {HttpRequest.InputOrRequest} value - The properties required to create a new
   *                                           instance.
   * @returns {HttpRequest} The new instance.
   */
  fork(value) {
    const properties = value instanceof HttpRequest ? value.properties : value;
    const { headers, ...rest } = properties;
    const givenHeaders = new Headers(headers);
    const mergedHeaders = new Headers(this.properties.headers);

    givenHeaders.forEach((value, key) => {
      mergedHeaders.set(key, value);
    });

    return new HttpRequest(
      Object.assign({}, this.properties, rest, { headers: mergedHeaders }),
    );
  }

  /**
   * Creates a native Request object from the properties of this `HttpRequest` instance.
   *
   * @returns {Request} A native Request object.
   * @throws {TypeError} If the origin property is not defined.
   */
  toNativeRequest() {
    if (!this.properties.origin) {
      throw new TypeError("The origin of a request MUST BE defined.");
    }

    const { json, ...rest } = this.properties;

    if (json) {
      rest.body = json;
    }

    return new Request(this.url, rest);
  }
}

/**
 * Represents an HTTP response. Its primary purpose is to encapsulate the data received
 * from an HTTP request and provide a structured way to access various aspects of the
 * response, such as headers, status code, status text, and the body of the response.
 *
 * @template [T=any] The type of the response body.
 */
export class HttpResponse {
  /**
   * Schema for a response interceptor. @see {@link HttpResponse.Interceptor} for more info.
   *
   * @type {Schema.Custom<HttpResponse.Interceptor>}
   */
  static interceptor = z.custom(
    validateInterceptor,
    "A response interceptor must be a named function.",
  );

  /**
   * Creates a new `HttpResponse`.
   *
   * @template [T=string] - The type of the response body.
   * @param {Response}    response
   * @param {HttpRequest} request
   * @returns {Promise<HttpResponse<T>>}
   */

  /**
   * Creates a new `HttpResponse` instance from a fetch `Response` object.
   *
   * @param {Response}    response The Response object.
   * @param {HttpRequest} request  The associated HttpRequest.
   * @returns {Promise<HttpResponse>} A promise that resolves to the HttpResponse .
   */
  static async fromResponse(response, request) {
    const httpResponse = new HttpResponse(response, request);

    await httpResponse.setBody(response);

    return httpResponse;
  }

  /**
   * Creates a new `HttpResponse`.
   *
   * @param {Response}    response
   * @param {HttpRequest} request
   */
  constructor(response, request) {
    /** The HttpRequest associated to this response. */
    this.request = request;
    /** Indicates whether the response status code is in the 200 range. */
    this.ok = response.ok;
    /** The headers of the HTTP response. */
    this.headers = response.headers;
    /** The status code of the HTTP response. */
    this.status = response.status;
    /** The status text of the HTTP response. */
    this.statusText = response.statusText;
    /** The type of the response (e.g., "basic", "cors"). */
    this.type = response.type;
    /** The URL of the response. */
    this.url = response.url;
    /** Indicates whether the response is the result of a redirect. */
    this.redirected = response.redirected;
  }

  /**
   * Gets the content-type header from the response headers.
   *
   * @returns {string}
   */
  get contentType() {
    return this.headers.get("content-type") || "";
  }

  /**
   * Sets the body according to the `content-type` header.
   *
   * @param {Response} response
   */
  async setBody(response) {
    if (this.contentType.includes("/json")) {
      /**
       * The response body.
       *
       * @type {T}
       */
      this.body = coerce(await response.json());

      return this;
    }

    // @ts-ignore: ¯\_(ツ)_/¯
    this.body = await response.text();

    return this;
  }
}

/** Schema for interceptors configuration. */
export const InterceptorsSchema = z
  .object({
    /** @see {@link RequestInterceptor} */
    request: z.array(HttpRequest.interceptor).default([]),
    /** @see {@link ResponseInterceptor} */
    response: z.array(HttpResponse.interceptor).default([]),
  })
  .default({});

export class HttpClient {
  /** A reference to {@link HttpRequest} */
  static Request = HttpRequest;

  /** A reference to {@link HttpResponse} */
  static Response = HttpResponse;

  /** The default request options for HTTP requests made by this client. */
  static request = HttpRequest.create({});
  /**
   * The default interceptors config for this client.
   *
   * @type {HttpClient.Interceptors}
   */
  static interceptors = {
    request: [],
    response: [],
  };

  /**
   * Initializes a new instance of the HTTP client with the given request configuration
   * and interceptors.
   *
   * @template T
   * @this {T}
   * @param {HttpClient.Config}            config         The configuration for requests
   *                                                      made by this client.
   * @param {HttpClient.InterceptorsInput} [interceptors] Optional interceptors.
   * @returns {InstanceType<T>}
   */
  static create(config = {}, interceptors) {
    // @ts-ignore: ¯\_(ツ)_/¯
    return new this(config, interceptors);
  }

  /**
   * Sends an HTTP request with the given configuration and returns the response.
   * Applies any request/response interceptors that are provided.
   *
   * @type {HttpClient.SendFunction}
   */
  static async send(config, interceptorsConfig) {
    const httpRequest = config instanceof HttpRequest ? config : new HttpRequest(config);
    const interceptors = this.getInterceptors(interceptorsConfig);

    if (interceptors.request) {
      for (const interceptor of interceptors.request) {
        await interceptor(httpRequest);
      }
    }

    const response = await fetch(httpRequest.toNativeRequest());
    const httpResponse = await HttpResponse.fromResponse(response, httpRequest);

    if (interceptors.response) {
      for (const interceptor of interceptors.response) {
        await interceptor(httpResponse);
      }
    }

    return httpResponse;
  }

  /**
   * Sends an HTTP GET request with the given configuration.
   *
   * @type {HttpClient.SendFunction}
   */
  static get(config, interceptors) {
    let request = this.getRequest(config);
    request = request.fork({ method: "GET" });

    return this.send(request, interceptors);
  }

  /**
   * Sends an HTTP POST request with the given configuration.
   *
   * @type {HttpClient.SendFunction}
   */
  static post(config, interceptors) {
    let request = this.getRequest(config);
    request = request.fork({ method: "POST" });

    return this.send(request, interceptors);
  }

  /**
   * Gets the HTTP request from the given configuration.
   *
   * If the config is already an HttpRequest instance, returns a forked instance with the
   * config properties merged in.
   *
   * Otherwise parses the config as input data and returns a new HttpRequest.
   *
   * This is an internal method used before sending requests.
   *
   * @protected
   * @param {HttpClient.ConfigOrRequest} config The request configuration.
   * @returns {HttpRequest} The HTTP request.
   */
  static getRequest(config) {
    if (config instanceof HttpRequest) {
      return this.request.fork(config.properties);
    }

    return this.request.fork(config);
  }

  /**
   * Merges the given interceptors with the default interceptors.
   *
   * If no interceptors are passed, returns the default interceptors.
   *
   * @protected
   * @param {HttpClient.InterceptorsInput} [config] Optional interceptors to merge.
   * @returns {HttpClient.Interceptors} The merged interceptors.
   */
  static getInterceptors(config) {
    if (!config) return this.interceptors;

    return this.mergeInterceptors(this.interceptors, InterceptorsSchema.parse(config));
  }

  /**
   * Merges two sets of interceptors into one.
   *
   * Adds any request or response interceptors from the second set that do not already
   * exist in the first set.
   *
   * @protected
   * @param {HttpClient.Interceptors} interceptors1 The first set of interceptors.
   * @param {HttpClient.Interceptors} interceptors2 The second set of interceptors.
   * @returns {HttpClient.Interceptors} The merged interceptors.
   */
  static mergeInterceptors(interceptors1, interceptors2) {
    const interceptors = {
      request: [...interceptors1.request],
      response: [...interceptors1.response],
    };

    for (const interceptor of interceptors2.request) {
      if (!interceptors.request.includes(interceptor)) {
        interceptors.request.push(interceptor);
      }
    }

    for (const interceptor of interceptors2.response) {
      if (!interceptors.response.includes(interceptor)) {
        interceptors.response.push(interceptor);
      }
    }

    return interceptors;
  }

  /**
   * Initializes a new instance of the HTTP client with the given request configuration
   * and interceptors.
   *
   * @param {HttpClient.Config}            config       The configuration for requests
   *                                                    made by this client.
   * @param {HttpClient.InterceptorsInput} interceptors Optional interceptors.
   */
  constructor(config, interceptors = {}) {
    /**
     * The request configuration that will be used for requests made by this client
     * instance.
     */
    this.request = this.super.request.fork(config);

    /** The interceptors that will handle requests and responses for this client instance. */
    this.interceptors = this.super.mergeInterceptors(
      this.super.interceptors,
      InterceptorsSchema.parse(interceptors),
    );
  }

  /**
   * Sends an HTTP request with the given configuration and returns the response.
   * Applies any request/response interceptors that are provided.
   *
   * @type {HttpClient.SendFunction}
   */
  send(config, interceptors) {
    const request = this.request.fork(config);

    return this.super.send(
      request,
      this.super.mergeInterceptors(
        this.interceptors,
        InterceptorsSchema.parse(interceptors),
      ),
    );
  }

  /**
   * Sends an HTTP GET request with the given configuration.
   *
   * @type {HttpClient.SendFunction}
   */
  get(config, interceptors) {
    const request = this.request.fork(config);

    return this.super.get(
      request,
      this.super.mergeInterceptors(
        this.interceptors,
        InterceptorsSchema.parse(interceptors),
      ),
    );
  }

  /**
   * Sends an HTTP POST request with the given configuration.
   *
   * @type {HttpClient.SendFunction}
   */
  post(config, interceptors) {
    const request = this.request.fork(config);

    return this.super.post(
      request,
      this.super.mergeInterceptors(
        this.interceptors,
        InterceptorsSchema.parse(interceptors),
      ),
    );
  }

  /**
   * Creates a new client instance merging its current configuration with the new one
   * given.
   *
   * @param {HttpClient.ConfigOrRequest}   config       The request configuration.
   * @param {HttpClient.InterceptorsInput} interceptors Interceptors to apply.
   * @returns {InstanceType<this["super"]>} A new instance of the HTTP client with the
   *                                        merged configuration.
   */
  fork(config, interceptors = {}) {
    const mergeRequest = this.request.fork(config);
    const mergedInterceptors = this.super.mergeInterceptors(
      this.interceptors,
      InterceptorsSchema.parse(interceptors),
    );

    // @ts-ignore: ¯\_(ツ)_/¯
    return new this.super(mergeRequest.properties, mergedInterceptors);
  }

  /**
   * Gets the parent class of this instance.
   * This allows accessing static properties/methods from the child class.
   *
   * @returns The parent class.
   */
  get super() {
    // eslint-disable-next-line prettier/prettier
    return /** @type {typeof HttpClient} */ (this.constructor);
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function validateInterceptor(value) {
  return typeof value === "function" && value.name !== undefined && value.length > 0;
}
