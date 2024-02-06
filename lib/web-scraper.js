import { load } from "@toridoriv/cheerio";

import { HttpClient, HttpRequest } from "./http.js";

/** Web scraper HTTP client. */
export class WebScraper extends HttpClient {
  static request = HttpRequest.create({
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
  /**
   * Converts HTML string to a Cheerio static object.
   * This allows for jQuery-like manipulation and querying of the HTML content.
   * If a URL is provided, it sets the base URL for the document, which can be useful for
   * resolving relative paths.
   *
   * @param {string}       html  The HTML content as a string.
   * @param {string | URL} [url] Optional base URL to be used for resolving relative paths
   *                             within the HTML content.
   * @returns A Cheerio static object representing the loaded HTML content.
   */
  static toCheerio(html, url) {
    return load(html, {
      baseURI: url,
      sourceCodeLocationInfo: true,
    });
  }

  /**
   * Performs web scraping based on the provided configuration.
   *
   * This method sends an HTTP request using the given configuration and then processes
   * the response to extract HTML content. It utilizes the `WebScraper.toCheerio` method
   * to convert the HTML source into a Cheerio object, allowing for jQuery-like
   * manipulation.
   * The method returns an object containing the Cheerio wrapper and the raw HTML source.
   *
   * @param {HttpClient.Config} config The HTTP client configuration for the request.
   * @returns An object with a Cheerio wrapper and the raw HTML source of the scraped
   *          page.
   */
  async scrape(config) {
    /** @type {HttpClient.Response<string>} */
    const response = await this.send(config);
    const source = response.body;

    return { $: WebScraper.toCheerio(source, response.url), source };
  }

  get super() {
    return /** @type {typeof WebScraper} */ (this.constructor);
  }
}
