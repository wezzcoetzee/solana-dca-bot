import { describe, expect, test } from "bun:test";
import { validateResponse } from "../http-utils";

describe("http-utils", () => {
  describe("validateResponse", () => {
    test("should not throw when response is ok", () => {
      // #given - successful response
      const response = new Response(null, { status: 200, statusText: "OK" });
      const context = "Test API";

      // #when / #then
      expect(() => validateResponse(response, context)).not.toThrow();
    });

    test("should not throw for 201 Created response", () => {
      // #given - created response
      const response = new Response(null, { status: 201, statusText: "Created" });
      const context = "Test API";

      // #when / #then
      expect(() => validateResponse(response, context)).not.toThrow();
    });

    test("should not throw for 204 No Content response", () => {
      // #given - no content response
      const response = new Response(null, { status: 204, statusText: "No Content" });
      const context = "Test API";

      // #when / #then
      expect(() => validateResponse(response, context)).not.toThrow();
    });

    test("should throw error for 400 Bad Request", () => {
      // #given - client error response
      const response = new Response(null, { status: 400, statusText: "Bad Request" });
      const context = "CoinGecko API";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[CoinGecko API] HTTP error: 400 Bad Request"
      );
    });

    test("should throw error for 401 Unauthorized", () => {
      // #given - unauthorized response
      const response = new Response(null, { status: 401, statusText: "Unauthorized" });
      const context = "Jupiter API";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[Jupiter API] HTTP error: 401 Unauthorized"
      );
    });

    test("should throw error for 403 Forbidden", () => {
      // #given - forbidden response
      const response = new Response(null, { status: 403, statusText: "Forbidden" });
      const context = "Telegram Bot";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[Telegram Bot] HTTP error: 403 Forbidden"
      );
    });

    test("should throw error for 404 Not Found", () => {
      // #given - not found response
      const response = new Response(null, { status: 404, statusText: "Not Found" });
      const context = "API Endpoint";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[API Endpoint] HTTP error: 404 Not Found"
      );
    });

    test("should throw error for 429 Too Many Requests", () => {
      // #given - rate limit response
      const response = new Response(null, { status: 429, statusText: "Too Many Requests" });
      const context = "CoinGecko API";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[CoinGecko API] HTTP error: 429 Too Many Requests"
      );
    });

    test("should throw error for 500 Internal Server Error", () => {
      // #given - server error response
      const response = new Response(null, { status: 500, statusText: "Internal Server Error" });
      const context = "Jupiter API";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[Jupiter API] HTTP error: 500 Internal Server Error"
      );
    });

    test("should throw error for 502 Bad Gateway", () => {
      // #given - bad gateway response
      const response = new Response(null, { status: 502, statusText: "Bad Gateway" });
      const context = "RPC Endpoint";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[RPC Endpoint] HTTP error: 502 Bad Gateway"
      );
    });

    test("should throw error for 503 Service Unavailable", () => {
      // #given - service unavailable response
      const response = new Response(null, { status: 503, statusText: "Service Unavailable" });
      const context = "External API";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow(
        "[External API] HTTP error: 503 Service Unavailable"
      );
    });

    test("should include context in error message", () => {
      // #given - error response with specific context
      const response = new Response(null, { status: 400, statusText: "Bad Request" });
      const context = "Price Provider";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow("[Price Provider]");
    });

    test("should include status code in error message", () => {
      // #given - error response
      const response = new Response(null, { status: 418, statusText: "I'm a teapot" });
      const context = "Test";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow("418");
    });

    test("should include status text in error message", () => {
      // #given - error response
      const response = new Response(null, { status: 418, statusText: "I'm a teapot" });
      const context = "Test";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow("I'm a teapot");
    });

    test("should handle empty context string", () => {
      // #given - error response with empty context
      const response = new Response(null, { status: 500, statusText: "Error" });
      const context = "";

      // #when / #then
      expect(() => validateResponse(response, context)).toThrow("[] HTTP error: 500 Error");
    });
  });
});
