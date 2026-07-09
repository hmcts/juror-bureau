(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.postCodesObject = new DAO('moj/pool-create/postcodes', {
    get: function(areaCode, isCoronersPool = false) {
      return {
        uri: `${this.resource}?areaCode=${areaCode}&isCoronersPool=${isCoronersPool}`,
        transform: basicDataTransform,
      }
    }
  });

})();
