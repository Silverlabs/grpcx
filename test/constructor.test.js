const assert = require('assert');

const Grpcx = require('../src');

describe('constructor', () => {
  it('sets proto file from options', () => {
    const app = new Grpcx({ protoFile: 'test file' });
    assert.equal(app.protoFile, 'test file');
  });

  it('sets default logger as console', () => {
    const app = new Grpcx({});
    assert.equal(app.logger, console);
  });

  it('sets logger from options', () => {
    const testLogger = () => {};
    const app = new Grpcx({ logger: testLogger });
    assert.equal(app.logger, testLogger);
  });

  it('sets a default error middleware', () => {
    const app = new Grpcx({});
    assert.equal(app.middleware.length, 1);
  });

  it('does not set default error middleware based on passed option', () => {
    const app = new Grpcx({ disableDefaultErrorMiddleware: true });
    assert.equal(app.middleware.length, 0);
  });
});
