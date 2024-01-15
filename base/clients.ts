import "./global.ts";
import { toolkit } from "@dependencies";
import { deepMerge } from "./utils.ts";

const URL_TPL = new toolkit.Template("{baseUrl}{endpoint}", undefined, {
  endpoint: "/",
});

/**
 * Custom error class for HTTP request failures.
 * Contains the response status and body that caused the error.
 */
export class HttpError extends Error {
  static MessageTpl = new toolkit.Template(
    "Request to {url} failed with status {statusText}",
  );

  constructor(response: Response, body: unknown) {
    super(HttpError.MessageTpl.render(response), {
      cause: {
        status: response.status,
        body,
      },
    });
  }
}

/**
 * Type for the body to send with an HTTP request. Can either be a `BodyInit` value
 * that will be passed directly to the Fetch API, or a plain JavaScript object that
 * will be JSON-stringified.
 */
export type HttpRequestBody = BodyInit | JsonObject;

/**
 * Type for the response body from an HTTP request. Can either be a string or a plain
 * JavaScript object that was parsed from JSON.
 */
export type HttpResponseBody = string | JsonObject;

/**
 * Interface for configuring HTTP requests.
 */
export interface HttpRequestConfig<Body extends HttpRequestBody = HttpRequestBody>
  extends Init {
  /**
   * The body to send with the HTTP request. Can be a `BodyInit` value that will be
   * passed to the `Fetch API`, or a plain JavaScript object that will be stringified as JSON.
   */
  body?: Body;
  /**
   * Path appended to base URL.
   */
  endpoint?: string;
  /**
   * Request headers.
   */
  headers?: HeadersInit | Headers;
  /**
   * Base URL for requests.
   */
  url?: string | URL;
}

/**
 * Generic class for making HTTP requests or instantiate a custom `HttpClient`.
 */
export class HttpClient<Client extends HttpClientCtor> {
  /** The request body type for requests made by this client. */
  declare static payload: HttpRequestBody;
  /** The response body type for responses from requests made by this client. */
  declare static response: HttpResponseBody;

  static create<T extends HttpClientCtor>(this: T, ...args: ConstructorParameters<T>) {
    // @ts-ignore: ¯\_(ツ)_/¯
    return new this(...args);
  }

  /**
   * Sends an HTTP request with the given configuration and returns the response body.
   *
   * @param config - The HTTP request configuration.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  static async request<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<T, "ANY">,
  ) {
    const response = await fetch(...HttpClient.getFetchArgs(config));
    const body = HttpClient.isJsonContentType(response.headers)
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new HttpError(response, body);
    }

    return body as GetHttpResponseBody<T>;
  }

  /**
   * Sends an HTTP GET request with the given configuration and returns the response body.
   *
   * @param config - The HTTP request configuration without the method set.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  static get<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<T, "GET">,
  ) {
    return this.request(config);
  }

  /**
   * Sends an HTTP POST request with the given configuration and returns the response
   * body.
   *
   * @param config - The HTTP request configuration without the method set.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  static post<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<T, "POST">,
  ) {
    return this.request(config);
  }

  /**
   * Gets the fetch parameters from the HTTP request configuration.
   *
   * @param config - The HTTP request configuration.
   * @returns A tuple with the request URL string as the first element and the
   *          RequestInit options as the second element.
   */
  static getFetchArgs<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<T, "ANY">,
  ): FetchArgs {
    const { url, endpoint, body, ...rest } = config;

    if (!url) {
      throw new TypeError("The url in RequestConfig is required.");
    }

    const baseUrl = typeof url === "string" ? url : url.href;
    const init = structuredClone<RequestInit>({ ...rest });
    const headers = new Headers(config.headers);

    init.headers = headers;

    if (HttpClient.isJsonContentType(headers)) {
      init.body = JSON.stringify(body);
    }

    return [URL_TPL.render({ baseUrl, endpoint }), init];
  }

  /**
   * Checks if the given Headers object has a `Content-Type` header that indicates JSON
   * data.
   *
   * @param headers - The `Headers` object to check.
   * @returns `true` if the `Content-Type` header contains `application/json`, `false`
   *          otherwise.
   */
  static isJsonContentType(headers: Headers) {
    const contentType = headers.get("content-type") || "";

    return contentType.includes("application/json");
  }

  protected declare ["constructor"]: Client;

  /**
   * Constructs a new `HttpClient` instance with the given default request configuration
   * options.
   *
   * @param defaults - The default options to use for requests from this client.
   */
  public constructor(
    public defaults: GetHttpRequestConfigByCtor<Client, "ANY">,
    ...args: ExcludeFirstFromList<ConstructorParameters<Client>>
  ) {
    if (!(this.defaults.headers instanceof Headers)) {
      this.defaults.headers = new Headers(this.defaults.headers);
    }

    this.init(...args);
  }
  /**
   * Initializes the client with additional arguments.
   *
   * This method is called by the constructor with any extra arguments passed to it.
   * It can be overridden in subclasses to handle additional initialization when
   * subclassing Client.
   *
   * @param _args - The additional arguments passed to the constructor.
   */
  protected init(..._args: ExcludeFirstFromList<ConstructorParameters<Client>>): void {}

  protected getMergedConfig<Config extends HttpRequestConfigUnion<Client>>(
    config: Config,
  ) {
    return deepMerge(this.defaults, config);
  }

  /**
   * Forks the HTTP client instance with a new configuration.
   *
   * @param config - The configuration to merge with the existing configuration.
   * @returns A new instance of the HTTP client with the merged configuration.
   */
  public fork<Config extends HttpRequestConfigUnion<Client>>(config: Config) {
    return new this.constructor(this.getMergedConfig(config)) as HttpClient<Client>;
  }

  /**
   * Sends an HTTP request with the given configuration merged with the client's defaults.
   *
   * @param config - The HTTP request configuration.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  public request(config: GetHttpRequestConfigByCtor<Client, "ANY">) {
    return this.constructor.request(this.getMergedConfig(config));
  }

  /**
   * Sends an HTTP GET request with the given configuration merged with the client's
   * defaults.
   *
   * @param config - The HTTP request configuration without method nor body set.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  public get(config: GetHttpRequestConfigByCtor<Client, "GET">) {
    return this.constructor.get(this.getMergedConfig(config));
  }

  /**
   * Sends an HTTP POST request with the given configuration merged with the client's
   * defaults.
   *
   * @param config - The HTTP request configuration without method set.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  public post(config: GetHttpRequestConfigByCtor<Client, "POST">) {
    return HttpClient.post(this.getMergedConfig(config));
  }
}

type Init = Omit<RequestInit, "body">;

type GetHttpRequestConfig<
  Body extends HttpRequestBody = HttpRequestBody,
  ToOmit extends keyof HttpRequestConfig | null = null,
> = ToOmit extends keyof HttpRequestConfig
  ? ToObject<Omit<HttpRequestConfig<Body>, ToOmit>>
  : ToObject<HttpRequestConfig<Body>>;

interface HttpRequestConfigMap<Body extends HttpRequestBody = HttpRequestBody> {
  ANY: GetHttpRequestConfig<Body>;
  CONNECT: GetHttpRequestConfig<Body, "method">;
  DELETE: GetHttpRequestConfig<Body, "method">;
  GET: GetHttpRequestConfig<Body, "method" | "body">;
  HEAD: GetHttpRequestConfig<Body, "method" | "body">;
  OPTIONS: GetHttpRequestConfig<Body, "method">;
  PATCH: GetHttpRequestConfig<Body, "method">;
  POST: GetHttpRequestConfig<Body, "method">;
  PUT: GetHttpRequestConfig<Body, "method">;
  TRACE: GetHttpRequestConfig<Body, "method">;
}

type GetHttpRequestConfigByCtor<
  C extends HttpClientCtor,
  M extends keyof HttpRequestConfigMap,
> = HttpRequestConfigMap<C["payload"]>[M];

type GetHttpResponseBody<C extends HttpClientCtor> = Promise<C["response"]>;

type HttpRequestConfigUnion<C extends HttpClientCtor> = HttpRequestConfigMap<
  C["payload"]
>[keyof HttpRequestConfigMap];

type FetchArgs = [string | URL, RequestInit];

interface HttpClientCtor {
  new (
    defaults: GetHttpRequestConfigByCtor<this, "ANY">,
    ...args: SafeAny[]
  ): this["prototype"];
  payload: HttpRequestBody;
  prototype: HttpClient<this>;
  response: string | JsonObject;
  request<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<this, "ANY">,
  ): GetHttpResponseBody<this>;
  get<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<this, "GET">,
  ): GetHttpResponseBody<this>;
  post<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<this, "POST">,
  ): GetHttpResponseBody<this>;
  getFetchArgs<T extends HttpClientCtor>(
    this: T,
    config: GetHttpRequestConfigByCtor<this, "ANY">,
  ): FetchArgs;
}
