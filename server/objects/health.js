;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const config = require('../config/environment')();
  const urlJoin = require('url-join');

  module.exports.object = new DAO(urlJoin('actuator/health'), {
    get: function() {
      return {
        uri: this.resource,
        baseUrl: config.apiEndpoint.replace('api/v1', '')
      }
    }
  })
})();
