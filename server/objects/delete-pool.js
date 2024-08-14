;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.deletePoolObject = new DAO('moj/manage-pool/delete', {
    delete: function(poolNumber) {
      return {
        uri: this.resource + `?poolNumber=${poolNumber}`,
      };
    },
  });

})();
