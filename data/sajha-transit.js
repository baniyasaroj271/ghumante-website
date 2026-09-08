// Verified static route catalog from Sajha Yatayat's published intracity routes.
// Sajha does not publish a GTFS feed or stop-level timetable for these routes.
export const transitSource = {
  operator: 'Sajha Yatayat',
  name: 'Sajha Yatayat intracity route catalog',
  url: 'https://sajhayatayat.com.np/short-routes/',
  checkedOn: '2026-09-08',
  status: 'static-approximate',
  notes: 'Route names and stop sequences are published by Sajha Yatayat. Travel times, fares, exact stop coordinates, and live vehicle status are not published here.'
};

const routeStops = [
  ['Lagankhel', 'Kumaripati', 'Jawalakhel', 'Pulchowk', 'Harihar Bhawan', 'Kupandol', 'Tripureshwor', 'NAC', 'Jamal', 'Lainchaur', 'Lazimpat', 'Panipokhari', 'President\'s Residence', 'Teaching Hospital', 'Narayan Gopal Chowk', 'Basundhara', 'Samakhusi', 'Gongabu Bus Park'],
  ['Lagankhel', 'Kumaripati', 'Jawalakhel', 'Pulchowk', 'Harihar Bhawan', 'Kupandol', 'Tripureshwor', 'NAC', 'Jamal', 'Lainchaur', 'Lazimpat', 'Panipokhari', 'President\'s Residence', 'Teaching Hospital', 'Narayan Gopal Chowk', 'Gangalal Hospital', 'Neuro Hospital', 'Golfutar', 'Telecom Chowk', 'Hattigauda', 'Chapali', 'Deuba Chowk', 'Budhanilkantha'],
  ['Godawari', 'Taukhel', 'Handegaun', 'Badegaun', 'Harisiddhi', 'Hattiban', 'Khumaltar', 'Satdobato', 'Lagankhel', 'Kumaripati', 'Jawalakhel', 'Pulchowk', 'Harihar Bhawan', 'Kupandol', 'Tripureshwor', 'NAC', 'Ratnapark'],
  ['Lamatar', 'Dungin', 'Lubhu', 'School Chowk', 'Sanagaun', 'Kamalpokhari', 'Imadol Krishna Mandir', 'Ratamakai Chowk', 'Kist Hospital', 'Gwarko', 'Satdobato', 'Lagankhel', 'Jawalakhel', 'Pulchowk', 'Harihar Bhawan', 'Kupandol', 'Tripureshwor', 'NAC', 'Jamal', 'Lazimpat', 'Lainchaur', 'Ratnapark'],
  ['Thankot', 'Tribhuvan Park', 'Checkpost', 'Satungal', 'Naikap', 'Dui Adda', 'Kalanki', 'Kalanki Mandir', 'Ravibhawan', 'Saltimod', 'Kalimati', 'Teku', 'Vipreshwar', 'N.A.Bh', 'Ratnapark', 'Singha Durbar', 'Maitighar', 'Bijuli Bazar', 'Naya Baneshwar', 'Tinkun', 'Sinamangal', 'Tribhuvan International Airport'],
  ['Thankot', 'Tribhuvan Park', 'Checkpost', 'Satungal', 'Naikap', 'Kalanki', 'Bafal', 'Sitapaila', 'Swayambhu', 'Banashthali', 'Balaju', 'Gokarna Bus Park', 'Samakhusi', 'Basundhara', 'Narayan Gopal Chowk', 'Gangalal Hospital', 'Neuro Hospital', 'Golfutar', 'Hattigauda', 'Deuba Chowk', 'Budhanilkantha'],
  ['Lele', 'Tikabhairav', 'Takhal', 'Pyanggaun', 'Thecho', 'Sunakothi', 'Dholahiti', 'Khumaltar', 'Chapagaun Dobato', 'Lagankhel', 'Kumaripati', 'Jawalakhel', 'Pulchowk', 'Harihar Bhawan', 'Kupandol', 'Tripureshwor', 'NAC', 'Jamal'],
  ['Bungamati', 'Bhaisepati', 'Nakkhu', 'Ekantakuna', 'Lagankhel', 'Jawalakhel', 'Pulchowk', 'Kupandol', 'Thapathali', 'Singha Durbar', 'Bhadrakali', 'NAC', 'Jamal']
];

export const sajhaRoutes = routeStops.map((stops, index) => ({
  id: `sajha-route-${index + 1}`,
  routeNumber: index + 1,
  operator: transitSource.operator,
  from: stops[0],
  to: stops[stops.length - 1],
  bus: `Sajha Yatayat Route ${index + 1}`,
  stops,
  duration: 'Time not published',
  durationMinutes: null,
  transfers: 0,
  walkingDistanceMeters: null,
  note: 'Static route information. Confirm the direction and current operation with the driver or conductor before boarding.',
  source: transitSource.url,
  dataQuality: transitSource.status
}));

export const sajhaBusStops = [...new Set(routeStops.flat())].map((name) => ({
  id: `sajha-stop-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
  location: 'Kathmandu Valley',
  routes: sajhaRoutes.filter((route) => route.stops.includes(name)).map((route) => route.bus),
  coordinates: null,
  nearbyAttractions: [],
  walkingDirections: 'Exact stop position and walking directions are not published in Sajha Yatayat\'s route catalog. Ask locally for the designated stop.',
  source: transitSource.url,
  dataQuality: transitSource.status
}));
