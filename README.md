# Ghumante

Ghumante is a static tourist guide for exploring Kathmandu Valley, Nepal, by public bus. It covers Kathmandu, Lalitpur, and Bhaktapur, with room to grow into richer maps, route data, and destination guides.

## Project structure

```text
ghumante-website/
├── index.html              # The single-page application shell, map section, and accessible page structure
├── assets/                 # Reserved for images, icons, and other media (kept in Git with .gitkeep)
├── css/
│   └── styles.css          # Design tokens, layout, responsive styles, and visual illustrations
├── data/
│   ├── destinations.js     # Popular places, destination detail content, and structured public-bus route data
│   ├── bus-stops.js         # Bus-stop locations, route names, attractions, and walking directions
│   └── nearby-places.js     # Kathmandu Valley attractions, food, hotels, services, and walking guidance
└── js/
	└── main.js             # UI rendering, city filters, route search, and Leaflet map interactions
```

## Run locally

Because the app uses JavaScript modules, serve the folder over HTTP from the project root. For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. The page can also be deployed to any static hosting provider.

## Design direction

The first screen is intentionally focused on the core tourist workflow: search for a place, browse popular Kathmandu Valley destinations, discover one on the map, and find a useful bus connection. Destination content is kept in `data/destinations.js`, which powers the category-filtered photo cards, reusable detailed destination guide, autocomplete search, map markers, and route links. Each destination guide includes exact coordinates, photographs, visiting duration, opening information, entrance fee, recommended time, nearby bus stops, nearby attractions, transportation options, current-location distance when geolocation is available, and map/bus actions. The bus planner provides searchable `From` and `To` inputs and validates both locations against the Kathmandu Valley location set before attempting a route match. Structured route alternatives are sorted by travel time, transfers, and walking distance, with the selected route drawn on the map as a four-step journey: walk to the bus stop, take the bus, get off at the destination stop, and walk to the final destination. Detailed stop records in `data/bus-stops.js` power the mobile-friendly stop card opened from journey links or map markers. Nearby Places uses the selected destination or bus stop, browser geolocation when available, and configurable 500 m, 1 km, and 3 km radius filters to show distance-sorted local attractions and essentials on cards and the map.

The interactive map uses Leaflet 1.9.4 and OpenStreetMap tiles from their public CDNs. Its initial view is centered on Kathmandu Valley, with panning constrained to Kathmandu, Lalitpur, Bhaktapur, and the surrounding valley area.

## Transit data policy

The transit planner uses the official Sajha Yatayat intracity route page: https://sajhayatayat.com.np/short-routes/. The static catalog contains published route names and stop sequences only. Sajha does not publish a public GTFS or live vehicle feed here, so Ghumante does not invent bus numbers, timetables, fares, travel times, exact stop coordinates, or real-time status. The interface labels those fields as unavailable and asks travelers to confirm the direction with the driver or conductor.
