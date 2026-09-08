import { sajhaRoutes as fallbackRoutes, transitSource } from '../../data/sajha-transit.js';
import { loadResource } from './client.js';

function normalizeRoute(route) {
  const stops = Array.isArray(route.stops) ? route.stops : [route.from, route.to].filter(Boolean);
  return {
    ...route,
    from: route.from || stops[0],
    to: route.to || stops[stops.length - 1],
    bus: route.bus || `${route.operator || transitSource.operator} route`,
    duration: route.duration || 'Time not published',
    durationMinutes: Number.isFinite(route.durationMinutes) ? route.durationMinutes : null,
    transfers: Number.isFinite(route.transfers) ? route.transfers : 0,
    walkingDistanceMeters: Number.isFinite(route.walkingDistanceMeters) ? route.walkingDistanceMeters : null,
    intermediateStops: stops.slice(1, -1).map((name) => ({ name, coordinates: null })),
    boardingStop: { name: stops[0], coordinates: null },
    destinationStop: { name: stops[stops.length - 1], coordinates: null },
    startCoordinates: null,
    destinationCoordinates: null,
    source: route.source || transitSource.url,
    dataQuality: route.dataQuality || transitSource.status,
    stops
  };
}

export async function loadBusRoutes(options) {
  const routes = await loadResource('/api/routes', fallbackRoutes, {
    ...options,
    validate: (payload) => Array.isArray(payload) && payload.every((item) => item
      && typeof item.from === 'string'
      && typeof item.to === 'string'
      && typeof item.bus === 'string'
      && Array.isArray(item.stops)
      && item.stops.length >= 2)
  });
  const normalizedRoutes = routes.map(normalizeRoute);
  return { routes: normalizedRoutes, routeStops: [...new Set(normalizedRoutes.flatMap((route) => route.stops))].sort() };
}
