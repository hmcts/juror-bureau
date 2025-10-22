;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;
  const { basicDataTransform } = require('../lib/utils');

  module.exports.object = new DAO('bureau/juror/tocourt', {
    post: function(jurorNumber, version) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: {
          jurorId: jurorNumber,
          version: version
        },
        transform: basicDataTransform,
      }
    }
  });
})();
