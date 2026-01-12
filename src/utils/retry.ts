import { sleep } from "bun";

interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delayMs, onRetry } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(error);
      if (attempt === maxAttempts) {
        throw error;
      }
      onRetry?.(attempt, error as Error);
      await sleep(delayMs);
    }
  }
  throw new Error("Unreachable");
}
