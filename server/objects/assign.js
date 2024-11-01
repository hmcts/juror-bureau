;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils')

  module.exports.object = new DAO('moj/staff/assign', {
    post: function(jurorNumber, assignTo, version) {
      return {
        uri: this.resource,
        body: {
          responseJurorNumber: jurorNumber,
          assignTo: (typeof assignTo === 'string' && assignTo.length > 0) ? assignTo : null,
          version: parseInt(version, 10)
        },
        transform: basicDataTransform
      }
    }
  });
})();
