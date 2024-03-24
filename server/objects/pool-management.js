(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.deferralsDAO = new DAO('moj/deferral-maintenance/deferrals', {
    get: function(locationCode) {
      const uri = urljoin(this.resource, locationCode.toString());

      return { uri };
    }}
  );

  module.exports.allocateJurorsDAO = new DAO('moj/deferral-maintenance/deferrals/allocate-jurors-to-pool', {
    post: function(jurors, poolNumber) {
      const body = {
        poolNumber: poolNumber,
        jurors: jurors, // jurors needs to be an array
      };

      return { body };
    }}
  );

  const processAvailablePools = function(locationCode, deferralDates) {
    const uri = urljoin(this.resource, locationCode);

    if (deferralDates) {
      return { uri, body: { deferralDates } };
    }

    return { uri };
  };

  module.exports.availableDeferralPoolsDAO = new DAO('moj/deferral-maintenance/available-pools', {
    get: processAvailablePools.bind(this),
    post: processAvailablePools.bind(this),
  });

  module.exports.availableReassignPoolsDAO = new DAO('moj/manage-pool/available-pools', {
    get: processAvailablePools.bind(this),
  });

  module.exports.reassignJurorDAO = new DAO('moj/manage-pool/reassign-jurors');

  module.exports.validateMovementDAO = new DAO('moj/manage-pool/movement/validation');
})();
