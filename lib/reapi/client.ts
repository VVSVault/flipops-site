/**
 * REAPI Client Service
 *
 * HTTP client for RealEstateAPI with rate limiting and error handling.
 * Uses native fetch - no axios needed.
 */

const REAPI_API_KEY = process.env.REAPI_API_KEY;
const REAPI_BASE_URL = process.env.REAPI_BASE_URL || 'https://api.realestateapi.com';

// Simple rate limiter - tracks last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms = 10 requests/sec max

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url, options);
}

export class REAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'REAPIError';
  }
}

interface REAPIResponse<T> {
  data: T | null;
  status: number;
  error?: string;
}

/**
 * Make a POST request to REAPI
 */
export async function reapiPost<T>(endpoint: string, body: unknown): Promise<REAPIResponse<T>> {
  if (!REAPI_API_KEY) {
    throw new REAPIError('REAPI_API_KEY not configured', 503, 'NOT_CONFIGURED');
  }

  const url = `${REAPI_BASE_URL}${endpoint}`;

  try {
    const response = await rateLimitedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': REAPI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Handle specific error codes
    if (response.status === 429) {
      throw new REAPIError('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    if (response.status === 402) {
      throw new REAPIError('REAPI credits exhausted. Please upgrade your plan.', 402, 'CREDITS_EXHAUSTED');
    }

    if (response.status === 404) {
      // Property not found - not an error, just no data
      return { data: null, status: 404 };
    }

    if (!response.ok) {
      const errorMsg = data?.status?.msg || data?.message || `API error: ${response.status}`;
      throw new REAPIError(errorMsg, response.status, 'API_ERROR');
    }

    return { data, status: response.status };
  } catch (error) {
    if (error instanceof REAPIError) {
      throw error;
    }
    throw new REAPIError(
      error instanceof Error ? error.message : 'Unknown REAPI error',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Make a GET request to REAPI
 */
export async function reapiGet<T>(endpoint: string, params?: Record<string, string>): Promise<REAPIResponse<T>> {
  if (!REAPI_API_KEY) {
    throw new REAPIError('REAPI_API_KEY not configured', 503, 'NOT_CONFIGURED');
  }

  let url = `${REAPI_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await rateLimitedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': REAPI_API_KEY,
      },
    });

    const data = await response.json();

    if (response.status === 429) {
      throw new REAPIError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }

    if (response.status === 402) {
      throw new REAPIError('Credits exhausted', 402, 'CREDITS_EXHAUSTED');
    }

    if (response.status === 404) {
      return { data: null, status: 404 };
    }

    if (!response.ok) {
      const errorMsg = data?.status?.msg || data?.message || `API error: ${response.status}`;
      throw new REAPIError(errorMsg, response.status, 'API_ERROR');
    }

    return { data, status: response.status };
  } catch (error) {
    if (error instanceof REAPIError) {
      throw error;
    }
    throw new REAPIError(
      error instanceof Error ? error.message : 'Unknown REAPI error',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Check if REAPI is configured
 */
export function isREAPIConfigured(): boolean {
  return !!REAPI_API_KEY;
}

/**
 * Get configured REAPI API key (masked for logging)
 */
export function getREAPIKeyMasked(): string {
  if (!REAPI_API_KEY) return 'NOT_SET';
  return `${REAPI_API_KEY.substring(0, 8)}...${REAPI_API_KEY.substring(REAPI_API_KEY.length - 4)}`;
}
