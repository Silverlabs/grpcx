const path = require('path');
const assert = require('assert');

const Grpcx = require('../src');
const client = require('./client');

const protoFile = path.join(__dirname, 'example.proto');

describe('use', () => {
  let server;
  afterEach(() => {
    server.forceShutdown();
  });

  it('adds an rpc implementation', async () => {
    const app = new Grpcx({ protoFile });
    app.use('hello', ({ name }) => ({ message: `Hello ${name}` }));
    server = await app.listen('3456');
    const response = await client.hello({ name: 'test' });
    assert.equal(response.message, 'Hello test');
  });

  it('adds a middleware', async () => {
    const arr = [];
    const mid1 = (call, callback, next) => {
      arr.push('mid1');
      return next();
    };

    const app = new Grpcx({ protoFile });
    app.use(mid1);
    app.use('hello', ({ name }) => ({ message: `Hello ${name}` }));
    server = await app.listen('3456');

    await client.hello({ name: 'test' });
    assert.deepEqual(arr, ['mid1']);
  });

  it('adds middleware for specific path', async () => {
    const arr = [];
    const mid1 = (call, callback, next) => {
      arr.push('mid1');
      return next();
    };

    const app = new Grpcx({ protoFile });
    app.use('hello', mid1, ({ name }) => ({ message: `Hello ${name}` }));
    app.use('hello2', ({ name }) => ({ message: `Hello ${name}` }));
    server = await app.listen('3456');

    await client.hello2({ name: 'test' });
    assert.deepEqual(arr, []);

    await client.hello({ name: 'test' });
    assert.deepEqual(arr, ['mid1']);
  });

  it('adds middleware for only subsequent rpcs', async () => {
    const arr = [];
    const mid1 = (call, callback, next) => {
      arr.push('mid1');
      return next();
    };

    const app = new Grpcx({ protoFile });
    app.use('hello', ({ name }) => ({ message: `Hello ${name}` }));
    app.use(mid1);
    app.use('hello2', ({ name }) => ({ message: `Hello ${name}` }));
    server = await app.listen('3456');

    await client.hello({ name: 'test' });
    assert.deepEqual(arr, []);

    await client.hello2({ name: 'test' });
    assert.deepEqual(arr, ['mid1']);
  });

  it('adds multipe middleware', async () => {
    const arr = [];
    const mid1 = (call, callback, next) => {
      arr.push('mid1');
      return next();
    };
    const mid2 = (call, callback, next) => {
      arr.push('mid2');
      return next();
    };

    const app = new Grpcx({ protoFile });
    app.use(mid1);
    app.use('hello', ({ name }) => ({ message: `Hello ${name}` }));
    app.use(mid2);
    app.use('hello2', ({ name }) => ({ message: `Hello ${name}` }));
    server = await app.listen('3456');

    await client.hello({ name: 'test' });
    assert.deepEqual(arr, ['mid1']);

    await client.hello2({ name: 'test' });
    assert.deepEqual(arr, ['mid1', 'mid1', 'mid2']);
  });
});
