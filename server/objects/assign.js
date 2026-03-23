;(function(){
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils')
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.object = new DAO('moj/staff/assign', {
    post: function(jurorNumber, assignTo, version) {
      return {
        uri: this.resource,
        body: replaceAllObjKeys({
          responseJurorNumber: jurorNumber,
          assignTo: (typeof assignTo === 'string' && assignTo.length > 0) ? assignTo : null,
          version: parseInt(version, 10)
        }, _.snakeCase),
        transform: basicDataTransform2
      }
    }
  });
})();
