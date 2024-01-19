import { STATUS_CODE } from "std/http/status.ts";

import { MockFetch, expect, faker } from "@dev-dependencies";
import { STATUS_TEXT } from "@dev-dependencies";

import { HttpClient, HttpError } from "./clients.ts";

const mockFetch = new MockFetch();

Deno.test("HttpClient.create initializes a new instance", () => {
  const client = HttpClient.create({});

  expect(client).to.be.instanceof(HttpClient);
});

Deno.test("HttpClient.request throws an error if the url in the config is not defined", () => {
  expect(HttpClient.request({})).to.be.rejectedWith(TypeError, "The url in RequestConfig is required.");
});

Deno.test("HttpClient.request sends a HTTP request with the given config", async () => {
  const config = {
    url: faker.internet.url({ appendSlash: false }),
    method: "GET",
  };
  const mockedResponse: [BodyInit, ResponseInit] = ["hello", { status: 200 }];
  const mockScope = mockFetch.intercept(config.url, { ...config }).response(...mockedResponse);

  await HttpClient.request(config);

  expect(mockScope.metadata.calls).to.be.equal(1);
});

Deno.test("HttpClient.request retrieves the body based on the response headers", async () => {
  const config = {
    url: faker.internet.url({ appendSlash: false }),
    method: "GET",
  };
  const mockedResponseBody = { song: "Halo" };

  const mockedTextResponse: [BodyInit, ResponseInit] = [JSON.stringify(mockedResponseBody), { status: 200 }];
  mockFetch.intercept(config.url, { ...config }).response(...mockedTextResponse);
  const textResponse = await HttpClient.request(config);
  expect(textResponse.data).to.be.equal(mockedTextResponse[0]);

  const mockedJsonResponse: [BodyInit, ResponseInit] = [
    JSON.stringify(mockedResponseBody),
    { status: 200, headers: { "content-type": "application/json" } },
  ];
  mockFetch.intercept(config.url, { ...config }).response(...mockedJsonResponse);
  const jsonResponse = await HttpClient.request(config);
  expect(jsonResponse.data).to.deep.equal(mockedResponseBody);
});

Deno.test("HttpClient.request throws an error when a request fails", async () => {
  const config = {
    url: faker.internet.url({ appendSlash: false }),
    method: "GET",
  };
  const status = STATUS_CODE.NotFound;
  const mockedResponse: [BodyInit, ResponseInit] = ["Oops! Not found.", { status, statusText: STATUS_TEXT[status] }];
  const mockScope = mockFetch.intercept(config.url, { ...config }).response(...mockedResponse);
  let failed = false;

  try {
    await HttpClient.request(config);
  } catch (error) {
    failed = true;

    expect(error).to.be.instanceof(HttpError);
    expect(error.message).to.contain(STATUS_TEXT[status]);
    expect(error.cause.status).to.equal(status);
    expect(error.cause.body).to.equal(mockedResponse[0]);
  }

  expect(mockScope.metadata.calls).to.be.equal(1);
  expect(failed).to.be.true;
});

Deno.test("HttpClient.get sends a GET HTTP request", async () => {
  const url = "https://example.com/text";
  const mockedResponse = "Song: In the Heights";

  const scope = mockFetch
    .intercept(url, {
      method: "GET",
    })
    .response(mockedResponse, { status: 200 });

  const response = await HttpClient.get({ url });

  expect(scope.metadata.calls).to.equal(1);
  expect(response.data).to.equal(mockedResponse);
});

Deno.test("HttpClient.get sends a POST HTTP request", async () => {
  const url = "https://example.com/text";
  const payload = "Artist: Lin Manuel Miranda";
  const mockedResponse = "Song: In the Heights";

  const scope = mockFetch
    .intercept(url, {
      method: "POST",
      body: payload,
    })
    .response(mockedResponse, { status: 200 });

  const response = await HttpClient.post({ url, body: payload });

  expect(scope.metadata.calls).to.equal(1);
  expect(response.data).to.equal(mockedResponse);
});
