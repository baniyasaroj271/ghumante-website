const activeRequests = new Map();
let loaderElement;
let loaderMessage;

function ensureLoader() {
  loaderElement ||= document.querySelector('#app-loader');
  loaderMessage ||= document.querySelector('#app-loader-message');
  return loaderElement;
}

export function showLoader(message = 'Loading your valley guide...') {
  if (!ensureLoader()) return;
  loaderMessage.textContent = message;
  loaderElement.hidden = false;
  loaderElement.setAttribute('aria-busy', 'true');
}

export function hideLoader() {
  if (!ensureLoader()) return;
  loaderElement.hidden = true;
  loaderElement.setAttribute('aria-busy', 'false');
}

export async function withLoading(key, task, message) {
  activeRequests.set(key, (activeRequests.get(key) || 0) + 1);
  showLoader(message);
  try {
    return await task();
  } finally {
    const remaining = (activeRequests.get(key) || 1) - 1;
    if (remaining) activeRequests.set(key, remaining);
    else activeRequests.delete(key);
    if (!activeRequests.size) hideLoader();
  }
}
