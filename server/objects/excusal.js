
;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils');

  module.exports.object = new DAO('bureau/juror/excuse', {
    get: function() {
      return {
        uri: this.resource,
        transform: basicDataTransform2,
      };
    }
  });
})();
