import "./http.js";

import { Common, Schema } from "./typings/index.js";

declare module "./http.js" {
  declare namespace HttpClient {
    export type Config = Schema.Input<typeof Request.schema>;

    export type ConfigOrRequest = Config | Request;
    /**
     * The interceptors configuration object.
     *
     * - More info: {@link Request.Interceptor}
     * - More info: {@link Response.Interceptor}
     */
    export type Interceptors = Schema.Output<typeof InterceptorsSchema>;

    /** Properties required when creating an {@link Interceptors} object. */
    export type InterceptorsInput = Schema.Input<typeof InterceptorsSchema>;

    export type Request = HttpRequest;

    export type Response<T = any> = HttpResponse<T>;

    export type SendFunction = <T>(
      config: ConfigOrRequest,
      interceptors?: InterceptorsInput,
    ) => Promise<Response<T>>;

    export { HttpRequest as Request };

    export { HttpResponse as Response };

    export { HttpError as Error };
  }

  declare namespace HttpRequest {
    /**
     * Defines a function that intercepts and potentially transforms an HTTP request
     * before it is sent.
     *
     * This interceptor function provides a mechanism to modify the `HttpRequest`
     * object,
     * allowing for custom processing, augmentation, or modification of the request data.
     * It can be used to add headers, alter the request body, or log request information,
     * among other tasks.
     *
     * The interceptor function can return either the modified `HttpRequest` directly or a
     * Promise that resolves to the modified `HttpRequest`, accommodating both synchronous
     * and asynchronous operations.
     */
    export type Interceptor = (
      request: HttpClient.Request,
    ) => Common.MaybePromise<HttpClient.Request>;

    /** The expected input of an `HttpRequest`. */
    export type Input = Schema.Input<typeof HttpRequest.schema>;

    export type Output = Schema.Output<typeof HttpRequest.schema>;

    export type InputOrRequest = HttpRequest | Input;
  }

  declare namespace HttpResponse {
    /**
     * Defines a function that intercepts and potentially transforms an HTTP response
     * after being received.
     *
     * This interceptor function provides a mechanism to modify the `HttpResponse` object,
     * allowing for custom processing, augmentation, or modification of the response data.
     * It can be used to alter the response body, or log information, among other tasks.
     *
     * The interceptor function can return either the modified `HttpResponse` directly or
     * a Promise that resolves to the modified `HttpResponse`, accommodating both
     * synchronous and asynchronous operations.
     */
    export type Interceptor = (
      response: HttpClient.Response<any>,
    ) => HttpClient.Response<any>;
  }
}
