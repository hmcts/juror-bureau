
;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join')
  const { basicDataTransform } = require('../lib/utils');

  module.exports.object = new DAO('bureau/juror/excuse', {
    get: function() {
      return {
        uri: this.resource,
        transform: basicDataTransform,
      };
    },
    post: function(jurorNumber, version, excusalCode, reject = false) {
      return {
        uri: urljoin(this.resource, reject ? 'reject' : null, jurorNumber),
        body: {
          description: '',
          excusalCode: excusalCode,
          version: version,
        },
        transform: basicDataTransform,
      };
    }
  });
})();
