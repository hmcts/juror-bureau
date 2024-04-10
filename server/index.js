;(function() {
  'use strict';

  const isTest = process.env.NODE_ENV === 'test';
  const options = {};

  if (isTest) {
    process.env.NODE_CONFIG_DIR = './test/config';
  }

  const config = require('config');

  require('@hmcts/properties-volume').addTo(config, options);

  global.sleep = (ms = 1000) => {
    return new Promise(res => setTimeout(res, ms));
  };

  // Export the application
  exports = module.exports = require('./app');

})();
