<div align="center">

# Ghumante

### Take the scenic route through Kathmandu Valley.

A practical, map-first travel guide for discovering Kathmandu, Lalitpur, and
Bhaktapur by public bus.

</div>

---

## About Ghumante

Ghumante helps travelers decide **where to go, how to get there, and what to
do nearby**. Search for a destination, explore it on the map, find a public-bus
route, build an itinerary, and keep useful places close at hand.

The site is intentionally lightweight: it is a static, multi-page web
application built with modern browser JavaScript modules. There is no backend
or build step required for the local version.

## Explore the valley

### Discover destinations

- Search destinations with autocomplete.
- Browse popular places across Kathmandu, Lalitpur, and Bhaktapur.
- Filter by city and category, including heritage sites, temples, historical
  places, cultural attractions, and viewpoints.
- Open detailed destination guides with photos, coordinates, visiting duration,
  opening information, entrance fees, recommended visiting times, nearby stops,
  and nearby attractions.
- See current-location distance when browser geolocation is available.

### Plan public-bus journeys

- Search for a starting point and destination.
- Validate locations against the Kathmandu Valley location catalog.
- Find matching Sajha Yatayat route alternatives.
- View route stops and walking guidance where data is available.
- Follow a journey on the map from the starting point to the destination.

### Make the trip yours

- Save favorite places in the browser.
- Build and review a personal itinerary.
- Find nearby food, hotels, services, and attractions.
- Use configurable nearby-place radius filters of 500 m, 1 km, and 3 km.
- Check emergency services and essential local information.
- Switch between light and dark themes.
- Use responsive layouts designed for mobile exploration.

## Main pages

| Page | Purpose |
| --- | --- |
| `index.html` | Destination search, map, popular places, and route planning |
| `bus-routes.html` | Searchable public-bus route planner |
| `trip-builder.html` | Build a personal Kathmandu Valley itinerary |
| `nearby.html` | Explore nearby attractions and essential services |
| `saved.html` | Review places saved in the browser |
| `emergency.html` | Find emergency and essential local services |
| `about.html` | Learn about the valley and the project |

## Technology

- HTML5 for the multi-page structure
- CSS3 for the responsive design system and light/dark themes
- Vanilla JavaScript using ES modules
- Leaflet 1.9.4 for interactive maps
- OpenStreetMap tiles for map data
- Browser `localStorage` for saved places, recent places, and preferences
- Optional JSON API loading with local static-data fallbacks
- Google Fonts for the visual type system

## Run locally

Because the project uses JavaScript modules, serve it over HTTP rather than
opening the HTML files directly.

### Using Python

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

### Using Node.js

```bash
npx serve .
```

Open the local URL printed by the command.

The project can also be deployed to any static hosting provider that serves
HTML, CSS, JavaScript, and data files. No package installation or compilation
is required for the current static build.

## Optional data API

The frontend works out of the box with the checked-in files under `data/`.
When `window.GHUMANTE_API_BASE` is configured, the data loaders can request
remote JSON resources and fall back to the local catalogs if a request fails or
returns an invalid response.

The API-aware modules are:

- `js/api/destinations.js`
- `js/api/routes.js`
- `js/api/map.js`
- `js/api/nearby.js`
- `js/api/location-search.js`

This makes the site usable as a static demo today while leaving room for a
future content or data service.

## Transit data policy

The bus planner uses the published Sajha Yatayat intracity route catalog:

<https://sajhayatayat.com.np/short-routes/>

The checked-in catalog contains published route names and stop sequences. Sajha
Yatayat does not provide a public GTFS feed or live vehicle feed through this
source, so Ghumante does **not** invent:

- Bus timetables
- Fares
- Live vehicle locations
- Exact stop coordinates
- Guaranteed travel times

Where information is unavailable, the interface labels it as unavailable and
asks travelers to confirm the direction and current operation with the driver
or conductor. Treat the route planner as a practical guide, not a live transit
tracking service.

## Maps and external resources

- Leaflet is loaded from the public CDN at version 1.9.4.
- OpenStreetMap tiles are used for the interactive map.
- Map usage should follow the OpenStreetMap tile and attribution guidelines.
- Destination imagery and fonts may be loaded from external providers, so an
  internet connection improves the experience.

The map view is centered on Kathmandu Valley and constrained to the Kathmandu,
Lalitpur, Bhaktapur, and surrounding valley area.

## Project structure

```text
ghumante-website/
├── index.html                 # Home, search, map, and destination discovery
├── bus-routes.html            # Public-bus route planner
├── trip-builder.html          # Itinerary builder
├── nearby.html                # Nearby places and radius filters
├── saved.html                 # Saved destinations
├── emergency.html             # Emergency services
├── about.html                 # Project and valley information
├── css/
│   └── styles.css             # Design system and responsive styling
├── js/
│   ├── main.js                # Home-page interactions and rendering
│   ├── feature-page.js        # Shared feature-page bootstrap
│   └── api/                   # Data loading, maps, routes, and nearby logic
├── data/
│   ├── destinations.js        # Destination guides and structured metadata
│   ├── bus-stops.js           # Bus-stop details and walking guidance
│   ├── nearby-places.js       # Attractions, food, hotels, and services
│   ├── sajha-transit.js       # Static Sajha route catalog and data policy
│   ├── valley-locations.js    # Searchable Kathmandu Valley locations
│   └── emergency-services.js  # Emergency and essential services
└── assets/                    # Images, icons, and future media
```

## Accessibility and browser behavior

- Semantic page sections and labels support keyboard and screen-reader use.
- A skip link is provided on the home page.
- Status messages use live regions for loading, search, and map feedback.
- Layouts adapt for mobile, tablet, and desktop screens.
- Saved places, recent destinations, and theme preferences use browser storage.
- Geolocation is optional and only used when the visitor grants permission.

## Contributing

When adding destinations or route information:

1. Keep structured content in the appropriate file under `data/`.
2. Preserve the existing source and data-quality notes.
3. Do not add made-up fares, timetables, coordinates, or live-status claims.
4. Test the affected page through a local HTTP server.
5. Check both mobile and desktop layouts before opening a pull request.

## Project status

Ghumante is a growing static guide with a working discovery, mapping, nearby
places, and transit-planning experience. The architecture leaves room for richer
destination content, verified route data, and a future backend API without
requiring a rewrite of the current frontend.

---

<div align="center">

Built for curious travelers finding their way around Kathmandu Valley.

</div>
