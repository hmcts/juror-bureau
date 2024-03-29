/**
 * Main application file
 */

;(function(){
  'use strict';

  var express = require('express')
    , config = require('./config/environment')()
    , logger = require('./components/logger')(config)
    , http = require('http')
    , app = express()
    , server = http.createServer(app)
    , releaseVersion = require(__dirname + '/../package.json').version
    , { LaunchDarkly } = require('./lib/launchdarkly')
    , { AppInsights } = require('./lib/appinsights');

  // Attach logger to app
  app.logger = logger;


  require('./config/express')(app);
  require('./routes')(app);

  // This will initiate a laundarkly connection and keep it open waiting for flag checks
  new LaunchDarkly();
  new AppInsights();

  // A bit of conditional shiny
  if (config.logConsole !== false) {
    console.info('\n\n');
    console.info('################################');
    console.info('##    ODSC Framework v' + releaseVersion + '   ##');
    console.info('################################');
    console.info('\n\n');
  }


  // Start server
  function startServer() {
    app.juror = server.listen(config.port, config.ip, function() {
      if (config.logConsole !== false) {
        console.info('Express server listening on http://%s:%s', config.ip, config.port);
      }
    });
  }

  setImmediate(startServer);

  // Expose app
  exports = module.exports = app;

})();
