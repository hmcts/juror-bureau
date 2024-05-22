const express = require('express');
const config = require('./config/environment')();
const http = require('http');
const app = express();
const server = http.createServer(app);
const releaseVersion = require(__dirname + '/../package.json').version;
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
console.info('##    Juror-Bureau v' + releaseVersion + '    ##');
console.info('################################');
console.info('\n\n');


// Start server
function startServer () {
  app.juror = server.listen(config.port, config.ip, function () {
    Logger.instance.info('Application started: http://localhost:%s', config.port);
  });
}

setImmediate(startServer);

// Expose app
exports = module.exports = app;
