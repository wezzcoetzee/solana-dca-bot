import { describe, expect, test, mock } from "bun:test";
import { withRetry } from "../retry";

describe("retry", () => {
  describe("withRetry", () => {
    test("should return result on first successful attempt", async () => {
      // #given - function that succeeds immediately
      const fn = mock(() => Promise.resolve("success"));
      const options = {
        maxAttempts: 3,
        delayMs: 100,
      };

      // #when
      const result = await withRetry(fn, options);

      // #then
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("should retry and succeed on second attempt", async () => {
      // #given - function that fails once then succeeds
      let callCount = 0;
      const fn = mock(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("First attempt failed"));
        }
        return Promise.resolve("success");
      });
      const options = {
        maxAttempts: 3,
        delayMs: 10,
      };

      // #when
      const result = await withRetry(fn, options);

      // #then
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("should retry and succeed on last attempt", async () => {
      // #given - function that fails twice then succeeds
      let callCount = 0;
      const fn = mock(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error(`Attempt ${callCount} failed`));
        }
        return Promise.resolve("success");
      });
      const options = {
        maxAttempts: 3,
        delayMs: 10,
      };

      // #when
      const result = await withRetry(fn, options);

      // #then
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test("should throw error after exhausting all attempts", async () => {
      // #given - function that always fails
      const error = new Error("Persistent failure");
      const fn = mock(() => Promise.reject(error));
      const options = {
        maxAttempts: 3,
        delayMs: 10,
      };

      // #when / #then
      await expect(withRetry(fn, options)).rejects.toThrow("Persistent failure");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test("should call onRetry callback on each retry attempt", async () => {
      // #given - function that fails twice
      let callCount = 0;
      const fn = mock(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error(`Attempt ${callCount}`));
        }
        return Promise.resolve("success");
      });
      const onRetry = mock((attempt: number, error: Error) => {});
      const options = {
        maxAttempts: 3,
        delayMs: 10,
        onRetry,
      };

      // #when
      await withRetry(fn, options);

      // #then
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
    });

    test("should not call onRetry when succeeding on first attempt", async () => {
      // #given - function that succeeds immediately
      const fn = mock(() => Promise.resolve("success"));
      const onRetry = mock((attempt: number, error: Error) => {});
      const options = {
        maxAttempts: 3,
        delayMs: 10,
        onRetry,
      };

      // #when
      await withRetry(fn, options);

      // #then
      expect(onRetry).not.toHaveBeenCalled();
    });

    test("should not call onRetry on final failed attempt", async () => {
      // #given - function that always fails
      const fn = mock(() => Promise.reject(new Error("Failure")));
      const onRetry = mock((attempt: number, error: Error) => {});
      const options = {
        maxAttempts: 3,
        delayMs: 10,
        onRetry,
      };

      // #when / #then
      await expect(withRetry(fn, options)).rejects.toThrow("Failure");
      // Called on attempt 1 and 2, but not on attempt 3 (final)
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    test("should handle single attempt (no retries)", async () => {
      // #given - function with maxAttempts = 1
      const fn = mock(() => Promise.resolve("success"));
      const options = {
        maxAttempts: 1,
        delayMs: 10,
      };

      // #when
      const result = await withRetry(fn, options);

      // #then
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("should throw immediately when maxAttempts is 1 and fails", async () => {
      // #given - function that fails with no retries
      const error = new Error("Immediate failure");
      const fn = mock(() => Promise.reject(error));
      const options = {
        maxAttempts: 1,
        delayMs: 10,
      };

      // #when / #then
      await expect(withRetry(fn, options)).rejects.toThrow("Immediate failure");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("should handle maxAttempts of 5 (app.ts default)", async () => {
      // #given - function that fails 4 times then succeeds
      let callCount = 0;
      const fn = mock(() => {
        callCount++;
        if (callCount < 5) {
          return Promise.reject(new Error(`Attempt ${callCount}`));
        }
        return Promise.resolve("success");
      });
      const options = {
        maxAttempts: 5,
        delayMs: 10,
      };

      // #when
      const result = await withRetry(fn, options);

      // #then
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(5);
    });

    test("should preserve error details when retries exhausted", async () => {
      // #given - function that throws specific error
      const customError = new Error("Custom error message");
      customError.name = "CustomError";
      const fn = mock(() => Promise.reject(customError));
      const options = {
        maxAttempts: 2,
        delayMs: 10,
      };

      // #when / #then
      await expect(withRetry(fn, options)).rejects.toThrow(customError);
    });

    test("should handle synchronous errors in function", async () => {
      // #given - function that throws synchronously
      const fn = mock(() => {
        throw new Error("Sync error");
      });
      const options = {
        maxAttempts: 2,
        delayMs: 10,
      };

      // #when / #then
      await expect(withRetry(fn, options)).rejects.toThrow("Sync error");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("should return correct value types", async () => {
      // #given - function returning object
      const result = { id: 123, name: "test" };
      const fn = mock(() => Promise.resolve(result));
      const options = {
        maxAttempts: 3,
        delayMs: 10,
      };

      // #when
      const returned = await withRetry(fn, options);

      // #then
      expect(returned).toBe(result);
    });

    test("should handle undefined return value", async () => {
      // #given - function returning undefined
      const fn = mock(() => Promise.resolve(undefined));
      const options = {
        maxAttempts: 3,
        delayMs: 10,
      };

      // #when
      const result = await withRetry(fn, options);

      // #then
      expect(result).toBeUndefined();
    });

    test("should handle null return value", async () => {
      // #given - function returning null
      const fn = mock(() => Promise.resolve(null));
      const options = {
        maxAttempts: 3,
        delayMs: 10,
      };

      // #when
      const result = await withRetry(fn, options);

      // #then
      expect(result).toBeNull();
    });
  });
});
