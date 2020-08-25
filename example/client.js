const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const protoFile = path.join(__dirname, 'example.proto');

const packageDefinition = protoLoader.loadSync(protoFile, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const exampleProto = grpc.loadPackageDefinition(packageDefinition).example;

const logger = console;

async function run() {
  const client = new exampleProto.Example('localhost:50051', grpc.credentials.createInsecure());
  const user = process.argv.length >= 3 ? process.argv[2] : 'World';
  client.hello({ name: user }, (err, response) => {
    if (err) {
      logger.error(err);
      return;
    }
    logger.info('Greeting:', response.message);
  });

  client.helloTwo({ name: user }, (err, response) => {
    if (err) {
      logger.error(err);
      return;
    }
    logger.info('Greeting:', response.message);
  });

  client.helloThree({ name: user }, (err, response) => {
    if (err) {
      logger.error(err);
      return;
    }
    logger.info('Greeting:', response.message);
  });
}

run();
