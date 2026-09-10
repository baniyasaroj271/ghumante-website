const featureId = document.body.dataset.featurePage;

if (!/^(saved|itinerary|nearby|emergency|routes|about)$/.test(featureId)) {
  throw new Error('Unknown Ghumante feature page.');
}

const featurePageStyle = `<style>
  body > main > .hero,
  body > main > section:not(#${featureId}),
  body > .site-footer { display: none !important; }
  body > main { min-height: calc(100vh - 80px); }
  #${featureId} { display: block !important; padding-top: 54px; }
  ${featureId === 'routes' ? '#map { display: block !important; padding: 28px 20px 0 !important; } #map .section-heading, #map .stop-details { display: none !important; }' : ''}
</style>`;

try {
  const response = await fetch('index.html');
  if (!response.ok) throw new Error('Could not load the shared page layout.');
  const page = await response.text();
  document.open();
  document.write(page.replace('</head>', `${featurePageStyle}</head>`));
  document.close();
} catch (error) {
  document.body.innerHTML = '<main class="section-shell"><h1>Page unavailable</h1><p>Please return to the <a href="index.html">homepage</a> and try again.</p></main>';
}
