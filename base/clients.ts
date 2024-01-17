import "./global.ts";
import { toolkit } from "@dependencies";
import { deepMerge } from "./utils.ts";
import { Template } from "@dependencies";

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

    this.name = this.constructor.name;
  }
}

/**
 * Generic class for making HTTP requests or instantiate a custom `HttpClient`.
 */
export class HttpClient<Client extends HttpClient.HttpClientCtor> {
  static URL_TEMPLATE = Template.create("{baseUrl}{endpoint}", undefined, {
    endpoint: "",
  });
  /**
   * The request body type for requests made by this client.
   */
  declare static payload: HttpClient.AnyRequestBody;
  /**
   * The response body type for responses from requests made by this client.
   */
  declare static response: HttpClient.AnyResponseBody;
  /**
   * Default HTTP request configuration for this client.
   */
  static defaults: HttpClient.BaseRequestConfig<SafeAny> = {};

  /**
   * Creates a new instance of the HttpClient subclass.
   *
   * @returns A new instance of the HttpClient subclass.
   */
  static create<T extends HttpClient.HttpClientCtor>(
    this: T,
    ...args: ConstructorParameters<T>
  ) {
    return new this(...args);
  }

  /**
   * Sends an HTTP request with the given configuration and returns the response body.
   *
   * @param config - The HTTP request configuration.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  static async request<T extends HttpClient.HttpClientCtor>(
    this: T,
    config: HttpClient.RequestConfigByClient<T, "ANY">,
  ) {
    const response = await fetch(...this.getFetchArgs(config));
    const body = HttpClient.isJsonContentType(response.headers)
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new HttpError(response, body);
    }

    return body as HttpClient.ResponseBody<T>;
  }

  /**
   * Sends an HTTP GET request with the given configuration and returns the response body.
   *
   * @param config - The HTTP request configuration without the method set.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  static get<T extends HttpClient.HttpClientCtor>(
    this: T,
    config: HttpClient.RequestConfigByClient<T, "GET">,
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
  static post<T extends HttpClient.HttpClientCtor>(
    this: T,
    config: HttpClient.RequestConfigByClient<T, "POST">,
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
  static getFetchArgs<T extends HttpClient.HttpClientCtor>(
    this: T,
    config: HttpClient.RequestConfigByClient<T, "ANY">,
  ): HttpClient.FetchArgs {
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

    return [HttpClient.URL_TEMPLATE.render({ baseUrl, endpoint }), init];
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

  public defaults: HttpClient.RequestConfigByClient<Client, "ANY">;

  /**
   * Constructs a new `HttpClient` instance with the given default request configuration
   * options.
   *
   * @param defaults - The default options to use for requests from this client.
   */
  public constructor(defaults: HttpClient.RequestConfigByClient<Client, "ANY">) {
    this.defaults = deepMerge(this.constructor.defaults, defaults);

    if (!(this.defaults.headers instanceof Headers)) {
      this.defaults.headers = new Headers(this.defaults.headers);
    }
  }

  protected getMergedConfig<
    Config extends HttpClient.RequestConfigByClient<Client, "ANY">,
  >(config: Config) {
    return deepMerge(this.defaults, config);
  }

  /**
   * Forks the HTTP client instance with a new configuration.
   *
   * @param config - The configuration to merge with the existing configuration.
   * @returns A new instance of the HTTP client with the merged configuration.
   */
  public fork<Config extends HttpClient.RequestConfigByClient<Client, "ANY">>(
    config: Config,
  ) {
    return new this.constructor(this.getMergedConfig(config)) as HttpClient<Client>;
  }

  /**
   * Sends an HTTP request with the given configuration merged with the client's defaults.
   *
   * @param config - The HTTP request configuration.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  public request(config: HttpClient.RequestConfigByClient<Client, "ANY">) {
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
  public get(config: HttpClient.RequestConfigByClient<Client, "GET">) {
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
  public post(config: HttpClient.RequestConfigByClient<Client, "POST">) {
    return this.constructor.post(this.getMergedConfig(config));
  }
}

export namespace HttpClient {
  /**
   * Type for the body to send with an HTTP request. Can either be a `BodyInit` value that
   * will be passed directly to the Fetch API, or a plain JavaScript object that will be
   * JSON-stringified.
   */
  export type AnyRequestBody = BodyInit | JsonObject;

  /**
   * Type for the response body from an HTTP request. Can either be a string or a plain
   * JavaScript object that was parsed from JSON.
   */
  export type AnyResponseBody = string | JsonObject;

  /**
   * Interface for configuring HTTP requests.
   */
  export interface BaseRequestConfig<Body extends AnyRequestBody = AnyRequestBody>
    extends Init {
    /**
     * The body to send with the HTTP request. Can be a `BodyInit` value that will be
     * passed to the `Fetch API`, or a plain JavaScript object that will be stringified as
     * JSON.
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
   * Type for HTTP request configuration specific to an HttpClient subclass,
   * mapping the request method to the expected request body and response types.
   */
  export type RequestConfigByClient<
    C extends HttpClientCtor,
    M extends keyof HttpRequestConfigMap = "ANY",
  > = HttpRequestConfigMap<C["payload"]>[M];

  /**
   * Utility type to obtain the response body of a {@link HttpClient}.
   */
  export type ResponseBody<C extends HttpClientCtor> = C["response"];

  /**
   * Utility type to obtain the request body of a {@link HttpClient}.
   */
  export type RequestBody<C extends HttpClientCtor> = C["payload"];

  export type FetchArgs = [string | URL, RequestInit];

  export interface HttpClientCtor {
    new (...args: SafeAny[]): this["prototype"];
    payload: AnyRequestBody;
    prototype: SafeAny;
    defaults: RequestConfigByClient<this, "ANY">;
    response: SafeAny;
    request<T extends HttpClientCtor>(
      this: T,
      config: RequestConfigByClient<this, "ANY">,
    ): Promise<ResponseBody<this>>;
    get<T extends HttpClientCtor>(
      this: T,
      config: RequestConfigByClient<this, "GET">,
    ): Promise<ResponseBody<this>>;
    post<T extends HttpClientCtor>(
      this: T,
      config: RequestConfigByClient<this, "POST">,
    ): Promise<ResponseBody<this>>;
    getFetchArgs<T extends HttpClientCtor>(
      this: T,
      config: RequestConfigByClient<this, "ANY">,
    ): FetchArgs;
  }

  // #region PRIVATE

  type Init = Omit<RequestInit, "body">;

  type GetHttpRequestConfig<
    Body extends AnyRequestBody = AnyRequestBody,
    ToOmit extends keyof BaseRequestConfig | null = null,
  > = ToOmit extends keyof BaseRequestConfig
    ? ToObject<Omit<BaseRequestConfig<Body>, ToOmit>>
    : ToObject<BaseRequestConfig<Body>>;

  interface HttpRequestConfigMap<Body extends AnyRequestBody = AnyRequestBody> {
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

  // #endregion PRIVATE
}
