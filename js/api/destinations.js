import { destinations as fallbackDestinations } from '../../data/destinations.js';
import { loadResource } from './client.js';

export function loadDestinations(options) {
  return loadResource('/api/destinations', fallbackDestinations, {
    ...options,
    validate: (payload) => Array.isArray(payload) && payload.every((item) => item && typeof item.name === 'string')
  });
}
