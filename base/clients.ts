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
  declare static payload: SafeAny;
  /**
   * The response body type for responses from requests made by this client.
   */
  declare static response: SafeAny;
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

  export type Defaults<C extends HttpClientCtor> = RequestConfigByClient<C>;

  /**
   * Type for HTTP request configuration specific to an HttpClient subclass,
   * mapping the request method to the expected request body and response types.
   */
  export type RequestConfigByClient<
    C extends HttpClientCtor,
    M extends keyof HttpRequestConfigMap = "ANY",
  > = HttpRequestConfigMap<RequestBody<C>>[M];

  /**
   * Utility type to obtain the response body of a {@link HttpClient}.
   */
  export type ResponseBody<C extends HttpClientCtor> = C["response"] extends BodyInit
    ? C["response"]
    : ToObject<C["response"]>;

  /**
   * Utility type to obtain the request body of a {@link HttpClient}.
   */
  export type RequestBody<C extends HttpClientCtor> = C["payload"] extends BodyInit
    ? C["payload"]
    : ToObject<C["payload"]>;

  export type FetchArgs = [string | URL, RequestInit];

  export interface HttpClientCtor {
    new (...args: SafeAny[]): this["prototype"];
    payload: SafeAny;
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

/**
 * An HTTP client for making requests to the OpenAI API. Extends the HttpClient class with
 * OpenAI-specific functionality.
 */
export class OpenAiClient extends HttpClient<typeof OpenAiClient> {
  declare static payload: OpenAiClient.AnyPayload | OpenAiClient.ChatCompletion.Payload;
  declare static response:
    | OpenAiClient.AnyResponse
    | OpenAiClient.ChatCompletion.Response;

  /**
   * The default options for requests. Sets the authorization header,
   * content type, API URL, and default model.
   */
  static defaults: HttpClient.Defaults<typeof OpenAiClient> = {
    headers: {
      "authorization": `Bearer ${Deno.env.get("OPENAI_SECRET_KEY")}`,
      "content-type": "application/json",
    },
    url: "https://api.openai.com",
    body: {
      model: "gpt-3.5-turbo-16k",
    },
  };

  /**
   * Creates a chat completion request.
   *
   * @param messages - The messages to include in the chat completion request.
   * @param options  - Additional options like temperature and max choices.
   * @returns A promise resolving to the API response.
   */
  public createChatCompletion(
    messages: OpenAiClient.ChatCompletion.Message[],
    options: OpenAiClient.ChatCompletion.Options = {},
  ) {
    return this.post({
      body: {
        messages,
        temperature: options.temperature || 0,
        n: options.n || 1,
      } as OpenAiClient.ChatCompletion.Payload,
      endpoint: "/v1/chat/completions",
    }) as Promise<OpenAiClient.ChatCompletion.Response>;
  }
}

export namespace OpenAiClient {
  export interface AnyPayload {
    /**
     * ID of the model to use.
     *
     * @see {@link https://platform.openai.com/docs/models/model-endpoint-compatibility Model endpoint compatibility}
     */
    model: Model;
  }

  export interface AnyResponse {
    /**
     * The model used for the chat completion.
     */
    model: Model;
  }

  export namespace ChatCompletion {
    export type Options = Pick<Payload, "n" | "temperature">;

    export interface Payload extends AnyPayload {
      /**
       * A list of messages comprising the conversation so far.
       */
      messages: Message[];
      /**
       * Sampling temperature to use, between `0` and `2`. Higher values like `0.8` will
       * make the output more random, while lower values like `0.2` will make it more
       * focused and deterministic.
       */
      temperature?: number;
      /**
       * How many chat completion choices to generate for each input message. Note that
       * you will be charged based on the number of generated tokens across all of the
       * choices.
       */
      n?: number;
      /**
       * Number between -2.0 and 2.0. Positive values penalize new tokens based on their
       * existing frequency in the text so far, decreasing the model's likelihood to
       * repeat the same line verbatim.
       *
       * @see {@link https://platform.openai.com/docs/guides/text-generation/parameter-details}
       */
      frequency_penalty?: number;
      /**
       * Number between -2.0 and 2.0. Positive values penalize new tokens based on whether
       * they appear in the text so far, increasing the model's likelihood to talk about
       * new topics.
       *
       * @see {@link https://platform.openai.com/docs/guides/text-generation/parameter-details More}
       */
      presence_penalty?: number;
    }

    export interface Response extends AnyResponse {
      /**
       * A unique identifier for the chat completion.
       */
      id: string;
      /**
       * The object type.
       */
      object: "chat.completion";
      /**
       * The Unix timestamp (in seconds) of when the chat completion was created.
       */
      created: number;
      /**
       * This fingerprint represents the backend configuration that the model runs with.
       *
       * Can be used in conjunction with the seed request parameter to understand when
       * backend changes have been made that might impact determinism.
       */
      system_fingerprint: string;
      /**
       * A list of chat completion choices. Can be more than one if {@link Payload.n}
       * is greater than `1`.
       */
      choices: Choice[];
      /**
       * Usage statistics for the completion request.
       */
      usage: Usage;
    }

    export type Choice = {
      /**
       * The index of the choice in the list of choices.
       */
      index: number;
      /**
       * The reason the model stopped generating tokens.
       *
       * @see {@link FinishReason} for more details.
       */
      finish_reason:
        | FinishReason.ContentFilter
        | FinishReason.Length
        | FinishReason.Stop
        | FinishReason.ToolCalls;
      /**
       * A chat completion message generated by the model.
       */
      message: Message;
    };

    export type Message = SystemMessage | UserMessage;

    export type SystemMessage = GenericMessage<"system">;

    export type Usage = {
      /**
       * Number of tokens in the prompt.
       */
      prompt_tokens: number;
      /**
       * Total number of tokens used in the request (prompt + completion).
       */
      completion_tokens: number;
      /**
       * Number of tokens in the generated completion.
       */
      total_tokens: number;
    };

    export type UserMessage = GenericMessage<"user">;

    type GenericMessage<T extends string> = {
      /**
       * The contents of the message.
       */
      content: string;
      /**
       * The role of the message author.
       */
      role: T;
      /**
       * An optional name for the participant. Provides the model information to
       * differentiate between participants of the same role.
       */
      name?: string;
    };
  }

  /**
   * Set of models with different capabilities and price points.
   *
   * @see {@link https://platform.openai.com/docs/models Models} for more information.
   */
  export type Model =
    | "gpt-4"
    | "gpt-4-1106-preview"
    | "gpt-4-vision-preview"
    | "gpt-4-32k"
    | "gpt-3.5-turbo"
    | "gpt-3.5-turbo-16k"
    | "gpt-3.5-turbo";

  // #region PRIVATE
  namespace FinishReason {
    /**
     * The content was omitted due to a flag from the API content filters.
     */
    export type ContentFilter = "content_filter";

    /**
     * The maximum number of tokens specified in the request was reached.
     */
    export type Length = "length";

    /**
     * The model has hit a natural stop point or a provided stop sequence.
     */
    export type Stop = "stop";

    /**
     * The model called a tool.
     */
    export type ToolCalls = "tool_calls";
  }
  // #endregion PRIVATE
}
