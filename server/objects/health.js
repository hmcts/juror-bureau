;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const config = require('../config/environment')();

  module.exports.object = new DAO(urljoin(config.apiEndpoint.replace('api/vi', ''), 'actuator/health'), {
    get: function() {
      return {
        uri: this.resource,
      }
    }
  })
})();
