const { DAO } = require('./dataAccessObject');

(function() {
  'use strict';

  module.exports.editPoolDAO = new DAO('moj/manage-pool/edit-pool', {
    put: function(body, owner) {
      const payload = {...body};

      (owner === '400')
        ? payload['noRequested'] = payload.noOfJurors
        : payload['totalRequired'] = payload.noOfJurors;

      delete payload._csrf;
      delete payload.noRequired;
      delete payload.noOfJurors;

      return { body: payload };
    }}
  );
})();
