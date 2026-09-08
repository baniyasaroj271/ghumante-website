import { nearbyPlaces as fallbackNearbyPlaces } from '../../data/nearby-places.js';
import { loadResource } from './client.js';

export function loadNearbyPlaces(options) {
  return loadResource('/api/nearby-places', fallbackNearbyPlaces, {
    ...options,
    validate: (payload) => Array.isArray(payload) && payload.every((item) => item && typeof item.name === 'string')
  });
}
