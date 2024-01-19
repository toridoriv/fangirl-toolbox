export * from "@dependencies";
export { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";
export { STATUS_TEXT, STATUS_CODE } from "std/http/status.ts";
export { describe, it } from "std/testing/bdd.ts";
export { faker } from "npm:@faker-js/faker";

// @deno-types="npm:@types/chai@4"
import chai from "npm:chai@4.4.1";

// @deno-types="npm:@types/chai-as-promised"
import chaiAsPromised from "npm:chai-as-promised";

chai.use(chaiAsPromised);

export const { expect } = chai;