const path = require('path');

const Grpcx = require('../src');

const logger = console;

const app = new Grpcx({
  protoFile: path.join(__dirname, 'example.proto'),
  disableDefaultErrorMiddleware: false,
});

app.use((call, callback, next) => {
  logger.info('Test middleware');
  return next();
});

app.use(
  'hello',
  (call, callback, next) => {
    logger.info('Middleware only for hello');
    return next();
  },
  ({ name }) => ({ message: `Hello ${name}` }),
);

app.use((call, callback, next) => {
  logger.info('Middleware for second service onwards');
  return next();
});

app.use('helloTwo', ({ name }) => ({ message: `HelloTwo: ${name}` }));

app.use('helloThree', () => {
  throw new Error('HelloThree');
});

app.listen(50051).then(() => {
  logger.info('Listening on port 50051');
});
