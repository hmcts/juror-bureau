;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils')

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
        body: payload,
        transform: basicDataTransform
      }
    }
  });
})();
