import { sajhaBusStops as fallbackBusStops } from '../../data/sajha-transit.js';
import { emergencyServices as fallbackEmergencyServices } from '../../data/emergency-services.js';
import { loadResource } from './client.js';

export async function loadMapData(options) {
  const [busStops, emergencyServices] = await Promise.all([
    loadResource('/api/map/stops', fallbackBusStops, {
      ...options,
      validate: (payload) => Array.isArray(payload) && payload.every((item) => item && typeof item.name === 'string')
    }),
    loadResource('/api/map/emergency-services', fallbackEmergencyServices, {
      ...options,
      validate: (payload) => Array.isArray(payload) && payload.every((item) => item && typeof item.name === 'string')
    })
  ]);
  return { busStops, emergencyServices };
}
