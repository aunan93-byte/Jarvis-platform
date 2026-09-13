import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProduction, PROJECT_ID, TEAM_ID } from '../scripts/resolve-vercel-production.mjs';

const primary = 'jarvis-primary.vercel.app';
const project = { id: PROJECT_ID, accountId: TEAM_ID, targets: { production: { alias: [primary] } } };
const domain = (name, extra = {}) => ({ name, projectId: PROJECT_ID, verified: true, ...extra });

function api({ projectData = project, domains = [domain(primary)], status = 200 } = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push(url.href);
    assert.equal(url.origin, 'https://api.vercel.com');
    assert.equal(url.searchParams.get('teamId'), TEAM_ID);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Authorization, 'Bearer test-only');
    return Response.json(url.pathname.endsWith('/domains') ? { domains } : projectData, { status });
  };
  return { calls, fetcher };
}

test('resolves a verified production domain from the correct project and team', async () => {
  const mock = api({ domains: [domain('a.vercel.app'), domain(primary)] });
  assert.deepEqual(await resolveProduction('test-only', mock.fetcher), {
    url: `https://${primary}`, projectId: PROJECT_ID, teamId: TEAM_ID,
  });
  assert.equal(mock.calls.length, 2);
});

test('missing credential fails before network access', async () => {
  await assert.rejects(resolveProduction('', () => assert.fail('network must not be called')), /MISSING_VERCEL_TOKEN/);
});

test('rejects unauthorized requests, redirects, and wrong project ownership', async () => {
  for (const status of [401, 403]) {
    await assert.rejects(resolveProduction('test-only', api({ status }).fetcher), /VERCEL_ACCESS_DENIED/);
  }
  await assert.rejects(resolveProduction('test-only', api({ status: 302 }).fetcher), /HTTP 302/);
  for (const projectData of [{ ...project, accountId: 'other' }, { ...project, id: 'other' }]) {
    const mock = api({ projectData });
    await assert.rejects(resolveProduction('test-only', mock.fetcher), /feil prosjekt/);
    assert.equal(mock.calls.length, 1);
  }
});

test('never selects foreign, unverified, preview, redirected, or malformed domains', async () => {
  const mock = api({ domains: [
    domain(primary, { projectId: 'other' }), domain(primary, { verified: false }),
    domain(primary, { gitBranch: 'feature' }), domain(primary, { redirect: 'other.vercel.app' }),
    domain(primary, { customEnvironmentId: 'staging' }), domain('test.vercel.app.evil.org'),
    domain('localhost'), domain('test.vercel.app/another-path'),
  ] });
  await assert.rejects(resolveProduction('test-only', mock.fetcher), /ingen verifisert/);
});

test('credentials never appear in returned metadata or transport errors', async () => {
  const result = await resolveProduction('test-only', api().fetcher);
  assert.equal(JSON.stringify(result).includes('test-only'), false);
  await assert.rejects(resolveProduction('test-only', () => { throw new Error('Bearer test-only'); }), error => !error.message.includes('test-only'));
});
