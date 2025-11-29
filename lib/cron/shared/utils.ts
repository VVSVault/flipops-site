/**
 * Utility functions for cron jobs
 * Retry logic, rate limiting, error handling
 */

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      if (onRetry) {
        onRetry(attempt, error);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Rate limit function calls
 */
export async function rateLimit<T>(
  items: T[],
  fn: (item: T) => Promise<any>,
  options: {
    delayMs?: number;
    batchSize?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<any[]> {
  const { delayMs = 1000, batchSize = 1, onProgress } = options;

  const results: any[] = [];
  let processed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((item) => fn(item).catch((error) => ({ error })))
    );

    results.push(...batchResults);
    processed += batch.length;

    if (onProgress) {
      onProgress(processed, items.length);
    }

    // Don't sleep after the last batch
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Batch items into chunks
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T = any>(
  json: string | null | undefined,
  defaultValue: T
): T {
  if (!json) return defaultValue;

  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is older than X days
 */
export function isOlderThan(date: Date, days: number): boolean {
  return daysBetween(date, new Date()) > days;
}

/**
 * Normalize real estate address for deduplication
 * Handles common variations: "123 Main St" vs "123 Main Street"
 */
export function normalizeAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/\./g, '') // Remove periods
    .replace(/,/g, '') // Remove commas
    .replace(/\bAPT\b/g, 'APARTMENT')
    .replace(/\bSTE\b/g, 'SUITE')
    .replace(/\bST\b/g, 'STREET')
    .replace(/\bAVE\b/g, 'AVENUE')
    .replace(/\bRD\b/g, 'ROAD')
    .replace(/\bBLVD\b/g, 'BOULEVARD')
    .replace(/\bDR\b/g, 'DRIVE')
    .replace(/\bLN\b/g, 'LANE')
    .replace(/\bCT\b/g, 'COURT')
    .replace(/\bPL\b/g, 'PLACE')
    .replace(/\bPKWY\b/g, 'PARKWAY')
    .replace(/\bCIR\b/g, 'CIRCLE')
    .replace(/\bTRL\b/g, 'TRAIL')
    .replace(/\bN\b/g, 'NORTH')
    .replace(/\bS\b/g, 'SOUTH')
    .replace(/\bE\b/g, 'EAST')
    .replace(/\bW\b/g, 'WEST')
    .replace(/\bNE\b/g, 'NORTHEAST')
    .replace(/\bNW\b/g, 'NORTHWEST')
    .replace(/\bSE\b/g, 'SOUTHEAST')
    .replace(/\bSW\b/g, 'SOUTHWEST')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Deduplicate array by key
 */
export function uniqueBy<T>(items: T[], key: keyof T): T[] {
  const seen = new Set();
  return items.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Group array items by key
 */
export function groupBy<T>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
