;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils')

  module.exports.object = new DAO('bureau/staff/assignments-multi', {
    post: function(jurorNumbers) {
      return {
        uri: this.resource,
        body: {
          jurorNumbers,
        },
        transform: basicDataTransform
      }
    }
  });
})();
