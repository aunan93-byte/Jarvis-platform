import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyDeployment } from '../scripts/verify-deployment.mjs';

const sha = 'a'.repeat(40);
const url = 'https://jarvis-platform-test.vercel.app';
function fakeFetch({ commit = sha, apiStatus = 200, redirect = false, page = '<title>JARVIS · Plattformstatus</title>' } = {}) {
  return async (request, options) => {
    assert.equal(options.redirect, 'manual');
    if (redirect) return new Response('', { status: 302, headers: { location: 'https://example.org' } });
    if (request.pathname === '/') return new Response(page, { headers: { 'content-type': 'text/html' } });
    return Response.json({ service: 'jarvis-platform', status: 'awaiting_migration', autonomous: false, commerce: false, deployment: { commit } }, { status: apiStatus });
  };
}

test('verifies the deployed commit and actual homepage', async () => {
  const result = await verifyDeployment(url, sha, fakeFetch());
  assert.equal(result.status, 'verified');
  assert.equal(result.commit, sha);
});

test('rejects stale or unidentifiable deployments', async () => {
  for (const commit of ['b'.repeat(40), null]) {
    await assert.rejects(verifyDeployment(url, sha, fakeFetch({ commit })), /kodeversjon/);
  }
});

test('authentication, redirects, and unrelated pages never pass', async () => {
  await assert.rejects(verifyDeployment(url, sha, fakeFetch({ apiStatus: 401 })), /HTTP 401/);
  await assert.rejects(verifyDeployment(url, sha, fakeFetch({ redirect: true })), /HTTP 302/);
  await assert.rejects(verifyDeployment(url, sha, fakeFetch({ page: '<title>Something else</title>' })), /Forsiden/);
});

test('rejects unsuitable URLs and commits before making network requests', async () => {
  const noFetch = () => assert.fail('must not fetch');
  for (const target of ['http://localhost', 'https://example.org', 'https://test.vercel.app.evil.org', 'https://x:y@test.vercel.app', `${url}/?token=x`, `${url}/other`]) {
    await assert.rejects(verifyDeployment(target, sha, noFetch));
  }
  await assert.rejects(verifyDeployment(url, 'invalid', noFetch));
});
