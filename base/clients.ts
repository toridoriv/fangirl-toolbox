import "@global";

import { cheerioLoad, Template } from "@dependencies";

import { unsafeDeepMerge } from "./utils.ts";

/**
 * Custom error class for HTTP request failures.
 * Contains the response status and body that caused the error.
 */
export class HttpError extends Error {
  static MessageTpl = Template.create("Request to {url} failed with status {statusText}");

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

export namespace HttpClient {
  /**
   * Reusable response type with flexible data typing for the parsed body data.
   */
  export type AnyResponse = Response<SafeAny>;

  export interface Config extends RequestInit {
    /**
     * The body to send with the HTTP request. Can be a `BodyInit` value that will be
     * passed to the `Fetch API`, or a plain JavaScript object that will be stringified as
     * JSON.
     */
    body?: SafeAny;
    /**
     * Path appended to base URL.
     */
    endpoint?: string;
    /**
     * Request headers.
     */
    headers?: HeadersInit | Headers;
    /**
     * Optional interceptors for the HTTP client.
     */
    interceptors?: {
      /**
       * Interceptors to process requests before sending.
       */
      request?: RequestInterceptor[];
      /**
       * Interceptors to process responses after receiving.
       */
      response?: ResponseInterceptor[];
    };
    /**
     * Base URL for requests.
     */
    url?: string;
  }

  /**
   * The base client type used by the HttpClient class and subclasses.
   */
  export type ClientType = typeof HttpClient;

  /**
   * Type alias for the constructor of HttpClient subclasses.
   */
  export type Constructor<T> = T extends Generic ? T & ClientType : ClientType;

  /**
   * Type alias for the generic HttpClient type, which picks the required properties from
   * the HttpClient class.
   */
  export type Generic = Pick<typeof HttpClient, RequiredProperties>;

  /**
   * Infers the configuration type for a client type T.
   * If T has a `config` property, uses its type.
   * Otherwise, if T has a `defaults` property, uses its type.
   * Falls back to the base {@link Config} type.
   */
  export type GetConfig<T> = T extends { config: infer C }
    ? C extends Config
      ? C
      : Config
    : T extends { defaults: infer D }
    ? D extends Config
      ? D
      : Config
    : Config;

  /**
   * Type alias for an instance of the HttpClient subclass, constraining it to the generic
   * types from the subclass. Type alias for an instance of the HttpClient subclass,
   * constraining it to the generic types from the subclass.
   */
  export type Instance<T> = T extends ClientType
    ? HttpClient<ClientType, Config>
    : T extends { prototype: infer P }
    ? P
    : HttpClient<ClientType, Config>;

  /**
   * Type alias for a request interceptor function.
   *
   * @param request - The request object to intercept.
   * @returns The intercepted request object.
   */
  export type RequestInterceptor = (request: Request) => Promise<Request>;

  /**
   * Type alias for a response interceptor function.
   *
   * @param response - The response object to intercept.
   * @returns The intercepted response object.
   */
  export type ResponseInterceptor = (response: AnyResponse) => Promise<AnyResponse>;

  /**
   * Interface extending the native Response interface.
   * Adds the parsed response data and original request object.
   */
  export interface Response<T> extends globalThis.Response {
    data: T;
    request: Request;
  }

  // #region PRIVATE
  type RequiredProperties = "config" | "create" | "post" | "defaults" | "get" | "request";
  // #endregion PRIVATE
}

export class HttpClient<
  Client extends HttpClient.Generic = HttpClient.ClientType,
  Config extends HttpClient.Config = HttpClient.GetConfig<Client>,
> {
  /**
   * The default configuration options for HTTP requests made by this client.
   */
  declare static config: HttpClient.Config;
  /**
   * Default HTTP request configuration for this client.
   */
  static readonly defaults: HttpClient.Config = {};

  /**
   * Creates a new instance of the HttpClient subclass.
   *
   * @returns A new instance of the HttpClient subclass.
   */
  public static create<T, C extends HttpClient.Config>(this: T, defaults: C) {
    const self = HttpClient.getSelf(this);
    return new self(defaults) as HttpClient.Instance<T>;
  }

  /**
   * Sends an HTTP request with the given configuration and returns the response body.
   *
   * @param config - The HTTP request configuration.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  public static async request<Data = SafeAny, T = SafeAny>(
    this: T,
    config: HttpClient.GetConfig<T>,
  ) {
    const self = HttpClient.getSelf(this);
    const request = self.getRequest(config);

    await HttpClient.runRequestInterceptors(request, config);

    const response = (await fetch(request)) as HttpClient.Response<Data>;
    const body = self.isJsonContentType(response.headers)
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new HttpError(response, body);
    }

    response.data = body;
    response.request = request;

    await HttpClient.runResponseInterceptors(response, config);

    return response;
  }

  /**
   * Sends an HTTP GET request with the given configuration and returns the response body.
   *
   * @param config - The HTTP request configuration without the method set.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  public static get<Data = SafeAny, T = SafeAny>(
    this: T,
    config: Omit<HttpClient.GetConfig<T>, "method" | "body">,
  ) {
    const self = HttpClient.getSelf(this);
    return self.request<Data>({ ...config, method: "GET" });
  }

  /**
   * Sends an HTTP POST request with the given configuration and returns the response
   * body.
   *
   * @param config - The HTTP request configuration without the method set.
   * @returns The response body, parsed as JSON if the response headers indicate JSON,
   *          otherwise as text.
   */
  public static post<Data = SafeAny, T = SafeAny>(
    this: T,
    config: Omit<HttpClient.GetConfig<T>, "method">,
  ) {
    const self = HttpClient.getSelf(this);
    return self.request<Data>({ ...config, method: "POST" });
  }

  /**
   * Checks if the given Headers object has a `Content-Type` header that indicates JSON
   * data.
   *
   * @param headers - The `Headers` object to check.
   * @returns `true` if the `Content-Type` header contains `application/json`, `false`
   *          otherwise.
   */
  protected static isJsonContentType(headers: Headers) {
    const contentType = headers.get("content-type") || "";

    return contentType.includes("application/json");
  }

  /**
   * Gets the fetch parameters from the HTTP request configuration.
   *
   * @param config - The HTTP request configuration.
   * @returns A tuple with the request URL as the first element and the RequestInit
   *          options as the second element.
   */
  protected static getRequest<T>(this: T, config: HttpClient.GetConfig<T>): Request {
    const self = HttpClient.getSelf(this);
    let { url, endpoint, body, interceptors: _interceptors, ...rest } = config;

    if (!url) {
      throw new TypeError("The url in RequestConfig is required.");
    }

    if (!endpoint) {
      endpoint = "";
    }

    const init = structuredClone<RequestInit>(rest);
    const headers = new Headers(config.headers);

    init.headers = headers;

    if (self.isJsonContentType(headers) && body) {
      init.body = JSON.stringify(body);
    } else {
      init.body = body;
    }

    return new Request(new URL(url + endpoint), init);
  }

  private static getSelf<T>(value: T) {
    if ((value as SafeAny).name === HttpClient.name) {
      return value as HttpClient.Constructor<T>;
    }

    if ((value as SafeAny).prototype instanceof HttpClient) {
      return value as HttpClient.Constructor<T>;
    }

    throw new TypeError("Something wrong happened and the context of `this` was lost.");
  }

  private static async runRequestInterceptors<T>(
    this: T,
    request: Request,
    config: HttpClient.GetConfig<T>,
  ) {
    if (config?.interceptors?.request) {
      for (const interceptor of config.interceptors.request) {
        await interceptor(request);
      }
    }
  }

  private static async runResponseInterceptors<T>(
    this: T,
    response: HttpClient.AnyResponse,
    config: HttpClient.GetConfig<T>,
  ) {
    if (config?.interceptors?.response) {
      for (const interceptor of config.interceptors.response) {
        await interceptor(response);
      }
    }
  }

  /**
   * Allows accessing static properties from a class instance. This is needed so each
   * subclass can have its own static state handler lookup map.
   */
  declare ["constructor"]: Client;
  /**
   * The default configuration for the HTTP client instance. This is merged with any
   * configuration passed to individual requests.
   */
  readonly defaults: Config;

  protected constructor(defaults: Config) {
    this.defaults = unsafeDeepMerge(this.constructor.defaults, defaults);

    if (!(this.defaults.headers instanceof Headers)) {
      this.defaults.headers = new Headers(this.defaults.headers);
    }
  }

  protected getMergedConfig<C extends Config>(config: C) {
    return unsafeDeepMerge<C>(this.defaults, config);
  }

  /**
   * Forks the HTTP client instance with a new configuration.
   *
   * @param config - The configuration to merge with the existing configuration.
   * @returns A new instance of the HTTP client with the merged configuration.
   */
  public fork(config: Config) {
    return this.constructor.create<Client, Config>(this.getMergedConfig(config));
  }

  /**
   * Retrieves data using the HTTP GET method.
   *
   * @param config - The configuration options for the request.
   * @returns A promise resolving to the response body.
   */
  public get<Data>(config: Omit<Config, "body" | "method">) {
    return this.constructor.get<Data>(this.getMergedConfig(config as Config));
  }

  /**
   * Retrieves data using the HTTP POST method.
   *
   * @param config - The configuration options for the request.
   * @returns A promise resolving to the response body.
   */
  public post<Data>(config: Omit<Config, "method">) {
    return this.constructor.post<Data>(this.getMergedConfig(config as Config));
  }

  /**
   * Sends an HTTP request using the configured options.
   *
   * @param config - The request configuration options that specify the request
   *               details.
   * @returns A promise that resolves with the response body.
   */
  public request<Data>(config: Config) {
    return this.constructor.request<Data>(this.getMergedConfig(config as Config));
  }
}

export namespace OpenAi {
  export interface Config extends HttpClient.Config {
    body?: AnyPayload | Chat.Payload;
  }

  export interface AnyPayload {
    /**
     * ID of the model to use.
     *
     * @see {@link https://platform.openai.com/docs/models/model-endpoint-compatibility Model endpoint compatibility}
     */
    model: Model;
  }

  export interface AnyData {
    /**
     * The model used for the chat completion.
     */
    model: Model;
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

  /**
   * Given a list of messages comprising a conversation, the model will return a response.
   *
   * @see {@link https://platform.openai.com/docs/api-reference/chat Api Reference: Chat}
   */
  export namespace Chat {
    /**
     * Response from ChatCompletion.
     */
    export type Response = HttpClient.Response<Completion>;

    export interface Payload {
      /**
       * ID of the model to use. By default this client uses `gpt-3.5-turbo-16k`.
       *
       * @see {@link https://platform.openai.com/docs/models/model-endpoint-compatibility Model endpoint compatibility}
       */
      model?: Model;
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

    export interface Completion extends AnyData {
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

/**
 * Client for making requests to the OpenAI API.
 */
export class OpenAi extends HttpClient<typeof OpenAi> {
  declare static config: OpenAi.Config;

  /**
   * Default configuration options for the OpenAI client.
   * Sets the authorization header, content type, API URL, and default model.
   */
  static readonly defaults: OpenAi.Config = {
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
   * Builds a chat completion message object.
   *
   * @param content - The message content.
   * @param role    - The role of the message author.
   * @returns The constructed message object.
   */
  public static buildMessage(content: string, role: OpenAi.Chat.Message["role"]) {
    return {
      role,
      content,
    };
  }

  protected getMergedConfig<C extends OpenAi.Config>(config: C) {
    return unsafeDeepMerge<C>(this.defaults, config, { arrays: "merge" });
  }

  /**
   * Sends a POST request to the OpenAI `/v1/chat/completions` endpoint to get a chat
   * completion from the specified payload.
   *
   * @param payload - The request payload containing the chat completion parameters.
   * @returns A promise resolving to the API response containing the chat completion.
   */
  public createChatCompletion(config: Omit<OpenAi.Config, "endpoint">) {
    return this.post<OpenAi.Chat.Completion>({
      endpoint: "/v1/chat/completions",
      ...config,
    });
  }
}

export namespace WebScraper {
  /**
   * Configuration object of WebScraper clients.
   */
  export type Config = HttpClient.Config;

  /**
   * Response from WebScraper clients.
   */
  export type Response = HttpClient.Response<string>;
}

/**
 * Web scraper HTTP client.
 */
export class WebScraper extends HttpClient<typeof WebScraper> {
  /**
   * Converts HTML string to a Cheerio static object.
   * This allows for jQuery-like manipulation and querying of the HTML content.
   * If a URL is provided, it sets the base URL for the document, which can be useful for
   * resolving relative paths.
   *
   * @param html - The HTML content as a string.
   * @param url  - Optional base URL to be used for resolving relative paths within the
   *             HTML content.
   * @returns A Cheerio static object representing the loaded HTML content.
   */
  public static toCheerio(html: string, url?: string | URL) {
    return cheerioLoad(html, {
      baseURI: url,
      sourceCodeLocationInfo: true,
    });
  }

  /**
   * Default configuration for web scraping requests.
   */
  static defaults: WebScraper.Config = {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  };

  /**
   * Performs web scraping based on the provided configuration.
   *
   * This method sends an HTTP request using the given configuration and then processes
   * the response to extract HTML content. It utilizes the `WebScraper.toCheerio` method
   * to convert the HTML source into a Cheerio object, allowing for jQuery-like
   * manipulation.
   * The method returns an object containing the Cheerio wrapper and the raw HTML source.
   *
   * @param config - The HTTP client configuration for the request.
   * @returns An object with a Cheerio wrapper and the raw HTML source of the scraped
   *          page.
   */
  public async scrape(config: WebScraper.Config) {
    const response = await this.request<string>(config);
    const source = response.data;

    return { $: WebScraper.toCheerio(source, response.request.url), source };
  }
}
