const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

function getPackageName(protoFile) {
  return protoFile
    .split('/')
    .pop()
    .replace('.proto', '')
    .replace('-', '_');
}

function getServiceName(protoFile) {
  return getPackageName(protoFile)
    .split('_')
    .map((str) => `${str[0].toUpperCase()}${str.slice(1)}`)
    .join('');
}

function loadPackage(protoFile) {
  const def = protoLoader.loadSync(protoFile, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const name = getPackageName(protoFile);
  return grpc.loadPackageDefinition(def)[name];
}

function getErrorMiddleware(logger) {
  return async (call, callback, next) => {
    try {
      await next();
    } catch (err) {
      logger.error(err);
      callback(err);
    }
  };
}

function executor(middleware, call, callback, service, name) {
  function execute(index) {
    const nextFunc = index + 1 === middleware[name].length
      ? service[name].bind(null, call, callback)
      : execute.bind(null, index + 1);
    const func = middleware[name][index];
    return func(call, callback, nextFunc);
  }
  return execute(0);
}

function convertFunc(func) {
  return async (call, callback) => {
    const result = await func(call.request);
    callback(null, result);
  };
}

function convertFuncs(funcObj) {
  return Object.keys(funcObj).reduce((acc, cur) => {
    const func = funcObj[cur];
    acc[cur] = convertFunc(func);
    return acc;
  }, {});
}

function getServiceImpl(serviceDef, middleware) {
  const wrapped = convertFuncs(serviceDef);
  return Object.keys(wrapped).reduce((acc, cur) => {
    acc[cur] = (call, callback) => {
      executor(middleware, call, callback, wrapped, cur);
    };
    return acc;
  }, {});
}

function create(protoFile, serviceDef, middleware) {
  const server = new grpc.Server();
  const packageDef = loadPackage(protoFile);
  const serviceName = getServiceName(protoFile);
  server.addService(
    packageDef[serviceName].service,
    getServiceImpl(serviceDef, middleware),
  );
  return server;
}

function listen(server, host, port) {
  return new Promise((resolve) => {
    server.bindAsync(
      `${host}:${port}`,
      grpc.ServerCredentials.createInsecure(),
      () => {
        server.start();
        resolve(server);
      },
    );
  });
}

class Grpcx {
  constructor(options) {
    this.protoFile = options.protoFile;
    this.serviceDef = {};
    this.logger = options.logger || console;
    this.middleware = options.disableDefaultErrorMiddleware
      ? []
      : [getErrorMiddleware(this.logger)];
    this.pathMiddleware = {};
  }

  use(...args) {
    if (args.length === 1) {
      this.middleware.push(args[0]);
    } else {
      const name = args[0];
      const middleware = args.slice(1, args.length - 1);
      const func = args[args.length - 1];
      this.pathMiddleware[name] = [...this.middleware, ...middleware];
      this.serviceDef[name] = func;
    }
  }

  listen(port, host = '0.0.0.0') {
    const server = create(
      this.protoFile,
      this.serviceDef,
      this.pathMiddleware,
    );
    return listen(server, host, port);
  }
}

module.exports = Grpcx;
