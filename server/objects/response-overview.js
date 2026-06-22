;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { basicDataTransform2 } = require('../lib/utils');

  module.exports.object = new DAO('bureau/responses/overview', {
    get: function(login) {
      return {
        uri: urljoin(this.resource, login),
        transform: basicDataTransform2,
      }
    }
  });
})();
