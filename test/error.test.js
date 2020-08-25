const path = require('path');
const assert = require('assert');

const Grpcx = require('../src');
const client = require('./client');

const protoFile = path.join(__dirname, 'example.proto');

describe('default error middleware', () => {
  let server;
  afterEach(() => {
    server.forceShutdown();
  });

  it('catches error, logs it and returns in response', async () => {
    const arr = [];
    const logger = {
      error: (err) => arr.push(err),
    };
    const app = new Grpcx({ protoFile, logger });
    app.use('hello', () => {
      throw new Error('test error');
    });
    server = await app.listen('3456');
    let errorThrown = null;
    try {
      await client.hello({ name: 'test' });
    } catch (err) {
      errorThrown = err;
    }
    assert.equal(errorThrown.details, 'test error');
    assert.equal(arr[0].message, 'test error');
  });
});
