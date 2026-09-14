export { cn } from "cn";

export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  return 'Rs. ' + Math.round(amount).toLocaleString('en-PK');
}

export const NETWORK_TIMEOUT_MS = 12000;
export const NETWORK_TIMEOUT_ERROR_MSG =
  'Connection is slow or timed out. Please connect to a strong internet connection and try again.';

/**
 * Wraps any promise with an explicit timeout.
 * Rejects with a clear, user-friendly error if the network hangs or times out.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = NETWORK_TIMEOUT_MS,
  fallbackMessage = NETWORK_TIMEOUT_ERROR_MSG
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(fallbackMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}
