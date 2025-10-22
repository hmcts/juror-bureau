;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;
  const { basicDataTransform } = require('../lib/utils');

  module.exports.object = new DAO('bureau/juror/disqualify', {
    post: function(jurorNumber, version, code) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: {
          disqualifyCode: code,
          description: '',
          version: version,
        },
        transform: basicDataTransform,
      }
    }
  });
})();
