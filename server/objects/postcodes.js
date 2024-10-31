(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.postCodesObject = new DAO('moj/pool-create/postcodes', {
    get: function(areaCode, isCoronersPool = false) {
      return {
        uri: `${this.resource}?areaCode=${areaCode}&isCoronersPool=${isCoronersPool}`
      }
    }
  });

})();
