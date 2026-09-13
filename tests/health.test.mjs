import test from 'node:test';
import assert from 'node:assert/strict';
import health from '../api/health.js';
function response(){return {headers:{},code:0,body:undefined,setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},json(v){this.body=v;return this;},end(){return this;}};}
test('health states that autonomous trading is not live',()=>{const r=response();health({method:'GET'},r);assert.equal(r.code,200);assert.equal(r.body.autonomous,false);assert.equal(r.body.commerce,false);assert.equal(r.headers['Cache-Control'],'no-store');assert.deepEqual(Object.keys(r.body),['service','version','status','autonomous','commerce']);});
test('health refuses mutations and supports HEAD',()=>{for(const method of ['POST','DELETE','PUT','PATCH']){const r=response();health({method},r);assert.equal(r.code,405);}const r=response();health({method:'HEAD'},r);assert.equal(r.code,200);assert.equal(r.body,undefined);});
