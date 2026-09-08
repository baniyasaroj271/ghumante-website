import { loadDestinations } from './api/destinations.js';
import { loadBusRoutes } from './api/routes.js';
import { loadMapData } from './api/map.js';
import { loadNearbyPlaces } from './api/nearby.js';
import { createLocationSearch } from './api/location-search.js';
import { withLoading, showLoader, hideLoader } from './api/loading.js';

let destinations = [];
let routes = [];
let routeStops = [];
let busStops = [];
let nearbyPlaces = [];
let emergencyServices = [];
let locationSearch = { matchingLocations: () => [], resolveLocation: () => undefined };

const destinationGrid = document.querySelector('#destination-grid');
const favoritesList = document.querySelector('#favorites-list');
const favoritesCount = document.querySelector('#favorites-count');
const recentList = document.querySelector('#recent-list');
const itineraryPicker = document.querySelector('#itinerary-picker');
const itineraryList = document.querySelector('#itinerary-list');
const itineraryTransit = document.querySelector('#itinerary-transit');
const itinerarySummary = document.querySelector('#itinerary-summary');
const itineraryClear = document.querySelector('#itinerary-clear');
const itineraryDayButtons = document.querySelectorAll('[data-itinerary-days]');
const cityFilters = document.querySelectorAll('[data-city]');
const categoryFilters = document.querySelectorAll('[data-category]');
const routeForm = document.querySelector('#route-form');
const routeFrom = document.querySelector('#route-from');
const routeTo = document.querySelector('#route-to');
const routeFromSuggestions = document.querySelector('#route-from-suggestions');
const routeToSuggestions = document.querySelector('#route-to-suggestions');
const routeResult = document.querySelector('#route-result');
const routeOptions = document.querySelector('#route-options');
const stopDetails = document.querySelector('#stop-details');
const stopDetailsTitle = document.querySelector('#stop-details-title');
const stopDetailsLocation = document.querySelector('#stop-details-location');
const stopDetailsRoutes = document.querySelector('#stop-details-routes');
const stopDetailsAttractions = document.querySelector('#stop-details-attractions');
const stopDetailsWalking = document.querySelector('#stop-details-walking');
const stopDetailsClose = document.querySelector('#stop-details-close');
const nearbyOriginName = document.querySelector('#nearby-origin-name');
const nearbyOriginNote = document.querySelector('#nearby-origin-note');
const nearbyFeedback = document.querySelector('#nearby-feedback');
const nearbyGrid = document.querySelector('#nearby-grid');
const emergencyGrid = document.querySelector('#emergency-grid');
const useLocationButton = document.querySelector('#use-location');
const radiusButtons = document.querySelectorAll('[data-radius]');
const destinationSearch = document.querySelector('#destination-search');
const destinationQuery = document.querySelector('#destination-query');
const searchSuggestions = document.querySelector('#search-suggestions');
const searchFeedback = document.querySelector('#search-feedback');
const destinationDetail = document.querySelector('#destination-detail');
const detailImage = document.querySelector('#detail-image');
const detailCategory = document.querySelector('#detail-category');
const detailTitle = document.querySelector('#detail-title');
const detailLocation = document.querySelector('#detail-location');
const detailCoordinates = document.querySelector('#detail-coordinates');
const detailDescription = document.querySelector('#detail-description');
const detailFacts = document.querySelector('#detail-facts');
const detailBusStops = document.querySelector('#detail-bus-stops');
const detailAttractions = document.querySelector('#detail-attractions');
const detailTransportOptions = document.querySelector('#detail-transport-options');
const detailDistance = document.querySelector('#detail-distance');
const detailClose = document.querySelector('#detail-close');
const detailRoute = document.querySelector('#detail-route');
const detailMap = document.querySelector('#detail-map');
const appFeedback = document.querySelector('#app-feedback');
const mapFeedback = document.querySelector('#map-feedback');
let valleyMap;
let activeRouteLayer;
let activeNearbyLayer;
let nearbyOrigin;
let nearbyRadius = 500;
let activeCity = 'all';
let activeCategory = 'all';
let selectedDestination;
let currentUserCoordinates;
const photoFallback = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80';
const destinationMarkers = new Map();
const emergencyMarkers = new Map();
const storageKeys = {
  favorites: 'ghumante:favorites',
  recent: 'ghumante:recent-viewed',
  itinerary: 'ghumante:itinerary'
};
const itineraryState = {
  days: 1,
  selectedIds: []
};

function showAppMessage(message) {
  if (!appFeedback) return;
  appFeedback.textContent = message;
  appFeedback.hidden = false;
}

function clearAppMessage() {
  if (appFeedback) appFeedback.hidden = true;
}

function reportDataFallback() {
  showAppMessage('Some live information is unavailable, so Ghumante is showing its saved Kathmandu Valley guide instead.');
}

function hasCoordinates(value) {
  return Array.isArray(value) && value.length >= 2 && value.every((coordinate) => Number.isFinite(Number(coordinate)));
}
function getDestinationById(id) {
  return destinations.find((destination) => destination.id === id);
}

function loadStoredArray(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function saveStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFavoriteIds() {
  return loadStoredArray(storageKeys.favorites);
}

function setFavoriteIds(ids) {
  saveStoredArray(storageKeys.favorites, ids);
  renderFavorites();
  renderDestinations();
}

function isFavorited(destinationId) {
  return getFavoriteIds().includes(destinationId);
}

function toggleFavorite(destinationId) {
  const nextIds = isFavorited(destinationId) ? getFavoriteIds().filter((id) => id !== destinationId) : [...getFavoriteIds(), destinationId];
  setFavoriteIds(nextIds);
}

function getRecentIds() {
  return loadStoredArray(storageKeys.recent);
}

function saveRecentDestination(destinationId) {
  const nextIds = [destinationId, ...getRecentIds().filter((id) => id !== destinationId)].slice(0, 5);
  saveStoredArray(storageKeys.recent, nextIds);
  renderRecentDestinations();
}

function loadItinerary() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKeys.itinerary) || '{}');
    if (Array.isArray(stored.selectedIds)) itineraryState.selectedIds = stored.selectedIds.filter((id) => getDestinationById(id));
    if (Number.isInteger(stored.days) && stored.days >= 1) itineraryState.days = stored.days;
  } catch {
    itineraryState.selectedIds = [];
  }
}

function saveItinerary() {
  saveStoredArray(storageKeys.itinerary, itineraryState);
}

function routeMatchFor(first, second) {
  const match = routes.filter((route) => route.from === first.name && route.to === second.name).sort(compareRoutes)[0];
  if (match) return `${match.bus} in about ${match.duration}.`;
  const fallback = routes.filter((route) => route.from === second.name && route.to === first.name).sort(compareRoutes)[0];
  if (fallback) return `No direct listed route yet. Reverse the journey with ${fallback.bus} and plan a short return walk.`;
  return `Take a local bus from ${first.name} toward ${second.city || 'the valley centre'} and ask for ${second.name}.`;
}

function renderFavorites() {
  const favoriteIds = getFavoriteIds();
  favoritesCount.textContent = `${favoriteIds.length} saved`;
  favoritesList.innerHTML = favoriteIds.length ? favoriteIds.map((id) => {
    const destination = getDestinationById(id);
    if (!destination) return '';
    return `<article class="saved-item"><div><h4>${destination.name}</h4><p>${destination.city} Ã‚Â· ${destination.location}</p></div><div class="saved-item-actions"><button type="button" class="saved-link" data-open-destination="${destination.id}">Open</button><button type="button" class="saved-link" data-favorite-id="${destination.id}">${isFavorited(destination.id) ? 'Remove' : 'Save'}</button><button type="button" class="saved-link" data-route-destination="${destination.name}">Bus route</button></div></article>`;
  }).join('') : '<p class="saved-empty">No favorites yet. Save a place from the destination cards or detail view.</p>';
}

function renderRecentDestinations() {
  const recentIds = getRecentIds();
  recentList.innerHTML = recentIds.length ? recentIds.map((id) => {
    const destination = getDestinationById(id);
    if (!destination) return '';
    return `<button type="button" class="recent-item" data-open-destination="${destination.id}"><strong>${destination.name}</strong><span>${destination.city} Ã‚Â· ${destination.type}</span></button>`;
  }).join('') : '<p class="saved-empty">Your five most recent destinations will appear here after you open them.</p>';
}

function renderItineraryPicker() {
  itineraryPicker.innerHTML = destinations.map((destination) => `
    <label class="itinerary-choice">
      <input type="checkbox" data-itinerary-id="${destination.id}" ${itineraryState.selectedIds.includes(destination.id) ? 'checked' : ''} />
      <span>
        <strong>${destination.name}</strong>
        <small>${destination.city} Ã‚Â· ${destination.type}</small>
      </span>
    </label>
  `).join('');
}

function renderItinerary() {
  const selectedDestinations = itineraryState.selectedIds.map((id) => getDestinationById(id)).filter(Boolean);
  itinerarySummary.textContent = selectedDestinations.length ? `${selectedDestinations.length} stop${selectedDestinations.length === 1 ? '' : 's'} selected Ã‚Â· ${itineraryState.days} day${itineraryState.days === 1 ? '' : 's'}` : 'No stops selected';
  itineraryList.innerHTML = selectedDestinations.length ? selectedDestinations.map((destination, index) => `
    <li class="itinerary-stop">
      <div class="itinerary-stop-meta">
        <span class="itinerary-stop-index">${index + 1}</span>
        <div>
          <h4>${destination.name}</h4>
          <p>${destination.city} Ã‚Â· ${destination.location}</p>
        </div>
      </div>
      <div class="itinerary-stop-actions">
        <button type="button" class="saved-link" data-itinerary-move="${destination.id}" data-direction="up">Up</button>
        <button type="button" class="saved-link" data-itinerary-move="${destination.id}" data-direction="down">Down</button>
        <button type="button" class="saved-link" data-open-destination="${destination.id}">Open</button>
      </div>
    </li>
  `).join('') : '<li class="saved-empty">Select destinations from the checklist to build a plan.</li>';
  itineraryTransit.innerHTML = selectedDestinations.length > 1 ? selectedDestinations.slice(0, -1).map((destination, index) => {
    const nextDestination = selectedDestinations[index + 1];
    return `<article class="itinerary-leg"><h4>${destination.name} to ${nextDestination.name}</h4><p>${routeMatchFor(destination, nextDestination)}</p></article>`;
  }).join('') : '<p class="saved-empty">Choose at least two destinations to see public transportation suggestions between stops.</p>';
  saveItinerary();
}

function toggleItineraryDestination(destinationId) {
  if (itineraryState.selectedIds.includes(destinationId)) {
    itineraryState.selectedIds = itineraryState.selectedIds.filter((id) => id !== destinationId);
  } else {
    itineraryState.selectedIds = [...itineraryState.selectedIds, destinationId];
  }
  renderItineraryPicker();
  renderItinerary();
}

function moveItineraryDestination(destinationId, direction) {
  const index = itineraryState.selectedIds.indexOf(destinationId);
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= itineraryState.selectedIds.length) return;
  const nextIds = [...itineraryState.selectedIds];
  [nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]];
  itineraryState.selectedIds = nextIds;
  renderItineraryPicker();
  renderItinerary();
}

function renderDestinations() {
  const visibleDestinations = destinations.filter((destination) => (activeCity === 'all' || destination.city === activeCity) && (activeCategory === 'all' || destination.category === activeCategory));
  destinationGrid.innerHTML = visibleDestinations.map((destination, index) => `
    <article class="destination-card tone-${destination.tone}" style="--card-order: ${index}">
      <img class="card-photo" src="${destination.image}" alt="${destination.name}" loading="lazy" onerror="this.onerror=null;this.src='${photoFallback}'" />
      <div class="card-content"><div class="card-meta"><span>${destination.category || 'Destination'}</span><span>${destination.tag || 'Worth a stop'}</span></div><h3>${destination.name || 'Unnamed destination'}</h3><p class="card-location">${destination.location || 'Kathmandu Valley'}</p><p>${destination.description || 'Travel information is not available for this place yet.'}</p><div class="card-visit-meta"><span>${destination.duration || 'Plan ahead'}</span><span>${(destination.openingHours || 'Check locally').split(';')[0]}</span></div><div class="card-actions"><button class="card-link" type="button" data-detail-id="${destination.id}">View details <span aria-hidden="true">â†’</span></button><button class="card-link" type="button" data-destination-map="${destination.id}">View on map <span aria-hidden="true">â†’</span></button><button class="card-link" type="button" data-destination="${destination.name}">How to get here <span aria-hidden="true">â†’</span></button><button class="card-link" type="button" data-favorite-id="${destination.id}">${isFavorited(destination.id) ? 'Remove favorite' : 'Save favorite'} <span aria-hidden="true">â˜…</span></button></div></div>
    </article>
  `).join('');
}

function showDestinationDetail(destination) {
  if (!destination) {
    showAppMessage('We could not find that destination. Please choose a place from the suggested results.');
    return;
  }
  selectedDestination = destination;
  saveRecentDestination(destination.id);
  detailImage.src = destination.image;
  detailImage.onerror = () => { detailImage.src = photoFallback; };
  detailImage.alt = destination.name;
  detailCategory.textContent = `${destination.category} Ã‚Â· ${destination.type}`;
  detailTitle.textContent = destination.name;
  detailLocation.textContent = destination.location;
  detailCoordinates.textContent = hasCoordinates(destination.coordinates)
    ? `Exact location: ${Number(destination.coordinates[0]).toFixed(4)} degrees N, ${Number(destination.coordinates[1]).toFixed(4)} degrees E`
    : 'Exact map location is not available for this place yet.';
  detailDescription.textContent = destination.detail;
  detailFacts.innerHTML = `<div><span>Visit duration</span><strong>${destination.duration}</strong></div><div><span>Opening information</span><strong>${destination.openingHours}</strong></div><div><span>Entrance fee</span><strong>${formatNprFee(destination.entranceFee)}</strong></div><div><span>Best time to visit</span><strong>${destination.recommendedTime}</strong></div>`;
  const verifiedNearbyStops = getVerifiedBusStops(destination);
  detailBusStops.innerHTML = verifiedNearbyStops.length
    ? verifiedNearbyStops.map((stop) => `<li>${stop}</li>`).join('')
    : '<li>Nearby bus stop information is not available yet.</li>';
  detailAttractions.innerHTML = (destination.nearbyAttractions || []).length
    ? destination.nearbyAttractions.map((place) => `<li>${place}</li>`).join('')
    : '<li>Nearby attraction information is not available yet.</li>';
  detailTransportOptions.innerHTML = getTransportOptions(destination).map((option) => `<li>${option}</li>`).join('');
  updateDetailDistance();
  destinationDetail.hidden = false;
  destinationDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getTransportOptions(destination) {
  const nearestStop = getVerifiedBusStops(destination)[0];
  return [
    destination.busOrigin ? `Public bus from ${destination.busOrigin}; ask for the nearest stop to ${destination.name}.` : 'Ask locally for the nearest public bus stop and confirm the destination with the conductor.',
    nearestStop ? `Walk from ${nearestStop} using local signs and landmarks.` : 'Walking directions are not available for this place yet.',
    'Taxi or rideshare directly to the destination entrance.'
  ];
}

function getVerifiedBusStops(destination) {
  const knownStops = new Set(busStops.map((stop) => stop.name));
  return (destination.nearbyBusStops || []).filter((stopName) => knownStops.has(stopName));
}

function updateDetailDistance() {
  if (!selectedDestination) return;
  detailDistance.textContent = currentUserCoordinates && hasCoordinates(selectedDestination.coordinates)
    ? `${formatDistance(distanceInMeters(currentUserCoordinates, selectedDestination.coordinates))} from your current location.`
    : 'Distance from your current location is available after selecting "Use my location" in Nearby Places.';
}

function focusDestinationOnMap(destination) {
  if (!destination) {
    showAppMessage('We could not find that destination. Please choose a place from the guide.');
    return;
  }
  if (!hasCoordinates(destination.coordinates)) {
    showAppMessage('The map location for this destination is not available yet. You can still view its travel information.');
    return;
  }
  valleyMap?.flyTo(destination.coordinates, 15, { duration: .7 });
  destinationMarkers.get(destination.id)?.openPopup();
  setNearbyOrigin({ name: destination.name, coordinates: destination.coordinates }, `${destination.city} Ã‚Â· ${destination.type}`);
}

function prepareBusRoute(destination) {
  if (!destination) {
    showAppMessage('We could not find that destination. Please choose a place from the guide.');
    return;
  }
  routeTo.value = destination.name;
  document.querySelector('#routes')?.scrollIntoView({ behavior: 'smooth' });
  routeTo.focus();
}

function matchingLocations(query) {
  return locationSearch.matchingLocations(query);
}

function renderRouteSuggestions(input, container) {
  const matches = matchingLocations(input.value);
  container.innerHTML = matches.map((location) => `<button type="button" role="option" data-route-location="${location.name}" data-route-input="${input.id}"><strong>${location.name}</strong><span>${location.city} Ã‚Â· ${location.type}</span></button>`).join('');
  input.setAttribute('aria-expanded', String(matches.length > 0));
}

function resolveLocation(value) {
  return locationSearch.resolveLocation(value);
}

function routesBetween(fromName, toName) {
  return routes.map((route) => {
    const startIndex = route.stops.indexOf(fromName);
    const endIndex = route.stops.indexOf(toName);
    if (startIndex < 0 || endIndex <= startIndex) return null;
    const stops = route.stops.slice(startIndex, endIndex + 1);
    return {
      ...route,
      id: `${route.id}-${startIndex}-${endIndex}`,
      from: fromName,
      to: toName,
      stops,
      boardingStop: { name: stops[0], coordinates: null },
      intermediateStops: stops.slice(1, -1).map((name) => ({ name, coordinates: null })),
      destinationStop: { name: stops[stops.length - 1], coordinates: null },
      duration: 'Time not published for this section',
      walkingDistanceMeters: null
    };
  }).filter(Boolean).sort(compareRoutes);
}

function showRoute(event) {
  event.preventDefault();
  return withLoading('bus-route', async () => {
  const fromLocation = resolveLocation(routeFrom.value);
  const toLocation = resolveLocation(routeTo.value);
  if (!fromLocation || !toLocation) {
    const invalidFields = [!fromLocation && 'starting point', !toLocation && 'destination'].filter(Boolean).join(' and ');
    routeResult.innerHTML = `<p class="route-empty">Choose a valid ${invalidFields} from the Kathmandu Valley suggestions, then try again.</p>`;
    return;
  }
  if (!routes.length) {
    routeResult.innerHTML = '<p class="route-empty">Bus route information is unavailable right now. Please try again shortly.</p>';
    routeOptions.innerHTML = '';
    return;
  }
  const matchingRoutes = routesBetween(fromLocation.name, toLocation.name);
  if (!matchingRoutes.length) {
    routeResult.innerHTML = `<p class="route-empty">${fromLocation.name} and ${toLocation.name} are inside Kathmandu Valley, but that exact pairing is not in the guide yet. Try another suggested destination.</p>`;
    routeOptions.innerHTML = '';
    clearRouteFromMap();
    return;
  }
  const recommendedRoute = matchingRoutes[0];
  routeResult.innerHTML = `<div class="route-answer"><span class="route-icon" aria-hidden="true">Ã¢â€ â€”</span><div><strong>${recommendedRoute.bus}</strong><p>Recommended for ${recommendedRoute.from} to ${recommendedRoute.to}</p><small>${recommendationReason(recommendedRoute, matchingRoutes)}</small></div></div>`;
  renderRouteOptions(matchingRoutes, recommendedRoute.id);
  showRouteOnMap(recommendedRoute);
  }, 'Finding the best route for you...').catch((error) => {
    console.error('Route search failed:', error);
    routeResult.innerHTML = '<p class="route-empty">We could not load route information right now. Please try again.</p>';
    routeOptions.innerHTML = '';
  });
}

function compareRoutes(firstRoute, secondRoute) {
  const firstDuration = Number.isFinite(firstRoute.durationMinutes) ? firstRoute.durationMinutes : Number.POSITIVE_INFINITY;
  const secondDuration = Number.isFinite(secondRoute.durationMinutes) ? secondRoute.durationMinutes : Number.POSITIVE_INFINITY;
  const firstWalking = Number.isFinite(firstRoute.walkingDistanceMeters) ? firstRoute.walkingDistanceMeters : Number.POSITIVE_INFINITY;
  const secondWalking = Number.isFinite(secondRoute.walkingDistanceMeters) ? secondRoute.walkingDistanceMeters : Number.POSITIVE_INFINITY;
  return firstDuration - secondDuration || firstRoute.transfers - secondRoute.transfers || firstWalking - secondWalking;
}

function recommendationReason(route, allRoutes) {
  const publishedDurations = allRoutes.map((item) => item.durationMinutes).filter(Number.isFinite);
  const publishedWalking = allRoutes.map((item) => item.walkingDistanceMeters).filter(Number.isFinite);
  const shortestTime = Number.isFinite(route.durationMinutes) && route.durationMinutes === Math.min(...publishedDurations);
  const fewestTransfers = allRoutes.length > 1 && route.transfers === Math.min(...allRoutes.map((item) => item.transfers));
  const shortestWalk = Number.isFinite(route.walkingDistanceMeters) && route.walkingDistanceMeters === Math.min(...publishedWalking);
  const reasons = [shortestTime && 'shortest published travel time', fewestTransfers && 'fewest transfers', shortestWalk && 'shortest published walking distance'].filter(Boolean);
  return reasons.length ? `Recommended because it has the ${reasons.join(', and the ')}.` : 'Published stop sequence only; travel times and walking distances are not available.';
}

function renderRouteOptions(routeList, recommendedId) {
  routeOptions.innerHTML = routeList.map((route, index) => `
    <article class="route-card ${route.id === recommendedId ? 'is-recommended' : ''}">
      <div class="route-card-top"><div><span class="route-card-label">${route.id === recommendedId ? 'Recommended route' : `Option ${index + 1}`}</span><h3>${route.bus}</h3></div><button class="route-map-button" type="button" data-route-id="${route.id}">Show on map <span aria-hidden="true">Ã¢â€ â€”</span></button></div>
      <div class="route-stats"><span><strong>${route.duration}</strong> travel</span><span><strong>${route.transfers === 1 ? '1' : '0'}</strong> transfers within route</span><span><strong>${Number.isFinite(route.walkingDistanceMeters) ? `${route.walkingDistanceMeters} m` : 'Not published'}</strong> walking</span></div>
      <ol class="journey-steps">${renderJourneySteps(route)}</ol>
      <p>${route.note}</p><p class="route-source-note">Source: <a href="${route.source}" target="_blank" rel="noopener">Sajha Yatayat</a>. No live vehicle status or timetable is provided.</p>
    </article>
  `).join('');
}

function renderJourneySteps(route) {
  const walkToStop = Number.isFinite(route.walkingDistanceMeters) ? `${Math.round(route.walkingDistanceMeters * 0.55)} m` : 'distance not published';
  const walkToDestination = Number.isFinite(route.walkingDistanceMeters) ? `${route.walkingDistanceMeters - Math.round(route.walkingDistanceMeters * 0.55)} m` : 'distance not published';
  const intermediateNames = route.intermediateStops.length ? ` Stay on through ${route.intermediateStops.map((stop) => stop.name).join(' and ')}.` : '';
  return [
    `<li><span class="journey-step-icon">1</span><div><strong>Walk to bus stop</strong><p>Walk from ${route.from} to <button class="stop-link" type="button" data-stop-name="${route.boardingStop.name}">${route.boardingStop.name}</button> (${walkToStop}).</p></div></li>`,
    `<li><span class="journey-step-icon">2</span><div><strong>Take bus</strong><p>Board the <strong>${route.bus}</strong> toward ${route.destinationStop.name}.${intermediateNames}</p></div></li>`,
    `<li><span class="journey-step-icon">3</span><div><strong>Get off at stop</strong><p>Get off at <button class="stop-link" type="button" data-stop-name="${route.destinationStop.name}">${route.destinationStop.name}</button>.</p></div></li>`,
    `<li><span class="journey-step-icon">4</span><div><strong>Walk to destination</strong><p>Follow the final signs from ${route.destinationStop.name} to ${route.to} (${walkToDestination}).</p></div></li>`
  ].join('');
}

function clearRouteFromMap() {
  if (activeRouteLayer) {
    activeRouteLayer.clearLayers();
    valleyMap.removeLayer(activeRouteLayer);
    activeRouteLayer = null;
  }
}

function createRouteMarker(coordinates, kind, title, stopName) {
  const marker = L.marker(coordinates, { icon: L.divIcon({ className: `route-marker route-marker-${kind}`, html: `<span></span>`, iconSize: [18, 18], iconAnchor: [9, 9] }) }).bindPopup(`<strong>${title}</strong>`);
  if (stopName) marker.on('click', () => showStopDetails(stopName));
  return marker;
}

function showRouteOnMap(route) {
  const routeCoordinates = [route.startCoordinates, route.boardingStop.coordinates, ...route.intermediateStops.map((stop) => stop.coordinates), route.destinationStop.coordinates, route.destinationCoordinates];
  if (!routeCoordinates.every(hasCoordinates)) {
    showAppMessage('This verified route has no published stop coordinates yet, so the route steps are shown without a drawn line on the map.');
    return;
  }
  if (!valleyMap || typeof L === 'undefined') {
    showAppMessage('The map is unavailable right now, but the route steps above are still ready to follow.');
    return;
  }
  clearRouteFromMap();
  activeRouteLayer = L.layerGroup().addTo(valleyMap);
  const busCoordinates = [route.boardingStop.coordinates, ...route.intermediateStops.map((stop) => stop.coordinates), route.destinationStop.coordinates];
  const walkingStart = L.polyline([route.startCoordinates, route.boardingStop.coordinates], { color: '#e97855', dashArray: '5 8', weight: 4 }).bindTooltip('Walk to boarding stop').addTo(activeRouteLayer);
  const busLine = L.polyline(busCoordinates, { color: '#216766', weight: 6 }).bindTooltip(`${route.bus} Ã‚Â· ${route.duration}`).addTo(activeRouteLayer);
  const walkingEnd = L.polyline([route.destinationStop.coordinates, route.destinationCoordinates], { color: '#e97855', dashArray: '5 8', weight: 4 }).bindTooltip('Walk to final destination').addTo(activeRouteLayer);
  createRouteMarker(route.startCoordinates, 'start', `Start: ${route.from}`).addTo(activeRouteLayer);
  createRouteMarker(route.boardingStop.coordinates, 'stop', `Board: ${route.boardingStop.name}`, route.boardingStop.name).addTo(activeRouteLayer);
  route.intermediateStops.forEach((stop) => createRouteMarker(stop.coordinates, 'stop', `Change: ${stop.name}`, stop.name).addTo(activeRouteLayer));
  createRouteMarker(route.destinationStop.coordinates, 'stop', `Alight: ${route.destinationStop.name}`, route.destinationStop.name).addTo(activeRouteLayer);
  createRouteMarker(route.destinationCoordinates, 'destination', `Destination: ${route.to}`).addTo(activeRouteLayer);
  const routeBounds = L.latLngBounds([route.startCoordinates, ...busCoordinates, route.destinationCoordinates]);
  valleyMap.fitBounds(routeBounds, { padding: [35, 35], maxZoom: 14 });
}

function showStopDetails(stopName) {
  const stop = busStops.find((item) => item.name === stopName);
  if (!stop) return;
  stopDetailsTitle.textContent = stop.name;
  stopDetailsLocation.textContent = stop.location;
  stopDetailsRoutes.innerHTML = stop.routes.map((route) => `<li>${route}</li>`).join('');
  stopDetailsAttractions.innerHTML = stop.nearbyAttractions.map((attraction) => `<li>${attraction}</li>`).join('');
  stopDetailsWalking.textContent = stop.walkingDirections;
  stopDetails.hidden = false;
  setNearbyOrigin({ name: stop.name, coordinates: stop.coordinates }, stop.location);
  if (hasCoordinates(stop.coordinates)) valleyMap?.flyTo(stop.coordinates, 15, { duration: 0.6 });
  stopDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeStopDetails() {
  stopDetails.hidden = true;
}

function distanceInMeters(firstCoordinates, secondCoordinates) {
  const earthRadius = 6371000;
  const latitudeDelta = (secondCoordinates[0] - firstCoordinates[0]) * Math.PI / 180;
  const longitudeDelta = (secondCoordinates[1] - firstCoordinates[1]) * Math.PI / 180;
  const firstLatitude = firstCoordinates[0] * Math.PI / 180;
  const secondLatitude = secondCoordinates[0] * Math.PI / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.sin(longitudeDelta / 2) ** 2 * Math.cos(firstLatitude) * Math.cos(secondLatitude);
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistance(distance) {
  return distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
}

function formatNprFee(fee) {
  if (typeof fee === 'number' && Number.isFinite(fee)) return `NPR ${fee.toLocaleString('en-NP')}`;
  if (typeof fee === 'string') {
    const normalized = fee.trim().toLowerCase();
    if (normalized === 'free' || normalized.includes('no general') || normalized.includes('no entrance')) return 'Free';
    const exactNpr = fee.match(/(?:npr|rs\.?|रु\.?)[\s.]*(\d[\d,]*)/i);
    if (exactNpr && !normalized.includes('around')) return `NPR ${Number(exactNpr[1].replaceAll(',', '')).toLocaleString('en-NP')}`;
  }
  return 'Information unavailable';
}

function nearbyCategoryClass(category) {
  return category.toLowerCase().replaceAll(' ', '-');
}

function setNearbyOrigin(origin, note) {
  if (!origin || !hasCoordinates(origin.coordinates)) {
    nearbyFeedback.textContent = 'Location details are unavailable for this place. Choose another destination or bus stop.';
    nearbyOrigin = undefined;
    return;
  }
  nearbyOrigin = origin;
  nearbyOriginName.textContent = origin.name;
  nearbyOriginNote.textContent = note;
  renderNearbyPlaces();
}

function clearNearbyFromMap() {
  if (activeNearbyLayer) {
    activeNearbyLayer.clearLayers();
    valleyMap.removeLayer(activeNearbyLayer);
    activeNearbyLayer = null;
  }
}

function drawNearbyPlaces(results) {
  clearNearbyFromMap();
  if (!nearbyOrigin || !valleyMap) return;
  activeNearbyLayer = L.layerGroup().addTo(valleyMap);
  L.circle(nearbyOrigin.coordinates, { color: '#e9be4c', fillColor: '#e9be4c', fillOpacity: .08, radius: nearbyRadius, weight: 2, dashArray: '5 6' }).addTo(activeNearbyLayer);
  results.forEach((place) => {
    const marker = L.marker(place.coordinates, { icon: L.divIcon({ className: `nearby-marker category-${nearbyCategoryClass(place.category)}`, html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] }) });
    marker.bindPopup(`<strong>${place.name}</strong><br><span>${place.category} Ã‚Â· ${formatDistance(place.distance)}</span>`).on('click', () => showNearbyPlace(place));
    marker.addTo(activeNearbyLayer);
  });
}

function renderNearbyPlaces() {
  return withLoading('nearby-places', async () => {
  if (!nearbyOrigin) {
    nearbyGrid.innerHTML = '';
    nearbyFeedback.textContent = 'Select a destination, bus stop, or your browser location to see nearby places.';
    clearNearbyFromMap();
    return;
  }
  const results = nearbyPlaces.filter((place) => hasCoordinates(place.coordinates)).map((place) => ({ ...place, distance: distanceInMeters(nearbyOrigin.coordinates, place.coordinates) })).filter((place) => place.distance <= nearbyRadius).sort((firstPlace, secondPlace) => firstPlace.distance - secondPlace.distance);
  const radiusLabel = nearbyRadius < 1000 ? `${nearbyRadius} m` : `${nearbyRadius / 1000} km`;
  nearbyFeedback.textContent = results.length ? `${results.length} places within ${radiusLabel} of ${nearbyOrigin.name}.` : `No listed places within ${radiusLabel} of ${nearbyOrigin.name}. Try a wider radius.`;
  nearbyGrid.innerHTML = results.map((place) => `
    <article class="nearby-card">
      <div class="nearby-card-heading"><span class="nearby-category category-${nearbyCategoryClass(place.category)}">${place.category}</span><span class="nearby-distance">${formatDistance(place.distance)}</span></div>
      <h3>${place.name}</h3><p>${place.description}</p>
      <div class="nearby-card-footer"><span>Walk from ${nearbyOrigin.name}</span><button type="button" class="nearby-map-button" data-nearby-id="${place.id}">View on map <span aria-hidden="true">Ã¢â€ â€”</span></button></div>
      <p class="nearby-directions"><strong>Walking:</strong> ${place.walkingDirections}</p>
    </article>
  `).join('');
  drawNearbyPlaces(results);
  }, 'Finding useful places nearby...').catch((error) => {
    console.error('Nearby search failed:', error);
    nearbyFeedback.textContent = 'We could not load nearby places right now. Please try again.';
    nearbyGrid.innerHTML = '';
  });
}

function renderEmergencyServices() {
  emergencyGrid.innerHTML = emergencyServices.map((service) => `
    <article class="emergency-card">
      <div class="emergency-card-heading"><span class="emergency-category">${service.category}</span><span class="emergency-area">${service.area}</span></div>
      <h3>${service.name}</h3>
      <p>${service.note}</p>
      <div class="emergency-card-actions">
        <button type="button" class="nearby-map-button" data-emergency-id="${service.id}">View on map</button>
        <a class="emergency-directions" href="https://www.google.com/maps/dir/?api=1&destination=${service.coordinates[0]},${service.coordinates[1]}" target="_blank" rel="noopener">Get directions</a>
      </div>
      ${service.phone ? `<a class="emergency-phone" href="tel:${service.phone.replace(/[^+\d]/g, '')}">${service.category === 'Police station' ? 'Call police control' : 'Call'}: ${service.phone}</a>` : ''}
      <a class="emergency-source" href="${service.source}" target="_blank" rel="noopener">Source / map data</a>
    </article>
  `).join('');
}

function showEmergencyService(service) {
  if (!service || !hasCoordinates(service.coordinates)) {
    showAppMessage('Map location for this service is not available right now. Please use the service details shown below.');
    return;
  }
  valleyMap?.flyTo(service.coordinates, 15, { duration: .7 });
  emergencyMarkers.get(service.id)?.openPopup();
  document.querySelector(`[data-emergency-id="${service.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showNearbyPlace(place) {
  if (!place || !hasCoordinates(place.coordinates)) {
    showAppMessage('Map location for this nearby place is not available right now.');
    return;
  }
  valleyMap?.flyTo(place.coordinates, 15, { duration: .6 });
  document.querySelector(`[data-nearby-id="${place.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function useBrowserLocation() {
  if (!navigator.geolocation) {
    nearbyFeedback.textContent = 'Your browser cannot share location. Choose a destination or bus stop instead.';
    return;
  }
  nearbyFeedback.textContent = 'Asking for your location...';
  navigator.geolocation.getCurrentPosition((position) => {
    const coordinates = [position.coords.latitude, position.coords.longitude];
    const withinValley = coordinates[0] >= 27.55 && coordinates[0] <= 27.85 && coordinates[1] >= 85.15 && coordinates[1] <= 85.65;
    if (!withinValley) {
      nearbyFeedback.textContent = 'Your location is outside Ghumante\'s Kathmandu Valley guide. Select a place within Kathmandu, Lalitpur, or Bhaktapur instead.';
      return;
    }
    currentUserCoordinates = coordinates;
    updateDetailDistance();
    setNearbyOrigin({ name: 'Your location', coordinates }, 'Browser location Ã‚Â· Kathmandu Valley');
    valleyMap?.flyTo(coordinates, 14, { duration: .8 });
  }, (error) => {
    const message = error?.code === 1
      ? 'Location permission was declined. You can choose a destination or bus stop instead.'
      : error?.code === 2
        ? 'Your location could not be found. Choose a destination or bus stop instead.'
        : 'Location took too long to respond. Please try again or choose a destination instead.';
    nearbyFeedback.textContent = message;
  }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
}

function initialiseMap() {
  const mapElement = document.querySelector('#valley-map');
  if (!mapElement || typeof L === 'undefined') {
    if (mapFeedback) mapFeedback.hidden = false;
    return;
  }
  try {
  const valleyBounds = L.latLngBounds([27.55, 85.15], [27.85, 85.65]);
  valleyMap = L.map(mapElement, {
    center: [27.7172, 85.324],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    maxBounds: valleyBounds,
    maxBoundsViscosity: 1,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(valleyMap);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(valleyMap);

  destinations.filter((destination) => hasCoordinates(destination.coordinates)).forEach((destination) => {
    const popup = `<strong>${destination.name}</strong><br><span>${destination.city} Ã‚Â· ${destination.type}</span>`;
    const marker = L.circleMarker(destination.coordinates, {
      color: '#182a2a',
      fillColor: '#e97855',
      fillOpacity: 1,
      radius: 7,
      weight: 2
    });
    marker.bindPopup(popup).on('click', () => setNearbyOrigin({ name: destination.name, coordinates: destination.coordinates }, `${destination.city} Ã‚Â· ${destination.type}`)).addTo(valleyMap);
    destinationMarkers.set(destination.id, marker);
  });

  emergencyServices.filter((service) => hasCoordinates(service.coordinates)).forEach((service) => {
    const marker = L.circleMarker(service.coordinates, { color: '#182a2a', fillColor: '#c74646', fillOpacity: 1, radius: 7, weight: 2 });
    marker.bindPopup(`<strong>${service.name}</strong><br><span>${service.category} · ${service.area}</span>`).on('click', () => showEmergencyService(service)).addTo(valleyMap);
    emergencyMarkers.set(service.id, marker);
  });
  } catch (error) {
    console.error('Map initialisation failed:', error);
    if (mapFeedback) mapFeedback.hidden = false;
    valleyMap = undefined;
  }
}

function matchingDestinations(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return destinations.filter((destination) => [destination.name, destination.city, destination.type, ...(destination.aliases || [])].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery))).slice(0, 5);
}

function renderSuggestions(matches) {
  searchSuggestions.innerHTML = matches.map((destination) => `<button type="button" role="option" data-search-id="${destination.id}"><strong>${destination.name}</strong><span>${destination.city} Ã‚Â· ${destination.type}</span></button>`).join('');
  destinationQuery.setAttribute('aria-expanded', String(matches.length > 0));
}

function focusDestination(destination) {
  if (!destination) {
    showAppMessage('We could not find that destination. Please choose a place from the suggestions.');
    return;
  }
  destinationQuery.value = destination.name;
  searchSuggestions.innerHTML = '';
  destinationQuery.setAttribute('aria-expanded', 'false');
  searchFeedback.className = 'search-feedback is-success';
  searchFeedback.textContent = `${destination.name} is in ${destination.city}. Opening it on the valley map.`;
  saveRecentDestination(destination.id);
  if (!hasCoordinates(destination.coordinates)) {
    searchFeedback.textContent = `${destination.name} does not have a map location yet, but its travel information is still available below.`;
    showDestinationDetail(destination);
    return;
  }
  valleyMap?.flyTo(destination.coordinates, 14, { duration: 1 });
  destinationMarkers.get(destination.id)?.openPopup();
  setNearbyOrigin({ name: destination.name, coordinates: destination.coordinates }, `${destination.city} Ã‚Â· ${destination.type}`);
}

function searchForDestination(event) {
  event.preventDefault();
  const matches = matchingDestinations(destinationQuery.value);
  const exactMatch = destinations.find((destination) => [destination.name, ...(destination.aliases || [])].filter(Boolean).some((value) => String(value).toLowerCase() === destinationQuery.value.trim().toLowerCase()));
  if (exactMatch) {
    focusDestination(exactMatch);
    return;
  }
  renderSuggestions(matches);
  searchFeedback.className = 'search-feedback is-outside';
  searchFeedback.textContent = destinationQuery.value.trim()
    ? `We could not find "${destinationQuery.value.trim()}" in the guide. Try a suggested place, Kathmandu, Lalitpur, or Bhaktapur.`
    : 'Type a destination name to search the valley.';
}

cityFilters.forEach((filter) => filter.addEventListener('click', () => {
  cityFilters.forEach((button) => button.classList.remove('is-active'));
  filter.classList.add('is-active');
  activeCity = filter.dataset.city;
  renderDestinations();
}));

categoryFilters.forEach((filter) => filter.addEventListener('click', () => {
  categoryFilters.forEach((button) => button.classList.remove('is-active'));
  filter.classList.add('is-active');
  activeCategory = filter.dataset.category;
  renderDestinations();
}));

document.addEventListener('click', (event) => {
  const destinationLink = event.target.closest('[data-destination]');
  if (destinationLink) prepareBusRoute(destinations.find((destination) => destination.name === destinationLink.dataset.destination));
  const detailButton = event.target.closest('[data-detail-id]');
  if (detailButton) showDestinationDetail(destinations.find((destination) => destination.id === detailButton.dataset.detailId));
  const mapButton = event.target.closest('[data-destination-map]');
  const favoriteButton = event.target.closest('[data-favorite-id]');
  if (favoriteButton) toggleFavorite(favoriteButton.dataset.favoriteId);
  const openDestination = event.target.closest('[data-open-destination]');
  if (openDestination) showDestinationDetail(getDestinationById(openDestination.dataset.openDestination));
  const routeFavorite = event.target.closest('[data-route-destination]');
  if (routeFavorite) {
    const destination = destinations.find((item) => item.name === routeFavorite.dataset.routeDestination);
    if (destination) prepareBusRoute(destination);
  }
  const itineraryMove = event.target.closest('[data-itinerary-move]');
  if (itineraryMove) moveItineraryDestination(itineraryMove.dataset.itineraryMove, itineraryMove.dataset.direction);
  if (mapButton) focusDestinationOnMap(destinations.find((destination) => destination.id === mapButton.dataset.destinationMap));
  const scrollTarget = event.target.closest('[data-scroll-target]');
  if (scrollTarget) document.querySelector(scrollTarget.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth' });
  const suggestion = event.target.closest('[data-search-id]');
  if (suggestion) focusDestination(destinations.find((destination) => destination.id === suggestion.dataset.searchId));
  const routeSuggestion = event.target.closest('[data-route-location]');
  if (routeSuggestion) {
    const input = document.querySelector(`#${routeSuggestion.dataset.routeInput}`);
    input.value = routeSuggestion.dataset.routeLocation;
    input.setAttribute('aria-expanded', 'false');
    document.querySelector(`#${input.getAttribute('aria-controls')}`).innerHTML = '';
  }
  const routeButton = event.target.closest('[data-route-id]');
  if (routeButton) {
    const selectedRoute = routes.find((route) => route.id === routeButton.dataset.routeId);
    if (selectedRoute) showRouteOnMap(selectedRoute);
  }
  const stopLink = event.target.closest('[data-stop-name]');
  if (stopLink) showStopDetails(stopLink.dataset.stopName);
  const nearbyButton = event.target.closest('[data-nearby-id]');
  if (nearbyButton) {
    const place = nearbyPlaces.find((item) => item.id === nearbyButton.dataset.nearbyId);
    if (place) showNearbyPlace(place);
  }
  const emergencyButton = event.target.closest('[data-emergency-id]');
  if (emergencyButton) {
    const service = emergencyServices.find((item) => item.id === emergencyButton.dataset.emergencyId);
    if (service) showEmergencyService(service);
  }
  const itineraryChoice = event.target.closest('[data-itinerary-id]');
  if (itineraryChoice) toggleItineraryDestination(itineraryChoice.dataset.itineraryId);
});

routeForm.addEventListener('submit', showRoute);
routeFrom.addEventListener('input', () => renderRouteSuggestions(routeFrom, routeFromSuggestions));
routeTo.addEventListener('input', () => renderRouteSuggestions(routeTo, routeToSuggestions));
destinationQuery.addEventListener('input', () => renderSuggestions(matchingDestinations(destinationQuery.value)));
destinationSearch.addEventListener('submit', searchForDestination);
stopDetailsClose.addEventListener('click', closeStopDetails);
detailClose.addEventListener('click', () => { destinationDetail.hidden = true; });
detailRoute.addEventListener('click', () => { if (selectedDestination) prepareBusRoute(selectedDestination); });
detailMap.addEventListener('click', () => { if (selectedDestination) focusDestinationOnMap(selectedDestination); });
useLocationButton.addEventListener('click', useBrowserLocation);
itineraryClear.addEventListener('click', () => {
  itineraryState.selectedIds = [];
  renderItineraryPicker();
  renderItinerary();
});
itineraryDayButtons.forEach((button) => button.addEventListener('click', () => {
  itineraryDayButtons.forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
  itineraryState.days = Number(button.dataset.itineraryDays);
  renderItinerary();
}));
radiusButtons.forEach((button) => button.addEventListener('click', () => {
  radiusButtons.forEach((radiusButton) => radiusButton.classList.remove('is-active'));
  button.classList.add('is-active');
  nearbyRadius = Number(button.dataset.radius);
  renderNearbyPlaces();
}));

async function initialiseApp() {
  showLoader('Loading Kathmandu Valley transport data...');
  try {
    const [loadedDestinations, loadedRoutes, loadedMap, loadedNearby] = await Promise.all([
      withLoading('destinations', () => loadDestinations({ onFallback: reportDataFallback }), 'Loading destinations...'),
      withLoading('bus-routes', () => loadBusRoutes({ onFallback: reportDataFallback }), 'Loading bus routes...'),
      withLoading('map-data', () => loadMapData({ onFallback: reportDataFallback }), 'Loading map data...'),
      withLoading('nearby-data', () => loadNearbyPlaces({ onFallback: reportDataFallback }), 'Loading nearby places...')
    ]);
    destinations = loadedDestinations;
    routes = loadedRoutes.routes;
    routeStops = loadedRoutes.routeStops;
    busStops = loadedMap.busStops;
    emergencyServices = loadedMap.emergencyServices;
    nearbyPlaces = loadedNearby;
    locationSearch = createLocationSearch({ destinations, routes, busStops });

    loadItinerary();
    renderFavorites();
    renderRecentDestinations();
    renderItineraryPicker();
    renderItinerary();
    renderDestinations();
    renderEmergencyServices();
    initialiseMap();
  } catch (error) {
    console.error('Ghumante data initialisation failed:', error);
    showAppMessage('Ghumante could not load the guide right now. Please refresh the page and try again.');
    document.querySelector('#destination-grid').innerHTML = '<p class="saved-empty">We could not load the valley guide. Please refresh and try again.</p>';
  } finally {
    hideLoader();
  }
}

initialiseApp();
