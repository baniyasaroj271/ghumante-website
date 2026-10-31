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
</style>`;

try {
  const response = await fetch('index.html');
  if (!response.ok) throw new Error('Could not load the shared page layout.');
  const page = await response.text();
  const parsedPage = new DOMParser().parseFromString(page, 'text/html');
  if (!parsedPage.head || !parsedPage.body) throw new Error('The shared page layout is invalid.');

  const scripts = [...parsedPage.querySelectorAll('script')];
  const headNodes = [...parsedPage.head.childNodes].filter((node) => node.nodeName !== 'SCRIPT');
  const bodyNodes = [...parsedPage.body.childNodes].filter((node) => node.nodeName !== 'SCRIPT');

  document.head.replaceChildren(...headNodes.map((node) => node.cloneNode(true)));
  document.head.insertAdjacentHTML('beforeend', featurePageStyle);
  document.body.replaceChildren(...bodyNodes.map((node) => node.cloneNode(true)));

  for (const sourceScript of scripts) {
    const script = document.createElement('script');
    for (const attribute of sourceScript.attributes) script.setAttribute(attribute.name, attribute.value);
    if (sourceScript.src) {
      script.src = new URL(sourceScript.getAttribute('src'), document.baseURI).href;
      script.async = false;
      await new Promise((resolve, reject) => {
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', () => reject(new Error(`Could not load ${script.src}.`)), { once: true });
        document.head.append(script);
      });
    } else {
      script.textContent = sourceScript.textContent;
      document.head.append(script);
    }
  }
} catch (error) {
  console.error('Ghumante feature page failed to load:', error);
  document.body.innerHTML = '<main class="section-shell"><h1>Page unavailable</h1><p>Please return to the <a href="index.html">homepage</a> and try again.</p></main>';
}
