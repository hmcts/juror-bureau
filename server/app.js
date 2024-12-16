const express = require('express');
const config = require('./config/environment')();
const http = require('http');
const app = express();
const server = http.createServer(app);
const { LaunchDarkly } = require('./lib/launchdarkly');
const { AppInsights } = require('./lib/appinsights');
const { Logger } = require('./components/logger');

// initialize helpers
new AppInsights();
new LaunchDarkly();
new Logger(config).initLogger(app);

require('./config/express')(app);
require('./routes')(app);


console.info('\n\n');
console.info('################################');
console.info('##    Juror-Bureau v' + process.env.npm_package_version + '     ##');
console.info('################################');
console.info('\n\n');

console.info('app name: ' + process.env.npm_package_name);
console.info('app version: ' + process.env.npm_package_version);

// Start server
function startServer () {
  app.juror = server.listen(config.port, config.ip, function () {
    Logger.instance.info('Application started: http://localhost:%s', config.port);
  });
}

async function stopServer () {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return process.exit();
  }

  if (config.logConsole !== false) {
    console.info('Express server shutdown signal received.');
    console.info('Express server closing down.');
  }

  app.juror.close();
  await sleep(5000);

  AppInsights.client()?.flush({
    callback: () => {
      process.exit();
    },
  });
}

// Handle shutdown
process.on('SIGINT', function () {
  stopServer();
});

process.on('SIGTERM', function () {
  stopServer();
});

setImmediate(startServer);

// Expose app
exports = module.exports = app;
