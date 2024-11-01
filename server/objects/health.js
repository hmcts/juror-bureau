;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const config = require('../config/environment')();

  module.exports.object = new DAO(urljoin('actuator/health'), {
    get: function() {
      return {
        uri: this.resource,
        baseUrl: config.apiEndpoint.replace('api/v1', '')
      }
    }
  })
})();
