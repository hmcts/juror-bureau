
;(function(){
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils')
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.object = new DAO('bureau/allocate/replies', {
    get: function() {
      return {
        uri: this.resource,
        transform: basicDataTransform
      }
    },
    post: function(payload) {
      return {
        uri: 'bureau/backlogAllocate/replies',
        body: _.mapKeys(payload, (value, key) => _.snakeCase(key)),
        transform: basicDataTransform
      }
    }
  });
})();
