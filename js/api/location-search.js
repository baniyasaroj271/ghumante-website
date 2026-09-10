export function createLocationSearch({ destinations, routes, busStops, valleyLocations = [] }) {
  const locations = [...new Map([
    ...valleyLocations.map((location) => [location.name.toLowerCase(), location]),
    ...routes.flatMap((route) => [route.from, route.to]).map((name) => [name, { name, city: 'Kathmandu Valley', type: 'Transit stop' }]),
    ...busStops.map((stop) => [stop.name, { name: stop.name, city: stop.location, type: 'Bus stop' }]),
    ...destinations.map((destination) => [destination.name, { name: destination.name, city: destination.city, type: destination.type, aliases: destination.aliases || [] }])
  ]).values()];

  function matchingLocations(query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return locations.filter((location) => [location.name, location.city, location.type, ...(location.aliases || [])].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery))).slice(0, 5);
  }

  function resolveLocation(value) {
    const normalizedValue = value.trim().toLowerCase();
    return locations.find((location) => [location.name, ...(location.aliases || [])].filter(Boolean).some((name) => String(name).toLowerCase() === normalizedValue));
  }

  return { locations, matchingLocations, resolveLocation };
}
