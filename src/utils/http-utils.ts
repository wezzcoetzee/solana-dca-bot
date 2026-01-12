export function validateResponse(response: Response, context: string): void {
  if (!response.ok) {
    throw new Error(`[${context}] HTTP error: ${response.status} ${response.statusText}`);
  }
}
