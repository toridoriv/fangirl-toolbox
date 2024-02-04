import { describe, expect, it } from "@jest/globals";

import { HttpRequest, HttpResponse } from "../lib/http.js";

describe("HttpRequest", () => {
  describe("When calling the static method create", () => {
    it("constructs a new instance of the class", () => {
      const request = HttpRequest.create({});

      expect(request).toBeInstanceOf(HttpRequest);
    });

    it("constructs a new instance of the class without a configuration object", () => {
      const request = HttpRequest.create();

      expect(request).toBeInstanceOf(HttpRequest);
    });
  });

  describe("When creating a new instance with the property json set", () => {
    it("adds the json content-type if is not configured", () => {
      const request = HttpRequest.create({
        json: { foo: "bar" },
      });

      expect(request.contentType).toMatch("application/json");
    });

    it("does not change the headers otherwise", () => {
      const request = HttpRequest.create({
        json: { foo: "bar" },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(request.contentType).toBe("application/json");
    });

    it("accepts a JSON like string", () => {
      const body = JSON.stringify({ foo: "bar" });
      const request = HttpRequest.create({
        json: body,
      });

      expect(request.properties.json).toBe(body);
    });

    it("throws an error if is not a valid JSON string", () => {
      const run = HttpRequest.create.bind(null, {
        json: '{ foo: "bar" }',
      });

      expect(run).toThrowError(Error);
    });
  });

  describe("When forking an instance of a HttpRequest", () => {
    it("does not mutate the original instance", () => {
      const originalRequest = HttpRequest.create({
        headers: {
          "user-agent": "1",
        },
        path: "/original",
      });

      originalRequest.fork({
        headers: {
          "user-agent": "2",
        },
        path: "/forked",
      });

      originalRequest.fork({
        headers: {
          "content-type": "text/html",
        },
        origin: "https://example.com",
      });

      expect(originalRequest.properties.path).toBe("/original");
      expect(originalRequest.contentType).toBe("");
      expect(originalRequest.properties.headers.get("user-agent")).toBe("1");
      expect(originalRequest.properties.origin).toBeUndefined();
    });

    it("merges the original request properties with the new ones", () => {
      const originalRequest = HttpRequest.create({
        headers: {
          "user-agent": "1",
        },
        path: "/original",
      });
      const requestWithReplacements = originalRequest.fork({
        headers: {
          "user-agent": "2",
        },
        path: "/forked",
      });
      const requestWithNewProps = originalRequest.fork({
        headers: {
          "content-type": "text/html",
        },
        origin: "https://example.com",
      });

      expect(requestWithReplacements.properties.headers.get("user-agent")).toBe("2");
      expect(requestWithReplacements.properties.path).toBe("/forked");
      expect(requestWithNewProps.totalHeaders).toBe(2);
      expect(requestWithNewProps.contentType).toBe("text/html");
      expect(requestWithNewProps.properties.origin).toBe("https://example.com");
    });
  });

  describe("When converting an instance to a native Request", () => {
    it("throws a TypeError if the origin property is not defined", () => {
      const httpRequest = HttpRequest.create({
        path: "/api/data",
      });

      expect(() => httpRequest.toNativeRequest()).toThrow(TypeError);
    });

    it("sets the url based on the origin and path properties", () => {
      const httpRequest = HttpRequest.create({
        origin: "https://example.com",
        path: "/api/data",
      });
      const request = httpRequest.toNativeRequest();

      expect(request.url).toBe("https://example.com/api/data");
    });

    it("sets the body to the stringified version of the json property if provided", async () => {
      const jsonBody = { key: "value" };
      const httpRequest = HttpRequest.create({
        origin: "https://example.com",
        path: "/api/data",
        method: "POST",
        json: jsonBody,
      });

      const request = httpRequest.toNativeRequest();

      expect(await request.text()).toBe(JSON.stringify(jsonBody));
    });
  });

  describe("When creating a new instance with the origin and path options", () => {
    it("removes the trailing slash from the origin", () => {
      const httpRequest = HttpRequest.create({
        origin: "https://example.com/",
      });

      expect(httpRequest.properties.origin).toBe("https://example.com");
    });
  });
});

describe("HttpResponse", () => {
  describe("When calling the method fromResponse", () => {
    it("constructs a new instance of the class", async () => {
      const nativeResponse = new Response();
      const httpRequest = HttpRequest.create();
      const httpResponse = await HttpResponse.fromResponse(nativeResponse, httpRequest);

      expect(httpResponse).toBeInstanceOf(HttpResponse);
    });

    it("handles a JSON response body", async () => {
      const body = { foo: "bar" };
      const nativeResponse = new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
      const httpRequest = HttpRequest.create();
      const httpResponse = await HttpResponse.fromResponse(nativeResponse, httpRequest);

      expect(httpResponse.body).toMatchObject(body);
    });

    it("handles a text response body", async () => {
      const body = "🎶 Who lives, who dies, who tells your story 🎶";
      const nativeResponse = new Response(body, {
        status: 200,
        headers: {
          "content-type": "text/plain",
        },
      });
      const httpRequest = HttpRequest.create();
      const httpResponse = await HttpResponse.fromResponse(nativeResponse, httpRequest);

      expect(httpResponse.body).toBe(body);
    });
  });
});
