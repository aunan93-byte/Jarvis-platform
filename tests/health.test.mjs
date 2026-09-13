import test from 'node:test';
import assert from 'node:assert/strict';
import health from '../api/health.js';
function mockEnv(t, values) {
  const original = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}
function response(){return {headers:{},code:0,body:undefined,setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},json(v){this.body=v;return this;},end(){return this;}};}
test('health reports foundation status and only public deployment metadata', (t) => {
  mockEnv(t, { VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40), VERCEL_ENV: 'production', DATABASE_URL: 'private' });
  const r = response();
  health({ method: 'GET' }, r);
  assert.equal(r.code, 200);
  assert.equal(r.body.autonomous, false);
  assert.equal(r.body.commerce, false);
  assert.equal(r.headers['Cache-Control'], 'no-store');
  assert.deepEqual(Object.keys(r.body), ['service', 'version', 'status', 'autonomous', 'commerce', 'deployment']);
  assert.deepEqual(r.body.deployment, { commit: 'a'.repeat(40), environment: 'production' });
  assert.equal(JSON.stringify(r.body).includes('private'), false);
});
test('invalid deployment identity is explicitly unknown', (t) => {
  mockEnv(t, { VERCEL_GIT_COMMIT_SHA: 'invalid', VERCEL_ENV: 'invalid' });
  const r = response();
  health({ method: 'GET' }, r);
  assert.deepEqual(r.body.deployment, { commit: null, environment: 'unknown' });
});
test('health refuses mutations and supports HEAD',()=>{for(const method of ['POST','DELETE','PUT','PATCH']){const r=response();health({method},r);assert.equal(r.code,405);}const r=response();health({method:'HEAD'},r);assert.equal(r.code,200);assert.equal(r.body,undefined);});
