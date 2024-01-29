import type { ZodType, ZodTypeAny, ZodTypeDef, input, output } from "zod";

declare global {
  interface Response {
    data: any;
    request: Request;
  }

  namespace Http {
    type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

    type RequestInterceptor = (request: Request) => Request | Promise<Request>;

    type OmitMethod<T extends { method: string }> = Omit<T, "method">;
  }

  /** Schema related utility types. */
  namespace Schema {
    type Custom<T> = ZodType<T, ZodTypeDef, T>;

    /** Obtains the required type for parsing a schema successfully. */
    type Input<T extends ZodTypeAny> = input<T>;

    /** Obtains the result of parsing a value. */
    type Output<T extends ZodTypeAny> = output<T>;
  }

  type Prototype<T> = T extends { prototype: infer P } ? P : never;
}
