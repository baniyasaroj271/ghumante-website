const DEFAULT_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getApiBase() {
  return typeof window !== 'undefined' && window.GHUMANTE_API_BASE
    ? String(window.GHUMANTE_API_BASE).replace(/\/$/, '')
    : '';
}

export async function fetchJson(endpoint, { signal, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const abortRequest = () => controller.abort();

  if (signal) signal.addEventListener('abort', abortRequest, { once: true });

  try {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new ApiError(`Request failed with status ${response.status}.`, response.status);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('The request timed out.');
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'The network request failed.');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}

export async function loadResource(endpoint, fallback, { signal, validate = Array.isArray, onFallback } = {}) {
  if (!getApiBase()) return Promise.resolve(fallback);

  try {
    const payload = await fetchJson(endpoint, { signal });
    if (!validate(payload)) throw new ApiError(`Invalid data returned from ${endpoint}.`);
    return payload;
  } catch (error) {
    console.warn(`Ghumante API fallback for ${endpoint}: ${error.message}`);
    onFallback?.(endpoint, error);
    return fallback;
  }
}
