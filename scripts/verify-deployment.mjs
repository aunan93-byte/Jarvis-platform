import { pathToFileURL } from 'node:url';

export async function verifyDeployment(rawUrl, expectedCommit, fetcher = fetch) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.vercel\.app$/.test(url.hostname)
      || url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Forventet en ren HTTPS-adresse under vercel.app.');
  }
  if (!/^[a-f0-9]{40}$/i.test(expectedCommit || '')) {
    throw new Error('En fullstendig GitHub-commit må oppgis.');
  }
  async function read(path, type) {
    const result = await fetcher(new URL(path, url), {
      redirect: 'manual', signal: AbortSignal.timeout(20000), cache: 'no-store',
    });
    if (!result.ok) throw new Error(`${path}: HTTP ${result.status}. Publiseringen er ikke verifisert.`);
    if (!result.headers.get('content-type')?.includes(type)) throw new Error(`${path}: feil innholdstype.`);
    return result;
  }
  const healthResponse = await read('/api/health', 'application/json');
  const health = await healthResponse.json();
  if (health.service !== 'jarvis-platform' || health.status !== 'awaiting_migration'
      || health.autonomous !== false || health.commerce !== false) {
    throw new Error('API-et returnerte ikke forventet plattformstatus.');
  }
  if (health.deployment?.commit !== expectedCommit.toLowerCase()) {
    throw new Error('Publisert kodeversjon samsvarer ikke med GitHub. Kontroller Vercels systemmiljøvariabler.');
  }
  const page = await read('/', 'text/html');
  if (!/<title>JARVIS · Plattformstatus<\/title>/.test(await page.text())) {
    throw new Error('Forsiden er ikke JARVIS-plattformen.');
  }
  return { url: url.origin, commit: health.deployment.commit, status: 'verified', autonomous: false, commerce: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await verifyDeployment(process.env.DEPLOYMENT_URL, process.env.EXPECTED_COMMIT), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
