import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PROJECT_ID = 'prj_WdEEcvAzo9UHUMEEqVIpJTqwdqRX';
export const TEAM_ID = 'team_pHhv39m8ESRciG3PZ6MoJux3';

export async function resolveProduction(token, fetcher = fetch) {
  if (!token || /[\r\n]/.test(token)) {
    throw new Error('MISSING_VERCEL_TOKEN: Legg Vercel-token for aunan93-3711 i GitHub Actions-hemmeligheten VERCEL_TOKEN.');
  }
  async function get(path) {
    const url = new URL(path, 'https://api.vercel.com');
    url.searchParams.set('teamId', TEAM_ID);
    let response;
    try {
      response = await fetcher(url, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'manual', signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new Error('Vercel API kunne ikke nås.');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('VERCEL_ACCESS_DENIED: Tokenet mangler tilgang til teamet aunan93-3711.');
    }
    if (!response.ok) throw new Error(`Vercel API svarte HTTP ${response.status}.`);
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Vercel API returnerte ikke JSON.');
    }
    return response.json();
  }
  const project = await get(`/v9/projects/${PROJECT_ID}`);
  if (project.id !== PROJECT_ID || project.accountId !== TEAM_ID) {
    throw new Error('Vercel returnerte feil prosjekt eller team.');
  }
  const listing = await get(`/v9/projects/${PROJECT_ID}/domains?limit=100`);
  const candidates = (listing.domains || []).filter(domain =>
    domain.projectId === PROJECT_ID && domain.verified === true
    && !domain.redirect && !domain.gitBranch && !domain.customEnvironmentId
    && /^[a-z0-9-]+\.vercel\.app$/.test(domain.name)
  ).map(domain => domain.name);
  const activeAliases = project.targets?.production?.alias || [];
  candidates.sort((a, b) => Number(activeAliases.includes(b)) - Number(activeAliases.includes(a))
    || a.length - b.length || a.localeCompare(b));
  if (!candidates.length) {
    throw new Error('Fant ingen verifisert Vercel-produksjonsadresse knyttet til dette prosjektet.');
  }
  return { url: `https://${candidates[0]}`, projectId: PROJECT_ID, teamId: TEAM_ID };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await resolveProduction(process.env.VERCEL_TOKEN);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `production_url=${result.url}\n`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
