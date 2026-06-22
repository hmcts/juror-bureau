(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils');

  module.exports.editNoRequested = new DAO('moj/manage-pool/edit-pool', {
    put: function(body, owner) {
      (owner === '400')
          ? body['noRequested'] = body.noOfJurors
          : body['totalRequired'] = body.noOfJurors

      return {
        uri: this.resource,
        transform: basicDataTransform2,
        body,
      }
    }
  });

})();
