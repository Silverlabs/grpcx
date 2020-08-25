const path = require('path');
const assert = require('assert');

const Grpcx = require('../src');
const client = require('./client');

describe('listen', () => {
  it('listens on the specified port', async () => {
    let server;
    afterEach(() => {
      server.forceShutdown();
    });

    const app = new Grpcx({
      protoFile: path.join(__dirname, 'example.proto'),
    });
    server = await app.listen(3456);
    let errorThrown = null;
    try {
      await client.hello({ name: 'test' });
    } catch (err) {
      errorThrown = err;
    }

    // Error code 12 is not implemented. If this is returned, it means that
    // the server was listening on that port and returned this error because
    // we have not implemented this function.
    assert.equal(errorThrown.code, 12);
  });
});
