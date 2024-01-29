import { HttpError } from "./exceptions.js";
import { load as cheerioLoad } from "@toridoriv/cheerio";
import * as schemas from "./schemas.js";

/**
 * HTTP request configuration with all properties set to optional.
 *
 * @typedef {Partial<schemas.RequestInput>} PartialConfig
 */

/**
 * HTTP request configuration without method nor body.
 *
 * @typedef {Partial<Http.OmitMethod<schemas.NoBodyRequestInput>>}
 * PartialNoMethodNoBodyConfig
 */

/**
 * HTTP request configuration without method.
 *
 * @typedef {Partial<Http.OmitMethod<schemas.WithBodyRequestInput>>} PartialNoMethodConfig
 */

export class HttpClient {
  /** @type {schemas.RequestInitInput} */
  static defaults = {};

  /**
   * Creates a new instance of a client.
   *
   * @template T
   * @this {T}
   * @param {schemas.RequestInitInput} [defaults={}]
   * @returns A new instance of a client.
   */
  static create(defaults = {}) {
    // @ts-ignore: ¯\_(ツ)_/¯
    return /** @type {Prototype<T>} */ (new this(defaults));
  }

  /**
   * Sends an HTTP request with the given configuration and returns the response body.
   *
   * @param {PartialConfig} config - The HTTP request configuration.
   * @returns {Promise<Response>} A promise resolving to the response.
   */
  static async request(config) {
    const { interceptors, ...init } = schemas.RequestSchema.parse(
      this.mergeConfig(this.defaults, config),
    );
    const request = this.buildRequest(init);

    for (const intercept of interceptors.request) {
      await intercept(request);
    }

    const response = await fetch(request);
    const body = this.isJsonContentType(response.headers)
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new HttpError(response, body);
    }

    Object.defineProperties(response, {
      data: {
        value: body,
        enumerable: true,
      },
      request: {
        value: request,
        enumerable: true,
      },
    });

    for (const intercept of interceptors.response) {
      await intercept(response);
    }

    return response;
  }

  /**
   * Sends an HTTP GET request with the given configuration and returns the response body.
   *
   * @param {PartialNoMethodNoBodyConfig} config - The HTTP request configuration without
   *                                             the method set.
   * @returns {Promise<Response>} A promise resolving to the response.
   */
  static async get(config) {
    return this.request({ ...config, method: "GET" });
  }

  /**
   * Sends an HTTP POST request with the given configuration and returns the response
   * body.
   *
   * @param {PartialNoMethodConfig} config - The HTTP request configuration without the
   *                                       method set.
   * @returns {Promise<Response>} A promise resolving to the response.
   */
  static async post(config) {
    return this.request({ ...config, method: "POST" });
  }

  /**
   * Checks if the given Headers object has a `Content-Type` header that indicates JSON
   * data.
   *
   * @protected
   * @param {Headers} headers - The `Headers` object to check.
   * @returns {boolean} `true` if the `Content-Type` header contains `application/json`,
   *                    `false`
   *                    otherwise.
   */
  static isJsonContentType(headers) {
    const contentType = headers.get("content-type") || "";

    return contentType.includes("application/json");
  }

  /**
   * @protected
   * @param {Omit<schemas.RequestOutput, "interceptors">} config
   * @returns {Request}
   */
  static buildRequest(config) {
    return new Request(config.origin + config.path, config);
  }

  /**
   * @protected
   * @param {any} c1
   * @param {any} c2
   * @returns {any}
   */
  static mergeConfig(c1, c2) {
    const { headers: h1, interceptors: i1, ...rest1 } = c1;
    const { headers: h2, interceptors: i2, ...rest2 } = c2;
    const merge = { ...rest1, ...rest2 };

    merge.headers = this.mergeHeaders(h1, h2);
    merge.interceptors = {
      request: this.mergeInterceptors(i1?.request, i2?.request),
      response: this.mergeInterceptors(i1?.response, i2?.response),
    };

    return merge;
  }

  /**
   * @template {Http.RequestInterceptor | Http.ResponseInterceptor} T
   * @param {T[]} [i1]
   * @param {T[]} [i2]
   * @returns {T[]}
   */
  static mergeInterceptors(i1, i2) {
    if (!i1) return i2 || [];
    if (!i2) return i1 || [];

    return [...i1, ...i2];
  }

  /**
   * @protected
   * @param {any} h1
   * @param {any} h2
   */
  static mergeHeaders(h1, h2) {
    if (!h1) return h2;

    if (!h2) return h1;

    if (h1 instanceof Headers) {
      const headers = new Headers(h1);
      return this.setHeaders(headers, h2);
    }

    return { ...h1, ...h2 };
  }

  /**
   * @protected
   * @param {Headers} container
   * @param {Headers | Record<string, string>} headers
   * @returns {Headers}
   */
  static setHeaders(container, headers) {
    const addHeader = container.set.bind(container);

    if (headers instanceof Headers) {
      headers.forEach(addHeader);

      return container;
    }

    for (const key in headers) {
      addHeader(key, headers[key]);
    }

    return container;
  }

  /**
   * Constructor for HttpClient instances.
   *
   * @param {schemas.RequestInitInput} defaults - Custom default config to merge with the
   *                                            client defaults.
   */
  constructor(defaults = {}) {
    /**
     * The default configuration for the HTTP client instance. This is merged with any
     * configuration passed to individual requests.
     */
    this.defaults = schemas.RequestInitSchema.parse(
      this.super.mergeConfig(this.super.defaults, defaults),
    );
  }

  /**
   * Gets the super (parent) class constructor function.
   * This allows accessing static properties/methods from the child class.
   *
   * @returns The constructor function of the parent HttpClient class.
   */
  get super() {
    // eslint-disable-next-line prettier/prettier
    return /** @type {typeof HttpClient} */ (this.constructor);
  }

  /**
   * @param {Http.RequestInterceptor[]} interceptors
   * @returns {this}
   */
  addRequestInterceptors(...interceptors) {
    this.defaults.interceptors.request.push(...interceptors);

    return this;
  }

  /**
   * @param {Http.ResponseInterceptor[]} interceptors
   * @returns {this}
   */
  addResponseInterceptors(...interceptors) {
    this.defaults.interceptors.response.push(...interceptors);

    return this;
  }

  /**
   * Forks the HTTP client instance with a new configuration.
   *
   * @param {PartialConfig} config - The configuration to merge with the existing
   *                               configuration.
   * @returns {this["super"]["prototype"]} A new instance of the HTTP client with the
   *                                       merged configuration.
   */
  fork(config) {
    return this.super.create(this.super.mergeConfig(this.defaults, config));
  }

  /**
   * Sends an HTTP request using the configured options.
   *
   * @param {PartialConfig} config - The request configuration options that specify the
   *                               request details.
   * @returns {Promise<Response>} A promise resolving to the response.
   */
  request(config) {
    return this.super.request(this.super.mergeConfig(this.defaults, config));
  }

  /**
   * Retrieves data using the HTTP GET method.
   *
   * @param {PartialNoMethodNoBodyConfig} config - The configuration options for the
   *                                             request.
   * @returns {Promise<Response>} A promise resolving to the response.
   */
  get(config) {
    return this.super.get(this.super.mergeConfig(this.defaults, config));
  }

  /**
   * Retrieves data using the HTTP POST method.
   *
   * @param {PartialNoMethodConfig} config - The configuration options for the request.
   * @returns {Promise<Response>} A promise resolving to the response.
   */
  post(config) {
    return this.super.post(this.super.mergeConfig(this.defaults, config));
  }
}

class ChatCompletion {
  static FINISH_REASON = Object.freeze({
    /** The content was omitted due to a flag from the API content filters. */
    content_filter: "content_filter",
    /** The maximum number of tokens specified in the request was reached. */
    length: "length",
    /** The model has hit a natural stop point or a provided stop sequence. */
    stop: "stop",
    /** The model called a tool. */
    tool_calls: "tool_calls",
  });

  /**
   * @typedef {Object} Choice
   * @property {number} index
   * The index of the choice in the list of choices.
   * @property {keyof typeof ChatCompletion.FINISH_REASON} finish_reason
   * The reason the model stopped generating tokens. See {@link FINISH_REASON} for more
   * details.
   * @property {schemas.ChatCompletionMessageOutput} message
   * A chat completion message generated by the model.
   */

  /**
   * @typedef {Object} Usage
   * @property {number} prompt_tokens     Number of tokens in the prompt.
   * @property {number} completion_tokens Total number of tokens used in the request
   *                                      (prompt + completion).
   * @property {number} total_tokens      Number of tokens in the generated completion.
   */

  /**
   * Asf.
   *
   * @param {Record<string, any>} props
   */
  constructor(props) {
    /**
     * A unique identifier for the chat completion.
     *
     * @type {string}
     */
    this.id = props.id;

    /**
     * The object type.
     *
     * @type {"chat.completion"}
     */
    this.object = props.object;

    /**
     * The Unix timestamp (in seconds) of when the chat completion was created.
     *
     * @type {number}
     */
    this.created = props.created;

    /**
     * This fingerprint represents the backend configuration that the model runs with.
     *
     * Can be used in conjunction with the seed request parameter to understand when
     * backend changes have been made that might impact determinism.
     *
     * @type {string}
     */
    this.system_fingerprint = props.system_fingerprint;

    /**
     * A list of chat completion choices.
     *
     * @type {Choice[]}
     */
    this.choices = props.choices;

    /**
     * Usage statistics for the completion request.
     *
     * @type {Usage}
     */
    this.usage = props.usage;
  }
}

export class OpenAi extends HttpClient {
  /** @type {schemas.RequestInitInput} */
  static defaults = {
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${process.env.OPENAI_SECRET_KEY}`,
    },
    origin: "https://api.openai.com",
  };

  /**
   * Gets the super (parent) class constructor function.
   * This allows accessing static properties/methods from the child class.
   *
   * @returns The constructor function of the parent HttpClient class.
   */
  get super() {
    // eslint-disable-next-line prettier/prettier
    return /** @type {typeof OpenAi} */ (this.constructor);
  }

  /**
   * Sends a POST request to the OpenAI `/v1/chat/completions` endpoint to get a chat
   * completion from the specified payload.
   *
   * @param {schemas.ChatCompletionPayloadInput} payload
   * @returns {Promise<ChatCompletion>}
   */
  async createChatCompletion(payload) {
    const response = await this.post({
      body: schemas.ChatCompletionPayloadSchema.parse(payload),
      path: "/v1/chat/completions",
    });

    return new ChatCompletion(response.data);
  }
}

export class WebScraper extends HttpClient {
  /** @type {schemas.RequestInitInput} */
  static defaults = {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  };

  /**
   * Converts HTML string to a Cheerio static object.
   * This allows for jQuery-like manipulation and querying of the HTML content.
   * If a URL is provided, it sets the base URL for the document, which can be useful for
   * resolving relative paths.
   *
   * @param {string}       html - The HTML content as a string.
   * @param {string | URL} url  - Optional base URL to be used for resolving relative
   *                            paths within the HTML content.
   * @returns A Cheerio static object representing the loaded HTML content.
   */
  static toDomApi(html, url) {
    return cheerioLoad(html, {
      baseURI: url,
      sourceCodeLocationInfo: true,
    });
  }

  /**
   * Gets the super (parent) class constructor function.
   * This allows accessing static properties/methods from the child class.
   *
   * @returns The constructor function of the parent HttpClient class.
   */
  get super() {
    // eslint-disable-next-line prettier/prettier
    return /** @type {typeof WebScraper} */ (this.constructor);
  }

  /** @typedef {Http.OmitMethod<schemas.NoBodyRequestInput>} ScrapeConfig */

  /**
   * Performs web scraping based on the provided configuration.
   *
   * This method sends an HTTP request using the given configuration and then processes
   * the response to extract HTML content. It utilizes the `WebScraper.toCheerio` method
   * to convert the HTML source into a Cheerio object, allowing for jQuery-like
   * manipulation.
   * The method returns an object containing the Cheerio wrapper and the raw HTML source.
   *
   * @param {ScrapeConfig} config - The HTTP client configuration for the request.
   * @returns An object with a Cheerio wrapper and the raw HTML source of the scraped
   *          page.
   */
  async scrape(config) {
    const response = await this.get(config);
    const source = response.data;

    return { $: WebScraper.toDomApi(source, response.request.url), source };
  }
}
